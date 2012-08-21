(function() {
	var exports = app;

	/**
	 * namespace takes a dot-delimited string and creates a corresponding
	 * namespace, e.g. string "foo.bar.moo" creates the namespace foo.bar.moo.
	 * @param string namespace
	 * @returns object Reference to the leaf node of the namespace object.
	 */
	exports.namespace = function(namespace) {
		var pieces = namespace.split(".");
		var namespaceSegment = window;

		for (var i = 0, pieceCount = pieces.length; i < pieceCount; i++) {
			var namespaceSegmentType = typeof(namespaceSegment[pieces[i]]);

			if (namespaceSegmentType !== "object"
					|| namespaceSegment[pieces[i]] === null
					|| typeof(namespaceSegment[pieces[i]].length) !== "undefined") {
				namespaceSegment[pieces[i]] = {};
			}

			namespaceSegment = namespaceSegment[pieces[i]];
		}

		// Return reference to the leaf node of the namespace object, e.g. a reference to "moo".
		return namespaceSegment;
	};

	exports.console = {};

	/**
	 * app.console.log wraps the browser's console.log. The only difference is
	 * that app.console.log will not log anything if the app is in production
	 * mode.
	 */
	exports.console.log = function() {
		if (app.config.core.isProductionMode) {
			return;
		}

		console.log.apply(console, arguments);
	}
})();
