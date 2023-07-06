const InputMgr = require('./input-mgr');

/**
 * Combines input from multiple input managers into one.
 *
 * The lifecycle management and updating of the wrapped input managers is up to the user of this class.
 *
 * @augments InputMgr
 */
class MultiplexInputMgr extends InputMgr {
  constructor(...inputMgrs) {
    super();
    this.inputMgrs = [];
    inputMgrs.forEach((inputMgr) => this.addInputMgr(inputMgr));
  }

  /**
   * Add an input manager to the multiplexer.
   *
   * @param {InputMgr} inputMgr
   */
  addInputMgr(inputMgr) {
    this.inputMgrs.push(inputMgr);
  }

  /**
   * Remove an input manager from the multiplexer.
   *
   * @param {InputMgr} inputMgr
   */
  removeInputMgr(inputMgr) {
    const inputMgrIndex = this.inputMgrs.indexOf(inputMgr);
    if (inputMgrIndex >= 0) {
      this.inputMgrs.splice(inputMgrIndex, 1);
    }
  }

  updateState() {
    const newState = this.inputMgrs
      .map((inputMgr) => inputMgr.getState())
      .reduce((acc, state) => {
        InputMgr.eventNames.forEach((eventName) => {
          acc[eventName] ||= state[eventName];
        });
        return acc;
      }, InputMgr.getInitialState());
    Object.assign(this.state, newState);
  }
}

module.exports = MultiplexInputMgr;
