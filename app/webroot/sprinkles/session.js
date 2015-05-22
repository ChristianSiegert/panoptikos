(function() {
	"use strict";

	var Session = function(onAddFlash) {
		this.flashes = [];

		// onAddFlash is called every time a flash message is added to session.
		// As argument, an instance of sprinkles.Flash is passed.
		this.onAddFlash = onAddFlash;
	};

	Session.prototype.addFlashErrorMessage = function(message) {
		var flash = new sprinkles.Flash(message, Session.flashTypeError);
		this.flashes.push(flash);
		if (this.onAddFlash) {
			this.onAddFlash(flash);
		}
	};

	Session.prototype.addFlashInfoMessage = function(message) {
		var flash = new sprinkles.Flash(message, Session.flashTypeInfo);
		this.flashes.push(flash);
		if (this.onAddFlash) {
			this.onAddFlash(flash);
		}
	};

	Session.prototype.flashAll = function() {
		var flashes = this.flashes;
		this.flashes = [];
		return flashes;
	};

	// Types of flash messages.
	Session.flashTypeError = 1;
	Session.flashTypeInfo = 2;

	sprinkles.Session = Session;
})();
