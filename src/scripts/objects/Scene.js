/**
 * @class
 *
 * @param {HTMLCanvasElement} canvas The canvas where to draw
 * @param {HTMLCanvasElement} context The context of the canvas
 */
export default class GameObject {
  /**
   * @constructor
   *
   * @param {HTMLCanvasElement} canvas The canvas where to draw
   */
  constructor(canvas) {
    this.canvas = canvas;
    this.context = canvas.getContext('2d');
  }

  /**
   * Clears the scene
   *
   * @author mauricio.araldi
   * @since 0.2.0
   *
   * @return {[type]} [description]
   */
  clear() {
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  /**
   * Draws the objects of the scene
   *
   * @author mauricio.araldi
   * @since 0.2.0
   *
   * @param {CanvasRenderingContext2D} ctx Canvas context do render content
   * @param {GameObject[]} objects The objects to be drawn
   * @return {Boolean} If the objects were drawn
   */
  draw(objects) {
    objects.forEach((object) => {
      const { points } = object.polygon;
      let i = points.length - 1;

      this.context.fillStyle = object.color;
      this.context.save();
      this.context.translate(object.polygon.pos.x, object.polygon.pos.y);
      this.context.beginPath();
      this.context.moveTo(points[0].x, points[0].y);

      while (i) {
        this.context.lineTo(points[i].x, points[i].y);
        i -= 1;
      }

      this.context.closePath();
      this.context.fill();
      this.context.restore();
    });

    return true;
  }
}
