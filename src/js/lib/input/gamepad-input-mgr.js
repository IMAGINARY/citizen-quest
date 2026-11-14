const logger = require('loglevel');
const deepmerge = require('deepmerge');
const InputMgr = require('./input-mgr');
const GamepadMapper = require('./gamepad-mapper');

/**
 * @typedef {import('./gamepad-mapper').GamepadMapperConfig} GamepadMapperConfig
 */

/**
 * Selects which gamepad to use.
 *
 * - null: the first connected gamepad.
 * - integer: the gamepad whose Gamepad.index matches.
 * - string: the gamepad whose Gamepad.id matches.
 *
 * @typedef {number|string|null} GamepadSelector
 */

/**
 * Gamepad configuration for standard gamepads.
 *
 * @type {GamepadMapperConfig}
 */
const standardMapperConfig = {
  axes: {
    horizontal: 0,
    vertical: 1,
    invertHorizontal: false,
    invertVertical: false,
  },
  buttons: {
    up: 12,
    down: 13,
    left: 14,
    right: 15,
    action: 1,
    lang: 9,
  },
};

/**
 * Handles gamepad and joystick input from a single device.
 *
 * The device is chosen by a {@link GamepadSelector}. By default it is the
 * first available device.
 *
 * @augments InputMgr
 */
class GamepadInputMgr extends InputMgr {
  /**
   * @param {GamepadMapperConfig} [mapperConfig]
   * @param {GamepadSelector} [gamepadSelector]
   *  Which gamepad to use (see {@link GamepadSelector}). Defaults to the first
   *  connected gamepad.
   */
  constructor(mapperConfig = {}, gamepadSelector = null) {
    super();
    logger.info(
      mapperConfig,
      deepmerge(standardMapperConfig, mapperConfig ?? {})
    );
    this.mapper = new GamepadMapper(
      deepmerge(standardMapperConfig, mapperConfig ?? {})
    );
    this.gamepadSelector = gamepadSelector ?? null;
    if (this.gamepadSelector !== null
      && !Number.isInteger(this.gamepadSelector)
      && typeof this.gamepadSelector !== 'string') {
      logger.warn(`Invalid gamepad selector ${JSON.stringify(this.gamepadSelector)}. It must be an integer (index) or a string (id).`);
    }
    this.gamepadIndex = -1;
    // Stable reference so the same listener can be added and removed.
    this.handleGamepadConnectionChange = () => this.selectGamepad();
  }

  /**
   * Picks which connected gamepad to use, based on the configured selector.
   *
   * Called when listeners are attached and whenever a gamepad connects or
   * disconnects.
   */
  selectGamepad() {
    const gamepad = this.findConfiguredGamepad();
    if (typeof gamepad !== 'undefined') {
      logger.info(`Using gamepad ${gamepad.index}: ${gamepad.id}`);
      this.gamepadIndex = gamepad.index;
    } else {
      if (this.gamepadSelector === null) {
        logger.info('No gamepad connected');
      } else {
        logger.info(`Configured gamepad ${JSON.stringify(this.gamepadSelector)} not found`);
      }
      this.gamepadIndex = -1;
    }
  }

  /**
   * Finds the connected gamepad that matches the configured selector.
   *
   * @returns {Gamepad|undefined}
   *  The matching gamepad, or undefined if none matches.
   */
  findConfiguredGamepad() {
    const gamepads = navigator.getGamepads().filter((g) => g !== null);
    const selector = this.gamepadSelector;
    if (selector === null) {
      return gamepads[0];
    }
    if (Number.isInteger(selector)) {
      return gamepads.find((g) => g.index === selector);
    }
    if (typeof selector === 'string') {
      return gamepads.find((g) => g.id === selector);
    }
    return undefined;
  }

  attachListeners() {
    if (this.isListening()) return;

    // Pick from the already connected gamepads, if any.
    this.selectGamepad();

    // Attach listeners to handle future connects and disconnects.
    window.addEventListener('gamepadconnected', this.handleGamepadConnectionChange);
    window.addEventListener('gamepaddisconnected', this.handleGamepadConnectionChange);
    super.attachListeners();
    /**
     * TODO: Deal with SecurityError from missing gamepad permission.
     * TODO: Deal [missing secure context](https://github.com/w3c/gamepad/pull/120).
     * TODO: Handle browsers that don't support gamepads.
     * TODO: Emit warning when Gamepad API can not be used due the above reasons.
     */
  }

  detachListeners() {
    if (!this.isListening()) return;
    window.removeEventListener('gamepadconnected', this.handleGamepadConnectionChange);
    window.removeEventListener('gamepaddisconnected', this.handleGamepadConnectionChange);
    this.hasListenersAttached = false;
    this.gamepadIndex = -1;
    super.detachListeners();
  }

  updateState() {
    const gamepad = navigator.getGamepads()[this.gamepadIndex] ?? null;
    if (gamepad !== null && gamepad.connected) {
      const newState = this.mapper.grab(gamepad);
      Object.assign(this.state, newState);
    }
  }
}

module.exports = GamepadInputMgr;
