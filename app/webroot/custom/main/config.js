(function() {
	"use strict";

	function Config() {

	}

	// Default subreddits
	Config.defaultSubredditIds = [
		"CityPorn",
		"EarthPorn",
		"ExposurePorn",
		"lakeporn",
		"wallpaper",
		"wallpapers",
		"windowshots"
	];

	Config.defaultTheme = "light";

	Config.themes = [
		"dark",
		"light"
	];

	// Default settings for thread list
	Config.threadList = {
		minPreviewImageWidth: 400,
		onlyShowPostsWithImages: false,
		openExternalLinksInNewTab: true,
		showInfo: true,						// Comment count and subreddit name
		showPostTitles: true
	};

	sprinkles.provide("custom.main.Config", Config);
})();
