goog.provide("app");

app.start = function() {
	var boardElement = $("board");

	if (!boardElement) {
		console.error("app: HTML element with id 'board' could not be found.");
		return;
	}

	var board = new app.ui.Board(
		boardElement,
		app.config.core.board.columnMaxWidth,
		app.config.core.board.columnMarginLeft
	);
	board.initialize();
	board.rebuild();

	var boardControls = new app.ui.BoardControls();
	var boardControlsElement = boardControls.create();
	goog.dom.appendChild(document.body, boardControlsElement);

	var subredditPickerLauncherElement = new app.ui.SubredditPickerLauncher().toElement();
	goog.dom.insertChildAt(document.body, subredditPickerLauncherElement, 0);

	window.fireEvent("app.ui.boardControls.userDidAskForImages");
};

