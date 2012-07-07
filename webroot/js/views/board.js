(function() {
	var exports = app.namespace("app.views.board");

	/**
	 * createInstance returns a new instance of class Board.
	 * @param HTMLElement board Root element where all other markup is placed to create the board.
	 * @param integer columnWidth Width of a column in pixels. Used to calculate how many columns can be displayed.
	 * @param integer columnLeftMargin Margin between columns in pixels.
	 * @returns object Board
	 */
	exports.createInstance = function(board, columnWidth, columnLeftMargin) {
		return new Board(board, columnWidth, columnLeftMargin);
	};

	/**
	 * Class Board manages the display of images as well as some delegated click
	 * events.
	 * @param HTMLElement board Root element where all other markup is placed to create the board.
	 * @param integer columnWidth Width of a column in pixels. Used to calculate how many columns can be displayed.
	 * @param integer columnLeftMargin Margin between columns in pixels.
	 */
	function Board(board, columnWidth, columnLeftMargin) {
		var self = this;

		var columnCount;
		var columns = [];
		var images = [];
		var resizeTimeoutId;

		// For keeping track of states
		var hasLoadedAnImage = false;
		var isWaitingForRedditResponse = false;
		var lastThreadId;
		var requestToReddit;

		var columnIndex = -1;

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
			var newColumnCount = 0;

			if (columnWidth <= availableBoardWidth) {
				newColumnCount++;
				availableBoardWidth -= columnWidth;

				newColumnCount += Math.floor(availableBoardWidth / (columnWidth + columnLeftMargin));
			}

			if (newColumnCount === columnCount) {
				return;
			}

			columnCount = newColumnCount;
			columns = [];

			// Remove all children elements
			board.empty();

			for (i = 0; i < columnCount; i++) {
				var column = createColumn({
					// styles: {
					// 	"margin-left": i === 0 ? 0 : columnLeftMargin
					// }
				});
				columns.push(column);
				board.grab(column);
			}

			return board;
		};

		function createColumn(properties) {
			properties = properties || {};
			properties = Object.merge(properties, {
				"class": "board-column",
				// styles: {
				// 	"background-color": "orange",
				// 	display: "inline-block",
				// 	"min-height": 500,
				// 	width: columnWidth
				// }
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
			console.log("app.views.board.handleImgurRequestLoadEvent: " + image.width + "x" + image.height);
			handleImageLoadEvent(thread, image, fullsizeImageUrl);
		}

		function handleImageErrorEvent() {
			console.log("imageError", arguments);
		}

		function handleImageLoadEvent(thread, image, fullsizeImageUrl) {
			// Ignore Imgur's "Image does not exist" image
			// TODO: Find a way to make absolutely sure we are actually blocking Imgur's "Image does not exist" image and not a random image with the same dimensions.
			if (image.height === 81
					&& image.width === 161
					&& image.src.match(/^https?:\/\/i\.imgur\.com\//)) {
				console.log("Ignoring image: " + image.src);
				return;
			}

			if (columnIndex < 0 || columnIndex >= columns.length) {
				columnIndex = 0;
			}

			var boardItem = app.views.boardItem.createInstance();
			var boardItemElement = boardItem.create(thread, image, fullsizeImageUrl);

			columns[columnIndex].grab(boardItemElement);
			columnIndex++;

			if (!hasLoadedAnImage) {
				hasLoadedAnImage = true;
				updateLoadMoreAnchor();
			}
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
	};
})();
