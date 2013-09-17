app.controller("SubredditListController", ["$http", "$scope", function($http, $scope) {
	"use strict";

	var redditBaseUrl = "http://www.reddit.com";
	var lastSubredditId = "";
	var maxSubredditsPerRequest = 25;

	$scope.subreddits = [];

	$scope.retrieveSubredditsFromReddit = function() {
		var httpPromise = $http.jsonp(
			redditBaseUrl +
			"/subreddits/" +
			($scope.search ? "/search?q=" + $scope.search : "") +
			".json?jsonp=JSON_CALLBACK" +
			"&after=" + lastSubredditId +
			"&limit=" + maxSubredditsPerRequest
		);

		httpPromise.success(handleRedditRequestSuccess);
		httpPromise.error(handleRedditRequestError);
	};

	function handleRedditRequestSuccess(responseData, status, headers, config) {
		console.info("SubredditListController: Success retrieving subreddits from Reddit.", responseData, status, headers, config);
		$scope.subreddits = responseData.data.children;
	}

	function handleRedditRequestError(responseData, status, headers, config) {
		console.info("SubredditListController: Error retrieving subreddits from Reddit.", responseData, status, headers, config);
	}
}]);
