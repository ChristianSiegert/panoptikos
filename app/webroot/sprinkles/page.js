(function() {
	"use strict";

	function Page(containerElement, template) {
		this.containerElement = containerElement;
		this.template = template;
	};

	Page.prototype.load = function(onSuccess) {
		var onLoadSuccess = function() {
			this.containerElement.innerHTML = this.template.html;
			if (onSuccess) {
				onSuccess();
			}
		}.bind(this);

		var onLoadError = function() {
			this.containerElement.innerHTML = "";
			app.session.addFlashErrorMessage("This page couldn’t be loaded. Try again shortly.");
		}.bind(this);

		if (this.template.isLoaded) {
			onLoadSuccess();
			return;
		}
		this.template.load(onLoadSuccess, onLoadError);
	};

	sprinkles.Page = Page;
})();
