app.controller("SettingsController", [
		"$scope", "localStorageService", "Settings",
		function($scope, localStorageService, Settings) {
	"use strict";

	Settings.setDefaults();

	$scope.openExternalLinksInNewTab = localStorageService.get(Settings.keys.O) === "true";
	$scope.localStorageIsSupported = localStorageService.isSupported;

	$scope.save = function() {
		localStorageService.set(Settings.keys.O, $scope.openExternalLinksInNewTab)
	};
}]);

