(function() {
	"use strict";

	var Page = function(containerElement, template) {
		this.containerElement = containerElement;
		this.template = template;
	};

	Page.prototype.serve = function(func) {
		var successFunc = function() {
			this.containerElement.innerHTML = this.template.html;
			if (func) {
				func();
			}
		}.bind(this);

		var errorFunc = function() {
			this.containerElement.innerHTML = "<p>This page couldn’t be loaded. Try again shortly.</p>";
		}.bind(this);

		if (this.template.isLoaded) {
			successFunc();
			return;
		}
		this.template.load(successFunc, errorFunc);
	};

	sprinkles.Page = Page;
})();
