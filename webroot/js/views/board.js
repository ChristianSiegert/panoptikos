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
		var columnHeights = [];

		var boardItems = [];
		var resizeTimeoutId;

		/**
		 * True if Reddit can't deliver any more threads, false otherwise.
		 * @var boolean
		 */
		var hasReachedEnd = false;

		/**
		 * ID of the last Reddit thread that the HTTP response contained. Used
		 * to request threads that come afterwards.
		 * @var string
		 */
		var lastThreadId;

		/**
		 * Number of running requests.
		 * @var integer
		 */
		var runningRequestsCount = 0;

		/**
		 * <style> element that is injected into the document head with
		 * generated CSS that changes the board column widths, among other
		 * things.
		 * @var HTMLElement
		 */
		var styleElement;

		/**
		 * initialize adds event listeners to the window and board to handle the
		 * window resize event, some board click events and a custom app-wide
		 * event. Do not call this method more than once.
		 * @returns void
		 */
		self.initialize = function() {
			window.addEvent("app.views.boardControls.userDidAskForImages", handleUserDidAskForImagesEvent);
			window.addEvent("app.views.subredditPicker.userDidChangeSelectedSubreddits", handleUserDidChangeSelectedSubredditsEvent);
			window.addEvent("resize", handleWindowResizeEvent);
			board.addEvent("click:relay(.board-item-image-anchor)", handleBoardItemImageAnchorClickEvent);
			board.addEvent("click:relay(.board-item-title-anchor)", handleBoardItemTitleAnchorClickEvent);

			if (Browser.ie) {
				loadStylesheet("css/board-item-ie.css");
			}
		};

		function reset() {
			columnCount = null;
			columnWidth = null;

			columns = [];
			columnHeights = [];

			boardItems = [];
			lastThreadId = "";
			runningRequestsCount = 0;
		}

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
			if (resizeTimeoutId) {
				clearTimeout(resizeTimeoutId);
			}

			resizeTimeoutId = self.rebuild.delay(10);
		}

		/**
		 * rebuild calculates how many columns can be displayed, adjusts the
		 * column size, and if necessary empties the board and creates new
		 * columns that are filled with board items.
		 * @returns HTMLElement
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

			// If we show the same number of columns as before, don't rebuild the board
			if (newColumnCount === columnCount) {
				return;
			}

			columnCount = newColumnCount;

			// Reset variables
			columns = [];
			columnHeights = [];

			// Remove all columns
			board.empty();

			// Create new columns
			for (var i = 0; i < columnCount; i++) {
				var column = createColumn();
				columns.push(column);
				columnHeights.push(0);
				board.grab(column);
			}

			app.console.log("app.views.board.rebuild: Rebuilding board with %d images.", boardItems.length);

			// Fill columns with previously fetched images, if any.
			for (var i = 0, boardItemCount = boardItems.length; i < boardItemCount; i++) {
				addBoardItemToBoard(boardItems[i]);
			}

			return board;
		};

		function createColumn() {
			var column = new Element("div", {
				"class": "board-column"
			});

			return column;
		}

		function getUrl() {
			url = "http://www.reddit.com/r/" + app.models.subreddit.getSelectedSubreddits().join("+") + ".json?limit=25";

			if (lastThreadId) {
				url += "&after=" + lastThreadId;
			}

			return url;
		}

		function handleUserDidAskForImagesEvent() {
			if (hasReachedEnd) {
				return;
			}

			var requestToReddit = new Request.JSONP({
				callbackKey: "jsonp",
				onCancel: handleRedditRequestCancelEvent,
				onComplete: handleRedditRequestCompleteEvent,
				onTimeout: handleRedditRequestTimeoutEvent,
				timeout: app.config.core.network.timeout,
				url: getUrl()
			});

			runningRequestsCount++;
			requestToReddit.send();
		}

		function handleRedditRequestCancelEvent() {
			runningRequestsCount--;
			window.fireEvent("app.views.board.didCompleteRequest", {runningRequestsCount: runningRequestsCount});
		}

		function handleRedditRequestCompleteEvent(response) {
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

					runningRequestsCount++;
					image.src = url;
					continue;
				}

				// Load image
				var image = new Image();
				image.addEvent("error", handleImageErrorEvent.pass([threads[i].data]));
				image.addEvent("load", handleImageLoadEvent.pass([threads[i].data, image]));

				runningRequestsCount++;
				image.src = url;
			}

			lastThreadId = response.data.after;

			if (!lastThreadId) {
				hasReachedEnd = true;
			}

			runningRequestsCount--;
			window.fireEvent("app.views.board.didCompleteRequest", {
				hasReachedEnd: hasReachedEnd,
				runningRequestsCount: runningRequestsCount
			});
		}

		function handleRedditRequestTimeoutEvent(event) {
			app.console.log("timeout", arguments);
			runningRequestsCount--;
			window.fireEvent("app.views.board.didCompleteRequest", {runningRequestsCount: runningRequestsCount});
			alert("Panoptikos cannot retrieve data from Reddit because Reddit is slow or you are not connected to the Internet.");
		}

		function handleImgurRequestErrorEvent(thread) {
			app.console.log("app.views.board.handleImgurRequestErrorEvent:", thread)
			runningRequestsCount--;
			window.fireEvent("app.views.board.didCompleteRequest", {runningRequestsCount: runningRequestsCount});
		}

		function handleImgurRequestLoadEvent(thread, image, fullsizeImageUrl) {
			handleImageLoadEvent(thread, image, fullsizeImageUrl);
		}

		function handleImageErrorEvent() {
			app.console.log("app.views.board.handleImageErrorEvent:", arguments);
			runningRequestsCount--;
			window.fireEvent("app.views.board.didCompleteRequest", {runningRequestsCount: runningRequestsCount});
		}

		function handleImageLoadEvent(thread, image, fullsizeImageUrl) {
			// Ignore Imgur's "Image does not exist" image
			// TODO: Find a way to make absolutely sure we are actually blocking Imgur's "Image does not exist" image and not a random image with the same dimensions.
			if (image.height === 81
					&& image.width === 161
					&& image.src.match(/^https?:\/\/i\.imgur\.com\//)) {
				app.console.log("app.views.board.handleImageLoadEvent: Ignoring image: " + image.src);

				runningRequestsCount--;
				window.fireEvent("app.views.board.didCompleteRequest", {
					runningRequestsCount: runningRequestsCount
				});
				return;
			}

			var boardItem = app.views.boardItem.createInstance();
			var boardItemElement = boardItem.create(thread, image, fullsizeImageUrl);

			boardItems.push(boardItemElement);
			addBoardItemToBoard(boardItemElement);

			runningRequestsCount--;
			window.fireEvent("app.views.board.didCompleteRequest", {
				hasLoadedAnImage: true,
				runningRequestsCount: runningRequestsCount
			});
		}

		/**
		 * addBoardItemToBoard adds the board item to the shortest column.
		 * @returns void
		 */
		function addBoardItemToBoard(boardItem) {
			var columnIndex = getIndexOfShortestColumn(columnHeights);

			if (columnIndex === null || !columns || !columns[columnIndex]) {
				return;
			}

			columns[columnIndex].grab(boardItem);
			columnHeights[columnIndex] = columns[columnIndex].getHeight();
		}

		/**
		 * getIndexOfShortestColumn returns the index of the shortest column, or
		 * null if there are no columns.
		 * @param array<integer> columnHeights Array of integers.
		 * @returns integer
		 */
		function getIndexOfShortestColumn(columnHeights) {
			var shortestColumnHeight = null;
			var shortestColumnIndex = null;

			for (var i = 0, columnHeightsCount = columnHeights.length; i < columnHeightsCount; i++) {
				if (shortestColumnHeight === null) {
					shortestColumnHeight = columnHeights[i];
					shortestColumnIndex = i;
					continue;
				}

				if (shortestColumnHeight > columnHeights[i]) {
					shortestColumnHeight = columnHeights[i];
					shortestColumnIndex = i;
				}
			}

			return shortestColumnIndex;
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

		/**
		 * loadStylesheet injects a <link> element into the document head which
		 * causes the browser to load the specified stylesheet.
		 * @param string url URL to the stylesheet to load.
		 * @returns void
		 */
		function loadStylesheet(url) {
			var element = new Element("link", {
				href: url,
				rel: "stylesheet",
				type: "text/css"
			});

			$(document.head).grab(element);
		}

		function handleUserDidChangeSelectedSubredditsEvent() {
			reset();
			self.rebuild();
			handleUserDidAskForImagesEvent();
		}
	};
})();
