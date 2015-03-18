'use strict';
var path = require('path');
var fs = require('fs');
var yeoman = require('yeoman-generator');
var chalk = require('chalk');

var EnyoGenerator = yeoman.generators.Base.extend({
	constructor: function () {
		try {
			yeoman.generators.Base.apply(this, arguments);
			this.argument("app_id", {
				desc:"Application ID",
				type: String,
				required: false,
				optional: true,
				defaults: "com.yourdomain.app"
			});
			this.argument("app_name", {
				desc:"Name of the application",
				type: String,
				required: false,
				optional: true,
				defaults: "Enyo Bootplate App"
			});
			this.argument("app_version", {
				desc:"Version of the application",
				type: String,
				required: false,
				optional: true,
				defaults: "0.0.1"
			});
			this.argument("app_vendor", {
				desc:"Vendor/author of the application",
				type: String,
				required: false,
				optional: true,
				defaults: "My Company"
			});
		} catch(e) {
			this.log(chalk.red(e));
			process.exit(-1);
		}
	},
	
	_findBootplate: function(dir) {
		var dir = dir || process.cwd();
		// 2-level deep search to detect an Enyo bootplate
		var ENYO_DIR = "lib/enyo";
		var OLD_ENYO_DIR = "enyo";
		var result;
		if(fs.existsSync(path.join(dir, ENYO_DIR)) || fs.existsSync(path.join(dir, OLD_ENYO_DIR))) {
			result = dir || ".";
		} else {
			try {
				var files = fs.readdirSync(dir);
				for(var i=0; i<files.length; i++) {
					if(fs.existsSync(path.join(dir, files[i], ENYO_DIR))
							|| fs.existsSync(path.join(dir, files[i], OLD_ENYO_DIR))) {
						result = files[i];
						break;
					}
				}
			} catch(e) {

			}
		}
		return result;
	},

	_updateDeploy: function() {
		var dir = this._findBootplate();
		var deployFile = path.join(dir, "deploy.json");
		var components = ["appinfo.json", "largeIcon.png"];
		
		if(fs.existsSync(deployFile)) {
			try {
				var deploy = JSON.parse(fs.readFileSync(deployFile));
				deploy.assets = deploy.assets || [];
				for(var i=0; i<components.length; i++) {
					if(deploy.assets.indexOf(components[i])<0
							&& deploy.assets.indexOf("./" + components[i])<0) {
						deploy.assets.push("./" + components[i]);
					}
				}
				fs.writeFileSync(deployFile, JSON.stringify(deploy, null, '\t'));
				this.log("  " + chalk.green("updated") + " " + deployFile);
			} catch(e) {
				this.log(chalk.red("Unable to update deploy.json"));
			}
		}
	},

	writing: {
		webos: function() {
			var dir = this._findBootplate();
			if(dir) {
				this.src.copy('largeIcon.png', path.join(dir, 'largeIcon.png'));
				this.template("appinfo.json", path.join(dir, 'appinfo.json'), {
					id:this.app_id,
					name:this.app_name,
					ver:this.app_version,
					auth:this.app_vendor
				});
				this._updateDeploy();
			} else {
				this.log(chalk.red("Error: Not an Enyo bootplate: " + path.resolve(process.cwd())));
			}
		}
	}
});

module.exports = EnyoGenerator;
