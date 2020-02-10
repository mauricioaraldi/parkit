import CodeMirror from 'codemirror/lib/codemirror';
import 'codemirror/mode/javascript/javascript';
import SAT from 'sat';

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
const SENSOR_BREAKPOINTS_QT = 10;
const SENSOR_RANGE = SENSOR_METERS_RANGE * PIXELS_PER_METER;
const MAX_ANGLE_CHANGE_PER_TICK = 2;
const MAX_SPEED_CHANGE_PER_TICK = 0.6;
const MAX_ANGLE = 35;
const SPEED_RATIO = 60;

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
    const { points } = object.polygon;
    let i = points.length - 1;

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
      polygon: new SAT.Polygon(
        new SAT.Vector(x, y),
        [
          new SAT.Vector(0, 0),
          new SAT.Vector(CAR_WIDTH, 0),
          new SAT.Vector(CAR_WIDTH, CAR_HEIGHT),
          new SAT.Vector(0, CAR_HEIGHT),
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
 * @param {Number} length How many pixels the sensor area needs to cover
 * @return {Object} The area of the sensor ({x, y}[])
 */
function getSensorArea(originX, originY, angle, length) {
  const interval = length / SENSOR_BREAKPOINTS_QT;
  const area = [];

  for (let i = 0; i < SENSOR_BREAKPOINTS_QT; i++) {
    const offset = i * interval;
    area.push(new SAT.Vector(
      Math.floor(originX - (offset * Math.cos(degreesToRadians(angle)))),
      Math.floor(originY - (offset * Math.sin(degreesToRadians(angle)))),
    ));
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
  const carX = car.polygon.pos.x;
  const carY = car.polygon.pos.y;
  const carPoints = car.polygon.points;
  const points = carPoints.map((carPoint) => (
    { x: carX + carPoint.x, y: carY + carPoint.y }
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
  const carAngleCos = Math.cos(degreesToRadians(car.angle));
  const carAngleDelta = car.angle * carAngleCos;

  for (let i = 0; i < angles.length; i += 1) {
    const point = points[Math.floor((i || 1) / pointsPerAngle)];
    const area = getSensorArea(
      point.x,
      point.y,
      angles[i] + car.angle,
      SENSOR_RANGE,
    );

    sensors[i] = {
      area,
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
    polygon: new SAT.Polygon(
      new SAT.Vector(x, y),
      [
        new SAT.Vector(0, 0),
        new SAT.Vector(CAR_WIDTH, 0),
        new SAT.Vector(CAR_WIDTH, CAR_HEIGHT),
        new SAT.Vector(0, CAR_HEIGHT),
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
  let newAngleDiff = null;
  let realSpeed = null;

  if (car.speed !== speedState) {
    const speedDiff = speedState - car.speed;
    let speedChange = null;

    if (speedDiff > 0) {
      speedChange = Math.min(speedDiff, MAX_SPEED_CHANGE_PER_TICK);
    } else if (speedDiff < 0) {
      speedChange = Math.max(speedDiff, -MAX_SPEED_CHANGE_PER_TICK);
    }

    speed += speedChange;
  }

  realSpeed = speed * (speed / SPEED_RATIO);

  if (realSpeed && car.angle !== angleState) {
    const angleDiff = angleState - car.angle;
    let angleChange = null;

    if (angleDiff > 0) {
      angleChange = Math.min(angleDiff, MAX_ANGLE_CHANGE_PER_TICK);
    } else if (angleDiff < 0) {
      angleChange = Math.max(angleDiff, -MAX_ANGLE_CHANGE_PER_TICK);
    }

    angle += angleChange;

    newAngleDiff = degreesToRadians(angle - car.angle);
  }

  polygon.pos.x -= (realSpeed * Math.cos(degreesToRadians(angle)));
  polygon.pos.y -= (realSpeed * Math.sin(degreesToRadians(angle)));

  if (newAngleDiff) {
    const points = polygon.points.map((point) => {
      const centerX = point.x - car.width / 2;
      const centerY = point.y - car.height / 2;

      const rotatedX = centerX * Math.cos(newAngleDiff) - centerY * Math.sin(newAngleDiff);
      const rotatedY = centerX * Math.sin(newAngleDiff) + centerY * Math.cos(newAngleDiff);

      return new SAT.Vector(
        rotatedX + car.width / 2,
        rotatedY + car.height / 2,
      );
    });

    polygon.setPoints(points);
  }

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

    sensor.reading = SENSOR_BREAKPOINTS_QT;

    objects.forEach((object) => {
      sensor.area.some((point, index) => {
        if (SAT.pointInPolygon(point, object.polygon)) {
          sensor.reading = index;
          return true;
        }
      });
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
    document.querySelector(`#sensor${parseInt(key) + 1}`).value = sensors[key].reading;
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
      const collided = SAT.testPolygonPolygon(objectA.polygon, objectB.polygon);

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

  let sensors = getSensorsReadings(playerCar.sensors, [...sceneObjects]);
  updateSensorsDisplay(sensors);

  eval.call({}, `(${brainCode})`)(carInstructions); // eslint-disable-line no-eval

  newBrainState = { ...playerCar.brainState, ...carInstructions };

  newBrainState.angle = Math.min(newBrainState.angle, MAX_ANGLE);
  newBrainState.sensors = sensors;

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


/* Initial setup */
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


/* Actions */
document.querySelector('#play').addEventListener('click', () => runSimulation(true));
document.querySelector('#stop').addEventListener('click', () => runSimulation(false));
document.querySelector('#save').addEventListener('click', () => saveCode());
