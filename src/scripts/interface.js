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

export default {
  checkSensorsHighlighted,
  createSensorInputs,
  loadCode,
  saveCode,
  setHighlightSensor,
  toggleHighlightSection,
  toggleHighlightSensors,
  updateSensorsDisplay,
};
