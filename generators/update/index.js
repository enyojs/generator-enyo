'use strict';
var fs = require('fs');
var path = require('path');
var yeoman = require('yeoman-generator');
var yosay = require('yosay');
var bootplate = require('../../common/bootplate-utils.js');
var chalk = require('chalk');

var EnyoGenerator = yeoman.generators.NamedBase.extend({
	constructor: function () {
		this.cwd = process.cwd();
		try {
			yeoman.generators.Base.apply(this, arguments);
			this.argument("path", {
				desc:"Path to bootplate",
				type: String,
				required: false
			});
			this.option("build", {
				alias: "b",
				desc: "Version of enyo and first-party libraries to use (eg: --build=2.5.1.1)",
				type: String
			});
			this.option("latest", {
				alias: "l",
				desc: "Use the latest version of enyo and first-party libraries",
				type: Boolean
			});
		} catch(e) {
			this.log(chalk.red(e));
			process.exit(1);
		}
	},

	initializing: function() {
		process.chdir(this.cwd);
		var valStrOpt = function(arg) {
			if(arg && typeof arg==="string") {
				return arg;
			} else {
				return undefined;
			}
		};
		this.param = {
			path: this._findBootplate(valStrOpt(this.path)),
			version: valStrOpt(this.options["build"]) || valStrOpt(this.options["b"]),
			latest: this.options["latest"] || this.options["l"]
		};
		if(this.param.version==="latest" || this.param.version==="edge"
				 || this.param.version==="nightly") {
			//resolve keywords to latest boolean
			this.param.latest = true;
		}
	},

	_findBootplate: function(dir) {
		var dir = dir || process.cwd();
		// 2-level deep search to detect an Enyo bootplate
		var ENYO_DIR = "enyo";
		var result;
		if(fs.existsSync(path.join(dir, ENYO_DIR))) {
			result = dir || ".";
		} else {
			try {
				var files = fs.readdirSync(dir);
				for(var i=0; i<files.length; i++) {
					if(fs.existsSync(path.join(dir, files[i], ENYO_DIR))) {
						result = files[i];
						break;
					}
				}
			} catch(e) {

			}
		}
		return result;
	},

	writing: function() {
		if(this.options["list"]) {
			var libs = bootplate.listLibs(this.param.config);
			this.log("Libraries available by name:");
			for(var i=0; i<libs.length; i++) {
				this.log("    " + chalk.cyan(libs[i]));
			}
		} else {
			var log = this.log;
			var done = this.async();
			bootplate.update(this.param, function(err, tag) {
				log(" ");
				if(err) {
					if(err.message) {
						log(err.message + "\n");
					}
					log(chalk.red("Error: Bootplate update failed."));
				} else {
					log(chalk.green("Bootplate updated to " + (tag.replace("#", "") || "the latest version")
							+ " successfully"));
				}
				done();
			});
		}
		
	}
});

module.exports = EnyoGenerator;
