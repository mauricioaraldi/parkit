import SAT from 'sat';

/**
 * @class
 *
 * @param {Number} x The x position
 * @param {Number} y The y position
 * @param {Number} width Width
 * @param {Number} height Height
 * @param {Number} angle Angle of rotation
 * @param {String} color HEX color
 * car should have
 */
export default class GameObject {
  /**
   * @constructor
   *
   * @param {Number} x The x position
   * @param {Number} y The y position
   * @param {Number} width Width
   * @param {Number} height Height
   * @param {Number} angle Angle of rotation
   * @param {String} color HEX color
   */
  constructor(x, y, width, height, angle, color) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.angle = angle;
    this.color = color;

    this.polygon = new SAT.Polygon(
      new SAT.Vector(x, y),
      [
        new SAT.Vector(0, 0),
        new SAT.Vector(width, 0),
        new SAT.Vector(width, height),
        new SAT.Vector(0, height),
      ],
      width,
      height,
    );
  }
}
