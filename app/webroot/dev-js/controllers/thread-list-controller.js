app.controller("ThreadListController", ["$http", "$location", "$route", "$routeParams", "$scope", "$timeout", "$window", "threadProcessor", function($http, $location, $route, $routeParams, $scope, $timeout, $window, threadProcessor) {
	"use strict";

	var locationPath = $location.path();

	var isDefaultPage = locationPath === "/"
		|| locationPath === "/controversial"
		|| locationPath === "/new"
		|| locationPath === "/rising"
		|| locationPath === "/top";


	// Redirect empty subreddit URL "/r/" to "/"
	if (locationPath === "/r" || locationPath === "/r/") {
		$location.path("/");
		return;
	}

	// Redirect legacy URL "/:subredditIds" to "/r/:subredditIds"
	if (!isDefaultPage && !locationPath.match(/^\/r\//)) {
		var url = $routeParams.subredditIds ? "/r/" + $routeParams.subredditIds : "/";
		$location.path(url);
		return;
	}

	var defaultSubredditIds = [
		"1000words",
		"beachporn",
		"birdpics",
		"cityporn",
		"earthporn",
		"eyecandy",
		"joshuatree",
		"lakeporn",
		"wallpaper",
		"wallpapers",
		"windowshots"
	];

	var subredditIds = isDefaultPage ? defaultSubredditIds : $routeParams.subredditIds.split("+");

	// We may have used the threadProcessor previously. Since it is a singleton,
	// clear any old state (e.g. queue).
	threadProcessor.clear();

	var sections = {
		"controversial": true,
		"new": true,
		"rising": true,
		"top": true
	};

	var section = (isDefaultPage ? $routeParams.subredditIds : $routeParams.section) || "";

	// If section is not "controversial", "hot", "new", "rising" or "top", redirect.
	if ($routeParams.section && !sections[$routeParams.section]) {
		var url = "/r/" + subredditIds.join("+");
		console.info("ThreadListController: Unknown section '%s'. Redirecting to '%s'.", $routeParams.section, url);
		$location.path(url);
		return;
	}

	var redditBaseUrl = "http://www.reddit.com";

	var lastThreadId = "";
	var maxThreadsPerRequest = 25;
	var redditRequestIsRunning = false;
	var timeOfLastRedditRequest = 0;

	var boardItems = [];
	var hasReachedEnd = false;

	var boardElement = $("#board");
	var boardColumnElements = [];
	var boardItemWidth = 328;

	$scope.boardColumns = [];
	var boardColumnCount = computeBoardColumnCount();
	var indexOfShortestColumn = 0;

	var loadMoreButtonTexts = {
		ERROR: "There was a problem. Try again.",
		LOAD_MORE: "Load more",
		LOADING: "Loading threads…",
		NO_THREADS: "There are no threads here :(",
		REACHED_END: "You reached the end"
	};

	$scope.loadMoreButtonText = loadMoreButtonTexts.LOADING;

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

		if (hasReachedEnd) {
			console.info("ThreadListController: You reached the end.");
			return;
		}

		$scope.loadMoreButtonText = loadMoreButtonTexts.LOADING;

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
			"/r/" + subredditIds.join("+") +
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
		var atLeastOneItemWasAddedToQueue = false;

		for (var i = 0, threadCount = threads.length; i < threadCount; i++) {
			var thread = threads[i]["data"];

			if (threadProcessor.addToQueue(thread, angular.bind(this, handleProcessedSuccess, i))) {
				atLeastOneItemWasAddedToQueue = true;
			}
		}

		lastThreadId = responseData["data"]["after"];
		hasReachedEnd = !lastThreadId;
		redditRequestIsRunning = false;

		if (!atLeastOneItemWasAddedToQueue) {
			updateLoadMoreButtonLabel();
		}
	};

	function handleProcessedSuccess(i, thread, imageUrl) {
		var boardItem = {
			imageUrl: imageUrl,
			thread: thread
		};

		addBoardItemToBoard(boardItem, i * 20);
	}

	var handleRedditRequestError = function(responseData, status, headers, config) {
		console.info("ThreadListController: Error retrieving threads from Reddit.", responseData, status, headers, config);
		redditRequestIsRunning = false;
		$scope.loadMoreButtonText = loadMoreButtonTexts.ERROR;
	};

	var addBoardItemToBoard = function(boardItem, delay, isResize) {
		$timeout(function() {
			if (!isResize) {
				boardItems.push(boardItem);
			}

			var index = getIndexOfShortestColumn();

			if (index === null) {
				console.warn("ThreadListController: indexOfShortestColumn is null. Skipping adding of boardItem.");
				return;
			}

			$scope.boardColumns[index].push(boardItem);
			updateLoadMoreButtonLabel();

			if (!isResize) {
				loadMoreToFillPage();
			}
		}, delay);
	};

	function loadMoreToFillPage() {
		// If there are further board items to add
		if (boardItems.length !== threadProcessor.threadDict.length) {
			return;
		}

		var index = getIndexOfShortestColumn(boardColumnElements);

		var window = angular.element($window);
		var shortestColumn = $(boardColumnElements[index]);
		var columnBottom = shortestColumn.offset().top + shortestColumn.height();
		var windowBottom = window.height();

		if (columnBottom < windowBottom + Math.min(400, boardColumnCount * 100)) {
			$scope.retrieveThreadsFromReddit();
		}
	}

	function updateLoadMoreButtonLabel() {
		// If a request to Reddit is running or queued
		if (redditRequestIsRunning) {
			$scope.loadMoreButtonText = loadMoreButtonTexts.LOADING;
			return;
		}

		// If there are no further board items to add
		if (boardItems.length === threadProcessor.threadDict.length) {
			if (hasReachedEnd) {
				if (threadProcessor.threadDict.length) {
					$scope.loadMoreButtonText = loadMoreButtonTexts.REACHED_END;
				} else {
					$scope.loadMoreButtonText = loadMoreButtonTexts.NO_THREADS;
				}
			} else {
				$scope.loadMoreButtonText = loadMoreButtonTexts.LOAD_MORE;
			}
		}
	}

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
		var url = (isDefaultPage ? "" : "/r/" + subredditIds.join("+")) + "/" + section
		$location.path(url);
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

		if (columnBottom < windowBottom + Math.min(400, boardColumnCount * 100)) {
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
	}

	$scope.handleResizeEvent = function(event) {
		var newBoardColumnCount = computeBoardColumnCount();

		if (newBoardColumnCount === boardColumnCount) {
			return;
		}

		boardColumnCount = newBoardColumnCount;

		console.log(boardElement.width(), boardColumnCount);

		$scope.boardColumns = [];

		// Create new columns
		for (var i = 0; i < boardColumnCount; i++) {
			$scope.boardColumns.push([]);
		}

		$timeout(function() {
			boardColumnElements = angular.element(".board-column");
		}, 0);

		for (var i = 0; i < boardItems.length; i++) {
			addBoardItemToBoard(boardItems[i], 0, true);
		}
	}

	function computeBoardColumnCount() {
		if (!boardElement || !boardItemWidth) {
			console.error("ThreadListController: Missing boardElement or boardItemWidth.");
			return 0;
		}

		var boardWidth = boardElement.width();
		var marginBetweenColumns = 10;
		var newBoardColumnCount = 1;

		newBoardColumnCount += Math.floor((boardWidth - boardItemWidth) / (boardItemWidth + marginBetweenColumns));
		return newBoardColumnCount;
	}

	$scope.selectSubreddits = function() {
		$location.path("/subreddits");
	};
}]);
