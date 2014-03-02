app.controller("SubredditListController", ["$http", "$location", "$routeParams", "$scope", function($http, $location, $routeParams, $scope) {
	"use strict";

	$scope.subreddits = [];

	var subredditIds = $routeParams.subredditIds ? $routeParams.subredditIds.split("+") : [];

	for (var i = 0, subredditCount = subredditIds.length; i < subredditCount; i++) {
		var subreddit = new Subreddit(subredditIds[i], true);
		$scope.subreddits.push(subreddit);
	}

	$scope.viewSubreddits = function() {
		var subredditIdsOfSelectedSubreddits = [];

		for (var i = 0, subredditCount = $scope.subreddits.length; i < subredditCount; i++) {
			if ($scope.subreddits[i].isChecked) {
				subredditIdsOfSelectedSubreddits.push($scope.subreddits[i].id);
			}
		}

		$location.path("/r/" + subredditIdsOfSelectedSubreddits.join("+"));
	};

	$scope.addSubreddit = function(event) {
		if (event.keyCode !== 13) {
			return;
		}

		var subreddit = new Subreddit(event.target.value, true);
		$scope.subreddits.push(subreddit);

		event.target.value = "";
	};

	function Subreddit(subredditId, isChecked) {
		this.id = subredditId || "";
		this.isChecked = isChecked || false;
		this.name = subredditId || "";
	}

	// var redditBaseUrl = "http://www.reddit.com";
	// var lastSubredditId = "";
	// var maxSubredditsPerRequest = 25;

	// $scope.subreddits = [];

	// $scope.retrieveSubredditsFromReddit = function() {
	// 	var httpPromise = $http.jsonp(
	// 		redditBaseUrl +
	// 		"/subreddits/" +
	// 		($scope.search ? "/search?q=" + $scope.search : "") +
	// 		".json?jsonp=JSON_CALLBACK" +
	// 		"&after=" + lastSubredditId +
	// 		"&limit=" + maxSubredditsPerRequest
	// 	);

	// 	httpPromise.success(handleRedditRequestSuccess);
	// 	httpPromise.error(handleRedditRequestError);
	// };

	// function handleRedditRequestSuccess(responseData, status, headers, config) {
	// 	console.info("SubredditListController: Success retrieving subreddits from Reddit.", responseData, status, headers, config);
	// 	$scope.subreddits = responseData.data.children;
	// }

	// function handleRedditRequestError(responseData, status, headers, config) {
	// 	console.info("SubredditListController: Error retrieving subreddits from Reddit.", responseData, status, headers, config);
	// }
}]);
