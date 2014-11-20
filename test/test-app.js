/*global describe, beforeEach, it*/
'use strict';

var path = require('path');
var assert = require('yeoman-generator').assert;
var helpers = require('yeoman-generator').test;
var os = require('os');

describe('enyo bootplate', function () {
	before(function (done) {
		helpers.run(path.join(__dirname, '../generators/app'))
			.inDir(path.join(os.tmpdir(), './temp-test'))
			.withArguments(["testApp"])
			.withOptions({ 'mode': "onyx" })
			.on('end', done);
	});

	it('creates files', function () {
		assert.file([
			'testApp/enyo/enyo.js',
			'testApp/lib/onyx/package.js',
			'testApp/lib/layout/package.js'
		]);
	});
});

describe('enyo bootplate with cordova', function () {
	before(function (done) {
		helpers.run(path.join(__dirname, '../generators/app'))
			.inDir(path.join(os.tmpdir(), './temp-test'))
			.withArguments(["testCordovaApp"])
			.withOptions({ 'cordova': true })
			.on('end', done);
	});

	it('creates files', function () {
		assert.file([
			'testCordovaApp/config.xml',
			'testCordovaApp/hooks/after_prepare/enyo-deploy-cleanup-hook.js',
			'testCordovaApp/hooks/after_prepare/enyo-deploy-cleanup-hook.js',
			'testCordovaApp/bootplate/enyo/enyo.js',
			'testCordovaApp/bootplate/lib/onyx/package.js',
			'testCordovaApp/bootplate/lib/layout/package.js'
		]);
	});
});

