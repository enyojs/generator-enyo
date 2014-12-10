/*
 * cordova.js
 *
 * Build cordova projects containing a configuration of Enyo bootplate
 */

var path = require("path"),
	os = require("os"),
	fs = require("fs"),
	shell = require("shelljs"),
	bootplate = require("./bootplate.js"),
	exec = require("./simplified-exec.js");

var BOOTPLATE_DIR = "bootplate",
	SAMPLER_MODE = "sampler",
	SAMPLER_ICONS = ["ldpi.png", "mdpi.png", "hdpi.png", "xhdpi.png", "57.png", "72.png",
			"114.png", "128.png", "144.png"],
	SAMPLER_ICON_XML = path.join(__dirname, "../samplerIcons.xml"),
	BEFORE_PREPARE_HOOK = path.join(__dirname, "../hooks/enyo-deploy-hook.js"),
	AFTER_PREPARE_HOOK = path.join(__dirname, "../hooks/enyo-deploy-cleanup-hook.js");

function iconSetup(project, mode) {
	var key = "</widget>";
	var addition = "    <icon src=\"icon.png\" />\n    <icon src=\"icon.png\" width=\"128\" height=\"128\" />";
	if(mode===SAMPLER_MODE) {
		shell.mkdir("-p", path.join(project, "icons"));
		var map = [
			path.join(project, "www/projects/Android/res/drawable-ldpi/ic_launcher.png"),
			path.join(project, "www/projects/Android/res/drawable-mdpi/ic_launcher.png"),
			path.join(project, "www/projects/Android/res/drawable-hdpi/ic_launcher.png"),
			path.join(project, "www/projects/Android/res/drawable-xhdpi/ic_launcher.png"),
			path.join(project, "www/projects/iOS/icon_57.png"),
			path.join(project, "www/projects/iOS/icon_72.png"),
			path.join(project, "www/projects/iOS/icon_114.png"),
			path.join(project, "www/projects/webOS/icon.png"),
			path.join(project, "www/projects/iOS/icon_144.png")
		];
		for(var i=0; i<map.length; i++) {
			if(fs.existsSync(map[i])) {
				shell.mv("-f", map[i], path.join(project, "icons/" + SAMPLER_ICONS[i]));
			}
		}
		shell.rm("-fr", path.join(project, "www/projects"));
		try {
			var iconXml = fs.readFileSync(SAMPLER_ICON_XML, {encoding:"utf8"});
			addition = iconXml;
		} catch(e) {
			console.error("Error: Unable to import sampler icon configuration into config.xml");
		}
	} else {
		var defaultIcon = path.join(project, "www/icon.png");
		if(fs.existsSync(defaultIcon)) {
			shell.cp("-f", defaultIcon, path.join(project, "icon.png"));
		}
	}
	shell.sed("-i", key, addition + "\n" + key, path.join(project, "config.xml"));
}

function hookSetup(project) {
		console.log("Adding Enyo build hooks...");
		var before_prepare = path.join(project, "hooks/before_prepare");
		var after_prepare = path.join(project, "hooks/after_prepare");
		shell.mkdir("-p", before_prepare);
		shell.mkdir("-p", after_prepare);
		shell.cp("-f", BEFORE_PREPARE_HOOK, before_prepare);
		shell.cp("-f", AFTER_PREPARE_HOOK, after_prepare);
		shell.chmod(755, path.join(before_prepare, "enyo-deploy-hook.js"));
		shell.chmod(755, path.join(after_prepare, "enyo-deploy-cleanup-hook.js"));
	}

function injectScriptTag(htmlFile) {
	var key = "</head>";
	var addition = "\t<script type=\"text/javascript\" src=\"cordova.js\"></script>";
	shell.sed("-i", key, addition + os.EOL + "\t" + key, htmlFile);
}

module.exports = {
	create: function(opts, callback) {
		opts.project = opts.path;
		exec.npm("cordova", ["create", opts.project], "inherit", function(err) {
			if(err) {
				callback(err);
			} else {
				opts.path = path.join(opts.project, BOOTPLATE_DIR);
				bootplate.create(opts, function(err2, rOpts) {
					if(err2) {
						callback(err2);
					} else {
						try {
							console.log(" ");
							console.log("Symlinking bootplate to www...");
							var www = path.join(rOpts.path, "..", "www");
							shell.rm("-fr", www);
							fs.symlinkSync(path.resolve(rOpts.path), www, 'dir');
							iconSetup(opts.project, rOpts.mode);
							hookSetup(opts.project);
							injectScriptTag(path.join(rOpts.path, "debug.html"));
							injectScriptTag(path.join(rOpts.path, "index.html"));
							callback(undefined, rOpts);
						} catch(e) { //shelljs throws on failure
							callback(e);
						}
					}
				});
			}
		});
	}
};
