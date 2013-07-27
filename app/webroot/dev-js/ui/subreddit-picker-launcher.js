goog.provide("panoptikos.ui.SubredditPickerLauncher");

goog.require("goog.dom");

/**
 * Class SubredditPickerLauncher creates a button for opening a SubredditPicker.
 * @constructor
 */
panoptikos.ui.SubredditPickerLauncher = function() {

};

/**
 * @return {!Element}
 */
panoptikos.ui.SubredditPickerLauncher.prototype.createDom = function() {
	var element = goog.dom.createDom("button", {
		id: "subreddit-picker-launcher"
	}, "Edit Subreddits");

	return element;
};
