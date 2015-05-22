(function() {
	"use strict";

	var templateFeedback = new sprinkles.Template("/feedback/feedback.html");

	function init() {
		app.router.addRoute("/feedback", function() {createPage(handleFeedback)});
	}

	function createPage(successFunc) {
		var page = new sprinkles.Page(document.getElementById("content"), templateFeedback);
		page.serve(successFunc);
	}

	function handleFeedback() {
		var form = document.getElementById("form");
		if (!form) {
			console.error("feedbackController.handleFeedback: form element not found.");
			return;
		}

		form.addEventListener("submit", function(event) {
			event.preventDefault();
			event.stopPropagation();
			app.resetFlashes();

			var messageElement = document.getElementById("message");
			var senderElement = document.getElementById("sender");

			if (!messageElement || !senderElement) {
				return;
			}

			var data = {
				Message: messageElement.value,
				Sender: senderElement.value
			};

			var request = new XMLHttpRequest();
			request.onerror = function(event) {
				app.session.addFlashErrorMessage("There was a problem sending your message. Please try again.");
			};
			request.onload = function(event) {
				if (event.target.status !== 200) {
					request.onerror(event);
					return;
				}

				messageElement.value = "";
				senderElement.value = "";
				app.session.addFlashInfoMessage("Your message was sent sucessfully.");
			};
			request.open("POST", "/api/1/feedback");
			request.send(JSON.stringify(data));
		});
	}

	init();
})();


// app.controller("b", ["$http", "$scope", "Flash", function($http, $scope, Flash) {
// 	var groupKey = "feedback";

// 	$scope.$on("$destroy", function() {
// 		Flash.ClearAll(groupKey);
// 	});

// 	$scope.submit = function() {
// 		Flash.ClearAll(groupKey);

// 		var url = "/api/1/feedback";

// 		var data = {
// 			message: $scope.message,
// 			sender: $scope.sender,
// 		};

// 		$http
// 			.post(url, data)
// 			.error(handleError)
// 			.success(handleSuccess)
// 		;
// 	};

// 	function handleError() {
// 		Flash.AddErrorMessage("There was a problem sending your message. Please try again.", groupKey);
// 	}

// 	function handleSuccess() {
// 		$scope.message = "";
// 		$scope.sender = "";
// 		Flash.AddInfoMessage("Your message was sent sucessfully.", groupKey);
// 	}
// }]);
