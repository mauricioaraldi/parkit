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
 * An object representing the result of an intersection. Contain information about:
 * - The two objects participating in the intersection
 * - The vector representing the minimum change necessary to extract the first object
 *   from the second one.
 * - Whether the first object is entirely inside the second, or vice versa.
 */
export default class Response {
  constructor() {
    this.a = null;
    this.b = null;
    this.overlapN = new Vector(); // Unit vector in the direction of overlap
    this.overlapV = new Vector(); // Subtract this from a's position to extract it from b
    this.clear();
  }

  /**
   * Set some values of the response back to their defaults.  Call this between tests if
   * you are going to reuse a single Response object for multiple intersection tests (recommented)
   *
   * @return {Response} This for chaining
   */
  clear() {
    this.aInB = true; // Is a fully inside b?
    this.bInA = true; // Is b fully inside a?
    // Amount of overlap (magnitude of overlapV).Can be 0 (if a and b are touching)
    this.overlap = Number.MAX_VALUE;
  }
}
