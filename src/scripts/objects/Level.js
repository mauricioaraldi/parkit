/**
 * @class
 *
 * @param {Car} player The player's car
 * @param {GameObject[]} objects The objects which the player can collide
 * @param {Object} ground The ground layout
 * @param {GameObject} goalArea The goal area the player should reach
 * @param {GameObject[]} limits The limits of the level
 * @param {Function} goalReachedAction Action that executes as soon as goal is reached
 */
export default class Level {
  /**
   * @constructor
   *
   * @param {Car} player The player's car
   * @param {GameObject[]} objects The objects which the player can collide
   * @param {Object} ground The ground layout
   * @param {GameObject} goalArea The goal area the player should reach
   * @param {GameObject[]} limits The limits of the level
   * @param {Function} goalReachedAction Action that executes as soon as goal is reached
   */
  constructor(player, objects, ground, goalArea, limits, goalReachedAction) {
    this.player = player;
    this.objects = objects;
    this.ground = ground;
    this.goalArea = goalArea;
    this.limits = limits;
    this.goalReachedAction = goalReachedAction;
  }

  /**
   * Checks if the goal has been completed
   *
   * @author mauricio.araldi
   * @since 0.2.0
   *
   * @return {Boolean} If the goal has been met
   */
  checkGoal() {
    return this.player.testInsideAnotherObject(this.goalArea);
  }
}
