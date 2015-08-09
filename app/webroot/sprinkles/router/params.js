(function() {
	"use strict";

	function Params() {
		this.params = {};
	}

	// byName returns the named parameter, or if not found, null.
	Params.prototype.byName = function(name) {
		if (this.params.hasOwnProperty("name")) {
			return this.params[name];
		}
		return null;
	};

	sprinkles.provide("sprinkles.router.Param", Param);
})();
