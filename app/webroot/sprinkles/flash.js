(function() {
	"use strict";

	var Flash = function(message, type) {
		this.message = message;
		this.type = type;
	};

	// Types of flash messages.
	Flash.typeError = 1;
	Flash.typeInfo = 2;
	Flash.typeWarn = 3;

	sprinkles.Flash = Flash;
})();
