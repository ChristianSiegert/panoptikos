(function() {
	"use strict";

	var template = new sprinkles.Template("/supporters/supporters.html");

	function SupportersController(router) {
		this.router = router;
	};

	SupportersController.prototype.init = function() {
		this.router.registerRoute("/supporters", this.handleRequest);
	};

	SupportersController.prototype.handleRequest = function() {
		var page = new sprinkles.Page(document.getElementById("content"), template);
		page.load();
	};

	sprinkles.provide("custom.supporters.SupportersController", SupportersController);
})();
