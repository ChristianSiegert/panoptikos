app.controller("n", ["$route", "$scope", function($route, $scope) {
	$scope.$on("$routeChangeSuccess", function() {
		$scope.p = {};

		if (!$route.current || !$route.current.controller) {
			return;
		}

		$scope.p[$route.current.controller] = true;
	});
}]);
