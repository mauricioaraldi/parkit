import Constants from './constants';

/**
 * Updates the interface display of sensors
 *
 * @author mauricio.araldi
 * @since 0.2.0
 *
 * @param {Sensor[]} The sensors of the car
 */
function updateSensorsDisplay(sensors) {
  Object.keys(sensors).forEach((key) => {
    const sensorEl = document.querySelector(`#sensor${key}`);
    sensorEl.value = sensors[key].reading;
  });
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
  const sensorsQtPerSection = Constants.SENSORS_QT / sections.length;
  const highlightAllCheckbox = document.querySelector('#highlight-all-sensors');

  sections.forEach((section) => {
    const sectionActiveSensors = section.querySelectorAll('.sensor.active');
    const input = section.querySelector('input');

    input.checked = sectionActiveSensors.length === sensorsQtPerSection;
  });

  highlightAllCheckbox.checked = activeSensors.length === Constants.SENSORS_QT;
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
 * Saves user's code in localStorage
 *
 * @author mauricio.araldi
 * @since 0.1.0
 *
 * @param {String} code The code to be saved
 * @return {Boolean} If the code is saved
 */
function saveCode(code) {
  if (!code) {
    return false;
  }

  localStorage.setItem(Constants.LS_CODE_KEY, code);

  return true;
}

/**
 * Loads user's code from localStorage
 *
 * @author mauricio.araldi
 * @since 0.1.0
 *
 * @return {String} User's code
 */
function loadCode() {
  const code = localStorage.getItem(Constants.LS_CODE_KEY);

  if (!code) {
    return null;
  }

  return code;
}

/**
 * Toggles the minimize of the sensors menu, changing the text of the button
 *
 * @author mauricio.araldi
 * @since 0.4.0
 */
function toggleSensorsMinimize() {
  const body = document.querySelector('body');
  const minimizeButton = document.querySelector('#minimize');
  const menu = document.querySelector('#menu');

  if (minimizeButton.innerHTML === '-') {
    minimizeButton.innerHTML = '+';
  } else {
    minimizeButton.innerHTML = '-';
  }

  menu.classList.toggle('minimized');

  minimizeButton.setAttribute('disabled', true);
  body.classList.add('no-scroll');
  updateCodeEditorHeight(1500);

  setTimeout(() => {
    updateCodeEditorHeight();
    body.classList.remove('no-scroll');
    minimizeButton.removeAttribute('disabled');
  }, 300);
}

/**
 * Updates the height of the code editor
 *
 * @author mauricio.araldi
 * @since 0.4.0
 *
 * @param {Number} [forceHeight] The height to be used. If not supplied, is auto detected based
 * on window height
 */
function updateCodeEditorHeight(forceHeight) {
  const codeMirrorElement = document.querySelector('.CodeMirror');
  let codeMirrorHeight = forceHeight;
  let codeMirrorTop;

  if (!codeMirrorHeight) {
    codeMirrorTop = codeMirrorElement.getClientRects()[0].top;
    codeMirrorHeight = window.innerHeight - codeMirrorTop;
  }

  codeMirrorElement.style.height = `${codeMirrorHeight}px`;
}

/**
 * Changes the font-size of the code editor
 *
 * @author mauricio.araldi
 * @since 0.4.0
 *
 * @param {Boolean} [enlarge] Makes the font larger. If false, makes the font smaller
 * @param {Number} [forceSize] Forces a specific font size in the editor
 */
function setCodeEditorFontSize(enlarge, forceSize) {
  const codeMirrorElement = document.querySelector('.CodeMirror');

  if (forceSize) {
    codeMirrorElement.style.fontSize = `${forceSize}px`;
  }

  const FONT_SIZE_STEP = 2;
  let fontSize = parseInt(codeMirrorElement.style.fontSize, 10) || 16;

  if (enlarge) {
    fontSize += FONT_SIZE_STEP;
  } else {
    fontSize -= FONT_SIZE_STEP;
  }

  codeMirrorElement.style.fontSize = `${fontSize}px`;
}

export default {
  checkSensorsHighlighted,
  createSensorInputs,
  loadCode,
  saveCode,
  setCodeEditorFontSize,
  setHighlightSensor,
  toggleHighlightSection,
  toggleHighlightSensors,
  toggleSensorsMinimize,
  updateCodeEditorHeight,
  updateSensorsDisplay,
};
