(function() {
	"use strict";

	var Config = custom.main.Config;

	// Settings provides access to user-editable settings. If persistent storage
	// is available, settings are stored in a persistent way, otherwise they
	// will be lost when the browser tab is closed.
	function Settings() {

	}

	// get returns the key’s value. If key exists, a string is returned. If key
	// does not exist, null is returned.
	Settings.get = function(key) {
		var setting = app.storage.getItem("settings." + key);
		return setting;
	};

	// set stores the key’s value. value is cast to String before storing.
	Settings.set = function(key, value) {
		app.storage.setItem("settings." + key, String(value));
	};

	// getOnlyShowPostsWithImages returns whether only posts that have an image
	// should be displayed.
	Settings.getOnlyShowPostsWithImages = function() {
		return Settings.get("onlyShowPostsWithImages") === "true";
	};

	Settings.setOnlyShowPostsWithImages = function(value) {
		Settings.set("onlyShowPostsWithImages", value);
	};

	// getOpenExternalLinksInNewTab returns whether external links should be
	// opened in a new tab.
	Settings.getOpenExternalLinksInNewTab = function() {
		return Settings.get("openExternalLinksInNewTab") === "true";
	};

	Settings.setOpenExternalLinksInNewTab = function(value) {
		Settings.set("openExternalLinksInNewTab", value);
	};

	// getShowInfo returns whether comment count and subreddit name should be
	// displayed.
	Settings.getShowInfo = function() {
		return Settings.get("showInfo") === "true";
	};

	Settings.setShowInfo = function(value) {
		Settings.set("showInfo", value);
	};

	// getShowPostTitles returns whether thread titles should be displayed.
	Settings.getShowPostTitles = function() {
		return Settings.get("showPostTitles") === "true";
	};

	Settings.setShowPostTitles = function(value) {
		Settings.set("showPostTitles", value);
	};

	Settings.getTheme = function() {
		return Settings.get("theme");
	};

	Settings.setTheme = function(themeName) {
		if (themeName !== "dark" && themeName !== "light") {
			return;
		}
		Settings.set("theme", themeName);
	};

	Settings.getVersion = function() {
		return Settings.get("version");
	};

	Settings.setVersion = function(version) {
		Settings.set("version", version);
	};

	// isTheme returns whether theme is a known theme, i.e. is listed in
	// Config.themes.
	Settings.isTheme = function(theme) {
		for (var i = 0, length = Config.themes.length; i < length; i++) {
			if (Config.themes[i] === theme) {
				return true;
			}
		}
		return false;
	};

	sprinkles.provide("custom.settings.Settings", Settings);
})();
