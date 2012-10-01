goog.provide("panoptikos.Panoptikos");

goog.require("panoptikos.config.core");
goog.require("panoptikos.ui.Board");
goog.require("panoptikos.ui.BoardControls");
goog.require("panoptikos.ui.BoardControlsEvent");
goog.require("panoptikos.ui.SubredditPicker");
goog.require("panoptikos.ui.SubredditPickerLauncher");
goog.require("goog.dom");
goog.require("goog.events");

/**
 * @constructor
 */
panoptikos.Panoptikos = function() {
	var boardElement = goog.dom.getElement("board");

	var subredditPickerLauncherElement = new panoptikos.ui.SubredditPickerLauncher().toElement();
	goog.dom.insertSiblingBefore(subredditPickerLauncherElement, boardElement);

	goog.events.listen(
		subredditPickerLauncherElement,
		goog.events.EventType.CLICK,
		this.openSubredditLauncher_,
		false,
		this
	);

	this.board = new panoptikos.ui.Board(
		boardElement,
		panoptikos.config.core.board.columnMaxWidth,
		panoptikos.config.core.board.columnMarginLeft,
		panoptikos.config.core.reddit.maxThreadsPerRequest
	);
	this.board.rebuild();

	var boardControls = new panoptikos.ui.BoardControls();

	goog.events.listen(
		this.board,
		panoptikos.ui.Board.EventType.DID_COMPLETE_REQUEST,
		boardControls.updateLoadMoreButtonText,
		false,
		boardControls
	);

	goog.events.listen(
		boardControls,
		panoptikos.ui.BoardControls.EventType.USER_DID_ASK_FOR_IMAGES,
		this.board.retrieveThreadsFromReddit,
		false,
		this.board
	);

	var boardControlsElement = boardControls.toElement();
	goog.dom.appendChild(document.body, boardControlsElement);

	boardControls.dispatchEvent(new panoptikos.ui.BoardControlsEvent(panoptikos.ui.BoardControls.EventType.USER_DID_ASK_FOR_IMAGES));
};
goog.exportSymbol("panoptikos.Panoptikos", panoptikos.Panoptikos);

/**
 * @private
 */
panoptikos.Panoptikos.prototype.openSubredditLauncher_ = function(event) {
	event.preventDefault();
	var subredditPicker = new panoptikos.ui.SubredditPicker();

	goog.events.listen(
		subredditPicker,
		panoptikos.ui.SubredditPicker.EventType.USER_DID_CHANGE_SELECTED_SUBREDDITS,
		this.board.handleUserDidChangeSelectedSubredditsEvent,
		false,
		this.board
	);

	subredditPicker.open();
};
