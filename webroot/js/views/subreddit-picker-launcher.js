(function() {
	var exports = app.namespace("app.ui");

	/**
	 * Class SubredditPickerLauncher manages UI for opening a SubredditPicker.
	 */
	exports.SubredditPickerLauncher = function() {
		var self = this;

		self.toElement = function() {
			var element = new Element("a", {
				html: "Edit subreddits",
				id: "subreddit-picker-launcher"
			});

			element.addEvent("click", handleElementClickEvent);
			return element;
		};

		function handleElementClickEvent(event) {
			event.stop();
			new app.ui.SubredditPicker().open();
		}
	};
})();
