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
 * An axis-aligned box, with width and height.
 * 
 * @param {Vector} pos A vector representing the top-left of the box.
 * @param {Number} w The width of the box.
 * @param {Number} h The height of the box.
 */
export default class Box {
  constructor(pos = new Vector(), w = 0, h = w) {
    this.pos = pos;
    this.w = w;
    this.h = h;
  }

  /**
   * Create a polygon that is the same as this box.
   * 
   * @return {Polygon} A new Polygon that represents this box.
   */
  toPolygon() {
    const pos = this.pos;
    const w = this.w;
    const h = this.h;

    return new Polygon(
      new Vector(pos.x, pos.y), [
        new Vector(),
        new Vector(w, 0),
        new Vector(w, h),
        new Vector(0, h)
      ]
    );
  }
}