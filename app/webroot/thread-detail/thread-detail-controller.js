app.controller("ThreadDetailController", ["$http", "$routeParams", "$scope", function($http, $routeParams, $scope) {
	"use strict";

	var redditBaseUrl = "http://www.reddit.com";

	function retrieveThreadFromReddit() {
		console.log($routeParams);

		var httpPromise = $http.jsonp(
			redditBaseUrl +
			"/r/" + $routeParams.subredditId +
			"/comments" +
			"/" + $routeParams.threadId +
			".json?jsonp=JSON_CALLBACK"
		);

		httpPromise.success(handleThreadRequestSuccess);
		httpPromise.error(handleThreadRequestError);
	}

	function handleThreadRequestSuccess(responseData, status, headers, config) {
		console.log("success", responseData, status, headers, config);
		$scope.comments = responseData[1].data.children;
	}

	function handleThreadRequestError(responseData, status, headers, config) {
		console.log("error", responseData, status, headers, config);
	}

	retrieveThreadFromReddit();
}]);
