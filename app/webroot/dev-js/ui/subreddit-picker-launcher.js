goog.provide("panoptikos.ui.SubredditPickerLauncher");

goog.require("goog.dom");

/**
 * Class SubredditPickerLauncher manages UI for opening a SubredditPicker.
 * @constructor
 */
panoptikos.ui.SubredditPickerLauncher = function() {

};

/**
 * @return {!Element}
 */
panoptikos.ui.SubredditPickerLauncher.prototype.toElement = function() {
	var element = goog.dom.createDom("button", {
		id: "subreddit-picker-launcher"
	}, "Edit Subreddits");

	return element;
};
