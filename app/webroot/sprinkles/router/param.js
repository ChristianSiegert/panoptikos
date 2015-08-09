(function() {
	"use strict";

	// Param is a single URL parameter, consisting of a key and a value.
	function Param() {
		this.key = "";
		this.value = "";
	}

	sprinkles.provide("sprinkles.router.Param", Param);
})();
