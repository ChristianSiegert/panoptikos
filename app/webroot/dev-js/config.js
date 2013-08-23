app.config(["$locationProvider", function($locationProvider) {
	$locationProvider.html5Mode(true);
}]);

app.config(["$routeProvider", function($routeProvider) {
	$routeProvider
		.when("/r/:subredditId/comments/:threadId", {
			controller: "ThreadDetailController",
			templateUrl: "/dev-partials/thread-detail.html"
		})
		.when("/r/:subredditId/comments/:threadId/:underscoredTitle", {
			controller: "ThreadDetailController",
			templateUrl: "/dev-partials/thread-detail.html"
		})

		.when("/r/:subredditIds", {
			controller: "ThreadListController",
			templateUrl: "/dev-partials/thread-list.html"
		})
		.when("/r/:subredditIds/:section", {
			controller: "ThreadListController",
			templateUrl: "/dev-partials/thread-list.html"
		})

		.otherwise({
			redirectTo: "/r/earthporn"
		});
}]);

app.config(["threadProcessorProvider", function(threadProcessor) {
	threadProcessor.setImgurClientId("2cf931a0831396f");
	threadProcessor.setMaxThreadsToProcessSimultaneously(3);
}]);
