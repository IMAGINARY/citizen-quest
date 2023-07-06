/******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ "./node_modules/deepmerge/dist/cjs.js":
/*!********************************************!*\
  !*** ./node_modules/deepmerge/dist/cjs.js ***!
  \********************************************/
/***/ ((module) => {

"use strict";


var isMergeableObject = function isMergeableObject(value) {
	return isNonNullObject(value)
		&& !isSpecial(value)
};

function isNonNullObject(value) {
	return !!value && typeof value === 'object'
}

function isSpecial(value) {
	var stringValue = Object.prototype.toString.call(value);

	return stringValue === '[object RegExp]'
		|| stringValue === '[object Date]'
		|| isReactElement(value)
}

// see https://github.com/facebook/react/blob/b5ac963fb791d1298e7f396236383bc955f916c1/src/isomorphic/classic/element/ReactElement.js#L21-L25
var canUseSymbol = typeof Symbol === 'function' && Symbol.for;
var REACT_ELEMENT_TYPE = canUseSymbol ? Symbol.for('react.element') : 0xeac7;

function isReactElement(value) {
	return value.$$typeof === REACT_ELEMENT_TYPE
}

function emptyTarget(val) {
	return Array.isArray(val) ? [] : {}
}

function cloneUnlessOtherwiseSpecified(value, options) {
	return (options.clone !== false && options.isMergeableObject(value))
		? deepmerge(emptyTarget(value), value, options)
		: value
}

function defaultArrayMerge(target, source, options) {
	return target.concat(source).map(function(element) {
		return cloneUnlessOtherwiseSpecified(element, options)
	})
}

function getMergeFunction(key, options) {
	if (!options.customMerge) {
		return deepmerge
	}
	var customMerge = options.customMerge(key);
	return typeof customMerge === 'function' ? customMerge : deepmerge
}

function getEnumerableOwnPropertySymbols(target) {
	return Object.getOwnPropertySymbols
		? Object.getOwnPropertySymbols(target).filter(function(symbol) {
			return Object.propertyIsEnumerable.call(target, symbol)
		})
		: []
}

function getKeys(target) {
	return Object.keys(target).concat(getEnumerableOwnPropertySymbols(target))
}

function propertyIsOnObject(object, property) {
	try {
		return property in object
	} catch(_) {
		return false
	}
}

// Protects from prototype poisoning and unexpected merging up the prototype chain.
function propertyIsUnsafe(target, key) {
	return propertyIsOnObject(target, key) // Properties are safe to merge if they don't exist in the target yet,
		&& !(Object.hasOwnProperty.call(target, key) // unsafe if they exist up the prototype chain,
			&& Object.propertyIsEnumerable.call(target, key)) // and also unsafe if they're nonenumerable.
}

function mergeObject(target, source, options) {
	var destination = {};
	if (options.isMergeableObject(target)) {
		getKeys(target).forEach(function(key) {
			destination[key] = cloneUnlessOtherwiseSpecified(target[key], options);
		});
	}
	getKeys(source).forEach(function(key) {
		if (propertyIsUnsafe(target, key)) {
			return
		}

		if (propertyIsOnObject(target, key) && options.isMergeableObject(source[key])) {
			destination[key] = getMergeFunction(key, options)(target[key], source[key], options);
		} else {
			destination[key] = cloneUnlessOtherwiseSpecified(source[key], options);
		}
	});
	return destination
}

function deepmerge(target, source, options) {
	options = options || {};
	options.arrayMerge = options.arrayMerge || defaultArrayMerge;
	options.isMergeableObject = options.isMergeableObject || isMergeableObject;
	// cloneUnlessOtherwiseSpecified is added to `options` so that custom arrayMerge()
	// implementations can use it. The caller may not replace it.
	options.cloneUnlessOtherwiseSpecified = cloneUnlessOtherwiseSpecified;

	var sourceIsArray = Array.isArray(source);
	var targetIsArray = Array.isArray(target);
	var sourceAndTargetTypesMatch = sourceIsArray === targetIsArray;

	if (!sourceAndTargetTypesMatch) {
		return cloneUnlessOtherwiseSpecified(source, options)
	} else if (sourceIsArray) {
		return options.arrayMerge(target, source, options)
	} else {
		return mergeObject(target, source, options)
	}
}

deepmerge.all = function deepmergeAll(array, options) {
	if (!Array.isArray(array)) {
		throw new Error('first argument should be an array')
	}

	return array.reduce(function(prev, next) {
		return deepmerge(prev, next, options)
	}, {})
};

var deepmerge_1 = deepmerge;

module.exports = deepmerge_1;


/***/ }),

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

/***/ "./node_modules/expressionparser/dist/ExpressionParser.js":
/*!****************************************************************!*\
  !*** ./node_modules/expressionparser/dist/ExpressionParser.js ***!
  \****************************************************************/
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.isArgumentsArray = void 0;
const isInArray = (array, value) => {
    let i, len;
    for (i = 0, len = array.length; i !== len; ++i) {
        if (array[i] === value) {
            return true;
        }
    }
    return false;
};
const mapValues = (mapper) => (obj) => {
    const result = {};
    Object.keys(obj).forEach((key) => {
        result[key] = mapper(obj[key]);
    });
    return result;
};
const convertKeys = (converter) => (obj) => {
    const newKeys = Object.keys(obj)
        .map((key) => (obj.hasOwnProperty(key) ? [key, converter(key)] : null))
        .filter((val) => val != null);
    newKeys.forEach(([oldKey, newKey]) => {
        if (oldKey !== newKey) {
            obj[newKey] = obj[oldKey];
            delete obj[oldKey];
        }
    });
    return obj;
};
exports.isArgumentsArray = (args) => Array.isArray(args) && args.isArgumentsArray;
const thunkEvaluator = (val) => evaluate(val);
const objEvaluator = mapValues(thunkEvaluator);
const evaluate = (thunkExpression) => {
    if (typeof thunkExpression === "function" && thunkExpression.length === 0) {
        return evaluate(thunkExpression());
    }
    else if (exports.isArgumentsArray(thunkExpression)) {
        return thunkExpression.map((val) => evaluate(val()));
    }
    else if (Array.isArray(thunkExpression)) {
        return thunkExpression.map(thunkEvaluator);
    }
    else if (typeof thunkExpression === "object") {
        return objEvaluator(thunkExpression);
    }
    else {
        return thunkExpression;
    }
};
const thunk = (delegate, ...args) => () => delegate(...args);
;
class ExpressionParser {
    constructor(options) {
        this.options = options;
        this.surroundingOpen = {};
        this.surroundingClose = {};
        if (this.options.SURROUNDING) {
            Object.keys(this.options.SURROUNDING).forEach((key) => {
                const item = this.options.SURROUNDING[key];
                let open = item.OPEN;
                let close = item.CLOSE;
                if (this.options.isCaseInsensitive) {
                    key = key.toUpperCase();
                    open = open.toUpperCase();
                    close = close.toUpperCase();
                }
                this.surroundingOpen[open] = true;
                this.surroundingClose[close] = {
                    OPEN: open,
                    ALIAS: key,
                };
            });
        }
        if (this.options.isCaseInsensitive) {
            // convert all terms to uppercase
            const upperCaser = (key) => key.toUpperCase();
            const upperCaseKeys = convertKeys(upperCaser);
            const upperCaseVals = mapValues(upperCaser);
            upperCaseKeys(this.options.INFIX_OPS);
            upperCaseKeys(this.options.PREFIX_OPS);
            upperCaseKeys(this.options.AMBIGUOUS);
            upperCaseVals(this.options.AMBIGUOUS);
            this.options.PRECEDENCE = this.options.PRECEDENCE.map((arr) => arr.map((val) => val.toUpperCase()));
        }
        if (this.options.LITERAL_OPEN) {
            this.LIT_CLOSE_REGEX = new RegExp(`${this.options.LITERAL_OPEN}\$`);
        }
        if (this.options.LITERAL_CLOSE) {
            this.LIT_OPEN_REGEX = new RegExp(`^${this.options.LITERAL_CLOSE}`);
        }
        this.symbols = {};
        this.options.SYMBOLS.forEach((symbol) => {
            this.symbols[symbol] = symbol;
        });
    }
    resolveCase(key) {
        return this.options.isCaseInsensitive ? key.toUpperCase() : key;
    }
    resolveAmbiguity(token) {
        return this.options.AMBIGUOUS[this.resolveCase(token)];
    }
    isSymbol(char) {
        return this.symbols[char] === char;
    }
    getPrefixOp(op) {
        if (this.options.termTyper && this.options.termTyper(op) === "function") {
            const termValue = this.options.termDelegate(op);
            if (typeof termValue !== "function") {
                throw new Error(`${op} is not a function.`);
            }
            const result = termValue;
            return (argsThunk) => {
                const args = evaluate(argsThunk);
                if (!Array.isArray(args)) {
                    return () => result(args);
                }
                else {
                    return () => result(...args);
                }
            };
        }
        return this.options.PREFIX_OPS[this.resolveCase(op)];
    }
    getInfixOp(op) {
        return this.options.INFIX_OPS[this.resolveCase(op)];
    }
    getPrecedence(op) {
        let i, len, casedOp;
        if (this.options.termTyper && this.options.termTyper(op) === "function") {
            return 0;
        }
        casedOp = this.resolveCase(op);
        for (i = 0, len = this.options.PRECEDENCE.length; i !== len; ++i) {
            if (isInArray(this.options.PRECEDENCE[i], casedOp)) {
                return i;
            }
        }
        return i;
    }
    tokenize(expression) {
        let token = "";
        const EOF = 0;
        const tokens = [];
        const state = {
            startedWithSep: true,
            scanningLiteral: false,
            scanningSymbols: false,
            escaping: false,
        };
        const endWord = (endedWithSep) => {
            if (token !== "") {
                const disambiguated = this.resolveAmbiguity(token);
                if (disambiguated && state.startedWithSep && !endedWithSep) {
                    // ambiguous operator is nestled with the RHS
                    // treat it as a prefix operator
                    tokens.push(disambiguated);
                }
                else {
                    // TODO: break apart joined surroundingOpen/Close
                    tokens.push(token);
                }
                token = "";
                state.startedWithSep = false;
            }
        };
        const chars = expression.split("");
        let currChar;
        let i, len;
        for (i = 0, len = chars.length; i <= len; ++i) {
            if (i === len) {
                currChar = EOF;
            }
            else {
                currChar = chars[i];
            }
            if (currChar === this.options.ESCAPE_CHAR && !state.escaping) {
                state.escaping = true;
                continue;
            }
            else if (state.escaping) {
                token += currChar;
            }
            else if (currChar === this.options.LITERAL_OPEN &&
                !state.scanningLiteral) {
                state.scanningLiteral = true;
                endWord(false);
            }
            else if (currChar === this.options.LITERAL_CLOSE) {
                state.scanningLiteral = false;
                tokens.push(this.options.LITERAL_OPEN + token + this.options.LITERAL_CLOSE);
                token = "";
            }
            else if (currChar === EOF) {
                endWord(true);
            }
            else if (state.scanningLiteral) {
                token += currChar;
            }
            else if (currChar === this.options.SEPARATOR) {
                endWord(true);
                state.startedWithSep = true;
            }
            else if (currChar === this.options.GROUP_OPEN ||
                currChar === this.options.GROUP_CLOSE) {
                endWord(currChar === this.options.GROUP_CLOSE);
                state.startedWithSep = currChar === this.options.GROUP_OPEN;
                tokens.push(currChar);
            }
            else if (currChar in this.surroundingOpen ||
                currChar in this.surroundingClose) {
                endWord(currChar in this.surroundingClose);
                state.startedWithSep = currChar in this.surroundingOpen;
                tokens.push(currChar);
            }
            else if ((this.isSymbol(currChar) && !state.scanningSymbols) ||
                (!this.isSymbol(currChar) && state.scanningSymbols)) {
                endWord(false);
                token += currChar;
                state.scanningSymbols = !state.scanningSymbols;
            }
            else {
                token += currChar;
            }
            state.escaping = false;
        }
        return tokens;
    }
    tokensToRpn(tokens) {
        let token;
        let i, len;
        let isInfix, isPrefix, surroundingToken, lastInStack, tokenPrecedence;
        const output = [];
        const stack = [];
        const grouping = [];
        for (i = 0, len = tokens.length; i !== len; ++i) {
            token = tokens[i];
            isInfix = typeof this.getInfixOp(token) !== "undefined";
            isPrefix = typeof this.getPrefixOp(token) !== "undefined";
            if (isInfix || isPrefix) {
                tokenPrecedence = this.getPrecedence(token);
                lastInStack = stack[stack.length - 1];
                while (lastInStack &&
                    ((!!this.getPrefixOp(lastInStack) &&
                        this.getPrecedence(lastInStack) < tokenPrecedence) ||
                        (!!this.getInfixOp(lastInStack) &&
                            this.getPrecedence(lastInStack) <= tokenPrecedence))) {
                    output.push(stack.pop());
                    lastInStack = stack[stack.length - 1];
                }
                stack.push(token);
            }
            else if (this.surroundingOpen[token]) {
                stack.push(token);
                grouping.push(token);
            }
            else if (this.surroundingClose[token]) {
                surroundingToken = this.surroundingClose[token];
                if (grouping.pop() !== surroundingToken.OPEN) {
                    throw new Error(`Mismatched Grouping (unexpected closing "${token}")`);
                }
                token = stack.pop();
                while (token !== surroundingToken.OPEN &&
                    typeof token !== "undefined") {
                    output.push(token);
                    token = stack.pop();
                }
                if (typeof token === "undefined") {
                    throw new Error("Mismatched Grouping");
                }
                stack.push(surroundingToken.ALIAS);
            }
            else if (token === this.options.GROUP_OPEN) {
                stack.push(token);
                grouping.push(token);
            }
            else if (token === this.options.GROUP_CLOSE) {
                if (grouping.pop() !== this.options.GROUP_OPEN) {
                    throw new Error(`Mismatched Grouping (unexpected closing "${token}")`);
                }
                token = stack.pop();
                while (token !== this.options.GROUP_OPEN &&
                    typeof token !== "undefined") {
                    output.push(token);
                    token = stack.pop();
                }
                if (typeof token === "undefined") {
                    throw new Error("Mismatched Grouping");
                }
            }
            else {
                output.push(token);
            }
        }
        for (i = 0, len = stack.length; i !== len; ++i) {
            token = stack.pop();
            surroundingToken = this.surroundingClose[token];
            if (surroundingToken && grouping.pop() !== surroundingToken.OPEN) {
                throw new Error(`Mismatched Grouping (unexpected closing "${token}")`);
            }
            else if (token === this.options.GROUP_CLOSE &&
                grouping.pop() !== this.options.GROUP_OPEN) {
                throw new Error(`Mismatched Grouping (unexpected closing "${token}")`);
            }
            output.push(token);
        }
        if (grouping.length !== 0) {
            throw new Error(`Mismatched Grouping (unexpected "${grouping.pop()}")`);
        }
        return output;
    }
    evaluateRpn(stack, infixer, prefixer, terminator, terms) {
        let lhs, rhs;
        const token = stack.pop();
        if (typeof token === "undefined") {
            throw new Error("Parse Error: unexpected EOF");
        }
        const infixDelegate = this.getInfixOp(token);
        const prefixDelegate = this.getPrefixOp(token);
        const isInfix = infixDelegate && stack.length > 1;
        const isPrefix = prefixDelegate && stack.length > 0;
        if (isInfix || isPrefix) {
            rhs = this.evaluateRpn(stack, infixer, prefixer, terminator, terms);
        }
        if (isInfix) {
            lhs = this.evaluateRpn(stack, infixer, prefixer, terminator, terms);
            return infixer(token, lhs, rhs);
        }
        else if (isPrefix) {
            return prefixer(token, rhs);
        }
        else {
            return terminator(token, terms);
        }
    }
    rpnToExpression(stack) {
        const infixExpr = (term, lhs, rhs) => this.options.GROUP_OPEN +
            lhs +
            this.options.SEPARATOR +
            term +
            this.options.SEPARATOR +
            rhs +
            this.options.GROUP_CLOSE;
        const prefixExpr = (term, rhs) => (this.isSymbol(term) ? term : term + this.options.SEPARATOR) +
            this.options.GROUP_OPEN +
            rhs +
            this.options.GROUP_CLOSE;
        const termExpr = (term) => term;
        return this.evaluateRpn(stack, infixExpr, prefixExpr, termExpr);
    }
    rpnToTokens(stack) {
        const infixExpr = (term, lhs, rhs) => [this.options.GROUP_OPEN]
            .concat(lhs)
            .concat([term])
            .concat(rhs)
            .concat([this.options.GROUP_CLOSE]);
        const prefixExpr = (term, rhs) => [term, this.options.GROUP_OPEN]
            .concat(rhs)
            .concat([this.options.GROUP_CLOSE]);
        const termExpr = (term) => [term];
        return this.evaluateRpn(stack, infixExpr, prefixExpr, termExpr);
    }
    rpnToThunk(stack, terms) {
        const infixExpr = (term, lhs, rhs) => thunk(this.getInfixOp(term), lhs, rhs);
        const prefixExpr = (term, rhs) => thunk(this.getPrefixOp(term), rhs);
        const termExpr = (term, terms) => {
            if (this.options.LITERAL_OPEN &&
                term.startsWith(this.options.LITERAL_OPEN)) {
                // Literal string
                return () => term
                    .replace(this.LIT_OPEN_REGEX, "")
                    .replace(this.LIT_CLOSE_REGEX, "");
            }
            else {
                return (terms && term in terms) ? (() => terms[term]) : thunk(this.options.termDelegate, term);
            }
        };
        return this.evaluateRpn(stack, infixExpr, prefixExpr, termExpr, terms);
    }
    rpnToValue(stack, terms) {
        return evaluate(this.rpnToThunk(stack, terms));
    }
    thunkToValue(thunk) {
        return evaluate(thunk);
    }
    expressionToRpn(expression) {
        return this.tokensToRpn(this.tokenize(expression));
    }
    expressionToThunk(expression, terms) {
        return this.rpnToThunk(this.expressionToRpn(expression), terms);
    }
    expressionToValue(expression, terms) {
        return this.rpnToValue(this.expressionToRpn(expression), terms);
    }
    tokensToValue(tokens) {
        return this.rpnToValue(this.tokensToRpn(tokens));
    }
    tokensToThunk(tokens) {
        return this.rpnToThunk(this.tokensToRpn(tokens));
    }
}
exports["default"] = ExpressionParser;
//# sourceMappingURL=ExpressionParser.js.map

/***/ }),

/***/ "./node_modules/expressionparser/dist/index.js":
/*!*****************************************************!*\
  !*** ./node_modules/expressionparser/dist/index.js ***!
  \*****************************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.init = exports.formula = exports.ExpressionParser = void 0;
const ExpressionParser_1 = __webpack_require__(/*! ./ExpressionParser */ "./node_modules/expressionparser/dist/ExpressionParser.js");
exports.ExpressionParser = ExpressionParser_1.default;
const formula_1 = __webpack_require__(/*! ./languages/formula */ "./node_modules/expressionparser/dist/languages/formula.js");
Object.defineProperty(exports, "formula", ({ enumerable: true, get: function () { return formula_1.formula; } }));
exports.init = (language, evalTerm, typeTerm) => {
    const defn = language(evalTerm, typeTerm);
    return new ExpressionParser_1.default(defn);
};
//# sourceMappingURL=index.js.map

/***/ }),

/***/ "./node_modules/expressionparser/dist/languages/formula.js":
/*!*****************************************************************!*\
  !*** ./node_modules/expressionparser/dist/languages/formula.js ***!
  \*****************************************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.formula = void 0;
const ExpressionParser_1 = __webpack_require__(/*! ../ExpressionParser */ "./node_modules/expressionparser/dist/ExpressionParser.js");
const unpackArgs = (f) => (expr) => {
    const result = expr();
    if (!ExpressionParser_1.isArgumentsArray(result)) {
        if (f.length > 1) {
            throw new Error(`Too few arguments. Expected ${f.length}, found 1 (${JSON.stringify(result)})`);
        }
        return f(() => result);
    }
    else if (result.length === f.length || f.length === 0) {
        return f.apply(null, result);
    }
    else {
        throw new Error(`Incorrect number of arguments. Expected ${f.length}`);
    }
};
const num = (result) => {
    if (typeof result !== "number") {
        throw new Error(`Expected number, found: ${typeof result} ${JSON.stringify(result)}`);
    }
    return result;
};
const array = (result) => {
    if (!Array.isArray(result)) {
        throw new Error(`Expected array, found: ${typeof result} ${JSON.stringify(result)}`);
    }
    if (ExpressionParser_1.isArgumentsArray(result)) {
        throw new Error(`Expected array, found: arguments`);
    }
    return result;
};
const bool = (value) => {
    if (typeof value !== "boolean") {
        throw new Error(`Expected boolean, found: ${typeof value} ${JSON.stringify(value)}`);
    }
    return value;
};
const evalBool = (value) => {
    let result;
    while (typeof value === "function" && value.length === 0) {
        result = value();
    }
    if (!result) {
        result = value;
    }
    return bool(result);
};
const evalString = (value) => {
    let result;
    if (typeof value === "function" && value.length === 0) {
        result = value();
    }
    else {
        result = value;
    }
    return string(result);
};
const evalArray = (arr, typeCheck) => {
    return array(arr).map((value) => {
        let result;
        if (typeof value === "function" && value.length === 0) {
            result = value();
        }
        else {
            result = value;
        }
        if (typeCheck) {
            try {
                result = typeCheck(result);
            }
            catch (err) {
                throw new Error(`In array; ${err.message}`);
            }
        }
        return result;
    });
};
const obj = (obj) => {
    if (typeof obj !== "object" || obj === null) {
        throw new Error(`Expected object, found: ${typeof obj} ${JSON.stringify(obj)}`);
    }
    else if (Array.isArray(obj)) {
        throw new Error(`Expected object, found array`);
    }
    return obj;
};
const iterable = (result) => {
    if (!Array.isArray(result) && typeof result !== "string") {
        throw new Error(`Expected array or string, found: ${typeof result} ${JSON.stringify(result)}`);
    }
    return result;
};
const string = (result) => {
    if (typeof result !== "string") {
        throw new Error(`Expected string, found: ${typeof result} ${JSON.stringify(result)}`);
    }
    return result;
};
const char = (result) => {
    if (typeof result !== "string" || result.length !== 1) {
        throw new Error(`Expected char, found: ${typeof result} ${JSON.stringify(result)}`);
    }
    return result;
};
exports.formula = function (termDelegate, termTypeDelegate) {
    const call = (name) => {
        const upperName = name.toUpperCase();
        if (prefixOps.hasOwnProperty(upperName)) {
            return (...args) => {
                args.isArgumentsArray = true;
                return prefixOps[upperName](() => args);
            };
        }
        else if (infixOps.hasOwnProperty(upperName)) {
            return (...args) => infixOps[upperName](args[0], args[1]);
        }
        else {
            throw new Error(`Unknown function: ${name}`);
        }
    };
    const infixOps = {
        "+": (a, b) => num(a()) + num(b()),
        "-": (a, b) => num(a()) - num(b()),
        "*": (a, b) => num(a()) * num(b()),
        "/": (a, b) => num(a()) / num(b()),
        ",": (a, b) => {
            const aVal = a();
            const aArr = ExpressionParser_1.isArgumentsArray(aVal)
                ? aVal
                : [() => aVal];
            const args = aArr.concat([b]);
            args.isArgumentsArray = true;
            return args;
        },
        "%": (a, b) => num(a()) % num(b()),
        "=": (a, b) => a() === b(),
        "!=": (a, b) => a() !== b(),
        "<>": (a, b) => a() !== b(),
        "~=": (a, b) => Math.abs(num(a()) - num(b())) < Number.EPSILON,
        ">": (a, b) => a() > b(),
        "<": (a, b) => a() < b(),
        ">=": (a, b) => a() >= b(),
        "<=": (a, b) => a() <= b(),
        AND: (a, b) => a() && b(),
        OR: (a, b) => a() || b(),
        "^": (a, b) => Math.pow(num(a()), num(b())),
    };
    const prefixOps = {
        NEG: (arg) => -num(arg()),
        ADD: (a, b) => num(a()) + num(b()),
        SUB: (a, b) => num(a()) - num(b()),
        MUL: (a, b) => num(a()) * num(b()),
        DIV: (a, b) => num(a()) / num(b()),
        MOD: (a, b) => num(a()) % num(b()),
        ISPRIME: (arg) => {
            const val = num(arg());
            for (let i = 2, s = Math.sqrt(val); i <= s; i++) {
                if (val % i === 0)
                    return false;
            }
            return val !== 1;
        },
        GCD: (arg1, arg2) => {
            let a = num(arg1());
            let b = num(arg2());
            a = Math.abs(a);
            b = Math.abs(b);
            if (b > a) {
                var temp = a;
                a = b;
                b = temp;
            }
            while (true) {
                if (b === 0)
                    return a;
                a %= b;
                if (a === 0)
                    return b;
                b %= a;
            }
        },
        NOT: (arg) => !arg(),
        "!": (arg) => !arg(),
        ABS: (arg) => Math.abs(num(arg())),
        ACOS: (arg) => Math.acos(num(arg())),
        ACOSH: (arg) => Math.acosh(num(arg())),
        ASIN: (arg) => Math.asin(num(arg())),
        ASINH: (arg) => Math.asinh(num(arg())),
        ATAN: (arg) => Math.atan(num(arg())),
        ATAN2: (arg1, arg2) => Math.atan2(num(arg1()), num(arg2())),
        ATANH: (arg) => Math.atanh(num(arg())),
        CUBEROOT: (arg) => Math.cbrt(num(arg())),
        CEIL: (arg) => Math.ceil(num(arg())),
        COS: (arg) => Math.cos(num(arg())),
        COSH: (arg) => Math.cos(num(arg())),
        EXP: (arg) => Math.exp(num(arg())),
        FLOOR: (arg) => Math.floor(num(arg())),
        LN: (arg) => Math.log(num(arg())),
        LOG: (arg) => Math.log10(num(arg())),
        LOG2: (arg) => Math.log2(num(arg())),
        SIN: (arg) => Math.sin(num(arg())),
        SINH: (arg) => Math.sinh(num(arg())),
        SQRT: (arg) => Math.sqrt(num(arg())),
        TAN: (arg) => Math.tan(num(arg())),
        TANH: (arg) => Math.tanh(num(arg())),
        ROUND: (arg) => Math.round(num(arg())),
        SIGN: (arg) => Math.sign(num(arg())),
        TRUNC: (arg) => Math.trunc(num(arg())),
        IF: (arg1, arg2, arg3) => {
            const condition = arg1;
            const thenStatement = arg2;
            const elseStatement = arg3;
            if (condition()) {
                return thenStatement();
            }
            else {
                return elseStatement();
            }
        },
        AVERAGE: (arg) => {
            const arr = evalArray(arg());
            const sum = arr.reduce((prev, curr) => prev + num(curr), 0);
            return num(sum) / arr.length;
        },
        SUM: (arg) => evalArray(arg(), num).reduce((prev, curr) => prev + num(curr), 0),
        CHAR: (arg) => String.fromCharCode(num(arg())),
        CODE: (arg) => char(arg()).charCodeAt(0),
        DEC2BIN: (arg) => arg().toString(2),
        DEC2HEX: (arg) => arg().toString(16),
        DEC2STR: (arg) => arg().toString(10),
        BIN2DEC: (arg) => Number.parseInt(string(arg()), 2),
        HEX2DEC: (arg) => Number.parseInt(string(arg()), 16),
        STR2DEC: (arg) => Number.parseInt(string(arg()), 10),
        DEGREES: (arg) => (num(arg()) * 180) / Math.PI,
        RADIANS: (arg) => (num(arg()) * Math.PI) / 180,
        MIN: (arg) => evalArray(arg()).reduce((prev, curr) => Math.min(prev, num(curr)), Number.POSITIVE_INFINITY),
        MAX: (arg) => evalArray(arg()).reduce((prev, curr) => Math.max(prev, num(curr)), Number.NEGATIVE_INFINITY),
        SORT: (arg) => {
            const arr = array(arg()).slice();
            arr.sort();
            return arr;
        },
        REVERSE: (arg) => {
            const arr = array(arg()).slice();
            arr.reverse();
            return arr;
        },
        INDEX: (arg1, arg2) => iterable(arg1())[num(arg2())],
        LENGTH: (arg) => {
            return iterable(arg()).length;
        },
        JOIN: (arg1, arg2) => evalArray(arg2()).join(string(arg1())),
        STRING: (arg) => evalArray(arg()).join(""),
        SPLIT: (arg1, arg2) => string(arg2()).split(string(arg1())),
        CHARARRAY: (arg) => {
            const str = string(arg());
            return str.split("");
        },
        ARRAY: (arg) => {
            const val = arg();
            return ExpressionParser_1.isArgumentsArray(val) ? val.slice() : [val];
        },
        ISNAN: (arg) => isNaN(num(arg())),
        MAP: (arg1, arg2) => {
            const func = arg1();
            const arr = evalArray(arg2());
            return arr.map((val) => {
                if (typeof func === "function") {
                    return () => func(val);
                }
                else {
                    return call(string(func))(() => val);
                }
            });
        },
        REDUCE: (arg1, arg2, arg3) => {
            const func = arg1();
            const start = arg2();
            const arr = evalArray(arg3());
            return arr.reduce((prev, curr) => {
                const args = [() => prev, () => curr];
                if (typeof func === "function") {
                    return func(...args);
                }
                else {
                    return call(string(func))(...args);
                }
            }, start);
        },
        RANGE: (arg1, arg2) => {
            const start = num(arg1());
            const limit = num(arg2());
            const result = [];
            for (let i = start; i < limit; i++) {
                result.push(i);
            }
            return result;
        },
        UPPER: (arg) => string(arg()).toUpperCase(),
        LOWER: (arg) => string(arg()).toLowerCase(),
        ZIP: (arg1, arg2) => {
            const arr1 = evalArray(arg1());
            const arr2 = evalArray(arg2());
            if (arr1.length !== arr2.length) {
                throw new Error("ZIP: Arrays are of different lengths");
            }
            else {
                return arr1.map((v1, i) => [v1, arr2[i]]);
            }
        },
        UNZIP: (arg1) => {
            const inputArr = evalArray(arg1());
            const arr1 = inputArr.map((item) => array(item)[0]);
            const arr2 = inputArr.map((item) => array(item)[1]);
            return [
                arr1,
                arr2
            ];
        },
        TAKE: (arg1, arg2) => {
            const n = num(arg1());
            const arr = evalArray(arg2());
            return arr.slice(0, n);
        },
        DROP: (arg1, arg2) => {
            const n = num(arg1());
            const arr = evalArray(arg2());
            return arr.slice(n);
        },
        SLICE: (arg1, arg2, arg3) => {
            const start = num(arg1());
            const limit = num(arg2());
            const arr = evalArray(arg3());
            return arr.slice(start, limit);
        },
        CONCAT: (arg1, arg2) => {
            const arr1 = array(arg1());
            const arr2 = array(arg2());
            return arr1.concat(arr2);
        },
        HEAD: (arg1) => {
            const arr = array(arg1());
            return arr[0];
        },
        TAIL: (arg1) => {
            const arr = array(arg1());
            return arr.slice(1);
        },
        LAST: (arg1) => {
            const arr = array(arg1());
            return arr[arr.length - 1];
        },
        CONS: (arg1, arg2) => {
            const head = arg1();
            const arr = array(arg2());
            return [head].concat(arr);
        },
        FILTER: (arg1, arg2) => {
            const func = arg1();
            const arr = evalArray(arg2());
            const result = [];
            arr.forEach((val) => {
                let isSatisfied;
                if (typeof func === "function") {
                    isSatisfied = evalBool(func(val));
                }
                else {
                    isSatisfied = evalBool(call(string(func))(() => val));
                }
                if (isSatisfied) {
                    result.push(val);
                }
            });
            return result;
        },
        TAKEWHILE: (arg1, arg2) => {
            const func = arg1();
            const arr = evalArray(arg2());
            const satisfaction = (val) => {
                let isSatisfied;
                if (typeof func === "function") {
                    isSatisfied = evalBool(func(val));
                }
                else {
                    isSatisfied = evalBool(call(string(func))(() => val));
                }
                return isSatisfied;
            };
            let i = 0;
            while (satisfaction(arr[i]) && i < arr.length) {
                i++;
            }
            return arr.slice(0, i);
        },
        DROPWHILE: (arg1, arg2) => {
            const func = arg1();
            const arr = evalArray(arg2());
            const satisfaction = (val) => {
                let isSatisfied;
                if (typeof func === "function") {
                    isSatisfied = evalBool(func(val));
                }
                else {
                    isSatisfied = evalBool(call(string(func))(() => val));
                }
                return isSatisfied;
            };
            let i = 0;
            while (satisfaction(arr[i]) && i < arr.length) {
                i++;
            }
            return arr.slice(i);
        },
        GET: (arg1, arg2) => {
            const key = string(arg1());
            const inputObj = obj(arg2());
            return inputObj[key];
        },
        PUT: (arg1, arg2, arg3) => {
            const key = string(arg1());
            const value = arg2();
            const inputObj = obj(arg3());
            return Object.assign({}, inputObj, { [key]: value });
        },
        DICT: (arg1, arg2) => {
            const arr1 = evalArray(arg1());
            const arr2 = evalArray(arg2());
            const result = {};
            arr1.forEach((v1, i) => {
                const key = string(v1);
                result[key] = arr2[i];
            });
            return result;
        },
        UNZIPDICT: (arg1) => {
            const arr = evalArray(arg1());
            const result = {};
            arr.forEach((item) => {
                const kvPair = array(item);
                if (kvPair.length !== 2) {
                    throw new Error(`UNZIPDICT: Expected sub-array of length 2`);
                }
                const [key, value] = kvPair;
                try {
                    result[evalString(key)] = value;
                }
                catch (err) {
                    throw new Error(`UNZIPDICT keys; ${err.message}`);
                }
            });
            return result;
        },
        KEYS: (arg1) => {
            const inputObj = obj(arg1());
            return Object.keys(inputObj).sort();
        },
        VALUES: (arg1) => {
            const inputObj = obj(arg1());
            return Object.keys(inputObj).sort().map((key) => inputObj[key]);
        }
    };
    // Ensure arguments are unpacked accordingly
    // Except for the ARRAY constructor
    Object.keys(prefixOps).forEach((key) => {
        if (key !== "ARRAY") {
            prefixOps[key] = unpackArgs(prefixOps[key]);
        }
    });
    return {
        ESCAPE_CHAR: "\\",
        INFIX_OPS: infixOps,
        PREFIX_OPS: prefixOps,
        PRECEDENCE: [
            Object.keys(prefixOps),
            ["^"],
            ["*", "/", "%", "MOD"],
            ["+", "-"],
            ["<", ">", "<=", ">="],
            ["=", "!=", "<>", "~="],
            ["AND", "OR"],
            [","],
        ],
        LITERAL_OPEN: '"',
        LITERAL_CLOSE: '"',
        GROUP_OPEN: "(",
        GROUP_CLOSE: ")",
        SEPARATOR: " ",
        SYMBOLS: [
            "^",
            "*",
            "/",
            "%",
            "+",
            "-",
            "<",
            ">",
            "=",
            "!",
            ",",
            '"',
            "(",
            ")",
            "[",
            "]",
            "~",
        ],
        AMBIGUOUS: {
            "-": "NEG",
        },
        SURROUNDING: {
            ARRAY: {
                OPEN: "[",
                CLOSE: "]",
            },
        },
        termDelegate: function (term) {
            const numVal = parseFloat(term);
            if (Number.isNaN(numVal)) {
                switch (term) {
                    case "E":
                        return Math.E;
                    case "LN2":
                        return Math.LN2;
                    case "LN10":
                        return Math.LN10;
                    case "LOG2E":
                        return Math.LOG2E;
                    case "LOG10E":
                        return Math.LOG10E;
                    case "PI":
                        return Math.PI;
                    case "SQRTHALF":
                        return Math.SQRT1_2;
                    case "SQRT2":
                        return Math.SQRT2;
                    case "FALSE":
                        return false;
                    case "TRUE":
                        return true;
                    case "EMPTY":
                        return [];
                    case "EMPTYDICT":
                        return {};
                    case "INFINITY":
                        return Number.POSITIVE_INFINITY;
                    case "EPSILON":
                        return Number.EPSILON;
                    case "UNDEFINED":
                        return undefined;
                    default:
                        return termDelegate(term);
                }
            }
            else {
                return numVal;
            }
        },
        termTyper: function (term) {
            const numVal = parseFloat(term);
            if (Number.isNaN(numVal)) {
                switch (term) {
                    case "E":
                        return "number";
                    case "LN2":
                        return "number";
                    case "LN10":
                        return "number";
                    case "LOG2E":
                        return "number";
                    case "LOG10E":
                        return "number";
                    case "PI":
                        return "number";
                    case "SQRTHALF":
                        return "number";
                    case "SQRT2":
                        return "number";
                    case "FALSE":
                        return "boolean";
                    case "TRUE":
                        return "boolean";
                    case "EMPTY":
                        return "array";
                    case "INFINITY":
                        return "number";
                    case "EPSILON":
                        return "number";
                    default:
                        return termTypeDelegate ? termTypeDelegate(term) : "unknown";
                }
            }
            else {
                return "number";
            }
        },
        isCaseInsensitive: true,
        descriptions: [
            {
                op: "+",
                fix: "infix",
                sig: ["a: Number", "b: Number", "Number"],
                text: "Performs addition: a + b",
            },
            {
                op: "ADD",
                fix: "prefix",
                sig: ["a: Number", "b: Number", "Number"],
                text: "Performs addition: ADD(a, b) = a + b",
            },
            {
                op: "*",
                fix: "infix",
                sig: ["a: Number", "b: Number", "Number"],
                text: "Performs multiplication: a * b",
            },
            {
                op: "MUL",
                fix: "prefix",
                sig: ["a: Number", "b: Number", "Number"],
                text: "Performs multiplication: MUL(a, b) = a * b",
            },
            {
                op: "-",
                fix: "infix",
                sig: ["a: Number", "b: Number", "Number"],
                text: "Performs subtraction: a - b",
            },
            {
                op: "SUB",
                fix: "prefix",
                sig: ["a: Number", "b: Number", "Number"],
                text: "Performs subtraction: SUB(a, b) = a - b",
            },
            {
                op: "/",
                fix: "infix",
                sig: ["a: Number", "b: Number", "Number"],
                text: "Performs division: a / b",
            },
            {
                op: "DIV",
                fix: "prefix",
                sig: ["a: Number", "b: Number", "Number"],
                text: "Performs division: DIV(a, b) = a / b",
            },
            {
                op: ",",
                fix: "infix",
                sig: ["a", "b", "Arguments"],
                text: "Returns an array of arguments with b appended to a. If a is not an argument array, it is automatically appended to an empty array.",
            },
            {
                op: "MOD",
                fix: "prefix",
                sig: ["a: Number", "b: Number", "Number"],
                text: "Performs modulo operation: MOD(a, b). (equivalent to a % b)",
            },
            {
                op: "%",
                fix: "infix",
                sig: ["a: Number", "b: Number", "Number"],
                text: "Performs modulo operation: a % b. (equivalent to MOD(a, b))",
            },
            {
                op: "=",
                fix: "infix",
                sig: ["a", "b", "Boolean"],
                text: "Returns TRUE if a = b. Otherwise returns FALSE.",
            },
            {
                op: "!=",
                fix: "infix",
                sig: ["a: Number", "b: Number", "Number"],
                text: "Returns FALSE if a = b. Otherwise returns TRUE. (equivalent to <>)",
            },
            {
                op: "<>",
                fix: "infix",
                sig: ["a: Number", "b: Number", "Number"],
                text: "Returns FALSE if a = b. Otherwise returns TRUE. (equivalent to !=)",
            },
            {
                op: "~=",
                fix: "infix",
                sig: ["a: Number", "b: Number", "Number"],
                text: "Returns TRUE if ABS(a - b) < EPSILON. Otherwise returns FALSE.",
            },
            {
                op: ">",
                fix: "infix",
                sig: ["a: Number", "b: Number", "Boolean"],
                text: "Performs greater-than operation: a > b",
            },
            {
                op: "<",
                fix: "infix",
                sig: ["a: Number", "b: Number", "Boolean"],
                text: "Performs less-than operation: a < b",
            },
            {
                op: ">=",
                fix: "infix",
                sig: ["a: Number", "b: Number", "Boolean"],
                text: "Performs greater-than-or-equal operation: a >= b",
            },
            {
                op: "<=",
                fix: "infix",
                sig: ["a: Number", "b: Number", "Boolean"],
                text: "Performs less-than-or-equal operation: a <= b",
            },
            {
                op: "AND",
                fix: "infix",
                sig: ["a: Boolean", "b: Boolean", "Boolean"],
                text: "Performs logical AND: a AND b.",
            },
            {
                op: "OR",
                fix: "infix",
                sig: ["a: Boolean", "b: Boolean", "Boolean"],
                text: "Performs logical OR: a OR b.",
            },
            {
                op: "^",
                fix: "infix",
                sig: ["a: Number", "b: Number", "Number"],
                text: "Performs exponentiation (a to the power of b): a ^ b",
            },
            {
                op: "NEG",
                fix: "prefix",
                sig: ["value: Number", "Number"],
                text: "Performs negation of the value: NEG(value). (equivalent to -value)",
            },
            {
                op: "-",
                fix: "prefix",
                sig: ["value: Number", "Number"],
                text: 'Performs negation of the value: -value. Note: no space can be present before "value". (equivalent to NEG(value))',
            },
            {
                op: "ISPRIME",
                fix: "prefix",
                sig: ["value: Number", "Number"],
                text: "Returns TRUE if value is prime, FALSE otherwise.",
            },
            {
                op: "GCD",
                fix: "prefix",
                sig: ["a: Number", "b: Number", "Number"],
                text: "Returns the greatest common divisor of a and b.",
            },
            {
                op: "NOT",
                fix: "prefix",
                sig: ["value: Boolean", "Boolean"],
                text: "Performs logical NOT of the value: NOT(value). (equivalent to !value)",
            },
            {
                op: "!",
                fix: "prefix",
                sig: ["value: Boolean", "Boolean"],
                text: "Performs logical NOT of the value: !value. (equivalent to NOT(value))",
            },
            {
                op: "ABS",
                fix: "prefix",
                sig: ["value: Number", "Number"],
                text: "Returns the absolute value of the number: ABS(value).",
            },
            {
                op: "ACOS",
                fix: "prefix",
                sig: ["value: Number", "Number"],
                text: "Returns the arc cosine (inverse cosine) of the number: ACOS(value).",
            },
            {
                op: "ACOSH",
                fix: "prefix",
                sig: ["value: Number", "Number"],
                text: "Returns the inverse hyperbolic cosine of the number: ACOSH(value).",
            },
            {
                op: "ASIN",
                fix: "prefix",
                sig: ["value: Number", "Number"],
                text: "Returns the arcsine of the number: ASIN(value).",
            },
            {
                op: "ASINH",
                fix: "prefix",
                sig: ["value: Number", "Number"],
                text: "Returns the inverse hyperbolic sine of the number: ASINH(value).",
            },
            {
                op: "ATAN",
                fix: "prefix",
                sig: ["value: Number", "Number"],
                text: "Returns the arctangent of the number: ATAN(value).",
            },
            {
                op: "ATAN2",
                fix: "prefix",
                sig: ["y: Number", "x: Number", "Number"],
                text: "Returns the angle (radians) from the X-axis to a point, given a cartesian y-coordinate and x-coordinate: ATAN2(y, x).",
            },
            {
                op: "ATANH",
                fix: "prefix",
                sig: ["value: Number", "Number"],
                text: "Returns the inverse hyperbolic tangent of the number: ATANH(value).",
            },
            {
                op: "CUBEROOT",
                fix: "prefix",
                sig: ["value: Number", "Number"],
                text: "Returns an approximation of the cubed root of the number: CUBEROOT(value).",
            },
            {
                op: "COS",
                fix: "prefix",
                sig: ["value: Number", "Number"],
                text: "Returns the cosine of the number: COS(value).",
            },
            {
                op: "COSH",
                fix: "prefix",
                sig: ["value: Number", "Number"],
                text: "Returns the hyperbolic cosine of the number: COSH(value).",
            },
            {
                op: "EXP",
                fix: "prefix",
                sig: ["value: Number", "Number"],
                text: "Returns the natural logarithm (e) raised to this value: EXP(value).",
            },
            {
                op: "LN",
                fix: "prefix",
                sig: ["value: Number", "Number"],
                text: "Returns the natural logarithm (base e) of the number: LN(value).",
            },
            {
                op: "LOG",
                fix: "prefix",
                sig: ["value: Number", "Number"],
                text: "Returns the base 10 logarithm of the number: LOG(value).",
            },
            {
                op: "LOG2",
                fix: "prefix",
                sig: ["value: Number", "Number"],
                text: "Returns the base 2 logarithm of the number: LOG2(value).",
            },
            {
                op: "SIN",
                fix: "prefix",
                sig: ["value: Number", "Number"],
                text: "Returns the sine of the number: SIN(value).",
            },
            {
                op: "SINH",
                fix: "prefix",
                sig: ["value: Number", "Number"],
                text: "Returns the hyperbolic sine of the number: SINH(value).",
            },
            {
                op: "SQRT",
                fix: "prefix",
                sig: ["value: Number", "Number"],
                text: "Returns the square root of the number: SQRT(value).",
            },
            {
                op: "TAN",
                fix: "prefix",
                sig: ["value: Number", "Number"],
                text: "Returns the tangent of the number: TAN(value).",
            },
            {
                op: "TANH",
                fix: "prefix",
                sig: ["value: Number", "Number"],
                text: "Returns the hyperbolic tangent of the number: TANH(value).",
            },
            {
                op: "DEGREES",
                fix: "prefix",
                sig: ["radians: Number", "Number"],
                text: "Performs a conversion of radians to degrees: DEGREES(radians).",
            },
            {
                op: "RADIANS",
                fix: "prefix",
                sig: ["degrees: Number", "Number"],
                text: "Performs a conversion of radians to degrees: RADIANS(degrees).",
            },
            {
                op: "CEIL",
                fix: "prefix",
                sig: ["value: Number", "Number"],
                text: "Returns the smallest integer greater-than or equal-to the number: CEIL(value).",
            },
            {
                op: "FLOOR",
                fix: "prefix",
                sig: ["value: Number", "Number"],
                text: "Returns the greatest integer less-than or equal-to the number: CEIL(value).",
            },
            {
                op: "ROUND",
                fix: "prefix",
                sig: ["value: Number", "Number"],
                text: "Returns the value rounded to the nearest integer: ROUND(value).",
            },
            {
                op: "TRUNC",
                fix: "prefix",
                sig: ["value: Number", "Number"],
                text: "Returns the integral part of the number, truncating any fractional digits: TRUNC(value).",
            },
            {
                op: "SIGN",
                fix: "prefix",
                sig: ["value: Number", "Number"],
                text: "Returns the sign of the value, indicating whether the number is positive (1) or negative (-1): SIGN(value).",
            },
            {
                op: "ISNAN",
                fix: "prefix",
                sig: ["value", "Boolean"],
                text: "Returns TRUE if a value is not a number (e.g. the result of an invalid mathematical operation), otherwise returns FALSE: ISNAN(value).",
            },
            {
                op: "IF",
                fix: "prefix",
                sig: ["condition: Boolean", "then", "else", "result"],
                text: 'Tests the condition and returns the "then" value if the condition is TRUE, otherwise returns the "else" value: IF(condition, then, else).',
            },
            {
                op: "AVERAGE",
                fix: "prefix",
                sig: ["values: Array of Numbers", "Number"],
                text: "Returns the average (mean) of an array of numbers. AVERAGE(array).",
            },
            {
                op: "SUM",
                fix: "prefix",
                sig: ["values: Array of Numbers", "Number"],
                text: "Returns the sum of an array of numbers. SUM(array).",
            },
            {
                op: "MIN",
                fix: "prefix",
                sig: ["values: Array of Numbers", "Number"],
                text: "Returns the minimum value in an array of numbers. MIN(array).",
            },
            {
                op: "MAX",
                fix: "prefix",
                sig: ["values: Array of Numbers", "Number"],
                text: "Returns the maximum value in an array of numbers. MAX(array).",
            },
            {
                op: "CHAR",
                fix: "prefix",
                sig: ["code: Integer", "String"],
                text: "Returns a single-character string with a unicode character representing the value of the given code. CHAR(code)",
            },
            {
                op: "CODE",
                fix: "prefix",
                sig: ["string: String", "Integer"],
                text: "Returns the unicode value of the first character of a string: CODE(string)",
            },
            {
                op: "UPPER",
                fix: "prefix",
                sig: ["string: String", "String"],
                text: "Converts a string to uppercase: UPPER(string).",
            },
            {
                op: "LOWER",
                fix: "prefix",
                sig: ["string: String", "String"],
                text: "Converts a string to lowercase: LOWER(string).",
            },
            {
                op: "DEC2BIN",
                fix: "prefix",
                sig: ["decimal: Integer", "binary: String"],
                text: 'Returns a string of "1" and "0" characters representing the binary representation of the decimal value. DEC2BIN(decimal)',
            },
            {
                op: "DEC2HEX",
                fix: "prefix",
                sig: ["decimal: Integer", "hex: String"],
                text: "Returns a string of characters representing the hexadecimal representation of the decimal value. DEC2HEX(decimal)",
            },
            {
                op: "BIN2DEC",
                fix: "prefix",
                sig: ["binary: String", "decimal: Integer"],
                text: 'Returns the base 10 value of a binary string of "1" and "0" characters. BIN2DEC(binary)',
            },
            {
                op: "HEX2DEC",
                fix: "prefix",
                sig: ["hex: String", "decimal: Integer"],
                text: "Returns the base 10 value of a hexadecimal string. HEX2DEC(hex)",
            },
            {
                op: "SORT",
                fix: "prefix",
                sig: ["array: Array", "Array"],
                text: "Returns a sorted array: SORT(array).",
            },
            {
                op: "REVERSE",
                fix: "prefix",
                sig: ["array: Array", "Array"],
                text: "Returns a reversed array: REVERSE(array).",
            },
            {
                op: "INDEX",
                fix: "prefix",
                sig: ["array: Array", "i: Integer", "Value"],
                text: "Returns the value at the given array index: INDEX(array, i).",
            },
            {
                op: "LENGTH",
                fix: "prefix",
                sig: ["array: Array", "Integer"],
                text: "Returns the length of an array: LENGTH(array).",
            },
            {
                op: "JOIN",
                fix: "prefix",
                sig: ["array: Array", "separator: String", "String"],
                text: "Joins each array element into a string, using a separator: JOIN(array, separator).",
            },
            {
                op: "SPLIT",
                fix: "prefix",
                sig: ["string: String", "separator: String", "Array"],
                text: "Splits a string into an array of characters, using a separator: SPLIT(string, separator).",
            },
            {
                op: "STRING",
                fix: "prefix",
                sig: ["array: Array", "String"],
                text: "Converts an array into a string: STRING(array).",
            },
            {
                op: "CHARARRAY",
                fix: "prefix",
                sig: ["string: String", "Array"],
                text: "Converts a string into an array of characters: CHARARRAY(string)",
            },
            {
                op: "ARRAY",
                fix: "prefix",
                sig: ["arguments...", "Array"],
                text: "Converts arguments into an array: ARRAY(a, b, c, ...).",
            },
            {
                op: "MAP",
                fix: "prefix",
                sig: ["mapper: Reference", "array: Array", "Array"],
                text: "Performs a mapper function on each element of the array: MAP(mapper, array).",
            },
            {
                op: "REDUCE",
                fix: "prefix",
                sig: ["reducer: Reference", "start", "array: Array", "Array"],
                text: 'Performs a reducer function on each pair of array elements, using "start" as its starting value: REDUCE(reducer, array).',
            },
            {
                op: "RANGE",
                fix: "prefix",
                sig: ["start: Integer", "limit: Integer", "Array"],
                text: "Creates an array of integers, incrementing from start (included) to the limit (excluded): RANGE(start, limit)",
            },
            {
                op: "ZIP",
                fix: "prefix",
                sig: ["array1: Array", "array2: Array", "Array of [array1[i], array2[i]]"],
                text: "Combines two arrays into a single array of both values, paired at their respective position: ZIP(array1, array2)",
            },
            {
                op: "UNZIP",
                fix: "prefix",
                sig: ["array: Array of [a, b]", "[Array of a, Array of b]"],
                text: "Splits a single array of pairs into two arrays with values at their respective positions: UNZIP(array)",
            },
            {
                op: "TAKE",
                fix: "prefix",
                sig: ["n: Integer", "Array"],
                text: "Takes the first n values from the array: TAKE(n, array)",
            },
            {
                op: "DROP",
                fix: "prefix",
                sig: ["n: Integer", "Array"],
                text: "Drops the first n values from the array: DROP(n, array)",
            },
            {
                op: "SLICE",
                fix: "prefix",
                sig: ["startIndex: Integer", "limitIndex: Integer", "Array"],
                text: "Slices an array from startIndex to (but not including) limitIndex: SLICE(startIndex, limitIndex, array)",
            },
            {
                op: "CONCAT",
                fix: "prefix",
                sig: ["array1: Array", "array2: Array", "Array"],
                text: "Concatenates two arrays into one: CONCAT(array1, array2)",
            },
            {
                op: "HEAD",
                fix: "prefix",
                sig: ["array: Array", "Value"],
                text: "Retrieves the first element of an array: HEAD(array)",
            },
            {
                op: "TAIL",
                fix: "prefix",
                sig: ["array: Array", "Array"],
                text: "Returns the array without the first element: TAIL(array)",
            },
            {
                op: "LAST",
                fix: "prefix",
                sig: ["array: Array", "Value"],
                text: "Retrieves the last element of an array: HEAD(array)",
            },
            {
                op: "CONS",
                fix: "prefix",
                sig: ["head: Value", "array: Array", "Array"],
                text: "Returns an array with a new value at the first position: CONS(head, array)",
            },
            {
                op: "FILTER",
                fix: "prefix",
                sig: ["filter: Reference", "array: Array", "Array"],
                text: "Returns an array of all elements for which 'filter(element)' returns true: FILTER(filter, array).",
            },
            {
                op: "TAKEWHILE",
                fix: "prefix",
                sig: ["check: Reference", "array: Array", "Array"],
                text: "Returns a new array of all elements up until 'check(element)' returns false: TAKEWHILE(check, array).",
            },
            {
                op: "DROPWHILE",
                fix: "prefix",
                sig: ["check: Reference", "array: Array", "Array"],
                text: "Returns a new array skipping all elements up until 'check(element)' returns false: DROPWHILE(check, array).",
            },
            {
                op: "GET",
                fix: "prefix",
                sig: ["key: String", "dict: Dictionary", "Value"],
                text: "Retrieves the value of the associated key in a dictionary: GET(key, dict)",
            },
            {
                op: "PUT",
                fix: "prefix",
                sig: ["key: String", "value: Value", "dict: Dictionary", "Dictionary"],
                text: "Returns a dictionary with the key set to a new value: PUT(key, value, dict)",
            },
            {
                op: "DICT",
                fix: "prefix",
                sig: ["keys: Array", "values: Array", "Dictionary"],
                text: "Constructs a new dictionary out of an array of keys and a corresponding array of values: DICT(keys, values)",
            },
            {
                op: "UNZIPDICT",
                fix: "prefix",
                sig: ["keyValuePairs: Array", "Dictionary"],
                text: "Constructs a new dictionary out of an array of [key, value] pairs: UNZIPDICT(keyValuePairs)",
            },
            {
                op: "KEYS",
                fix: "prefix",
                sig: ["dict: Dictionary", "Array"],
                text: "Returns all the keys of a dictionary in alphabetical order: KEYS(dict)",
            },
            {
                op: "VALUES",
                fix: "prefix",
                sig: ["dict: Dictionary", "Array"],
                text: "Returns all the values of a dictionary, in alphabetical order of their keys: VALUES(dict)",
            },
            {
                op: "[...]",
                fix: "surround",
                sig: ["arguments...", "Array"],
                text: "Converts arguments into an array: [a, b, c, ...].",
            },
        ],
    };
};
//# sourceMappingURL=formula.js.map

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

/***/ "./src/js/lib/components/player-app.js":
/*!*********************************************!*\
  !*** ./src/js/lib/components/player-app.js ***!
  \*********************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

/* globals PIXI */
const Stats = __webpack_require__(/*! ../helpers-web/stats.js */ "./src/js/lib/helpers-web/stats.js");
const TownView = __webpack_require__(/*! ../views/town-view */ "./src/js/lib/views/town-view.js");
__webpack_require__(/*! ../helpers-web/fill-with-aspect */ "./src/js/lib/helpers-web/fill-with-aspect.js");
const PCView = __webpack_require__(/*! ../views/pc-view */ "./src/js/lib/views/pc-view.js");
const KeyboardInputMgr = __webpack_require__(/*! ../input/keyboard-input-mgr */ "./src/js/lib/input/keyboard-input-mgr.js");
const GamepadInputMgr = __webpack_require__(/*! ../input/gamepad-input-mgr */ "./src/js/lib/input/gamepad-input-mgr.js");
const MultiplexInputMgr = __webpack_require__(/*! ../input/multiplex-input-mgr */ "./src/js/lib/input/multiplex-input-mgr.js");
const PlayerAppInputRouter = __webpack_require__(/*! ../input/player-app-input-router */ "./src/js/lib/input/player-app-input-router.js");
const PlayerCharacter = __webpack_require__(/*! ../model/player-character */ "./src/js/lib/model/player-character.js");
const DialogueOverlay = __webpack_require__(/*! ../dialogues/dialogue-overlay */ "./src/js/lib/dialogues/dialogue-overlay.js");
const DialogueSequencer = __webpack_require__(/*! ../dialogues/dialogue-sequencer */ "./src/js/lib/dialogues/dialogue-sequencer.js");

class PlayerApp {
  constructor(config, playerId) {
    this.config = config;
    this.playerId = playerId;
    this.pc = new PlayerCharacter(this.config, playerId);
    this.otherPcs = Object.fromEntries(Object.entries(this.config.players)
      .filter(([id, player]) => (player.enabled === undefined || player.enabled) && id !== playerId)
      .map(([id]) => [id, new PlayerCharacter(this.config, id)]));
    this.canControlPc = false;

    this.$element = $('<div></div>')
      .addClass('player-app');

    this.$pixiWrapper = $('<div></div>')
      .addClass('pixi-wrapper')
      .appendTo(this.$element);

    this.dialogueOverlay = new DialogueOverlay(this.config);
    this.dialogueSequencer = new DialogueSequencer(this.dialogueOverlay);
    this.$element.append(this.dialogueOverlay.$element);
  }

  async init() {
    this.pixiApp = new PIXI.Application({
      // todo: get these from config or constants
      width: PlayerApp.APP_WIDTH,
      height: PlayerApp.APP_HEIGHT,
      backgroundColor: 0xffffff,
    });
    this.$pixiWrapper.append(this.pixiApp.view);

    await this.loadTextures();

    this.townView = new TownView(this.config, this.textures);
    this.pixiApp.stage.addChild(this.townView.display);
    this.pcView = new PCView(this.config, this.textures, this.pc, this.townView);
    this.otherPcViews = Object.fromEntries(
      Object.entries(this.otherPcs)
        .map(([id, pc]) => [id, new PCView(this.config, this.textures, pc, this.townView)])
    );

    this.townView.mainLayer.addChild(this.pcView.display);
    if (Object.values(this.otherPcViews).length > 0) {
      this.townView.mainLayer.addChild(...Object.values(this.otherPcViews)
        .map(pcView => pcView.display));
    }

    this.stats = new Stats();
    this.$element.append(this.stats.dom);

    this.keyboardInputMgr = new KeyboardInputMgr();
    this.keyboardInputMgr.attachListeners();
    this.keyboardInputMgr.addToggle('KeyD', () => { this.stats.togglePanel(); });

    const gamepadMapperConfig =
      this.config?.players?.[this.playerId]?.['gamepadMapping'] ?? {};
    this.gamepadInputMgr = new GamepadInputMgr(gamepadMapperConfig);
    this.gamepadInputMgr.attachListeners();

    this.multiplexInputMgr = new MultiplexInputMgr(
      this.keyboardInputMgr,
      this.gamepadInputMgr
    );
    this.multiplexInputMgr.attachListeners();

    const inputMgrs = [
      this.keyboardInputMgr,
      this.gamepadInputMgr,
      this.multiplexInputMgr, // the multiplexer must be the last one
    ];

    const inputMgr = this.multiplexInputMgr;

    this.inputRouter = new PlayerAppInputRouter(inputMgr);
    this.inputRouter.routeToPcMovement(this);

    this.pixiApp.ticker.add((time) => {
      this.stats.frameBegin();
      inputMgrs.forEach((inputMgr) => inputMgr.update());
      if (this.canControlPc) {
        const { x, y } = inputMgr.getDirection();
        this.pc.setSpeed(x * 10, y * 10);
      }
      this.pcView.animate(time);
      Object.entries(this.otherPcViews).forEach(([, pcView]) => {
        pcView.display.position = pcView.pc.position;
        pcView.display.zIndex = pcView.pc.position.y;
      });
      this.townView.mainLayer.sortChildren();

      // Set the town view's pivot so the PC is always centered on the screen,
      // but don't let the pivot go off the edge of the town
      this.townView.display.pivot.set(
        Math.max(0, Math.min(this.pcView.display.x + this.pcView.display.width / 2 - PlayerApp.APP_WIDTH / 2, this.townView.townSize.width - PlayerApp.APP_WIDTH)),
        Math.max(0, Math.min(this.pcView.display.y + this.pcView.display.height / 2 - PlayerApp.APP_HEIGHT / 2, this.townView.townSize.height - PlayerApp.APP_HEIGHT)),
      );
      this.stats.frameEnd();
    });

    return this;
  }

  async loadTextures() {
    PIXI.Assets.init({
      basePath: './static/textures',
      manifest: this.config.textures,
    });

    this.textures = await PIXI.Assets.loadBundle('town-view');
  }

  resize() {
    this.$element.fillWithAspect(PlayerApp.APP_WIDTH / PlayerApp.APP_HEIGHT);
    this.$element.css('font-size', `${(this.$element.width() * PlayerApp.FONT_RATIO).toFixed(3)}px`);
  }

  enablePcControl() {
    this.canControlPc = true;
  }

  disablePcControl() {
    this.canControlPc = false;
    this.pc.setSpeed(0, 0);
  }

  playDialogue(dialogue) {
    this.inputRouter.routeToDialogueOverlay(this.dialogueOverlay, this.dialogueSequencer);
    this.dialogueSequencer.play(dialogue);
    this.dialogueSequencer.events.once('end', () => {
      this.inputRouter.routeToPcMovement(this);
    });
  }
}

PlayerApp.APP_WIDTH = 1024;
PlayerApp.APP_HEIGHT = 768;
PlayerApp.FONT_RATIO = 0.0175; // 1.75% of the width of the app

module.exports = PlayerApp;


/***/ }),

/***/ "./src/js/lib/dialogues/dialogue-balloon.js":
/*!**************************************************!*\
  !*** ./src/js/lib/dialogues/dialogue-balloon.js ***!
  \**************************************************/
/***/ ((module) => {

class DialogueBalloon {
  constructor(classes) {
    this.$element = $('<div></div>')
      .addClass('balloon')
      .addClass(classes);
  }

  show() {
    this.cancelHide();
    this.$element.addClass('visible');
  }

  hide() {
    this.$element.addClass('fading');
    if (this.timeout) {
      clearTimeout(this.timeout);
    }
    this.timeout = setTimeout(() => {
      this.$element.removeClass('fading');
      this.$element.removeClass('visible');
      this.$element.removeClass('press-to-continue');
    }, 250);
  }

  cancelHide() {
    if (this.timeout) {
      clearTimeout(this.timeout);
    }
    this.$element.removeClass('fading');
  }

  showPressToContinue() {
    this.$element.addClass('press-to-continue');
  }

  hidePressToContinue() {
    this.$element.removeClass('press-to-continue');
  }

  empty() {
    this.$element.empty();
  }

  append(element) {
    this.$element.append(element);
  }
}

module.exports = DialogueBalloon;


/***/ }),

/***/ "./src/js/lib/dialogues/dialogue-iterator.js":
/*!***************************************************!*\
  !*** ./src/js/lib/dialogues/dialogue-iterator.js ***!
  \***************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

const LogicParser = __webpack_require__(/*! ./logic-parser */ "./src/js/lib/dialogues/logic-parser.js");

/**
 * An interface for the context object passed to the dialogue iterator.
 * @interface
 */
// eslint-disable-next-line no-unused-vars
class DialogueIteratorContextInterface {
  /**
   * Returns a random number between 0 and max.
   * @param {number} max
   */
  // eslint-disable-next-line no-unused-vars,class-methods-use-this
  random(max) {
    throw new Error('Not implemented');
  }

  /**
   * Returns true if the specified flag is set.
   *
   * @param {string} flag
   * @returns {boolean}
   */
  // eslint-disable-next-line no-unused-vars,class-methods-use-this
  hasFlag(flag) {
    throw new Error('Not implemented');
  }

  /**
   * Sets the specified flag.
   *
   * @param {string} flag
   * @returns {boolean}
   */
  // eslint-disable-next-line no-unused-vars,class-methods-use-this
  setFlag(flag) {
    throw new Error('Not implemented');
  }
}

/**
 * Iterates through a dialogue tree.
 */
class DialogueIterator {
  /**
   * Creates a new iterator for the given dialogue.
   *
   * @param {Dialogue} dialogue
   * @param {DialogueIteratorContextInterface} context
   */
  constructor(dialogue, context) {
    this.dialogue = dialogue;
    this.context = context;
    this.conditionParser = new LogicParser(context);
    this.reset();
  }

  /**
   * Resets the iterator to the beginning of the dialogue.
   */
  reset() {
    this.activeNode = this.dialogue.root;
  }

  /**
   * Returns true if the iterator has reached the end of the dialogue.
   * @returns {boolean}
   */
  isEnd() {
    return this.activeNode === null;
  }

  /**
   * Returns the current active node.
   * @returns {*|null}
   */
  getActiveNode() {
    return this.activeNode;
  }

  /**
   * Returns responses in the current active node that have all their conditions met.
   *
   * @returns {Array|null}
   */
  getEnabledResponses() {
    if (this.activeNode === null) {
      return null;
    }

    if (!this.activeNode.responses) {
      return null;
    }

    return this.activeNode.responses
      .filter(response => !response.cond || this.conditionParser.evaluate(response.cond));
  }

  /**
   * Returns the response with the given ID in the active node.
   *
   * @param {string} responseId
   * @returns {Object|null}
   */
  getResponse(responseId) {
    if (this.activeNode === null) {
      return null;
    }

    if (!this.activeNode.responses) {
      return null;
    }

    return this.activeNode.responsesById[responseId];
  }

  /**
   * Advances the iterator to the next node.
   *
   * @throws Error if the active node type is unknown.
   */
  next() {
    if (this.activeNode === null) {
      return;
    }

    if (this.activeNode.responses && this.activeNode.responses.length > 0) {
      throw new Error(`Can't use next() on a node of type 'statement' with responses (${this.activeNode.id}:${this.dialogue.root.id})`);
    }

    this.setFlags(this.activeNode.set);

    let transitioned = false;
    switch (this.activeNode.type) {
      case 'statement':
        transitioned = this.nextOnStatement();
        break;
      case 'root':
      case 'first':
        transitioned = this.nextOnFirst();
        break;
      case 'sequence':
        transitioned = this.nextOnSequence();
        break;
      case 'random':
        transitioned = this.nextOnRandom();
        break;
      default:
        throw new Error(`Unknown node type: ${this.activeNode.type} (${this.activeNode.id}:${this.dialogue.root.id})`);
    }
    if (transitioned === false) {
      transitioned = this.nextThroughParent();
    }
    if (transitioned === false) {
      this.activeNode = null;
    }
  }

  nextWithResponse(responseId) {
    if (this.activeNode === null) {
      return;
    }

    if (this.activeNode.responses === undefined) {
      throw new Error(`Can't use nextWithResponse on a node without responses (${this.activeNode.type}:${this.dialogue.root.id})`);
    }

    const response = this.activeNode.responsesById[responseId];
    if (!response) {
      throw new Error(`Unknown response id: ${responseId} (${this.activeNode.id}:${this.dialogue.root.id})`);
    }

    this.setFlags(this.activeNode.set);
    this.setFlags(response.set);
    if (response.then) {
      this.goTo(response.then);
      return;
    }

    if (!this.nextOnStatement()) {
      this.activeNode = null;
    }
  }

  /**
   * Jumps to a node identified by its id.
   *
   * @private
   * @throws Error if the node id is not found.
   * @param {string} nodeId
   */
  goTo(nodeId) {
    const nextNode = this.dialogue.getNode(nodeId);
    if (nextNode === undefined) {
      throw new Error(`Can't find node id: ${nodeId} (active node = ${this.activeNode}:${this.dialogue.root.id})`);
    }
    this.activeNode = nextNode;
  }

  getEnabledItems(items) {
    if (!items) return [];
    return items.filter((item) => {
      try {
        return (item.cond === undefined || items.cond === null || item.cond.trim() === ''
          || this.conditionParser.evaluate(item.cond));
      } catch (e) {
        throw new Error(`Error parsing condition: ${item.cond} (${this.activeNode.id}:${this.dialogue.root.id}): ${e.message}`);
      }
    });
  }

  setFlags(flags) {
    if (!flags) return;
    flags.forEach((flag) => {
      this.context.setFlag(flag);
    });
  }

  /**
   * Jumps to the next node when the active node is of type 'first'
   *
   * @private
   * @returns {boolean} true if the transition to the next node was successful.
   */
  nextOnFirst() {
    const matchingItems = this.getEnabledItems(this.activeNode.items);
    this.activeNode = matchingItems.length > 0 ? matchingItems[0] : null;
    return true;
  }

  /**
   * Jumps to the next node when the active node is of type 'sequence'
   *
   * @private
   * @returns {boolean} true if the transition to the next node was successful.
   */
  nextOnSequence() {
    const matchingItems = this.getEnabledItems(this.activeNode.items);
    if (matchingItems.length > 0) {
      [this.activeNode] = matchingItems;
      return true;
    }
    return false;
  }

  /**
   * Jumps to the next node when the active node is of type 'random'
   *
   * @private
   * @returns {boolean} true if the transition to the next node was successful.
   */
  nextOnRandom() {
    const matchingItems = this.getEnabledItems(this.activeNode.items);
    if (matchingItems.length > 0) {
      const index = this.context.random(matchingItems.length);
      this.activeNode = matchingItems[index];
      return true;
    }
    return false;
  }

  /**
   * Jumps to the next node when the active node is of type 'statement'
   *
   * @private
   * @returns {boolean} true if the transition to the next node was successful.
   */
  nextOnStatement() {
    if (this.activeNode.then) {
      this.goTo(this.activeNode.then);
      return true;
    }
    return false;
  }

  /**
   * Jumps to the next node by traversing the parent nodes.
   *
   * @private
   * @returns {boolean} true if the transition to the next node was successful.
   */
  nextThroughParent() {
    let currentParent = this.activeNode.parent;
    let currentChild = this.activeNode;
    while (currentParent) {
      if (currentParent.type === 'sequence') {
        const matchingItems = this.getEnabledItems(currentParent.items);
        const index = matchingItems.indexOf(currentChild);
        if (index < matchingItems.length - 1) {
          this.activeNode = matchingItems[index + 1];
          return true;
        }
      }
      if (currentParent.then) {
        this.goTo(currentParent.then);
        return true;
      }
      currentChild = currentParent;
      currentParent = currentParent.parent;
    }
    return false;
  }
}

module.exports = DialogueIterator;


/***/ }),

/***/ "./src/js/lib/dialogues/dialogue-overlay.js":
/*!**************************************************!*\
  !*** ./src/js/lib/dialogues/dialogue-overlay.js ***!
  \**************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

const EventEmitter = __webpack_require__(/*! events */ "./node_modules/events/events.js");
const DialogueBalloon = __webpack_require__(/*! ./dialogue-balloon */ "./src/js/lib/dialogues/dialogue-balloon.js");
const SpeechText = __webpack_require__(/*! ./speech-text */ "./src/js/lib/dialogues/speech-text.js");

class DialogueOverlay {
  constructor(config) {
    this.config = config;
    this.events = new EventEmitter();

    this.$element = $('<div></div>')
      .addClass('dialogue-overlay');

    this.balloonTop = new DialogueBalloon(['balloon-speech', 'top']);
    this.$element.append(this.balloonTop.$element);

    this.balloonBottom = new DialogueBalloon(['bottom']);
    this.$element.append(this.balloonBottom.$element);

    this.speechTop = new SpeechText();
    this.balloonTop.append(this.speechTop.$element);
    this.speechTop.events.on('complete', () => {
      this.events.emit('speechComplete');
    });

    this.responseOptions = [];
    this.selectedOption = 0;
  }

  play(dialogue) {

  }

  showSpeech(text) {
    this.balloonTop.show();
    this.hidePressToContinue();
    this.speechTop.showText([{ string: text }]);
  }

  speedUpSpeech() {
    this.speechTop.speedUp();
  }

  showResponseOptions(options) {
    this.balloonBottom.empty();
    this.balloonBottom.show();

    this.selectedOption = 0;
    this.responseOptions = Object.entries(options).map(([id, text], i) => ({
      id,
      text,
      element: $('<div></div>')
        .addClass('response-option')
        .toggleClass('selected', i === this.selectedOption)
        .append($('<span></span>').addClass('text').html(text))
        .appendTo(this.balloonBottom.$element),
    }));
  }

  hideSpeech() {
    this.balloonTop.hide();
  }

  hideResponseOptions() {
    this.balloonBottom.hide();
  }

  hide() {
    this.hideSpeech();
    this.hideResponseOptions();
  }

  selectResponseOption(index) {
    this.selectedOption = Math.max(Math.min(index, this.responseOptions.length - 1), 0);
    this.responseOptions.forEach((option, i) => option.element
      .toggleClass('selected', i === this.selectedOption));
  }

  selectNextResponseOption() {
    this.selectResponseOption(this.selectedOption + 1);
  }

  selectPreviousResponseOption() {
    this.selectResponseOption(this.selectedOption - 1);
  }

  getSelectedResponseId() {
    return this.responseOptions[this.selectedOption].id;
  }

  showPressToContinue() {
    this.balloonTop.showPressToContinue();
  }

  hidePressToContinue() {
    this.balloonTop.hidePressToContinue();
  }
}

module.exports = DialogueOverlay;


/***/ }),

/***/ "./src/js/lib/dialogues/dialogue-sequencer-states.js":
/*!***********************************************************!*\
  !*** ./src/js/lib/dialogues/dialogue-sequencer-states.js ***!
  \***********************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "DialogueSequencerResponseState": () => (/* binding */ DialogueSequencerResponseState),
/* harmony export */   "DialogueSequencerState": () => (/* binding */ DialogueSequencerState),
/* harmony export */   "DialogueSequencerTextState": () => (/* binding */ DialogueSequencerTextState),
/* harmony export */   "DialogueSequencerThenTextState": () => (/* binding */ DialogueSequencerThenTextState)
/* harmony export */ });
class DialogueSequencerState {
  constructor(dialogueSequencer) {
    this.dialogueSequencer = dialogueSequencer;
    this.dialogueOverlay = dialogueSequencer.dialogueOverlay;
    this.dialogueIterator = dialogueSequencer.dialogueIterator;
    this.activeNode = this.dialogueIterator.getActiveNode();
  }

  onBegin() {

  }

  onAction() {

  }
}

class DialogueSequencerThenTextState extends DialogueSequencerState {
  constructor(dialogueSequencer, responseId) {
    super(dialogueSequencer);
    this.responseId = responseId;
  }

  onBegin() {
    this.speechDone = false;
    const response = this.dialogueIterator.getResponse(this.responseId);
    this.dialogueOverlay.showSpeech(response.thenText);
    this.dialogueOverlay.events.once('speechComplete', () => {
      this.speechDone = true;
      this.dialogueOverlay.showPressToContinue();
    });
  }

  onAction() {
    if (this.speechDone) {
      this.dialogueOverlay.hideSpeech();
      this.dialogueSequencer.endUi(this.responseId);
    } else {
      this.dialogueOverlay.speedUpSpeech();
    }
  }
}

class DialogueSequencerResponseState extends DialogueSequencerState {
  constructor(dialogueSequencer) {
    super(dialogueSequencer);
    this.responses = this.dialogueIterator.getEnabledResponses();
  }

  onBegin() {
    this.dialogueOverlay.showResponseOptions(
      Object.fromEntries(this.responses.map((response) => [response.id, response.text]))
    );
  }

  onAction() {
    this.dialogueOverlay.hideResponseOptions();
    this.dialogueOverlay.hideSpeech();
    const responseId = this.dialogueOverlay.getSelectedResponseId();
    const selectedResponse = this.dialogueIterator.getResponse(responseId);
    if (selectedResponse.thenText) {
      this.dialogueSequencer.setUiState(
        new DialogueSequencerThenTextState(this.dialogueSequencer, responseId)
      );
    } else {
      this.dialogueSequencer.endUi(responseId);
    }
  }
}

class DialogueSequencerTextState extends DialogueSequencerState {

  onBegin() {
    this.speechDone = false;
    this.dialogueOverlay.showSpeech(this.activeNode.text);
    this.dialogueOverlay.events.once('speechComplete', () => {
      this.speechDone = true;
      const responses = this.dialogueIterator.getEnabledResponses();
      if (responses && responses.length > 0) {
        this.dialogueSequencer.setUiState(
          new DialogueSequencerResponseState(this.dialogueSequencer)
        );
      } else {
        this.dialogueOverlay.showPressToContinue();
      }
    });
  }

  onAction() {
    if (this.speechDone) {
      this.dialogueOverlay.hideSpeech();
      this.dialogueSequencer.endUi();
    } else {
      this.dialogueOverlay.speedUpSpeech();
    }
  }
}


/***/ }),

/***/ "./src/js/lib/dialogues/dialogue-sequencer.js":
/*!****************************************************!*\
  !*** ./src/js/lib/dialogues/dialogue-sequencer.js ***!
  \****************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

const EventEmitter = __webpack_require__(/*! events */ "./node_modules/events/events.js");
const DialogueIterator = __webpack_require__(/*! ./dialogue-iterator */ "./src/js/lib/dialogues/dialogue-iterator.js");
const { DialogueSequencerTextState } = __webpack_require__(/*! ./dialogue-sequencer-states */ "./src/js/lib/dialogues/dialogue-sequencer-states.js");

class DialogueSequencer {
  constructor(dialogueOverlay) {
    this.dialogueOverlay = dialogueOverlay;
    this.dialogue = null;
    this.dialogueIterator = null;
    this.uiState = null;

    this.events = new EventEmitter();
  }

  setUiState(state) {
    this.uiState = state;
    this.uiState.onBegin();
  }

  endUi(responseId = null) {
    this.uiState = null;
    if (responseId !== null) {
      this.dialogueIterator.nextWithResponse(responseId);
    } else {
      this.dialogueIterator.next();
    }
    this.runUntilInteractivity();
  }

  play(dialogue) {
    const flags = {};
    this.dialogue = dialogue;
    this.dialogueIterator = new DialogueIterator(dialogue, {
      random: max => Math.floor(Math.random() * max),
      hasFlag: flag => flags[flag] !== undefined,
      setFlag: (flag) => { flags[flag] = true; return true; },
    });
    this.runUntilInteractivity();
  }

  runUntilInteractivity() {
    const { dialogueIterator } = this;

    if (!this.handledByUI(dialogueIterator.getActiveNode())) {
      do {
        dialogueIterator.next();
      } while (!dialogueIterator.isEnd() && !this.handledByUI(dialogueIterator.getActiveNode()));
    }

    if (this.handledByUI(dialogueIterator.getActiveNode())) {
      this.setUiState(new DialogueSequencerTextState(this));
    } else {
      this.onDialogueEnd();
    }
  }

  onDialogueEnd() {
    this.dialogueOverlay.hide();
    this.events.emit('end');
  }

  action() {
    if (this.uiState) {
      this.uiState.onAction();
    }
  }

  handledByUI(node) {
    return node && node.type === 'statement';
  }
}

module.exports = DialogueSequencer;


/***/ }),

/***/ "./src/js/lib/dialogues/logic-parser.js":
/*!**********************************************!*\
  !*** ./src/js/lib/dialogues/logic-parser.js ***!
  \**********************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

const { ExpressionParser } = __webpack_require__(/*! expressionparser */ "./node_modules/expressionparser/dist/index.js");
const DialogueSchema = __webpack_require__(/*! ../../../../specs/dialogue.schema.json */ "./specs/dialogue.schema.json");

class LogicParser {
  constructor(context) {
    this.context = context;

    this.language = {
      INFIX_OPS: {
        // '<': (a, b) => (a() < b()),
        // '>': (a, b) => (a() > b()),
        // '=': (a, b) => (a() === b()),
        // '!=': (a, b) => (a() !== b()),
        // '>=': (a, b) => (a() >= b()),
        // '<=': (a, b) => (a() <= b()),
        '&': (a, b) => (a() && b()),
        '|': (a, b) => (a() || b()),
      },
      PREFIX_OPS: {
        '^': a => !a(),
      },
      AMBIGUOUS: {},
      PRECEDENCE: [['^'], /* ['<', '>', '>=', '<='], ['=', '!='], */ ['&', '|']],
      GROUP_OPEN: '(',
      GROUP_CLOSE: ')',
      SEPARATOR: ' ',
      SYMBOLS: [/* '<', '>', '=', '!=', '>=', '<=', */'&', '|', '^', '(', ')'],
      termDelegate: this.evaluateTerm.bind(this),
      isCaseInsensitive: false,
    };

    this.parser = new ExpressionParser(this.language);
  }

  evaluate(expression) {
    const stack = this.parser.expressionToRpn(expression);
    const result = this.parser.rpnToValue(stack);
    // return this.parser.expressionToValue(expression);
    if (stack.length !== 0) {
      throw new Error(`Unexpected token "${stack[stack.length - 1]}"`);
    }
    return result;
  }

  static isValidLiteral(term) {
    return term[0] >= '0' && term[0] <= '9';
  }

  static isValidFlag(term) {
    const regExp = new RegExp(DialogueSchema.definitions.flag_id.pattern);
    return regExp.test(term);
  }

  evaluateTerm(term) {
    if (LogicParser.isValidLiteral(term)) {
      return parseInt(term, 10);
    }
    if (LogicParser.isValidFlag(term)) {
      return this.context.hasFlag(term) || false;
    }
    throw new Error(`Invalid term: ${term}`);
  }
}

module.exports = LogicParser;


/***/ }),

/***/ "./src/js/lib/dialogues/speech-text.js":
/*!*********************************************!*\
  !*** ./src/js/lib/dialogues/speech-text.js ***!
  \*********************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

/**
 * Copyright (c) 2023 by Drew Conley (https://codepen.io/punkydrewster713/pen/zYKdywP)
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software
 * and associated documentation files (the "Software"), to deal in the Software without restriction,
 * including without limitation the rights to use, copy, modify, merge, publish, distribute,
 * sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all copies or
 * substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING
 * BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
 * DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 *
 * Modified by Eric Londaits for IMAGINARY gGmbH.
 * Copyright (c) 2023 IMAGINARY gGmbH
 */
const EventEmitter = __webpack_require__(/*! events */ "./node_modules/events/events.js");

class SpeechText {
  constructor() {
    this.$element = $('<div></div>')
      .addClass('speech-text');

    this.isSpace = /\s/;
    this.timedReveal = this.timedReveal.bind(this);
    this.revealCharacterTimeout = null;
    this.events = new EventEmitter();
    this.speedFactor = 1;
  }

  /**
   * Private method to reveal a character
   *
   * @private
   * @param {Object} character
   * @param {HTMLElement} character.span
   * @param {Array} character.classes
   */
  revealCharacter(character) {
    character.span.classList.add('revealed');
    character.classes.forEach((c) => {
      character.span.classList.add(c);
    });
  }

  /**
   * Private method to reveal a list of characters with a delay between each
   *
   * @private
   * @param {Array} Array of characters with the following properties:
   * - span {HTMLElement} The span element to be revealed
   * - isSpace {Boolean} Whether or not the character is a space
   * - delayAfter {Number} Delay after the character is revealed
   * - classes {Array} Array of classes to be added to the character
   * - stop {Boolean} Whether or not to stop after the character
   */
  timedReveal(list) {
    const next = list.splice(0, 1)[0];
    this.revealCharacter(next);
    const delay = next.isSpace && !next.pause ? 0 : next.delayAfter;

    if (list.length > 0) {
      this.revealCharacterTimeout = setTimeout(() => {
        this.timedReveal(list);
      }, delay * this.speedFactor);
    } else {
      this.events.emit('complete');
    }
  }

  /**
   * Set the text to be displayed
   *
   * @param lines {Array} Array of objects with the following properties:
   * - speed {Number} (optional) Speed of the text in milliseconds
   * - string {String} Text to be displayed
   * - classes {Array} (optional) Array of classes to be added to the text
   * - stop {Boolean} (optional) Whether or not to stop after the line
   */
  showText(lines) {
    this.clear();

    this.characters = [];
    lines.forEach((line, index) => {
      if (index < lines.length - 1) {
        line.string += ' '; // Add a space between lines
      }
      line.string.split('').forEach((character) => {
        const span = document.createElement('span');
        span.textContent = character;
        this.$element.append(span);
        this.characters.push({
          span,
          isSpace: this.isSpace.test(character) && !line.pause,
          delayAfter: line.speed || SpeechText.Speeds.normal,
          classes: line.classes || [],
        });
      });
    });

    this.resume();
  }

  /**
   * Stop the reveal of the text
   */
  stop() {
    clearTimeout(this.revealCharacterTimeout);
    this.speedFactor = 1;
  }

  /**
   * Resume the reveal of the text
   */
  resume() {
    clearTimeout(this.revealCharacterTimeout);
    this.revealCharacterTimeout = setTimeout(() => {
      this.timedReveal(this.characters);
    }, 600);
  }

  /**
   * Clear the text
   */
  clear() {
    this.stop();
    this.$element.empty();
  }

  /**
   * Reveal all characters immediately
   */
  revealAll() {
    this.stop();
    this.characters.forEach((c) => {
      this.revealCharacter(c);
    });
    this.events.emit('complete');
  }

  speedUp() {
    this.speedFactor = 0.2;
  }
}

SpeechText.Speeds = {
  pause: 500,
  slow: 120,
  normal: 60,
  fast: 40,
  superFast: 10,
};

module.exports = SpeechText;


/***/ }),

/***/ "./src/js/lib/helpers-web/fill-with-aspect.js":
/*!****************************************************!*\
  !*** ./src/js/lib/helpers-web/fill-with-aspect.js ***!
  \****************************************************/
/***/ (() => {

/**
 * A jQuery plugin that resizes the given element to fit its parent element while
 * maintaining the specified aspect ratio.
 *
 * @param element {HTMLElement} The element to resize.
 * @param aspectRatio {number} The aspect ratio to keep.
 */
(function ($) {
  $.fn.fillWithAspect = function (aspectRatio) {
    const $parent = this.parent();
    const parentWidth = $parent.width();
    const parentHeight = $parent.height();
    const parentAspect = parentWidth / parentHeight;
    if (parentAspect > aspectRatio) {
      this.width(parentHeight * aspectRatio);
      this.height(parentHeight);
    } else {
      this.width(parentWidth);
      this.height(parentWidth / aspectRatio);
    }

    return this;
  };
}(jQuery));


/***/ }),

/***/ "./src/js/lib/helpers-web/stats.js":
/*!*****************************************!*\
  !*** ./src/js/lib/helpers-web/stats.js ***!
  \*****************************************/
/***/ ((module) => {

/**
 * Based on https://github.com/mrdoob/stats.js
 * Copyright (c) 2009-2016 stats.js authors
 * Licensed under the The MIT License
 *
 * adapted by Eric Londaits for IMAGINARY gGmbH (c) 2023
 */

const PR = Math.round(window.devicePixelRatio || 1);
const WIDTH = 80 * PR;
const HEIGHT = 48 * PR;
const TEXT_X = 3 * PR;
const TEXT_Y = 2 * PR;
const GRAPH_X = 3 * PR;
const GRAPH_Y = 15 * PR;
const GRAPH_WIDTH = 74 * PR;
const GRAPH_HEIGHT = 30 * PR;

class Panel {
  constructor(name, fg, bg) {
    this.name = name;
    this.fg = fg;
    this.bg = bg;

    this.min = Infinity;
    this.max = 0;

    this.canvas = document.createElement('canvas');
    this.canvas.width = WIDTH;
    this.canvas.height = HEIGHT;
    this.canvas.style.cssText = 'width:80px;height:48px';

    this.context = this.canvas.getContext('2d');
    this.context.font = `bold ${9 * PR}px Helvetica,Arial,sans-serif`;
    this.context.textBaseline = 'top';
    this.context.fillStyle = this.bg;
    this.context.fillRect(0, 0, WIDTH, HEIGHT);
    this.context.fillStyle = this.fg;
    this.context.fillText(this.name, TEXT_X, TEXT_Y);
    this.context.fillRect(GRAPH_X, GRAPH_Y, GRAPH_WIDTH, GRAPH_HEIGHT);
    this.context.fillStyle = this.bg;
    this.context.globalAlpha = 0.9;
    this.context.fillRect(GRAPH_X, GRAPH_Y, GRAPH_WIDTH, GRAPH_HEIGHT);

    this.dom = this.canvas;
  }

  update(value, maxValue) {
    this.min = Math.min(this.min, value);
    this.max = Math.max(this.max, value);

    this.context.fillStyle = this.bg;
    this.context.globalAlpha = 1;
    this.context.fillRect(0, 0, WIDTH, GRAPH_Y);
    this.context.fillStyle = this.fg;
    this.context.fillText(`${Math.round(value)} ${this.name} (${Math.round(this.min)}-${Math.round(this.max)})`,
      TEXT_X,
      TEXT_Y);

    this.context.drawImage(this.canvas,
      GRAPH_X + PR,
      GRAPH_Y,
      GRAPH_WIDTH - PR,
      GRAPH_HEIGHT,
      GRAPH_X,
      GRAPH_Y,
      GRAPH_WIDTH - PR,
      GRAPH_HEIGHT);

    this.context.fillRect(GRAPH_X + GRAPH_WIDTH - PR, GRAPH_Y, PR, GRAPH_HEIGHT);
    this.context.fillStyle = this.bg;
    this.context.globalAlpha = 0.9;
    this.context.fillRect(GRAPH_X + GRAPH_WIDTH - PR,
      GRAPH_Y,
      PR,
      Math.round((1 - (value / maxValue)) * GRAPH_HEIGHT));
  }
}

class Stats {
  constructor() {
    this.currentPanel = null;
    this.container = document.createElement('div');
    this.container.style.cssText = 'position:fixed;top:0;left:0;cursor:pointer;opacity:0.9;z-index:10000';
    this.container.addEventListener('click', (event) => {
      event.preventDefault();
      this.togglePanel(false);
    });
    this.dom = this.container;

    this.beginTime = (performance || Date).now();
    this.prevTime = this.beginTime;
    this.frames = 0;

    this.lastPingTime = (performance || Date).now();
    this.maxPing = 0;
    this.pingElapsedTime = 0;

    this.panels = new Map();

    this.fpsPanel = this.addPanel('fps', new Panel('fps', '#0ff', '#002'));
    this.msPanel = this.addPanel('render', new Panel('ms', '#0f0', '#020'));
    this.pingPanel = this.addPanel('ping', new Panel('ping', '#fffb13', '#020'));

    this.showPanel(0);
  }

  addPanel(id, panel) {
    this.panels.set(id, panel);
    this.container.appendChild(panel.dom);
    return panel;
  }

  showPanel(id = null) {
    this.currentPanel = null;
    Array.from(this.panels.entries())
      .forEach(([panelId, panel], index) => {
        if (panelId === id) {
          panel.dom.style.display = 'block';
          this.currentPanel = index;
        } else {
          panel.dom.style.display = 'none';
        }
      });
  }

  showPanelNumber(index = null) {
    const panelId = Array.from(this.panels.keys())
      .find((id, i) => i === index);
    this.showPanel(panelId === undefined ? null : panelId);
  }

  togglePanel(hideAfterLast = true) {
    if (this.currentPanel === null) {
      this.currentPanel = 0;
    } else {
      this.currentPanel += 1;
      if (this.currentPanel === this.container.children.length) {
        this.currentPanel = hideAfterLast ? null : 0;
      }
    }
    this.showPanelNumber(this.currentPanel);
  }

  frameBegin() {
    this.beginTime = (performance || Date).now();
  }

  frameEnd() {
    this.frames += 1;
    const time = (performance || Date).now();
    this.msPanel.update(time - this.beginTime, 200);

    if (time >= this.prevTime + 1000) {
      this.fpsPanel.update((this.frames * 1000) / (time - this.prevTime), 100);
      this.prevTime = time;
      this.frames = 0;
    }
    return time;
  }

  ping() {
    const time = (performance || Date).now();
    const ping = time - this.lastPingTime;
    this.lastPingTime = time;
    this.maxPing = Math.max(this.maxPing, ping);
    this.pingElapsedTime += ping;
    if (this.pingElapsedTime >= 1000) {
      this.pingPanel.update(this.maxPing, 1000);
      this.pingElapsedTime = 0;
      this.maxPing = 0;
    }
  }

  update() {
    this.beginTime = this.frameEnd();
  }
}

Stats.Panel = Panel;

module.exports = Stats;


/***/ }),

/***/ "./src/js/lib/helpers/clone.js":
/*!*************************************!*\
  !*** ./src/js/lib/helpers/clone.js ***!
  \*************************************/
/***/ ((module) => {

function clone(object) {
  return JSON.parse(JSON.stringify(object));
}

module.exports = clone;


/***/ }),

/***/ "./src/js/lib/input/gamepad-input-mgr.js":
/*!***********************************************!*\
  !*** ./src/js/lib/input/gamepad-input-mgr.js ***!
  \***********************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

const deepmerge = __webpack_require__(/*! deepmerge */ "./node_modules/deepmerge/dist/cjs.js");

const InputMgr = __webpack_require__(/*! ./input-mgr */ "./src/js/lib/input/input-mgr.js");

/**
 * @typedef {{axes?:{InputMgrEventNames:number},buttons?:{InputMgrEventNames:number}}} GamepadMapperConfig
 */

/**
 * Gamepad configuration for standard gamepads.
 *
 * @type {GamepadMapperConfig}
 */
const standardMapperConfig = {
  axes: {
    up: -1,
    down: 1,
    left: -0,
    right: 0,
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
 * Handles gamepad and joystick input from the first available device.
 *
 * @augments InputMgr
 */
class GamepadInputMgr extends InputMgr {
  /**
   * @param {GamepadMapperConfig} [mapperConfig]
   */
  constructor(mapperConfig = {}) {
    super();
    console.log(
      mapperConfig,
      deepmerge(standardMapperConfig, mapperConfig ?? {}),
    );
    this.mapper = new GamepadMapper(
      deepmerge(standardMapperConfig, mapperConfig ?? {}),
    );
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
      typeof config?.axes?.[key] !== 'undefined'
        ? GamepadMapper.createGrabberForAxis(config.axes[key])
        : () => false;
    const fromButton =
      typeof config?.buttons?.[key] !== 'undefined'
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

module.exports = GamepadInputMgr;


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


/***/ }),

/***/ "./src/js/lib/input/multiplex-input-mgr.js":
/*!*************************************************!*\
  !*** ./src/js/lib/input/multiplex-input-mgr.js ***!
  \*************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

const InputMgr = __webpack_require__(/*! ./input-mgr */ "./src/js/lib/input/input-mgr.js");

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


/***/ }),

/***/ "./src/js/lib/input/player-app-input-connections.js":
/*!**********************************************************!*\
  !*** ./src/js/lib/input/player-app-input-connections.js ***!
  \**********************************************************/
/***/ ((module) => {

class DialogueOverlayConnection {
  constructor(inputManager, dialogueOverlay, dialogueSequencer) {
    this.inputManager = inputManager;
    this.dialogueOverlay = dialogueOverlay;
    this.dialogueSequencer = dialogueSequencer;

    this.handleUp = this.handleUp.bind(this);
    this.handleDown = this.handleDown.bind(this);
    this.handleAction = this.handleAction.bind(this);
  }

  route() {
    this.inputManager.events.on('down', this.handleDown);
    this.inputManager.events.on('up', this.handleUp);
    this.inputManager.events.on('action', this.handleAction);
  }

  unroute() {
    this.inputManager.events.off('down', this.handleDown);
    this.inputManager.events.off('up', this.handleUp);
    this.inputManager.events.off('action', this.handleAction);
  }

  handleDown() {
    this.dialogueOverlay.selectNextResponseOption();
  }

  handleUp() {
    this.dialogueOverlay.selectPreviousResponseOption();
  }

  handleAction() {
    this.dialogueSequencer.action();
  }
}

class PcMovementConnection {
  constructor(inputManager, playerApp) {
    this.inputManager = inputManager;
    this.playerApp = playerApp;
  }

  route() {
    this.playerApp.enablePcControl();
  }

  unroute() {
    this.playerApp.disablePcControl();
  }
}

module.exports = {
  DialogueOverlayConnection,
  PcMovementConnection,
};


/***/ }),

/***/ "./src/js/lib/input/player-app-input-router.js":
/*!*****************************************************!*\
  !*** ./src/js/lib/input/player-app-input-router.js ***!
  \*****************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

const { DialogueOverlayConnection, PcMovementConnection } = __webpack_require__(/*! ./player-app-input-connections */ "./src/js/lib/input/player-app-input-connections.js");

class PlayerAppInputRouter {
  constructor(inputManager) {
    this.inputManager = inputManager;
    this.currentConnection = null;
  }

  setConnection(connection) {
    if (this.currentConnection) {
      this.currentConnection.unroute();
    }
    this.currentConnection = connection;
    this.currentConnection.route();
  }

  routeToPcMovement(playerApp) {
    this.setConnection(new PcMovementConnection(this.inputManager, playerApp));
  }

  routeToDialogueOverlay(dialogueOverlay, dialogueSequencer) {
    this.setConnection(new DialogueOverlayConnection(this.inputManager, dialogueOverlay, dialogueSequencer));
  }
}

module.exports = PlayerAppInputRouter;


/***/ }),

/***/ "./src/js/lib/loader/show-fatal-error.js":
/*!***********************************************!*\
  !*** ./src/js/lib/loader/show-fatal-error.js ***!
  \***********************************************/
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

/***/ "./src/js/lib/model/player-character.js":
/*!**********************************************!*\
  !*** ./src/js/lib/model/player-character.js ***!
  \**********************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

const clone = __webpack_require__(/*! ../helpers/clone */ "./src/js/lib/helpers/clone.js");

class PlayerCharacter {
  constructor(config, id) {
    this.config = config;
    this.id = id;
    if (this.config.players[this.id] === undefined) {
      throw new Error(`Attempted to initialize a player with id ${this.id}, which was not found in the config`);
    }
    this.props = clone(this.config.players[this.id]);

    this.position = { x: 0, y: 0 };
    this.speed = { x: 0, y: 0 };
    this.direction = 'e';
    this.setPosition(this.props.spawn.x, this.props.spawn.y);
  }

  setPosition(x, y) {
    this.position.x = x;
    this.position.y = y;
  }

  setSpeed(x, y) {
    this.speed.x = x;
    this.speed.y = y;
  }

  setDirection(direction) {
    this.direction = direction;
  }
}

module.exports = PlayerCharacter;


/***/ }),

/***/ "./src/js/lib/net/connection-state-view.js":
/*!*************************************************!*\
  !*** ./src/js/lib/net/connection-state-view.js ***!
  \*************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

const icon = __webpack_require__(/*! ../../../../static/fa/broadcast-tower-solid.svg */ "./static/fa/broadcast-tower-solid.svg");

class ConnectionStateView {
  constructor(connector) {
    this.$element = $('<div></div>')
      .addClass('connection-state-view');

    this.$icon = $('<img>')
      .attr('src', icon)
      .addClass('connection-state-view-icon')
      .appendTo(this.$element);

    this.$errorMessage = $('<div></div>')
      .addClass('connection-state-view-error text-danger')
      .appendTo(this.$element);
    this.$errorStatus = $('<div></div>')
      .addClass('connection-state-view-status')
      .appendTo(this.$element);

    connector.events.on('closing', this.handleClosing.bind(this));
    connector.events.on('disconnect', this.handleDisconnect.bind(this));
    connector.events.on('connectWait', this.handleConnectWait.bind(this));
    connector.events.on('connecting', this.handleConnecting.bind(this));
    connector.events.on('connect', this.handleConnect.bind(this));
  }

  show() {
    this.$element.addClass('visible');
  }

  hide() {
    this.$element.removeClass('visible');
  }

  setErrorMessage(message) {
    this.$errorMessage.html(message);
  }

  setErrorStatus(status) {
    this.$errorStatus.html(status);
  }

  handleClosing() {
    this.setErrorMessage('Retrying connection');
    this.setErrorStatus('');
    this.show();
  }

  handleDisconnect() {
    this.setErrorMessage('Disconnected from server');
    this.setErrorStatus('');
    this.show();
  }

  handleConnectWait() {
    this.setErrorStatus('Waiting to reconnect...');
  }

  handleConnecting() {
    this.setErrorStatus('Connecting...');
  }

  handleConnect() {
    this.hide();
  }
}

module.exports = ConnectionStateView;


/***/ }),

/***/ "./src/js/lib/net/server-socket-connector.js":
/*!***************************************************!*\
  !*** ./src/js/lib/net/server-socket-connector.js ***!
  \***************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

/* eslint-disable no-console */
const EventEmitter = __webpack_require__(/*! events */ "./node_modules/events/events.js");

const PING_TIME = 1000 * 10;
const PONG_WAIT_TIME = 1000 * 10;
const RECONNECT_TIME = 1000 * 5;

class ServerSocketConnector {
  constructor(uri) {
    this.uri = uri;
    this.ws = null;
    this.connected = false;
    // Must track isClosing because the socket might enter CLOSING state and not close immediately
    this.isClosing = false;
    this.events = new EventEmitter();
    this.pingTimeout = null;
    this.pongTimeout = null;
    this.reconnectTimeout = null;
    this.connect();
  }

  connect() {
    this.cancelPing();
    this.cancelReconnect();

    this.events.emit('connecting');
    console.log(`Connecting to ${this.uri}...`);
    this.ws = new WebSocket(this.uri);
    this.ws.onopen = this.handleOpen.bind(this);
    this.ws.onclose = this.handleClose.bind(this);
    this.ws.onmessage = this.handleMessage.bind(this);
    // ws.onerror is not handled because the event gives no data about the
    // error, and on a connection failure onclose will be called.

    this.connected = false;
  }

  cancelReconnect() {
    if (this.reconnectTimeout !== null) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
  }

  reconnect() {
    this.cancelReconnect();
    this.reconnectTimeout = setTimeout(() => {
      this.reconnectTimeout = null;
      this.connect();
    }, RECONNECT_TIME);
    this.events.emit('connectWait');
    console.log(`Will attempt to reconnect in ${RECONNECT_TIME / 1000} seconds...`);
  }

  handleOpen() {
    this.cancelReconnect();
    this.cancelPongTimeout();

    this.connected = true;
    this.isClosing = false;
    console.log('Connected.');
    this.events.emit('connect');
    this.schedulePing();
  }

  handleClose(ev) {
    this.connected = false;
    this.isClosing = false;
    this.cancelPing();
    this.cancelPongTimeout();
    // ev.code is defined here https://developer.mozilla.org/en-US/docs/Web/API/CloseEvent
    // but according to people the only code one normally gets is 1006 (Abnormal Closure)
    console.error(
      `Disconnected with code ${ev.code}`,
      ev.code === 1006 ? ': Abnormal closure' : '',
      ev.reason ? `(reason: ${ev.reason})` : ''
    );
    this.events.emit('disconnect');
    this.reconnect();
  }

  handleMessage(ev) {
    const message = JSON.parse(ev.data);
    if (message.type === 'sync') {
      this.handleSync(message);
    } else if (message.type === 'pong') {
      this.handlePong();
    }
  }

  handleSync(message) {
    this.events.emit('sync', message);
  }

  handlePong() {
    this.cancelPongTimeout();
    this.schedulePing();
  }

  send(data) {
    const message = typeof data === 'string' ? { type: data } : data;
    this.ws.send(JSON.stringify(message));
  }

  cancelPing() {
    if (this.pingTimeout !== null) {
      clearTimeout(this.pingTimeout);
      this.pingTimeout = null;
    }
  }

  schedulePing() {
    this.cancelPing();
    this.pingTimeout = setTimeout(() => {
      this.pingTimeout = null;
      this.ping();
    }, PING_TIME);
  }

  cancelPongTimeout() {
    if (this.pongTimeout !== null) {
      clearTimeout(this.pongTimeout);
      this.pongTimeout = null;
    }
  }

  startPongTimeout() {
    this.cancelPongTimeout();
    this.pongTimeout = setTimeout(() => {
      this.pongTimeout = null;
      console.warn(`PONG not received after ${PONG_WAIT_TIME / 1000} seconds`);
      console.warn('Closing connection');
      if (!this.isClosing) {
        this.isClosing = true;
        this.events.emit('closing');
      }
      this.ws.close();
    }, PONG_WAIT_TIME);
  }

  ping() {
    this.send('ping');
    this.startPongTimeout();
  }

  sync(player = null) {
    const message = {
      type: 'sync',
    };
    if (player !== null) {
      message.players = Object.fromEntries([[player.id,
        {
          position: player.position,
          speed: player.speed,
        },
      ]]);
    }
    this.send(message);
  }
}

module.exports = ServerSocketConnector;


/***/ }),

/***/ "./src/js/lib/net/server-url.js":
/*!**************************************!*\
  !*** ./src/js/lib/net/server-url.js ***!
  \**************************************/
/***/ ((module) => {

function withLeadingSlash(str) {
  return str[0] === '/' ? str : `/${str}`;
}

function withTrailingSlash(str) {
  return str[str.length - 1] === '/' ? str : `${str}/`;
}

function withTrailingColon(str) {
  return str[str.length - 1] === ':' ? str : `${str}:`;
}

function getApiServerUrl() {
  const protocol = withTrailingColon("MISSING_ENV_VAR".API_SERVER_PROTOCOL || window.location.protocol);
  const host = "MISSING_ENV_VAR".API_SERVER_HOST || window.location.hostname;
  const port = "4850" || 0;
  const root = withTrailingSlash(withLeadingSlash("MISSING_ENV_VAR".API_SERVER_ROOT || '/'));

  return `${protocol}//${host}:${port}${root}`;
}

function getSocketServerUrl() {
  const protocol = withTrailingColon("MISSING_ENV_VAR".SOCKET_SERVER_PROTOCOL || 'ws');
  const host = "MISSING_ENV_VAR".SOCKET_SERVER_HOST || window.location.hostname;
  const port = "4850" || 0;
  const root = withTrailingSlash(withLeadingSlash("MISSING_ENV_VAR".SOCKET_SERVER_ROOT || '/'));

  return `${protocol}//${host}:${port}${root}`;
}

module.exports = {
  getApiServerUrl,
  getSocketServerUrl,
};


/***/ }),

/***/ "./src/js/lib/views/pc-view.js":
/*!*************************************!*\
  !*** ./src/js/lib/views/pc-view.js ***!
  \*************************************/
/***/ ((module) => {

/* globals PIXI */

class PCView {
  constructor(config, textures, pc, townView) {
    this.config = config;
    this.textures = textures;
    this.pc = pc;
    this.townView = townView;
    this.display = this.createSprite();
    this.direction = 'e';
    this.isWalking = false;
  }

  createSprite() {
    const sprite = new PIXI.AnimatedSprite(this.textures['character-basic'].animations['basic-es']);
    sprite.anchor.set(0, 0);
    sprite.width = PCView.SPRITE_WIDTH;
    sprite.height = PCView.SPRITE_HEIGHT;
    sprite.animationSpeed = PCView.SPRITE_ANIMATION_SPEED;
    sprite.play();
    sprite.position = this.pc.position;

    return sprite;
  }

  updateSprite(oldX, oldY, newX, newY) {
    let updated = false;
    let newDirection = this.direction;
    let newIsWalking = this.isWalking;

    if (newX > oldX) {
      newDirection = 'e';
    } else if (newX < oldX) {
      newDirection = 'w';
    } else if (newY > oldY) {
      newDirection = 's';
    } else if (newY < oldY) {
      newDirection = 'n';
    }

    if (oldX !== newX || oldY !== newY) {
      newIsWalking = true;
    } else {
      newIsWalking = false;
    }

    if (newDirection !== this.direction || newIsWalking !== this.isWalking) {
      const action = newIsWalking ? 'w' : 's';
      this.display.textures = this.textures['character-basic'].animations[`basic-${newDirection}${action}`];
      this.display.play();
      this.direction = newDirection;
      this.isWalking = newIsWalking;
    }
  }

  animate(time) {
    const townDisplay = this.townView.display;
    let newX;
    let newY;
    let furthestX = this.pc.position.x + this.pc.speed.x * time;
    let furthestY = this.pc.position.y + this.pc.speed.y * time;

    // Clamp the position to the town's bounds
    furthestX = Math.max(0, Math.min(furthestX, townDisplay.width - this.display.width));
    furthestY = Math.max(0, Math.min(furthestY, townDisplay.height - this.display.height));

    // Collisions are checked on a per-pixel basis, so we only need to check
    // if the player has moved to a new pixel
    if (Math.floor(furthestX) !== Math.floor(this.pc.position.x)
      || Math.floor(furthestY) !== Math.floor(this.pc.position.y)) {
      // Check for collisions
      const collisionPoints = this.collisionPoints();
      newX = this.pc.position.x;
      newY = this.pc.position.y;
      const deltaX = furthestX - this.pc.position.x;
      const deltaY = furthestY - this.pc.position.y;
      const steps = Math.max(Math.abs(deltaX), Math.abs(deltaY));
      const stepX = deltaX / steps;
      const stepY = deltaY / steps;
      let collidedX = false;
      let collidedY = false;
      for (let i = 0; !(collidedX && collidedY) && i < steps; i += 1) {
        const candidateX = newX + stepX;
        const candidateY = newY + stepY;
        for (let j = 0; !(collidedX && collidedY) && j < collisionPoints.length; j += 1) {
          if (!this.townView.isWalkable(
            Math.floor(newX + collisionPoints[j].x),
            Math.floor(candidateY + collisionPoints[j].y)
          )) {
            collidedY = true;
          }
          if (!this.townView.isWalkable(
            Math.floor(candidateX + collisionPoints[j].x),
            Math.floor(newY + collisionPoints[j].y)
          )) {
            collidedX = true;
          }
          if (!collidedX && !collidedY && !this.townView.isWalkable(
            Math.floor(candidateX + collisionPoints[j].x),
            Math.floor(candidateY + collisionPoints[j].y)
          )) {
            collidedX = true;
            collidedY = true;
          }
        }
        newX = collidedX ? newX : candidateX;
        newY = collidedY ? newY : candidateY;
      }
    } else {
      newX = furthestX;
      newY = furthestY;
    }

    this.updateSprite(this.pc.position.x, this.pc.position.y, newX, newY);
    this.pc.setPosition(newX, newY);
    this.display.position = this.pc.position;
    this.display.zIndex = this.pc.position.y;
  }

  collisionPoints() {
    // The collisions are only checked for two points at the baseline of the PC,
    return [
      {
        x: 0,
        y: this.display.height,
      },
      {
        x: this.display.width,
        y: this.display.height,
      },
    ];
  }
}

PCView.SPRITE_HEIGHT = 156;
PCView.SPRITE_WIDTH = 72;
PCView.SPRITE_ANIMATION_SPEED = 0.3;

module.exports = PCView;


/***/ }),

/***/ "./src/js/lib/views/town-view.js":
/*!***************************************!*\
  !*** ./src/js/lib/views/town-view.js ***!
  \***************************************/
/***/ ((module) => {

/* globals PIXI */
class TownView {
  constructor(config, textures) {
    this.config = config;
    this.textures = textures;
    this.display = new PIXI.Container();
    this.bgLayer = new PIXI.Container();
    this.mainLayer = new PIXI.Container();
    this.display.addChild(this.bgLayer);
    this.display.addChild(this.mainLayer);

    // Temporary initialization
    this.townSize = {
      width: 1024 * 8,
      height: 768 * 6,
    };

    this.background = PIXI.Sprite.from(this.textures['town-bg']);
    this.background.width = this.townSize.width;
    this.background.height = this.townSize.height;
    this.bgLayer.addChild(this.background);

    this.collisionRenderer = new PIXI.CanvasRenderer({
      width: this.townSize.width, height: this.townSize.height,
    });
    this.collisionTree = new PIXI.Container();
    this.baseCollisionMap = PIXI.Sprite.from(this.textures['town-collmap']);
    this.baseCollisionMap.width = this.townSize.width;
    this.baseCollisionMap.height = this.townSize.height;
    this.collisionTree.addChild(this.baseCollisionMap);
    this.collisionTree.renderCanvas(this.collisionRenderer);
    this.collisionMap = this.collisionRenderer.view
      .getContext('2d')
      .getImageData(0, 0, this.townSize.width, this.townSize.height).data;

    window.isWalkable = this.isWalkable.bind(this);
    window.collMap = this.collisionMap;
  }

  async loadAssets() {
    this.assets = await PIXI.Assets.load();
  }

  isWalkable(x, y) {
    // todo: make a map that's 1byte per pixel instead of 4
    return this.collisionMap[y * this.townSize.width * 4 + x * 4] == 0;
  }
}

module.exports = TownView;


/***/ }),

/***/ "./static/fa/broadcast-tower-solid.svg":
/*!*********************************************!*\
  !*** ./static/fa/broadcast-tower-solid.svg ***!
  \*********************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";
module.exports = __webpack_require__.p + "ead51173b07512a4bf13.svg";

/***/ }),

/***/ "./specs/dialogue.schema.json":
/*!************************************!*\
  !*** ./specs/dialogue.schema.json ***!
  \************************************/
/***/ ((module) => {

"use strict";
module.exports = JSON.parse('{"$id":"https://github.com/IMAGINARY/future-democracy/specs/dialogue.schema.json","$schema":"http://json-schema.org/draft-07/schema#","type":"object","properties":{"id":{"$ref":"#/definitions/node_id"},"items":{"type":"array","items":{"$ref":"#/definitions/node"}}},"required":["id","items"],"definitions":{"node_id":{"type":"string","minLength":1,"maxLength":100,"pattern":"^[a-zA-Z_][a-zA-Z0-9_-]*$"},"node":{"oneOf":[{"$ref":"#/definitions/sequence"},{"$ref":"#/definitions/random"},{"$ref":"#/definitions/first"},{"$ref":"#/definitions/statement"}]},"text":{"type":"string","minLength":1,"maxLength":1000},"flag_id":{"type":"string","minLength":1,"maxLength":100,"pattern":"^[a-zA-Z_][a-zA-Z0-9_-]*$"},"flags":{"type":"array","items":{"$ref":"#/definitions/flag_id"},"minItems":0,"maxItems":100},"condition":{"type":"string","minLength":1,"maxLength":1000},"sequence":{"type":"object","properties":{"type":{"const":"sequence"},"items":{"type":"array","items":{"$ref":"#/definitions/node"}},"cond":{"$ref":"#/definitions/condition"},"set":{"$ref":"#/definitions/flags"}},"required":["type","items"]},"random":{"type":"object","properties":{"type":{"const":"random"},"items":{"type":"array","items":{"$ref":"#/definitions/node"}},"cond":{"$ref":"#/definitions/condition"},"set":{"$ref":"#/definitions/flags"}},"required":["type","items"]},"first":{"type":"object","properties":{"type":{"const":"first"},"items":{"type":"array","items":{"$ref":"#/definitions/node"}},"cond":{"$ref":"#/definitions/condition"},"set":{"$ref":"#/definitions/flags"}},"required":["type","items"]},"statement":{"type":"object","properties":{"type":{"const":"statement"},"id":{"$ref":"#/definitions/node_id"},"cond":{"$ref":"#/definitions/condition"},"text":{"$ref":"#/definitions/text"},"set":{"$ref":"#/definitions/flags"},"responses":{"type":"array","items":{"$ref":"#/definitions/response"}}},"required":["text"]},"response":{"type":"object","properties":{"cond":{"$ref":"#/definitions/condition"},"text":{"$ref":"#/definitions/text"},"set":{"$ref":"#/definitions/flags"},"then":{"$ref":"#/definitions/node_id"},"thenText":{"$ref":"#/definitions/text"}},"required":["text"]}}}');

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
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/global */
/******/ 	(() => {
/******/ 		__webpack_require__.g = (function() {
/******/ 			if (typeof globalThis === 'object') return globalThis;
/******/ 			try {
/******/ 				return this || new Function('return this')();
/******/ 			} catch (e) {
/******/ 				if (typeof window === 'object') return window;
/******/ 			}
/******/ 		})();
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
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
/******/ 	/* webpack/runtime/publicPath */
/******/ 	(() => {
/******/ 		var scriptUrl;
/******/ 		if (__webpack_require__.g.importScripts) scriptUrl = __webpack_require__.g.location + "";
/******/ 		var document = __webpack_require__.g.document;
/******/ 		if (!scriptUrl && document) {
/******/ 			if (document.currentScript)
/******/ 				scriptUrl = document.currentScript.src;
/******/ 			if (!scriptUrl) {
/******/ 				var scripts = document.getElementsByTagName("script");
/******/ 				if(scripts.length) scriptUrl = scripts[scripts.length - 1].src
/******/ 			}
/******/ 		}
/******/ 		// When supporting browsers where an automatic publicPath is not supported you must specify an output.publicPath manually via configuration
/******/ 		// or pass an empty string ("") and set the __webpack_public_path__ variable from your code to use your own logic.
/******/ 		if (!scriptUrl) throw new Error("Automatic publicPath is not supported in this browser");
/******/ 		scriptUrl = scriptUrl.replace(/#.*$/, "").replace(/\?.*$/, "").replace(/\/[^\/]+$/, "/");
/******/ 		__webpack_require__.p = scriptUrl;
/******/ 	})();
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry need to be wrapped in an IIFE because it need to be isolated against other modules in the chunk.
(() => {
/*!**************************!*\
  !*** ./src/js/player.js ***!
  \**************************/
const ServerSocketConnector = __webpack_require__(/*! ./lib/net/server-socket-connector */ "./src/js/lib/net/server-socket-connector.js");
const ConnectionStateView = __webpack_require__(/*! ./lib/net/connection-state-view */ "./src/js/lib/net/connection-state-view.js");
const showFatalError = __webpack_require__(/*! ./lib/loader/show-fatal-error */ "./src/js/lib/loader/show-fatal-error.js");
__webpack_require__(/*! ../sass/default.scss */ "./src/sass/default.scss");
const PlayerApp = __webpack_require__(/*! ./lib/components/player-app */ "./src/js/lib/components/player-app.js");
const { getApiServerUrl, getSocketServerUrl } = __webpack_require__(/*! ./lib/net/server-url */ "./src/js/lib/net/server-url.js");

const urlParams = new URLSearchParams(window.location.search);
const playerId = urlParams.get('p') || '1';
const statsPanel = urlParams.get('s') || null;
const configUrl = `${getApiServerUrl()}config`;

fetch(configUrl, { cache: 'no-store' })
  .then((response) => {
    if (!response.ok) {
      throw new Error(`HTTP error. Status: ${ response.status }`);
    }
    return response.json();
  })
  .catch((err) => {
    console.log(err);
    showFatalError(`Error fetching configuration from ${configUrl}`, err);
    console.error(`Error fetching configuration from ${configUrl}`);
    throw err;
  })
  .then((config) => {
    const playerApp = new PlayerApp(config, playerId);
    return playerApp.init();
  })
  .then((playerApp) => {
    $('[data-component="PlayerApp"]').replaceWith(playerApp.$element);
    playerApp.resize();
    $(window).on('resize', () => {
      playerApp.resize();
    });

    let syncReceived = false;
    const connector = new ServerSocketConnector(getSocketServerUrl());
    connector.events.on('connect', () => {
      syncReceived = true;
    });
    connector.events.on('sync', (message) => {
      syncReceived = true;
      playerApp.stats.ping();
      Object.entries(message.players).forEach(([id, player]) => {
        if (id !== playerId && playerApp.otherPcs[id]) {
          if (player.position) {
            playerApp.otherPcs[id].setPosition(player.position.x, player.position.y);
          }
          if (player.speed) {
            playerApp.otherPcs[id].setSpeed(player.speed.x, player.speed.y);
          }
        }
      });
    });
    playerApp.pixiApp.ticker.add(() => {
      if (syncReceived) {
        connector.sync(playerApp.pc);
        syncReceived = false;
      }
    });
    const connStateView = new ConnectionStateView(connector);
    $('body').append(connStateView.$element);

    if (statsPanel) {
      playerApp.stats.showPanel(statsPanel);
    }
  })
  .catch((err) => {
    console.error(err);
  });

})();

/******/ })()
;
//# sourceMappingURL=player.7273b350bf59174e5eb5.js.map