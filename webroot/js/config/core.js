goog.provide("panoptikos.config.core");

/**
 * Dimensions in pixels.
 * @type {!Object}
 */
panoptikos.config.core.board = {
	columnMarginLeft: 10,
	columnMaxWidth: 328
};

/**
 * @type {!Object}
 */
panoptikos.config.core.network = {
	timeout: 30000 // in milliseconds
};

/**
 * @type {!Object}
 */
panoptikos.config.core.reddit = {
	maxThreadsPerRequest: 25
};
