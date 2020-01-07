/** @preserve @author Jim Riecken - released under the MIT License. */
/**
 * A simple library for determining intersections of circles and
 * polygons using the Separating Axis Theorem.
 */
/**
 * jshint shadow:true, sub:true, forin:true, noarg:true, noempty:true,
 * eqeqeq:true, bitwise:true, strict:true, undef:true, curly:true, browser:true
 */
/**
 * Modified by Mauricio Araldi @mauricioaraldi to ES6 standarts
 */

import Vector from './Vector';

/**
 * A circle.
 *
 * @param {Vector=} pos A vector representing the position of the center of the circle
 * @param {Number} r The radius of the circle
 * @constructor
 */
export default class Circle {
  constructor(pos = new Vector(), r = 0) {
    this.pos = pos;
    this.r = r;
  }
}
