(function() {
	"use strict";

	var template = new sprinkles.Template("/subreddit-list/subreddit-list.html");

	function SubredditListController() {

	};

	SubredditListController.prototype.init = function(router) {
		router.registerRoute("/subreddits", this.handleRequest);
	};

	SubredditListController.prototype.handleRequest = function() {
		console.debug("Handling /subreddits");
		var page = new sprinkles.Page(document.getElementById("content"), template);
		page.load();
	};

	sprinkles.provide("custom.subredditList.SubredditListController", SubredditListController);
})();
