app.directive("board", ["$log", "$timeout", "$window", "BoardEventTypes", function($log, $timeout, $window, BoardEventTypes) {
	"use strict";

	function BoardElementManager() {
		this.board = null;
		this.boardElement = null;
		this.boardItemElements = [];
		this.columnElements = [];
		this.columnHeights = [];
		this.columnWidth = 0;
		this.isMultiReddit = false;
		this.marginBetweenColumns = 0;
		this.onDidAddItem = angular.noop;
		this.windowElement = angular.element($window);
	}

	BoardElementManager.New = function(boardElement, board, onDidAddItem, columnWidth, marginBetweenColumns, isMultiReddit) {
		if (!angular.isElement(boardElement)
				|| !angular.isObject(board)
				|| !angular.isFunction(onDidAddItem)
				|| !angular.isNumber(columnWidth)
				|| columnWidth === NaN
				|| !angular.isNumber(marginBetweenColumns)
				|| marginBetweenColumns === NaN
				|| (isMultiReddit !== true && isMultiReddit !== false)) {
			return null;
		}

		var boardElementManager = new BoardElementManager();
		boardElementManager.board = board;
		boardElementManager.boardElement = boardElement;
		boardElementManager.boardElement.attr("id", "board");
		boardElementManager.columnWidth = columnWidth;
		boardElementManager.isMultiReddit = isMultiReddit;
		boardElementManager.marginBetweenColumns = marginBetweenColumns;
		boardElementManager.onDidAddItem = onDidAddItem;

		return boardElementManager;
	};

	BoardElementManager.prototype.rebuildBoardElement = function() {
		var optimalColumnCount = this.getOptimalColumnCount();

		if (optimalColumnCount === this.columnElements.length) {
			return;
		}

		// Delete columns
		this.boardElement.empty();
		this.columnElements = [];
		this.columnHeights = [];

		// Create new columns
		for (var i = 0; i < optimalColumnCount; i++) {
			var columnElement = $(document.createElement("ul"));
			columnElement.attr("class", "board-column");

			this.columnElements.push(columnElement);
			this.columnHeights.push(0);
		}

		this.boardElement.append(this.columnElements);

		// Redistribute board item elements across columns
		this.distributeItems(this.boardItemElements);
	};

	/**
	 * updateBoardElement takes all newly added BoardItems that were added to
	 * Board, creates BoardItemElements from them and distributes the
	 * BoardItemElements across the columns of the <board> element.
	 */
	BoardElementManager.prototype.updateBoardElement = function() {
		var boardItemElements = [];
		var boardItems = this.board.getNewlyAddedItems();

		for (var i = 0, boardItemCount = boardItems.length; i < boardItemCount; i++) {
			var boardItemElement = this.boardItemElementFromBoardItem(boardItems[i]);
			boardItemElements.push(boardItemElement);
			this.boardItemElements.push(boardItemElement);
		}

		this.distributeItems(boardItemElements);
	};

	/**
	 * distributeItems distributes BoardItemElements across the columns of the
	 * <board> element by adding each BoardItemElement to the then shortest
	 * column.
	 */
	BoardElementManager.prototype.distributeItems = function(boardItemElements) {
		for (var i = 0, boardItemElementCount = boardItemElements.length; i < boardItemElementCount; i++) {
			var index = this.getIndexOfShortestColumn();

			if (index === null) {
				$log.error("Board directive: distributeItems: Index of shortest column is null.");
				return;
			}

			this.columnElements[index].append(boardItemElements[i]);
			this.columnHeights[index] = this.columnElements[index][0].offsetHeight;
		}

		this.onDidAddItem(this.isScrolledToBottom());
	};

	/**
	 * getOptimalColumnCount returns the number of columns that could be
	 * displayed.
	 * @return {number}
	 */
	BoardElementManager.prototype.getOptimalColumnCount = function() {
		return 1 + Math.max(
			Math.floor((this.boardElement.width() - this.columnWidth) / (this.columnWidth + this.marginBetweenColumns)),
			0
		);
	};

	BoardElementManager.prototype.getIndexOfShortestColumn = function() {
		var columnHeightCount = this.columnHeights.length;

		if (columnHeightCount === 0) {
			return null;
		}

		if (columnHeightCount === 1) {
			return 0;
		}

		var shortestColumnHeight = null;
		var shortestColumnIndex = null;

		for (var i = 0; i < columnHeightCount; i++) {
			if (shortestColumnHeight === null || this.columnHeights[i] < shortestColumnHeight) {
				shortestColumnHeight = this.columnHeights[i];
				shortestColumnIndex = i;
			}
		}

		return shortestColumnIndex;
	};

	BoardElementManager.prototype.boardItemElementFromBoardItem = function(boardItem) {
		var boardItemElement = $(document.createElement("li"));
		boardItemElement.attr("class", "board-item");

		if (boardItem.imageUrl) {
			var imageAnchorElement = $(document.createElement("a"));
			imageAnchorElement.attr("href", boardItem.thread.url);
			imageAnchorElement.attr("class", "board-item-image-anchor");
			boardItemElement.append(imageAnchorElement);

			var imageElement = $(document.createElement("img"));
			imageElement.attr("class", "board-item-image");
			imageElement.attr("src", boardItem.imageUrl);
			imageAnchorElement.append(imageElement);
		}

		var titleAnchorElement = $(document.createElement("a"));
		titleAnchorElement.attr("class", "board-item-title-anchor");
		titleAnchorElement.attr("href", boardItem.thread.url);
		titleAnchorElement.text(boardItem.thread.title);
		boardItemElement.append(titleAnchorElement);

		var infoElement = $(document.createElement("div"));
		infoElement.attr("class", "board-item-info");
		boardItemElement.append(infoElement);

		var commentsAnchorElement = $(document.createElement("a"));
		commentsAnchorElement.attr("class", "board-item-info-cell board-item-comments-anchor");
		commentsAnchorElement.attr("href", "http://www.reddit.com" + boardItem.thread.commentUrl);
		commentsAnchorElement.text(boardItem.thread.commentCount === 1 ? "1 Comment" : boardItem.thread.commentCount + " Comments");
		infoElement.append(commentsAnchorElement);

		if (this.isMultiReddit) {
			var subredditAnchorElement = $(document.createElement("a"));
			subredditAnchorElement.attr("class", "board-item-info-cell board-item-info-cell-right board-item-subreddit-anchor");
			subredditAnchorElement.attr("href", "/r/" + boardItem.thread.subredditName);
			subredditAnchorElement.text("/r/" + boardItem.thread.subredditName);
			infoElement.append(subredditAnchorElement);
		}

		return boardItemElement
	};

	BoardElementManager.prototype.isScrolledToBottom = function() {
		var index = this.getIndexOfShortestColumn();

		if (index === null) {
			$log.error("Board directive: isScrolledToBottom: Index of shortest column is null.");
			return false;
		}

		var columnElement = angular.element(this.columnElements[index]);
		var columnBottom = columnElement.offset().top + columnElement.height();
		var windowBottom = this.windowElement.scrollTop() + this.windowElement.height();

		return columnBottom < windowBottom + Math.min(400, this.columnElements.length * 100);
	};

	return {
		controller: ["$scope", function($scope) {
			$scope.openExternalLinksInNewTab = false;
		}],
		link: function(scope, element, attributes) {
			// Set up BoardElementManager
			var boardElementManager = BoardElementManager.New(
				element,
				scope.getServiceObject(),
				scope.getOnDidAddItem(),
				parseInt(attributes.boardColumnWidth, 10),
				parseInt(attributes.boardMarginBetweenColumns, 10),
				attributes.boardIsMultiReddit === "true"
			);

			if (!boardElementManager) {
				$log.error("Board directive: Could not create BoardElementManager.");
				return;
			}

			// Set up board element for the first time
			boardElementManager.rebuildBoardElement();
			var updateBoardElementBound = angular.bind(boardElementManager, boardElementManager.updateBoardElement);

			boardElementManager.board.addEventListener(
				BoardEventTypes.DID_ADD_ITEMS,
				updateBoardElementBound
			);

			scope.$on("$destroy", function() {
				boardElementManager.board.removeEventListener(
					BoardEventTypes.DID_ADD_ITEMS,
					updateBoardElementBound
				);
			});

			boardElementManager.updateBoardElement();

			// Observe attribute "board-open-external-links-in-new-tab"
			if (typeof(attributes.boardOpenExternalLinksInNewTab) !== "undefined") {
				attributes.$observe("boardOpenExternalLinksInNewTab", function(value) {
					scope.openExternalLinksInNewTab = value === "true";
				});
			}


			// Handle click events
			boardElementManager.boardElement.on("click", handleClickEvent);

			scope.$on("$destroy", function() {
				boardElementManager.boardElement.off("click", handleClickEvent);
			});

			function handleClickEvent(event) {
				if (!scope.openExternalLinksInNewTab) {
					return;
				}

				// If modified click, allow browser-specific behavior
				if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) {
					return;
				}

				var targetElement = $(event.target);

				if (targetElement.hasClass("board-item-image")) {
					targetElement = targetElement.parent();
				}

				if ((targetElement.hasClass("board-item-comments-anchor")
						|| targetElement.hasClass("board-item-image-anchor")
						|| targetElement.hasClass("board-item-title-anchor"))
						&& targetElement.attr("href")) {
					event.preventDefault();
					$window.open(targetElement.attr("href"));
					return;
				}
			}


			// Handle scroll events
			var scrollTimeoutPromise;

			var windowElement = angular.element($window);
			windowElement.on("scroll", handleScrollEvent);

			scope.$on("$destroy", function() {
				windowElement.off("scroll", handleScrollEvent);
			});

			function handleScrollEvent() {
				if (scrollTimeoutPromise) {
					$timeout.cancel(scrollTimeoutPromise);
				}

				scrollTimeoutPromise = $timeout(handleScrollEvent_, 100, false);
			}

			function handleScrollEvent_() {
				if (!boardElementManager.isScrolledToBottom()) {
					return;
				}

				var callback = scope.getOnDidScrollToBottom();

				if (angular.isFunction(callback)) {
					callback(boardElementManager.isScrolledToBottom());
				}
			}


			// Handle resize event
			var resizeTimeoutPromise;

			windowElement = angular.element($window);
			windowElement.on("resize", handleResizeEvent);

			scope.$on("$destroy", function() {
				windowElement.off("resize", handleResizeEvent);
			});

			function handleResizeEvent() {
				if (resizeTimeoutPromise) {
					$timeout.cancel(resizeTimeoutPromise);
				}

				resizeTimeoutPromise = $timeout(function() {
					boardElementManager.rebuildBoardElement();
				}, 100, false);
			}
		},
		restrict: "EA",
		scope: {
			getOnDidAddItem: "&boardOnDidAddItem",
			getOnDidScrollToBottom: "&boardOnDidScrollToBottom",
			getServiceObject: "&boardServiceObject"
		}
	};
}]);
