(function() {
	"use strict";

	function ColumnsManager(containerElement, columnMinWidth, gapWidth, columnCssClassName, onDidAddItem) {
		this.columnCssClassName = columnCssClassName;
		this.columnMinWidth = columnMinWidth;
		this.containerElement = containerElement;
		this.gapWidth = gapWidth;

		this.columnElements = [];
		this.columnHeights = [];
		this.columnWidth = 0;

		this.itemElements = [];
		this.itemElementsToProcess = [];
		this.isProcessingItems = false;

		this.isIe9 = this.testForIe9();
		this.resizeTimeoutId;
		this.styleElement;
		this.supportsCssCalc = this.testCssCalcSupport();
		this.windowElement = window;

		this.windowElement.addEventListener("resize", this.onWindowResize.bind(this));
		this.onDidAddItem = onDidAddItem;
	}

	// addItems takes HTML elements, loads any images from included <img>
	// elements, and then displays the elements. Each element is displayed as
	// soon as all its images are loaded or failed to load.
	ColumnsManager.prototype.addItems = function(items) {
		for (var i = 0, count = items.length; i < count; i++) {
			this.itemElementsToProcess.push(items[i]);
		}
		this.processItems();
	};

	ColumnsManager.prototype.processItems = function() {
		if (this.isProcessingItems || this.itemElementsToProcess.length === 0) {
			return;
		}
		this.isProcessingItems = true;

		var itemElement = this.itemElementsToProcess.splice(0, 1)[0];
		var imageElements = itemElement.getElementsByTagName("img");
		var imageCount = imageElements.length;

		if (!imageCount) {
			this.itemElements.push(itemElement);
			this.distributeItems([itemElement]);
			this.isProcessingItems = false;
			this.processItems();
			return;
		}

		var loadedCount = 0;

		for (var i = 0; i < imageCount; i++) {
			var func = (function(item) {
				loadedCount += 1;
				if (loadedCount === imageCount) {
					this.itemElements.push(itemElement);
					this.distributeItems([itemElement]);
					this.isProcessingItems = false;
					this.processItems();
				}
			}).bind(this, itemElement);

			var image = document.createElement("img");
			image.addEventListener("error", func);
			image.addEventListener("load", func);

			// Start loading image
			image.src = imageElements[i].src;
		}
	};

	ColumnsManager.prototype.onWindowResize = function() {
		clearTimeout(this.resizeTimeoutId);
		this.resizeTimeoutId = setTimeout(this.rebuild.bind(this), 10);
	};

	ColumnsManager.prototype.rebuild = function() {
		var optimalColumnCount = this.getOptimalColumnCount();
		var optimalColumnWidth = this.getOptimalColumnWidth(optimalColumnCount);

		if (optimalColumnCount === this.columnElements.length
				&& (this.supportsCssCalc || optimalColumnWidth === this.columnWidth)) {
			return;
		}

		this.columnWidth = optimalColumnWidth;
		this.updateStyle(optimalColumnCount);

		// Delete columns
		this.containerElement.innerHTML = "";
		this.columnElements = [];
		this.columnHeights = [];

		// Create new columns
		for (var i = 0; i < optimalColumnCount; i++) {
			var columnElement = document.createElement("ul");
			columnElement.className = this.columnCssClassName;

			if (i === optimalColumnCount - 1) {
				columnElement.className += " last-child";
			}

			this.columnElements.push(columnElement);
			this.columnHeights.push(0);
			this.containerElement.appendChild(columnElement);
		}

		// Redistribute item elements across columns
		this.distributeItems(this.itemElements);
	};

	ColumnsManager.prototype.distributeItems = function(itemElements) {
		for (var i = 0, count = itemElements.length; i < count; i++) {
			var index = this.getIndexOfShortestColumn();

			if (index === null) {
				console.error("ColumnsManager.distributeItems: Index of shortest column is null.");
				return;
			}

			this.columnElements[index].appendChild(itemElements[i]);
			this.columnHeights[index] = this.columnElements[index].getBoundingClientRect().height;
		}

		if (itemElements.length > 0 && typeof(this.onDidAddItem) === "function") {
			this.onDidAddItem(this.isScrolledToBottom());
		}
	};

	ColumnsManager.prototype.getAvailableWidth = function() {
		// TODO: Check if this IE workaround can be removed.
		if (this.isIe9) {
			return this.containerElement.offsetWidth;
		}

		var rect = this.containerElement.getBoundingClientRect();
		if (!rect.hasOwnProperty("width")) {
			return this.containerElement.offsetWidth;
		}
		return rect.width;
	};

	ColumnsManager.prototype.getOptimalColumnCount = function() {
		return 1 + Math.max(
			Math.floor((this.getAvailableWidth() - this.columnMinWidth) / (this.columnMinWidth + this.gapWidth)),
			0
		);
	};

	ColumnsManager.prototype.getOptimalColumnWidth = function(columnCount) {
		var totalGapWidth = (columnCount - 1) * this.gapWidth;
		return Math.floor((this.getAvailableWidth() - totalGapWidth) / columnCount);
	};

	ColumnsManager.prototype.getIndexOfShortestColumn = function() {
		var columnHeightCount = this.columnHeights.length;

		if (columnHeightCount === 0) {
			return null;
		}

		if (columnHeightCount === 1) {
			return 0;
		}

		var shortestColumnHeight = null;
		var shortestColumnIndex = null;

		for (var i = 0; i < columnHeightCount; i++) {
			if (shortestColumnHeight === null || this.columnHeights[i] < shortestColumnHeight) {
				shortestColumnHeight = this.columnHeights[i];
				shortestColumnIndex = i;
			}
		}

		return shortestColumnIndex;
	};

	// isScrolledToBottom returns true if the bottom of the shortest column is
	// close to or higher than the bottom of the window.
	ColumnsManager.prototype.isScrolledToBottom = function() {
		var index = this.getIndexOfShortestColumn();

		if (index === null) {
			console.error("ColumnsManager.prototype.isScrolledToBottom: Index of shortest column is null.");
			return false;
		}

		var columnElement = this.columnElements[index];
		var columnBottom = window.scrollY + columnElement.getBoundingClientRect().bottom;
		var windowBottom = window.scrollY + window.innerHeight;

		return columnBottom < windowBottom + Math.min(400, this.columnElements.length * 100);
	};

	// supportsCssCalc returns true if the browser supports “-webkit-calc()”,
	// “-moz-calc()” or ”calc()”.
	ColumnsManager.prototype.testCssCalcSupport = function() {
		var element = document.createElement("div");
		element.style.cssText = "width:-webkit-calc(1px);width:-moz-calc(1px);width:calc(1px);";
		return !!element.style.length;
	};

	// testForIe9 returns true if the browser is IE 9 or below.
	ColumnsManager.prototype.testForIe9 = function() {
		return !!document.all && !window.atob;
	};

	ColumnsManager.prototype.updateStyle = function(columnCount) {
		var formula = "100% / " + columnCount + " - 10.1px * " + (columnCount - 1) + " / " + columnCount;

		var style = "." + this.columnCssClassName + "{" +
			"width: -webkit-calc(" + formula + ");" +
			"width:    -moz-calc(" + formula + ");" +
			"width:         calc(" + formula + ");" +
		"}";

		if (!this.supportsCssCalc) {
			style = "." + this.columnCssClassName + "{" +
				"width:" + this.columnWidth + "px;" +
			"}";
		}

		if (!this.styleElement) {
			this.styleElement = document.createElement("style");
			document.head.appendChild(this.styleElement);
		}

		this.styleElement.innerHTML = style;
	};

	sprinkles.provide("custom.threadList.ColumnsManager", ColumnsManager);
})();
