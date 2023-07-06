const InputMgr = require('./input-mgr');

const codeToEventName = {
  ArrowLeft: 'left',
  ArrowUp: 'up',
  ArrowRight: 'right',
  ArrowDown: 'down',
  Space: 'action',
  KeyL: 'lang',
};

/**
 * Handles keyboard input.
 *
 * @augments InputMgr
 */
class KeyboardInputMgr extends InputMgr {
  constructor() {
    super();
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleKeyUp = this.handleKeyUp.bind(this);
    /**
     * The internal state is used to track keydown events and is pushed to the superclass state as a whole via
     * {@link updateState()}.
     */
    this.internalState = { ...this.state };
    this.toggles = {};
  }

  attachListeners() {
    if (this.isListening()) return;
    super.attachListeners();
    $(document).on('keydown', this.handleKeyDown);
    $(document).on('keyup', this.handleKeyUp);
  }

  detachListeners() {
    if (!this.isListening()) return;
    $(document).off('keydown', this.handleKeyDown);
    $(document).off('keyup', this.handleKeyUp);
    super.detachListeners();
  }

  handleKeyDown(event) {
    // Ignore repeated keydown events
    if (event.originalEvent.repeat) {
      return;
    }

    // Process keys that have an event name assigned
    if (typeof codeToEventName[event.code] !== 'undefined') {
      const eventName = codeToEventName[event.code];
      this.internalState[eventName] = true;
    }

    // Process toggles separately
    if (this.toggles[event.code]) {
      this.toggles[event.code]();
    }
  }

  handleKeyUp(event) {
    if (typeof codeToEventName[event.code] !== 'undefined') {
      const eventName = codeToEventName[event.code];
      this.internalState[eventName] = false;
    }
  }

  addToggle(code, callback) {
    this.toggles[code] = callback;
  }

  updateState() {
    Object.assign(this.state, this.internalState);
  }
}

module.exports = KeyboardInputMgr;
