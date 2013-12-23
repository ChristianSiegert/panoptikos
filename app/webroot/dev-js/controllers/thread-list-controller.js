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
		$scope.board = Board.New();

		if (!$scope.board) {
			$log.error("ThreadListController: Couldn't create Board.");
			return;
		}

		$scope.retrieveThreadsFromReddit();
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

	function handleRedditRequestSuccess(responseData, status, headers, config) {
		redditRequestIsRunning = false;
		var threadList = ThreadList.fromRedditThreadList(responseData) || new ThreadList();
		var threadListItems = threadList.items;
		var atLeastOneItemWasAddedToQueue = false;

		for (var i = 0, threadListItemCount = threadListItems.length; i < threadListItemCount; i++) {
			if (threadProcessor.addToQueue(threadListItems[i], handleProcessedSuccess)) {
				atLeastOneItemWasAddedToQueue = true;
			}
		}

		lastThreadId = threadList.lastThreadId;
		hasReachedEnd = !lastThreadId;

		if (!atLeastOneItemWasAddedToQueue) {
			updateLoadMoreButtonLabel();
		}
	};

	function handleProcessedSuccess(thread, imageUrl) {
		var boardItem = new BoardItem(thread, imageUrl);
		$scope.board.addItems([boardItem]);
	}

	function handleRedditRequestError(responseData, status, headers, config) {
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

	$scope.loadMoreToFillPage = function(boardIsScrolledToBottom) {
		// Don't load more threads from Reddit unless all but one board item
		// have been added to the board.
		if (!boardIsScrolledToBottom
				|| !$scope.board.items.length
				|| $scope.board.items.length < threadProcessor.threadDict.length - 1) {
			return;
		}

		$scope.retrieveThreadsFromReddit();
	}

	$scope.selectSubreddits = function() {
		$location.path("/subreddits/" + subredditIds.join("+"));
	};

	main();
}]);
