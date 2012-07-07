window.addEvent("domready", function() {
	var boardElement = $("board");

	if (!boardElement) {
		return;
	}

	var board = app.views.board.createInstance(boardElement, app.config.core.board.columnWidth, app.config.core.board.columnLeftMargin);
	board.initialize();
	board.rebuild();

	var boardControls = app.views.boardControls.createInstance();
	var boardControlsElement = boardControls.create();
	$(document.body).grab(boardControlsElement);


	// var view = app.views.main.createView();

	// var infoContainer = view.createInfoContainer();
	// $(document.body).grab(infoContainer);

	// var imageColumnsContainer = view.createImageColumnsContainer();
	// $(document.body).grab(imageColumnsContainer);

	// var loadMoreAnchor = view.createLoadMoreAnchor();
	// $(document.body).grab(loadMoreAnchor);

	// view.fillList(imageColumnsContainer);
});
