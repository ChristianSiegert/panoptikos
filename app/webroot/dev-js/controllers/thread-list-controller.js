app.controller("ThreadListController", ["$http", "$location", "$routeParams", "$scope", "$timeout", "$window", "threadProcessor", function($http, $location, $routeParams, $scope, $timeout, $window, threadProcessor) {
	// We may have used the threadProcessor previously. Since it is a singleton,
	// clear any old state (e.g. queue).
	threadProcessor.clear();

	var sections = {
		"controversial": true,
		"new": true,
		"rising": true,
		"top": true
	};

	// If section is not "controversial", "hot", "new", "rising" or "top", redirect.
	if ($routeParams.section && !sections[$routeParams.section]) {
		var url = "/r/" + $routeParams.subredditIds;
		console.info("ThreadListController: Unknown section '%s'. Redirecting to '%s'.", $routeParams.section, url);
		$location.path(url);
		return;
	}

	var redditBaseUrl = "http://www.reddit.com";
	var section = $routeParams.section ? $routeParams.section : "";

	var lastThreadId = "";
	var maxThreadsPerRequest = 25;
	var redditRequestIsRunning = false;
	var timeOfLastRedditRequest = 0;

	var boardItems = [];
	var hasReachedEnd = false;

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
			console.info("ThreadListController: Request to Reddit is already running or queued.");
			return;
		}

		var now = Date.now();
		var minDelay = 2000;

		var difference = now - timeOfLastRedditRequest;
		var delay = difference > minDelay ? 0 : minDelay - difference;

		if (difference < minDelay) {
			console.info("ThreadListController: Last request to Reddit was less than %d ms ago. Waiting %d ms until sending request.", minDelay, delay);
		}

		redditRequestIsRunning = true;
		$timeout(retrieveThreadsFromReddit_, delay);
	};

	function retrieveThreadsFromReddit_() {
		timeOfLastRedditRequest = Date.now();

		var httpPromise = $http.jsonp(
			redditBaseUrl +
			"/r/" + $routeParams.subredditIds +
			"/" + section +
			".json?jsonp=JSON_CALLBACK" +
			"&after=" + lastThreadId +
			"&limit=" + maxThreadsPerRequest
		);

		httpPromise.success(handleRedditRequestSuccess);
		httpPromise.error(handleRedditRequestError);
	}

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
		console.info("ThreadListController: Error retrieving threads from Reddit.", responseData, status, headers, config);
		redditRequestIsRunning = false;
	};

	var addBoardItemToBoard = function(boardItem, delay) {
		$timeout(function() {
			var index = getIndexOfShortestColumn();

			if (index === null) {
				console.warn("ThreadListController: indexOfShortestColumn is null. Skipping adding of boardItem.");
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
		// TODO: Cancel running requests.
		$location.path("/r/" + $routeParams.subredditIds + "/" + section);
	};

	// If we get here, the selected Reddit section (e.g. "new" or "top"), exists
	// and we didn't have to redirect. So let's build the board and make some
	// requests!
	$scope.rebuild(true);

	$scope.handleScrollEvent = function(event) {
		var boardColumnElements = $(".board-column");
		var index = getIndexOfShortestColumn(boardColumnElements);

		if (index === null) {
			console.warn("onScroll: index is null.");
			return;
		}

		$window = angular.element($window);
		var column = $(boardColumnElements[index]);
		var columnBottom = column.offset().top + column.height();
		var windowBottom = $window.scrollTop() + $window.height();

		if (columnBottom < windowBottom + 300) {
			$scope.retrieveThreadsFromReddit();
		}
	}

	function getIndexOfShortestColumn(boardColumnElements) {
		var boardColumnElementsCount = boardColumnElements.length

		if (boardColumnElementsCount === 0) {
			return null;
		}

		if (boardColumnElementsCount === 1) {
			return 0;
		}

		var shortestColumnHeight = null;
		var shortestColumnIndex = null;

		for (var i = 0; i < boardColumnElementsCount; i++) {
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
}]);
