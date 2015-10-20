(function() {
	"use strict";

	function App() {
		// flashListElement is the element that contains any flash messages.
		this.flashListElement = document.getElementById("flash-list");

		// logger handles logging and submitting log reports.
		this.logger = null;

		// router handles the app’s routing.
		this.router = null;

		// session is the user’s current session.
		this.session = null;

		// storage handles storing data.
		this.storage = null;
	}

	// init initializes the app. It must only be called after all other files
	// are loaded.
	App.prototype.init = function() {
		this.logger = new sprinkles.Logger();
		this.logger.allowSubmissions = true;
		this.logger.submissionUrl = "/api/1/log";

		this.router = new sprinkles.Router(this.logger);
		this.router.onRouteChange = this.resetFlashes.bind(this);

		this.session = new sprinkles.Session();
		this.session.onAddFlash = this.onAddFlash.bind(this);

		this.storage = new sprinkles.Storage();
		if (window.location.hostname === "localhost") {
			this.storage.keyPrefix = "panoptikos.";
		}

		var settingsController = new custom.settings.SettingsController(this.router);
		settingsController.init();
		settingsController.loadTheme(custom.settings.Settings.getTheme());

		// Initialize controllers
		(new custom.feedback.FeedbackController(this.router)).init();
		(new custom.supporters.SupportersController(this.router)).init();
		(new custom.threadList.ThreadListController(this.router)).init();

		// Load page for current URL
		this.router.dispatchRequest(location.pathname);
	};

	// resetFlashes deletes all flash messages.
	App.prototype.resetFlashes = function() {
		this.session.flashes = [];
		this.flashListElement.innerHTML = "";
	};

	// onAddFlash displays flash messages to the user.
	App.prototype.onAddFlash = function(flash) {
		var listItem = document.createElement("li");
		listItem.className = "flash";

		switch (flash.type) {
			case sprinkles.Session.flashTypeError:
				listItem.className += " flash-error";
				break;
			case sprinkles.Session.flashTypeWarning:
				listItem.className += " flash-warning";
				break;
		}

		var textNode = document.createTextNode(flash.message);
		listItem.appendChild(textNode);
		this.flashListElement.appendChild(listItem);
	}

	sprinkles.provide("custom.main.App", App);
})();


