import SAT from 'sat';
import Sensor from './Sensor';
import GameObject from './GameObject';
import Constants from '../constants';
import Utils from '../utils';

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
   * @param {String} color HEX color
   * @param {Number} x X position
   * @param {Number} y Y position
   * @param {Number} width Width
   * @param {Number} height Height
   * @param {Number} angle Angle of rotation
   * @param {Object} brainState Current brain state
   * @param {Number} speed Current speed
   * @param {Boolean} parkingBreak The current state of the parking break
   * @param {Boolean} withSensors Of the car should have distance sensors
   * @param {Number} sensorRange The range of the sensors in pixels
   * @param {Number} sensorBreakpointQt Numbers of breakpoints each sensor should have
   */
  constructor(color, x, y, width, height, angle, brainState, speed, parkingBreak,
    withSensors, sensorRange, sensorBreakpointQt) {
    super(x, y, width, height, angle, color);

    this.brainState = brainState;
    this.sensorBreakpointQt = sensorBreakpointQt;
    this.sensorRange = sensorRange;
    this.speed = speed;
    this.parkingBreak = parkingBreak;

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
    Object.keys(this.sensors).forEach((key) => this.sensors[key].updateReading(objects));
  }

  /**
   * Calculates how much the car's angle should change to match its brain state
   *
   * @author mauricio.araldi
   * @since 0.2.0
   *
   * @return {Number} How much the angle changed
   */
  proccessCarBrainAngle() {
    const angleState = this.brainState.angle;
    let angleChange = 0;

    if (this.angle !== angleState) {
      const angleDiff = (angleState - this.angle);

      if (angleDiff > 0) {
        angleChange = Math.min(angleDiff, Constants.MAX_ANGLE_CHANGE_PER_TICK);
      } else if (angleDiff < 0) {
        angleChange = Math.max(angleDiff, -Constants.MAX_ANGLE_CHANGE_PER_TICK);
      }

      angleChange *= (this.speed / Constants.ANGLE_TO_SPEED_RATIO);
    }

    this.angle += angleChange;

    return angleChange;
  }

  /**
   * Calculates how much the car's speed should change to match its brain state
   *
   * @author mauricio.araldi
   * @since 0.2.0
   *
   * @return {Number} How much the speed changed
   */
  proccessCarBrainSpeed() {
    let speedState = this.brainState.speed;
    let speedChange = 0;

    if (this.parkingBreak) {
      speedState = 0;
    }

    if (this.speed !== speedState) {
      const speedDiff = speedState - this.speed;

      if (speedDiff > 0) {
        speedChange = Math.min(speedDiff, Constants.MAX_SPEED_CHANGE_PER_TICK);
      } else if (speedDiff < 0) {
        speedChange = Math.max(speedDiff, -Constants.MAX_SPEED_CHANGE_PER_TICK);
      }
    }

    this.speed += speedChange;

    return speedChange;
  }

  /**
   * Updates the car according to its brain state
   *
   * @author mauricio.araldi
   * @since 0.2.0
   */
  update() {
    this.proccessCarBrainSpeed();
    const realSpeed = this.speed * (Math.abs(this.speed) / Constants.SPEED_RATIO);
    const brainAngleChange = this.proccessCarBrainAngle();

    if (!realSpeed) {
      return;
    }

    const angleRad = Utils.degreesToRadians(this.angle);
    const angleDiffRad = Utils.degreesToRadians(brainAngleChange);

    this.x -= (realSpeed * Math.cos(angleRad));
    this.y -= (realSpeed * Math.sin(angleRad));

    this.polygon.pos.x = this.x;
    this.polygon.pos.y = this.y;

    const points = this.polygon.points.map((point) => {
      const centerX = point.x - this.width * 0.25;
      const centerY = point.y - this.height * 0.5;

      const rotatedX = centerX * Math.cos(angleDiffRad) - centerY * Math.sin(angleDiffRad);
      const rotatedY = centerX * Math.sin(angleDiffRad) + centerY * Math.cos(angleDiffRad);

      return new SAT.Vector(
        rotatedX + this.width * 0.25,
        rotatedY + this.height * 0.5,
      );
    });

    this.polygon.setPoints(points);
  }
}
