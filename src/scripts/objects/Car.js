import SAT from 'sat';

import Utils from '../utils';

/**
 * @class
 *
 * @param {Number} angle Angle of rotation of the car
 * @param {Object} brainState Current brain state of the car
 * @param {String} color HEX color of the car
 * @param {Number} height Height of the car
 * @param {SAT.Polygon} polygon The polygon that represents car's shape and position
 * @param {Number} sensorBreakpointQt Numbers of breakpoints each sensor of the
 * @param {Number} sensorRange The range of the sensors in pixels
 * @param {Object} sensors The sensors of the car
 * @param {Number} speed Current speed of the car
 * @param {Number} width Width of the car
 * car should have
 * @return {Car} Car object
 */
export default class Car {
  /**
   * @constructor
   *
   * @param {String} color HEX color of the car
   * @param {Number} x X position of the car
   * @param {Number} y Y position of the car
   * @param {Number} width Width of the car
   * @param {Number} height Height of the car
   * @param {Number} angle Angle of rotation of the car
   * @param {Object} brainState Current brain state of the car
   * @param {Number} speed Current speed of the car
   * @param {Boolean} withSensors Of the car should have distance sensors
   * @param {Number} sensorRange The range of the sensors in pixels
   * @param {Number} sensorBreakpointQt Numbers of breakpoints each sensor of the
   * car should have
   * @return {Car} Car object
   */
  constructor(color, x, y, width, height, angle, brainState, speed, withSensors,
    sensorRange, sensorBreakpointQt) {
    this.angle = angle;
    this.brainState = brainState;
    this.color = color;
    this.height = height;
    this.sensorBreakpointQt = sensorBreakpointQt;
    this.sensorRange = sensorRange;
    this.speed = speed;
    this.width = width;

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

    if (withSensors) {
      this.sensors = this.buildSensors();
    }
  }

  /**
   * Builds the sensors of a car
   *
   * @author mauricio.araldi
   * @since 0.2.0
   *
   * @return {Object} The sensors of the car (area and reading, by id)
   */
  buildSensors() {
    const points = this.polygon.points.map((carPoint) => (
      { x: this.polygon.pos.x + carPoint.x, y: this.polygon.pos.y + carPoint.y }
    ));
    const angles = [
      // Top Left
      -45, 0, 45, 90, 135,

      // Top Right
      45, 90, 135, 180, 225,

      // Bottom Right
      135, 180, 225, 270, 315,

      // Bottom Left
      -135, -90, -45, 0, 45,
    ];
    const sensors = {};
    const pointsPerAngle = angles.length / points.length;

    for (let i = 0; i < angles.length; i += 1) {
      const point = points[Math.floor((i || 1) / pointsPerAngle)];
      const area = this.getSensorArea(
        point.x,
        point.y,
        angles[i] + this.angle,
      );

      sensors[i + 1] = {
        area,
        reading: 0,
      };
    }

    return sensors;
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
   * car should have
   * @return {Object} The area of the sensor ({x, y}[])
   */
  getSensorArea(originX, originY, angle) {
    const interval = this.sensorRange / this.sensorBreakpointQt;
    const area = [];

    for (let i = 0; i < this.sensorBreakpointQt; i += 1) {
      const offset = i * interval;
      area.push(new SAT.Vector(
        Math.floor(originX - (offset * Math.cos(Utils.degreesToRadians(angle)))),
        Math.floor(originY - (offset * Math.sin(Utils.degreesToRadians(angle)))),
      ));
    }

    return area;
  }
}
