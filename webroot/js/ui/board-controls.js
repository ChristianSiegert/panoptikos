goog.provide("panoptikos.ui.BoardControls");
goog.provide("panoptikos.ui.BoardControls.EventType");
goog.provide("panoptikos.ui.BoardControlsEvent");

goog.require("goog.dom");
goog.require("goog.events");
goog.require("goog.events.Event");
goog.require("goog.events.EventTarget");

/**
 * Class BoardControls manages a button element that users click on to load
 * more images.
 *
 * When we create the button, we give it the text "Loading...", even though
 * no images are loading yet, to reduce the perceived page load time.
 *
 * When users click on the button, we immediately change the button text
 * from "Load more" to "Loading...", even though no requests have been sent
 * yet, to increase the perceived responsiveness.
 * @constructor
 * @extends goog.events.EventTarget
 */
panoptikos.ui.BoardControls = function() {
	/**
	 * @type {!Element}
	 */
	this.loadMoreButton_;

	/**
	 * @type {string}
	 */
	this.loadMoreButtonTextDefault1 = "Load images";
	this.loadMoreButtonTextDefault2 = "Load more";
	this.loadMoreButtonTextActive = "Loading images…"

	/**
	 * Flag that indicates if at least one image has been loaded. Used to
	 * determine appropriate button text.
	 * @type {boolean}
	 * @private
	 */
	this.hasLoadedFirstImage_ = false;
}
goog.inherits(panoptikos.ui.BoardControls, goog.events.EventTarget);

panoptikos.ui.BoardControls.prototype.toElement = function() {
	var boardControlsElement = goog.dom.createDom("div", {
		id: "board-controls"
	});

	this.loadMoreButton_ = this.createLoadMoreButton_();
	goog.dom.appendChild(boardControlsElement, this.loadMoreButton_);

	return boardControlsElement;
};

/**
 * @return {!Element}
 * @private
 */
panoptikos.ui.BoardControls.prototype.createLoadMoreButton_ = function() {
	var button = goog.dom.createDom("button", null, this.loadMoreButtonTextActive);
	goog.events.listen(button, goog.events.EventType.CLICK, this.handleLoadMoreButtonClickEvent_, false, this);
	return button;
}

/**
 * @private
 */
panoptikos.ui.BoardControls.prototype.handleLoadMoreButtonClickEvent_ = function() {
	goog.dom.setTextContent(this.loadMoreButton_, this.loadMoreButtonTextActive);
	this.dispatchEvent(panoptikos.ui.BoardControls.EventType.USER_DID_ASK_FOR_IMAGES);
};

/**
 * @param {!panoptikos.ui.BoardEvent} event
 */
panoptikos.ui.BoardControls.prototype.updateLoadMoreButtonText = function(event) {
	if (event.runningRequestsCount > 0) {
		goog.dom.setTextContent(this.loadMoreButton_, this.loadMoreButtonTextActive);
		return;
	}

	if (this.hasLoadedFirstImage_) {
		goog.dom.setTextContent(this.loadMoreButton_, this.loadMoreButtonTextDefault2);
		return;
	}

	goog.dom.setTextContent(this.loadMoreButton_, this.loadMoreButtonTextDefault1);
}

/**
 * @enum {string}
 */
panoptikos.ui.BoardControls.EventType = {
	USER_DID_ASK_FOR_IMAGES: "a"
};

/**
 * BoardControlsEvent represents a BoardControls event.
 * @param {string} eventType Event type.
 * @param {!panoptikos.ui.BoardControls} eventTarget
 * @constructor
 * @extends {goog.events.Event}
 */
panoptikos.ui.BoardControlsEvent = function(eventType, eventTarget) {
	goog.base(this, eventType, eventTarget);
};
goog.inherits(panoptikos.ui.BoardControlsEvent, goog.events.Event);
