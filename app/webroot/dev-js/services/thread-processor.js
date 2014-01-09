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

	this.$get = ["$timeout", function($timeout) {
		return new ThreadProcessor($timeout);
	}];

	/**
	 * Class ThreadProcessor takes Reddit thread objects and tries to find
	 * preview images based on the URL. For every processed thread, the
	 * corresponding callback is executed.
	 */
	function ThreadProcessor($timeout) {
		this.threadDict = new ThreadDict();
		this.queue = new Queue();
		this.threadsBeingProcessedCount = 0;
		this.runningRequests = [];
		this.$timeout = $timeout;
	};

	ThreadProcessor.prototype.clear = function() {
		this.cancelRequests();
		this.threadDict = new ThreadDict();
		this.queue = new Queue();
	};

	ThreadProcessor.prototype.addToQueue = function(thread, onProcessedFunc) {
		// Reddit's responses can contain threads that were received
		// previously. Prevent adding duplicate threads.
		if (this.threadDict.exists(thread["id"])) {
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
				var image = $(new Image());

				var errorCallback = angular.bind(this, this.handleImgurImageLoadError);
				var successCallback = angular.bind(this, this.handleImgurImageLoadSuccess);

				var timeout = this.$timeout(angular.bind(this, function() {
					image.off();
					this.handleNonImageSuccess(queueItem);
				}), 30 * 1000, false);

				image.on("error", null, {queueItem: queueItem, timeout: timeout}, errorCallback);
				image.on("load", null, {queueItem: queueItem, timeout: timeout, image: image[0]}, successCallback);

				var imageUrl = "";

				if (imgurUrlMatch[3] && imgurUrlMatch[3] === ".gif") {
					imageUrl = imgurUrlMatch[1] + "://i.imgur.com/" + imgurUrlMatch[2] + ".gif";
				} else if (imgurUrlMatch[3] && imgurUrlMatch[3] !== ".gif") {
					imageUrl = imgurUrlMatch[1] + "://i.imgur.com/" + imgurUrlMatch[2] + "l" + imgurUrlMatch[3];
				} else {
					imageUrl = imgurUrlMatch[1] + "://i.imgur.com/" + imgurUrlMatch[2] + "l.jpg";
				}

				// Start loading image
				image[0].src = imageUrl;
				continue;
			}

			if (url.match(/\.(?:gif|jpeg|jpg|png)$/i)) {
				var image = $(new Image());

				var errorCallback = angular.bind(this, this.handleImageLoadError);
				var successCallback = angular.bind(this, this.handleImageLoadSuccess);

				var timeout = this.$timeout(angular.bind(this, function() {
					image.off();
					this.handleNonImageSuccess(queueItem);
				}), 30 * 1000, false);

				image.on("error", null, {queueItem: queueItem, timeout: timeout}, errorCallback);
				image.on("load", null, {queueItem: queueItem, timeout: timeout, image: image[0]}, successCallback);

				// Start loading image
				image[0].src = url;
				continue;
			}

			this.handleNonImageSuccess(queueItem);
		}
	};

	ThreadProcessor.prototype.handleImgurImageLoadError = function(event) {
		this.$timeout.cancel(event.data.timeout);
		event.data.queueItem.callback(event.data.queueItem.thread, "");
		this.threadsBeingProcessedCount--;
		this.processThreads();
	};

	ThreadProcessor.prototype.handleImgurImageLoadSuccess = function(event) {
		this.$timeout.cancel(event.data.timeout);

		// Ignore Imgur's "Image does not exist" image
		// TODO: Find a way to make absolutely sure we are actually blocking
		// Imgur's "Image does not exist" image and not a random image with the
		// same dimensions.
		if (event.data.image.width === 161 && event.data.image.height === 81) {
			this.handleNonImageSuccess(event.data.queueItem);
			return;
		}

		event.data.queueItem.callback(event.data.queueItem.thread, event.data.image.src);
		this.threadsBeingProcessedCount--;
		this.processThreads();
	};

	ThreadProcessor.prototype.handleImageLoadError = function(event) {
		this.$timeout.cancel(event.data.timeout);
		event.data.queueItem.callback(event.data.queueItem.thread, "");
		this.threadsBeingProcessedCount--;
		this.processThreads();
	};

	ThreadProcessor.prototype.handleImageLoadSuccess = function(event) {
		this.$timeout.cancel(event.data.timeout);
		event.data.queueItem.callback(event.data.queueItem.thread, event.data.image.src);
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

	/**
	 * Class Queue.
	 */
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

	/**
	 * Class QueueItem.
	 */
	function QueueItem(thread, callback) {
		this.thread = thread;
		this.callback = callback;
	};

	/**
	 * Class ThreadDict is used to keep track of which Reddit threads have
	 * already been added to the queue at one point in time.
	 */
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
});
