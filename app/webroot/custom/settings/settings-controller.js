(function() {
	"use strict";

	var template = new sprinkles.Template("/settings/settings.html");
	var Settings = custom.settings.Settings;

	function SettingsController() {
		this.settingsListElement = null;
		this.checkboxOnlyShowPostsWithImages = null;
		this.checkboxOpenExternalLinksInNewTab = null;
	};

	SettingsController.prototype.init = function(router) {
		router.registerRoute("/settings", this.loadPage.bind(this));
	};

	SettingsController.prototype.loadPage = function() {
		var page = new sprinkles.Page(document.getElementById("content"), template);
		page.load(this.handleRequest.bind(this, page));
	};

	SettingsController.prototype.handleRequest = function(page) {
		this.settingsListElement = document.getElementById("settings-list");
		this.checkboxOnlyShowPostsWithImages = document.getElementById("setting-only-show-posts-with-images");
		this.checkboxOpenExternalLinksInNewTab = document.getElementById("setting-open-external-links-in-new-tab");

		if (!this.settingsListElement
				|| !this.checkboxOnlyShowPostsWithImages
				|| !this.checkboxOpenExternalLinksInNewTab) {
			app.logger.error("SettingsController: A required element is missing.");
			return;
		}

		this.settingsListElement.addEventListener("click", this.onListClick.bind(this));
		this.checkboxOnlyShowPostsWithImages.checked = Settings.getOnlyShowPostsWithImages();
		this.checkboxOpenExternalLinksInNewTab.checked = Settings.getOpenExternalLinksInNewTab();

		if (!app.storage.localStorageIsAvailable) {
			var message = "Your settings can’t be saved permanently because your browser doesn’t allow storing data. This can happen if you disabled local storage in your browser’s settings or if you browse in privacy mode.";
			app.session.addFlashWarningMessage(message);
		}
	};

	SettingsController.prototype.onListClick = function(event) {
		Settings.setOnlyShowPostsWithImages(this.checkboxOnlyShowPostsWithImages.checked);
		Settings.setOpenExternalLinksInNewTab(this.checkboxOpenExternalLinksInNewTab.checked);
	};

	sprinkles.provide("custom.settings.SettingsController", SettingsController);
})();
