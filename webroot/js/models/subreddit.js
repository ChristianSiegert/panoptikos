goog.provide("app.models.subreddit");

/**
 * Names of subreddits that are selected for the user by default. Can be
 * overwritten by setDefaultSubreddits.
 * @type {Array.<string>} Each string is the name of a subreddit.
 * @private
 */
app.models.subreddit.defaultSubreddits = [
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
 * getDefaultSubreddits returns the subreddits that are selected by default.
 * @return {Array.<string>} Each string is the name of a subreddit.
 */
app.models.subreddit.getDefaultSubreddits = function() {
	return app.models.subreddit.defaultSubreddits.slice();
}

/**
 * setDefaultSubreddits sets the subreddits that are selected by default.
 * @param {Array.<string>} subreddits Each string is the name of a subreddit.
 */
app.models.subreddit.setDefaultSubreddits = function(subreddits) {
	app.models.subreddit.defaultSubreddits = subreddits;
};

/**
 * getSelectedSubreddits searches the location hash for valid subreddit names
 * and returns them. If no valid subreddit names were found and
 * useDefaultSubredditsAsFallback is true, it returns the names of the default
 * subreddits.
 * @param {boolean} useDefaultSubredditsAsFallback Whether to use the default subreddits. Defaults to true.
 * @return {Array.<string>} Each string is the name of a subreddit.
 */
app.models.subreddit.getSelectedSubreddits = function(useDefaultSubredditsAsFallback) {
	if (typeof(useDefaultSubredditsAsFallback) !== "boolean") {
		useDefaultSubredditsAsFallback = true;
	}

	if (app.models.subreddit.selectedSubreddits.length === 0 && useDefaultSubredditsAsFallback) {
		return app.models.subreddit.getDefaultSubreddits();
	}

	return app.models.subreddit.selectedSubreddits.slice();
}

/**
 * @param {Array.<string>} subreddits Each string is the name of a subreddit.
 */
app.models.subreddit.setSelectedSubreddits = function(subreddits) {
	app.models.subreddit.selectedSubreddits = subreddits;
};

/**
 * addToSelectedSubreddits adds the provided subreddit name to the list of
 * selected subreddits and updates the location hash (our storage).
 * @param {string} subredditName
 */
app.models.subreddit.addToSelectedSubreddits = function(subredditName) {
	var subredditNames = app.models.subreddit.getSelectedSubreddits(false);
	var index = subredditNames.indexOf(subredditName);

	if (index >= 0) {
		return;
	}

	subredditNames.push(subredditName);
	app.models.subreddit.setSelectedSubreddits(subredditNames);
	app.models.subreddit.writeSelectedSubredditsToLocationHash();
}

/**
 * removeFromSelectedSubreddits removes the provided subreddit name from the
 * list of selected subreddits and updates the location hash (our storage).
 * @param {string} subredditName
 */
app.models.subreddit.removeFromSelectedSubreddits = function(subredditName) {
	var subredditNames = app.models.subreddit.getSelectedSubreddits(false);
	var index = subredditNames.indexOf(subredditName);

	if (index < 0) {
		return;
	}

	subredditNames.splice(index, 1);
	app.models.subreddit.setSelectedSubreddits(subredditNames);
	app.models.subreddit.writeSelectedSubredditsToLocationHash();
};

/**
 * haveSelectedSubredditsChanged compares two arrays of subreddit names to
 * determine if there is a difference.
 * @param {Array.<string>} currentlySelectedSubreddits Each string is the name of a subreddit.
 * @param {Array.<string>} originallySelectedSubreddits Each string is the name of a subreddit.
 * @return {boolean} Whether there is a difference.
 */
app.models.subreddit.haveSelectedSubredditsChanged = function(currentlySelectedSubreddits, originallySelectedSubreddits) {
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
 * readSelectedSubredditsFromLocationHash searches the location hash for
 * valid subreddit names and returns them.
 * @return {Array.<string>} Each string is the name of a subreddit.
 */
app.models.subreddit.readSelectedSubredditsFromLocationHash = function() {
	// Remove "#" character from beginning of location hash and split location hash at "+" character
	var names = location.hash.replace(/^#/, "").split("+");

	// Remove invalid subreddit names
	for (var i = 0, nameCount = names.length; i < nameCount; i++) {
		if (!app.models.subreddit.isValidSubredditName(names[i])) {
			names.splice(i, 1);
			nameCount--;
		}
	}

	return names;
};

/**
 * writeSelectedSubredditsToLocationHash stores the selected subreddits in the
 * location hash.
 */
app.models.subreddit.writeSelectedSubredditsToLocationHash = function() {
	location.hash = app.models.subreddit.getSelectedSubreddits(false).join("+");
};

/**
 * isValidSubredditName checks if value is a valid subreddit name, i.e. only
 * contains digits, letters and underscores.
 * @param {*} value
 * @return {boolean} Whether the subreddit name is valid.
 */
app.models.subreddit.isValidSubredditName = function(value) {
	return typeof(value) === "string" && /^[0-9a-zA-Z_]+$/.test(value));
};

/**
 * @type {Array.<string>}
 * @private
 */
app.models.subreddit.selectedSubreddits = app.models.subreddit.readSelectedSubredditsFromLocationHash();

if (app.models.subreddit.selectedSubreddits.length === 0) {
	app.models.subreddit.selectedSubreddits = app.models.subreddit.getDefaultSubreddits();
}
