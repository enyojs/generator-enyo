'use strict';
var path = require('path');
var fs = require('fs');
var yeoman = require('yeoman-generator');
var bootplate = require('../../common/bootplate-utils.js');
var chalk = require('chalk');

var EnyoGenerator = yeoman.generators.Base.extend({
	constructor: function () {
		this.cwd = process.cwd();
		try {
			yeoman.generators.Base.apply(this, arguments);
			this.argument("path", {
				desc:"Project directory (current directory if none specified)",
				type: String,
				required: false,
				optional: true,
				defaults: "."
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

	writing: {
		deploy: function () {
			process.chdir(this.cwd);
			var dir = this._findBootplate(this.path);
			if(dir) {
				bootplate.deploy({path:dir}, this.async());
			} else {
				this.log(chalk.red("Error: Not an Enyo bootplate: " + path.resolve(this.path)));
			}
		}
	}
});

module.exports = EnyoGenerator;
