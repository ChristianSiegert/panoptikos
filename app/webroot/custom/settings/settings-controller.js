(function() {
	"use strict";

	var template = new sprinkles.Template("/settings/settings.html");

	var SettingsController = function() {

	};

	SettingsController.prototype.init = function() {
		app.router.registerRoute("/settings", this.handleRequest);
	};

	SettingsController.prototype.handleRequest = function() {
		var page = new sprinkles.Page(document.getElementById("content"), template);
		page.load();
	};

	var controller = new SettingsController();
	app.addInitFunc(controller.init.bind(controller));
})();
