(function() {
	"use strict";

	// var ThreadListItem = sprinkles.require("custom.reddit.ThreadListItem");

	// ThreadListRequest retrieves thread list items from Reddit. Thread list
	// items are what you see when you browse a subreddit, they are basically
	// previews of threads with basic information.
	//
	// subredditIds is an array of strings, each string being a subreddit
	// id. If the array is empty, thread list items from Reddit /r/all are
	// retrieved.
	//
	// section is one of Reddit’s sections, i.e. “controversial”,  “hot”,
	// “new”, “rising” or “top”. Defaults to “hot”.
	//
	// maxItems is the number of thread list items per request. Defaults to 25.
	function ThreadListRequest(subredditIds, section, maxItems) {
		// lastThreadId is the id of the last thread of the retrieved items. It
		// is used as a cursor for retrieving more thread list items.
		this.lastThreadId;

		// maxItems is the maximum number of thread list items to retrieve per
		// request.
		this.maxItems = maxItems;

		// maxQueuedCount is the maximum number of requests that can be queued.
		// This number includes the running request.
		this.maxQueuedCount = 1;

		// onError is a function that is called when the request failed.
		this.onError;

		// onSuccess is a function that is called when the request succeeded.
		this.onSuccess;

		// queuedCount is the number of requests that are waiting to be
		// executed.
		this.queuedCount = 0;

		// section is a Reddit section, i.e. “controversial”,  “hot”, “new”,
		// “rising” or “top”.
		this.section = section;

		// subredditIds is an array of ids of subreddits for which thread list
		// items should be retrieved.
		this.subredditIds = subredditIds;
	}

	// send queries the Reddit API for thread list items. It can be called
	// multiple times to retrieve subsequent items. If send is called while a
	// request is running, the new request will be queued until the request
	// completed. If send is called and maxQueuedCount is reached, no new
	// request will be queued. If maxItems is not set, it defaults to 25.
	ThreadListRequest.prototype.send = function() {
		if (this.queuedCount === this.maxQueuedCount) {
			return;
		}

		this.queuedCount++;

		if (this.queuedCount > 1) {
			return;
		}

		send(this);
	}

	function send(threadListRequest) {
		var url = "http://www.reddit.com";

		if (threadListRequest.subredditIds) {
			url += "/r/" + threadListRequest.subredditIds.join("+");
		}

		if (typeof(threadListRequest.section) === "string") {
			url += "/" + threadListRequest.section;
		}

		if (!threadListRequest.lastThreadId) {
			threadListRequest.lastThreadId = "";
		}

		if (typeof(threadListRequest.maxItems) !== "number"
				|| threadListRequest.maxItems === NaN) {
			threadListRequest.maxItems = 25;
		}

		url += "/.json"
			+ "?after=" + threadListRequest.lastThreadId
			+ "&limit=" + threadListRequest.maxItems
		;

		var request = new XMLHttpRequest();
		request.onerror = onError.bind(null, threadListRequest);
		request.onload = onSuccess.bind(null, threadListRequest);
		request.open("GET", url);
		request.send();
	}

	function onError(threadListRequest, event) {
		console.error(event);
		threadListRequest.queuedCount = 0;

		if (typeof(threadListRequest.onError) === "function") {
			threadListRequest.onError();
		}
	}

	function onSuccess(threadListRequest, event) {
		threadListRequest.queuedCount--;

		if (event.target.status !== 200) {
			if (typeof(threadListRequest.onError) === "function") {
				threadListRequest.onError(event);
			}
			return;
		}

		var json;

		try {
			json = JSON.parse(event.target.responseText);
		} catch (error) {
			console.error(error);
			if (typeof(threadListRequest.onError) === "function") {
				threadListRequest.onError(event);
			}
			return;
		}

		threadListRequest.lastThreadId = json.data.after;

		var threadListItems = threadListItemsFromApiItems(json.data.children);
		if (typeof(threadListRequest.onSuccess) === "function") {
			threadListRequest.onSuccess(threadListItems, event);
		}

		if (threadListRequest.queuedCount > 0) {
			send(threadListRequest);
		}
	}

	function threadListItemsFromApiItems(apiItems) {
		var threadListItems = [];

		for (var i = 0, count = apiItems.length; i < count; i++) {
			var item = new custom.reddit.ThreadListItem(apiItems[i]);
			threadListItems.push(item);
		}

		return threadListItems;
	}

	sprinkles.provide("custom.reddit.ThreadListRequest", ThreadListRequest);
})();
