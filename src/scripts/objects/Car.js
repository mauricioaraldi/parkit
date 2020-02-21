import SAT from 'sat';

import Utils from '../utils';
import Sensor from './Sensor';
import GameObject from './GameObject';

/**
 * @class
 * @extends GameObject
 *
 * @param {Object} brainState Current brain state of the car
 * @param {Number} sensorBreakpointQt Numbers of breakpoints each sensor of the
 * @param {Number} sensorRange The range of the sensors in pixels
 * @param {Object{id: Sensor}} sensors The sensors of the car
 * @param {Number} speed Current speed of the car
 */
export default class Car extends GameObject {
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
   */
  constructor(color, x, y, width, height, angle, brainState, speed, withSensors,
    sensorRange, sensorBreakpointQt) {
    super(x, y, width, height, angle, color);

    this.brainState = brainState;
    this.sensorBreakpointQt = sensorBreakpointQt;
    this.sensorRange = sensorRange;
    this.speed = speed;

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
   * @return {Object{id: Sensor}} The sensors of the car by id
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

      sensors[i + 1] = new Sensor(
        point.x,
        point.y,
        angles[i] + this.angle,
        this.sensorRange,
        this.sensorBreakpointQt,
      );
    }

    return sensors;
  }

  /**
   * Updates the sensors readings
   *
   * @author mauricio.araldi
   * @since 0.2.0
   *
   * @param {GameObject[]} objects All the objects that can be perceived by the sensors
   */
  updateSensors(objects) {
    Object.keys(this.sensors).forEach((key) => 
      this.sensors[key].updateReading(objects)
    );
  }
}
