(function() {
	"use strict";

	var template = new sprinkles.Template("/settings/settings.html");

	function SettingsController() {

	};

	SettingsController.prototype.init = function() {
		app.router.registerRoute("/settings", this.loadPage.bind(this));
	};

	SettingsController.prototype.loadPage = function() {
		var page = new sprinkles.Page(document.getElementById("content"), template);
		page.load(this.handleRequest.bind(this, page));
	};

	SettingsController.prototype.handleRequest = function(page) {
		var checkboxOnlyShowImages = document.getElementById("setting-only-show-images");
		var checkboxOpenExternalLinksInNewTab = document.getElementById("setting-open-external-links-in-new-tab");

		if (!checkboxOnlyShowImages || !checkboxOpenExternalLinksInNewTab) {
			app.logger.error("SettingsController: Checkbox is missing.");
			return;
		}

		checkboxOnlyShowImages.checked = custom.settings.Settings.getOnlyShowPostsWithImages();
		checkboxOpenExternalLinksInNewTab.checked = custom.settings.Settings.getOpenExternalLinksInNewTab();

		if (!app.storage.localStorageIsAvailable) {
			var message = "Your settings can’t be saved permanently because your browser doesn’t allow storing data. This can happen if you disabled local storage in your browser’s settings or if you browse in privacy mode.";
			app.session.addFlashWarningMessage(message);
		}
	};

	var controller = new SettingsController();
	app.addInitFunc(controller.init.bind(controller));
})();
