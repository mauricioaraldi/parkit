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
  ctx.fillRect(0, 0, '100%', '100%');
}

window.onload = () => {
  const CANVAS_WIDTH = window.innerWidth;
  const CANVAS_HEIGHT = 200;

  const canvas = document.querySelector('canvas');
  const ctx = canvas.getContext('2d');

  canvas.width = CANVAS_WIDTH;
  canvas.height = CANVAS_HEIGHT;

  drawAsphalt(ctx);
};
