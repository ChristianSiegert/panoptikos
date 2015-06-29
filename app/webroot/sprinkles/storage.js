(function() {
	"use strict";

	var localStorage   = window.localStorage;	// Persistent storage
	var sessionStorage = window.sessionStorage;	// Temporary storage
	var liveStorage    = new LiveStorage();		// Temporary storage

	// Storage provides access to persistent and temporary storage, i.e.
	// LocalStorage and SessionStorage. If LocalStorage is not available,
	// SessionStorage will be used. If SessionStorage is not available, a
	// fallback storage is used which holds data only until the page is
	// reloaded.
	function Storage(keyPrefix) {
		// localStorageIsAvailable indicates whether LocalStorage is available.
		this.localStorageIsAvailable = isLocalStorageAvailable();

		// sessionStorageIsAvailable indicates whether SessionStorage is
		// available.
		this.sessionStorageIsAvailable = isSessionStorageAvailable();

		// keyPrefix is the string that is prepended to keys.
		this.keyPrefix = keyPrefix || "";
	}

	Storage.prototype.setItem = function(key, value, temporaryStorageOnly) {
		if (!temporaryStorageOnly && this.localStorageIsAvailable) {
			localStorage.setItem(this.keyPrefix + key, value);
		} else if (this.sessionStorageIsAvailable) {
			sessionStorage.setItem(this.keyPrefix + key, value);
		} else {
			liveStorage.setItem(this.keyPrefix + key, value);
		}
	};

	Storage.prototype.getItem = function(key, temporaryStorageOnly) {
		if (!temporaryStorageOnly && this.localStorageIsAvailable) {
			return localStorage.getItem(this.keyPrefix + key);
		} else if (this.sessionStorageIsAvailable) {
			return sessionStorage.getItem(this.keyPrefix + key);
		} else {
			return liveStorage.getItem(this.keyPrefix + key);
		}
	};

	Storage.prototype.removeItem = function(key, temporaryStorageOnly) {
		if (!temporaryStorageOnly && this.localStorageIsAvailable) {
			localStorage.removeItem(this.keyPrefix + key);
		} else if (this.sessionStorageIsAvailable) {
			sessionStorage.removeItem(this.keyPrefix + key);
		} else {
			liveStorage.removeItem(this.keyPrefix + key);
		}
	};

	function isLocalStorageAvailable() {
		try {
			var key = "sprinkles_test";
			localStorage.setItem(key, "");
			localStorage.removeItem(key);
		} catch (exception) {
			return false;
		}
		return true;
	}

	function isSessionStorageAvailable() {
		try {
			var key = "sprinkles_test";
			localStorage.setItem(key, "");
			localStorage.removeItem(key);
		} catch (exception) {
			return false;
		}
		return true;
	}

	// LiveStorage stores data until the page is reloaded or the browser tab is
	// closed. It should only be used if LocalStorage and SessionStorage is not
	// available.
	function LiveStorage() {
		this.data = {};
	}

	LiveStorage.prototype.setItem = function(key, value) {
		this.data[key] = value;
	};

	LiveStorage.prototype.getItem = function(key) {
		if (this.data.hasOwnProperty(key)) {
			return this.data[key];
		}
		return null;
	};

	LiveStorage.prototype.removeItem = function(key) {
		delete this.data[key];
	};

	sprinkles.provide("sprinkles.Storage", Storage);
})();
