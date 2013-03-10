goog.provide("panoptikos.ui.BoardItem");

goog.require("goog.dom");

/**
 * Class BoardItem manages an HTML element that consists of image and anchor
 * elements.
 * @param {!Object} thread Reddit thread.
 * @param {!HTMLImageElement} image
 * @param {string=} fullsizeImageUrl Optional.
 * @constructor
 */
panoptikos.ui.BoardItem = function(thread, image, fullsizeImageUrl) {
	/**
	 * @type {string|undefined}
	 * @private
	 */
	this.fullsizeImageUrl_ = fullsizeImageUrl;

	/**
	 * @type {!Element}
	 * @private
	 */
	this.image_ = image;

	/**
	 * @type {!Object}
	 * @private
	 */
	this.thread_ = thread;
};

/**
 * toElement returns an HTML element that contains other markup that all
 * together creates a board item, e.g. an image and anchor elements.
 * @return {!Element}
 */
panoptikos.ui.BoardItem.prototype.toElement = function() {
	var element = goog.dom.createDom("div", "board-item");
	goog.dom.appendChild(element, this.createImageAnchor());
	goog.dom.appendChild(element, this.createTitleAnchor());
	return element;
};

/**
 * @return {!Element}
 * @private
 */
panoptikos.ui.BoardItem.prototype.createImageAnchor = function() {
	var imageAnchor = goog.dom.createDom("a", {
		"class": "board-item-image-anchor",
		href: this.fullsizeImageUrl_ ? this.fullsizeImageUrl_ : this.image_.src
	});

	goog.dom.appendChild(imageAnchor, this.createImageElement());
	return imageAnchor;
};

/**
 * @return {!Element}
 * @private
 */
panoptikos.ui.BoardItem.prototype.createImageElement = function() {
	var imageElement = goog.dom.createDom("img", {
		"class": "board-item-image",
		"data-original-src": this.image_.src,
		src: this.image_.src
	});

	return imageElement;
};

/**
 * @return {!Element}
 * @private
 */
panoptikos.ui.BoardItem.prototype.createTitleAnchor = function() {
	var titleAnchor = goog.dom.createDom("a", {
		"class": "board-item-title-anchor",
		href: "http://www.reddit.com" + this.thread_["permalink"]
	});
	titleAnchor.innerHTML = this.thread_["title"];

	return titleAnchor;
};
