app.provider("threadProcessor", function() {
	"use strict";

	var imgurClientId = "";
	var maxThreadsToProcessSimultaneously = 3;

	this.setImgurClientId = function(id) {
		imgurClientId = id;
	}

	this.setMaxThreadsToProcessSimultaneously = function(number) {
		maxThreadsToProcessSimultaneously = number;
	};

	this.$get = function() {
		return new ThreadProcessor();
	};

	/**
	 * Class ThreadProcessor takes Reddit thread objects and tries to find
	 * preview images based on the URL. For every processed thread, the
	 * corresponding callback is executed.
	 */
	var ThreadProcessor = function() {
		this.threadDict = new ThreadDict();
		this.queue = new Queue();
		this.threadsBeingProcessedCount = 0;
		this.runningRequests = [];
	}

	ThreadProcessor.prototype.clear = function() {
		this.cancelRequests();
		this.threadDict = new ThreadDict();
		this.queue = new Queue();
	};

	ThreadProcessor.prototype.addToQueue = function(thread, onProcessedFunc) {
		// Reddit's responses can contain threads that were received
		// previously. Prevent adding duplicate threads.
		if (this.threadDict.exists(thread["id"])) {
			console.log("ThreadProcessor: Thread '%s' already exists in thread dictionary.", thread["id"]);
			return false;
		}

		var queueItem = new QueueItem(thread, onProcessedFunc);
		this.queue.addItem(queueItem);

		this.threadDict.add(thread["id"]);
		this.processThreads();
		return true;
	};

	ThreadProcessor.prototype.processThreads = function() {
		while (this.queue.length > 0 && this.threadsBeingProcessedCount < maxThreadsToProcessSimultaneously) {
			this.threadsBeingProcessedCount++;
			var queueItem = this.queue.removeItemByIndex(0);
			var url = queueItem.thread["url"];

			var imgurUrlMatch = url.match(/^(https?):\/\/(?:(?:i|m)\.)?imgur\.com\/([a-zA-Z0-9]+)(\..+)?$/);

			if (imgurUrlMatch) {
				var image = $(new Image());
				image.on("error", {queueItem: queueItem}, angular.bind(this, this.handleImgurImageError));
				image.on("load", {queueItem: queueItem, image: image[0]}, angular.bind(this, this.handleImgurImageSuccess));
				image[0].src = imgurUrlMatch[1] + "://i.imgur.com/" + imgurUrlMatch[2] + "l" + (imgurUrlMatch[3] ? imgurUrlMatch[3] : ".jpg");
				continue;
			}

			if (url.match(/\.(?:gif|jpeg|jpg|png)$/i)) {
				var image = $(new Image());
				image.on("error", {queueItem: queueItem}, angular.bind(this, this.handleImageError));
				image.on("load", {queueItem: queueItem, image: image[0]}, angular.bind(this, this.handleImageSuccess));
				image[0].src = url;
				continue;
			}

			this.handleNonImageSuccess(queueItem);
		}
	};

	ThreadProcessor.prototype.handleImgurImageError = function(event) {
		// console.log("Imgur image load error:", event.target.src, event);
		event.data.queueItem.successFunc(event.data.queueItem.thread);
		this.threadsBeingProcessedCount--;
		this.processThreads();
	};

	ThreadProcessor.prototype.handleImgurImageSuccess = function(event) {
		// console.log("Imgur image load success:", event);
		event.data.queueItem.successFunc(event.data.queueItem.thread, event.data.image.src);
		// console.log(event.data.image);
		this.threadsBeingProcessedCount--;
		this.processThreads();
	};

	ThreadProcessor.prototype.handleImageError = function(event) {
		// console.log("Image load error:", event.target.src, event);
		event.data.queueItem.successFunc(event.data.queueItem.thread);
		this.threadsBeingProcessedCount--;
		this.processThreads();
	};

	ThreadProcessor.prototype.handleImageSuccess = function(event) {
		// console.log("Image load success:", event);
		event.data.queueItem.successFunc(event.data.queueItem.thread, event.data.image.src);
		// console.log(event.data.image);
		this.threadsBeingProcessedCount--;
		this.processThreads();
	};

	ThreadProcessor.prototype.handleNonImageSuccess = function(queueItem) {
		queueItem.successFunc(queueItem.thread, "");
		this.threadsBeingProcessedCount--;
		this.processThreads();
	};

	// TODO: Cancel running requests.
	ThreadProcessor.prototype.cancelRequests = function() {
		for (var i = 0, requestCount = this.runningRequests.length; i < requestCount; i++) {
			this.runningRequests[i].cancelme();
		}
	};

	/**
	 * Class Queue.
	 */
	var Queue = function() {
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

	/**
	 * Class QueueItem.
	 */
	var QueueItem = function(thread, successFunc) {
		this.thread = thread;
		this.successFunc = successFunc;
	};

	/**
	 * Class ThreadDict is used to keep track of which Reddit threads have
	 * already been added to the queue at one point in time.
	 */
	var ThreadDict = function() {
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
});
