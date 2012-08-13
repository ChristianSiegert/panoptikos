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
})();
