(function() {
	"use strict";

	var template = new sprinkles.Template("/supporters/supporters.html");

	function SupportersController() {

	};

	SupportersController.prototype.init = function() {
		app.router.registerRoute("/supporters", this.handleRequest);
	};

	SupportersController.prototype.handleRequest = function() {
		var page = new sprinkles.Page(document.getElementById("content"), template);
		page.load();
	};

	var controller = new SupportersController();
	app.addInitFunc(controller.init.bind(controller));
})();
