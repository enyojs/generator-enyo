/*
 * bootplate.js
 *
 * Build and manipulate preset/custom configurations of Enyo bootplate
 */

var fs = require('fs'),
	path = require('path'),
	shell = require('shelljs'),
	vm = require('vm'),
	os = require('os'),
	mixin = require("./mixin.js"),
	bower = require('./bower.js'),
	libmgr = require('./libmgr.js'),
	exec = require("./simplified-exec.js");

var ONYX = "onyx",
	MOONSTONE = "moonstone",
	SUNSTONE = "sunstone",
	GARNET = "garnet",
	SAMPLER = "sampler",
	DEPLOY_SCRIPT = "tools" + path.sep + "deploy",
	LIB_DIR = "lib",
	BASE_DIR = "bootplate",
	ENYO_DIR = "enyo",
	UTF8 = "utf8",
	CONFIG = JSON.parse(fs.readFileSync(path.join(__dirname, "../bootplate.json"), {encoding:"utf8"}));

function baseSetup(dir, bpGit, enyo, tag, callback) {
	bower.bowerrc(".", function(err) {
		if(err) {
			callback(err);
		} else {
			bower.installNoSave(bpGit + tag, BASE_DIR, "inherit", function(err2) {
				if(err2) {
					console.error("Unable to setup base bootplate code.");
					callback(err2);
				} else {
					shell.cp("-fr", BASE_DIR + "/*", ".");
					shell.rm("-fr", BASE_DIR);
					shell.rm("-f", ".bower.json");
					if(fs.existsSync("README-CORDOVA-WEBOS.md")) {
						shell.rm("-f", path.join("README-CORDOVA-WEBOS.md"));
					}
					var installEnyo = function() {
						bower.installNoSave(enyo + tag, ENYO_DIR, "inherit", function(err3) {
							if(err3) {
								console.error("Unable to setup enyo core framework.");
								callback(err3);
							} else {
								bower.bowerrc(LIB_DIR, callback);
							}
						});
					}
					if(fs.existsSync("package.json")) {
						exec.npm_install("inherit", function(err3) {
							if(err3) {
								console.warn("Unable to npm install dependencies; try running the command yourself")
							}
							console.log(" ");
							installEnyo()
						});
					} else {
						installEnyo();
					}
				}
			});
		}
	})
}

function resolveTag(version, defVersion, latest) {
	var tag = "";
	if(version) {
		tag = "#" + version;
	} else if(defVersion && !latest) {
		tag = "#" + defVersion;
	}
	return tag;
}

function enyoVersion(callback) {
	var enyoBowerJSON = path.join("enyo/.bower.json");
	if(fs.existsSync(enyoBowerJSON)) {
		fs.readFile(enyoBowerJSON, {encoding:"utf8"}, function(err, data) {
			try {
				var obj = JSON.parse(data || {});
				callback(obj.version);
			} catch(e) {
				callback();
			}
		});
	} else {
		callback();
	}
}

function updateEnyo(tag, callback) {
	bower.bowerrc(".", function(err) {
		if(!err) {
			bower.initialize([{name:ENYO_DIR, component:CONFIG.enyo + tag}], function(err2) {
				if(err2) {
					// revert to "lib" bower location on a failed updated
					bower.bowerrc(LIB_DIR, function(err3) {
						callback(err2);
					});
				} else {
					bower.bowerrc(LIB_DIR, callback);
				}
			});
		} else {
			callback(err);
		}
	});
}

function bootplateType() {
	var TYPES = [ONYX, MOONSTONE, SUNSTONE, GARNET];
	for(var i=0; i<TYPES.length; i++) {
		if(fs.existsSync(path.join(LIB_DIR, TYPES[i]))) {
			return TYPES[i];
		}
	}
	return ONYX;
}

function updateBootplate(repo, callback) {
	bower.bowerrc(".", function(err) {
		if(!err) {
			bower.installNoSave(repo, BASE_DIR, "inherit", function(err2) {
				if(err2) {
					// revert to "lib" bower location on a failed updated
					bower.bowerrc(LIB_DIR, function(err3) {
						callback(err2);
					});
				} else {
					var updatable = [
						{name:"tools", path: BASE_DIR + "/tools/*", dest:"tools", overwrite:true},
						{name:"tasks", path: BASE_DIR + "/tasks/*", dest:"tasks", overwrite:true},
						{name:"gruntfile.js", path: BASE_DIR + "/gruntfile.js", dest:"."},
						{name:"package.json", path: BASE_DIR + "/package.json", dest:"."}
					];
					updatable.forEach(function(entry, index) {
						if(fs.existsSync(path.join(BASE_DIR, entry.name))) {
							if(!fs.existsSync(entry.name) || entry.overwrite) {
								shell.cp("-fr", entry.path, entry.dest);
							}
						} else {
							shell.rm("-fr", entry.name);
						}
					});
					shell.rm("-fr", BASE_DIR);
					if(fs.existsSync("package.json")) {
						exec.npm_install("inherit", function(err3) {
							if(err3) {
								console.warn("Unable to npm install dependencies; try running the command yourself")
							}
							bower.bowerrc(LIB_DIR, callback);
						});
					} else {
						if(fs.existsSync("node_modules")) {
							shell.rm("-fr", "node_modules");
						}
						bower.bowerrc(LIB_DIR, callback);
					}
				}
			});
		} else {
			callback(err);
		}
	});
}

module.exports = {	
	create: function(opts, callback) {
		opts.path = opts.path || process.cwd();
		var conf = mixin(CONFIG, opts.config || {});
		opts.mode = opts.mode || conf.defaultMode;
		var cwd = process.cwd();
		if(opts.mode && conf.repos["bootplate-" + opts.mode]
				&& (opts.mode==GARNET || opts.mode==SUNSTONE) && !opts.version) {
			opts.latest = true;
		}
		var tag = resolveTag(opts.version, conf.defaultVersion, opts.latest);
		shell.mkdir("-p", path.join(opts.path, LIB_DIR));
		process.chdir(opts.path);		
		var base = conf.repos["bootplate-" + opts.mode] || conf.repos["bootplate-" + conf.defaultMode];
		if(!fs.existsSync(ENYO_DIR)) {
			baseSetup(opts.path, base, conf.enyo, tag, function(err) {
				if(err) {
					callback(err);
				} else {
					var depends = [];
					if(conf.modes[opts.mode]) {
						for(var i=0; i<conf.modes[opts.mode].length; i++) {	
							var name = conf.modes[opts.mode][i];
							if(conf.repos[name]) {
								depends.push({name: name, component: conf.repos[name] + tag});
							}
						}
					}
					bower.initialize(depends, function(err2) {
						if(err2) {
							console.error("Unable to setup bootplate libraries.")
							callback(err2);
						} else {
							libmgr.initialize(conf.modes[opts.mode] || [], function(err3) {
								process.chdir(cwd);
								callback(err3, opts);
							});
						}
					});
				}
			});
		} else {
			callback(new Error("Bootplate project already exists at " + opts.path));
		}
	},
	addLib: function(opts, callback) {
		opts.path = opts.path || process.cwd();
		var conf = mixin(CONFIG, opts.config || {});
		process.chdir(opts.path);
		if(!opts.remote) {
			if(conf.repos[opts.name] || conf.repos["enyo-" + opts.name]) {
				opts.remote = conf.repos[opts.name] || conf.repos["enyo-" + opts.name];
				if(!(CONFIG.repos[opts.name] || CONFIG.repos["enyo-" + opts.name])) {
					opts.latest = true;
				}
			} else {
				callback(new Error(opts.name + " unable be resolved"));
				return;
			}
		} else {
			opts.latest = true;
		}
		enyoVersion(function(version) {
			var tag = resolveTag(opts.version, version, opts.latest);
			bower.install(opts.remote + tag, opts.name, function(err) {
				if(err) {
					callback(err);
				} else {
					libmgr.addLib(opts.name, callback);
				}
			});
		});
	},
	removeLib: function(opts, callback) {
		opts.path = opts.path || process.cwd();
		process.chdir(opts.path);
		if(!fs.existsSync(path.join(LIB_DIR, opts.name))
				&& fs.existsSync(path.join(LIB_DIR, "enyo-" + opts.name))) {
			opts.name = "enyo-" + opts.name;
		}
		bower.uninstall(opts.name, function(err) {
			if(err) {
				callback(err);
			} else {
				libmgr.removeLib(opts.name, callback);
			}
		});
	},
	listLibs: function(custConfig) {
		var conf = mixin(CONFIG, custConfig || {});
		var repos = Object.keys(conf.repos);
		var ignored = ["garnet", "sunstone"];
		for(var i=0; i<repos.length; i++) {
			if(repos[i].indexOf("bootplate-")===0 || ignored.indexOf(repos[i])>-1) {
				repos.splice(i, 1);
				i--;
			}
		}
		return repos;
	},
	update: function(opts, callback) {
		opts.path = opts.path || process.cwd();
		var conf = mixin(CONFIG, opts.config || {});
		process.chdir(opts.path);
		var mode = bootplateType();
		if(conf.repos["bootplate-" + opts.mode] && (mode==GARNET || mode==SUNSTONE)
				&& !opts.version) {
			opts.latest = true;
		}
		var tag = resolveTag(opts.version, conf.defaultVersion, opts.latest);
		if(fs.existsSync("bower.json")) {
			shell.mv("-f", "bower.json", "bower.json.bak");
			updateBootplate(conf.repos["bootplate-" + mode] + tag, function(err) {
				if(!err) {
					updateEnyo(tag, function(err2) {
						shell.mv("-f", "bower.json.bak", "bower.json");
						if(!err2) {
							bower.updateTo(tag, function(name, component) {
								return (CONFIG.repos[name] && CONFIG.repos[name]===component);
							}, function(err3) {
								callback(err3, tag);
							});
						} else {
							callback(err2, tag);
						}
					});
				} else {
					shell.mv("-f", "bower.json.bak", "bower.json");
					callback(err, tag);
				}
				
			});
		} else {
			console.error("Bower.json is missing. What happened to bower.json? :(");
			callback(new Error("Unable to read current dependencies."), tag);
		}
	},
	deploy: function(opts, callback) {
		if(!opts) opts = {};
		opts.path = opts.path || process.cwd();
		process.chdir(opts.path);
		exec.script(DEPLOY_SCRIPT, "inherit", callback);
	}
};
