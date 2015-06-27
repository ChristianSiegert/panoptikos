(function() {
	"use strict";

	// Settings provides access to user-editable settings. If persistent storage
	// is available, settings are stored in a persistent way, otherwise they
	// will be lost when the session ends (i.e. when the browser tab is closed).
	function Settings() {

	}

	Settings.getOnlyShowPostsWithImages = function() {
		var setting = app.storage.getItem("settingOnlyShowPostsWithImages");
		// TODO: console.log("Setting:",setting);
		if (setting === null) {
			return custom.main.Config.onlyShowPostsWithImages;
		}
		return setting;
	};

	Settings.getOpenExternalLinksInNewTab = function() {
		var setting = app.storage.getItem("settingOpenExternalLinksInNewTab");
		if (setting === undefined) {
			return custom.main.Config.openExternalLinksInNewTab;
		}
		return setting;
	};

	sprinkles.provide("custom.settings.Settings", Settings);
})();
