app.directive("buttonBar", function() {
	"use strict";

	return {
		link: function(scope, element, attributes) {
			scope.callback = attributes.buttonBarCallback;
			scope.labels = angular.fromJson(attributes.buttonBarLabels);
		},
		replace: true,
		restrict: "EA",
		template:
			'<span class="button-bar">' +
				'<button ng-click="{{callback}}({{index}})" ng-repeat="(index, label) in labels">{{label}}</button>' +
			'</span>'
	};
});
