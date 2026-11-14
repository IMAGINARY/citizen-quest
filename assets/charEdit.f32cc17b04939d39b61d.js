/******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ "./node_modules/events/events.js":
/*!***************************************!*\
  !*** ./node_modules/events/events.js ***!
  \***************************************/
/***/ ((module) => {

"use strict";
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.



var R = typeof Reflect === 'object' ? Reflect : null
var ReflectApply = R && typeof R.apply === 'function'
  ? R.apply
  : function ReflectApply(target, receiver, args) {
    return Function.prototype.apply.call(target, receiver, args);
  }

var ReflectOwnKeys
if (R && typeof R.ownKeys === 'function') {
  ReflectOwnKeys = R.ownKeys
} else if (Object.getOwnPropertySymbols) {
  ReflectOwnKeys = function ReflectOwnKeys(target) {
    return Object.getOwnPropertyNames(target)
      .concat(Object.getOwnPropertySymbols(target));
  };
} else {
  ReflectOwnKeys = function ReflectOwnKeys(target) {
    return Object.getOwnPropertyNames(target);
  };
}

function ProcessEmitWarning(warning) {
  if (console && console.warn) console.warn(warning);
}

var NumberIsNaN = Number.isNaN || function NumberIsNaN(value) {
  return value !== value;
}

function EventEmitter() {
  EventEmitter.init.call(this);
}
module.exports = EventEmitter;
module.exports.once = once;

// Backwards-compat with node 0.10.x
EventEmitter.EventEmitter = EventEmitter;

EventEmitter.prototype._events = undefined;
EventEmitter.prototype._eventsCount = 0;
EventEmitter.prototype._maxListeners = undefined;

// By default EventEmitters will print a warning if more than 10 listeners are
// added to it. This is a useful default which helps finding memory leaks.
var defaultMaxListeners = 10;

function checkListener(listener) {
  if (typeof listener !== 'function') {
    throw new TypeError('The "listener" argument must be of type Function. Received type ' + typeof listener);
  }
}

Object.defineProperty(EventEmitter, 'defaultMaxListeners', {
  enumerable: true,
  get: function() {
    return defaultMaxListeners;
  },
  set: function(arg) {
    if (typeof arg !== 'number' || arg < 0 || NumberIsNaN(arg)) {
      throw new RangeError('The value of "defaultMaxListeners" is out of range. It must be a non-negative number. Received ' + arg + '.');
    }
    defaultMaxListeners = arg;
  }
});

EventEmitter.init = function() {

  if (this._events === undefined ||
      this._events === Object.getPrototypeOf(this)._events) {
    this._events = Object.create(null);
    this._eventsCount = 0;
  }

  this._maxListeners = this._maxListeners || undefined;
};

// Obviously not all Emitters should be limited to 10. This function allows
// that to be increased. Set to zero for unlimited.
EventEmitter.prototype.setMaxListeners = function setMaxListeners(n) {
  if (typeof n !== 'number' || n < 0 || NumberIsNaN(n)) {
    throw new RangeError('The value of "n" is out of range. It must be a non-negative number. Received ' + n + '.');
  }
  this._maxListeners = n;
  return this;
};

function _getMaxListeners(that) {
  if (that._maxListeners === undefined)
    return EventEmitter.defaultMaxListeners;
  return that._maxListeners;
}

EventEmitter.prototype.getMaxListeners = function getMaxListeners() {
  return _getMaxListeners(this);
};

EventEmitter.prototype.emit = function emit(type) {
  var args = [];
  for (var i = 1; i < arguments.length; i++) args.push(arguments[i]);
  var doError = (type === 'error');

  var events = this._events;
  if (events !== undefined)
    doError = (doError && events.error === undefined);
  else if (!doError)
    return false;

  // If there is no 'error' event listener then throw.
  if (doError) {
    var er;
    if (args.length > 0)
      er = args[0];
    if (er instanceof Error) {
      // Note: The comments on the `throw` lines are intentional, they show
      // up in Node's output if this results in an unhandled exception.
      throw er; // Unhandled 'error' event
    }
    // At least give some kind of context to the user
    var err = new Error('Unhandled error.' + (er ? ' (' + er.message + ')' : ''));
    err.context = er;
    throw err; // Unhandled 'error' event
  }

  var handler = events[type];

  if (handler === undefined)
    return false;

  if (typeof handler === 'function') {
    ReflectApply(handler, this, args);
  } else {
    var len = handler.length;
    var listeners = arrayClone(handler, len);
    for (var i = 0; i < len; ++i)
      ReflectApply(listeners[i], this, args);
  }

  return true;
};

function _addListener(target, type, listener, prepend) {
  var m;
  var events;
  var existing;

  checkListener(listener);

  events = target._events;
  if (events === undefined) {
    events = target._events = Object.create(null);
    target._eventsCount = 0;
  } else {
    // To avoid recursion in the case that type === "newListener"! Before
    // adding it to the listeners, first emit "newListener".
    if (events.newListener !== undefined) {
      target.emit('newListener', type,
                  listener.listener ? listener.listener : listener);

      // Re-assign `events` because a newListener handler could have caused the
      // this._events to be assigned to a new object
      events = target._events;
    }
    existing = events[type];
  }

  if (existing === undefined) {
    // Optimize the case of one listener. Don't need the extra array object.
    existing = events[type] = listener;
    ++target._eventsCount;
  } else {
    if (typeof existing === 'function') {
      // Adding the second element, need to change to array.
      existing = events[type] =
        prepend ? [listener, existing] : [existing, listener];
      // If we've already got an array, just append.
    } else if (prepend) {
      existing.unshift(listener);
    } else {
      existing.push(listener);
    }

    // Check for listener leak
    m = _getMaxListeners(target);
    if (m > 0 && existing.length > m && !existing.warned) {
      existing.warned = true;
      // No error code for this since it is a Warning
      // eslint-disable-next-line no-restricted-syntax
      var w = new Error('Possible EventEmitter memory leak detected. ' +
                          existing.length + ' ' + String(type) + ' listeners ' +
                          'added. Use emitter.setMaxListeners() to ' +
                          'increase limit');
      w.name = 'MaxListenersExceededWarning';
      w.emitter = target;
      w.type = type;
      w.count = existing.length;
      ProcessEmitWarning(w);
    }
  }

  return target;
}

EventEmitter.prototype.addListener = function addListener(type, listener) {
  return _addListener(this, type, listener, false);
};

EventEmitter.prototype.on = EventEmitter.prototype.addListener;

EventEmitter.prototype.prependListener =
    function prependListener(type, listener) {
      return _addListener(this, type, listener, true);
    };

function onceWrapper() {
  if (!this.fired) {
    this.target.removeListener(this.type, this.wrapFn);
    this.fired = true;
    if (arguments.length === 0)
      return this.listener.call(this.target);
    return this.listener.apply(this.target, arguments);
  }
}

function _onceWrap(target, type, listener) {
  var state = { fired: false, wrapFn: undefined, target: target, type: type, listener: listener };
  var wrapped = onceWrapper.bind(state);
  wrapped.listener = listener;
  state.wrapFn = wrapped;
  return wrapped;
}

EventEmitter.prototype.once = function once(type, listener) {
  checkListener(listener);
  this.on(type, _onceWrap(this, type, listener));
  return this;
};

EventEmitter.prototype.prependOnceListener =
    function prependOnceListener(type, listener) {
      checkListener(listener);
      this.prependListener(type, _onceWrap(this, type, listener));
      return this;
    };

// Emits a 'removeListener' event if and only if the listener was removed.
EventEmitter.prototype.removeListener =
    function removeListener(type, listener) {
      var list, events, position, i, originalListener;

      checkListener(listener);

      events = this._events;
      if (events === undefined)
        return this;

      list = events[type];
      if (list === undefined)
        return this;

      if (list === listener || list.listener === listener) {
        if (--this._eventsCount === 0)
          this._events = Object.create(null);
        else {
          delete events[type];
          if (events.removeListener)
            this.emit('removeListener', type, list.listener || listener);
        }
      } else if (typeof list !== 'function') {
        position = -1;

        for (i = list.length - 1; i >= 0; i--) {
          if (list[i] === listener || list[i].listener === listener) {
            originalListener = list[i].listener;
            position = i;
            break;
          }
        }

        if (position < 0)
          return this;

        if (position === 0)
          list.shift();
        else {
          spliceOne(list, position);
        }

        if (list.length === 1)
          events[type] = list[0];

        if (events.removeListener !== undefined)
          this.emit('removeListener', type, originalListener || listener);
      }

      return this;
    };

EventEmitter.prototype.off = EventEmitter.prototype.removeListener;

EventEmitter.prototype.removeAllListeners =
    function removeAllListeners(type) {
      var listeners, events, i;

      events = this._events;
      if (events === undefined)
        return this;

      // not listening for removeListener, no need to emit
      if (events.removeListener === undefined) {
        if (arguments.length === 0) {
          this._events = Object.create(null);
          this._eventsCount = 0;
        } else if (events[type] !== undefined) {
          if (--this._eventsCount === 0)
            this._events = Object.create(null);
          else
            delete events[type];
        }
        return this;
      }

      // emit removeListener for all listeners on all events
      if (arguments.length === 0) {
        var keys = Object.keys(events);
        var key;
        for (i = 0; i < keys.length; ++i) {
          key = keys[i];
          if (key === 'removeListener') continue;
          this.removeAllListeners(key);
        }
        this.removeAllListeners('removeListener');
        this._events = Object.create(null);
        this._eventsCount = 0;
        return this;
      }

      listeners = events[type];

      if (typeof listeners === 'function') {
        this.removeListener(type, listeners);
      } else if (listeners !== undefined) {
        // LIFO order
        for (i = listeners.length - 1; i >= 0; i--) {
          this.removeListener(type, listeners[i]);
        }
      }

      return this;
    };

function _listeners(target, type, unwrap) {
  var events = target._events;

  if (events === undefined)
    return [];

  var evlistener = events[type];
  if (evlistener === undefined)
    return [];

  if (typeof evlistener === 'function')
    return unwrap ? [evlistener.listener || evlistener] : [evlistener];

  return unwrap ?
    unwrapListeners(evlistener) : arrayClone(evlistener, evlistener.length);
}

EventEmitter.prototype.listeners = function listeners(type) {
  return _listeners(this, type, true);
};

EventEmitter.prototype.rawListeners = function rawListeners(type) {
  return _listeners(this, type, false);
};

EventEmitter.listenerCount = function(emitter, type) {
  if (typeof emitter.listenerCount === 'function') {
    return emitter.listenerCount(type);
  } else {
    return listenerCount.call(emitter, type);
  }
};

EventEmitter.prototype.listenerCount = listenerCount;
function listenerCount(type) {
  var events = this._events;

  if (events !== undefined) {
    var evlistener = events[type];

    if (typeof evlistener === 'function') {
      return 1;
    } else if (evlistener !== undefined) {
      return evlistener.length;
    }
  }

  return 0;
}

EventEmitter.prototype.eventNames = function eventNames() {
  return this._eventsCount > 0 ? ReflectOwnKeys(this._events) : [];
};

function arrayClone(arr, n) {
  var copy = new Array(n);
  for (var i = 0; i < n; ++i)
    copy[i] = arr[i];
  return copy;
}

function spliceOne(list, index) {
  for (; index + 1 < list.length; index++)
    list[index] = list[index + 1];
  list.pop();
}

function unwrapListeners(arr) {
  var ret = new Array(arr.length);
  for (var i = 0; i < ret.length; ++i) {
    ret[i] = arr[i].listener || arr[i];
  }
  return ret;
}

function once(emitter, name) {
  return new Promise(function (resolve, reject) {
    function errorListener(err) {
      emitter.removeListener(name, resolver);
      reject(err);
    }

    function resolver() {
      if (typeof emitter.removeListener === 'function') {
        emitter.removeListener('error', errorListener);
      }
      resolve([].slice.call(arguments));
    };

    eventTargetAgnosticAddListener(emitter, name, resolver, { once: true });
    if (name !== 'error') {
      addErrorHandlerIfEventEmitter(emitter, errorListener, { once: true });
    }
  });
}

function addErrorHandlerIfEventEmitter(emitter, handler, flags) {
  if (typeof emitter.on === 'function') {
    eventTargetAgnosticAddListener(emitter, 'error', handler, flags);
  }
}

function eventTargetAgnosticAddListener(emitter, name, listener, flags) {
  if (typeof emitter.on === 'function') {
    if (flags.once) {
      emitter.once(name, listener);
    } else {
      emitter.on(name, listener);
    }
  } else if (typeof emitter.addEventListener === 'function') {
    // EventTarget does not have `error` event semantics like Node
    // EventEmitters, we do not listen for `error` events here.
    emitter.addEventListener(name, function wrapListener(arg) {
      // IE does not have builtin `{ once: true }` support so we
      // have to do it manually.
      if (flags.once) {
        emitter.removeEventListener(name, wrapListener);
      }
      listener(arg);
    });
  } else {
    throw new TypeError('The "emitter" argument must be of type EventEmitter. Received type ' + typeof emitter);
  }
}


/***/ }),

/***/ "./src/sass/default.scss":
/*!*******************************!*\
  !*** ./src/sass/default.scss ***!
  \*******************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
// extracted by mini-css-extract-plugin


/***/ }),

/***/ "./src/js/lib/app/char-edit-app.js":
/*!*****************************************!*\
  !*** ./src/js/lib/app/char-edit-app.js ***!
  \*****************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

/* globals PIXI */
const CharEditView = __webpack_require__(/*! ../view-pixi/char-edit-view */ "./src/js/lib/view-pixi/char-edit-view.js");
const KeyboardInputMgr = __webpack_require__(/*! ../input/keyboard-input-mgr */ "./src/js/lib/input/keyboard-input-mgr.js");

const viewPaneWidth = 400;
const viewPaneHeight = 400;
const viewPaneBgColor = 0xe3d0c2;

class CharEditApp {
  constructor(config, textures) {
    this.config = config;
    this.textures = textures;

    // HTML elements
    this.$element = $('<div></div>')
      .addClass('char-edit-app');

    this.$pixiWrapper = $('<div></div>')
      .addClass('pixi-wrapper')
      .appendTo(this.$element);

    // PIXI
    this.pixiApp = new PIXI.Application({
      width: viewPaneWidth,
      height: viewPaneHeight,
      backgroundColor: viewPaneBgColor,
    });
    this.$pixiWrapper.append(this.pixiApp.view);

    this.charEditView = new CharEditView(
      this.config,
      this.textures,
      this.pixiApp,
      viewPaneWidth,
      viewPaneHeight
    );
    this.pixiApp.stage.addChild(this.charEditView.getDisplay());

    this.inputMgr = this.createInputMgr();

    // Game loop
    const lastDirection = { x: 0, y: 0 };
    let lastMoving = false;
    this.pixiApp.ticker.add((time) => {
      this.inputMgr.update();
      const { x, y } = this.inputMgr.getDirection();
      const isMoving = x || y;
      if (isMoving && (x !== lastDirection.x || y !== lastDirection.y || !lastMoving)) {
        this.charEditView.setAction('w', x, y);
        lastDirection.x = x;
        lastDirection.y = y;
        lastMoving = true;
      } else if (lastMoving && !isMoving) {
        this.charEditView.setAction('s', lastDirection.x, lastDirection.y);
        lastMoving = false;
      }
    });
  }

  // eslint-disable-next-line class-methods-use-this
  createInputMgr() {
    const keyboardInputMgr = new KeyboardInputMgr();
    keyboardInputMgr.attachListeners();
    return keyboardInputMgr;
  }
}

module.exports = CharEditApp;


/***/ }),

/***/ "./src/js/lib/helpers-client/fetch-textures.js":
/*!*****************************************************!*\
  !*** ./src/js/lib/helpers-client/fetch-textures.js ***!
  \*****************************************************/
/***/ ((module) => {

/* globals PIXI */

async function fetchTextures(basePath, manifest, bundle) {
  PIXI.Assets.resolver.setDefaultSearchParams({
    t: Date.now(), // Cache buster
  });
  await PIXI.Assets.init({
    basePath,
    manifest,
  });
  return PIXI.Assets.loadBundle(bundle);
}

module.exports = fetchTextures;


/***/ }),

/***/ "./src/js/lib/helpers-web/show-fatal-error.js":
/*!****************************************************!*\
  !*** ./src/js/lib/helpers-web/show-fatal-error.js ***!
  \****************************************************/
/***/ ((module) => {

function showFatalError(text, error) {
  $('<div></div>')
    .addClass('fatal-error')
    .append($('<div></div>')
      .addClass('fatal-error-text')
      .html(text))
    .append($('<div></div>')
      .addClass('fatal-error-details')
      .html(error.message))
    .appendTo('body');

  $('html').addClass('with-fatal-error');
}

module.exports = showFatalError;


/***/ }),

/***/ "./src/js/lib/input/input-mgr.js":
/*!***************************************!*\
  !*** ./src/js/lib/input/input-mgr.js ***!
  \***************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

const EventEmitter = __webpack_require__(/*! events */ "./node_modules/events/events.js");

/**
 * Type of the {@link eventNames} list.
 *
 * @typedef {["up", "down", "left", "right", "action", "lang"]} InputMgrEventNames
 */

/**
 * @typedef {{
 *  "up": boolean,
 *  "down": boolean,
 *  "left": boolean,
 *  "right": boolean,
 *  "action": boolean,
 *  "lang": boolean
 *  }} InputMgrState
 */

/**
 * Return type of {@link InputMgr#getDirection}.
 * @typedef {{x: number, y: number, action: boolean, lang: boolean}} InputMgrDirection
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
   * Transform the input stateHandler into directional information.
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
   * Get the initial stateHandler of the input manager, i.e. all buttons are released.
   *
   * @returns {InputMgrState}
   */
  static getInitialState() {
    return /** @type {InputMgrState} */ Object.fromEntries(
      InputMgr.eventNames.map((e) => [e, false])
    );
  }

  /**
   * Get the current stateHandler of the input manager.
   *
   * @returns {InputMgrState}
   */
  getState() {
    return this.state;
  }

  /**
   * Update the internal stateHandler of the input manager.
   *
   * This method is called by {@link InputMgr#update} and needs to be implemented by subclasses.
   *
   * @abstract
   * @protected
   */
  // eslint-disable-next-line class-methods-use-this
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

InputMgr.eventNames = ['up', 'down', 'left', 'right', 'action', 'lang'];

module.exports = InputMgr;


/***/ }),

/***/ "./src/js/lib/input/keyboard-input-mgr.js":
/*!************************************************!*\
  !*** ./src/js/lib/input/keyboard-input-mgr.js ***!
  \************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

const InputMgr = __webpack_require__(/*! ./input-mgr */ "./src/js/lib/input/input-mgr.js");

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
     * The internal stateHandler is used to track keydown events and is pushed to the superclass
     * stateHandler as a whole via
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


/***/ }),

/***/ "./src/js/lib/view-pixi/char-edit-view.js":
/*!************************************************!*\
  !*** ./src/js/lib/view-pixi/char-edit-view.js ***!
  \************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

/* globals PIXI */

const MarionetteView = __webpack_require__(/*! ./marionette-view */ "./src/js/lib/view-pixi/marionette-view.js");

class CharEditView {
  constructor(config, textures, pixiApp, width, height) {
    this.config = config;
    this.textures = textures;
    this.pixiApp = pixiApp;

    this.display = new PIXI.Container();

    this.marionette = new MarionetteView(this.textures);
    this.display.addChild(this.marionette.getDisplay());
    this.marionette.getDisplay().position.set(width / 2, height * 0.8);
  }

  getDisplay() {
    return this.display;
  }

  setAction(action, x, y) {
    this.marionette.setAction(action, x, y);
  }
}

module.exports = CharEditView;


/***/ }),

/***/ "./src/js/lib/view-pixi/marionette-view.js":
/*!*************************************************!*\
  !*** ./src/js/lib/view-pixi/marionette-view.js ***!
  \*************************************************/
/***/ ((module) => {

/* globals PIXI */

const HIP_OFFSET = -6;
const NECK_OFFSET = 2;
const SHOULDER_OFFSET_Y = -15;
const SHOULDER_OFFSET_X = -3;
const SHOULDER_SIDE_FRONT_OFFSET = 12;
const SHOULDER_SIDE_BACK_OFFSET = 8;

const BOBBING_FACTOR = [0, -1, 0, 1, 0, -1, 0, 1];
const BOBBING_HEAD_OFFSET = 3;
const BOBBING_TORSO_OFFSET = 2;

class MarionetteView {
  constructor(textures) {
    this.textures = textures['sprites-char'].textures;
    this.animations = textures['sprites-char'].animations;
    this.initAnimations();

    this.display = new PIXI.Container();
    this.currentAction = 's';
    this.currentDirection = 's';

    const legsHeight = this.textures['legs-fro-q'].height;
    const torsoHeight = this.textures['torso-yellow'].height;
    const torsoWidth = this.textures['torso-yellow'].width;

    this.metrics = {
      hips: legsHeight + HIP_OFFSET,
      shoulders: {
        x: torsoWidth / 2 + SHOULDER_OFFSET_X,
        y: legsHeight + HIP_OFFSET + torsoHeight + SHOULDER_OFFSET_Y,
      },
      neck: legsHeight + HIP_OFFSET + torsoHeight + NECK_OFFSET,
    };

    this.shadow = new PIXI.AnimatedSprite([this.textures['shadow-char']]);
    this.shadow.anchor.set(0.5, 1);

    this.display.addChild(this.shadow);

    this.legs = new PIXI.AnimatedSprite([this.textures['legs-fro-q']]);
    this.legs.anchor.set(0.5, 1);
    this.legs.animationSpeed = MarionetteView.SPRITE_ANIMATION_SPEED;
    this.legs.onFrameChange = this.adjustBobbing.bind(this);
    this.display.addChild(this.legs);

    this.armRight = new PIXI.AnimatedSprite([this.textures['arm-fro-q']]);
    this.armRight.position.set(-this.metrics.shoulders.x, -this.metrics.shoulders.y);
    this.armRight.animationSpeed = MarionetteView.SPRITE_ANIMATION_SPEED;
    this.armRight.updateAnchor = true;
    this.display.addChild(this.armRight);

    this.torso = new PIXI.Sprite(this.textures['torso-yellow']);
    this.torso.anchor.set(0.5, 1);
    this.torso.position.set(0, -this.metrics.hips);
    this.torso.animationSpeed = MarionetteView.SPRITE_ANIMATION_SPEED;
    this.display.addChild(this.torso);

    this.armLeft = new PIXI.AnimatedSprite([this.textures['arm-fro-q']]);
    this.armLeft.position.set(this.metrics.shoulders.x, -this.metrics.shoulders.y);
    this.armLeft.animationSpeed = MarionetteView.SPRITE_ANIMATION_SPEED;
    this.armLeft.updateAnchor = true;
    this.armLeft.scale.x = -1;
    this.display.addChild(this.armLeft);
    // this.armLeft.visible = false;


    this.head = new PIXI.Sprite(this.textures['head-a']);
    this.head.anchor.set(0.5, 1);
    this.head.position.set(0, -this.metrics.neck);
    this.head.animationSpeed = MarionetteView.SPRITE_ANIMATION_SPEED;
    this.display.addChild(this.head);
  }

  initAnimations() {
    console.log(this.animations);
  }

  destroy() {
    this.display.destroy({ children: true });
  }

  getDisplay() {
    return this.display;
  }

  setAction(action, x, y) {
    const direction = this.getDirectionName(x, y);
    if (action === 's') {
      this.setStanding(direction);
    }
    if (action === 'w') {
      this.setWalking(direction);
    }
  }

  // eslint-disable-next-line class-methods-use-this
  getDirectionName(x, y) {
    if (y > 0) {
      return 'n';
    }
    if (y < 0) {
      return 's';
    }
    if (x > 0) {
      return 'e';
    }
    if (x < 0) {
      return 'w';
    }
    return 's';
  }

  // eslint-disable-next-line class-methods-use-this
  getArmId(plane, direction) {
    if (direction === 'n' || direction === 's') {
      return plane === 'b' ? 'l' : 'r';
    }
    return plane;
  }

  setStanding(direction) {
    this.currentAction = 's';
    this.currentDirection = direction;

    const facing = (direction === 'n' || direction === 's') ? 'fro' : 'lat';

    this.legs.textures = [this.textures[`legs-${facing}-q`]];
    this.legs.scale.x = (direction === 'n' || direction === 'w') ? -1 : 1;
    this.legs.stop();
    this.armRight.textures = [this.textures[`arm-${facing}-q`]];
    this.armRight.scale.x = (direction === 's' || direction === 'e') ? -1 : 1;
    this.armRight.stop();
    this.armLeft.textures = [this.textures[`arm-${facing}-q`]];
    this.armLeft.scale.x = (direction === 'n' || direction === 'w') ? -1 : 1;
    this.armLeft.stop();

    this.adjustArmsHPosition(direction);
  }

  setWalking(direction) {
    this.currentAction = 'w';
    this.currentDirection = direction;

    const facing = (direction === 'n' || direction === 's') ? 'fro' : 'lat';

    this.legs.textures = this.animations[`legs-${facing}-w`];
    this.legs.scale.x = (direction === 'n' || direction === 'w') ? -1 : 1;
    this.legs.play();

    this.armRight.textures = this.animations[`arm-${facing}-w`];
    this.armRight.scale.x = (direction === 's' || direction === 'e') ? -1 : 1;
    this.armLeft.textures = this.animations[`arm-${facing}-w`];
    this.armLeft.scale.x = (direction === 'n' || direction === 'w') ? -1 : 1;
    this.adjustArmsHPosition(direction);
    this.armLeft.play();
    this.armRight.gotoAndPlay(facing === 'fro' ? 4 : 0);
  }

  adjustArmsHPosition(direction) {
    if (direction === 'n') {
      this.armRight.position.x = -this.metrics.shoulders.x;
      this.armLeft.position.x = this.metrics.shoulders.x;
    }
    if (direction === 's') {
      this.armRight.position.x = this.metrics.shoulders.x;
      this.armLeft.position.x = -this.metrics.shoulders.x;
    }
    if (direction === 'e') {
      this.armLeft.position.x = -this.metrics.shoulders.x + SHOULDER_SIDE_FRONT_OFFSET;
      this.armRight.position.x = this.metrics.shoulders.x - SHOULDER_SIDE_BACK_OFFSET;
    }
    if (direction === 'w') {
      this.armLeft.position.x = this.metrics.shoulders.x - SHOULDER_SIDE_FRONT_OFFSET;
      this.armRight.position.x = -this.metrics.shoulders.x + SHOULDER_SIDE_BACK_OFFSET;
    }
  }

  adjustBobbing() {
    if (this.currentAction === 'w') {
      const bobFactor = BOBBING_FACTOR[this.legs.currentFrame];
      this.torso.position.y = -this.metrics.hips + bobFactor * BOBBING_TORSO_OFFSET;
      this.head.position.y = -this.metrics.neck + bobFactor * BOBBING_HEAD_OFFSET;
      this.armRight.position.y = -this.metrics.shoulders.y + bobFactor * BOBBING_TORSO_OFFSET;
      this.armLeft.position.y = -this.metrics.shoulders.y + bobFactor * BOBBING_TORSO_OFFSET;
    } else if (this.currentAction === 's') {
      // Set all bobs to 0
      this.torso.position.y = -this.metrics.hips;
      this.armRight.position.y = -this.metrics.shoulders.y;
      this.armLeft.position.y = -this.metrics.shoulders.y;
      this.head.position.y = -this.metrics.neck;
    }
  }
}

MarionetteView.SPRITE_ANIMATION_SPEED = 0.3;

module.exports = MarionetteView;


/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry need to be wrapped in an IIFE because it need to be isolated against other modules in the chunk.
(() => {
/*!*****************************!*\
  !*** ./src/js/char-edit.js ***!
  \*****************************/
/* eslint-disable no-console */
const showFatalError = __webpack_require__(/*! ./lib/helpers-web/show-fatal-error */ "./src/js/lib/helpers-web/show-fatal-error.js");
const CharEditApp = __webpack_require__(/*! ./lib/app/char-edit-app */ "./src/js/lib/app/char-edit-app.js");
__webpack_require__(/*! ../sass/default.scss */ "./src/sass/default.scss");
const fetchTextures = __webpack_require__(/*! ./lib/helpers-client/fetch-textures */ "./src/js/lib/helpers-client/fetch-textures.js");

(async () => {
  try {
    const textures = await fetchTextures('./static/textures', {
      bundles: [
        {
          name: 'town-view',
          assets: [
            {
              name: 'sprites-char',
              srcs: 'sprites-char.json',
            },
          ],
        },
      ],
    }, 'town-view');

    const charEditApp = new CharEditApp({}, textures);
    $('[data-component="CharEditApp"]').replaceWith(charEditApp.$element);
  } catch (err) {
    showFatalError(err.message, err);
    console.error(err);
  }
})();

})();

/******/ })()
;
//# sourceMappingURL=charEdit.f32cc17b04939d39b61d.js.map