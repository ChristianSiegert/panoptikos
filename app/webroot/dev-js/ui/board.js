goog.provide("panoptikos.ui.Board");
goog.provide("panoptikos.ui.Board.EventType");
goog.provide("panoptikos.ui.BoardEvent");

goog.require("panoptikos.models.subreddit");
goog.require("panoptikos.ui.BoardControls.EventType");
goog.require("panoptikos.ui.BoardItem");
goog.require("goog.debug.Logger");
goog.require("goog.dom");
goog.require("goog.events.EventTarget");
goog.require("goog.net.Jsonp");
goog.require("goog.Uri");
goog.require("goog.userAgent");

/**
 * Class Board manages the display of images as well as some delegated click
 * events.
 * @param {number} columnMaxWidth Maximum width of columns in pixels.
 * @param {number} columnMarginLeft Margin between columns in pixels.
 * @param {number} maxThreadsPerRequest Maximum number of threads to retrieve from Reddit per request.
 * @constructor
 * @extends goog.events.EventTarget
 */
panoptikos.ui.Board = function(columnMaxWidth, columnMarginLeft, maxThreadsPerRequest) {
	/**
	 * @type {!Element}
	 * @private
	 */
	this.boardElement_ = this.createBoardElement_();

	/**
	 * @type {!Array.<!Element>}
	 * @private
	 */
	this.boardItems_ = [];

	/**
	 * @type {number}
	 * @private
	 */
	this.columnCount_ = 0;

	/**
	 * @type {!Array.<number>}
	 * @private
	 */
	this.columnHeights_ = [];

	/**
	 * The margin between two columns.
	 * @type {number}
	 * @private
	 */
	this.columnMarginLeft_ = columnMarginLeft;

	/**
	 * @type {number}
	 * @private
	 */
	this.columnMaxWidth_ = columnMaxWidth;

	/**
	 * @type {!Array}
	 * @private
	 */
	this.columns_ = [];

	/**
	 * @type {number}
	 * @private
	 */
	this.columnWidth_ = 0;

	/**
	 * Whether at least one image has been loaded already.
	 * @type {boolean}
	 * @private
	 */
	this.hasLoadedFirstImage_ = false;

	/**
	 * Whether the last thread has been reached.
	 * @type {boolean}
	 * @private
	 */
	this.hasReachedEnd_ = false;

	/**
	 * ID of the last Reddit thread that the HTTP response contained. Used to
	 * request threads that come afterwards.
	 * @type {string}
	 * @private
	 */
	this.lastThreadId_ = "";

	/**
	 * @type {!goog.debug.Logger}
	 * @private
	 */
	this.logger_ = goog.debug.Logger.getLogger("panoptikos.ui.Board");

	/**
	 * Maximum number of threads to retrieve from Reddit per request.
	 * @type {number}
	 * @private
	 */
	this.maxThreadsPerRequest_ = maxThreadsPerRequest;

	/**
	 * Number of milliseconds until a request times out.
	 * @type {number}
	 * @private
	 */
	this.requestTimeout_ = 30000;

	/**
	 * @type {number}
	 * @private
	 */
	this.resizeTimeoutId_;

	/**
	 * Number of running requests.
	 * @type {number}
	 * @private
	 */
	this.runningRequestsCount_ = 0;

	/**
	 * <style> element that is injected into the document head with generated
	 * CSS that changes the board column widths, among other things.
	 * @type {Element}
	 * @private
	 */
	this.styleElement_;

	goog.events.listen(
		window,
		goog.events.EventType.RESIZE,
		this.handleWindowResizeEvent_,
		false,
		this
	);

	goog.events.listen(
		this.boardElement_,
		goog.events.EventType.CLICK,
		this.handleBoardClickEvent_,
		false,
		this
	);

	if (goog.userAgent.IE) {
		this.loadStylesheet_("board-item-ie.css");
	}
};
goog.inherits(panoptikos.ui.Board, goog.events.EventTarget);

/**
 * @private
 */
panoptikos.ui.Board.prototype.reset_ = function() {
	this.columnCount_ = 0;
	this.columnWidth_ = 0;

	this.columns_ = [];
	this.columnHeights_ = [];

	this.boardItems_ = [];
	this.lastThreadId_ = "";
	this.runningRequestsCount_ = 0;
};

/**
 * @param {!goog.events.BrowserEvent} event
 * @private
 */
panoptikos.ui.Board.prototype.handleBoardClickEvent_ = function(event) {
	// If modified click, allow browser-specific behavior
	if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) {
		return;
	}

	event.preventDefault();

	if (event.target.className === "board-item-title-anchor"
			&& event.target.hasAttribute("href")) {
		window.open(event.target.getAttribute("href"));
		return;
	}

	if (event.target.className === "board-item-image") {
		event.target = goog.dom.getParentElement(event.target);
	}

	if (event.target.className === "board-item-image-anchor"
			&& event.target.hasAttribute("href")) {
		window.open(event.target.getAttribute("href"));
		return;
	}
};

/**
 * @private
 */
panoptikos.ui.Board.prototype.handleWindowResizeEvent_ = function() {
	clearTimeout(this.resizeTimeoutId_);
	this.resizeTimeoutId_ = goog.global.setTimeout(goog.bind(this.rebuild, this), 10);
};

/**
 * rebuild calculates how many columns can be displayed, adjusts the column
 * size, and if necessary empties the board and creates new columns that are
 * filled with panoptikos.ui.BoardItem items.
 */
panoptikos.ui.Board.prototype.rebuild = function() {
	var availableBoardWidth = this.boardElement_.offsetWidth;
	var newColumnCount = 1;
	var newColumnWidth = this.columnMaxWidth_;

	if (availableBoardWidth < newColumnWidth) {
		newColumnWidth = availableBoardWidth;
	} else {
		newColumnCount += Math.floor((availableBoardWidth - newColumnWidth) / (newColumnWidth + this.columnMarginLeft_));
	}

	if (this.columnWidth_ !== newColumnWidth) {
		this.columnWidth_ = newColumnWidth;
		this.resizeColumns();
	}

	// If we show the same number of columns as before, don't rebuild the board
	if (newColumnCount === this.columnCount_) {
		return;
	}

	this.columnCount_ = newColumnCount;

	// Reset variables
	this.columns_ = [];
	this.columnHeights_ = [];

	// Remove all columns
	goog.dom.removeChildren(this.boardElement_);

	// Create new columns
	for (var i = 0; i < this.columnCount_; i++) {
		var column = this.createColumn_();
		this.columns_.push(column);
		this.columnHeights_.push(0);
		goog.dom.appendChild(this.boardElement_, column);
	}

	this.logger_.info("Rebuilding board with " + this.boardItems_.length + " images.");

	// Fill columns with previously fetched images, if any.
	for (var i = 0, boardItemCount = this.boardItems_.length; i < boardItemCount; i++) {
		this.addBoardItemToBoard_(this.boardItems_[i]);
	}
};

/**
 * @return {!Element}
 * @private
 */
panoptikos.ui.Board.prototype.createBoardElement_ = function() {
	var element = goog.dom.createDom("div", {
		id: "board"
	});

	return element;
};

/**
 * @return {!Element} Board element.
 */
panoptikos.ui.Board.prototype.getElement = function() {
	return this.boardElement_;
};

/**
 * @private
 * @return {!Element}
 */
panoptikos.ui.Board.prototype.createColumn_ = function() {
	return goog.dom.createDom("div", "board-column");
};

/**
 * @private
 */
panoptikos.ui.Board.prototype.getRedditRequestUri_ = function() {
	var uri = new goog.Uri("http://www.reddit.com/r/" + panoptikos.models.subreddit.getSelectedSubreddits().join("+") + ".json");
	uri.setParameterValue("after", this.lastThreadId_);
	uri.setParameterValue("limit", this.maxThreadsPerRequest_);
	return uri;
};

panoptikos.ui.Board.prototype.retrieveThreadsFromReddit = function() {
	if (this.hasReachedEnd_) {
		return;
	}

	// Prevent parallel requests
	if (this.runningRequestsCount_ > 0) {
		return;
	}

	this.runningRequestsCount_++;

	var request = new goog.net.Jsonp(this.getRedditRequestUri_(), "jsonp");
	request.setRequestTimeout(this.requestTimeout_);
	request.send(
		null,
		goog.bind(this.handleRedditRequestSuccessEvent_, this),
		goog.bind(this.handleRedditRequestErrorEvent_, this)
	);
};

/**
 * @param {!Object} response
 * @private
 */
panoptikos.ui.Board.prototype.handleRedditRequestSuccessEvent_ = function(response) {
	var threads = response["data"]["children"];

	for (var i = 0, threadCount = threads.length; i < threadCount; i++) {
		var url = threads[i]["data"]["url"];
		var imgurImageHash = threads[i]["data"]["url"].match(/^https?:\/\/(?:i\.)?imgur\.com\/([a-zA-Z0-9]+)/);

		// If image is hosted on Imgur, try to load large preview version of image
		if (imgurImageHash) {
			url = "http://i.imgur.com/" + imgurImageHash[1] + "l.jpg";
			var fullsizeImageUrl = "http://i.imgur.com/" + imgurImageHash[1] + ".jpg";

			var image = new Image();
			goog.events.listen(image, "error", goog.bind(this.handleImgurRequestErrorEvent_, this, [threads[i]["data"]]), false, this);
			goog.events.listen(image, "load", goog.bind(this.handleImgurRequestLoadEvent_, this, threads[i]["data"], image, fullsizeImageUrl), false, this);

			this.runningRequestsCount_++;
			image.src = url;
			continue;
		}

		// Load image
		var image = new Image();
		goog.events.listen(image, "error", goog.bind(this.handleImageErrorEvent_, this, threads[i]["data"]));
		goog.events.listen(image, "load", goog.bind(this.handleImageLoadEvent_, this, threads[i]["data"], image, image.src));

		this.runningRequestsCount_++;
		image.src = url;
	}

	this.lastThreadId_ = response["data"]["after"];

	if (!this.lastThreadId_) {
		this.hasReachedEnd_ = true;
	}

	this.runningRequestsCount_--;
	this.dispatchDidCompleteRequestEvent_();
};

/**
 * @private
 */
panoptikos.ui.Board.prototype.handleRedditRequestErrorEvent_ = function(event) {
	this.runningRequestsCount_--;
	this.dispatchDidCompleteRequestEvent_();
	alert("Panoptikos cannot retrieve data from Reddit because Reddit is slow or you are not connected to the Internet.");
};

/**
 * @param {!Object} thread
 * @private
 */
panoptikos.ui.Board.prototype.handleImgurRequestErrorEvent_ = function(thread) {
	this.runningRequestsCount_--;
	this.dispatchDidCompleteRequestEvent_();
};

/**
 * @param {!Object} thread Reddit thread.
 * @param {!HTMLImageElement} image
 * @param {string} fullsizeImageUrl
 * @private
 */
panoptikos.ui.Board.prototype.handleImgurRequestLoadEvent_ = function(thread, image, fullsizeImageUrl) {
	this.handleImageLoadEvent_(thread, image, fullsizeImageUrl);
};

/**
 * @private
 */
panoptikos.ui.Board.prototype.handleImageErrorEvent_ = function() {
	this.runningRequestsCount_--;
	this.dispatchDidCompleteRequestEvent_();
};

/**
 * @param {!Object} thread Reddit thread.
 * @param {!HTMLImageElement} image
 * @param {string} fullsizeImageUrl
 * @private
 */
panoptikos.ui.Board.prototype.handleImageLoadEvent_ = function(thread, image, fullsizeImageUrl) {
	// Ignore Imgur's "Image does not exist" image
	// TODO: Find a way to make absolutely sure we are actually blocking Imgur's
	// "Image does not exist" image and not a random image with the same dimensions.
	if (image.height === 81
			&& image.width === 161
			&& /^https?:\/\/i\.imgur\.com\//.test(image.src)) {
		this.logger_.fine('Ignoring Imgur’s “Image does not exist” image: ' + image.src);

		this.runningRequestsCount_--;
		this.dispatchDidCompleteRequestEvent_();
		return;
	}

	var boardItem = new panoptikos.ui.BoardItem(thread, image, fullsizeImageUrl);
	var boardItemElement = boardItem.createDom();

	this.boardItems_.push(boardItemElement);
	this.addBoardItemToBoard_(boardItemElement);

	this.runningRequestsCount_--;
	this.hasLoadedFirstImage_ = true;
	this.dispatchDidCompleteRequestEvent_();
};

/**
 * addBoardItemToBoard_ adds the board item to the shortest column.
 * @param {!Element} boardItemElement
 * @private
 */
panoptikos.ui.Board.prototype.addBoardItemToBoard_ = function(boardItemElement) {
	var columnIndex = this.getIndexOfShortestColumn_();

	if (columnIndex === null || !this.columns_ || !this.columns_[columnIndex]) {
		return;
	}

	goog.dom.appendChild(this.columns_[columnIndex], boardItemElement);
	this.columnHeights_[columnIndex] = this.columns_[columnIndex].offsetHeight;
};

/**
 * getIndexOfShortestColumn_ returns the index of the shortest column, or null
 * if there are no columns.
 * @return {?number}
 * @private
 */
panoptikos.ui.Board.prototype.getIndexOfShortestColumn_ = function() {
	var shortestColumnHeight = null;
	var shortestColumnIndex = null;

	for (var i = 0, columnHeightsCount = this.columnHeights_.length; i < columnHeightsCount; i++) {
		if (shortestColumnHeight === null) {
			shortestColumnHeight = this.columnHeights_[i];
			shortestColumnIndex = i;
			continue;
		}

		if (shortestColumnHeight > this.columnHeights_[i]) {
			shortestColumnHeight = this.columnHeights_[i];
			shortestColumnIndex = i;
		}
	}

	return shortestColumnIndex;
};

/**
 * resizeColumns injects CSS with style rules for Board margin, Board width and
 * BoardItem width into the page by creating a <style> element or modifying the
 * created <style> element.
 */
panoptikos.ui.Board.prototype.resizeColumns = function() {
	var style = ".board-column {margin-left: " + this.columnMarginLeft_ + "px; width: " + this.columnWidth_ + "px;}";
	style += ".board-item {width: " + (this.columnWidth_ - 8) + "px;}";

	if (!this.styleElement_) {
		this.styleElement_ = goog.dom.createDom("style", {
			"type": "text/css"
		});
		this.styleElement_.innerHTML = style;

		goog.dom.appendChild(document.head, this.styleElement_);
		return;
	}

	this.styleElement_.innerHTML = style;
};

/**
 * loadStylesheet_ injects a <link> element into the document head which causes
 * the browser to load the specified stylesheet.
 * @param {string} url URL to the stylesheet to load.
 * @private
 */
panoptikos.ui.Board.prototype.loadStylesheet_ = function(url) {
	var element = goog.dom.createDom("link", {
		href: url,
		rel: "stylesheet",
		type: "text/css"
	});

	goog.dom.appendChild(document.head, element);
};

panoptikos.ui.Board.prototype.handleUserDidChangeSelectedSubredditsEvent = function() {
	this.reset_();
	this.rebuild();
	this.retrieveThreadsFromReddit();
};

/**
 * @private
 */
panoptikos.ui.Board.prototype.dispatchDidCompleteRequestEvent_ = function() {
	this.dispatchEvent(new panoptikos.ui.BoardEvent(
		panoptikos.ui.Board.EventType.DID_COMPLETE_REQUEST,
		this,
		this.runningRequestsCount_,
		this.hasLoadedFirstImage_,
		this.hasReachedEnd_
	));
};

/**
 * @enum {string}
 */
panoptikos.ui.Board.EventType = {
	DID_COMPLETE_REQUEST: "a"
};

/**
 * @param {string} eventType
 * @param {!panoptikos.ui.Board} eventTarget
 * @param {number} runningRequestsCount
 * @param {boolean} hasLoadedFirstImage
 * @param {boolean} hasReachedEnd
 * @constructor
 * @extends goog.events.Event
 */
panoptikos.ui.BoardEvent = function(eventType, eventTarget, runningRequestsCount, hasLoadedFirstImage, hasReachedEnd) {
	goog.base(this, eventType, eventTarget);

	/**
	 * @type {boolean}
	 */
	this.hasLoadedFirstImage = hasLoadedFirstImage;

	/**
	 * @type {boolean}
	 */
	this.hasReachedEnd = hasReachedEnd;

	/**
	 * @type {number}
	 */
	this.runningRequestsCount = runningRequestsCount;
};
goog.inherits(panoptikos.ui.BoardEvent, goog.events.Event);
