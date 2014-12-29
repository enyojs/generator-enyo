#!/usr/bin/env node

var path = require("path"),
	fs = require("fs"),
	spawn = require('child_process').spawn;

var SCRIPT_BAT = "/tools/deploy.bat",
	SCRIPT_SH = "/tools/deploy.sh",
	DEPLOY_DIR = "/deploy",
	WWW = "www";

function findBootplate() {
	var deploy = SCRIPT_SH;
	if(process.platform.indexOf("win")===0) {
		deploy = SCRIPT_BAT;
	}
	try {
		if(fs.existsSync(WWW + deploy)) {
			return WWW;
		} else { //search for non-www bootplate
			var root = fs.readdirSync("./");
			for(var i=0; i<root.length; i++) {
				if(fs.existsSync(root[i] + deploy)) {
					return root[i];
				}
			}
		}
	} catch(e) {
		console.log("Error encountered while searching for bootplate\n" + e.message);
	}
}

function runBuildScript(bpDir, success) {
	var rootDir = process.cwd();
	process.chdir(bpDir);
	var child;
	if(process.platform.indexOf("win")===0) {
		child = spawn(process.env.COMSPEC || "cmd.exe", ["/c", path.join(bpDir, SCRIPT_BAT)],
				{stdio: "inherit"});
	} else {
		child = spawn(process.env.SHELL || "sh", [bpDir + SCRIPT_SH], {stdio: "inherit"});
	}
	child.on("close", function(code) {
		process.chdir(rootDir);
		if(code===0) {
			success();
		} else {
			updateWWW(bpDir);
		}
	});
}

function findDeployed(bpDir) {
	try {
		if(fs.existsSync(bpDir + DEPLOY_DIR + "/index.html")) {
			return bpDir + DEPLOY_DIR;
		} else if(fs.existsSync(bpDir + DEPLOY_DIR)) {
			//search for old-format and non-standard deploy output locations
			var bpContents = fs.readdirSync(bpDir + DEPLOY_DIR);
			// sort by age and some previous bootplates that allow multiple deploy directories
			bpContents.sort(function(a, b) {
				return fs.statSync(bpDir + DEPLOY_DIR + b).mtime.getTime() -
						fs.statSync(bpDir + DEPLOY_DIR + a).mtime.getTime();
			});
			for(var i=0; i<bpContents.length; i++) {
				if(fs.existsSync(bpDir + DEPLOY_DIR + "/" + bpContents[i] + "/index.html")) {
					return bpDir + DEPLOY_DIR + "/" + bpContents[i];
				}
			}
		}
	} catch(e) {
		console.log("Error encountered while searching for deployed bootplate\n" + e.message);
	}
}

function updateWWW(dir) {
	if(fs.lstatSync(WWW).isSymbolicLink()) {
		fs.unlinkSync(WWW);
	} else if(fs.readdirSync(WWW).length===0) {
		fs.rmdirSync(WWW);
	}
	if(!fs.existsSync(WWW)) {
		try {
			fs.symlinkSync(path.resolve(dir), WWW, 'dir');
		} catch(e) {
			fs.symlinkSync(path.resolve(dir), WWW, 'junction');
		}
		
	}
}

var bootplate = findBootplate();
if(bootplate) {
	var realBootplate = fs.realpathSync(bootplate);
	var cmdline = process.env.CORDOVA_CMDLINE || "";
	if(cmdline.indexOf("-no-deploy")>=0 || cmdline.indexOf("-enyo-debug")>=0
			|| (process.env.CORDOVA_PLATFORMS && process.env.CORDOVA_PLATFORMS==="webos")) {
		updateWWW(realBootplate);
	} else {
		runBuildScript(realBootplate, function() {
			var deploy = findDeployed(realBootplate);
			if(deploy) {
				updateWWW(deploy);
			} else {
				updateWWW(realBootplate);
			}
		});
	}
}
