import CodeMirror from 'codemirror/lib/codemirror';
import 'codemirror/mode/javascript/javascript';
import Polygon from './sat/Polygon';
import Response from './sat/Response';
import Sat from './sat/Sat';
import Vector from './sat/Vector';

import '../styles/index.css';
import 'codemirror/lib/codemirror.css';
import 'codemirror/theme/paraiso-dark.css';

const LS_CODE_KEY = 'parkit_usercode';
const CANVAS_WIDTH = window.innerWidth;
const CANVAS_HEIGHT = 300;
const CAR_WIDTH = 200;
const CAR_HEIGHT = 100;
const FRAMES_PER_SECOND = 24;
const BRAIN_TICKS_PER_SECOND = 10;
const PIXELS_PER_METER = 10;
const SENSOR_METERS_RANGE = 8;
const SENSOR_RANGE = SENSOR_METERS_RANGE * PIXELS_PER_METER;
const MAX_ANGLE_CHANGE_PER_TICK = 1;
const MAX_SPEED_CHANGE_PER_TICK = 1;

let codeMirror;
let animationTicker;
let brainTicker;

const SAT = new Sat();

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
    // if (object.angle && object.angle !== 0) {
    //   ctx.save();
    //   ctx.translate(object.x + object.width / 2, object.y + object.height / 2);
    //   ctx.rotate(degreesToRadians(object.angle));
    //   ctx.fillStyle = object.color;
    //   ctx.fillRect(-(object.width / 2), -(object.height / 2), object.width, object.height);

    //   ctx.restore();

    //   ctx.fillStyle = 'blue';
    //   ctx.fillRect(object.x, object.y, object.width, object.height);

    //   return;
    // }

    // ctx.fillStyle = object.color;
    // ctx.fillRect(object.x, object.y, object.width, object.height);

    // ctx.restore();

    const { points } = object.polygon;
    let i = points.length;

    ctx.fillStyle = object.color;
    ctx.save();
    ctx.translate(object.polygon.pos.x, object.polygon.pos.y);
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);

    while (i) {
      ctx.lineTo(points[i].x, points[i].y);
      i -= 1;
    }

    ctx.closePath();
    ctx.fill();
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

    const x = 10 + (10 * index) + (CAR_WIDTH * index);
    const y = 10;

    return {
      color,
      polygon: new Polygon(
        new Vector(x, y),
        [
          new Vector(0, 0),
          new Vector(CAR_WIDTH, 0),
          new Vector(CAR_WIDTH, CAR_HEIGHT),
          new Vector(0, CAR_HEIGHT),
        ],
      ),
      width: CAR_WIDTH,
      height: CAR_HEIGHT,
    };
  }).filter((car) => car);
}

/**
 * Gets the area of a sensor, acording to the car position
 *
 * @author mauricio.araldi
 * @since 0.1.0
 *
 * @param {Number} originX The X point from where the sensor will be drawn
 * @param {Number} originY The Y point from where the sensor will be drawn
 * @param {Number} angle The angle to which the sensor will be drawn towards
 * @param {Number} length For how many pixels the sensor area extends
 * @return {Object} The area of the sensor ({x, y}[])
 */
function getSensorArea(originX, originY, angle, length) {
  const area = [];

  for (let i = 0; i < length; i += 1) {
    area.push({
      x: Math.floor(originX - (i * Math.cos(degreesToRadians(angle)))),
      y: Math.floor(originY - (i * Math.sin(degreesToRadians(angle)))),
    });
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
 * @return {Object} The sensors of the car (area and reading, by id)
 */
function buildSensors(car) {
  const points = [
    // Top Left (A)
    { x: car.x, y: car.y },

    // Top Right (B)
    { x: car.x + car.width, y: car.y },

    // Bottom Right (C)
    { x: car.x + car.width, y: car.y + car.height },

    // Bottom Left (D)
    { x: car.x, y: car.y + car.height },
  ];
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

  for (let i = 0; i < 20; i += 1) {
    const point = points[Math.floor((i || 1) / 5)];

    sensors[i] = {
      area: getSensorArea(
        point.x - (car.angle * Math.cos(degreesToRadians(car.angle))),
        point.y - (car.angle * Math.cos(degreesToRadians(car.angle))),
        angles[i] + car.angle,
        SENSOR_RANGE,
      ),
      reading: 0,
    };
  }

  return sensors;
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
  const x = CANVAS_WIDTH - (CAR_WIDTH + 10);
  const y = CAR_HEIGHT + 60;
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
    polygon: new Polygon(
      new Vector(x, y),
      [
        new Vector(0, 0),
        new Vector(CAR_WIDTH, 0),
        new Vector(CAR_WIDTH, CAR_HEIGHT),
        new Vector(0, CAR_HEIGHT),
      ],
    ),
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
  const { polygon } = car;
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

  polygon.pos.x -= (speed * Math.cos(degreesToRadians(angle)));
  polygon.pos.y -= (speed * Math.sin(degreesToRadians(angle)));

  polygon.points = polygon.points.map((point) => ({
    x: point.x * Math.cos(angle) - point.y * Math.sin(angle),
    y: point.x * Math.sin(angle) + point.y * Math.cos(angle),
  }));

  return {
    ...car,
    angle,
    polygon,
    speed,
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

    sensor.reading = 0;

    objects.forEach((object) => {
    //   if (
    //     sensor.collisionBox.x < object.x + object.width
    //     && sensor.collisionBox.x + sensor.collisionBox.width > object.x
    //     && sensor.collisionBox.y < object.y + object.height
    //     && sensor.collisionBox.height + sensor.collisionBox.y > object.y
    //   ) {
    //     sensor.reading = 1;
    //   }
    });
  });

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
 * @param {Object} car The car with the sensors to be drawn
 * @return {Boolean} If the sensors were drew
 */
function drawSensors(ctx, car) {
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = 2;

  Object.keys(car.sensors).forEach((key) => {
    const { area } = car.sensors[key];

    ctx.beginPath();
    ctx.moveTo(area[0].x, area[0].y);
    ctx.lineTo(area[area.length - 1].x, area[area.length - 1].y);
    ctx.closePath();
    ctx.stroke();
  });

  ctx.restore();
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
 * Checks for collisions between objects
 *
 * @author mauricio.araldi
 * @since 0.1.0
 *
 * @param {Array<Object>} objects The objects to be drawn
 * @param {Boolean} checkAllCollisions If not only the first, but all, collisions
 * should be returned
 * @return {Array | Array<Array>} One or all detected collisions
 */
function checkCollisions(objects, checkAllCollisions) {
  const collisions = [];

  for (let i = objects.length - 1; i >= 0; i -= 1) {
    const objectA = objects[i];

    for (let j = i - 1; j >= 0; j -= 1) {
      const objectB = objects[j];
      const collided = SAT.testPolygonPolygon(objectA.polygon, objectB.polygon, new Response());

      if (collided) {
        collisions.push(objectA, objectB);
      }
    }
  }

  return collisions;
}

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
  let collisions = null;

  ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  drawAsphalt(ctx);
  drawObjects(ctx, [...sceneObjects, playerCar]);
  newPlayerCarState = updatePlayerCar(playerCar);

  newPlayerCarState.sensors = buildSensors(newPlayerCarState);

  if (highlightSensors) {
    drawSensors(ctx, playerCar);
  }

  collisions = checkCollisions([...sceneObjects, playerCar]);

  if (collisions.length) {
    console.log(collisions);
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

/**
 * Saves user's code in localStorage
 *
 * @author mauricio.araldi
 * @since 0.1.0
 *
 * @return {Boolean} If the code is saved
 */
function saveCode() {
  const code = codeMirror.getValue();

  if (!code) {
    return false;
  }

  localStorage.setItem(LS_CODE_KEY, code);

  return true;
}


/**
 * Loads user's code from localStorage
 *
 * @author mauricio.araldi
 * @since 0.1.0
 *
 * @return {Boolean} If the user's code is loaded
 */
function loadCode() {
  const code = localStorage.getItem(LS_CODE_KEY);

  if (!code) {
    return false;
  }

  codeMirror.setValue(code);

  return true;
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

  if (!loadCode()) {
    codeMirror.getDoc().setValue('function carBrain(car) {\n  car.speed = 10;\n}');
  }

  runSimulation(false);
};


/** Actions */
document.querySelector('#play').addEventListener('click', () => runSimulation(true));
document.querySelector('#stop').addEventListener('click', () => runSimulation(false));
document.querySelector('#save').addEventListener('click', () => saveCode());
