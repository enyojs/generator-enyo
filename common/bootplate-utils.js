/*
 * bootplate-utils.js
 *
 * Set of utilities to build, modify, and deploy Enyo bootplate projects
 */

var bootplate = require("./src/bootplate.js"),
	cordova = require("./src/cordova.js");

module.exports = {
	create: bootplate.create,
	cordova: cordova.create,
	addLib: bootplate.addLib,
	removeLib: bootplate.removeLib,
	listLibs: bootplate.listLibs,
	deploy: bootplate.deploy
};
