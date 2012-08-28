(function() {
	var exports = app.namespace("app.models.subreddit");

	/**
	 * Names of subreddits that are selected for the user by default. Can be
	 * overwritten by setDefaultSubreddits.
	 * @var array Array of strings. Each string is the name of a subreddit.
	 */
	var defaultSubreddits = [
		"1000words",
		"agricultureporn",
		"aviation",
		"birdpics",
		"cityporn",
		"earthporn",
		"itookapicture",
		"picturechallenge",
		"wallpaper",
		"wallpapers",
		"windowshots"
	];

	/**
	 * @var array
	 */
	var selectedSubreddits = [];

	/**
	 * getDefaultSubreddits returns the subreddits that are selected by default.
	 * @returns array Array of strings. Each string is the name of a subreddit.
	 */
	exports.getDefaultSubreddits = function() {
		return defaultSubreddits.slice();
	}

	/**
	 * setDefaultSubreddits sets the subreddits that are selected by default.
	 * @param array subreddits Array of strings. Each string is the name of a subreddit.
	 * @returns void
	 */
	exports.setDefaultSubreddits = function(subreddits) {
		if (typeOf(subreddits) !== "array") {
			return;
		}

		defaultSubreddits = subreddits;
	};

	/**
	 * getSelectedSubreddits searches the location hash for valid subreddit
	 * names and returns them. If no valid subreddit names were found and
	 * useDefaultSubredditsAsFallback is true, it returns the names of the
	 * default subreddits.
	 * @param boolean useDefaultSubredditsAsFallback Use default subreddits if user did not select any subreddits. Defaults to true.
	 * @returns array Array of strings. Each string is the name of a subreddit.
	 */
	exports.getSelectedSubreddits = function(useDefaultSubredditsAsFallback) {
		if (typeof(useDefaultSubredditsAsFallback) !== "boolean") {
			useDefaultSubredditsAsFallback = true;
		}

		if (selectedSubreddits.length === 0 && useDefaultSubredditsAsFallback) {
			return exports.getDefaultSubreddits();
		}

		return selectedSubreddits.slice();
	}

	/**
	 * @param array subreddits Array of strings. Each string is the name of a subreddit.
	 * @returns void
	 */
	exports.setSelectedSubreddits = function(subreddits) {
		if (typeOf(subreddits) !== "array") {
			return;
		}

		selectedSubreddits = subreddits;
	};

	/**
	 * addToSelectedSubreddits adds the provided subreddit name to the list of
	 * selected subreddits and updates the location hash (our storage).
	 * @param string subredditName
	 * @returns void
	 */
	exports.addToSelectedSubreddits = function(subredditName) {
		if (typeof(subredditName) !== "string") {
			return;
		}

		var subredditNames = exports.getSelectedSubreddits(false);
		var index = subredditNames.indexOf(subredditName);

		if (index >= 0) {
			return;
		}

		subredditNames.push(subredditName);
		exports.setSelectedSubreddits(subredditNames);
		exports.writeSubredditsToLocationHash(subredditNames);
	}

	/**
	 * removeFromSelectedSubreddits removes the provided subreddit name from the
	 * list of selected subreddits and updates the location hash (our storage).
	 * @param string subredditName
	 * @returns void
	 */
	exports.removeFromSelectedSubreddits = function(subredditName) {
		var subredditNames = exports.getSelectedSubreddits(false);
		var index = subredditNames.indexOf(subredditName);

		if (index < 0) {
			return;
		}

		subredditNames.splice(index, 1);
		exports.setSelectedSubreddits(subredditNames);
		exports.writeSubredditsToLocationHash(subredditNames);
	};

	/**
	 * selectedSubredditsHaveChanged compares two arrays of subreddit names to
	 * determine if there is a difference.
	 * @param array currentlySelectedSubreddits Array of strings. Each string is the name of a subreddit.
	 * @param array originallySelectedSubreddits Array of strings. Each string is the name of a subreddit.
	 * @returns boolean True if there is a difference, false otherwise.
	 */
	exports.selectedSubredditsHaveChanged = function(currentlySelectedSubreddits, originallySelectedSubreddits) {
		if (typeOf(currentlySelectedSubreddits) !== "array" || typeOf(originallySelectedSubreddits) !== "array") {
			return false;
		}

		var currentlySelectedSubredditsCount = currentlySelectedSubreddits.length;
		var originallySelectedSubredditsCount = originallySelectedSubreddits.length;

		// If the number of subreddits differs, something has changed.
		if (currentlySelectedSubredditsCount !== originallySelectedSubredditsCount) {
			return true;
		}

		// If the number of subreddits is the same, compare arrays item by item.
		for (var i = 0; i < currentlySelectedSubredditsCount; i++) {
			if (originallySelectedSubreddits.indexOf(currentlySelectedSubreddits[i]) < 0) {
				return true;
			}
		}

		return false;
	};

	/**
	 * readSubredditsFromLocationHash searches the location hash for valid
	 * subreddit names and returns them.
	 * @returns array Array of strings. Each string is the name of a subreddit.
	 */
	exports.readSubredditsFromLocationHash = function() {
		// Remove "#" character from beginning of location hash and split location hash at "+" character
		var names = location.hash.replace(/^#/, "").split("+");

		// Remove invalid subreddit names
		for (var i = 0, nameCount = names.length; i < nameCount; i++) {
			if (!exports.isValidSubredditName(names[i])) {
				names.splice(i, 1);
				nameCount--;
			}
		}

		return names;
	};

	/**
	 * writeSubredditsToLocationHash stores subreddits in location hash.
	 * @param array Array of strings. Each string is the name of a subreddit.
	 * @returns void
	 */
	exports.writeSubredditsToLocationHash = function(subreddits) {
		location.hash = subreddits.join("+");
	};

	/**
	 * isValidSubredditName checks if value is a valid subreddit name, i.e. only
	 * contains digits, letters and underscores.
	 * @param value
	 * @returns boolean True if value is valid subreddit name, false otherwise.
	 */
	exports.isValidSubredditName = function(value) {
		if (typeof(value) === "string" && /^[0-9a-zA-Z_]+$/.test(value)) {
			return true;
		}

		return false;
	};
})();
