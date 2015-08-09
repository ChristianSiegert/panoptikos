(function() {
	"use strict";

	var template = new sprinkles.Template("/thread-list/thread-list.html");

	var ColumnsManager    = custom.threadList.ColumnsManager;
	var Config            = custom.main.Config;
	var Settings          = custom.settings.Settings;
	var ThreadListRequest = custom.reddit.ThreadListRequest;
	var ThreadProcessor   = custom.threadList.ThreadProcessor;

	function ThreadListController(router) {
		this.router = router;
		this.threadProcessor = new ThreadProcessor();

		this.columnsManager;
		this.threadListElement;
		this.threadListRequest;

		this.imagelessPostsCount = 0;
		this.onlyShowPostsWithImages = false;

		// sectionsElement is the button bar for switching Reddit sections.
		this.sectionsElement = null;
	};

	ThreadListController.prototype.init = function() {
		this.router.registerRoute("/", this.loadPage.bind(null, this.handleList.bind(this)));

		// this.router.registerRoute("/:section", function(params) {
		// 	this.loadPage(this.handleList.bind(this, params));
		// }.bind(this));

		// this.router.registerRoute("/r/:subredditIds", function(params) {
		// 	this.loadPage(this.handleList.bind(this, params));
		// }.bind(this));

		// this.router.registerRoute("/r/:subredditIds/:section", function(params) {
		// 	this.loadPage(this.handleList.bind(this, params));
		// }.bind(this));

		this.router.registerRoute("/r/([^/]*)", function(params) {
			this.loadPage(this.handleList.bind(this, params))
		}.bind(this));
	};

	ThreadListController.prototype.loadPage = function(onSuccess) {
		var page = new sprinkles.Page(document.getElementById("content"), template);
		page.load(onSuccess);
	};

	ThreadListController.prototype.handleList = function(params) {
		this.onlyShowPostsWithImages = Settings.getOnlyShowPostsWithImages();
		this.threadProcessor.reset();
		this.threadListElement = document.getElementById("thread-list");

		if (!this.threadListElement) {
			app.logger.error(["ThreadListController: Element is missing."]);
			return;
		}

		// this.sectionsElement.addEventListener("click", this.onSectionsClick.bind(this));

		this.columnsManager = new ColumnsManager(
			this.threadListElement,
			Config.threadList.minPreviewImageWidth,
			10,
			"board-column",
			this.loadMoreToFillPage.bind(this)
		);
		this.columnsManager.rebuild();

		var subredditIds = [];

		if (params && params.length > 0) {
			subredditIds = getSubredditIdsFromParam(params[0]);
		}

		if (subredditIds.length === 0) {
			subredditIds = Config.defaultSubredditIds;
		}

		this.threadListRequest = new ThreadListRequest(subredditIds);
		this.threadListRequest.onError = this.onThreadListRequestError.bind(this);
		this.threadListRequest.onSuccess = this.onThreadListRequestSuccess.bind(this);
		this.threadListRequest.send();

		window.addEventListener("scroll", this.onWindowScroll.bind(this));
	};

	ThreadListController.prototype.onThreadListRequestError = function(event) {
		// TODO: Handle request error.
		console.error("error", event);
	};

	ThreadListController.prototype.onThreadListRequestSuccess = function(threadListItems) {
		this.threadProcessor.addToQueue(threadListItems, this.onProcessedItem.bind(this));
	};

	ThreadListController.prototype.onProcessedItem = function(threadListItem, imagePreviewUrl) {
		if (this.onlyShowPostsWithImages && !imagePreviewUrl) {
			this.imagelessPostsCount++;
			return;
		}
		threadListItem.imagePreviewUrl = imagePreviewUrl;

		var threadListItemElement = threadListItem.toElement(
			Settings.getShowPostTitles(),
			Settings.getShowInfo()
		);

		this.columnsManager.addItems([threadListItemElement]);
	};

	// loadMoreToFillPage sends a request to Reddit to retrieve more thread list
	// items if the page is not filled yet.
	ThreadListController.prototype.loadMoreToFillPage = function(isScrolledToBottom) {
		// Don’t load more thread list items from Reddit unless all but one have
		// been added to the page.
		if (!isScrolledToBottom
				|| this.columnsManager.itemElements.length === 0
				|| this.columnsManager.itemElements.length < this.threadProcessor.threadDict.length - 1 - this.imagelessPostsCount) {
			return;
		}

		this.threadListRequest.send();
	};

	ThreadListController.prototype.onSectionsClick = function(event) {
		var supportedSections = ["controversial", "hot", "new", "rising", "top"];
		var section = event.target.getAttribute("data-section");
		if (supportedSections.indexOf(section) === -1) {
			return;
		}

		var url = "/" + section;
		this.router.dispatchRequest(url);
	};

	ThreadListController.prototype.onWindowScroll = function(event) {
		if (this.columnsManager.isScrolledToBottom()) {
			this.loadMoreToFillPage(true);
		}
	};

	// getSubredditIdsFromParam parses param and returns an array of subreddit
	// ids.
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

	sprinkles.provide("custom.threadList.ThreadListController", ThreadListController);
})();
