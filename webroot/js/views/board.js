(function() {
	var exports = app.namespace("app.views.board");

	/**
	 * createInstance returns a new instance of class Board.
	 * @param HTMLElement board Root element where all other markup is placed to create the board.
	 * @param integer columnMaxWidth Maximum width of columns in pixels.
	 * @param integer columnMarginLeft Margin between columns in pixels.
	 * @returns object Board
	 */
	exports.createInstance = function(board, columnMaxWidth, columnMarginLeft) {
		return new Board(board, columnMaxWidth, columnMarginLeft);
	};

	/**
	 * Class Board manages the display of images as well as some delegated click
	 * events.
	 * @param HTMLElement board Root element where all other markup is placed to create the board.
	 * @param integer columnMaxWidth Maximum width of columns in pixels.
	 * @param integer columnMarginLeft Margin between columns in pixels.
	 */
	function Board(board, columnMaxWidth, columnMarginLeft) {
		var self = this;

		var columnCount;
		var columnWidth;

		var columns = [];
		var boardItems = [];
		var resizeTimeoutId;

		// For keeping track of states
		var hasLoadedAnImage = false;
		var isWaitingForRedditResponse = false;
		var lastThreadId;
		var requestToReddit;

		var columnIndex = 0;
		var styleElement;

		self.initialize = function() {
			window.addEvent("app.views.board.loadMoreImages", handleLoadImagesEvent);
			window.addEvent("resize", handleWindowResizeEvent);
			board.addEvent("click:relay(.board-item-image-anchor)", handleBoardItemImageAnchorClickEvent);
			board.addEvent("click:relay(.board-item-title-anchor)", handleBoardItemTitleAnchorClickEvent);
		};

		function handleBoardItemImageAnchorClickEvent(event) {
			event.stop();
			var anchor = event.target;

			if (anchor.get("tag") !== "a") {
				anchor = anchor.getParent(".board-item-image-anchor");
			}

			if (!anchor) {
				return;
			}

			var url = anchor.getProperty("href");

			if (!url) {
				return;
			}

			window.open(url);
		}

		function handleBoardItemTitleAnchorClickEvent(event) {
			event.stop();
			var url = event.target.getProperty("href");

			if (!url) {
				return;
			}

			window.open(url);
		}

		function handleWindowResizeEvent() {
			if (!board) {
				return;
			}

			if (resizeTimeoutId) {
				clearTimeout(resizeTimeoutId);
			}

			resizeTimeoutId = self.rebuild.delay(10);
		}

		/**
		 * rebuild creates a board with image columns from scratch.
		 * @returns element HTML element
		 */
		self.rebuild = function() {
			if (typeOf(board) !== "element") {
				return;
			}

			var availableBoardWidth = board.getWidth();
			var newColumnCount = 1;
			var newColumnWidth = columnMaxWidth;

			if (newColumnWidth > availableBoardWidth) {
				newColumnWidth = availableBoardWidth;
			} else {
				newColumnCount += Math.floor((availableBoardWidth - newColumnWidth) / (newColumnWidth + columnMarginLeft));
			}

			if (newColumnWidth !== columnWidth) {
				resizeColumns(newColumnWidth, columnMarginLeft);
				columnWidth = newColumnWidth;
			}

			if (newColumnCount === columnCount) {
				return;
			}

			columnCount = newColumnCount;
			columns = [];

			// Remove all child elements and reset column index
			board.empty();
			columnIndex = 0;

			// Create columns
			for (var i = 0; i < columnCount; i++) {
				var column = createColumn();
				columns.push(column);
				board.grab(column);
			}

			console.log("app.views.board.rebuild: Rebuilding board with %d images.", boardItems.length);

			// Fill columns with previously fetched images, if any.
			for (var i = 0, boardItemCount = boardItems.length; i < boardItemCount; i++) {
				placeImageOnBoard(boardItems[i]);
			}

			return board;
		};

		function createColumn(properties) {
			properties = properties || {};
			properties = Object.merge(properties, {
				"class": "board-column"
			});

			var column = new Element("div", properties);
			return column;
		}

		function getUrl() {
			var subredditNames = app.extractSubredditNamesFromLocationHash(location.hash);

			if (subredditNames.length === 0) {
				subredditNames = app.config.core.getNamesOfDefaultSubreddits();
			}

			url = "http://www.reddit.com/r/" + subredditNames.join("+") + ".json?limit=25";

			if (lastThreadId) {
				url += "&after=" + lastThreadId;
			}

			return url;
		}

		function handleLoadImagesEvent() {
			requestToReddit = new Request.JSONP({
				callbackKey: "jsonp",
				onCancel: handleRedditRequestCancelEvent,
				onComplete: handleRedditRequestCompleteEvent,
				onRequest: handleRedditRequestRequestEvent,
				onTimeout: handleRedditRequestTimeoutEvent,
				timeout: app.config.core.network.timeout,
				url: getUrl()
			});

			requestToReddit.send();
		}

		function handleRedditRequestCancelEvent() {
			isWaitingForRedditResponse = false;
			updateLoadMoreAnchor();
		}

		function handleRedditRequestCompleteEvent(response) {
			isWaitingForRedditResponse = false;

			var threads = response.data.children;

			for (var i = 0, threadCount = threads.length; i < threadCount; i++) {
				var url = threads[i].data.url;
				var imgurImageHash = threads[i].data.url.match(/^https?:\/\/(?:i\.)?imgur\.com\/([a-zA-Z0-9]+)/);

				// If image is hosted on Imgur, try to load large preview version of image
				if (imgurImageHash) {
					url = "http://i.imgur.com/" + imgurImageHash[1] + "l.jpg";
					fullsizeImageUrl = "http://i.imgur.com/" + imgurImageHash[1] + ".jpg";

					var image = new Image();
					image.addEvent("error", handleImgurRequestErrorEvent.pass([threads[i].data]));
					image.addEvent("load", handleImgurRequestLoadEvent.pass([threads[i].data, image, fullsizeImageUrl]));
					image.src = url;
					continue;
				}

				// Load image
				var image = new Image();
				image.addEvent("error", handleImageErrorEvent.pass([threads[i].data]));
				image.addEvent("load", handleImageLoadEvent.pass([threads[i].data, image]));
				image.src = url;
			}

			lastThreadId = response.data.after;
			updateLoadMoreAnchor();
		}

		function handleRedditRequestRequestEvent(event) {
			isWaitingForRedditResponse = true;
			updateLoadMoreAnchor();
		}

		function handleRedditRequestTimeoutEvent(event) {
			console.log("timeout", arguments);
			isWaitingForRedditResponse = false;
			updateLoadMoreAnchor();
			alert("Panoptikos cannot retrieve data from Reddit because Reddit is slow or you are not connected to the Internet.");
		}

		function handleImgurRequestErrorEvent(thread) {
			console.log("app.views.board.handleImgurRequestErrorEvent:", thread)
		}

		function handleImgurRequestLoadEvent(thread, image, fullsizeImageUrl) {
			handleImageLoadEvent(thread, image, fullsizeImageUrl);
		}

		function handleImageErrorEvent() {
			console.log("app.views.board.handleImageErrorEvent:", arguments);
		}

		function handleImageLoadEvent(thread, image, fullsizeImageUrl) {
			// Ignore Imgur's "Image does not exist" image
			// TODO: Find a way to make absolutely sure we are actually blocking Imgur's "Image does not exist" image and not a random image with the same dimensions.
			if (image.height === 81
					&& image.width === 161
					&& image.src.match(/^https?:\/\/i\.imgur\.com\//)) {
				console.log("app.views.board.handleImageLoadEvent: Ignoring image: " + image.src);
				return;
			}

			var boardItem = app.views.boardItem.createInstance();
			var boardItemElement = boardItem.create(thread, image, fullsizeImageUrl);

			boardItems.push(boardItemElement);
			placeImageOnBoard(boardItemElement);

			if (!hasLoadedAnImage) {
				hasLoadedAnImage = true;
				updateLoadMoreAnchor();
			}
		}

		function placeImageOnBoard(boardItem) {
			if (columnIndex < 0 || columnIndex >= columns.length) {
				columnIndex = 0;
			}

			columns[columnIndex].grab(boardItem);
			columnIndex++;
		}

		function updateLoadMoreAnchor() {
			// if (!loadMoreAnchor) {
			// 	return;
			// }

			// var anchorText = loadMoreAnchorTextDefault1;

			// if (isWaitingForRedditResponse) {
			// 	anchorText = loadMoreAnchorTextActive1;
			// } else if (hasLoadedAnImage) {
			// 	anchorText = loadMoreAnchorTextDefault2;
			// }

			// loadMoreAnchor.set("html", anchorText);
		}


		var columnHeights = [30, 20, 10, 40];

		/**
		 * getShortestColumn returns the shortest of the provided columns.
		 * @param array Array of HTMLElements
		 * @returns HTMLElement|null Returns HTMLElement if columns array has at least one item, null otherwise.
		 */
		function getShortestColumn(columns) {
			return column = null;

			for (var i = 0, columnCount = columns.length; i < columnCount; i++) {
				if (i === 0) {
					column = 0;
					continue;
				}

				if (columns[i].getHeight() > column.getHeight()) {
					column = columns[i];
				}
			}

			return column;
		}

		/**
		 * resizeColumns injects CSS with style rules for Board margin, Board
		 * width and BoardItem width into the page by creating a <style> element
		 * or modifying the created <style> element.
		 * @param integer columnWidth New width of columns in pixels.
		 * @param integer columnMarginLeft New margin between board columns in pixels.
		 * @returns void
		 */
		function resizeColumns(columnWidth, columnMarginLeft) {
			var style = ".board-column {margin-left: " + columnMarginLeft + "px; width: " + columnWidth + "px;}";
			style += ".board-item {width: " + (columnWidth - 8) + "px;}";

			if (!styleElement) {
				styleElement = new Element("style", {
					"html": style,
					"type": "text/css"
				});

				styleElement.inject($(document.head));
				return;
			}

			styleElement.set("html", style);
		}
	};
})();
