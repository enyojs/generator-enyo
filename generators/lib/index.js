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
			this.option("remove", {
				alias: "r",
				desc: "Removes the named library, rather than installing",
				type: Boolean
			});
			this.option("list", {
				desc: "List all available named libraries",
				type: Boolean
			});
			this.option("remote", {
				alias: "git",
				desc: "Specific git address or bower package to install the library from",
				type: String
			});
			this.option("library", {
				alias: "lib",
				desc: "Specify version of the library to use",
				type: String
			});
			this.option("latest", {
				alias: "l",
				desc: "Use the latest version of the library",
				type: Boolean
			});
			this.option("config", {
				alias: "c",
				desc: "Specify a JSON file which adds to or overrides settings",
				type: String
			});
			if(!this.options["list"]) {
				this.argument("library_name", {
					desc:"Name of the library to install",
					type: String,
					required: true
				});
			}
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
			path: this._findBootplate(),
			name: this.library_name,
			remote: valStrOpt(this.options["remote"]) || valStrOpt(this.options["git"]),
			version: valStrOpt(this.options["library"]) || valStrOpt(this.options["lib"]),
			latest: this.options["latest"] || this.options["l"]
		};
		if(this.param.version==="latest" || this.param.version==="edge" || this.param.version==="master"
				 || this.param.version==="nightly") {
			//resolve keywords to latest boolean
			this.param.latest = true;
		}
		var conf = valStrOpt(this.options["config"]) || valStrOpt(this.options["c"]);
		if(conf) {
			try {
				var txt = fs.readFileSync(conf, {encoding:"utf8"});
				var obj = JSON.parse(txt);
				param.config = obj;
			} catch(e) {
				this.log(chalk.red("Unable to read/parse config JSON."));
				process.exit(2);
			}
		}
		this.action = "addLib";
		if(this.options["remove"] || this.options["r"]) {
			this.action = "removeLib";
		}
	},

	_findBootplate: function() {
		var dir = process.cwd();
		// 2-level deep search to detect an Enyo bootplate
		var ENYO_DIR = "enyo";
		var result;
		if(fs.existsSync(path.join(dir, ENYO_DIR))) {
			result = ".";
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
			bootplate[this.action](this.param, function(err) {
				log(" ");
				if(err) {
					if(err.message) {
						log(err.message + "\n");
					}
					log(chalk.red("Error: Library action failed."));
				}
				done();
			});
		}
		
	}
});

module.exports = EnyoGenerator;
