app.controller("ThreadListController", ["$http", "$routeParams", "$scope", "$timeout", "threadProcessor", function($http, $routeParams, $scope, $timeout, threadProcessor) {
	var subredditIds = $routeParams.subredditIds;

	var redditBaseUrl = "http://www.reddit.com/r/" + subredditIds;
	var lastThreadId = "";
	var maxThreadsPerRequest = 25;
	var redditRequestIsRunning = false;

	var boardItems = [];

	$scope.section = "";
	hasReachedEnd = false;

	$scope.boardColumns = [];
	var boardColumnCount = 3;
	var boardColumnElements = [];
	var indexOfShortestColumn = 0;

	var reset = function() {
		$scope.boardColumns = [];
		// boardColumnCount = 3;
		// boardColumnElements = [];

		threadProcessor.clear();
		boardItems = [];
		lastThreadId = "";

		// Create new columns
		for (var i = 0; i < boardColumnCount; i++) {
			$scope.boardColumns.push([]);
		}

		$timeout(function() {
			boardColumnElements = angular.element(".board-column");
		}, 0);
	};

	$scope.rebuild = function(doRetrieveThreadsFromReddit) {
		// Reset variables
		$scope.boardColumns = [];

		// Create new columns
		for (var i = 0; i < boardColumnCount; i++) {
			$scope.boardColumns.push([]);
		}

		$timeout(function() {
			boardColumnElements = angular.element(".board-column");
		}, 0);

		if (doRetrieveThreadsFromReddit) {
			$scope.retrieveThreadsFromReddit();
		}
	};

	$scope.retrieveThreadsFromReddit = function() {
		if (redditRequestIsRunning) {
			console.log("ThreadsController: redditRequestIsRunning");
			return;
		}

		redditRequestIsRunning = true;

		var httpPromise = $http.jsonp(
			redditBaseUrl +
			"/" + $scope.section +
			".json?jsonp=JSON_CALLBACK" +
			"&after=" + lastThreadId +
			"&limit=" + maxThreadsPerRequest
		);

		httpPromise.success(handleRedditRequestSuccess);
		httpPromise.error(handleRedditRequestError);
	};

	var handleRedditRequestSuccess = function(responseData, status, headers, config) {
		var threads = responseData["data"]["children"];

		for (var i = 0, threadCount = threads.length; i < threadCount; i++) {
			var thread = threads[i]["data"];

			threadProcessor.addToQueue(thread, function(thread, imageUrl) {
				var boardItem = {
					imageUrl: imageUrl,
					thread: thread
				};

				addBoardItemToBoard(boardItem, 0);
				boardItems.push(boardItem);
			});
		}

		lastThreadId = responseData["data"]["after"];

		if (!lastThreadId) {
			hasReachedEnd = true;
		}

		redditRequestIsRunning = false;
	};

	var handleRedditRequestError = function(responseData, status, headers, config) {
		console.log("Error retrieving threads from Reddit.", responseData, status, headers, config);
		redditRequestIsRunning = false;
	};

	var addBoardItemToBoard = function(boardItem, delay) {
		$timeout(function() {
			var index = getIndexOfShortestColumn();

			if (index === null) {
				console.debug("indexOfShortestColumn is null. Skipping adding of boardItem.");
				return;
			}

			$scope.boardColumns[index].push(boardItem);
		}, delay);
	};

	var getIndexOfShortestColumn = function() {
		if (boardColumnCount === 0) {
			return null;
		}

		if (boardColumnCount === 1) {
			return 0;
		}

		var shortestColumnHeight = null;
		var shortestColumnIndex = null;

		for (var i = 0, boardColumnElementsCount = boardColumnElements.length; i < boardColumnElementsCount; i++) {
			var columnHeight = boardColumnElements[i].offsetHeight;

			if (shortestColumnHeight === null) {
				shortestColumnHeight = columnHeight;
				shortestColumnIndex = i;
			} else if (shortestColumnHeight > columnHeight) {
				shortestColumnHeight = columnHeight;
				shortestColumnIndex = i;
			}
		}

		return shortestColumnIndex;
	};

	$scope.selectSection = function(section) {
		$scope.section = section;

		// TODO: Cancel running requests.
		reset();
		$scope.retrieveThreadsFromReddit();
	};
}]);
