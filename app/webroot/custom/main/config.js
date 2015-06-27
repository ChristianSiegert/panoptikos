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

	sprinkles.provide("custom.main.Config", Config);
})();
