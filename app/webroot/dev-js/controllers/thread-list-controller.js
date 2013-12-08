app.controller("ThreadListController", [
		"$http", "$location", "$log", "$rootScope", "$route", "$routeParams", "$scope", "$timeout", "$window", "defaultSubredditIds", "Board", "BoardItem", "ThreadList", "threadProcessor",
		function($http, $location, $log, $rootScope, $route, $routeParams, $scope, $timeout, $window, defaultSubredditIds, Board, BoardItem, ThreadList, threadProcessor) {
	"use strict";

	// We may have used threadProcessor previously. Clear any old state
	// (e.g. queue).
	threadProcessor.clear();

	var locationPath = $location.path();

	// Redirect empty subreddit URL "/r/" to "/"
	if (locationPath === "/r" || locationPath === "/r/") {
		$location.path("/");
		return;
	}

	var isDefaultPage = locationPath === "/"
		|| locationPath === "/controversial"
		|| locationPath === "/new"
		|| locationPath === "/rising"
		|| locationPath === "/top";

	// Redirect legacy URL "/:subredditIds" to "/r/:subredditIds"
	if (!isDefaultPage && !locationPath.match(/^\/r\//)) {
		var url = $routeParams.subredditIds ? "/r/" + $routeParams.subredditIds : "/";
		$location.path(url);
		return;
	}

	var subredditIds = isDefaultPage ? defaultSubredditIds : $routeParams.subredditIds.split("+");

	$scope.isMultiReddit = subredditIds.length > 1 || subredditIds[0] === "all";

	$rootScope.pageTitle = isDefaultPage ? "" : "/r/" + subredditIds.join("+") + " - ";

	// Sections that exist on Reddit that we want to support, besides "hot".
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
		$log.info("ThreadListController: Unknown section '%s'. Redirecting to '%s'.", $routeParams.section, url);
		$location.path(url);
		return;
	}

	var redditBaseUrl = "http://www.reddit.com";
	var lastThreadId = "";
	var maxThreadsPerRequest = 25;
	var redditRequestIsRunning = false;
	var timeOfLastRedditRequest = 0;

	var hasReachedEnd = false;

	var loadMoreButtonTexts = {
		ERROR: "There was a problem. Try again.",
		LOAD_MORE: "Load more",
		LOADING: "Loading…",
		NO_THREADS: "There are no threads here :(",
		REACHED_END: "You reached the end"
	};

	$scope.loadMoreButtonText = loadMoreButtonTexts.LOADING;

	function main() {
		$scope.board = new Board("#board", ".board-column");

		if (!$scope.board) {
			$log.error("ThreadListController: Couldn't create board.");
			return;
		}

		$scope.board.rebuild($scope.retrieveThreadsFromReddit);
	};

	$scope.retrieveThreadsFromReddit = function() {
		if (redditRequestIsRunning) {
			$log.info("ThreadListController: Request to Reddit is already running or queued.");
			return;
		}

		if (hasReachedEnd) {
			$log.info("ThreadListController: You reached the end.");
			return;
		}

		$scope.loadMoreButtonText = loadMoreButtonTexts.LOADING;

		var now = Date.now();
		var minDelay = 2000;

		var difference = now - timeOfLastRedditRequest;
		var delay = difference > minDelay ? 0 : minDelay - difference;

		if (difference < minDelay) {
			$log.info("ThreadListController: Last request to Reddit was less than %d ms ago. Waiting %d ms until sending request.", minDelay, delay);
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
		var threadList = ThreadList.fromRedditThreadList(responseData) || new ThreadList();
		var threadListItems = threadList.items;
		var atLeastOneItemWasAddedToQueue = false;

		for (var i = 0, threadListItemCount = threadListItems.length; i < threadListItemCount; i++) {
			if (threadProcessor.addToQueue(threadListItems[i], angular.bind(this, handleProcessedSuccess, i))) {
				atLeastOneItemWasAddedToQueue = true;
			}
		}

		lastThreadId = threadList.lastThreadId;
		hasReachedEnd = !lastThreadId;
		redditRequestIsRunning = false;

		if (!atLeastOneItemWasAddedToQueue) {
			updateLoadMoreButtonLabel();
		}
	};

	function handleProcessedSuccess(i, thread, imageUrl) {
		var boardItem = new BoardItem(thread, imageUrl);
		var onCompleteCallback = function() {
			updateLoadMoreButtonLabel();
			loadMoreToFillPage();
		}

		$scope.board.addItem(boardItem, i * 20, false, onCompleteCallback);
	}

	var handleRedditRequestError = function(responseData, status, headers, config) {
		$log.info("ThreadListController: Error retrieving threads from Reddit.", responseData, status, headers, config);
		redditRequestIsRunning = false;
		$scope.loadMoreButtonText = loadMoreButtonTexts.ERROR;
	};

	function updateLoadMoreButtonLabel() {
		// If a request to Reddit is running or queued
		if (redditRequestIsRunning) {
			$scope.loadMoreButtonText = loadMoreButtonTexts.LOADING;
			return;
		}

		// If there are no further board items to add
		if ($scope.board.items.length === threadProcessor.threadDict.length) {
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

	$scope.selectSection = function(buttonIndex) {
		// TODO: Cancel running requests.

		var newSection = "";

		switch (buttonIndex) {
			case 0: newSection = ""; break;
			case 1: newSection = "new"; break;
			case 2: newSection = "rising"; break;
			case 3: newSection = "controversial"; break;
			case 4: newSection = "top"; break;
		}

		if (newSection === section) {
			$route.reload();
			return;
		}

		var url = (isDefaultPage ? "" : "/r/" + subredditIds.join("+")) + "/" + newSection
		$location.path(url);
	};

	$scope.handleScrollEvent = function(event) {
		loadMoreToFillPage();
	};

	function loadMoreToFillPage() {
		// Don't load any more threads from Reddit unless the last queued board
		// item has been added to the board.
		if ($scope.board.items.length !== threadProcessor.threadDict.length) {
			return;
		}

		var index = $scope.board.getIndexOfShortestColumn();

		if (index === null) {
			$log.warn("ThreadListController: handleScrollEvent: Index of shortest column is null.");
			return;
		}

		var windowElement = angular.element($window);
		var windowBottom = windowElement.scrollTop() + windowElement.height();

		var columnElement = jQuery($scope.board.columnElements[index]);
		var columnBottom = columnElement.offset().top + columnElement.height();

		if (columnBottom < windowBottom + Math.min(400, $scope.board.columns.length * 100)) {
			$scope.retrieveThreadsFromReddit();
		}
	}

	$scope.handleResizeEvent = function() {
		$scope.board.rebuild();
	};

	$scope.selectSubreddits = function() {
		$location.path("/subreddits/" + subredditIds.join("+"));
	};

	main();
}]);
