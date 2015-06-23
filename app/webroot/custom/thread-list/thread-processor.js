(function() {
	"use strict";

	var maxThreadsToProcessSimultaneously = 2;

	// ThreadProcessor takes Reddit thread objects and tries to find preview
	// images based on the URL. For every processed thread, the corresponding
	// callback is executed.
	function ThreadProcessor() {
		this.threadDict = new ThreadDict();
		this.queue = new Queue();
		this.threadsBeingProcessedCount = 0;
		this.runningRequests = [];
	};

	ThreadProcessor.prototype.reset = function() {
		this.cancelRequests();
		this.threadDict = new ThreadDict();
		this.queue = new Queue();
	};

	ThreadProcessor.prototype.addToQueue = function(threadListItems, onProcessedItem) {
		for (var i = 0, count = threadListItems.length; i < count; i++) {
			var threadListItem = threadListItems[i];

			// Reddit’s responses can contain thread list items that were received
			// previously. Prevent adding duplicate threads.
			if (this.threadDict.exists(threadListItem["id"])) {
				continue;
			}
			this.threadDict.add(threadListItem["id"]);

			var queueItem = new QueueItem(threadListItem, onProcessedItem);
			this.queue.addItem(queueItem);
		}
		this.processThreads();
	};

	ThreadProcessor.prototype.processThreads = function() {
		while (this.queue.length > 0 && this.threadsBeingProcessedCount < maxThreadsToProcessSimultaneously) {
			this.threadsBeingProcessedCount++;
			var queueItem = this.queue.removeItemByIndex(0);
			var url = queueItem.thread["url"];

			var imgurUrlMatch = url.match(/^(https?):\/\/(?:(?:i|m)\.)?imgur\.com\/([a-zA-Z0-9]+)(\.[a-zA-Z0-9]+)?/);

			// If url points to Imgur album (http://imgur.com/a/...)
			if (imgurUrlMatch && imgurUrlMatch[2] === "a" && typeof(imgurUrlMatch[3]) === "undefined") {
				this.handleNonImageSuccess(queueItem);
				continue;
			}

			// If image is hosted on Imgur, try to load large preview version of
			// image unless it is a gif, then load the gif. If image has no file
			// extension, treat it as a jpeg image.
			if (imgurUrlMatch) {
				var imageElement = document.createElement("img");

				var timeoutId = setTimeout(function() {
					imageElement.onerror = null;
					imageElement.onload = null;
					this.handleNonImageSuccess(queueItem);
				}.bind(this), 30 * 1000, false);

				imageElement.onerror = this.handleImgurImageLoadError.bind(this, queueItem, timeoutId);
				imageElement.onload = this.handleImgurImageLoadSuccess.bind(this, queueItem, timeoutId, imageElement);

				var imageUrl = "";

				if (imgurUrlMatch[3] && imgurUrlMatch[3] === ".gif") {
					imageUrl = imgurUrlMatch[1] + "://i.imgur.com/" + imgurUrlMatch[2] + ".gif";
				} else if (imgurUrlMatch[3] && imgurUrlMatch[3] !== ".gif") {
					imageUrl = imgurUrlMatch[1] + "://i.imgur.com/" + imgurUrlMatch[2] + "l" + imgurUrlMatch[3];
				} else {
					imageUrl = imgurUrlMatch[1] + "://i.imgur.com/" + imgurUrlMatch[2] + "l.jpg";
				}

				// Start loading image
				imageElement.src = imageUrl;
				continue;
			}

			if (url.match(/\.(?:gif|jpeg|jpg|png)$/i)) {
				var imageElement = document.createElement("img");

				var timeoutId = setTimeout(function() {
					imageElement.onerror = null;
					imageElement.onload = null;
					this.handleNonImageSuccess(queueItem);
				}.bind(this), 30 * 1000);

				imageElement.onerror = this.handleImageLoadError.bind(this, queueItem, timeoutId);
				imageElement.onload = this.handleImageLoadSuccess.bind(this, queueItem, timeoutId, imageElement);

				// Start loading image
				imageElement.src = url;
				continue;
			}

			this.handleNonImageSuccess(queueItem);
		}
	};

	ThreadProcessor.prototype.handleImgurImageLoadError = function(queueItem, timeoutId, event) {
		clearTimeout(timeoutId);
		queueItem.callback(queueItem.thread, "");
		this.threadsBeingProcessedCount--;
		this.processThreads();
	};

	ThreadProcessor.prototype.handleImgurImageLoadSuccess = function(queueItem, timeoutId, imageElement, event) {
		clearTimeout(timeoutId);

		// Ignore Imgur's "Image does not exist" image
		// TODO: Find a way to make absolutely sure we are actually blocking
		// Imgur's "Image does not exist" image and not a random image with the
		// same dimensions.
		if (imageElement.width === 161 && imageElement.height === 81) {
			this.handleNonImageSuccess(queueItem);
			return;
		}

		queueItem.callback(queueItem.thread, imageElement.src);
		this.threadsBeingProcessedCount--;
		this.processThreads();
	};

	ThreadProcessor.prototype.handleImageLoadError = function(queueItem, timeoutId, event) {
		clearTimeout(timeoutId);
		queueItem.callback(queueItem.thread, "");
		this.threadsBeingProcessedCount--;
		this.processThreads();
	};

	ThreadProcessor.prototype.handleImageLoadSuccess = function(queueItem, timeoutId, imageElement, event) {
		clearTimeout(timeoutId);
		queueItem.callback(queueItem.thread, imageElement.src);
		this.threadsBeingProcessedCount--;
		this.processThreads();
	};

	ThreadProcessor.prototype.handleNonImageSuccess = function(queueItem) {
		queueItem.callback(queueItem.thread, "");
		this.threadsBeingProcessedCount--;
		this.processThreads();
	};

	// TODO: Cancel running requests.
	ThreadProcessor.prototype.cancelRequests = function() {
		for (var i = 0, requestCount = this.runningRequests.length; i < requestCount; i++) {
			// this.runningRequests[i].cancelme();
		}
	};

	// Queue stores zero or more QueueItem.
	function Queue() {
		this.queueItems = [];
		this.length = 0;
	};

	Queue.prototype.addItem = function(queueItem) {
		this.queueItems.push(queueItem);
		this.length++;
	};

	Queue.prototype.removeItemByIndex = function(index) {
		if (this.queueItems.length === 0) {
			return false;
		}

		this.length--;
		return this.queueItems.splice(index, 1)[0];
	};

	// QueueItem stores a thread and callback function.
	function QueueItem(thread, callback) {
		this.thread = thread;
		this.callback = callback;
	};

	// ThreadDict keeps track of which Reddit threads have already been added to
	// the queue at one point in time.
	function ThreadDict() {
		this.dict = {};
		this.length = 0;
	};

	ThreadDict.prototype.add = function(threadId) {
		this.dict[threadId] = true;
		this.length++;
	};

	ThreadDict.prototype.exists = function(threadId) {
		return !!this.dict[threadId];
	};

	sprinkles.provide("custom.threadList.ThreadProcessor", ThreadProcessor);
})();
