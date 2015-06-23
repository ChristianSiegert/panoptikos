(function() {
	"use strict";

	var template = new sprinkles.Template("/thread-list/thread-list.html");

	var ThreadListController = function() {
		this.threadProcessor = new custom.threadList.ThreadProcessor();

		this.columnsManager;
		this.threadListElement;
		this.threadListRequest;
	};

	ThreadListController.prototype.init = function(){
		app.router.registerRoute("/", this.loadPage.bind(null, this.handleList.bind(this)));

		app.router.registerRoute("/r/([^/]*)", function(params) {
			this.loadPage(this.handleList.bind(this, params))
		}.bind(this));
	};

	ThreadListController.prototype.loadPage = function(onSuccess) {
		var page = new sprinkles.Page(document.getElementById("content"), template);
		page.load(onSuccess);
	};

	ThreadListController.prototype.handleList = function(params) {
		this.threadProcessor.reset();

		this.threadListElement = document.getElementById("thread-list");
		this.columnsManager = new custom.threadList.ColumnsManager(this.threadListElement, 400, 10, "board-column", this.loadMoreToFillPage.bind(this));
		this.columnsManager.rebuild();

		var subredditIds = [];

		if (params && params.length > 0) {
			subredditIds = getSubredditIdsFromParam(params[0]);
		}

		if (subredditIds.length === 0) {
			subredditIds = custom.main.config.defaultSubredditIds;
		}

		this.threadListRequest = new custom.reddit.ThreadListRequest(subredditIds);
		this.threadListRequest.onError = this.onThreadListRequestError.bind(this);
		this.threadListRequest.onSuccess = this.onThreadListRequestSuccess.bind(this);
		this.threadListRequest.send();

		window.addEventListener("scroll", this.onWindowScroll.bind(this));
	}

	ThreadListController.prototype.onThreadListRequestError = function(event) {
		// TODO: Handle request error.
		console.error("error", event);
	};

	ThreadListController.prototype.onThreadListRequestSuccess = function(threadListItems) {
		var onProcessedItem = function(threadListItem, imagePreviewUrl) {
			threadListItem.imagePreviewUrl = imagePreviewUrl;
			this.columnsManager.addItems([threadListItem.toElement()]);
		}.bind(this);

		this.threadProcessor.addToQueue(threadListItems, onProcessedItem);
	};

	// loadMoreToFillPage sends a request to Reddit to retrieve more thread list
	// items if the page is not filled yet.
	ThreadListController.prototype.loadMoreToFillPage = function(isScrolledToBottom) {
		// Don’t load more threads from Reddit unless all but one thread list
		// item have been added to the page.
		if (!isScrolledToBottom
				|| this.columnsManager.itemElements.length === 0
				|| this.columnsManager.itemElements.length < this.threadProcessor.threadDict.length - 1) {
			return;
		}

		this.threadListRequest.send();
	}

	ThreadListController.prototype.onWindowScroll = function(event) {
		if (this.columnsManager.isScrolledToBottom()) {
			this.loadMoreToFillPage(true);
		}
	}

	// getSubredditIdsFromParam parses param to extract subreddit ids, e.g.
	// “aww+flower” to ["aww", "flower"].
	function getSubredditIdsFromParam(param) {
		var subredditIds = [];

		var pieces = param.split("+");
		for (var i = 0, count = pieces.length; i < count; i++) {
			var piece = pieces[i];
			if (piece.length > 0) {
				subredditIds.push(piece);
			}
		}

		return subredditIds;
	}

	var controller = new ThreadListController();
	app.addInitFunc(controller.init.bind(controller));
})();
