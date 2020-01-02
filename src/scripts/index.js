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
const BRAIN_TICKS_PER_SECOND = 10;
const PIXELS_PER_METER = 10;
const SENSOR_METERS_RANGE = 6;
const SENSOR_RANGE = SENSOR_METERS_RANGE * PIXELS_PER_METER;
const MAX_ANGLE_CHANGE_PER_TICK = 1;
const MAX_SPEED_CHANGE_PER_TICK = 1;

let codeMirror;
let animationTicker;
let brainTicker;

/**
 * Converts degrees into radians, to use in canvas
 *
 * @author mauricio.araldi
 * @since 0.1.0
 *
 * @param {Number} degrees Degrees to be converted to radians
 * @return {Number} Radians obtained from the degrees
 */
function degreesToRadians(degrees) {
  return degrees * (Math.PI / 180);
}

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
 * Draws the objects of the scene
 *
 * @author mauricio.araldi
 * @since 0.1.0
 *
 * @param {CanvasRenderingContext2D} ctx Canvas context do render content
 * @param {Array<Object>} objects The objects to be drawn
 * @return {Boolean} If the objects were drawn
 */
function drawObjects(ctx, objects) {
  objects.forEach((object) => {
    if (object.angle && object.angle !== 0) {
      ctx.save();
      ctx.translate(object.x + object.width / 2, object.y + object.height / 2);
      ctx.rotate(degreesToRadians(object.angle));
      ctx.fillStyle = object.color;
      ctx.fillRect(-(object.width / 2), -(object.height / 2), object.width, object.height);

      ctx.restore();
      return;
    }

    ctx.fillStyle = object.color;
    ctx.fillRect(object.x, object.y, object.width, object.height);

    ctx.restore();
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
  const car = {
    angle: 0,
    brainState: {
      angle: 0,
      speed: 0,
    },
    color: '#DB2929',
    height: CAR_HEIGHT,
    sensorRange: SENSOR_RANGE,
    sensors: null,
    speed: 0,
    width: CAR_WIDTH,
    x: CANVAS_WIDTH - (CAR_WIDTH + 10),
    y: CAR_HEIGHT + 60,
  };

  car.sensors = buildSensors(car);

  return car;
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
  const angleState = car.brainState.angle;
  const speedState = car.brainState.speed;
  let { angle, speed } = car;

  if (car.angle !== angleState) {
    const angleDiff = car.angle > angleState ? angleState - car.angle : car.angle + angleState;

    if (angleDiff > 0) {
      angle += MAX_ANGLE_CHANGE_PER_TICK;
    } else if (angleDiff < 0) {
      angle -= MAX_ANGLE_CHANGE_PER_TICK;
    }
  }

  if (car.speed !== speedState) {
    const speedDiff = car.speed > speedState ? speedState - car.speed : car.speed + speedState;

    if (speedDiff > 0) {
      speed += MAX_SPEED_CHANGE_PER_TICK;
    } else if (speedDiff < 0) {
      speed -= MAX_SPEED_CHANGE_PER_TICK;
    }
  }

  return {
    ...car,
    angle,
    speed,
    x: car.x - (speed * Math.cos(degreesToRadians(angle))),
    y: car.y - (speed * Math.sin(degreesToRadians(angle))),
  };
}

/**
 * Updates the sensors readings
 *
 * @author mauricio.araldi
 * @since 0.1.0
 *
 * @param {Object} referenceSensors The sensors to get readings of
 * @param {Array<Object>} objects All the objects in the scenery
 * @return {Object} The sensors of the car, with their readings
 */
function getSensorsReadings(referenceSensors, objects) {
  const sensors = { ...referenceSensors };

  Object.keys(sensors).forEach((key) => {
    const sensor = sensors[key];

    objects.forEach((object) => {
      if (
        sensor.collisionBox.x < object.x + object.width
        && sensor.collisionBox.x + sensor.collisionBox.width > object.x
        && sensor.collisionBox.y < object.y + object.height
        && sensor.collisionBox.height + sensor.collisionBox.y > object.y
      ) {
        sensor.reading = 1;
      }
    });
  });

  return sensors;
}

function getSensorArea(originX, originY, angle, length) {
  const area = [];

  for (let i = 0; i < length; i++) {
    let x = originX + i;
    let y = originY + i;

    area.push({ x, y });
  }

  return area;
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
    // Top Left
    1: {
      area: getSensorArea(car.x, car.y, car.angle, SENSOR_RANGE),
      reading: 0,
    },
    2: {
      area: getSensorArea(car.x, car.y, car.angle, SENSOR_RANGE),
      reading: 0,
    },
    3: {
      area: getSensorArea(car.x, car.y, car.angle, SENSOR_RANGE),
      reading: 0,
    },
    4: {
      area: getSensorArea(car.x, car.y, car.angle, SENSOR_RANGE),
      reading: 0,
    },
    5: {
      area: getSensorArea(car.x, car.y, car.angle, SENSOR_RANGE),
      reading: 0,
    },

    // Top Right
    6: {
      area: getSensorArea(car.x + car.width, car.y, car.angle, SENSOR_RANGE),
      reading: 0,
    },
    7: {
      area: getSensorArea(car.x + car.width, car.y, car.angle, SENSOR_RANGE),
      reading: 0,
    },
    8: {
      area: getSensorArea(car.x + car.width, car.y, car.angle, SENSOR_RANGE),
      reading: 0,
    },
    9: {
      area: getSensorArea(car.x + car.width, car.y, car.angle, SENSOR_RANGE),
      reading: 0,
    },
    10: {
      area: getSensorArea(car.x + car.width, car.y, car.angle, SENSOR_RANGE),
      reading: 0,
    },

    // Bottom Right
    
    11: {
      area: getSensorArea(car.x + car.width, car.y + car.height, car.angle, SENSOR_RANGE),
      reading: 0,
    },
    12: {
      area: getSensorArea(car.x + car.width, car.y + car.height, car.angle, SENSOR_RANGE),
      reading: 0,
    },
    13: {
      area: getSensorArea(car.x + car.width, car.y + car.height, car.angle, SENSOR_RANGE),
      reading: 0,
    },
    14: {
      area: getSensorArea(car.x + car.width, car.y + car.height, car.angle, SENSOR_RANGE),
      reading: 0,
    },
    15: {
      area: getSensorArea(car.x + car.width, car.y + car.height, car.angle, SENSOR_RANGE),
      reading: 0,
    },

    //Bottom Left
    16: {
      area: getSensorArea(car.x, car.y + car.height, car.angle, SENSOR_RANGE),
      reading: 0,
    },
    17: {
      area: getSensorArea(car.x, car.y + car.height, car.angle, SENSOR_RANGE),
      reading: 0,
    },
    18: {
      area: getSensorArea(car.x, car.y + car.height, car.angle, SENSOR_RANGE),
      reading: 0,
    },
    19: {
      area: getSensorArea(car.x, car.y + car.height, car.angle, SENSOR_RANGE),
      reading: 0,
    },
    20: {
      area: getSensorArea(car.x, car.y + car.height, car.angle, SENSOR_RANGE),
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
    const area = sensor.area;

    // console.log(area[0].x, area[0].y, 'xxxx', area[area.length - 1].x, area[area.length - 1].y);

    // ctx.strokeStyle = '#FFFFFF';
    // ctx.fillStyle = '#FFFFFF';
    // ctx.lineWidth = 5;
    // ctx.moveTo(area[0].x, area[0].y);
    // ctx.lineTo(area[area.length - 1].x, area[area.length - 1].y)
    // ctx.moveTo(20, 20);
    // ctx.lineTo(200, 200);
  });

  // Object.keys(sensors).forEach((key) => {
  //   const sensor = sensors[key];

  //   if (sensor.reading) {
  //     ctx.fillStyle = 'rgba(190, 38, 37, 0.5)';
  //   } else {
  //     ctx.fillStyle = 'rgba(170, 165, 131, 0.5)';
  //   }

  //   ctx.beginPath();
  //   ctx.moveTo(sensor.shape.a.x, sensor.shape.a.y);
  //   ctx.lineTo(sensor.shape.b.x, sensor.shape.b.y);
  //   ctx.lineTo(sensor.shape.c.x, sensor.shape.c.y);
  //   ctx.lineTo(sensor.shape.a.x, sensor.shape.a.y);
  //   ctx.closePath();
  //   ctx.fill();

  //   ctx.fillStyle = '#FFFFFF';
  //   ctx.textAlign = 'center';
  //   ctx.font = '16px serif';
  //   ctx.fillText(key, sensor.shape.a.x, sensor.shape.a.y);

  //   ctx.fillStyle = '#FFFFFF';
  //   ctx.textAlign = 'center';
  //   ctx.font = '34px serif';
  //   ctx.fillText(sensor.reading, sensor.shape.a.x - 10, sensor.shape.a.y - 10);
  // });
}

/**
 * Steer the car to the sides, from -90 to +90
 *
 * @author mauricio.araldi
 * @since 0.1.0
 *
 * @param {Number} degrees The number of degrees the car will steer
 * @return {Boolean} If the car is set to steer
 */
// function steer(degrees) {

// }

/**
 * Updats the animation
 *
 * @author mauricio.araldi
 * @since 0.1.0
 *
 * @param {CanvasRenderingContext2D} ctx Canvas context do render content
 * @param {Object} playerCar The car of the player
 * @param {Array<Object>} sceneObjects The current objects in the scene
 * @return {Object} The new state of the player's car
 */
function animationTick(ctx, playerCar, sceneObjects) {
  const highlightSensors = true;
  let newPlayerCarState = null;

  drawAsphalt(ctx);
  drawObjects(ctx, [...sceneObjects, playerCar]);
  newPlayerCarState = updatePlayerCar(playerCar);

  if (highlightSensors) {
    drawSensors(ctx, playerCar.sensors);
  }

  return newPlayerCarState;
}

/**
 * Updats the brain information
 *
 * @author mauricio.araldi
 * @since 0.1.0
 *
 * @param {Object} playerCar The car of the player
 * @param {Array<Object>} sceneObjects The current objects in the scene
 * @return {Object} The new state of the player's car brain
 */
function brainTick(playerCar, sceneObjects) {
  const brainCode = codeMirror.getValue();
  const carInstructions = { sensors: playerCar.sensors };
  let sensors = buildSensors(playerCar);
  let newBrainState = null;

  // sensors = getSensorsReadings(sensors, [...sceneObjects]);
  // updateSensorsDisplay(sensors);

  eval.call({}, `(${brainCode})`)(carInstructions); // eslint-disable-line no-eval

  newBrainState = { ...playerCar.brainState, ...carInstructions };
  // newBrainState.sensors = sensors;

  return newBrainState;
}

/**
 * Starts or stops the simulation
 *
 * @author mauricio.araldi
 * @since 0.1.0
 *
 * @param {Boolean} play If the simulation should be played
 */
function runSimulation(play) {
  const canvas = document.querySelector('canvas');
  const ctx = canvas.getContext('2d');
  const sceneObjects = buildParkedCars(2);
  let playerCar = buildPlayerCar();

  if (play && !animationTicker) {
    animationTicker = setInterval(
      () => {
        playerCar = animationTick(ctx, playerCar, sceneObjects);
      },
      1000 / FRAMES_PER_SECOND,
    );

    brainTicker = setInterval(
      () => {
        playerCar.brainState = brainTick(playerCar, sceneObjects);
      },
      1000 / BRAIN_TICKS_PER_SECOND,
    );
  } else {
    clearInterval(animationTicker);
    clearInterval(brainTicker);

    animationTicker = null;
    brainTicker = null;

    animationTick(ctx, playerCar, sceneObjects);
  }
}


/** Initial setup */
window.onload = () => {
  const canvas = document.querySelector('canvas');

  canvas.width = CANVAS_WIDTH;
  canvas.height = CANVAS_HEIGHT;

  codeMirror = CodeMirror.fromTextArea(document.querySelector('#code-editor'), {
    lineNumbers: true,
    mode: 'javascript',
    theme: 'paraiso-dark',
  });

  codeMirror.getDoc().setValue('function carBrain(car) {\n  car.speed = 10;\n}');

  runSimulation(false);
};


/** Actions */
document.querySelector('#play').addEventListener('click', () => runSimulation(true));
document.querySelector('#stop').addEventListener('click', () => runSimulation(false));
