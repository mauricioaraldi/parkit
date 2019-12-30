import CodeMirror from 'codemirror/lib/codemirror';
import 'codemirror/mode/javascript/javascript';

import '../styles/index.css';
import 'codemirror/lib/codemirror.css';
import 'codemirror/theme/paraiso-dark.css';

const CANVAS_WIDTH = window.innerWidth;
const CANVAS_HEIGHT = 300;
const CAR_WIDTH = 200;
const CAR_HEIGHT = 100;
const FRAMES_PER_SECOND = 24;
const PIXELS_PER_METER = 10;
const SENSOR_METERS_RANGE = 6;
const SENSOR_RANGE = SENSOR_METERS_RANGE * PIXELS_PER_METER;
let ticker;
let codeMirror;

/**
 * Draws the asphalt on a canvas
 *
 * @author mauricio.araldi
 * @since 0.1.0
 *
 * @param {CanvasRenderingContext2D} ctx Canvas context do render content
 * @return {boolean} If asphalt was draw
 */
function drawAsphalt(ctx) {
  ctx.fillStyle = '#282B2A';
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
}

/**
 * Draws the cars
 *
 * @author mauricio.araldi
 * @since 0.1.0
 *
 * @param {CanvasRenderingContext2D} ctx Canvas context do render content
 * @param {Array<Object>} cars The cars to be drawn
 * @return {Boolean} If the cars were drawn
 */
function drawCars(ctx, cars) {
  cars.forEach((car) => {
    ctx.fillStyle = car.color;
    ctx.fillRect(car.x, car.y, car.width, car.height);
  });

  return true;
}

/**
 * Build the cars that will be displayed as parked
 *
 * @author mauricio.araldi
 * @since 0.1.0
 *
 * @param {Number} availableSlotIndex The parking slot that will be available
 * @return {Array<Object>} The built parked cars
 */
function buildParkedCars(availableSlotIndex) {
  let carColors = ['#9CC0E7', '#EEEEEE', '#FCFCFC', '#FAEACB', '#F7DBD7',
    '#CBBFB0', '#BDC2C2', '#739194', '88BCE8'];

  if (availableSlotIndex !== undefined) {
    carColors = carColors.slice(0, availableSlotIndex)
      .concat([null, ...carColors.slice(availableSlotIndex)]);
  }

  return carColors.map((color, index) => {
    if (!color) {
      return null;
    }

    return {
      color,
      x: 10 + (10 * index) + (CAR_WIDTH * index),
      y: 10,
      width: CAR_WIDTH,
      height: CAR_HEIGHT,
    };
  }).filter((car) => car);
}

/**
 * Builds the players car
 *
 * @author mauricio.araldi
 * @since 0.1.0
 *
 * @return {Object} The built player car
 */
function buildPlayerCar() {
  return {
    color: '#DB2929',
    speed: 0,
    x: CANVAS_WIDTH - (CAR_WIDTH + 10),
    y: CAR_HEIGHT + 60,
    width: CAR_WIDTH,
    height: CAR_HEIGHT,
    sensors: null,
    sensorRange: SENSOR_RANGE,
  };
}

/**
 * Updates the player's car with new information
 *
 * @author mauricio.araldi
 * @since 0.1.0
 *
 * @return {Object} The updated player car
 */
function updatePlayerCar(car) {
  return {
    ...car,
    x: car.x - car.speed,
  };
}

/**
 * Updates the sensors readings
 *
 * @author mauricio.araldi
 * @since 0.1.0
 *
 * @param {Object} car The player's car
 * @param {Array<Object>} objects All the objects in the scenery
 * @return {Object} The sensors of the car, with their readings
 */
function getPlayerCarSensorsReadings(car, objects) {
  const sensors = { ...car.sensors };

  Object.keys(sensors).forEach((key) => {
    const sensor = sensors[key];

    // objects.forEach((object) => {
    //   if (
    //     sensor[key].x < object.x + object.width + SENSOR_RANGE
    //     && sensor[key].x + sensor[key].width > object.x - SENSOR_RANGE
    //     && sensor[key].y < object.y + object.height + SENSOR_RANGE
    //     && sensor[key].height + sensor[key].y > object.y - SENSOR_RANGE
    //   ) {
    //     console.log(object, sensor[key]);
    //   }
    // });
  });

  return sensors;
}

/**
 * Builds the sensors of a car
 *
 * @author mauricio.araldi
 * @since 0.1.0
 *
 * @param {Object} car The car to have its sensors built
 * @return {Object} The sensors of the car
 */
function buildSensors(car) {
  const halfCarWidth = car.width / 2;
  const halfCarHeight = car.height / 2;
  const halfSensorRange = car.sensorRange / 2;
  const sensors = {
    1: {
      x: car.x - car.sensorRange,
      y: car.y - car.sensorRange,
      width: car.sensorRange,
      height: car.sensorRange,
      reading: 0,
    },
    2: {
      x: car.x + halfCarWidth - halfSensorRange,
      y: car.y - car.sensorRange,
      width: car.sensorRange,
      height: car.sensorRange,
      reading: 0,
    },
    3: {
      x: car.x + car.width,
      y: car.y - car.sensorRange,
      width: car.sensorRange,
      height: car.sensorRange,
      reading: 0,
    },
    4: {
      x: car.x + car.width,
      y: car.y + halfCarHeight - halfSensorRange,
      width: car.sensorRange,
      height: car.sensorRange,
      reading: 0,
    },
    5: {
      x: car.x + car.width,
      y: car.y + car.height,
      width: car.sensorRange,
      height: car.sensorRange,
      reading: 0,
    },
    6: {
      x: car.x + halfCarWidth - halfSensorRange,
      y: car.y + car.height,
      width: car.sensorRange,
      height: car.sensorRange,
      reading: 0,
    },
    7: {
      x: car.x - car.sensorRange,
      y: car.y + car.height,
      width: car.sensorRange,
      height: car.sensorRange,
      reading: 0,
    },
    8: {
      x: car.x - car.sensorRange,
      y: car.y + halfCarHeight - halfSensorRange,
      width: car.sensorRange,
      height: car.sensorRange,
      reading: 0,
    },
  };

  return sensors;
}

/**
 * Updates the sensors readings
 *
 * @author mauricio.araldi
 * @since 0.1.0
 *
 * @param {Object} The sensors of the car
 */
function updateSensorsDisplay(sensors) {
  Object.keys(sensors).forEach((key) => {
    document.querySelector(`#sensor${key}`).value = sensors[key].reading;
  });
}

/**
 * Draws the sensors to show their ranges
 *
 * @author mauricio.araldi
 * @since 0.1.0
 *
 * @param {CanvasRenderingContext2D} ctx Canvas context do render content
 * @param {Object} sensors The sensors to be drawn
 * @return {Boolean} If the sensors were drew
 */
function drawSensors(ctx, sensors) {
  Object.keys(sensors).forEach((key) => {
    const sensor = sensors[key];

    ctx.fillStyle = 'rgba(150, 180, 160, 0.5)';
    ctx.fillRect(sensor.x, sensor.y, sensor.width, sensor.height);
  });
}

/**
 * Starts or stops the animation
 *
 * @author mauricio.araldi
 * @since 0.1.0
 *
 * @param {Boolean} play If the animation should be played
 */
function playAnimation(play) {
  const canvas = document.querySelector('canvas');
  const ctx = canvas.getContext('2d');
  const parkedCars = buildParkedCars(2);
  const sensorCode = codeMirror.getValue();
  const carInstructions = {};
  const highlightSensors = true;
  let playerCar = buildPlayerCar();

  if (play && !ticker) {
    ticker = setInterval(() => {
      eval.call({}, `(${sensorCode})`)(playerCar.sensors, carInstructions); // eslint-disable-line no-eval

      delete carInstructions.color;
      delete carInstructions.x;
      delete carInstructions.y;
      delete carInstructions.width;
      delete carInstructions.height;
      delete carInstructions.sensorRange;
      delete carInstructions.sensors;

      playerCar.sensors = getPlayerCarSensorsReadings(playerCar, [...parkedCars]);
      updateSensorsDisplay(playerCar.sensors);
      playerCar = updatePlayerCar({ ...playerCar, ...carInstructions });
      drawAsphalt(ctx);
      drawCars(ctx, [...parkedCars, playerCar]);

      playerCar.sensors = buildSensors(playerCar);

      if (highlightSensors) {
        drawSensors(ctx, playerCar.sensors);
      }
    }, 1000 / FRAMES_PER_SECOND);
  } if (!play) {
    clearInterval(ticker);
    ticker = null;

    drawAsphalt(ctx);
    drawCars(ctx, [...parkedCars, playerCar]);
  }
}

window.onload = () => {
  const canvas = document.querySelector('canvas');

  canvas.width = CANVAS_WIDTH;
  canvas.height = CANVAS_HEIGHT;

  codeMirror = CodeMirror.fromTextArea(document.querySelector('#code-editor'), {
    lineNumbers: true,
    mode: 'javascript',
    theme: 'paraiso-dark',
  });

  codeMirror.getDoc().setValue('function carBrain(sensor, car) {\n  car.speed = 10;\n}');

  playAnimation(false);
};

document.querySelector('#play').addEventListener('click', () => playAnimation(true));
document.querySelector('#stop').addEventListener('click', () => playAnimation(false));
