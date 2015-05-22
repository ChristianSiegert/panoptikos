// Controllers:
// 	a: DonationsController
// 	b: FeedbackController
// 	c: ThreadDetailController
// 	d: ThreadListController
// 	e: SubredditListController
// 	f: FlashController
// 	n: NavigationController
//	s: SettingsController

app
	.config(["$locationProvider", function($locationProvider) {
		$locationProvider.html5Mode(true);
	}])

	.config(["$routeProvider", function($routeProvider) {
		// If you add a route, make sure the templateUrl is accessible in
		// development mode by adding it also in main.go’s init function.
		$routeProvider
			.when("/donate", {
				controller: "a", // DonationsController
				templateUrl: "/donations/donations.html"
			})
			.when("/feedback", {
				controller: "b", // FeedbackController
				templateUrl: "/feedback/feedback.html"
			})
			.when("/r/:subredditId/comments/:threadId/:title?", {
				controller: "c", // ThreadDetailController
				templateUrl: "/thread-detail/thread-detail.html"
			})
			.when("/r/:subredditIds/:section?", {
				controller: "d", // ThreadListController
				templateUrl: "/thread-list/thread-list.html"
			})
			.when("/settings", {
				controller: "s", // SettingsController
				templateUrl: "/settings/settings.html"
			})
			.when("/subreddits/:subredditIds?", {
				controller: "e", // SubredditListController
				templateUrl: "/subreddit-list/subreddit-list.html"
			})
			.when("/supporters", {
				controller: "supportersController",
				templateUrl: "/supporters/supporters.html"
			})
			// TODO: Check if I can remove this.
			.when("/:subredditIds?", {
				controller: "d", // ThreadListController
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
