/* global QUnit */
QUnit.config.autostart = false;

sap.ui.getCore().attachInit(function () {
	"use strict";

	sap.ui.require([
		"zstud/students/test/unit/AllTests"
	], function () {
		QUnit.start();
	});
});
