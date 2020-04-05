import SAT from 'sat';

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
   * @param {GameObject[]} objects The objects to be drawn
   * @param {Boolean} [fill = true] If the object should be filled with color
   * @return {Boolean} If the objects were drawn
   */
  draw(objects, fill = true) {
    if (!Array.isArray(objects)) {
      objects = [objects];
    }

    objects.forEach((object) => {
      const { points } = object.polygon;
      let i = points.length - 1;

      this.context.save();
      this.context.translate(object.polygon.pos.x, object.polygon.pos.y);
      this.context.beginPath();
      this.context.moveTo(points[0].x, points[0].y);

      while (i) {
        this.context.lineTo(points[i].x, points[i].y);
        i -= 1;
      }

      this.context.closePath();

      if (fill) {
        this.context.fillStyle = object.color;
        this.context.fill();
      } else {
        this.context.strokeStyle = object.color;
        this.context.lineWidth = 5;
        this.context.stroke();
      }

      this.context.restore();
    });

    return true;
  }

  /**
   * Checks for collisions between objects
   *
   * @author mauricio.araldi
   * @since 0.2.0
   *
   * @param {GameObject[]} objects The objects to be checked
   * @param {Boolean} checkAllCollisions If not only the first, but all, collisions
   * should be returned
   * @return {Array | Array<Array>} One or all detected collisions
   */
  checkCollisions(objects, checkAllCollisions) {
    const collisions = [];

    for (let i = objects.length - 1; i >= 0; i -= 1) {
      const objectA = objects[i];

      for (let j = i - 1; j >= 0; j -= 1) {
        const objectB = objects[j];
        const collided = SAT.testPolygonPolygon(objectA.polygon, objectB.polygon);

        if (collided) {
          collisions.push([objectA, objectB]);

          if (!checkAllCollisions) {
            return collisions[0];
          }
        }
      }
    }

    return collisions;
  }
}
