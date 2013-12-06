/*
 * @description
 * You can use this directive by putting the following HTML code into your
 * partials:
 * 		<div button-bar button-bar-callback="fooCallback" button-bar-labels='["Label 1", "Label 2"]'></div>
 *
 * Customizable attributes of the button bar:
 * - "button-bar-callback": Its value is the name of the callback function that
 * should be called when a button was clicked.
 * - "button-bar-labels": Its value is a stringified JSON object. The number of
 * provided labels determines the number of buttons created.
*/
app.directive("buttonBar", function() {
	"use strict";

	function handleClick(buttonBarCallback, event) {
		if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) {
			return;
		}

		if (event.target.tagName !== "BUTTON") {
			return;
		}

		var buttonIndex = null;
		var buttonAttributes = event.target.attributes;

		// Read value from the button's attribute "data-index"
		for (var i = 0, attributeCount = buttonAttributes.length; i < attributeCount; i++) {
			if (buttonAttributes[i].nodeName === "data-button-index") {
				buttonIndex = parseInt(buttonAttributes[i].nodeValue, 10);
				break;
			}
		}

		if (buttonIndex === null) {
			return;
		}

		buttonBarCallback(buttonIndex);
	};

	return {
		link: function(scope, element, attributes) {
			scope.handleClick = angular.bind(null, handleClick, scope.getButtonBarCallback());
			scope.labels = angular.fromJson(attributes.buttonBarLabels);
		},
		replace: true,
		restrict: "EA",
		scope: {
			getButtonBarCallback: "&buttonBarCallback"
		},
		template:
			'<div class="button-bar" ng-click="handleClick($event)">' +
				'<button data-button-index="{{index}}" ng-repeat="(index, label) in labels">{{label}}</button>' +
			'</div>'
	};
});
