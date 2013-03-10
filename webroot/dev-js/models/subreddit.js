goog.provide("panoptikos.models.subreddit");

/**
 * Names of subreddits that are selected for the user by default. Can be
 * overwritten by setDefaultSubreddits.
 * @type {!Array.<string>} Each string is the name of a subreddit.
 * @private
 */
panoptikos.models.subreddit.defaultSubreddits = [
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
 * @type {!Array.<string>}
 * @private
 */
panoptikos.models.subreddit.selectedSubreddits = [];

/**
 * getDefaultSubreddits returns the subreddits that are selected by default.
 * @return {!Array.<string>} Each string is the name of a subreddit.
 */
panoptikos.models.subreddit.getDefaultSubreddits = function() {
	return panoptikos.models.subreddit.defaultSubreddits.slice();
}

/**
 * setDefaultSubreddits sets the subreddits that are selected by default.
 * @param {!Array.<string>} subreddits Each string is the name of a subreddit.
 */
panoptikos.models.subreddit.setDefaultSubreddits = function(subreddits) {
	panoptikos.models.subreddit.defaultSubreddits = subreddits;
};

/**
 * getSelectedSubreddits searches the location hash for valid subreddit names
 * and returns them. If no valid subreddit names were found and
 * useDefaultSubredditsAsFallback is true, it returns the names of the default
 * subreddits.
 * @param {boolean=} useDefaultSubredditsAsFallback Whether to use the default subreddits. Defaults to true.
 * @return {!Array.<string>} Each string is the name of a subreddit.
 */
panoptikos.models.subreddit.getSelectedSubreddits = function(useDefaultSubredditsAsFallback) {
	if (typeof(useDefaultSubredditsAsFallback) !== "boolean") {
		useDefaultSubredditsAsFallback = true;
	}

	if (panoptikos.models.subreddit.selectedSubreddits.length === 0 && useDefaultSubredditsAsFallback) {
		return panoptikos.models.subreddit.getDefaultSubreddits();
	}

	return panoptikos.models.subreddit.selectedSubreddits.slice();
}

/**
 * @param {!Array.<string>} subreddits Each string is the name of a subreddit.
 */
panoptikos.models.subreddit.setSelectedSubreddits = function(subreddits) {
	panoptikos.models.subreddit.selectedSubreddits = subreddits;
};

/**
 * addToSelectedSubreddits adds the provided subreddit name to the list of
 * selected subreddits and updates the location hash (our storage).
 * @param {string} subredditName
 */
panoptikos.models.subreddit.addToSelectedSubreddits = function(subredditName) {
	var subredditNames = panoptikos.models.subreddit.getSelectedSubreddits(false);
	var index = subredditNames.indexOf(subredditName);

	if (index >= 0) {
		return;
	}

	subredditNames.push(subredditName);
	panoptikos.models.subreddit.setSelectedSubreddits(subredditNames);
	panoptikos.models.subreddit.writeSubredditsToLocationHash(subredditNames);
}

/**
 * removeFromSelectedSubreddits removes the provided subreddit name from the
 * list of selected subreddits and updates the location hash (our storage).
 * @param {string} subredditName
 */
panoptikos.models.subreddit.removeFromSelectedSubreddits = function(subredditName) {
	var subredditNames = panoptikos.models.subreddit.getSelectedSubreddits(false);
	var index = subredditNames.indexOf(subredditName);

	if (index < 0) {
		return;
	}

	subredditNames.splice(index, 1);
	panoptikos.models.subreddit.setSelectedSubreddits(subredditNames);
	panoptikos.models.subreddit.writeSubredditsToLocationHash(subredditNames);
};

/**
 * haveSelectedSubredditsChanged compares two arrays of subreddit names to
 * determine if there is a difference.
 * @param {!Array.<string>} currentlySelectedSubreddits Each string is the name of a subreddit.
 * @param {!Array.<string>} originallySelectedSubreddits Each string is the name of a subreddit.
 * @return {boolean} Whether there is a difference.
 */
panoptikos.models.subreddit.haveSelectedSubredditsChanged = function(currentlySelectedSubreddits, originallySelectedSubreddits) {
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
 * readSubredditsFromLocationHash searches the location hash for valid subreddit
 * names and returns them.
 * @return {!Array.<string>} Each string is the name of a subreddit.
 */
panoptikos.models.subreddit.readSubredditsFromLocationHash = function() {
	// Remove "#" character from beginning of location hash and split location hash at "+" character
	var names = location.hash.replace(/^#/, "").split("+");

	// Remove invalid subreddit names
	for (var i = 0, nameCount = names.length; i < nameCount; i++) {
		if (!panoptikos.models.subreddit.isValidSubredditName(names[i])) {
			names.splice(i, 1);
			nameCount--;
		}
	}

	return names;
};

/**
 * writeSubredditsToLocationHash stores subreddits in the location hash.
 * @param {!Array.<string>} subreddits Each string is the name of a subreddit.
 */
panoptikos.models.subreddit.writeSubredditsToLocationHash = function(subreddits) {
	location.hash = subreddits.join("+");
};

/**
 * isValidSubredditName checks if value is a valid subreddit name, i.e. only
 * contains digits, letters and underscores.
 * @param {*} value
 * @return {boolean} Whether the subreddit name is valid.
 */
panoptikos.models.subreddit.isValidSubredditName = function(value) {
	return typeof(value) === "string" && /^[0-9a-zA-Z_]+$/.test(value);
};
