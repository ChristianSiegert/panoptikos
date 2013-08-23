app.provider("threadProcessor", function() {
	var imgurClientId = "";
	var maxThreadsToProcessSimultaneously = 3;

	this.setMaxThreadsToProcessSimultaneously = function(number) {
		maxThreadsToProcessSimultaneously = number;
	};

	this.setImgurClientId = function(id) {
		imgurClientId = id;
	}

	this.$get = function() {
		return new ThreadProcessor();
	};

	/**
	 * Class ThreadProcessor.
	 */
	var ThreadProcessor = function() {
		this.threadDict = [];
		this.queue = new Queue();
		this.threadsBeingProcessedCount = 0;
		this.runningRequests = [];
	}

	ThreadProcessor.prototype.clear = function() {
		this.cancelRequests();
		this.threadDict = [];
		this.queue = new Queue();
	};

	ThreadProcessor.prototype.addToQueue = function(thread, onProcessedFunc) {
		// Reddit's responses can contain threads that were received
		// previously. Prevent adding duplicate threads.
		if (this.threadDict[thread["id"]]) {
			console.log("Item " + thread["id"] + " already exists.");
			return;
		}

		var queueItem = new QueueItem(thread, onProcessedFunc);
		this.queue.addItem(queueItem);

		this.threadDict[thread["id"]] = true;
		this.processThreads();
	};

	ThreadProcessor.prototype.processThreads = function() {
		while (this.queue.getLength() > 0 && this.threadsBeingProcessedCount < maxThreadsToProcessSimultaneously) {
			this.threadsBeingProcessedCount++;
			var queueItem = this.queue.removeItemByIndex(0);

			var imgurUrlMatch = queueItem.thread["url"].match(/^https?:\/\/imgur\.com\/([a-zA-Z0-9]+)$/);

			if (imgurUrlMatch) {
				var image = $(new Image());
				image.on("error", {queueItem: queueItem}, $.proxy(this.handleImgurImageError, this));
				image.on("load", {queueItem: queueItem, image: image[0]}, $.proxy(this.handleImgurImageSuccess, this));
				image[0].src = queueItem.thread["url"] + "l.jpg";
				continue;
			}

			var imgurUrlMatch = queueItem.thread["url"].match(/^(https?:\/\/i\.imgur\.com\/[a-zA-Z0-9]+)\.(.+)$/);

			if (imgurUrlMatch) {
				var image = $(new Image());
				image.on("error", {queueItem: queueItem}, $.proxy(this.handleImgurImageError, this));
				image.on("load", {queueItem: queueItem, image: image[0]}, $.proxy(this.handleImgurImageSuccess, this));
				image[0].src = imgurUrlMatch[1] + "l." + imgurUrlMatch[2];
				continue;
			}

			if (queueItem.thread["url"].match(/\.(?:gif|jpeg|jpg|png)$/)) {
				var image = $(new Image());
				image.on("error", {queueItem: queueItem}, $.proxy(this.handleImageError, this));
				image.on("load", {queueItem: queueItem, image: image[0]}, $.proxy(this.handleImageSuccess, this));
				image[0].src = queueItem.thread["url"];
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
	};

	Queue.prototype.addItem = function(queueItem) {
		this.queueItems.push(queueItem);
	};

	Queue.prototype.getLength = function() {
		return this.queueItems.length;
	};

	Queue.prototype.removeItemByIndex = function(index) {
		if (this.queueItems.length === 0) {
			return false;
		}

		return this.queueItems.splice(index, 1)[0];
	};

	/**
	 * Class QueueItem.
	 */
	var QueueItem = function(thread, successFunc) {
		this.thread = thread;
		this.successFunc = successFunc;
	};
});
