app.controller("e", ["$http", "$location", "$routeParams", "$scope", function($http, $location, $routeParams, $scope) {
	"use strict";

	function Subreddit(subredditId, isChecked) {
		this.id = subredditId || "";
		this.isChecked = isChecked || false;
		this.name = subredditId || "";
	}

	$scope.name = "";
	$scope.subreddits = [];
	$scope.isValidName = true;
	var subredditIds = $routeParams.subredditIds ? $routeParams.subredditIds.split("+") : [];

	for (var i = 0, subredditCount = subredditIds.length; i < subredditCount; i++) {
		var subreddit = new Subreddit(subredditIds[i], true);
		$scope.subreddits.push(subreddit);
	}

	$scope.allAreSelected = true;

	$scope.selectAll = function() {
		for (var i = 0, count = $scope.subreddits.length; i < count; i++) {
			$scope.subreddits[i].isChecked = $scope.allAreSelected;
		}
	};

	$scope.toggle = function() {
		for (var i = 0, count = $scope.subreddits.length; i < count; i++) {
			if (!$scope.subreddits[i].isChecked) {
				$scope.allAreSelected = false;
				return;
			}
		}

		$scope.allAreSelected = true;
	};

	$scope.view = function() {
		var subredditIdsOfSelectedSubreddits = [];

		for (var i = 0, count = $scope.subreddits.length; i < count; i++) {
			if ($scope.subreddits[i].isChecked) {
				subredditIdsOfSelectedSubreddits.push($scope.subreddits[i].id);
			}
		}

		$location.path("/r/" + subredditIdsOfSelectedSubreddits.join("+"));
	};

	$scope.add = function() {
		$scope.err = "";

		if (!isSubredditName($scope.name)) {
			$scope.err = "This is not a valid subreddit name.";
		} else if (isDuplicate($scope.name)) {
			$scope.err = "This subreddit already exists in your list.";
		}

		if ($scope.err) {
			return;
		}

		var subreddit = new Subreddit($scope.name, true);
		$scope.subreddits.push(subreddit);

		$scope.name = "";
	};

	$scope.addWithKeyboard = function(event) {
		if (event.keyCode !== 13) {
			return;
		}

		$scope.add();
	};

	function isSubredditName(name) {
		var subredditNameRegExp = /^[A-Za-z0-9][A-Za-z0-9_]{2,20}$/;
		return name.match(subredditNameRegExp);
	}

	function isDuplicate() {
		for (var i = 0, count = $scope.subreddits.length; i < count; i++) {
			if ($scope.subreddits[i].id === $scope.name) {
				return true;
			}
		}

		return false;
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
