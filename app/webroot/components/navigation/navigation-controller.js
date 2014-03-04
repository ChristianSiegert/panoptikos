app.controller("n", ["$route", "$scope", function($route, $scope) {
	$scope.$on("$routeChangeSuccess", function() {
		$scope.page = {};

		if (!$route.current || !$route.current.controller) {
			return;
		}

		var controllerName = $route.current.controller.replace(/Controller$/, "");
		$scope.page[controllerName] = true;
	});
}]);
