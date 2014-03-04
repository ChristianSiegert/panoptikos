app.controller("s", [
		"$scope", "localStorageService", "Settings",
		function($scope, localStorageService, Settings) {
	"use strict";

	Settings.setDefaults();

	$scope.i = localStorageService.get(Settings.keys.I) === "true";
	$scope.o = localStorageService.get(Settings.keys.O) === "true";
	$scope.l = localStorageService.isSupported;

	$scope.s = function() {
		localStorageService.set(Settings.keys.I, $scope.i);
		localStorageService.set(Settings.keys.O, $scope.o);
	};
}]);

