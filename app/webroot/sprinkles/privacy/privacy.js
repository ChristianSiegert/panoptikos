(function() {
	"use strict";

	function Privacy() {

	}

	// doNotTrack returns true if the browser’s “Do not track” setting is
	// enabled.
	Privacy.doNotTrack = function() {
		return navigator.doNotTrack === "1"
				|| navigator.doNotTrack === "yes"	// Firefox 31-
				|| navigator.msDoNotTrack === "1"	// IE 9-10
				|| window.doNotTrack === "1"		// IE 11, Safari
	}

	sprinkles.provide("sprinkles.privacy.Privacy", Privacy);
})();
