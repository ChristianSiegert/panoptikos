goog.provide("Bar");
goog.provide("Foo");

/**
 * @param {string} bar
 * @param {!Array} greetings
 * @param {!Object.<number>} houses
 * @param {!Bar} barObject
 * @constructor
 */
Foo = function(bar, greetings, houses, barObject) {
	/**
	 * @type {string}
	 */
	this.bar = bar;

	/**
	 * @type {!Array.<string>}
	 * @private
	 */
	this.greetings_ = greetings;

	/**
	 * @type {!Object.<number>}
	 * @private
	 */
	this.houses_ = houses;

	this.barObject_ = barObject;

	/**
	 * @type {!Array.<{string}>}
	 */
	this.a = [undefined, 1, null];

	/**
	 * @type {?number}
	 */
	this.b = null;
}

/**
 * @constructor
 */
Bar = function() {

};
