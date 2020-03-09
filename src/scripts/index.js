import CodeMirror from 'codemirror/lib/codemirror';
import 'codemirror/mode/javascript/javascript';
import SAT from 'sat';
import 'noty/lib/noty.css';
import 'noty/lib/themes/metroui.css';
import Noty from 'noty';

import Scene from './objects/Scene';

import Constants from './constants';
import Interface from './interface';
import LevelManager from './levelManager';
import Stage from './stage';
import Utils from './utils';

import '../styles/index.css';
import 'codemirror/lib/codemirror.css';
import 'codemirror/theme/paraiso-dark.css';

const CURRENT_LEVEL = 1;

let codeMirror;
let animationTicker;
let brainTicker;

Noty.overrideDefaults({
  layout: 'center',
  theme: 'metroui',
  timeout: 3000,
});

/**
 * Updates the player's car with new information
 *
 * @author mauricio.araldi
 * @since 0.2.0
 */
function updatePlayer(car) {
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
      speedChange = Math.min(speedDiff, Constants.MAX_SPEED_CHANGE_PER_TICK);
    } else if (speedDiff < 0) {
      speedChange = Math.max(speedDiff, -Constants.MAX_SPEED_CHANGE_PER_TICK);
    }

    speed += speedChange;
  }

  realSpeed = speed * (speed / Constants.SPEED_RATIO);

  car.speed = speed;

  if (realSpeed && car.angle !== angleState) {
    const angleDiff = angleState - car.angle;
    let angleChange = null;

    if (angleDiff > 0) {
      angleChange = Math.min(angleDiff, Constants.MAX_ANGLE_CHANGE_PER_TICK);
    } else if (angleDiff < 0) {
      angleChange = Math.max(angleDiff, -Constants.MAX_ANGLE_CHANGE_PER_TICK);
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
 * Checks for collisions between objects
 *
 * @author mauricio.araldi
 * @since 0.2.0
 *
 * @param {GameObject[]} objects The objects to be checked
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
        collisions.push([objectA, objectB]);

        if (!checkAllCollisions) {
          return collisions[0];
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
 * @since 0.2.0
 *
 * @param {Scene} scene Current game scene
 * @param {Car} player The car of the player
 * @param {GameObject} ground The ground of the level
 * @param {GameObject[]} sceneObjects The current objects in the scene
 */
function animationTick(scene, player, sceneObjects, ground) {
  const highlightSensors = document.querySelectorAll('.sensor.active');
  let collisions = null;

  scene.clear();
  scene.draw([ground, ...sceneObjects, player]);

  updatePlayer(player);

  player.sensors = player.buildSensors();

  if (highlightSensors.length) {
    const ids = [];

    highlightSensors.forEach((sensor) => ids.push(parseInt(sensor.dataset.id, 10)));

    Stage.drawSensors(ids, player);
  }

  collisions = checkCollisions([...sceneObjects, player]);

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
 * @since 0.2.0
 *
 * @param {Car} player The car of the player
 * @param {GameOBject[]} sceneObjects The current objects in the scene
 * @return {Object} The new state of the player's car brain
 */
function brainTick(player, sceneObjects) {
  const brainCode = codeMirror.getValue();
  const carInstructions = { sensors: player.sensors };
  let newBrainState = null;

  player.updateSensors(sceneObjects);
  Interface.updateSensorsDisplay(player.sensors);

  eval.call({}, `(${brainCode})`)(carInstructions); // eslint-disable-line no-eval

  newBrainState = { ...player.brainState, ...carInstructions };

  newBrainState.angle = Math.min(newBrainState.angle, Constants.MAX_ANGLE);
  newBrainState.sensors = player.sensors;

  return newBrainState;
}

/**
 * Starts or stops the simulation
 *
 * @author mauricio.araldi
 * @since 0.2.0
 *
 * @param {Boolean} play If the simulation should be played
 */
function runSimulation(play) {
  const currentLevel = LevelManager.getLevel(CURRENT_LEVEL);
  const canvas = document.querySelector('canvas');
  const scene = new Scene(canvas);
  const { ground, objects, player } = currentLevel;

  if (play && !animationTicker) {
    animationTicker = setInterval(
      () => {
        animationTick(scene, player, objects, ground);
      },
      1000 / Constants.FRAMES_PER_SECOND,
    );

    brainTicker = setInterval(
      () => {
        player.brainState = brainTick(player, objects);
      },
      1000 / Constants.BRAIN_TICKS_PER_SECOND,
    );
  } else {
    clearInterval(animationTicker);
    clearInterval(brainTicker);

    animationTicker = null;
    brainTicker = null;

    animationTick(scene, player, objects, ground);
  }
}

/* Initial setup */
window.onload = () => {
  const canvas = document.querySelector('canvas');

  canvas.width = Constants.CANVAS_WIDTH;
  canvas.height = Constants.CANVAS_HEIGHT;

  Interface.createSensorInputs(Constants.SENSORS_QT);

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
  const code = Interface.loadCode();

  codeMirrorElement.style.height = `${codeMirrorHeight}px`;

  if (code) {
    codeMirror.setValue(code);
  } else {
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
  document.querySelector('#save').addEventListener('click', () => Interface.saveCode(codeMirror.getValue()));
  document.querySelector('#highlight-all-sensors').addEventListener('change', Interface.toggleHighlightSensors);

  document.querySelectorAll('.sensor-section').forEach((element) => {
    const input = element.querySelector('input');

    element.addEventListener('change', Interface.toggleHighlightSection);
    input.checked = false;
  });

  document.querySelector('#highlight-all-sensors').checked = false;
};
