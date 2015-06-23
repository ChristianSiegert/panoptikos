(function() {
	"use strict";

	var templateFeedback = new sprinkles.Template("/feedback/feedback.html");

	var FeedbackController = function() {

	}

	FeedbackController.prototype.init = function() {
		app.router.registerRoute("/feedback", function() {loadPage(handleFeedback)});
	}

	function loadPage(onSuccess) {
		var page = new sprinkles.Page(document.getElementById("content"), templateFeedback);
		page.load(onSuccess);
	}

	function handleFeedback() {
		var form = document.getElementById("form");
		if (!form) {
			return;
		}

		// TODO: Remove event listener on page change.
		form.addEventListener("submit", submitFeedback);
	}

	function submitFeedback(event) {
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
	}

	var controller = new FeedbackController();
	app.addInitFunc(controller.init.bind(controller));
})();
