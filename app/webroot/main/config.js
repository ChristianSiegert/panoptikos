app
	.config(["$locationProvider", function($locationProvider) {
		$locationProvider.html5Mode(true);
	}])

	.config(["$routeProvider", function($routeProvider) {
		$routeProvider
			.when("/donate", {
				controller: "DonationsController",
				templateUrl: "/donations/donations.html"
			})
			.when("/feedback", {
				controller: "FeedbackController",
				templateUrl: "/feedback/feedback.html"
			})
			.when("/r/:subredditId/comments/:threadId/:title?", {
				controller: "ThreadDetailController",
				templateUrl: "/thread-detail/thread-detail.html"
			})
			.when("/r/:subredditIds/:section?", {
				controller: "ThreadListController",
				templateUrl: "/thread-list/thread-list.html"
			})
			.when("/settings", {
				controller: "SettingsController",
				templateUrl: "/settings/settings.html"
			})
			.when("/subreddits/:subredditIds?", {
				controller: "SubredditListController",
				templateUrl: "/subreddit-list/subreddit-list.html"
			})
			// TODO: Check if I can remove this.
			.when("/:subredditIds?", {
				controller: "ThreadListController",
				templateUrl: "/thread-list/thread-list.html"
			})
			.otherwise({
				redirectTo: "/"
			});
	}])

	.config(["localStorageServiceProvider", function(localStorageServiceProvider) {
		localStorageServiceProvider.setPrefix("panoptikos")
	}])

	.config(["threadProcessorProvider", function(threadProcessor) {
		threadProcessor.setImgurClientId("2cf931a0831396f");
	}]);
