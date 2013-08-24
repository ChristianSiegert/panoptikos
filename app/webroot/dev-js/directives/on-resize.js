app.directive("onResize", ["$rootScope", "$timeout", "$window", function($rootScope, $timeout, $window) {
	return {
		link: function(scope, element, attributes) {
			var timeoutPromise;

			$window = angular.element($window);
			$window.on("resize", handleResizeEvent);

			scope.$on("$destroy", function() {
				$window.off("resize", handleResizeEvent);
			});

			// handleResizeEvent calls executeCallback when 50 ms have passed
			// after the last call of handleResizeEvent.
			function handleResizeEvent() {
				if (timeoutPromise) {
					$timeout.cancel(timeoutPromise);
				}

				timeoutPromise = $timeout(executeCallback, 50);
			}

			function executeCallback() {
				if ($rootScope.$$phase) {
					return scope.$eval(attributes.onResize);
				} else {
					return scope.$apply(attributes.onResize);
				}
			}
		}
	};
}]);
