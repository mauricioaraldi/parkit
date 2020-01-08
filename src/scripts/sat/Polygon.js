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
 * A *convex* clockwise polygon.
 *
 * @param {Vector} pos A vector representing the origin of the polygon. (all other
 *   points are relative to this one)
 * @param {Array.<Vector>=} points An array of vectors representing the points in the polygon,
 *   in clockwise order.
 */
export default class Polygon {
  constructor(pos = new Vector(), points = []) {
    this.edges = [];
    this.normals = [];
    this.pos = pos;
    this.points = points;
    this.recalc();
  }

  /**
  * Recalculate the edges and normals of the polygon.  This
  * MUST be called if the points array is modified at all and
  * the edges or normals are to be accessed.
  */
  recalc() {
    const { points } = this;
    const { length } = points;

    this.edges = [];
    this.normals = [];

    for (let i = 0; i < length; i += 1) {
      const p1 = points[i];
      const p2 = i < length - 1 ? points[i + 1] : points[0];
      const e = new Vector();
      const n = new Vector();

      e.copy(p2);
      e.sub(p1);

      n.copy(e);
      n.perp();
      n.normalize();

      this.edges.push(e);
      this.normals.push(n);
    }
  }
}
