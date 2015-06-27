(function() {
	"use strict";

	var template = new sprinkles.Template("/subreddit-list/subreddit-list.html");

	function SubredditListController() {

	};

	SubredditListController.prototype.init = function() {
		app.router.registerRoute("/subreddits", this.handleRequest);
	};

	SubredditListController.prototype.handleRequest = function() {
		console.debug("Handling /subreddits");
		var page = new sprinkles.Page(document.getElementById("content"), template);
		page.load();
	};

	var controller = new SubredditListController();
	app.addInitFunc(controller.init.bind(controller));
})();
