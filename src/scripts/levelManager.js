import Car from './objects/Car';
import Level from './objects/Level';
import GameObject from './objects/GameObject';
import Constants from './constants';

/**
 * Gets a level configuration
 *
 * @author mauricio.araldi
 * @since 0.2.0
 *
 * @param {Number} id Id of the level to be retrieved
 * @param {String[]} [colors] Array of colors to be used
 * @param {Number} [carWidth] Width of the cars
 * @param {Number} [carHeight] Height of the cars
 * @param {Number} [canvasWidth] Width of the canvas
 * @param {Number} [canvasHeight] Height of the canvas
 * @param {Number} [sensorRange] Range of the car's sensor
 * @param {Number} [sensorBreakpointQt] Quantity of breakpoints of car's sensor
 * @return {Level} The level configuration to be used
 */
function getLevel(
  id,
  colors = Constants.COLORS,
  carWidth = Constants.CAR_WIDTH,
  carHeight = Constants.CAR_HEIGHT,
  canvasWidth = Constants.CANVAS_WIDTH,
  canvasHeight = Constants.CANVAS_HEIGHT,
  sensorRange = Constants.SENSOR_RANGE,
  sensorBreakpointQt = Constants.SENSOR_BREAKPOINTS_QT,
) {
  switch (id) {
    case 1: return new Level(
      new Car(
        colors.player,
        canvasWidth - (carWidth + 10),
        carHeight + 60,
        carWidth,
        carHeight,
        0,
        {
          angle: 0,
          speed: 0,
        },
        0,
        true,
        sensorRange,
        sensorBreakpointQt,
      ),
      [
        new Car(
          colors.generic[0],
          10,
          10,
          carWidth,
          carHeight,
        ),
        new Car(
          colors.generic[1],
          (carWidth * 2) + (64 * 2),
          10,
          carWidth,
          carHeight,
        ),
        new Car(
          colors.generic[2],
          (carWidth * 3) + (64 * 3),
          10,
          carWidth,
          carHeight,
        ),
        new Car(
          colors.generic[3],
          (carWidth * 4) + (64 * 4),
          10,
          carWidth,
          carHeight,
        ),
      ],
      new GameObject(0, 0, canvasWidth, canvasHeight, 0, colors.asphalt),
      new GameObject(
        carWidth + 25,
        5,
        carWidth + 90,
        carHeight + 10,
        0,
        colors.goalArea,
      ),
    );

    default:
      return null;
  }
}

export default {
  getLevel,
};
