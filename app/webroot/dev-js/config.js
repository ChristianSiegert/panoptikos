app.config(["$locationProvider", function($locationProvider) {
	$locationProvider.html5Mode(true);
}]);

app.config(["$routeProvider", function($routeProvider) {
	$routeProvider
		.when("/subreddits", {
			controller: "SubredditListController",
			templateUrl: "/dev-partials/subreddit-list.html"
		})
		.when("/r/:subredditId/comments/:threadId/:title?", {
			controller: "ThreadDetailController",
			templateUrl: "/dev-partials/thread-detail.html"
		})
		.when("/r/:subredditIds/:section?", {
			controller: "ThreadListController",
			templateUrl: "/dev-partials/thread-list.html"
		})
		.when("/:subredditIds?", {
			controller: "ThreadListController",
			templateUrl: "/dev-partials/thread-list.html"
		})
		.otherwise({
			redirectTo: "/"
		});
}]);

app.config(["threadProcessorProvider", function(threadProcessor) {
	threadProcessor.setImgurClientId("2cf931a0831396f");
	threadProcessor.setMaxThreadsToProcessSimultaneously(3);
}]);
