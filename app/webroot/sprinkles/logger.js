(function() {
	"use strict";

	var Logger = function() {};

	Logger.prototype.error = function(args) {
		console.error.apply(args);
	};

	sprinkles.Logger = Logger;
})();
