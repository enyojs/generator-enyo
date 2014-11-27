/*
 * libmgr.js
 * 
 * Manages the enyo-side of libraries, updating package.js and deploy.json as needed
 */

var DEPLOY_FILE = "deploy.json",
	PKGJS_FILE = "source/package.js",
	UTF8 = "utf8",
	fs = require("fs"),
	os = require("os"),
	vm = require("vm");

function readConfigFiles(callback) {
	if(fs.existsSync(PKGJS_FILE)) {
		var context = {
			enyo: {
				depends: function() {
					return Array.prototype.slice.call(arguments, 0);
				}
			}
		};
		fs.readFile(PKGJS_FILE, {encoding: UTF8}, function(err1, jsTxt) {
			if(err1) {
				callback(err1);
			} else {
				var depends = vm.runInNewContext(jsTxt, context, PKGJS_FILE);
				if(fs.existsSync(DEPLOY_FILE)) {
					fs.readFile("deploy.json", {encoding: UTF8}, function(err2, data) {
						if(err2) {
							callback(err2, depends);
						} else {
							try {
								var deploy = JSON.parse(data);
								callback(undefined, depends, deploy);
							} catch(e) {
								callback(e, depends);
							}
						}
					});
				} else {
					callback(undefined, depends);
				}
			}
		});
	} else {
		callback(new Error("Unable to locate package.js file"));
	}
}

function writeConfigFiles(depends, deploy, callback) {
	var jsTxt = "enyo.depends(" + os.EOL;
	for(var i=0; i<depends.length; i++) {
		jsTxt += "\t\"" + depends[i];
		if(i!==depends.length-1) {
			jsTxt += "\"," + os.EOL;
		} else {
			jsTxt += "\"" + os.EOL;
		}		
	}
	jsTxt += ")" + os.EOL;
	fs.writeFile(PKGJS_FILE, jsTxt, function(err1) {
		if(err1) {
			callback(err1);
		} else {
			if(deploy && fs.existsSync(DEPLOY_FILE)) {
				var deployTxt = JSON.stringify(deploy, null, "\t");
				fs.writeFile(DEPLOY_FILE, deployTxt, callback);
			} else {
				callback();
			}
		}
	});
}

function updateConfigFiles(manipulator, callback) {
	readConfigFiles(function(err, depends, deploy) {
		if(err) {
			callback(err)
		} else {
			depends = manipulator("$lib/", depends);
			if(deploy) {
				deploy.libs = deploy.libs || [];
				deploy.libs = manipulator("./lib/", deploy.libs);
			}
			writeConfigFiles(depends, deploy, callback);
		}
	});
}

function indexOfLib(arrayObj, name) {
	var i = arrayObj.indexOf("lib/" + name);
	if(i<0) i = arrayObj.indexOf("./lib/" + name);
	if(i<0) i = arrayObj.indexOf("$lib/" + name);
	return i;
}

function lastLibIndex(arrayObj) {
	for(var i=arrayObj.length-1; i>=0; i--) {
		if(arrayObj[i].indexOf("lib/")===0 || arrayObj[i].indexOf("./lib/")===0
				|| arrayObj[i].indexOf("$lib/")===0) {
			return i;
		}
	}
	return -1;
}

module.exports = {
	initialize: function(names, callback) {
		updateConfigFiles(function(prefix, config) {
			for(var i=names.length-1; i>=0; i--) {
				if(indexOfLib(config, names[i])<0) {
					config.unshift(prefix + names[i]);
				}
			}
			return config;
		}, callback);
	},
	addLib: function(name, callback) {
		updateConfigFiles(function(prefix, config) {
			if(indexOfLib(config, name)<0) {
				config.splice(lastLibIndex(config)+1, 0, prefix + name);
			}
			return config;
		}, callback);
	},
	removeLib: function(name, callback) {
		updateConfigFiles(function(prefix, config) {
			var index = indexOfLib(config, name);
			if(index>=0) {
				config.splice(index, 1);
			}
			return config;
		}, callback);
	}
};
