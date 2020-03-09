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

export default {
  degreesToRadians,
};
