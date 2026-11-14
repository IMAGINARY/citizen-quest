const InputMgr = require('./input-mgr');

/**
 * @typedef {object} GamepadMapperAxesConfig
 * @property {number} horizontal Index of the horizontal axis.
 * @property {number} vertical Index of the vertical axis.
 * @property {boolean} invertHorizontal Whether to invert the horizontal axis.
 * @property {boolean} invertVertical Whether to invert the vertical axis.
 */

/**
 * @typedef {object} GamepadMapperConfig
 * @property {GamepadMapperAxesConfig} [axes] Axes mapping.
 * @property {Object<string, number>} [buttons]
 *  Maps event names (see {@link InputMgr.eventNames}) to button indexes.
 */

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
   *    and movement along axis to event names. If the same event name is mapped to an axis and a
   *    button, the axis takes precedence.
   */
  constructor(config) {
    this.config = config;

    /**
     * List of pairs of event name and corresponding function to grab the actual value from the
     * gamepad while applying the mapping.
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
    // compute a singed axis index for each direction
    const horizontalFactor = config.axes.invertHorizontal ? -1 : 1;
    const verticalFactor = config.axes.invertVertical ? -1 : 1;
    const axesDirectionMap = {
      up: +config.axes.vertical * verticalFactor,
      down: -config.axes.vertical * verticalFactor,
      left: +config.axes.horizontal * horizontalFactor,
      right: -config.axes.horizontal * horizontalFactor,
    };
    const fromAxis = typeof axesDirectionMap[key] !== 'undefined'
      ? GamepadMapper.createGrabberForAxis(axesDirectionMap[key])
      : () => false;
    const fromButton = typeof config?.buttons?.[key] !== 'undefined'
      ? GamepadMapper.createGrabberForButton(config.buttons[key])
      : () => false;
    return (gamepad) => fromAxis(gamepad) || fromButton(gamepad);
  }

  /**
   * Create function for grabbing the value from a gamepad axis.
   *
   * TODO: Add support for a customizable axis threshold.
   *
   * @param {number} signedIndex The index of the axis. Negative values are interpreted as the
   *  negative axis (including +0 and -0).
   * @returns {(gamepad:Gamepad) => boolean}
   */
  static createGrabberForAxis(signedIndex) {
    const index = Math.abs(signedIndex);
    const threshold = 0.5;
    // the division is intentional to distinguish between positive and negative zero (IEEE 754)
    const sign = Math.sign(1.0 / signedIndex);
    return (gamepad) => sign * (gamepad.axes[index] ?? 0.0) >= threshold;
  }

  /**
   * Create function for grabbing the value from a gamepad button.
   *
   * @param {number} index The index of the button.
   * @returns {(gamepad:Gamepad) => boolean}
   */
  static createGrabberForButton(index) {
    return (gamepad) => gamepad.buttons[index]?.pressed ?? false;
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

module.exports = GamepadMapper;
