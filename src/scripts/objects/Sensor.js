import SAT from 'sat';

import Utils from '../utils';

/**
 * @class
 *
 * @param {SAT.Vector[]} area The area of the sensor
 * @param {Number} reading Current reading of the sensor
 */
export default class Sensor {
  /**
   * @constructor
   *
   * @param {Number} x The x origin point of the sensor
   * @param {Number} y The y origin point of the sensor
   * @param {Number} angle The angle to which the sensor will be drawn towards
   * @param {Number} range The range of the sensor
   * @param {Number} breakpointQt The quantity of breakpoints inside a sensor
   */
  constructor(x, y, angle, range, breakpointQt) {
    this.area = this.getSensorArea(x, y, angle, range, breakpointQt);
    this.reading = breakpointQt;
  }

  /**
   * Gets the area of a sensor, acording to the car position
   *
   * @author mauricio.araldi
   * @since 0.2.0
   *
   * @param {Number} originX The X point from where the sensor will be drawn
   * @param {Number} originY The Y point from where the sensor will be drawn
   * @param {Number} angle The angle to which the sensor will be drawn towards
   * @param {Number} range The range of the sensor
   * @param {Number} breakpointQt The quantity of breakpoints inside a sensor
   * @return {SAT.Vector[]} The area of the sensor ({x, y}[])
   */
  getSensorArea(originX, originY, angle, range, breakpointQt) {
    const interval = range / breakpointQt;
    const area = [];

    for (let i = 0; i < breakpointQt; i += 1) {
      const offset = i * interval;
      area.push(new SAT.Vector(
        Math.floor(originX - (offset * Math.cos(Utils.degreesToRadians(angle)))),
        Math.floor(originY - (offset * Math.sin(Utils.degreesToRadians(angle)))),
      ));
    }

    return area;
  }

  /**
   * Updates the sensor reading
   *
   * @author mauricio.araldi
   * @since 0.2.0
   *
   * @param {GameObject[]} objects All the objects that can be perceived by the sensor
   */
  updateReading(objects) {
    this.reading = this.area.length;

    objects.some((object) => (
      this.area.some((point, index) => {
        if (SAT.pointInPolygon(point, object.polygon)) {
          this.reading = index;
          return true;
        }

        return false;
      })
    ));
  }
}
