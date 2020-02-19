import CodeMirror from 'codemirror/lib/codemirror';
import 'codemirror/mode/javascript/javascript';
import SAT from 'sat';
import 'noty/lib/noty.css';
import 'noty/lib/themes/metroui.css';
import Noty from 'noty';

import Car from './objects/Car';
import Utils from './utils';

import '../styles/index.css';
import 'codemirror/lib/codemirror.css';
import 'codemirror/theme/paraiso-dark.css';

const LS_CODE_KEY = 'parkit_usercode';
const CANVAS_WIDTH = 1280;
const CANVAS_HEIGHT = 300;
const CAR_WIDTH = 200;
const CAR_HEIGHT = 100;
const FRAMES_PER_SECOND = 24;
const BRAIN_TICKS_PER_SECOND = 10;
const PIXELS_PER_METER = 10;
const SENSOR_METERS_RANGE = 8;
const SENSOR_RANGE = SENSOR_METERS_RANGE * PIXELS_PER_METER;
const MAX_ANGLE_CHANGE_PER_TICK = 0.6;
const MAX_SPEED_CHANGE_PER_TICK = 0.6;
const MAX_ANGLE = 35;
const SPEED_RATIO = 60;
const SENSORS_QT = 20;
const SENSOR_BREAKPOINTS_QT = 10;
const OBJECT_COLORS = ['#9CC0E7', '#EEEEEE', '#FCFCFC', '#FAEACB', '#F7DBD7',
  '#CBBFB0', '#BDC2C2', '#739194', '88BCE8'];
const CURRENT_LEVEL = 1;

const LEVELS_CONFIG = {
  1: {
    getObstacles: () => [
      new Car(
        OBJECT_COLORS[0],
        10,
        10,
        CAR_WIDTH,
        CAR_HEIGHT,
      ),
      new Car(
        OBJECT_COLORS[1],
        (CAR_WIDTH * 2) + (64 * 2),
        10,
        CAR_WIDTH,
        CAR_HEIGHT,
      ),
      new Car(
        OBJECT_COLORS[2],
        (CAR_WIDTH * 3) + (64 * 3),
        10,
        CAR_WIDTH,
        CAR_HEIGHT,
      ),
      new Car(
        OBJECT_COLORS[3],
        (CAR_WIDTH * 4) + (64 * 4),
        10,
        CAR_WIDTH,
        CAR_HEIGHT,
      ),
    ],
    getPlayerCar: () => new Car(
      '#DB2929',
      CANVAS_WIDTH - (CAR_WIDTH + 10),
      CAR_HEIGHT + 60,
      CAR_WIDTH,
      CAR_HEIGHT,
      0,
      {
        angle: 0,
        speed: 0,
      },
      0,
      true,
      SENSOR_RANGE,
      SENSOR_BREAKPOINTS_QT,
    ),
  },
};

let codeMirror;
let animationTicker;
let brainTicker;

Noty.overrideDefaults({
  layout: 'center',
  theme: 'metroui',
  timeout: 3000,
});

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

  car.speed = speed;

  if (realSpeed && car.angle !== angleState) {
    const angleDiff = angleState - car.angle;
    let angleChange = null;

    if (angleDiff > 0) {
      angleChange = Math.min(angleDiff, MAX_ANGLE_CHANGE_PER_TICK);
    } else if (angleDiff < 0) {
      angleChange = Math.max(angleDiff, -MAX_ANGLE_CHANGE_PER_TICK);
    }

    angle += angleChange;

    newAngleDiff = Utils.degreesToRadians(angleChange);
  }

  car.angle = angle;

  car.polygon.pos.x -= (realSpeed * Math.cos(Utils.degreesToRadians(angle)));
  car.polygon.pos.y -= (realSpeed * Math.sin(Utils.degreesToRadians(angle)));

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

    car.polygon.setPoints(points);
  }
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

    sensor.reading = sensor.area.length;

    objects.forEach((object) => {
      sensor.area.some((point, index) => {
        if (SAT.pointInPolygon(point, object.polygon)) {
          sensor.reading = index;
          return true;
        }

        return false;
      });
    });
  });

  return sensors;
}

/**
 * Updates the interface display of sensors
 *
 * @author mauricio.araldi
 * @since 0.1.0
 *
 * @param {Object} The sensors of the car
 */
function updateSensorsDisplay(sensors) {
  Object.keys(sensors).forEach((key) => {
    const sensor = document.querySelector(`#sensor${key}`);
    sensor.value = sensors[key].reading;
  });
}

/**
 * Draws the sensors to show their ranges
 *
 * @author mauricio.araldi
 * @since 0.1.0
 *
 * @param {CanvasRenderingContext2D} ctx Canvas context do render content
 * @param {Integer[]} sensorIds IDs of the sensors to be drawn
 * @param {Object} car The car with the sensors to be drawn
 * @return {Boolean} If the sensors were drew
 */
function drawSensors(ctx, sensorIds, car) {
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = 2;

  sensorIds.forEach((id) => {
    const { area } = car.sensors[id];

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

        if (!checkAllCollisions) {
          return collisions;
        }
      }
    }
  }

  return collisions;
}

/**
 * Updates the animation
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
  const highlightSensors = document.querySelectorAll('.sensor.active');
  let collisions = null;

  ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  drawAsphalt(ctx);
  drawObjects(ctx, [...sceneObjects, playerCar]);

  updatePlayerCar(playerCar);

  playerCar.sensors = playerCar.buildSensors();

  if (highlightSensors.length) {
    const ids = [];

    highlightSensors.forEach((sensor) => ids.push(parseInt(sensor.dataset.id, 10)));

    drawSensors(ctx, ids, playerCar);
  }

  collisions = checkCollisions([...sceneObjects, playerCar]);

  if (collisions.length) {
    runSimulation(false);
    new Noty({
      text: 'Your car crashed!',
      type: 'error',
    }).show();
  }
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

  const sensors = getSensorsReadings(playerCar.sensors, [...sceneObjects]);
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
  const currentLevel = LEVELS_CONFIG[CURRENT_LEVEL];
  const canvas = document.querySelector('canvas');
  const ctx = canvas.getContext('2d');
  const sceneObjects = currentLevel.getObstacles();
  const playerCar = currentLevel.getPlayerCar();

  if (play && !animationTicker) {
    animationTicker = setInterval(
      () => {
        animationTick(ctx, playerCar, sceneObjects);
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

/**
 * Checks if all sensors are highlighted and if the checkbox should
 * be checked
 *
 * @author mauricio.araldi
 * @since 0.2.0
 */
function checkSensorsHighlighted() {
  const sections = document.querySelectorAll('.sensor-section');
  const activeSensors = document.querySelectorAll('.sensor.active');
  const sensorsQtPerSection = SENSORS_QT / sections.length;
  const highlightAllCheckbox = document.querySelector('#highlight-all-sensors');

  sections.forEach((section) => {
    const sectionActiveSensors = section.querySelectorAll('.sensor.active');
    const input = section.querySelector('input');

    input.checked = sectionActiveSensors.length === sensorsQtPerSection;
  });

  highlightAllCheckbox.checked = activeSensors.length === SENSORS_QT;
}

/**
 * Creates the input field for the sensors
 *
 * @author mauricio.araldi
 * @since 0.2.0
 *
 * @param {Number} sensorsQt The quantity of sensors
 */
function createSensorInputs(sensorsQt) {
  const sectionContainers = [
    document.querySelector('#front-right-section > div'),
    document.querySelector('#rear-right-section > div'),
    document.querySelector('#rear-left-section > div'),
    document.querySelector('#front-left-section > div'),
  ];

  for (let i = 1; i <= sensorsQt; i += 1) {
    const sensorContainer = document.createElement('div');
    const sensorTitle = document.createElement('span');
    const sensorInput = document.createElement('input');
    let sectionContainer = sectionContainers[Math.floor((i - 1) / 5)];

    sensorTitle.textContent = i;

    sensorInput.setAttribute('readonly', true);
    sensorInput.setAttribute('type', 'text');
    sensorInput.setAttribute('id', `sensor${i}`);

    sensorContainer.classList.add('sensor');
    sensorContainer.setAttribute('data-id', i);
    sensorContainer.append(sensorTitle);
    sensorContainer.append(sensorInput);

    sensorContainer.addEventListener('click', (ev) => {
      ev.stopPropagation();

      const isActive = sensorContainer.dataset.active;

      setHighlightSensor(sensorContainer, !isActive);
    });

    if (!sectionContainer) {
      sectionContainer = sectionContainers[sectionContainers.length - 1];
    }

    sectionContainer.append(sensorContainer);
  }
}

/**
 * Toggles the highlight in one sensor
 *
 * @author mauricio.araldi
 * @since 0.2.0
 *
 * @param {HTMLInputElement} sensor The sensor to highlight
 * @param {Boolean} active If the sensor should be marked as active
 */
function setHighlightSensor(sensor, active) {
  if (active) {
    sensor.classList.add('active');
    sensor.setAttribute('data-active', true);
  } else {
    sensor.classList.remove('active');
    sensor.removeAttribute('data-active');
  }

  checkSensorsHighlighted();
}

/**
 * Toggles the highlight in all sensors
 *
 * @author mauricio.araldi
 * @since 0.2.0
 *
 * @param {HTMLChangeEvent} ev The event when the checkbox changed
 */
function toggleHighlightSensors(ev) {
  const shouldHighlight = ev.target.checked;

  document.querySelectorAll('.sensor').forEach((sensor) => {
    setHighlightSensor(sensor, shouldHighlight);
  });
}

/**
 * Toggles the highlight in the sensors of the section
 *
 * @author mauricio.araldi
 * @since 0.2.0
 *
 * @param {HTMLChangeEvent} ev The event when the checkbox changed
 */
function toggleHighlightSection(ev) {
  const sectionContainer = ev.target.parentElement.parentElement;
  const shouldHighlight = ev.target.checked;

  sectionContainer.querySelectorAll('.sensor').forEach((sensor) => {
    setHighlightSensor(sensor, shouldHighlight);
  });
}

/* Initial setup */
window.onload = () => {
  const canvas = document.querySelector('canvas');

  canvas.width = CANVAS_WIDTH;
  canvas.height = CANVAS_HEIGHT;

  createSensorInputs(SENSORS_QT);

  codeMirror = CodeMirror.fromTextArea(
    document.querySelector('#code-editor'),
    {
      lineNumbers: true,
      mode: 'javascript',
      theme: 'paraiso-dark',
    },
  );

  const codeMirrorElement = document.querySelector('.CodeMirror');
  const codeMirrorTop = codeMirrorElement.getClientRects()[0].top;
  const codeMirrorHeight = window.innerHeight - codeMirrorTop;
  codeMirrorElement.style.height = `${codeMirrorHeight}px`;

  if (!loadCode()) {
    codeMirror.getDoc().setValue(`function carBrain(car) {
  car.speed = 20;

  if (car.sensors[3].reading === 10 && car.sensors[4].reading === 10) {
    car.speed = 0;
  } else if (car.sensors[3].reading >= 6) {
    car.angle = 5;
  } else if (car.sensors[3].reading <= 4) {
    car.angle = -5;
  }
}`);
  }

  runSimulation(false);

  /* Actions */
  document.querySelector('#play').addEventListener('click', () => runSimulation(true));
  document.querySelector('#stop').addEventListener('click', () => runSimulation(false));
  document.querySelector('#save').addEventListener('click', saveCode);
  document.querySelector('#highlight-all-sensors').addEventListener('change', toggleHighlightSensors);

  document.querySelectorAll('.sensor-section').forEach((element) => {
    const input = element.querySelector('input');

    element.addEventListener('change', toggleHighlightSection);
    input.checked = false;
  });

  document.querySelector('#highlight-all-sensors').checked = false;
};
