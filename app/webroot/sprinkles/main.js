(function() {
	"use strict";

	// sprinkles takes care of the nitty gritty of web apps. It is evolving
	// alongside Panoptikos.
	function sprinkles() {

	}

	// TODO: Fix incorrect doc comment.
	// namespace takes a string with dot-delimited subpaths, and returns the
	// object in this namespace. If no object exists, an new object is created
	// and returned.
	sprinkles.namespace = function(namespace, value) {
		var pieces = namespace.split(".");
		var namespaceTail = window;
		for (var i = 0, count = pieces.length; i < count; i++) {
			var piece = pieces[i];
			if (!namespaceTail.hasOwnProperty(piece)) {
				namespaceTail[piece] = {};
			}
			if (i < count-1) {
				namespaceTail = namespaceTail[piece];
			} else {
				namespaceTail[piece] = value;
			}
		}
	};

	// TODO: Implement.
	sprinkles.provide = sprinkles.namespace;

	// TODO: Implement.
	sprinkles.require = function(namespace) {
		return sprinkles.namespace(namespace);
	};

	// Add framework to global namespace
	window.sprinkles = sprinkles;
})();
