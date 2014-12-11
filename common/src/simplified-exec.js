/*
 * simplified-exec.js
 *
 * Simplified function to execute globally-installed NPM packages and dos/shell scripts
 */

var child_process = require('child_process');
var IS_WINDOWS = (process.platform.indexOf("win")===0);

var exec = function(cmd, args, stdio, callback) {
	var child = child_process.spawn(cmd, args, {cwd:process.cwd(), stdio:(stdio || "ignore")});
	child.on('exit', function(code) {
		var err;
		if(code!==0) {
			err = {code:code};
		}
		callback && callback(err);
	});
	child.on("error", function(err) {
		var obj = args[0];
		if(IS_WINDOWS) {
			obj = args[1];
		}
		callback(new Error("Error: Unable to run " + obj));
	});
	return child;
}

module.exports = {
	npm_install: function(stdio, callback) {
		return module.exports.npm("npm", ["install", "-q", "."], stdio, callback);
	},
	npm: function(cmd, args, stdio, callback) {
		if (IS_WINDOWS) {
			args.unshift("/c", cmd);
			cmd = "cmd";
		}
		return exec(cmd, args, stdio, callback);
	},
	script: function(script, stdio, callback) {
		var child;
		if(IS_WINDOWS) {
			console.log(script + ".bat");
			child = exec(process.env.COMSPEC || "cmd.exe", ["/c", script + ".bat"], stdio, callback);
		} else {
			child = exec(process.env.SHELL || "sh", [script + ".sh"], stdio, callback);
		}
		return child;
	}
};
