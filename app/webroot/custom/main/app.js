(function() {
	"use strict";

	var App = function() {
		// flashListElement is the element that contains any flash messages.
		this.flashListElement = document.getElementById("flash-list");

		// initFuncs is a list of functions that are called when App is
		// initialized.
		this.initFuncs = [];

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
	// are loaded and initialized.
	App.prototype.init = function() {
		this.logger = new sprinkles.Logger();
		this.logger.allowSubmissions = true;
		this.logger.submissionUrl = "/api/1/log";

		this.router = new sprinkles.Router();
		this.router.onRouteChange = this.resetFlashes.bind(this);

		this.session = new sprinkles.Session();
		this.session.onAddFlash = this.onAddFlash.bind(this);

		this.storage = new sprinkles.Storage();
		this.storage.keyPrefix = custom.main.Config.appVersion;

		for (var i = 0, count = this.initFuncs.length; i < count; i++) {
			this.initFuncs[i]();
		}
		this.initFuncs = [];

		// Load page for current URL
		this.router.dispatchRequest(location.pathname);
	};

	// resetFlashes deletes all flash messages.
	App.prototype.resetFlashes = function() {
		this.session.flashes = [];
		this.flashListElement.innerHTML = "";
	};

	// addInitFunc adds func to a list of functions that are called when init is
	// called.
	App.prototype.addInitFunc = function(func) {
		this.initFuncs.push(func);
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

	// Create instance and make it globally accessible
	var app = new App();
	sprinkles.provide("app", app);
})();


