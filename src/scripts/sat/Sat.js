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

export default class SAT {
  constructor() {
    /**
     * @const
     */
    this.LEFT_VORNOI_REGION = -1;

    /**
     * @const
     */
    this.MIDDLE_VORNOI_REGION = 0;

    /**
     * @const
     */
    this.RIGHT_VORNOI_REGION = 1;

    /**
     * Pool of Vectors used in calculations.
     *
     * @type {Array}
     */
    this.T_VECTORS = [];

    /**
     * Pool of Arrays used in calculations.
     *
     * @type {Array}
     */
    this.T_ARRAYS = [];

    for (let i = 0; i < 10; i += 1) {
      this.T_VECTORS.push(new Vector());
    }

    for (let i = 0; i < 5; i += 1) {
      this.T_ARRAYS.push([]);
    }
  }

  /**
   * Flattens the specified array of points onto a unit vector axis,
   * resulting in a one dimensional range of the minimum and
   * maximum value on that axis.
   *
   * @param {Array.<Vector>} points The points to flatten.
   * @param {Vector} normal The unit vector axis to flatten on.
   * @param {Array.<number>} result An array.  After calling this function,
   *   result[0] will be the minimum value,
   *   result[1] will be the maximum value.
   */
  static flattenPointsOn(points, normal, result) {
    let min = Number.MAX_VALUE;
    let max = -Number.MAX_VALUE;
    let i = points.length;
    const newResult = Array.from(result);

    while (i) {
      // Get the magnitude of the projection of the point onto the normal
      const dot = points[i].dot(normal);

      if (dot < min) {
        min = dot;
      }

      if (dot > max) {
        max = dot;
      }

      i -= 1;
    }

    newResult[0] = min;
    newResult[1] = max;

    return newResult;
  }

  /**
   * Check whether two convex clockwise polygons are separated by the specified
   * axis (must be a unit vector).
   *
   * @param {Vector} aPos The position of the first polygon.
   * @param {Vector} bPos The position of the second polygon.
   * @param {Array.<Vector>} aPoints The points in the first polygon.
   * @param {Array.<Vector>} bPoints The points in the second polygon.
   * @param {Vector} axis The axis (unit sized) to test against.  The points of both polygons
   *   will be projected onto this axis.
   * @param {Response=} response A Response object (optional) which will be populated
   *   if the axis is not a separating axis.
   * @return {boolean} true if it is a separating axis, false otherwise.  If false,
   *   and a response is passed in, information about how much overlap and
   *   the direction of the overlap will be populated.
   */
  isSeparatingAxis(aPos, bPos, aPoints, bPoints, axis, response) {
    let rangeA = this.T_ARRAYS.pop();
    let rangeB = this.T_ARRAYS.pop();

    // Get the magnitude of the offset between the two polygons
    const offsetV = this.T_VECTORS.pop().copy(bPos).sub(aPos);
    const projectedOffset = offsetV.dot(axis);

    // Project the polygons onto the axis.
    rangeA = this.flattenPointsOn(aPoints, axis, rangeA);
    rangeB = this.flattenPointsOn(bPoints, axis, rangeB);

    // Move B's range to its position relative to A.
    rangeB[0] += projectedOffset;
    rangeB[1] += projectedOffset;

    // Check if there is a gap. If there is, this is a separating axis and we can stop
    if (rangeA[0] > rangeB[1] || rangeB[0] > rangeA[1]) {
      this.T_VECTORS.push(offsetV);
      this.T_ARRAYS.push(rangeA);
      this.T_ARRAYS.push(rangeB);

      return true;
    }

    // If we're calculating a response, calculate the overlap.
    if (response) {
      let overlap = 0;

      // A starts further left than B
      if (rangeA[0] < rangeB[0]) {
        response.aInB = false;
        // A ends before B does. We have to pull A out of B
        if (rangeA[1] < rangeB[1]) {
          overlap = rangeA[1] - rangeB[0];
          response.bInA = false;
          // B is fully inside A.  Pick the shortest way out.
        } else {
          const option1 = rangeA[1] - rangeB[0];
          const option2 = rangeB[1] - rangeA[0];
          overlap = option1 < option2 ? option1 : -option2;
        }
        // B starts further left than A
      } else {
        response.bInA = false;
        // B ends before A ends. We have to push A out of B
        if (rangeA[1] > rangeB[1]) {
          overlap = rangeA[0] - rangeB[1];
          response.aInB = false;
          // A is fully inside B.  Pick the shortest way out.
        } else {
          const option1 = rangeA[1] - rangeB[0];
          const option2 = rangeB[1] - rangeA[0];
          overlap = option1 < option2 ? option1 : -option2;
        }
      }

      // If this is the smallest amount of overlap we've seen so far, set it as the minimum overlap.
      const absOverlap = Math.abs(overlap);

      if (absOverlap < response.overlap) {
        response.overlap = absOverlap;
        response.overlapN.copy(axis);
        if (overlap < 0) {
          response.overlapN.reverse();
        }
      }
    }

    this.T_VECTORS.push(offsetV);
    this.T_ARRAYS.push(rangeA);
    this.T_ARRAYS.push(rangeB);

    return false;
  }

  /**
   * Calculates which Vornoi region a point is on a line segment.
   * It is assumed that both the line and the point are relative to (0, 0)
   *
   *             |       (0)      |
   *      (-1)  [0]--------------[1]  (1)
   *             |       (0)      |
   *
   * @param {Vector} line The line segment.
   * @param {Vector} point The point.
   * @return {number} LEFT_VORNOI_REGION (-1) if it is the left region,
   *          MIDDLE_VORNOI_REGION (0) if it is the middle region,
   *          RIGHT_VORNOI_REGION (1) if it is the right region.
   */
  vornoiRegion(line, point) {
    const len2 = line.len2();
    const dp = point.dot(line);

    if (dp < 0) return this.LEFT_VORNOI_REGION;
    if (dp > len2) return this.RIGHT_VORNOI_REGION;

    return this.MIDDLE_VORNOI_REGION;
  }

  /**
   * Check if two circles intersect.
   *
   * @param {Circle} a The first circle.
   * @param {Circle} b The second circle.
   * @param {Response=} response Response object (optional) that will be populated if
   *   the circles intersect.
   * @return {boolean} true if the circles intersect, false if they don't.
   */
  testCircleCircle(a, b, response) {
    const differenceV = this.T_VECTORS.pop().copy(b.pos).sub(a.pos);
    const totalRadius = a.r + b.r;
    const totalRadiusSq = totalRadius * totalRadius;
    const distanceSq = differenceV.len2();

    if (distanceSq > totalRadiusSq) {
      // They do not intersect
      this.T_VECTORS.push(differenceV);

      return false;
    }

    // They intersect. If we're calculating a response, calculate the overlap.
    if (response) {
      const dist = Math.sqrt(distanceSq);

      response.a = a;
      response.b = b;
      response.overlap = totalRadius - dist;
      response.overlapN.copy(differenceV.normalize());
      response.overlapV.copy(differenceV).scale(response.overlap);
      response.aInB = a.r <= b.r && dist <= b.r - a.r;
      response.bInA = b.r <= a.r && dist <= a.r - b.r;
    }

    this.T_VECTORS.push(differenceV);
    return true;
  }

  /**
   * Check if a polygon and a circle intersect.
   *
   * @param {Polygon} polygon The polygon.
   * @param {Circle} circle The circle.
   * @param {Response=} response Response object (optional) that will be populated if
   *   they interset.
   * @return {boolean} true if they intersect, false if they don't.
   */
  testPolygonCircle(polygon, circle, response) {
    const circlePos = this.T_VECTORS.pop().copy(circle.pos).sub(polygon.pos);
    const radius = circle.r;
    const radius2 = radius * radius;
    const { points } = polygon;
    const len = points.length;
    const edge = this.T_VECTORS.pop();
    const point = this.T_VECTORS.pop();

    // For each edge in the polygon
    for (let i = 0; i < len; i += 1) {
      const next = (i === len - 1) ? 0 : i + 1;
      const prev = (i === 0) ? len - 1 : i - 1;
      let overlap = 0;
      let overlapN = null;

      // Get the edge
      edge.copy(polygon.edges[i]);

      // Calculate the center of the cirble relative to the starting point of the edge
      point.copy(circlePos).sub(points[i]);

      // If the distance between the center of the circle and the point
      // is bigger than the radius, the polygon is definitely not fully in
      // the circle.
      if (response && point.len2() > radius2) {
        response.aInB = false;
      }

      // Calculate which Vornoi region the center of the circle is in.
      let region = this.vornoiRegion(edge, point);

      if (region === this.LEFT_VORNOI_REGION) {
        // Need to make sure we're in the RIGHT_VORNOI_REGION of the previous edge.
        edge.copy(polygon.edges[prev]);

        // Calculate the center of the circle relative the starting point of the previous edge
        const point2 = this.T_VECTORS.pop().copy(circlePos).sub(points[prev]);

        region = this.vornoiRegion(edge, point2);

        if (region === this.RIGHT_VORNOI_REGION) {
          // It's in the region we want.  Check if the circle intersects the point.
          const dist = point.len();

          if (dist > radius) {
            // No intersection
            this.T_VECTORS.push(circlePos);
            this.T_VECTORS.push(edge);
            this.T_VECTORS.push(point);
            this.T_VECTORS.push(point2);

            return false;
          }

          if (response) {
            // It intersects, calculate the overlap
            response.bInA = false;
            overlapN = point.normalize();
            overlap = radius - dist;
          }
        }

        this.T_VECTORS.push(point2);
      } else if (region === this.RIGHT_VORNOI_REGION) {
        // Need to make sure we're in the left region on the next edge
        edge.copy(polygon.edges[next]);

        // Calculate the center of the circle relative to the starting point of the next edge
        point.copy(circlePos).sub(points[next]);

        region = this.vornoiRegion(edge, point);
        if (region === this.LEFT_VORNOI_REGION) {
          // It's in the region we want.  Check if the circle intersects the point.
          const dist = point.len();

          if (dist > radius) {
            // No intersection
            this.T_VECTORS.push(circlePos);
            this.T_VECTORS.push(edge);
            this.T_VECTORS.push(point);

            return false;
          }

          if (response) {
            // It intersects, calculate the overlap
            response.bInA = false;
            overlapN = point.normalize();
            overlap = radius - dist;
          }
        }
        // MIDDLE_VORNOI_REGION
      } else {
        // Need to check if the circle is intersecting the edge,
        // Change the edge into its "edge normal".
        const normal = edge.perp().normalize();

        // Find the perpendicular distance between the center of the
        // circle and the edge.
        const dist = point.dot(normal);
        const distAbs = Math.abs(dist);

        // If the circle is on the outside of the edge, there is no intersection
        if (dist > 0 && distAbs > radius) {
          this.T_VECTORS.push(circlePos);
          this.T_VECTORS.push(normal);
          this.T_VECTORS.push(point);

          return false;
        }

        if (response) {
          // It intersects, calculate the overlap.
          overlapN = normal;
          overlap = radius - dist;
          // If the center of the circle is on the outside of the edge, or part of the
          // circle is on the outside, the circle is not fully inside the polygon.
          if (dist >= 0 || overlap < 2 * radius) {
            response.bInA = false;
          }
        }
      }

      // If this is the smallest overlap we've seen, keep it.
      // (overlapN may be null if the circle was in the wrong Vornoi region)
      if (overlapN && response && Math.abs(overlap) < Math.abs(response.overlap)) {
        response.overlap = overlap;
        response.overlapN.copy(overlapN);
      }
    }

    // Calculate the final overlap vector - based on the smallest overlap.
    if (response) {
      response.a = polygon;
      response.b = circle;
      response.overlapV.copy(response.overlapN).scale(response.overlap);
    }

    this.T_VECTORS.push(circlePos);
    this.T_VECTORS.push(edge);
    this.T_VECTORS.push(point);

    return true;
  }

  /**
   * Check if a circle and a polygon intersect.
   *
   * NOTE: This runs slightly slower than polygonCircle as it just
   * runs polygonCircle and reverses everything at the end.
   *
   * @param {Circle} circle The circle.
   * @param {Polygon} polygon The polygon.
   * @param {Response} response Response object (optional) that will be populated if
   *   they interset.
   * @return {boolean} true if they intersect, false if they don't.
   */
  testCirclePolygon(circle, polygon, response) {
    const result = this.testPolygonCircle(polygon, circle, response);

    if (result && response) {
      // Swap A and B in the response.
      const { a, aInB } = response;

      response.overlapN.reverse();
      response.overlapV.reverse();
      response.a = response.b;
      response.b = a;
      response.aInB = response.bInA;
      response.bInA = aInB;
    }

    return result;
  }

  /**
   * Checks whether two convex, clockwise polygons intersect.
   *
   * @param {Polygon} a The first polygon.
   * @param {Polygon} b The second polygon.
   * @param {Response} response Response object (optional) that will be populated if
   *   they interset.
   * @return {boolean} true if they intersect, false if they don't.
   */
  testPolygonPolygon(a, b, response) {
    const aPoints = a.points;
    const bPoints = b.points;
    let aLen = aPoints.length;
    let bLen = bPoints.length;

    // If any of the edge normals of A is a separating axis, no intersection.
    while (aLen) {
      if (
        this.isSeparatingAxis(
          a.pos,
          b.pos,
          aPoints,
          bPoints,
          a.normals[aLen],
          response,
        )
      ) {
        return false;
      }

      aLen -= 1;
    }

    // If any of the edge normals of B is a separating axis, no intersection.
    while (bLen) {
      if (
        this.isSeparatingAxis(
          a.pos,
          b.pos,
          aPoints,
          bPoints,
          b.normals[bLen],
          response,
        )
      ) {
        return false;
      }

      bLen -= 1;
    }

    // Since none of the edge normals of A or B are a separating axis, there is an intersection
    // and we've already calculated the smallest overlap (in isSeparatingAxis).  Calculate the
    // final overlap vector.
    if (response) {
      response.a = a;
      response.b = b;
      response.overlapV.copy(response.overlapN).scale(response.overlap);
    }

    return true;
  }
}
