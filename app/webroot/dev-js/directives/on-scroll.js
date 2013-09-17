app.directive("onScroll", ["$rootScope", "$timeout", "$window", function($rootScope, $timeout, $window) {
	"use strict";

	return {
		link: function(scope, element, attributes) {
			var timeoutPromise;

			$window = angular.element($window);
			$window.on("scroll", handleScrollEvent);

			scope.$on("$destroy", function() {
				$window.off("scroll", handleScrollEvent);
			});

			// handleScrollEvent calls executeCallback when 50 ms have passed
			// after the last call of handleScrollEvent.
			function handleScrollEvent() {
				if (timeoutPromise) {
					$timeout.cancel(timeoutPromise);
				}

				timeoutPromise = $timeout(executeCallback, 50);
			}

			function executeCallback() {
				if ($rootScope.$$phase) {
					return scope.$eval(attributes.onScroll);
				} else {
					return scope.$apply(attributes.onScroll);
				}
			}
		}
	};
}]);
