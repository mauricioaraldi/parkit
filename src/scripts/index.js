import CodeMirror from 'codemirror/lib/codemirror';
import 'codemirror/mode/javascript/javascript';
import 'noty/lib/noty.css';
import 'noty/lib/themes/metroui.css';
import Noty from 'noty';

import Scene from './objects/Scene';

import Constants from './constants';
import Interface from './interface';
import LevelManager from './levelManager';
import Stage from './stage';

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
 * Updates the animation
 *
 * @author mauricio.araldi
 * @since 0.2.0
 *
 * @param {Scene} scene Current game scene
 * @param {Level} level The current game level
 */
function animationTick(scene, level) {
  const {
    goalArea, ground, player, objects, limits, goalReachedAction,
  } = level;
  const highlightSensors = document.querySelectorAll('.sensor.active');
  let collisions = null;

  scene.clear();
  scene.draw([ground, ...objects, player]);
  scene.draw(goalArea, false);

  if (player.parkingBreak && level.checkGoal()) {
    runSimulation(false, false);

    goalReachedAction();

    return;
  }

  player.update();

  player.sensors = player.buildSensors();

  if (highlightSensors.length) {
    const ids = [];

    highlightSensors.forEach((sensor) => ids.push(parseInt(sensor.dataset.id, 10)));

    Stage.drawSensors(ids, player);
  }

  collisions = scene.checkCollisions([...objects, player, ...limits]);

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
 * @param {GameObject[]} limits The limits of the scenario
 * @return {Object} The new state of the player's car brain
 */
function brainTick(player, sceneObjects, limits) {
  const brainCode = codeMirror.getValue();
  const carInstructions = { sensors: player.sensors, memory: player.brainState.memory };
  let newBrainState = null;

  player.updateSensors([...sceneObjects, ...limits]);
  Interface.updateSensorsDisplay(player.sensors);

  eval.call({}, `(${brainCode})`)(carInstructions); // eslint-disable-line no-eval

  newBrainState = { ...player.brainState, ...carInstructions };

  newBrainState.angle = Math.min(newBrainState.angle, Constants.MAX_ANGLE);
  newBrainState.sensors = player.sensors;

  player.brainState = newBrainState;
  player.parkingBreak = newBrainState.parkingBreak;
}

/**
 * Starts or stops the simulation
 *
 * @author mauricio.araldi
 * @since 0.2.0
 *
 * @param {Boolean} play If the simulation should be played
 * @param {Boolean} reset If the game should be resetted
 */
  const currentLevel = LevelManager.getLevel(CURRENT_LEVEL);
  const canvas = document.querySelector('canvas');
  const scene = new Scene(canvas);
  const { objects, player, limits } = currentLevel;

  if (play && !animationTicker) {
    animationTicker = setInterval(
      () => animationTick(scene, currentLevel),
      1000 / Constants.FRAMES_PER_SECOND,
    );

    brainTicker = setInterval(
      () => brainTick(player, objects, limits),
      1000 / Constants.BRAIN_TICKS_PER_SECOND,
    );
  } else if (!play) {
    clearInterval(animationTicker);
    clearInterval(brainTicker);

    animationTicker = null;
    brainTicker = null;

    if (reset) {
      animationTick(scene, currentLevel);
    }
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
