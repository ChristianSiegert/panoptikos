(function() {
	"use strict";

	var template = new sprinkles.Template("/supporters/supporters.html");

	function init() {
		app.router.addRoute("/supporters", handleRequest);
	}

	function handleRequest() {
		var page = new sprinkles.Page(document.getElementById("content"), template);
		page.serve();
	}

	init();
})();
