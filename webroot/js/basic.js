// Create namespace for our app
var app = {};

(function() {
	var exports = app;

	/**
	 * Returns an array of subreddit names
	 * @param string value
	 * @returns array
	 */
	exports.extractSubredditNamesFromLocationHash = function(value) {
		// Remove "#" from beginning of string and split string at "+" character
		var names = value.replace(/^#/, "").split("+");

		// Remove invalid subreddit names
		for (var i = 0, iMax = names.length; i < iMax; i++) {
			if (!names[i].match(/^[0-9a-zA-Z_]+$/)) {
				names.splice(i, 1);
				iMax--;
			}
		}

		return names;
	};

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

		return namespaceSegment;
	};
})();
