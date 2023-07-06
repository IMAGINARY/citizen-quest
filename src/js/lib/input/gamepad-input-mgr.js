const EventEmitter = require('events');

/**
 * Handles Gamepad input
 */
/**
 * @event GamepadInputMgr.events#up
 *
 * @event GamepadInputMgr.events#down
 *
 * @event GamepadInputMgr.events#left
 *
 * @event GamepadInputMgr.events#right
 *
 * @event GamepadInputMgr.events#action
 *
 * @event GamepadInputMgr.events#lang
 */
class GamepadInputMgr {
  constructor(config) {
    this.config = config;
    this.events = new EventEmitter();
  }

  getDirection() {
    return {
      x: 0,
      y: 0,
      action: false,
      lang: false,
    };
  }

  /**
   * Read the gamepad input and emit events
   */
  update() {}
}

module.exports = GamepadInputMgr;
