/**
 * @class
 *
 * @param {Car} player The player's car
 * @param {GameObject[]} objects The objects which the player can collide
 * @param {Object} ground The ground layout
 */
export default class Level {
  /**
   * @constructor
   *
   * @param {Car} player The player's car
   * @param {GameObject[]} objects The objects which the player can collide
   * @param {Object} ground The ground layout
   */
  constructor(player, objects, ground) {
    this.player = player;
    this.objects = objects;
    this.ground = ground;
  }
}
