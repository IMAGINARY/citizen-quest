const InputMgr = require('./input-mgr');

/**
 * @typedef {{axes?:{InputMgrEventNames:number},buttons?:{InputMgrEventNames:number}}} GamepadMapperConfig
 */

/**
 * Static gamepad configuration.
 * TODO: Make this configurable via the game config.
 *
 * @type {GamepadMapperConfig}
 */
const staticMapperConfig = {
  axes: {
    up: -1,
    down: 1,
    left: -0,
    right: 0,
  },
  buttons: {
    action: 1,
    lang: 9,
  },
};

/**
 * Handles gamepad and joystick input from the first available device.
 *
 * @augments InputMgr
 */
class GamepadInputMgr extends InputMgr {
  constructor() {
    super();
    this.mapper = new GamepadMapper(staticMapperConfig);
    this.gamepadIndex = -1;
    this.handleGamepadDisConnected = () => {
      const gamepad = navigator.getGamepads().find((g) => g !== null);
      if (typeof gamepad !== 'undefined') {
        console.log(`Using gamepad ${gamepad.index}: ${gamepad.id}`);
        this.gamepadIndex = gamepad.index;
      } else {
        console.log('No gamepad connected');
        this.gamepadIndex = -1;
      }
    };
  }

  attachListeners() {
    if (this.isListening()) return;
    window.addEventListener('gamepadconnected', this.handleGamepadDisConnected);
    window.addEventListener(
      'gamepaddisconnected',
      this.handleGamepadDisConnected
    );
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
    window.removeEventListener(
      'gamepaddisconnected',
      this.handleGamepadDisConnected
    );
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

/**
 * Maps gamepad and joystick input to events.
 *
 * Different gamepads and joysticks have different mappings of buttons and axes.
 * This class maps the input to the standard representation corresponding to the events emitted by
 * {@link GamepadInputMgr.events}.
 */
class GamepadMapper {
  /**
   * Initilize the mapper with a configuration.
   *
   * @param {GamepadMapperConfig} config The configuration for mapping button pressed
   *    and movement along axes to event names. If the same event name is mapped to an axis and a button, the axis takes
   *    precedence.
   */
  constructor(config) {
    this.config = config;

    /**
     * List of pairs of event name and corresponding function to grab the actual value from the gamepad while applying
     * the mapping.
     *
     * @private {[[string,(gamepad:Gamepad) => boolean]]}
     */
    this.grabbers = InputMgr.eventNames.map((e) => [
      e,
      GamepadMapper.createGrabberForConfigKey(config, e),
    ]);
  }

  /**
   * Create function for grabbing the actual value from the gamepad while applying
   * the mapping based on the internal config and the given event name.
   *
   * @param {GamepadMapperConfig} config The gamepad mapper configuration.
   * @param {string} key The event name.
   * @returns {(gamepad:Gamepad) => boolean}
   */
  static createGrabberForConfigKey(config, key) {
    const fromAxis =
      typeof config?.axes[key] !== 'undefined'
        ? GamepadMapper.createGrabberForAxis(config.axes[key])
        : () => false;
    const fromButton =
      typeof config?.buttons[key] !== 'undefined'
        ? GamepadMapper.createGrabberForButton(config.buttons[key])
        : () => false;
    return (gamepad) => fromAxis(gamepad) || fromButton(gamepad);
  }

  /**
   * Create function for grabbing the value from a gamepad axis.
   *
   * TODO: Add support for a customizable axis threshold.
   *
   * @param {number} signedIndex The index of the axis. Negative values are interpreted as the negative axis (including +0 and -0).
   * @returns {(gamepad:Gamepad) => boolean}
   */
  static createGrabberForAxis(signedIndex) {
    const index = Math.abs(signedIndex);
    const threshold = 0.5;
    // the division is intentional to distinguish between positive and negative zero (IEEE 754)
    const sign = Math.sign(1.0 / signedIndex);
    return (gamepad) => sign * gamepad.axes[index] >= threshold;
  }

  /**
   * Create function for grabbing the value from a gamepad button.
   *
   * @param {number} index The index of the button.
   * @returns {(gamepad:Gamepad) => boolean}
   */
  static createGrabberForButton(index) {
    return (gamepad) => gamepad.buttons[index].pressed;
  }

  /**
   *  Grab the input from the gamepad for all event names.
   *
   * @param {Gamepad} gamepad The gamepad to grab the input from. Must not be null.
   * @returns {InputMgrState}
   */
  grab(gamepad) {
    return /** @type {InputMgrState} */ Object.fromEntries(
      this.grabbers.map(([key, grabber]) => [key, grabber(gamepad)])
    );
  }
}

module.exports = GamepadInputMgr;
