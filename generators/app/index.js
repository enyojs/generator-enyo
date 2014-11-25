'use strict';
var fs = require('fs');
var path = require('path');
var yeoman = require('yeoman-generator');
var yosay = require('yosay');
var bootplate = require('../../common/bootplate-utils.js');
var chalk = require('chalk');

var EnyoGenerator = yeoman.generators.Base.extend({
	constructor: function () {
		this.cwd = process.cwd();
		try {
			yeoman.generators.Base.apply(this, arguments);
			this.options.namespace = "enyo";
			this.argument("path", {
				desc:"Project directory",
				type: String,
				required: true
			});
			this.option("mode", {
				alias: "m",
				desc: "Configuration mode of bootplate (onyx, moonstone, sunstone, garnet, or sampler)",
				type: String
			});
			this.option("bootplate", {
				alias: "b",
				desc: "Specify version of bootplate and libraries to use",
				type: String
			});
			this.option("latest", {
				alias: "l",
				desc: "Use the latest version of bootplate and libraries",
				type: Boolean
			});
			this.option("cordova", {
				desc: "Encapsulate bootplate within a Cordova project layer",
				type: Boolean
			});
			this.option("config", {
				alias: "c",
				desc: "Specify a JSON file which adds to or overrides build settings",
				type: String
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
			path: this.path,
			mode: valStrOpt(this.options["mode"]) || valStrOpt(this.options["m"]),
			version: valStrOpt(this.options["bootplate"]) || valStrOpt(this.options["b"]),
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
				this.param.config = obj;
			} catch(e) {
				this.log(chalk.red("Unable to read/parse config JSON."));
				process.exit(2);
			}
		}
		this.action = "create";
		if(this.options["cordova"]) {
			this.action = "cordova";
		}
	},

	welcome: function() {
		// Have Yeoman greet the user.
		this.log(yosay(
			'Welcome to the Enyo bootplate generator!'
		));
	},

	writing: function() {
		var log = this.log;
		var done = this.async();
		bootplate[this.action](this.param, function(err, opts) {
			log(" ");
			if(err) {
				if(err.message) {
					log(err.message + "\n");
				}
				log(chalk.red("Error: Bootplate generation failed."));
			} else {
				log(chalk.green("Bootplate generation completed successfully"));
				log("Project available at " + path.resolve(opts.project || opts.path));
			}
			done();
		});
	}
});

module.exports = EnyoGenerator;
