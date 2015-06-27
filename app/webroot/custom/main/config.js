(function() {
	"use strict";

	function Config() {

	}

	Config.appVersion = "2015-06-27";

	Config.defaultSubredditIds = [
		"CityPorn",
		"EarthPorn",
		"ExposurePorn",
		"lakeporn",
		"wallpaper",
		"wallpapers",
		"windowshots"
	];

	// Default settings for thread list
	Config.onlyShowPostsWithImages = false;
	Config.openExternalLinksInNewTab = true;

	sprinkles.provide("custom.main.Config", Config);
})();
