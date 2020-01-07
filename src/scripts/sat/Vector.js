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

/**
 * Represents a vector in two dimensions.
 *
 * @param {Number} x The x position.
 * @param {Number} y The y position.
 * @constructor
 */
export default class Vector {
  constructor(x = 0, y = x) {
    this.x = x;
    this.y = y;
  }

  /**
   * Copy the values of another Vector into this one.
   *
   * @param {Vector} other The other Vector.
   * @return {Vector} This for chaining.
   */
  copy(other) {
    this.x = other.x;
    this.y = other.y;
  }

  /**
   * Rotate this vector by 90 degrees
   *
   * @return {Vector} This for chaining.
   */
  perp() {
    const { x } = this;

    this.x = this.y;
    this.y = -x;
  }

  /**
   * Reverse this vector.
   *
   * @return {Vector} This for chaining.
   */
  reverse() {
    this.x = -this.x;
    this.y = -this.y;
  }

  /**
   * Normalize (make unit length) this vector.
   *
   * @return {Vector} This for chaining.
   */
  normalize() {
    const { len } = this.len();

    if (len > 0) {
      this.x /= len;
      this.y /= len;
    }
  }

  /**
   * Add another vector to this one.
   *
   * @param {Vector} other The other Vector.
   * @return {Vector} This for chaining.
   */
  add(other) {
    this.x += other.x;
    this.y += other.y;
  }

  /**
   * Subtract another vector from this one.
   *
   * @param {Vector} other The other Vector.
   * @return {Vector} This for chaiing.
   */
  sub(other) {
    this.x -= other.x;
    this.y -= other.y;
  }

  /**
   * Scale this vector.
   *
   * @param {Number} x The scaling factor in the x direction.
   * @param {Number} y The scaling factor in the y direction. If this
   *   is not specified, the x scaling factor will be used.
   * @return {Vector} This for chaining.
   */
  scale(x, y = x) {
    this.x *= x;
    this.y *= y;
  }

  /**
   * Project this vector on to another vector.
   *
   * @param {Vector} other The vector to project onto.
   * @return {Vector} This for chaining.
   */
  project(other) {
    const amt = this.dot(other) / other.len2();

    this.x = amt * other.x;
    this.y = amt * other.y;
  }

  /**
   * Project this vector onto a vector of unit length.
   *
   * @param {Vector} other The unit vector to project onto.
   * @return {Vector} This for chaining.
   */
  projectN(other) {
    const amt = this.dot(other);

    this.x = amt * other.x;
    this.y = amt * other.y;
  }

  /**
   * Reflect this vector on an arbitrary axis.
   *
   * @param {Vector} axis The vector representing the axis.
   * @return {Vector} This for chaining.
   */
  reflect(axis) {
    const { x, y } = this;

    this.project(axis).scale(2);
    this.x -= x;
    this.y -= y;
  }

  /**
   * Reflect this vector on an arbitrary axis (represented by a unit vector)
   *
   * @param {Vector} axis The unit vector representing the axis.
   * @return {Vector} This for chaining.
   */
  reflectN(axis) {
    const { x, y } = this;

    this.projectN(axis).scale(2);
    this.x -= x;
    this.y -= y;
  }

  /**
   * Get the dot product of this vector against another.
   *
   * @param {Vector}  other The vector to dot this one against.
   * @return {number} The dot product.
   */
  dot(other) {
    return this.x * other.x + this.y * other.y;
  }

  /**
   * Get the length^2 of this vector.
   *
   * @return {number} The length^2 of this vector.
   */
  len2() {
    return this.dot(this);
  }

  /**
   * Get the length of this vector.
   *
   * @return {number} The length of this vector.
   */
  len() {
    return Math.sqrt(this.len2());
  }
}
