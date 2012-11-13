goog.provide("panoptikos.ui.SubredditPicker");
goog.provide("panoptikos.ui.SubredditPicker.EventType");

goog.require("goog.dom");
goog.require("goog.dom.classes");
goog.require("goog.events");
goog.require("goog.events.EventTarget");
goog.require("goog.events.EventType");
goog.require("goog.events.KeyCodes");
goog.require("goog.style");

/**
 * Class SubredditPicker manages the UI for adding and removing subreddits.
 * @constructor
 * @extends goog.events.EventTarget
 */
panoptikos.ui.SubredditPicker = function() {
	/**
	 * @type {!Element}
	 * @private
	 */
	this.element_;

	/**
	 * Array of strings. Each string is the name of a subreddit that the
	 * user wants to see images from. Used to compare against new selection
	 * of subreddits. If there is a difference, the Board is rebuild.
	 * @type {!Array.<string>}
	 * @private
	 */
	this.originallySelectedSubreddits_;

	/**
	 * @type {!Element}
	 * @private
	 */
	this.subredditList_;
};
goog.inherits(panoptikos.ui.SubredditPicker, goog.events.EventTarget);

panoptikos.ui.SubredditPicker.prototype.open = function() {
	if (this.element_) {
		return;
	}

	panoptikos.models.subreddit.setSelectedSubreddits(
		panoptikos.models.subreddit.getSelectedSubreddits()
	);

	this.originallySelectedSubreddits_ = panoptikos.models.subreddit.getSelectedSubreddits();

	this.element_ = this.createElement_();
	goog.dom.appendChild(document.body, this.element_);

	goog.events.listen(
		window,
		goog.events.EventType.RESIZE,
		this.handleWindowResizeEvent_,
		false,
		this
	);

	this.dispatchEvent(panoptikos.ui.SubredditPicker.EventType.OPEN);
};

panoptikos.ui.SubredditPicker.prototype.close = function() {
	if (!this.element_) {
		return;
	}

	goog.events.unlisten(
		window,
		goog.events.EventType.RESIZE,
		this.handleWindowResizeEvent_,
		false,
		this
	 );

	// Add CSS class "fade-out" to start the CSS animation
	goog.dom.classes.add(this.element_, "fade-out");

	// Wait for the CSS animation to finish, then remove the element
	goog.global.setTimeout(goog.bind(function() {
		goog.dom.removeNode(this.element_);
		this.element_ = null;
		this.originallySelectedSubreddits_ = null;
	}, this), 300);

	this.dispatchEvent(panoptikos.ui.SubredditPicker.EventType.CLOSE);
};

/**
 * @return {!Element}
 * @private
 */
panoptikos.ui.SubredditPicker.prototype.createElement_ = function() {
	var backgroundElement = this.createBackgroundElement_();

	var element = goog.dom.createDom("div", {
		id: "subreddit-picker",
		style: {
			top: document.body.scrollHeight + 10
		}
	});
	goog.dom.appendChild(backgroundElement, element);

	var textField = this.createTextField_();
	goog.dom.appendChild(element, textField);

	this.subredditList_ = this.createSubredditList_();
	goog.dom.appendChild(element, this.subredditList_);

	return backgroundElement;
};

/**
 * @return {!Element}
 * @private
 */
panoptikos.ui.SubredditPicker.prototype.createBackgroundElement_ = function() {
	var backgroundElement = goog.dom.createDom("div", {
		id: "subreddit-picker-background"
	});

	goog.style.setSize(
		backgroundElement,
		document.body.scrollWidth,
		document.body.scrollHeight
	);

	goog.events.listen(
		backgroundElement,
		goog.events.EventType.CLICK,
		this.handleBackgroundElementClickEvent_,
		false,
		this
	);

	return backgroundElement;
};

/**
 * @param {!goog.events.BrowserEvent} event
 * @private
 */
panoptikos.ui.SubredditPicker.prototype.handleBackgroundElementClickEvent_ = function(event) {
	if (event.target.getAttribute("id") !== "subreddit-picker-background") {
		return;
	}

	this.close();

	if (!panoptikos.models.subreddit.haveSelectedSubredditsChanged(
			panoptikos.models.subreddit.getSelectedSubreddits(),
			this.originallySelectedSubreddits_
		)) {
		return;
	}

	this.dispatchEvent(panoptikos.ui.SubredditPicker.EventType.USER_DID_CHANGE_SELECTED_SUBREDDITS);
};

/**
 * @return {!Element}
 * @private
 */
panoptikos.ui.SubredditPicker.prototype.createSubredditList_ = function() {
	var list = goog.dom.createDom("ul", {
		id: "subreddit-picker-subreddit-list"
	});

	var subredditNames = panoptikos.models.subreddit.getSelectedSubreddits();

	for (var i = 0, subredditNameCount = subredditNames.length; i < subredditNameCount; i++) {
		var listItem = this.createSubredditListItem_(subredditNames[i]);
		goog.dom.appendChild(list, listItem);
	}

	goog.events.listen(
		list,
		goog.events.EventType.CLICK,
		this.handleSubredditListButtonClickEvent_,
		false,
		this
	);

	return list;
};

/**
 * @private
 */
panoptikos.ui.SubredditPicker.prototype.handleSubredditListButtonClickEvent_ = function(event) {
	if (!event.target.hasAttribute("data-subreddit-name")) {
		return;
	}

	var subredditName = event.target.getAttribute("data-subreddit-name");

	if (goog.dom.classes.has(event.target, "subreddit-picker-subreddit-add-button")) {
		goog.dom.classes.addRemove(
			event.target,
			"subreddit-picker-subreddit-add-button",
			"subreddit-picker-subreddit-remove-button"
		);
		panoptikos.models.subreddit.addToSelectedSubreddits(subredditName);
	} else {
		goog.dom.classes.addRemove(
			event.target,
			"subreddit-picker-subreddit-remove-button",
			"subreddit-picker-subreddit-add-button"
		);
		panoptikos.models.subreddit.removeFromSelectedSubreddits(subredditName);
	}
};

/**
 * @return {!Element}
 * @private
 */
panoptikos.ui.SubredditPicker.prototype.createSubredditListItem_ = function(subredditName) {
	var listItem = goog.dom.createDom("li", "subreddit-picker-subreddit-list-item");

	var button = goog.dom.createDom("button", {
		"class": "subreddit-picker-subreddit-remove-button",
		"data-subreddit-name": subredditName
	});
	goog.dom.setTextContent(button, subredditName);
	goog.dom.appendChild(listItem, button);

	return listItem;
};

/**
 * @private
 */
panoptikos.ui.SubredditPicker.prototype.handleWindowResizeEvent_ = function() {
	if (!this.element_) {
		return;
	}

	goog.style.setSize(
		this.element_,
		document.body.offsetWidth,
		document.body.scrollHeight
	);
};

/**
 * @return {!Element}
 * @private
 */
panoptikos.ui.SubredditPicker.prototype.createTextField_ = function() {
	var textField = goog.dom.createDom("input", {
		id: "subreddit-picker-text-field",
		placeholder: "Enter subreddit and press return",
		type: "text"
	});

	goog.events.listen(textField, goog.events.EventType.KEYDOWN, this.handleTextFieldKeyDownEvent_, false, this);
	return textField;
};

/**
 * @private
 */
panoptikos.ui.SubredditPicker.prototype.handleTextFieldKeyDownEvent_ = function(event) {
	if (event.keyCode !== goog.events.KeyCodes.ENTER
			&& event.keyCode !== goog.events.KeyCodes.MAC_ENTER) {
		return;
	}

	var subredditListItem = this.createSubredditListItem_(event.target.value);
	goog.dom.appendChild(this.subredditList_, subredditListItem);

	panoptikos.models.subreddit.addToSelectedSubreddits(event.target.value);
	event.target.value = "";
};

/**
 * @enum {string}
 */
panoptikos.ui.SubredditPicker.EventType = {
	CLOSE: "a",
	OPEN: "b",
	USER_DID_CHANGE_SELECTED_SUBREDDITS: "c"
};
