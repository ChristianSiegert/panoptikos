(function() {
	"use strict";

	var Config = custom.main.Config;

	// Settings provides access to user-editable settings. If persistent storage
	// is available, settings are stored in a persistent way, otherwise they
	// will be lost when the session ends (i.e. when the browser tab is closed).
	function Settings() {

	}

	// getOnlyShowPostsWithImages returns whether only posts that have an image
	// should be displayed.
	Settings.getOnlyShowPostsWithImages = function() {
		var setting = app.storage.getItem("settings.onlyShowPostsWithImages");
		if (!setting) {
			return Config.onlyShowPostsWithImages;
		}
		return setting === "true";
	};

	Settings.setOnlyShowPostsWithImages = function(value) {
		app.storage.setItem("settings.onlyShowPostsWithImages", String(value));
	};

	// getOpenExternalLinksInNewTab returns whether external links should be
	// opened in a new tab.
	Settings.getOpenExternalLinksInNewTab = function() {
		var setting = app.storage.getItem("settings.openExternalLinksInNewTab");
		if (!setting) {
			return Config.openExternalLinksInNewTab;
		}
		return setting === "true";
	};

	Settings.setOpenExternalLinksInNewTab = function(value) {
		app.storage.setItem("settings.openExternalLinksInNewTab", String(value));
	};

	sprinkles.provide("custom.settings.Settings", Settings);
})();
