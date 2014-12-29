#!/usr/bin/env node

var path = require("path"),
	fs = require("fs"),
	UP1 = "/..",
	UP2 = "/../..",
	SCRIPT_BAT = "/tools/deploy.bat",
	SCRIPT_SH = "/tools/deploy.sh",
	WWW = "www";

function symlinkWWW(realPath) {
	try {
		fs.symlinkSync(path.resolve(realPath), WWW, 'dir');
	} catch(e) {
		fs.symlinkSync(path.resolve(realPath), WWW, 'junction');
	}
}

//if www is a symlink, check if it's a deployed Enyo bootplate
if(fs.lstatSync(WWW).isSymbolicLink()) {
	var realBootplate = fs.realpathSync(WWW);
	if(fs.existsSync(realBootplate + UP1 + SCRIPT_BAT)
			|| fs.existsSync(realBootplate + UP1 + SCRIPT_SH)) {
		fs.unlinkSync(WWW);
		symlinkWWW(path.join(realBootplate, UP1));
	} else if(fs.existsSync(realBootplate + UP2 + SCRIPT_BAT)
			|| fs.existsSync(realBootplate + UP2 + SCRIPT_SH)) {
		fs.unlinkSync(WWW);
		symlinkWWW(path.join(realBootplate, UP2));
	}
}
