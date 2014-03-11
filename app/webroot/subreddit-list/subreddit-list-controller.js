app.controller("e", [
		"$http", "$location", "$routeParams", "$scope", "Flash",
		function($http, $location, $routeParams, $scope, Flash) {
	"use strict";

	var groupKey = "subredditList";

	function Subreddit(subredditId, isChecked) {
		this.id = subredditId || "";
		this.isChecked = isChecked || false;
		this.name = subredditId || "";
	}

	$scope.allAreSelected = true;
	$scope.name = "";
	$scope.subreddits = [];
	$scope.isValidName = true;
	var subredditIds = $routeParams.subredditIds ? $routeParams.subredditIds.split("+") : [];

	for (var i = 0, subredditCount = subredditIds.length; i < subredditCount; i++) {
		var subreddit = new Subreddit(subredditIds[i], true);
		$scope.subreddits.push(subreddit);
	}

	$scope.$on("$destroy", function() {
		Flash.ClearAll(groupKey);
	});

	$scope.selectAll = function() {
		for (var i = 0, count = $scope.subreddits.length; i < count; i++) {
			$scope.subreddits[i].isChecked = $scope.allAreSelected;
		}
	};

	$scope.toggle = function() {
		Flash.ClearErrorMessages(groupKey);

		for (var i = 0, count = $scope.subreddits.length; i < count; i++) {
			if (!$scope.subreddits[i].isChecked) {
				$scope.allAreSelected = false;
				return;
			}
		}

		$scope.allAreSelected = true;
	};

	$scope.view = function() {
		var idsOfSelectedSubreddits = [];

		for (var i = 0, count = $scope.subreddits.length; i < count; i++) {
			if ($scope.subreddits[i].isChecked) {
				idsOfSelectedSubreddits.push($scope.subreddits[i].id);
			}
		}

		if (!idsOfSelectedSubreddits.length) {
			Flash.ClearErrorMessages(groupKey);
			Flash.AddErrorMessage("Please select at least one subreddit.", groupKey);
			return;
		}

		$location.path("/r/" + idsOfSelectedSubreddits.join("+"));
	};

	$scope.add = function() {
		Flash.ClearErrorMessages(groupKey);
		$scope.err = "";

		if (!isSubredditName($scope.name)) {
			$scope.err = "This is not a valid subreddit name.";
		} else if (isDuplicate($scope.name)) {
			$scope.err = "This subreddit already exists in your list.";
		} else if (urlIsTooLong($scope.name)) {
			$scope.err = "You can’t add any more subreddits as the URL would get too long.";
		}

		if ($scope.err) {
			return;
		}

		var subreddit = new Subreddit($scope.name, true);
		$scope.subreddits.push(subreddit);

		$scope.name = "";
	};

	$scope.keyUp = function(event) {
		$scope.err = "";

		if (event.keyCode !== 13) {
			return;
		}

		$scope.add();
	};

	function isSubredditName(name) {
		var subredditNameRegExp = /^[A-Za-z0-9][A-Za-z0-9_]{2,20}$/;
		return name.match(subredditNameRegExp);
	}

	function isDuplicate(name) {
		for (var i = 0, count = $scope.subreddits.length; i < count; i++) {
			if ($scope.subreddits[i].id === name) {
				return true;
			}
		}

		return false;
	}

	function urlIsTooLong(name) {
		var idsOfSelectedSubreddits = [name];

		for (var i = 0, count = $scope.subreddits.length; i < count; i++) {
			if ($scope.subreddits[i].isChecked) {
				idsOfSelectedSubreddits.push($scope.subreddits[i].id);
			}
		}

		var url = "/subreddits/" + idsOfSelectedSubreddits.join("+");
		return url.length > 2047;
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
