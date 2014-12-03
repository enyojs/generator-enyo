/*
 * libmgr.js
 * 
 * Manages the enyo-side of libraries, updating package.js and deploy.json as needed
 */

var DEPLOY_FILE = "deploy.json",
	PKGJS_FILE = "source/package.js",
	UTF8 = "utf8",
	fs = require("fs"),
	path = require("path"),
	os = require("os"),
	vm = require("vm");

function readConfigFiles(pkgFile, deployfile, callback) {
	if(fs.existsSync(pkgFile)) {
		var context = {
			enyo: {
				depends: function() {
					return Array.prototype.slice.call(arguments, 0);
				}
			}
		};
		fs.readFile(pkgFile, {encoding: UTF8}, function(err1, jsTxt) {
			if(err1) {
				callback(err1);
			} else {
				var depends = vm.runInNewContext(jsTxt, context, pkgFile);
				if(fs.existsSync(deployfile)) {
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

function writeConfigFiles(pkgFile, deployfile, depends, deploy, callback) {
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
	fs.writeFile(pkgFile, jsTxt, function(err1) {
		if(err1) {
			callback(err1);
		} else {
			if(deploy) {
				var deployTxt = JSON.stringify(deploy, null, "\t");
				fs.writeFile(deployfile, deployTxt, callback);
			} else {
				callback();
			}
		}
	});
}

function updateConfigFiles(manipulator, callback) {
	readConfigFiles(PKGJS_FILE, DEPLOY_FILE, function(err, depends, deploy) {
		if(err) {
			callback(err)
		} else {
			manipulator("$lib/", depends, function(mDepends) {
				if(deploy) {
					deploy.libs = deploy.libs || [];
					manipulator("./lib/", deploy.libs, function(mDeployLibs) {
						deploy.libs = mDeployLibs;
						writeConfigFiles(PKGJS_FILE, DEPLOY_FILE, mDepends, deploy, callback);
					});
				} else {
					writeConfigFiles(PKGJS_FILE, DEPLOY_FILE, mDepends, deploy, callback);
				}
			});
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

function normalizeLib(library, callback) {
	var pkgFile = path.join("lib", library, "package.js");
	if(fs.existsSync(pkgFile)) {
		callback();
	} else {
		bowerMain(library, function(err, main) {
			if(main.length===0) {
				try {
					var files = fs.readdirSync(path.join("lib", library));
					files.forEach(function(f) {
						if(f.indexOf(".js")===f.length-3) {
							var stat = fs.statSync(path.join("lib", library, f));
							if(stat.isFile()) {
								main.push(path.join(library, f));
							}
						}
					});
				} catch(e) {
					console.warn("Unable to scan js files in " + library + " library");
				}
			}
			createLibDeploy(library, main, function(err2, deploy) {
				var deployFile = path.join("lib", library, "deploy.json");
				writeConfigFiles(pkgFile, deployFile, main, deploy, callback);
			});
		});
	}
}

function bowerMain(library, callback) {
	var libBower = path.join("lib", library, "bower.json");
	if(!fs.existsSync(libBower)) {
		libBower = path.join("lib", library, ".bower.json");
	}
	if(fs.existsSync(libBower)) {
		fs.readFile(libBower, {encoding:"utf8"}, function(err, data) {
			if(!err) {
				var result = [];
				try {
					var obj = JSON.parse(data);
					if(obj.main) {
						if(Array.isArray(obj.main)) {
							result = obj.main;
						} else {
							result = [obj.main];
						}
					}
				} catch(e) {
					console.warn("Warning: malformed bower.json file " + libBower);
				}
				callback(undefined, result);
			} else {
				callback(err, []);
			}
		});
	} else {
		callback(undefined, []);
	}
}

function createLibDeploy(library, ignored, callback) {
	var deployFile = path.join("lib", library, "deploy.json");
	var deploy = {
		packagejs: "./package.js",
		assets: [],
		libs: []
	};
	if(!fs.existsSync(deployFile)) {
		fs.readdir(path.join("lib", library), function(err, files) {
			if(err) {
				files = [];
			}
			files.forEach(function(f) {
				if(ignored.indexOf(f)<0 && f!=="bower.json"
						&& f!==".bower.json") {
					deploy.assets.push("./" + f);
				}
			});
			callback(err, deploy);
		});
	} else {
		callback(undefined, deploy);
	}
}


module.exports = {
	initialize: function(names, callback) {
		updateConfigFiles(function(prefix, config, next) {
			var processLibs = function() {
				if(names.length==0) {
					next(config);
				} else {
					var curr = names.pop();
					if(indexOfLib(config, curr)<0) {
						config.unshift(prefix + curr);
					}
					normalizeLib(curr, processLibs);
				}
			};
			processLibs();
		}, callback);
	},
	addLib: function(name, callback) {
		updateConfigFiles(function(prefix, config, next) {
			if(indexOfLib(config, name)<0) {
				config.splice(lastLibIndex(config)+1, 0, prefix + name);
			}
			normalizeLib(name, function(err) {
				next(config);
			});
		}, callback);
	},
	removeLib: function(name, callback) {
		updateConfigFiles(function(prefix, config, next) {
			var index = indexOfLib(config, name);
			if(index>=0) {
				config.splice(index, 1);
			}
			next(config);
		}, callback);
	}
};
