"use strict";

// Global namespace for this app.
var app = {};

(function() {
	var flashList = document.getElementById("flash-list");
	if (!flashList) {
		return;
	}

	app.router = new sprinkles.Router(window, resetFlashes);
	app.session = new sprinkles.Session(onAddFlash);

	function onAddFlash(flash) {
		var listItem = document.createElement("li");
		listItem.className = "flash";
		if (flash.type === sprinkles.Session.flashTypeError) {
			listItem.className += " flash-error";
		}

		var textNode = document.createTextNode(flash.message);
		listItem.appendChild(textNode);
		flashList.appendChild(listItem);
	}

	function resetFlashes() {
		app.session.flashes = [];
		flashList.innerHTML = "";
	}
	app.resetFlashes = resetFlashes;

	// init is called after all controllers are initialized.
	app.init = function() {
		this.router.triggerRequest(location.pathname);
	}
})();

