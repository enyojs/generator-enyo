'use strict';
var util = require('util');
var path = require('path');
var yeoman = require('yeoman-generator');
var chalk = require('chalk');


var EnyoGenerator = module.exports = function EnyoGenerator(args, options) {
	yeoman.generators.Base.apply(this, arguments);
	this.argument("appdir", { type: String, required: false });
	this.appdir = this.appdir || ".";
	this.option("bootplate", {
		desc: "Use a specific version of Enyo and libraries for the bootplate",
		type: String,
		required: "false",
		default:"*"
	});
	this.bootplate = options["bootplate"] || options["b"] || "*";
	if(this.bootplate===true) {
		this.bootplate = "*";
	}
	/*this.hookFor('enyo:webOS', {
		args: args
	});*/
	this.on("end", function () {
		this.installDependencies({
			skipInstall: this.options["skip-install"],
			npm: false
		});
	});
};

util.inherits(EnyoGenerator, yeoman.generators.Base);

EnyoGenerator.prototype.welcome = function() {
	var msg = "Generating " + chalk.cyan("Enyo Bootplate");
	if(this.bootplate!=="*") {
		msg += " v" + chalk.cyan(this.bootplate)
	}
	msg += "...";
	this.log.writeln(msg);
}

EnyoGenerator.prototype.bootplateFiles = function() {
	var files = this.expandFiles('**/*', {cwd: this.sourceRoot(), dot: true});
	var filter = [
		"_bower.json",
		"_bowerrc"
	];
	files.forEach(function(file) {
		if(filter.indexOf(file)<0) {
			this.copy(file, this.appdir + "/" + file);
		}
	}, this);
};

EnyoGenerator.prototype.bowerFiles = function() {
	this.template("_bower.json", this.appdir + "/" + "bower.json");
	this.copy("_bowerrc", this.appdir + "/" + ".bowerrc");
};
