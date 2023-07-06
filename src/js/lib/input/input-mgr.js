const EventEmitter = require('events');

/**
 * Type of the {@link eventNames} list.
 *
 * @typedef {["up", "down", "left", "right", "action", "lang"]} InputMgrEventNames
 */

/**
 * @typedef {{"up": boolean, "down": boolean, "left": boolean, "right": boolean, "action": boolean, "lang": boolean}} InputMgrState
 */

/**
 * Return type of {@link InputMgr#getDirection}.
 * @typedef { x: number, y: number, action: boolean, lang: boolean } InputMgrDirection
 */

/**
 * Up button event.
 *
 * @event InputMgr.events#up
 */

/**
 * Down button event.
 *
 * @event InputMgr.events#down
 */

/**
 * Left button event.
 *
 * @event InputMgr.events#left
 */

/**
 * Right button event.
 *
 * @event InputMgr.events#right
 */

/**
 * Action button event.
 *
 * @event InputMgr.events#action
 */

/**
 * Language button event.
 *
 * @event InputMgr.events#lang
 */

/**
 * Superclass for handling input.
 */
class InputMgr {
  /**
   * Names of events emitted by the gamepad input manager.
   * These identical to the fields in the gamepad mapper configuration.
   *
   * @type {InputMgrEventNames}
   */
  static eventNames = ['up', 'down', 'left', 'right', 'action', 'lang'];

  constructor() {
    this.events = new EventEmitter();
    this.state = InputMgr.getInitialState();
    this.hasListenersAttached = false;
  }

  /**
   * Tell if the input manager is listening to input, i.e. if the listeners are attached.
   *
   * @returns {boolean}
   */
  isListening() {
    return this.hasListenersAttached;
  }

  /**
   * Attach listeners to the input source.
   *
   * The {@link InputMgr#update} method will not fire events if the listeners are not attached.
   */
  attachListeners() {
    this.hasListenersAttached = true;
  }

  /**
   * Detach listeners from the input source.
   *
   * The {@link InputMgr#update} method will not fire events if the listeners are not attached.
   */
  detachListeners() {
    this.hasListenersAttached = false;
  }

  /**
   * Transform the input state into directional information.
   *
   * @returns {InputMgrDirection}
   */
  getDirection() {
    return {
      x: (this.state.right ? 1 : 0) - (this.state.left ? 1 : 0),
      y: (this.state.down ? 1 : 0) - (this.state.up ? 1 : 0),
      action: this.state.action,
      lang: this.state.lang,
    };
  }

  /**
   * Get the initial state of the input manager, i.e. all buttons are released.
   *
   * @returns {InputMgrState}
   */
  static getInitialState() {
    return /** @type {InputMgrState} */ Object.fromEntries(
      InputMgr.eventNames.map((e) => [e, false])
    );
  }

  /**
   * Get the current state of the input manager.
   *
   * @returns {InputMgrState}
   */
  getState() {
    return this.state;
  }

  /**
   * Update the internal state of the input manager.
   *
   * This method is called by {@link InputMgr#update} and needs to be implemented by subclasses.
   *
   * @abstract
   * @protected
   */
  updateState() {
    throw new Error('Not implemented. Must be implemented by subclass!');
  }

  /**
   * Read the input and emit events.
   *
   * This method does nothing if the listeners are not attached.
   *
   * @fires InputMgr.events#up
   * @fires InputMgr.events#down
   * @fires InputMgr.events#left
   * @fires InputMgr.events#right
   * @fires InputMgr.events#action
   * @fires InputMgr.events#lang
   */
  update() {
    if (!this.isListening()) return;

    const prevState = { ...this.getState() };
    this.updateState();
    const eventsToFire = InputMgr.eventNames.filter(
      (n) => !prevState[n] && this.state[n]
    );
    eventsToFire.forEach((n) => this.events.emit(n));
  }
}

module.exports = InputMgr;
