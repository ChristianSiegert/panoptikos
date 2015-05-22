(function() {
	"use strict";

	var Template = function(url) {
		this.isLoaded = false;
		this.html = "";
		this.url = url;
	};

	Template.prototype.load = function(successFunc, errorFunc) {
		var request = new XMLHttpRequest();
		request.onerror = this.onError.bind(this, errorFunc);
		request.onload = this.onLoad.bind(this, successFunc);
		request.open("GET", this.url)
		request.send();
	};

	Template.prototype.onError = function(errorFunc) {
		errorFunc();
	};

	Template.prototype.onLoad = function(successFunc, event) {
		var request = event.target;
		if (request.responseType !== "") {
			console.error("sprinkles.Template.onLoad: Expected responseType '', got '%s'.", request.responseType);
		}

		this.html = request.responseText;
		this.isLoaded = true;
		successFunc();
	};

	sprinkles.Template = Template;
})();
