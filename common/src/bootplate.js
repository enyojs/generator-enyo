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
	BASE_DIR = "base",
	ENYO_DIR = "enyo",
	UTF8 = "utf8",
	CONFIG = JSON.parse(fs.readFileSync(path.join(__dirname, "../bootplate.json"), {encoding:"utf8"}));

function baseSetup(dir, bpGit, enyo, tag, callback) {
	bower.bowerrc(".", function(err) {
		if(err) {
			callback(err);
		} else {
			var custStdio = [process.stdin, null, process.stderr];
			var base = bower.installNoSave(bpGit + tag, BASE_DIR, custStdio, function(err2) {
				if(err2) {
					console.error("Unable to setup base bootplate code.");
					callback(err2);
				} else {
					shell.cp("-fr", BASE_DIR + "/*", ".");
					shell.rm("-fr", path.join(BASE_DIR));
					shell.rm("-f", path.join(".bower.json"));
					bower.installNoSave(enyo + tag, ENYO_DIR, "inherit", function(err3) {
						if(err3) {
							console.error("Unable to setup enyo core framework.");
							callback(err3);
						} else {
							bower.bowerrc(LIB_DIR, callback);
						}
					});
				}
			});
			base.stdout.setEncoding(UTF8);
			base.stdout.on("data", function (data) {
				data = data.replace(/base/g, "");
				process.stdout.write(data, UTF8);
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

module.exports = {	
	create: function(opts, callback) {
		opts.path = opts.path || process.cwd();
		var conf = mixin(CONFIG, opts.config || {});
		opts.mode = opts.mode || conf.defaultMode;
		var cwd = process.cwd();
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
			if(conf.repos[opts.name]) {
				opts.remote = conf.repos[opts.name];
				if(!CONFIG.repos[opts.name]) {
					opts.latest = true;
				}
			} else {
				callback(new Error(opts.name + " unable be resolved"));
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
		for(var i=0; i<repos.length; i++) {
			if(repos[i].indexOf("bootplate-")===0) {
				repos.splice(i, 1);
				i--;
			}
		}
		return repos;
	},
	deploy: function(opts, callback) {
		if(!opts) opts = {};
		opts.path = opts.path || process.cwd();
		process.chdir(opts.path);
		exec.script(DEPLOY_SCRIPT, "inherit", callback);
	}
};
