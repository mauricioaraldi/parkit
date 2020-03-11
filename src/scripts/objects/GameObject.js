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

  /**
   * Checks if this object is inside another object
   *
   * @author mauricio.araldi
   * @since 0.2.0
   *
   * @param {GameObject} outerObject The object to be used as target area
   * @return {Boolean} If the game object is inside target game object
   */
  testInsideAnotherObject(outerObject) {
    const innerStartX = this.x;
    const innerEndX = this.x + this.width;
    const innerStartY = this.y;
    const innerEndY = this.y + this.height;
    const outerStartX = outerObject.x;
    const outerEndX = outerObject.x + outerObject.width;
    const outerStartY = outerObject.y;
    const outerEndY = outerObject.y + outerObject.height;

    return (
      innerStartX >= outerStartX
      && innerEndX <= outerEndX
      && innerStartY >= outerStartY
      && innerEndY <= outerEndY
    );
  }
}
