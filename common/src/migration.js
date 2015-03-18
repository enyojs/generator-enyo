/*
 * migration.js
 *
 * Migrates the enyo framework directory between /enyo and /lib/enyo depending on version.
 */

var path = require("path"),
	fs = require("fs"),
	shell = require("shelljs");

function isLibBased(version, latest) {
	if(latest) {
		return true;
	} else {
		var minimum = [2,6,0];
		var keys = version.split(".");
		for(var i=0; i<keys.length && i<minimum.length; i++) {
			var tag = keys[i].indexOf("-");
			if(tag>-1) {
				keys[i] = keys[i].substring(0, tag);
			}
			try {
				var value = parseInt(keys[i]);
				if(value>minimum[i]) {
					return true;
				} else if(value<minimum[i]) {
					return false;
				}
			} catch(e) {
				return false;
			}
		}
	}
	
	return keys.length>=minimum.length;
}

function enyoPath(libBased) {
	return libBased ? "lib/enyo" : "enyo";
}

function oldPath(enyo) {
	return enyo==="lib/enyo" ? "enyo" : "lib/enyo";
}

function updateDeploy(enyo) {
	if(fs.existsSync("deploy.json")) {
		var data = fs.readFileSync("deploy.json", {encoding:"utf8"});
		data = JSON.parse(data);
		data.enyo = "./" + enyo;
		data = JSON.stringify(data, null, "\t");
		fs.writeFileSync("deploy.json", data);
	}
}

function updateBower(repo) {
	if(fs.existsSync("bower.json")) {
		var data = fs.readFileSync("bower.json", {encoding:"utf8"});
		data = JSON.parse(data);
		data.dependencies = data.dependencies || {};
		if(repo) {
			data.dependencies.enyo = repo;
		} else {
			delete data.dependencies.enyo;
		}		
		data = JSON.stringify(data, null, "\t");
		fs.writeFileSync("bower.json", data);
	}
}

function updateHTML(enyo, old) {
	shell.sed("-i", "\"" + old + "/tools/less.js", "\"" + enyo + "/tools/less.js", "debug.html");
	shell.sed("-i", "\"" + old + "/enyo.js", "\"" + enyo + "/enyo.js", "debug.html");
}

function updateScripts(enyo, old) {
	var bat = path.join("tools", "deploy.bat");
	shell.sed("-i", "%SRC%\\" + old.replace("/", "\\"), "%SRC%\\" + enyo.replace("/", "\\"), bat);
	var sh = path.join("tools", "deploy.sh");
	shell.sed("-i", "$SRC/" + old, "$SRC/" + enyo, sh);
}

module.exports = {
	libBased: isLibBased,
	migrate: function(libBased, repo) {
		var enyo = enyoPath(libBased);
		var old = oldPath(enyo);
		if(!fs.existsSync(enyo) && fs.existsSync(old)) {
			shell.mv("-f", old, enyo);
		}
		if(fs.existsSync(old)) {
			shell.rm("-fr", old);
		}
		updateDeploy(enyo);
		updateBower((enyo==="lib/enyo" ? repo : undefined));
		updateHTML(enyo, old);
		updateScripts(enyo, old)
	}
};
