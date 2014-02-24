app.factory("Settings", ["localStorageService", function(localStorageService) {
	"use strict";
	var settings = {};

	settings.keys = {
		O: "settings.O",	// Open external links in new tab
		V: "settings.V"		// Settings version
	};

	settings.setDefaults = function() {
		var settingsVersion = localStorageService.get(settings.keys.V);

		// Set default settings
		if (!settingsVersion) {
			localStorageService.set(settings.keys.O, "true");
			localStorageService.set(settings.keys.V, "2014-02-24-0");
		}
	}

	return settings;
}]);
