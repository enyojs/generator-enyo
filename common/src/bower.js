/*
 * bower.js
 *
 * Bower-related utilities; all require the cwd to be the root bower project path
 */

var exec = require("./simplified-exec.js"),
	fs = require('fs');

module.exports = {
	initialize: function(depends, callback) {
		var data = {
			name: "enyo-bootplate-project",
			version: "1.0.0",
			dependencies: {}
		};
		for(var i=0; i<depends.length; i++) {
			data.dependencies[depends[i].name] = depends[i].component;
		}
		fs.writeFile("bower.json", JSON.stringify(data, null, "\t"), function(wErr) {
			if(wErr) {
				callback(wErr);
			} else {
				exec.npm("bower", ["install"], "inherit", callback);
			}
		});
	},
	install: function(component, name, callback) {
		return exec.npm("bower", ["install", name + "=" + component, "--save"], "inherit", callback);
	},
	installNoSave: function(component, name, stdio, callback) {
		return exec.npm("bower", ["install", name + "=" + component], stdio, callback);
	},
	uninstall: function(name, callback) {
		return exec.npm("bower", ["uninstall", name, "--save"], "inherit", callback);
	},
	updateTo: function(versionTag, filter, callback) {
		fs.readFile("bower.json", {encoding:"utf8"}, function(rErr, dataText) {
			if(rErr) {
				callback(rErr);
			} else {
				var data = JSON.parse(dataText);
				data.dependencies = data.dependencies || {};
				var names = Object.keys(data.dependencies);
				for(var i=0; i<names.length; i++) {
					var curr = data.dependencies[names[i]];
					var index = curr.indexOf("#");
					if(index>=0) {
						curr = curr.substring(0, index);
					}
					if(!filter || filter(names[i], curr)) {
						data.dependencies[names[i]] = curr + versionTag;
					}
				}
				fs.writeFile("bower.json", JSON.stringify(data, null, "\t"), function(wErr) {
					if(wErr) {
						callback(wErr);
					} else {
						exec.npm("bower", ["install"], "inherit", callback);
					}
				});
			}
		});
		
	},
	bowerrc: function(dir, callback) {
		var data = {"directory": (dir || "lib")};
		fs.writeFile(".bowerrc", JSON.stringify(data, null, "\t"), callback);
	}
};
