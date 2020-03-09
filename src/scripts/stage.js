import Constants from './constants';

/**
 * Draws the sensors to show their ranges
 *
 * @author mauricio.araldi
 * @since 0.1.0
 *
 * @param {CanvasRenderingContext2D} ctx Canvas context do render content
 * @param {Number[]} sensorIds IDs of the sensors to be drawn
 * @param {Car} car The car with the sensors to be drawn
 */
function drawSensors(sensorIds, car) {
  const canvas = document.querySelector('canvas');
  const ctx = canvas.getContext('2d');
  ctx.strokeStyle = Constants.COLORS.sensor;
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

export default {
  drawSensors,
};
