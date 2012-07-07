(function() {
	var exports = app.namespace("app.views.main");

	exports.createView = function() {
		return new View();
	};

	function View() {
		var loadMoreAnchorTextDefault1 = "Load images";
		var loadMoreAnchorTextDefault2 = "Load more";
		var loadMoreAnchorTextActive1 = "Retrieving data from Reddit&hellip;";
		var loadMoreAnchorTextActive2 = "Loading images&hellip;"

		// For keeping track of states
		var hasLoadedAnImage = false;
		var isWaitingForRedditResponse = false;
		var lastThreadId;
		var requestToReddit;

		var columnCount = 0;
		var images = [];

		// HTML elements
		var imageList;
		var loadMoreAnchor;

		/**
		 * calculateColumnCount returns the number of columns that can be
		 * displayed on the user's screen. Minimum number of columns is 0, this
		 * means not even one column can be displayed because it is too wide.
		 * @returns integer
		 */
		function calculateColumnCount() {
			var imageListWidth = $("image-list").getWidth();
			var imageListItemWidth = 328;

			return Math.floor(imageListWidth / imageListItemWidth);
		}

		// /**
		//  * calculateColumnHeights calculates the height of each column and
		//  * returns an array of integers where the first value belongs to the
		//  * first column, the second value to the second column and so on. If
		//  * there are no columns, the returned array is empty.
		//  * @returns array<integer>
		//  */
		// function calculateColumnHeights() {
		// 	var heights = [];
		// 	var columns = $$(".image-column");

		// 	if (!columns) {
		// 		return heights;
		// 	}

		// 	for (var i = 0, columnCount = columns.length; i < columnCount; i++) {
		// 		var height = columns[i].getHeigt();
		// 		console.log("height: " + height);

		// 		if (height) {
		// 			heights.push(height);
		// 		}
		// 	}

		// 	return heights;
		// }

		/**
		 * getShortestColumn returns the shortest column. If there are no
		 * columns, it returns null. If there are two or more columns with the
		 * same height, the first of them is returned.
		 * @returns columnElement|null
		 */
		function getShortestColumn() {
			var shortestColumn = null;
			var columns = $$(".image-column");

			if (!columns) {
				console.log("No columns found.");
				return shortestColumn;
			}

			for (var i = 0, columnCount = columns.length; i < columnCount; i++) {
				if (!shortestColumn) {
					shortestColumn = columns[i];
					break;
				}

				if (columns[i].getHeight() > shortestColumn.getHeight()) {
					shortestColumn = columns[i];
				}
			}

			return shortestColumn;
		}

		this.createInfoContainer = function() {
			var text = "You are seeing images from ";

			var subredditNames = app.extractSubredditNamesFromLocationHash(location.hash);

			if (subredditNames.length === 0) {
				subredditNames = app.config.core.getNamesOfDefaultSubreddits();
			}

			for (var i = 0, iMax = subredditNames.length; i < iMax; i++) {
				var prefix = ", ";

				if (i === 0) {
					prefix = " ";
				} else if (i === iMax - 1) {
					prefix = " and ";
				}

				text += prefix + "/r/" + subredditNames[i];
			}

			var element = new Element("div", {
				html: text
			});

			return element;
		};

		this.createImageColumnsContainer = function() {
			imageColumnsContainer = new Element("div", {
				id: "image-columns-container"
			});

			var imageColumnCount = calculateColumnCount();

			for (var i = 0; i < imageColumnCount; i++) {
				var imageColumn = createImageColumn();
				imageColumnsContainer.grab(imageColumn);
			}

			imageColumnsContainer.addEvent("click:relay(.image)", function(event, targetElement) {
				event.stop();
				window.open(targetElement.getProperty("data-original-src"), "_blank");
			});

			imageColumnsContainer.addEvent("click:relay(.comments-anchor)", function(event, targetElement) {
				event.stop();
				window.open(targetElement.getProperty("href"), "_blank");
			});

			imageColumnsContainer.addImageContainer = function(imageContainer) {
				var shortestColumn = getShortestColumn();

				if (!shortestColumn) {
					return;
				}

				shortestColumn.grab(imageContainer);
			};

			return imageColumnsContainer;
		};

		function createImageColumn() {
			var imageColumn = new Element("ul", {
				"class": "image-column"
			});

			return imageColumn;
		}

		function createImageContainer() {
			var imageContainer = new Element("li", {
				"class": "image-column-item"
			});

			var imageAnchor = createImageAnchor();
			imageContainer.grab(imageAnchor);

			var titleAnchor = createTitleAnchor();
			imageContainer.grab(titleAnchor);

			return imageContainer;
		}

		function createImageAnchor(image) {
			var imageAnchor = new Element("a", {
				"class": "image-anchor",
				href: image.src
			});

			var image = createImage();
			imageAnchor.grab(image);

			return imageAnchor;
		}

		function createImage(image) {
			var image = new Element("img", {
				"class": "image",
				"data-original-src": image.src,
				src: image.src,
			});

			return image;
		}

		function createTitleAnchor(thread) {
			var titleAnchor = new Element("a", {
				"class": "title-anchor",
				href: "http://www.reddit.com" + thread.permalink,
				html: thread.title,
			});

			return titleAnchor;
		}

		this.createLoadMoreAnchor = function() {
			loadMoreAnchor = new Element("a", {
				html: loadMoreAnchorTextDefault1,
				id: "load-more-anchor"
			});

			loadMoreAnchor.addEvent("click", function(event) {
				this.fillList();
				event.stop();
			}.bind(this));

			return loadMoreAnchor;
		};

		this.fillList = function() {
			if (requestToReddit) {
				requestToReddit.cancel();
			}

			requestToReddit = new Request.JSONP({
				callbackKey: "jsonp",
				onCancel: handleRequestCancelEvent,
				onComplete: handleRequestCompleteEvent,
				onRequest: handleRequestRequestEvent,
				onTimeout: handleRequestTimeoutEvent,
				timeout: 30000,
				url: getUrl()
			});

			requestToReddit.send();
		};

		function updateLoadMoreAnchor() {
			if (!loadMoreAnchor) {
				return;
			}

			var anchorText = loadMoreAnchorTextDefault1;

			if (isWaitingForRedditResponse) {
				anchorText = loadMoreAnchorTextActive1;
			} else if (hasLoadedAnImage) {
				anchorText = loadMoreAnchorTextDefault2;
			}

			loadMoreAnchor.set("html", anchorText);
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

		function handleRequestCancelEvent() {
			isWaitingForRedditResponse = false;
			updateLoadMoreAnchor();
		}

		function handleRequestCompleteEvent(response) {
			isWaitingForRedditResponse = false;

			var threads = response.data.children;

			for (var i = 0, iMax = threads.length; i < iMax; i++) {
				var url = threads[i].data.url;
				// var imgurImageHash = threads[i].data.url.match(/^http:\/\/(?:i\.)?imgur\.com\/([a-zA-Z0-9]+)/);

				// if (imgurImageHash) {
				// 	url = "http://i.imgur.com/" + imgurImageHash[1] + "m.jpg";
				// }

				// Load image
				var image = new Image();
				image.addEvent("error", handleImageErrorEvent.pass([threads[i].data]));
				image.addEvent("load", handleImageLoadEvent.pass([image, threads[i].data]));
				image.src = url;
			}

			lastThreadId = response.data.after;
			updateLoadMoreAnchor();
		}

		function handleRequestRequestEvent(event) {
			isWaitingForRedditResponse = true;
			updateLoadMoreAnchor();
		}

		function handleRequestTimeoutEvent(event) {
			console.log("timeout", arguments);
			isWaitingForRedditResponse = false;
			updateLoadMoreAnchor();
			alert("Panoptikos cannot retrieve data from Reddit because Reddit is slow or you are not connected to the Internet.");
		}

		function handleImageErrorEvent() {
			console.log("imageError", arguments);
		}

		function handleImageLoadEvent(image, thread) {
			if (!imageList) {
				return;
			}

			// Ignore Imgur's "Image does not exist" image
			// TODO: Find a way to make absolutely sure we are actually blocking Imgur's "Image does not exist" image and not a random image with the same dimensions.
			if (image.height === 81
					&& image.width === 161
					&& image.src.match(/^https?:\/\/i\.imgur\.com\//)) {
				console.log("Ignoring image: " + image.src);
				return;
			}

			var imageContainer = createImageContainer();
			imageColumnsContainer.addImageContainer(imageContainer);

			if (!hasLoadedAnImage) {
				hasLoadedAnImage = true;
				updateLoadMoreAnchor();
			}
		}
	};
})();
