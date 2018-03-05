/*!
 * @overview RSVP - a tiny implementation of Promises/A+.
 * @copyright Copyright (c) 2016 Yehuda Katz, Tom Dale, Stefan Penner and contributors
 * @license   Licensed under MIT license
 *            See https://raw.githubusercontent.com/tildeio/rsvp.js/master/LICENSE
 * @version   3.5.0
 */

(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
    typeof define === 'function' && define.amd ? define(['exports'], factory) :
      (factory((global.RSVP = global.RSVP || {})));
}(this, ((exports) => {
  function indexOf(callbacks, callback) {
    for (let i = 0, l = callbacks.length; i < l; i++) {
      if (callbacks[i] === callback) {
        return i;
      }
    }

    return -1;
  }

  function callbacksFor(object) {
    let callbacks = object._promiseCallbacks;

    if (!callbacks) {
      callbacks = object._promiseCallbacks = {};
    }

    return callbacks;
  }

  /**
  @class RSVP.EventTarget
*/
  const EventTarget = {

  /**
    `RSVP.EventTarget.mixin` extends an object with EventTarget methods. For
    Example:
     ```javascript
    let object = {};
     RSVP.EventTarget.mixin(object);
     object.on('finished', function(event) {
      // handle event
    });
     object.trigger('finished', { detail: value });
    ```
     `EventTarget.mixin` also works with prototypes:
     ```javascript
    let Person = function() {};
    RSVP.EventTarget.mixin(Person.prototype);
     let yehuda = new Person();
    let tom = new Person();
     yehuda.on('poke', function(event) {
      console.log('Yehuda says OW');
    });
     tom.on('poke', function(event) {
      console.log('Tom says OW');
    });
     yehuda.trigger('poke');
    tom.trigger('poke');
    ```
     @method mixin
    @for RSVP.EventTarget
    @private
    @param {Object} object object to extend with EventTarget methods
  */
    mixin: function mixin(object) {
      object.on = this.on;
      object.off = this.off;
      object.trigger = this.trigger;
      object._promiseCallbacks = undefined;
      return object;
    },

    /**
    Registers a callback to be executed when `eventName` is triggered
     ```javascript
    object.on('event', function(eventInfo){
      // handle the event
    });
     object.trigger('event');
    ```
     @method on
    @for RSVP.EventTarget
    @private
    @param {String} eventName name of the event to listen for
    @param {Function} callback function to be called when the event is triggered.
  */
    on: function on(eventName, callback) {
      if (typeof callback !== 'function') {
        throw new TypeError('Callback must be a function');
      }

      let allCallbacks = callbacksFor(this),
        callbacks;

      callbacks = allCallbacks[eventName];

      if (!callbacks) {
        callbacks = allCallbacks[eventName] = [];
      }

      if (indexOf(callbacks, callback) === -1) {
        callbacks.push(callback);
      }
    },

    /**
    You can use `off` to stop firing a particular callback for an event:
     ```javascript
    function doStuff() { // do stuff! }
    object.on('stuff', doStuff);
     object.trigger('stuff'); // doStuff will be called
     // Unregister ONLY the doStuff callback
    object.off('stuff', doStuff);
    object.trigger('stuff'); // doStuff will NOT be called
    ```
     If you don't pass a `callback` argument to `off`, ALL callbacks for the
    event will not be executed when the event fires. For example:
     ```javascript
    let callback1 = function(){};
    let callback2 = function(){};
     object.on('stuff', callback1);
    object.on('stuff', callback2);
     object.trigger('stuff'); // callback1 and callback2 will be executed.
     object.off('stuff');
    object.trigger('stuff'); // callback1 and callback2 will not be executed!
    ```
     @method off
    @for RSVP.EventTarget
    @private
    @param {String} eventName event to stop listening to
    @param {Function} callback optional argument. If given, only the function
    given will be removed from the event's callback queue. If no `callback`
    argument is given, all callbacks will be removed from the event's callback
    queue.
  */
    off: function off(eventName, callback) {
      let allCallbacks = callbacksFor(this),
        callbacks,
        index;

      if (!callback) {
        allCallbacks[eventName] = [];
        return;
      }

      callbacks = allCallbacks[eventName];

      index = indexOf(callbacks, callback);

      if (index !== -1) {
        callbacks.splice(index, 1);
      }
    },

    /**
    Use `trigger` to fire custom events. For example:
     ```javascript
    object.on('foo', function(){
      console.log('foo event happened!');
    });
    object.trigger('foo');
    // 'foo event happened!' logged to the console
    ```
     You can also pass a value as a second argument to `trigger` that will be
    passed as an argument to all event listeners for the event:
     ```javascript
    object.on('foo', function(value){
      console.log(value.name);
    });
     object.trigger('foo', { name: 'bar' });
    // 'bar' logged to the console
    ```
     @method trigger
    @for RSVP.EventTarget
    @private
    @param {String} eventName name of the event to be triggered
    @param {*} options optional value to be passed to any event handlers for
    the given `eventName`
  */
    trigger: function trigger(eventName, options, label) {
      let allCallbacks = callbacksFor(this),
        callbacks,
        callback;

      if (callbacks = allCallbacks[eventName]) {
      // Don't cache the callbacks.length since it may grow
        for (let i = 0; i < callbacks.length; i++) {
          callback = callbacks[i];

          callback(options, label);
        }
      }
    },
  };

  const config = {
    instrument: false,
  };

  EventTarget.mixin(config);

  function configure(name, value) {
    if (name === 'onerror') {
    // handle for legacy users that expect the actual
    // error to be passed to their function added via
    // `RSVP.configure('onerror', someFunctionHere);`
      config.on('error', value);
      return;
    }

    if (arguments.length === 2) {
      config[name] = value;
    } else {
      return config[name];
    }
  }

  function objectOrFunction(x) {
    return typeof x === 'function' || typeof x === 'object' && x !== null;
  }

  function isFunction(x) {
    return typeof x === 'function';
  }

  function isMaybeThenable(x) {
    return typeof x === 'object' && x !== null;
  }

  let _isArray;
  if (!Array.isArray) {
    _isArray = function (x) {
      return Object.prototype.toString.call(x) === '[object Array]';
    };
  } else {
    _isArray = Array.isArray;
  }

  const isArray = _isArray;

  // Date.now is not available in browsers < IE9
  // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/now#Compatibility
  const now = Date.now || function () {
    return new Date().getTime();
  };

  function F() {}

  const o_create = Object.create || function (o) {
    if (arguments.length > 1) {
      throw new Error('Second argument not supported');
    }
    if (typeof o !== 'object') {
      throw new TypeError('Argument must be an object');
    }
    F.prototype = o;
    return new F();
  };

  const queue = [];

  function scheduleFlush() {
    setTimeout(() => {
      for (let i = 0; i < queue.length; i++) {
        const entry = queue[i];

        const payload = entry.payload;

        payload.guid = payload.key + payload.id;
        payload.childGuid = payload.key + payload.childId;
        if (payload.error) {
          payload.stack = payload.error.stack;
        }

        config.trigger(entry.name, entry.payload);
      }
      queue.length = 0;
    }, 50);
  }
  function instrument$1(eventName, promise, child) {
    if (queue.push({
      name: eventName,
      payload: {
        key: promise._guidKey,
        id: promise._id,
        eventName,
        detail: promise._result,
        childId: child && child._id,
        label: promise._label,
        timeStamp: now(),
        error: config['instrument-with-stack'] ? new Error(promise._label) : null,
      } }) === 1) {
      scheduleFlush();
    }
  }

  /**
  `RSVP.Promise.resolve` returns a promise that will become resolved with the
  passed `value`. It is shorthand for the following:

  ```javascript
  let promise = new RSVP.Promise(function(resolve, reject){
    resolve(1);
  });

  promise.then(function(value){
    // value === 1
  });
  ```

  Instead of writing the above, your code now simply becomes the following:

  ```javascript
  let promise = RSVP.Promise.resolve(1);

  promise.then(function(value){
    // value === 1
  });
  ```

  @method resolve
  @static
  @param {*} object value that the returned promise will be resolved with
  @param {String} label optional string for identifying the returned promise.
  Useful for tooling.
  @return {Promise} a promise that will become fulfilled with the given
  `value`
*/
  function resolve$1(object, label) {
  /* jshint validthis:true */
    const Constructor = this;

    if (object && typeof object === 'object' && object.constructor === Constructor) {
      return object;
    }

    const promise = new Constructor(noop, label);
    resolve(promise, object);
    return promise;
  }

  function withOwnPromise() {
    return new TypeError('A promises callback cannot return that same promise.');
  }

  function noop() {}

  const PENDING = void 0;
  const FULFILLED = 1;
  const REJECTED = 2;

  const GET_THEN_ERROR = new ErrorObject();

  function getThen(promise) {
    try {
      return promise.then;
    } catch (error) {
      GET_THEN_ERROR.error = error;
      return GET_THEN_ERROR;
    }
  }

  function tryThen(then$$1, value, fulfillmentHandler, rejectionHandler) {
    try {
      then$$1.call(value, fulfillmentHandler, rejectionHandler);
    } catch (e) {
      return e;
    }
  }

  function handleForeignThenable(promise, thenable, then$$1) {
    config.async((promise) => {
      let sealed = false;
      const error = tryThen(then$$1, thenable, (value) => {
        if (sealed) {
          return;
        }
        sealed = true;
        if (thenable !== value) {
          resolve(promise, value, undefined);
        } else {
          fulfill(promise, value);
        }
      }, (reason) => {
        if (sealed) {
          return;
        }
        sealed = true;

        reject(promise, reason);
      }, `Settle: ${promise._label || ' unknown promise'}`);

      if (!sealed && error) {
        sealed = true;
        reject(promise, error);
      }
    }, promise);
  }

  function handleOwnThenable(promise, thenable) {
    if (thenable._state === FULFILLED) {
      fulfill(promise, thenable._result);
    } else if (thenable._state === REJECTED) {
      thenable._onError = null;
      reject(promise, thenable._result);
    } else {
      subscribe(thenable, undefined, (value) => {
        if (thenable !== value) {
          resolve(promise, value, undefined);
        } else {
          fulfill(promise, value);
        }
      }, reason => reject(promise, reason));
    }
  }

  function handleMaybeThenable(promise, maybeThenable, then$$1) {
    if (maybeThenable.constructor === promise.constructor && then$$1 === then && promise.constructor.resolve === resolve$1) {
      handleOwnThenable(promise, maybeThenable);
    } else if (then$$1 === GET_THEN_ERROR) {
      reject(promise, GET_THEN_ERROR.error);
      GET_THEN_ERROR.error = null;
    } else if (then$$1 === undefined) {
      fulfill(promise, maybeThenable);
    } else if (isFunction(then$$1)) {
      handleForeignThenable(promise, maybeThenable, then$$1);
    } else {
      fulfill(promise, maybeThenable);
    }
  }

  function resolve(promise, value) {
    if (promise === value) {
      fulfill(promise, value);
    } else if (objectOrFunction(value)) {
      handleMaybeThenable(promise, value, getThen(value));
    } else {
      fulfill(promise, value);
    }
  }

  function publishRejection(promise) {
    if (promise._onError) {
      promise._onError(promise._result);
    }

    publish(promise);
  }

  function fulfill(promise, value) {
    if (promise._state !== PENDING) {
      return;
    }

    promise._result = value;
    promise._state = FULFILLED;

    if (promise._subscribers.length === 0) {
      if (config.instrument) {
        instrument$1('fulfilled', promise);
      }
    } else {
      config.async(publish, promise);
    }
  }

  function reject(promise, reason) {
    if (promise._state !== PENDING) {
      return;
    }
    promise._state = REJECTED;
    promise._result = reason;
    config.async(publishRejection, promise);
  }

  function subscribe(parent, child, onFulfillment, onRejection) {
    const subscribers = parent._subscribers;
    const length = subscribers.length;

    parent._onError = null;

    subscribers[length] = child;
    subscribers[length + FULFILLED] = onFulfillment;
    subscribers[length + REJECTED] = onRejection;

    if (length === 0 && parent._state) {
      config.async(publish, parent);
    }
  }

  function publish(promise) {
    const subscribers = promise._subscribers;
    const settled = promise._state;

    if (config.instrument) {
      instrument$1(settled === FULFILLED ? 'fulfilled' : 'rejected', promise);
    }

    if (subscribers.length === 0) {
      return;
    }

    let child,
      callback,
      detail = promise._result;

    for (let i = 0; i < subscribers.length; i += 3) {
      child = subscribers[i];
      callback = subscribers[i + settled];

      if (child) {
        invokeCallback(settled, child, callback, detail);
      } else {
        callback(detail);
      }
    }

    promise._subscribers.length = 0;
  }

  function ErrorObject() {
    this.error = null;
  }

  const TRY_CATCH_ERROR = new ErrorObject();

  function tryCatch(callback, detail) {
    try {
      return callback(detail);
    } catch (e) {
      TRY_CATCH_ERROR.error = e;
      return TRY_CATCH_ERROR;
    }
  }

  function invokeCallback(settled, promise, callback, detail) {
    let hasCallback = isFunction(callback),
      value,
      error,
      succeeded,
      failed;

    if (hasCallback) {
      value = tryCatch(callback, detail);

      if (value === TRY_CATCH_ERROR) {
        failed = true;
        error = value.error;
        value.error = null; // release
      } else {
        succeeded = true;
      }

      if (promise === value) {
        reject(promise, withOwnPromise());
        return;
      }
    } else {
      value = detail;
      succeeded = true;
    }

    if (promise._state !== PENDING) {
    // noop
    } else if (hasCallback && succeeded) {
      resolve(promise, value);
    } else if (failed) {
      reject(promise, error);
    } else if (settled === FULFILLED) {
      fulfill(promise, value);
    } else if (settled === REJECTED) {
      reject(promise, value);
    }
  }

  function initializePromise(promise, resolver) {
    let resolved = false;
    try {
      resolver((value) => {
        if (resolved) {
          return;
        }
        resolved = true;
        resolve(promise, value);
      }, (reason) => {
        if (resolved) {
          return;
        }
        resolved = true;
        reject(promise, reason);
      });
    } catch (e) {
      reject(promise, e);
    }
  }

  function then(onFulfillment, onRejection, label) {
    const _arguments = arguments;

    const parent = this;
    const state = parent._state;

    if (state === FULFILLED && !onFulfillment || state === REJECTED && !onRejection) {
      config.instrument && instrument$1('chained', parent, parent);
      return parent;
    }

    parent._onError = null;

    const child = new parent.constructor(noop, label);
    const result = parent._result;

    config.instrument && instrument$1('chained', parent, child);

    if (state) {
      (function () {
        const callback = _arguments[state - 1];
        config.async(() => invokeCallback(state, child, callback, result));
      }());
    } else {
      subscribe(parent, child, onFulfillment, onRejection);
    }

    return child;
  }

  function makeSettledResult(state, position, value) {
    if (state === FULFILLED) {
      return {
        state: 'fulfilled',
        value,
      };
    }
    return {
      state: 'rejected',
      reason: value,
    };
  }

  function Enumerator(Constructor, input, abortOnReject, label) {
    this._instanceConstructor = Constructor;
    this.promise = new Constructor(noop, label);
    this._abortOnReject = abortOnReject;

    if (this._validateInput(input)) {
      this._input = input;
      this.length = input.length;
      this._remaining = input.length;

      this._init();

      if (this.length === 0) {
        fulfill(this.promise, this._result);
      } else {
        this.length = this.length || 0;
        this._enumerate();
        if (this._remaining === 0) {
          fulfill(this.promise, this._result);
        }
      }
    } else {
      reject(this.promise, this._validationError());
    }
  }

  Enumerator.prototype._validateInput = function (input) {
    return isArray(input);
  };

  Enumerator.prototype._validationError = function () {
    return new Error('Array Methods must be provided an Array');
  };

  Enumerator.prototype._init = function () {
    this._result = new Array(this.length);
  };

  Enumerator.prototype._enumerate = function () {
    const length = this.length;
    const promise = this.promise;
    const input = this._input;

    for (let i = 0; promise._state === PENDING && i < length; i++) {
      this._eachEntry(input[i], i);
    }
  };

  Enumerator.prototype._settleMaybeThenable = function (entry, i) {
    const c = this._instanceConstructor;
    const resolve$$1 = c.resolve;

    if (resolve$$1 === resolve$1) {
      const then$$1 = getThen(entry);

      if (then$$1 === then && entry._state !== PENDING) {
        entry._onError = null;
        this._settledAt(entry._state, i, entry._result);
      } else if (typeof then$$1 !== 'function') {
        this._remaining--;
        this._result[i] = this._makeResult(FULFILLED, i, entry);
      } else if (c === Promise$1) {
        const promise = new c(noop);
        handleMaybeThenable(promise, entry, then$$1);
        this._willSettleAt(promise, i);
      } else {
        this._willSettleAt(new c((resolve$$1 => resolve$$1(entry))), i);
      }
    } else {
      this._willSettleAt(resolve$$1(entry), i);
    }
  };

  Enumerator.prototype._eachEntry = function (entry, i) {
    if (isMaybeThenable(entry)) {
      this._settleMaybeThenable(entry, i);
    } else {
      this._remaining--;
      this._result[i] = this._makeResult(FULFILLED, i, entry);
    }
  };

  Enumerator.prototype._settledAt = function (state, i, value) {
    const promise = this.promise;

    if (promise._state === PENDING) {
      this._remaining--;

      if (this._abortOnReject && state === REJECTED) {
        reject(promise, value);
      } else {
        this._result[i] = this._makeResult(state, i, value);
      }
    }

    if (this._remaining === 0) {
      fulfill(promise, this._result);
    }
  };

  Enumerator.prototype._makeResult = function (state, i, value) {
    return value;
  };

  Enumerator.prototype._willSettleAt = function (promise, i) {
    const enumerator = this;

    subscribe(promise, undefined, value => enumerator._settledAt(FULFILLED, i, value), reason => enumerator._settledAt(REJECTED, i, reason));
  };


  function all$1(entries, label) {
    return new Enumerator(this, entries, true, /* abort on reject */label).promise;
  }


  function race$1(entries, label) {
  /* jshint validthis:true */
    const Constructor = this;

    const promise = new Constructor(noop, label);

    if (!isArray(entries)) {
      reject(promise, new TypeError('You must pass an array to race.'));
      return promise;
    }

    for (let i = 0; promise._state === PENDING && i < entries.length; i++) {
      subscribe(Constructor.resolve(entries[i]), undefined, value => resolve(promise, value), reason => reject(promise, reason));
    }

    return promise;
  }

  function reject$1(reason, label) {
  /* jshint validthis:true */
    const Constructor = this;
    const promise = new Constructor(noop, label);
    reject(promise, reason);
    return promise;
  }

  const guidKey = `rsvp_${now()}-`;
  let counter = 0;

  function needsResolver() {
    throw new TypeError('You must pass a resolver function as the first argument to the promise constructor');
  }

  function needsNew() {
    throw new TypeError("Failed to construct 'Promise': Please use the 'new' operator, this object constructor cannot be called as a function.");
  }


  function Promise$1(resolver, label) {
    this._id = counter++;
    this._label = label;
    this._state = undefined;
    this._result = undefined;
    this._subscribers = [];

    config.instrument && instrument$1('created', this);

    if (noop !== resolver) {
      typeof resolver !== 'function' && needsResolver();
      this instanceof Promise$1 ? initializePromise(this, resolver) : needsNew();
    }
  }

  Promise$1.cast = resolve$1; // deprecated
  Promise$1.all = all$1;
  Promise$1.race = race$1;
  Promise$1.resolve = resolve$1;
  Promise$1.reject = reject$1;

  Promise$1.prototype = {
    constructor: Promise$1,

    _guidKey: guidKey,

    _onError: function _onError(reason) {
      const promise = this;
      config.after(() => {
        if (promise._onError) {
          config.trigger('error', reason, promise._label);
        }
      });
    },


    then,


    catch: function _catch(onRejection, label) {
      return this.then(undefined, onRejection, label);
    },


    finally: function _finally(callback, label) {
      const promise = this;
      const constructor = promise.constructor;

      return promise.then(value => constructor.resolve(callback()).then(() => value), reason => constructor.resolve(callback()).then(() => {
        throw reason;
      }), label);
    },
  };

  function Result() {
    this.value = undefined;
  }

  const ERROR = new Result();
  const GET_THEN_ERROR$1 = new Result();

  function getThen$1(obj) {
    try {
      return obj.then;
    } catch (error) {
      ERROR.value = error;
      return ERROR;
    }
  }

  function tryApply(f, s, a) {
    try {
      f.apply(s, a);
    } catch (error) {
      ERROR.value = error;
      return ERROR;
    }
  }

  function makeObject(_, argumentNames) {
    const obj = {};
    const length = _.length;
    const args = new Array(length);

    for (let x = 0; x < length; x++) {
      args[x] = _[x];
    }

    for (let i = 0; i < argumentNames.length; i++) {
      const _name = argumentNames[i];
      obj[_name] = args[i + 1];
    }

    return obj;
  }

  function arrayResult(_) {
    const length = _.length;
    const args = new Array(length - 1);

    for (let i = 1; i < length; i++) {
      args[i - 1] = _[i];
    }

    return args;
  }

  function wrapThenable(_then, promise) {
    return {
      then: function then(onFulFillment, onRejection) {
        return _then.call(promise, onFulFillment, onRejection);
      },
    };
  }

  function denodeify$1(nodeFunc, options) {
    const fn = function fn() {
      const self = this;
      const l = arguments.length;
      const args = new Array(l + 1);
      let promiseInput = false;

      for (let i = 0; i < l; ++i) {
        let arg = arguments[i];

        if (!promiseInput) {
        // TODO: clean this up
          promiseInput = needsPromiseInput(arg);
          if (promiseInput === GET_THEN_ERROR$1) {
            const p = new Promise$1(noop);
            reject(p, GET_THEN_ERROR$1.value);
            return p;
          } else if (promiseInput && promiseInput !== true) {
            arg = wrapThenable(promiseInput, arg);
          }
        }
        args[i] = arg;
      }

      const promise = new Promise$1(noop);

      args[l] = function (err, val) {
        if (err) reject(promise, err); else if (options === undefined) resolve(promise, val); else if (options === true) resolve(promise, arrayResult(arguments)); else if (isArray(options)) resolve(promise, makeObject(arguments, options)); else resolve(promise, val);
      };

      if (promiseInput) {
        return handlePromiseInput(promise, args, nodeFunc, self);
      }
      return handleValueInput(promise, args, nodeFunc, self);
    };

    fn.__proto__ = nodeFunc;

    return fn;
  }

  function handleValueInput(promise, args, nodeFunc, self) {
    const result = tryApply(nodeFunc, self, args);
    if (result === ERROR) {
      reject(promise, result.value);
    }
    return promise;
  }

  function handlePromiseInput(promise, args, nodeFunc, self) {
    return Promise$1.all(args).then((args) => {
      const result = tryApply(nodeFunc, self, args);
      if (result === ERROR) {
        reject(promise, result.value);
      }
      return promise;
    });
  }

  function needsPromiseInput(arg) {
    if (arg && typeof arg === 'object') {
      if (arg.constructor === Promise$1) {
        return true;
      }
      return getThen$1(arg);
    }
    return false;
  }

  /**
  This is a convenient alias for `RSVP.Promise.all`.

  @method all
  @static
  @for RSVP
  @param {Array} array Array of promises.
  @param {String} label An optional label. This is useful
  for tooling.
*/
  function all$3(array, label) {
    return Promise$1.all(array, label);
  }

  function AllSettled(Constructor, entries, label) {
    this._superConstructor(Constructor, entries, false, /* don't abort on reject */label);
  }

  AllSettled.prototype = o_create(Enumerator.prototype);
  AllSettled.prototype._superConstructor = Enumerator;
  AllSettled.prototype._makeResult = makeSettledResult;
  AllSettled.prototype._validationError = function () {
    return new Error('allSettled must be called with an array');
  };


  function allSettled$1(entries, label) {
    return new AllSettled(Promise$1, entries, label).promise;
  }

  /**
  This is a convenient alias for `RSVP.Promise.race`.

  @method race
  @static
  @for RSVP
  @param {Array} array Array of promises.
  @param {String} label An optional label. This is useful
  for tooling.
 */
  function race$3(array, label) {
    return Promise$1.race(array, label);
  }

  function PromiseHash(Constructor, object, label) {
    this._superConstructor(Constructor, object, true, label);
  }

  PromiseHash.prototype = o_create(Enumerator.prototype);
  PromiseHash.prototype._superConstructor = Enumerator;
  PromiseHash.prototype._init = function () {
    this._result = {};
  };

  PromiseHash.prototype._validateInput = function (input) {
    return input && typeof input === 'object';
  };

  PromiseHash.prototype._validationError = function () {
    return new Error('Promise.hash must be called with an object');
  };

  PromiseHash.prototype._enumerate = function () {
    const enumerator = this;
    const promise = enumerator.promise;
    const input = enumerator._input;
    const results = [];

    for (const key in input) {
      if (promise._state === PENDING && Object.prototype.hasOwnProperty.call(input, key)) {
        results.push({
          position: key,
          entry: input[key],
        });
      }
    }

    const length = results.length;
    enumerator._remaining = length;
    let result;

    for (let i = 0; promise._state === PENDING && i < length; i++) {
      result = results[i];
      enumerator._eachEntry(result.entry, result.position);
    }
  };


  function hash$1(object, label) {
    return new PromiseHash(Promise$1, object, label).promise;
  }

  function HashSettled(Constructor, object, label) {
    this._superConstructor(Constructor, object, false, label);
  }

  HashSettled.prototype = o_create(PromiseHash.prototype);
  HashSettled.prototype._superConstructor = Enumerator;
  HashSettled.prototype._makeResult = makeSettledResult;

  HashSettled.prototype._validationError = function () {
    return new Error('hashSettled must be called with an object');
  };

  function hashSettled$1(object, label) {
    return new HashSettled(Promise$1, object, label).promise;
  }


  function rethrow$1(reason) {
    setTimeout(() => {
      throw reason;
    });
    throw reason;
  }


  function defer$1(label) {
    const deferred = { resolve: undefined, reject: undefined };

    deferred.promise = new Promise$1(((resolve, reject) => {
      deferred.resolve = resolve;
      deferred.reject = reject;
    }), label);

    return deferred;
  }

  function map$1(promises, mapFn, label) {
    return Promise$1.all(promises, label).then((values) => {
      if (!isFunction(mapFn)) {
        throw new TypeError("You must pass a function as map's second argument.");
      }

      const length = values.length;
      const results = new Array(length);

      for (let i = 0; i < length; i++) {
        results[i] = mapFn(values[i]);
      }

      return Promise$1.all(results, label);
    });
  }

  /**
  This is a convenient alias for `RSVP.Promise.resolve`.

  @method resolve
  @static
  @for RSVP
  @param {*} value value that the returned promise will be resolved with
  @param {String} label optional string for identifying the returned promise.
  Useful for tooling.
  @return {Promise} a promise that will become fulfilled with the given
  `value`
*/
  function resolve$3(value, label) {
    return Promise$1.resolve(value, label);
  }


  function reject$3(reason, label) {
    return Promise$1.reject(reason, label);
  }


  function resolveAll(promises, label) {
    return Promise$1.all(promises, label);
  }

  function resolveSingle(promise, label) {
    return Promise$1.resolve(promise, label).then(promises => resolveAll(promises, label));
  }
  function filter$1(promises, filterFn, label) {
    const promise = isArray(promises) ? resolveAll(promises, label) : resolveSingle(promises, label);
    return promise.then((values) => {
      if (!isFunction(filterFn)) {
        throw new TypeError("You must pass a function as filter's second argument.");
      }

      const length = values.length;
      const filtered = new Array(length);

      for (let i = 0; i < length; i++) {
        filtered[i] = filterFn(values[i]);
      }

      return resolveAll(filtered, label).then((filtered) => {
        const results = new Array(length);
        let newLength = 0;

        for (let i = 0; i < length; i++) {
          if (filtered[i]) {
            results[newLength] = values[i];
            newLength++;
          }
        }

        results.length = newLength;

        return results;
      });
    });
  }

  let len = 0;
  let vertxNext;
  function asap$1(callback, arg) {
    queue$1[len] = callback;
    queue$1[len + 1] = arg;
    len += 2;
    if (len === 2) {
    // If len is 1, that means that we need to schedule an async flush.
    // If additional callbacks are queued before the queue is flushed, they
    // will be processed by this flush that we are scheduling.
      scheduleFlush$1();
    }
  }

  const browserWindow = typeof window !== 'undefined' ? window : undefined;
  const browserGlobal = browserWindow || {};
  const BrowserMutationObserver = browserGlobal.MutationObserver || browserGlobal.WebKitMutationObserver;
  const isNode = typeof self === 'undefined' && typeof process !== 'undefined' && ({}).toString.call(process) === '[object process]';

  // test for web worker but not in IE10
  const isWorker = typeof Uint8ClampedArray !== 'undefined' && typeof importScripts !== 'undefined' && typeof MessageChannel !== 'undefined';

  // node
  function useNextTick() {
    let nextTick = process.nextTick;
    // node version 0.10.x displays a deprecation warning when nextTick is used recursively
    // setImmediate should be used instead instead
    const version = process.versions.node.match(/^(?:(\d+)\.)?(?:(\d+)\.)?(\*|\d+)$/);
    if (Array.isArray(version) && version[1] === '0' && version[2] === '10') {
      nextTick = setImmediate;
    }
    return function () {
      return nextTick(flush);
    };
  }

  // vertx
  function useVertxTimer() {
    if (typeof vertxNext !== 'undefined') {
      return function () {
        vertxNext(flush);
      };
    }
    return useSetTimeout();
  }

  function useMutationObserver() {
    let iterations = 0;
    const observer = new BrowserMutationObserver(flush);
    const node = document.createTextNode('');
    observer.observe(node, { characterData: true });

    return function () {
      return node.data = iterations = ++iterations % 2;
    };
  }

  // web worker
  function useMessageChannel() {
    const channel = new MessageChannel();
    channel.port1.onmessage = flush;
    return function () {
      return channel.port2.postMessage(0);
    };
  }

  function useSetTimeout() {
    return function () {
      return setTimeout(flush, 1);
    };
  }

  var queue$1 = new Array(1000);

  function flush() {
    for (let i = 0; i < len; i += 2) {
      const callback = queue$1[i];
      const arg = queue$1[i + 1];

      callback(arg);

      queue$1[i] = undefined;
      queue$1[i + 1] = undefined;
    }

    len = 0;
  }

  function attemptVertex() {
    try {
      const r = require;
      const vertx = r('vertx');
      vertxNext = vertx.runOnLoop || vertx.runOnContext;
      return useVertxTimer();
    } catch (e) {
      return useSetTimeout();
    }
  }

  var scheduleFlush$1 = undefined;
  // Decide what async method to use to triggering processing of queued callbacks:
  if (isNode) {
    scheduleFlush$1 = useNextTick();
  } else if (BrowserMutationObserver) {
    scheduleFlush$1 = useMutationObserver();
  } else if (isWorker) {
    scheduleFlush$1 = useMessageChannel();
  } else if (browserWindow === undefined && typeof require === 'function') {
    scheduleFlush$1 = attemptVertex();
  } else {
    scheduleFlush$1 = useSetTimeout();
  }

  let platform;

  /* global self */
  if (typeof self === 'object') {
    platform = self;

  /* global global */
  } else if (typeof global === 'object') {
    platform = global;
  } else {
    throw new Error('no global: `self` or `global` found');
  }

  let _async$filter;

  function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

  // defaults

  // the default export here is for backwards compat:
  //   https://github.com/tildeio/rsvp.js/issues/434
  config.async = asap$1;
  config.after = function (cb) {
    return setTimeout(cb, 0);
  };
  const cast = resolve$3;

  const async = function async(callback, arg) {
    return config.async(callback, arg);
  };

  function on() {
    config.on(...arguments);
  }

  function off() {
    config.off(...arguments);
  }

  // Set up instrumentation through `window.__PROMISE_INTRUMENTATION__`
  if (typeof window !== 'undefined' && typeof window.__PROMISE_INSTRUMENTATION__ === 'object') {
    const callbacks = window.__PROMISE_INSTRUMENTATION__;
    configure('instrument', true);
    for (const eventName in callbacks) {
      if (callbacks.hasOwnProperty(eventName)) {
        on(eventName, callbacks[eventName]);
      }
    }
  } const rsvp = (_async$filter = {
    asap: asap$1,
    cast,
    Promise: Promise$1,
    EventTarget,
    all: all$3,
    allSettled: allSettled$1,
    race: race$3,
    hash: hash$1,
    hashSettled: hashSettled$1,
    rethrow: rethrow$1,
    defer: defer$1,
    denodeify: denodeify$1,
    configure,
    on,
    off,
    resolve: resolve$3,
    reject: reject$3,
    map: map$1,
  }, _defineProperty(_async$filter, 'async', async), _defineProperty(_async$filter, 'filter', // babel seems to error if async isn't a computed prop here...
      filter$1), _async$filter);

  exports.default = rsvp;
  exports.asap = asap$1;
  exports.cast = cast;
  exports.Promise = Promise$1;
  exports.EventTarget = EventTarget;
  exports.all = all$3;
  exports.allSettled = allSettled$1;
  exports.race = race$3;
  exports.hash = hash$1;
  exports.hashSettled = hashSettled$1;
  exports.rethrow = rethrow$1;
  exports.defer = defer$1;
  exports.denodeify = denodeify$1;
  exports.configure = configure;
  exports.on = on;
  exports.off = off;
  exports.resolve = resolve$3;
  exports.reject = reject$3;
  exports.map = map$1;
  exports.async = async;
  exports.filter = filter$1;

  Object.defineProperty(exports, '__esModule', { value: true });
})));

//

'use strict';

var EPUBJS = EPUBJS || {};
EPUBJS.VERSION = '0.2.19';

EPUBJS.plugins = EPUBJS.plugins || {};

EPUBJS.filePath = EPUBJS.filePath || '/epubjs/';

EPUBJS.Render = {};

(function (root) {
  const previousEpub = root.ePub || {};

  const ePub = root.ePub = function () {
    let bookPath,
      options;

    // -- var book = ePub("path/to/book.epub", { restore: true })
    if (typeof (arguments[0]) !== 'undefined' &&
			(typeof arguments[0] === 'string' || arguments[0] instanceof ArrayBuffer)) {
      bookPath = arguments[0];

      if (arguments[1] && typeof arguments[1] === 'object') {
        options = arguments[1];
        options.bookPath = bookPath;
      } else {
        options = { bookPath };
      }
    }

    /*
		*   var book = ePub({ bookPath: "path/to/book.epub", restore: true });
		*
		*   - OR -
		*
		*   var book = ePub({ restore: true });
		*   book.open("path/to/book.epub");
		*/

    if (arguments[0] && typeof arguments[0] === 'object' && !(arguments[0] instanceof ArrayBuffer)) {
      options = arguments[0];
    }


    return new EPUBJS.Book(options);
  };

  // exports to multiple environments
  if (typeof define === 'function' && define.amd) {
    // AMD
    define(['rsvp', 'jszip', 'localforage'], (RSVP, JSZip, localForage) => ePub);
  } else if (typeof module !== 'undefined' && module.exports) {
    // Node
    global.RSVP = require('rsvp');
    global.JSZip = require('jszip');
    global.localForage = require('localforage');
    module.exports = ePub;
  }
}(window));

EPUBJS.Book = function (options) {
  const book = this;

  this.settings = EPUBJS.core.defaults(options || {}, {
    bookPath: undefined,
    bookKey: undefined,
    packageUrl: undefined,
    storage: false, // -- true (auto) or false (none) | override: 'ram', 'websqldatabase', 'indexeddb', 'filesystem'
    fromStorage: false,
    saved: false,
    online: true,
    contained: false,
    width: undefined,
    height: undefined,
    layoutOveride: undefined, // Default: { spread: 'reflowable', layout: 'auto', orientation: 'auto'}
    orientation: undefined,
    minSpreadWidth: 768, // -- overridden by spread: none (never) / both (always)
    gap: 'auto', // -- "auto" or int
    version: 1,
    restore: false,
    reload: false,
    goto: false,
    styles: {},
    classes: [],
    headTags: {},
    withCredentials: false,
    render_method: 'Iframe',
    displayLastPage: false,
  });

  this.settings.EPUBJSVERSION = EPUBJS.VERSION;

  this.spinePos = 0;
  this.stored = false;

  // -- All Book events for listening
  /*
		book:ready
		book:stored
		book:online
		book:offline
		book:pageChanged
		book:loadFailed
		book:loadChapterFailed
	*/

  // -- Adds Hook methods to the Book prototype
  //   Hooks will all return before triggering the callback.
  // EPUBJS.Hooks.mixin(this);
  // -- Get pre-registered hooks for events
  // this.getHooks("beforeChapterDisplay");

  this.online = this.settings.online || navigator.onLine;
  this.networkListeners();

  this.ready = {
    manifest: new RSVP.defer(),
    spine: new RSVP.defer(),
    metadata: new RSVP.defer(),
    cover: new RSVP.defer(),
    toc: new RSVP.defer(),
    pageList: new RSVP.defer(),
  };

  this.readyPromises = [
    this.ready.manifest.promise,
    this.ready.spine.promise,
    this.ready.metadata.promise,
    this.ready.cover.promise,
    this.ready.toc.promise,
  ];

  this.pageList = [];
  this.pagination = new EPUBJS.Pagination();
  this.pageListReady = this.ready.pageList.promise;

  this.ready.all = RSVP.all(this.readyPromises);

  this.ready.all.then(this._ready.bind(this));

  // Queue for methods used before rendering
  this.isRendered = false;
  this._q = EPUBJS.core.queue(this);
  // Queue for rendering
  this._rendering = false;
  this._displayQ = EPUBJS.core.queue(this);
  // Queue for going to another location
  this._moving = false;
  this._gotoQ = EPUBJS.core.queue(this);

  /**
	* Creates a new renderer.
	* The renderer will handle displaying the content using the method provided in the settings
	*/
  this.renderer = new EPUBJS.Renderer(this.settings.render_method);
  // -- Set the width at which to switch from spreads to single pages
  this.renderer.setMinSpreadWidth(this.settings.minSpreadWidth);
  this.renderer.setGap(this.settings.gap);
  // -- Pass through the renderer events
  this.listenToRenderer(this.renderer);

  this.defer_opened = new RSVP.defer();
  this.opened = this.defer_opened.promise;

  this.store = false; // -- False if not using storage;

  // -- Determine storage method
  // -- Override options: none | ram | websqldatabase | indexeddb | filesystem
  if (this.settings.storage !== false) {
    // this.storage = new fileStorage.storage(this.settings.storage);
    this.fromStorage(true);
  }

  // BookUrl is optional, but if present start loading process
  if (typeof this.settings.bookPath === 'string' || this.settings.bookPath instanceof ArrayBuffer) {
    this.open(this.settings.bookPath, this.settings.reload);
  }

  window.addEventListener('beforeunload', this.unload.bind(this), false);

  // -- Listen for these promises:
  // -- book.opened.then()
  // -- book.rendered.then()
};

// -- Check bookUrl and start parsing book Assets or load them from storage
EPUBJS.Book.prototype.open = function (bookPath, forceReload) {
  let book = this,
    epubpackage,
    opened = new RSVP.defer();

  this.settings.bookPath = bookPath;

  if (this.settings.contained || this.isContained(bookPath)) {
    this.settings.contained = this.contained = true;

    this.bookUrl = '';

    epubpackage = this.unarchive(bookPath)
      .then(() => book.loadPackage());
  }	else {
    // -- Get a absolute URL from the book path
    this.bookUrl = this.urlFrom(bookPath);

    epubpackage = this.loadPackage();
  }

  if (this.settings.restore && !forceReload && localStorage) {
    // -- Will load previous package json, or re-unpack if error
    epubpackage.then((packageXml) => {
      const identifier = book.packageIdentifier(packageXml);
      const restored = book.restore(identifier);

      if (!restored) {
        book.unpack(packageXml);
      }
      opened.resolve();
      book.defer_opened.resolve();
    });
  } else {
    // -- Get package information from epub opf
    epubpackage.then((packageXml) => {
      book.unpack(packageXml);
      opened.resolve();
      book.defer_opened.resolve();
    });
  }

  this._registerReplacements(this.renderer);

  return opened.promise;
};

EPUBJS.Book.prototype.loadPackage = function (_containerPath) {
  let book = this,
    parse = new EPUBJS.Parser(),
    containerPath = _containerPath || 'META-INF/container.xml',
    containerXml,
    packageXml;

  if (!this.settings.packageUrl) { // -- provide the packageUrl to skip this step
    packageXml = book.loadXml(book.bookUrl + containerPath)
      .then(containerXml =>
				 parse.container(containerXml), // Container has path to content
      )
      .then((paths) => {
        book.settings.contentsPath = book.bookUrl + paths.basePath;
        book.settings.packageUrl = book.bookUrl + paths.packagePath;
        book.settings.encoding = paths.encoding;
        return book.loadXml(book.settings.packageUrl); // Containes manifest, spine and metadata
      });
  } else {
    packageXml = book.loadXml(book.settings.packageUrl);
  }

  packageXml.catch((error) => {
    // handle errors in either of the two requests
    console.error(`Could not load book at: ${containerPath}`);
    book.trigger('book:loadFailed', containerPath);
  });
  return packageXml;
};

EPUBJS.Book.prototype.packageIdentifier = function (packageXml) {
  let book = this,
    parse = new EPUBJS.Parser();

  return parse.identifier(packageXml);
};

EPUBJS.Book.prototype.unpack = function (packageXml) {
  let book = this,
    parse = new EPUBJS.Parser();

  book.contents = parse.packageContents(packageXml, book.settings.contentsPath); // Extract info from contents

  book.manifest = book.contents.manifest;
  book.spine = book.contents.spine;
  book.spineIndexByURL = book.contents.spineIndexByURL;
  book.metadata = book.contents.metadata;
  if (!book.settings.bookKey) {
    book.settings.bookKey = book.generateBookKey(book.metadata.identifier);
  }

  // -- Set Globbal Layout setting based on metadata
  book.globalLayoutProperties = book.parseLayoutProperties(book.metadata);

  if (book.contents.coverPath) {
    book.cover = book.contents.cover = book.settings.contentsPath + book.contents.coverPath;
  }

  book.spineNodeIndex = book.contents.spineNodeIndex;

  book.ready.manifest.resolve(book.contents.manifest);
  book.ready.spine.resolve(book.contents.spine);
  book.ready.metadata.resolve(book.contents.metadata);
  book.ready.cover.resolve(book.contents.cover);

  book.locations = new EPUBJS.Locations(book.spine, book.store, book.settings.withCredentials);

  // -- Load the TOC, optional; either the EPUB3 XHTML Navigation file or the EPUB2 NCX file
  if (book.contents.navPath) {
    book.settings.navUrl = book.settings.contentsPath + book.contents.navPath;

    book.loadXml(book.settings.navUrl)
      .then(navHtml =>
				 parse.nav(navHtml, book.spineIndexByURL, book.spine), // Grab Table of Contents
      ).then((toc) => {
        book.toc = book.contents.toc = toc;
        book.ready.toc.resolve(book.contents.toc);
      }, (error) => {
        book.ready.toc.resolve(false);
      });

    // Load the optional pageList
    book.loadXml(book.settings.navUrl)
      .then(navHtml => parse.pageList(navHtml, book.spineIndexByURL, book.spine)).then((pageList) => {
        const epubcfi = new EPUBJS.EpubCFI();
        let wait = 0; // need to generate a cfi

        // No pageList found
        if (pageList.length === 0) {
          return;
        }

        book.pageList = book.contents.pageList = pageList;

        // Replace HREFs with CFI

        _.each(book.pageList, (pg) => {
          if (!pg.cfi) {
            wait += 1;
            epubcfi.generateCfiFromHref(pg.href, book).then((cfi) => {
              pg.cfi = cfi;
              pg.packageUrl = book.settings.packageUrl;

              wait -= 1;
              if (wait === 0) {
                book.pagination.process(book.pageList);
                book.ready.pageList.resolve(book.pageList);
              }
            });
          }
        });

        if (!wait) {
          book.pagination.process(book.pageList);
          book.ready.pageList.resolve(book.pageList);
        }
      }, (error) => {
        book.ready.pageList.resolve([]);
      });
  } else if (book.contents.tocPath) {
    book.settings.tocUrl = book.settings.contentsPath + book.contents.tocPath;

    book.loadXml(book.settings.tocUrl)
      .then(tocXml =>
					 parse.toc(tocXml, book.spineIndexByURL, book.spine) // Grab Table of Contents
        , (err) => {
        console.error(err);
      }).then((toc) => {
        book.toc = book.contents.toc = toc;
        book.ready.toc.resolve(book.contents.toc);
      }, (error) => {
        book.ready.toc.resolve(false);
      });
  } else {
    book.ready.toc.resolve(false);
  }
};

EPUBJS.Book.prototype.createHiddenRender = function (renderer, _width, _height) {
  const box = this.element.getBoundingClientRect();
  const width = _width || this.settings.width || box.width;
  const height = _height || this.settings.height || box.height;
  let hiddenContainer;
  let hiddenEl;
  renderer.setMinSpreadWidth(this.settings.minSpreadWidth);
  renderer.setGap(this.settings.gap);

  this._registerReplacements(renderer);
  if (this.settings.forceSingle) {
    renderer.forceSingle(true);
  }

  hiddenContainer = document.createElement('div');
  hiddenContainer.style.visibility = 'hidden';
  hiddenContainer.style.overflow = 'hidden';
  hiddenContainer.style.width = '0';
  hiddenContainer.style.height = '0';
  this.element.appendChild(hiddenContainer);

  hiddenEl = document.createElement('div');
  hiddenEl.style.visibility = 'hidden';
  hiddenEl.style.overflow = 'hidden';
  hiddenEl.style.width = `${width}px`;// "0";
  hiddenEl.style.height = `${height}px`; // "0";
  hiddenContainer.appendChild(hiddenEl);

  renderer.initialize(hiddenEl, this.settings.width, this.settings.height);
  return hiddenContainer;
};

// Generates the pageList array by loading every chapter and paging through them
EPUBJS.Book.prototype.generatePageList = function (width, height, flag) {
  const pageList = [];
  const pager = new EPUBJS.Renderer(this.settings.render_method, false); // hidden
  pager.isPaginating = true;
  const hiddenContainer = this.createHiddenRender(pager, width, height);
  const deferred = new RSVP.defer();
  let spinePos = -1;
  const spineLength = this.spine.length;
  const totalPages = 0;
  let currentPage = 0;
  var nextChapter = function (deferred) {
    let chapter;
    const next = spinePos + 1;
    const done = deferred || new RSVP.defer();
    let loaded;
    if (next >= spineLength) {
      done.resolve();
    } else {
      if (flag && flag.cancelled) {
        pager.remove();
        this.element.removeChild(hiddenContainer);
        done.reject(new Error('User cancelled'));
        return;
      }

      spinePos = next;
      chapter = new EPUBJS.Chapter(this.spine[spinePos], this.store);
      pager.displayChapter(chapter, this.globalLayoutProperties).then((chap) => {
        _.each(pager.pageMap, (item) => {
          currentPage += 1;
          pageList.push({
            cfi: item.start,
            page: currentPage,
            content: item.content,
          });
        });

        if (pager.pageMap.length % 2 > 0 &&
					 pager.spreads) {
          currentPage += 1; // Handle Spreads
          pageList.push({
            cfi: pager.pageMap[pager.pageMap.length - 1].end,
            page: currentPage,
          });
        }

        // Load up the next chapter
        setTimeout(() => {
          nextChapter(done);
        }, 1);
      });
    }
    return done.promise;
  }.bind(this);

  const finished = nextChapter().then(() => {
    pager.remove();
    this.element.removeChild(hiddenContainer);
    deferred.resolve(pageList);
  }, (reason) => {
    deferred.reject(reason);
  });

  return deferred.promise;
};

// Render out entire book and generate the pagination
// Width and Height are optional and will default to the current dimensions
EPUBJS.Book.prototype.generatePagination = function (width, height, flag) {
  const book = this;
  const defered = new RSVP.defer();

  this.ready.spine.promise.then(() => {
    book.generatePageList(width, height, flag).then((pageList) => {
      book.pageList = book.contents.pageList = pageList;
      book.pagination.process(pageList);
      book.ready.pageList.resolve(book.pageList);
      defered.resolve(book.pageList);
    }, (reason) => {
      defered.reject(reason);
    });
  });

  return defered.promise;
};

// Process the pagination from a JSON array containing the pagelist
EPUBJS.Book.prototype.loadPagination = function (pagelistJSON) {
  let pageList;

  if (typeof (pagelistJSON) === 'string') {
    pageList = JSON.parse(pagelistJSON);
  } else {
    pageList = pagelistJSON;
  }

  if (pageList && pageList.length) {
    this.pageList = pageList;
    this.pagination.process(this.pageList);
    this.ready.pageList.resolve(this.pageList);
  }
  return this.pageList;
};

EPUBJS.Book.prototype.getPageList = function () {
  return this.ready.pageList.promise;
};

EPUBJS.Book.prototype.getMetadata = function () {
  return this.ready.metadata.promise;
};

EPUBJS.Book.prototype.getToc = function () {
  return this.ready.toc.promise;
};

/* Private Helpers */

// -- Listeners for browser events
EPUBJS.Book.prototype.networkListeners = function () {
  const book = this;
  window.addEventListener('offline', (e) => {
    book.online = false;
    if (book.settings.storage) {
      book.fromStorage(true);
    }
    book.trigger('book:offline');
  }, false);

  window.addEventListener('online', (e) => {
    book.online = true;
    if (book.settings.storage) {
      book.fromStorage(false);
    }
    book.trigger('book:online');
  }, false);
};

// Listen to all events the renderer triggers and pass them as book events
EPUBJS.Book.prototype.listenToRenderer = function (renderer) {
  const book = this;
  _.each(renderer.Events, (eventName) => {
    renderer.on(eventName, (e) => {
      book.trigger(eventName, e);
    });
  });

  renderer.on('renderer:visibleRangeChanged', (range) => {
    let startPage,
      endPage,
      percent;
    const pageRange = [];

    if (this.pageList.length > 0) {
      startPage = this.pagination.pageFromCfi(range.start);
      percent = this.pagination.percentageFromPage(startPage);
      pageRange.push(startPage);

      if (range.end) {
        endPage = this.pagination.pageFromCfi(range.end);
        // if(startPage != endPage) {
        pageRange.push(endPage);
        // }
      }
      this.trigger('book:pageChanged', {
        anchorPage: startPage,
        percentage: percent,
        pageRange,
      });

      // TODO: Add event for first and last page.
      // (though last is going to be hard, since it could be several reflowed pages long)
    }
  });

  renderer.on('render:loaded', this.loadChange.bind(this));
};

// Listens for load events from the Renderer and checks against the current chapter
// Prevents the Render from loading a different chapter when back button is pressed
EPUBJS.Book.prototype.loadChange = function (url) {
  const uri = EPUBJS.core.uri(url);
  const chapterUri = EPUBJS.core.uri(this.currentChapter.absolute);
  let spinePos,
    chapter;

  if (uri.path != chapterUri.path) {
    console.warn('Miss Match', uri.path, this.currentChapter.absolute);
    // this.goto(uri.filename);

    // Set the current chapter to what is being displayed
    spinePos = this.spineIndexByURL[uri.filename];
    chapter = new EPUBJS.Chapter(this.spine[spinePos], this.store);
    this.currentChapter = chapter;

    // setup the renderer with the displayed chapter
    this.renderer.currentChapter = chapter;
    this.renderer.afterLoad(this.renderer.render.docEl);
    this.renderer.beforeDisplay(() => {
      this.renderer.afterDisplay();
    });
  } else if (!this._rendering) {
    this.renderer.reformat();
  }
};

EPUBJS.Book.prototype.unlistenToRenderer = function (renderer) {
  _.each(renderer.Events, (eventName) => {
    renderer.off(eventName);
  });
};

// -- Returns the cover
EPUBJS.Book.prototype.coverUrl = function () {
  const retrieved = this.ready.cover.promise
    .then((url) => {
      if (this.settings.fromStorage) {
        return this.store.getUrl(this.contents.cover);
      } else if (this.settings.contained) {
        return this.zip.getUrl(this.contents.cover);
      }
      return this.contents.cover;
    });

  retrieved.then((url) => {
    this.cover = url;
  });

  return retrieved;
};

// -- Choose between a request from store or a request from network
EPUBJS.Book.prototype.loadXml = function (url) {
  if (this.settings.fromStorage) {
    return this.store.getXml(url, this.settings.encoding);
  } else if (this.settings.contained) {
    return this.zip.getXml(url, this.settings.encoding);
  }
  return EPUBJS.core.request(url, 'xml', this.settings.withCredentials);
};

// -- Turns a url into a absolute url
EPUBJS.Book.prototype.urlFrom = function (bookPath) {
  let uri = EPUBJS.core.uri(bookPath),
    absolute = uri.protocol,
    fromRoot = uri.path[0] == '/',
    location = window.location,
    // -- Get URL orgin, try for native or combine
    origin = location.origin || `${location.protocol}//${location.host}`,
    baseTag = document.getElementsByTagName('base'),
    base;


  // -- Check is Base tag is set

  if (baseTag.length) {
    base = baseTag[0].href;
  }

  // -- 1. Check if url is absolute
  if (uri.protocol) {
    return uri.origin + uri.path;
  }

  // -- 2. Check if url starts with /, add base url
  if (!absolute && fromRoot) {
    return (base || origin) + uri.path;
  }

  // -- 3. Or find full path to url and add that
  if (!absolute && !fromRoot) {
    return EPUBJS.core.resolveUrl(base || location.pathname, uri.path);
  }
};


EPUBJS.Book.prototype.unarchive = function (bookPath) {
  let book = this,
    unarchived;

  // -- Must use storage
  // if(this.settings.storage == false ){
  // this.settings.storage = true;
  // this.storage = new fileStorage.storage();
  // }

  this.zip = new EPUBJS.Unarchiver();
  this.store = this.zip; // Use zip storaged in ram
  return this.zip.open(bookPath);
};

// -- Checks if url has a .epub or .zip extension, or is ArrayBuffer (of zip/epub)
EPUBJS.Book.prototype.isContained = function (bookUrl) {
  if (bookUrl instanceof ArrayBuffer) {
    return true;
  }
  const uri = EPUBJS.core.uri(bookUrl);

  if (uri.extension && (uri.extension == 'epub' || uri.extension == 'zip')) {
    return true;
  }

  return false;
};

// -- Checks if the book can be retrieved from localStorage
EPUBJS.Book.prototype.isSaved = function (bookKey) {
  let storedSettings;

  if (!localStorage) {
    return false;
  }

  storedSettings = localStorage.getItem(bookKey);

  if (!localStorage ||
		storedSettings === null) {
    return false;
  }
  return true;
};

// Generates the Book Key using the identifer in the manifest or other string provided
EPUBJS.Book.prototype.generateBookKey = function (identifier) {
  return `epubjs:${EPUBJS.VERSION}:${window.location.host}:${identifier}`;
};

EPUBJS.Book.prototype.saveContents = function () {
  if (!localStorage) {
    return false;
  }
  localStorage.setItem(this.settings.bookKey, JSON.stringify(this.contents));
};

EPUBJS.Book.prototype.removeSavedContents = function () {
  if (!localStorage) {
    return false;
  }
  localStorage.removeItem(this.settings.bookKey);
};


// -- Takes a string or a element
EPUBJS.Book.prototype.renderTo = function (elem) {
  let book = this,
    rendered;

  if (EPUBJS.core.isElement(elem)) {
    this.element = elem;
  } else if (typeof elem === 'string') {
    this.element = EPUBJS.core.getEl(elem);
  } else {
    console.error('Not an Element');
    return;
  }

  rendered = this.opened
    .then(() => {
      // book.render = new EPUBJS.Renderer[this.settings.renderer](book);
      book.renderer.initialize(book.element, book.settings.width, book.settings.height);

      if (book.metadata.direction) {
        book.renderer.setDirection(book.metadata.direction);
      }

      book._rendered();
      return book.startDisplay();
    });

  // rendered.then(null, function(error) { console.error(error); });

  return rendered;
};

EPUBJS.Book.prototype.startDisplay = function () {
  let display;

  if (this.settings.goto) {
    display = this.goto(this.settings.goto);
  } else if (this.settings.previousLocationCfi) {
    display = this.gotoCfi(this.settings.previousLocationCfi);
  } else {
    display = this.displayChapter(this.spinePos, this.settings.displayLastPage);
  }

  return display;
};

EPUBJS.Book.prototype.restore = function (identifier) {
  let book = this,
    fetch = ['manifest', 'spine', 'metadata', 'cover', 'toc', 'spineNodeIndex', 'spineIndexByURL', 'globalLayoutProperties'],
    reject = false,
    bookKey = this.generateBookKey(identifier),
    fromStore = localStorage.getItem(bookKey),
    len = fetch.length,
    i;

  if (this.settings.clearSaved) reject = true;

  if (!reject && fromStore != 'undefined' && fromStore !== null) {
    book.contents = JSON.parse(fromStore);

    for (i = 0; i < len; i++) {
      const item = fetch[i];

      if (!book.contents[item]) {
        reject = true;
        break;
      }
      book[item] = book.contents[item];
    }
  }

  if (reject || !fromStore || !this.contents || !this.settings.contentsPath) {
    return false;
  }
  this.settings.bookKey = bookKey;
  this.ready.manifest.resolve(this.manifest);
  this.ready.spine.resolve(this.spine);
  this.ready.metadata.resolve(this.metadata);
  this.ready.cover.resolve(this.cover);
  this.ready.toc.resolve(this.toc);
  return true;
};

EPUBJS.Book.prototype.displayChapter = function (chap, end, deferred) {
  let book = this,
    render,
    cfi,
    pos,
    store,
    defer = deferred || new RSVP.defer();

  let chapter;

  if (!this.isRendered) {
    this._q.enqueue('displayChapter', arguments);
    // Reject for now. TODO: pass promise to queue
    defer.reject({
      message: 'Rendering',
      stack: new Error().stack,
    });
    return defer.promise;
  }


  if (this._rendering || this.renderer._moving) {
    // Pass along the current defer
    this._displayQ.enqueue('displayChapter', [chap, end, defer]);
    return defer.promise;
  }

  if (EPUBJS.core.isNumber(chap)) {
    pos = chap;
  } else {
    cfi = new EPUBJS.EpubCFI(chap);
    pos = cfi.spinePos;
  }

  if (pos < 0 || pos >= this.spine.length) {
    console.warn('Not A Valid Location');
    pos = 0;
    end = false;
    cfi = false;
  }

  // -- Create a new chapter
  chapter = new EPUBJS.Chapter(this.spine[pos], this.store);

  this._rendering = true;

  if (this._needsAssetReplacement()) {
    chapter.registerHook('beforeChapterRender', [
      EPUBJS.replace.head,
      EPUBJS.replace.resources,
      EPUBJS.replace.posters,
      EPUBJS.replace.svg,
    ], true);
  }

  book.currentChapter = chapter;

  render = book.renderer.displayChapter(chapter, this.globalLayoutProperties);
  if (cfi) {
    book.renderer.gotoCfi(cfi);
  } else if (end) {
    book.renderer.lastPage();
  }
  // -- Success, Clear render queue
  render.then((rendered) => {
    // var inwait;
    // -- Set the book's spine position
    book.spinePos = pos;

    defer.resolve(book.renderer);

    if (book.settings.fromStorage === false &&
			book.settings.contained === false) {
      book.preloadNextChapter();
    }

    book._rendering = false;
    book._displayQ.dequeue();
    if (book._displayQ.length() === 0) {
      book._gotoQ.dequeue();
    }
  }, (error) => {
    // handle errors in either of the two requests
    console.error(`Could not load Chapter: ${chapter.absolute}`, error);
    book.trigger('book:chapterLoadFailed', chapter.absolute);
    book._rendering = false;
    defer.reject(error);
  });

  return defer.promise;
};

EPUBJS.Book.prototype.nextPage = function (defer) {
  var defer = defer || new RSVP.defer();

  if (!this.isRendered) {
    this._q.enqueue('nextPage', [defer]);
    return defer.promise;
  }

  const next = this.renderer.nextPage();
  if (!next) {
    return this.nextChapter(defer);
  }

  defer.resolve(true);
  return defer.promise;
};

EPUBJS.Book.prototype.prevPage = function (defer) {
  var defer = defer || new RSVP.defer();

  if (!this.isRendered) {
    this._q.enqueue('prevPage', [defer]);
    return defer.promise;
  }

  const prev = this.renderer.prevPage();
  if (!prev) {
    return this.prevChapter(defer);
  }

  defer.resolve(true);
  return defer.promise;
};

EPUBJS.Book.prototype.nextChapter = function (defer) {
  var defer = defer || new RSVP.defer();

  if (this.spinePos < this.spine.length - 1) {
    let next = this.spinePos + 1;
    // Skip non linear chapters
    while (this.spine[next] && this.spine[next].linear && this.spine[next].linear == 'no') {
      next++;
    }
    if (next < this.spine.length) {
      return this.displayChapter(next, false, defer);
    }
  }

  this.trigger('book:atEnd');
  defer.resolve(true);
  return defer.promise;
};

EPUBJS.Book.prototype.prevChapter = function (defer) {
  var defer = defer || new RSVP.defer();

  if (this.spinePos > 0) {
    let prev = this.spinePos - 1;
    while (this.spine[prev] && this.spine[prev].linear && this.spine[prev].linear == 'no') {
      prev--;
    }
    if (prev >= 0) {
      return this.displayChapter(prev, true, defer);
    }
  }

  this.trigger('book:atStart');
  defer.resolve(true);
  return defer.promise;
};

EPUBJS.Book.prototype.getCurrentLocationCfi = function () {
  if (!this.isRendered) return false;
  return this.renderer.currentLocationCfi;
};

EPUBJS.Book.prototype.goto = function (target) {
  if (target.indexOf('epubcfi(') === 0) {
    return this.gotoCfi(target);
  } else if (target.indexOf('%') === target.length - 1) {
    return this.gotoPercentage(parseInt(target.substring(0, target.length - 1)) / 100);
  } else if (typeof target === 'number' || isNaN(target) === false) {
    return this.gotoPage(target);
  }
  return this.gotoHref(target);
};

EPUBJS.Book.prototype.gotoCfi = function (cfiString, defer) {
  let cfi,
    spinePos,
    spineItem,
    rendered,
    promise,
    render,
    deferred = defer || new RSVP.defer();

  if (!this.isRendered) {
    console.warn('Not yet Rendered');
    this.settings.previousLocationCfi = cfiString;
    return false;
  }

  // Currently going to a chapter
  if (this._moving || this._rendering) {
    console.warn('Renderer is moving');
    this._gotoQ.enqueue('gotoCfi', [cfiString, deferred]);
    return false;
  }

  cfi = new EPUBJS.EpubCFI(cfiString);
  spinePos = cfi.spinePos;

  if (spinePos == -1) {
    return false;
  }

  spineItem = this.spine[spinePos];
  promise = deferred.promise;
  this._moving = true;
  // -- If same chapter only stay on current chapter
  if (this.currentChapter && this.spinePos === spinePos) {
    this.renderer.gotoCfi(cfi);
    this._moving = false;
    deferred.resolve(this.renderer.currentLocationCfi);
  } else {
    if (!spineItem || spinePos == -1) {
      spinePos = 0;
      spineItem = this.spine[spinePos];
    }

    render = this.displayChapter(cfiString);

    render.then((rendered) => {
      this._moving = false;
      deferred.resolve(rendered.currentLocationCfi);
    }, () => {
      this._moving = false;
    });
  }

  promise.then(() => {
    this._gotoQ.dequeue();
  });

  return promise;
};

EPUBJS.Book.prototype.gotoHref = function (url, defer) {
  let split,
    chapter,
    section,
    relativeURL,
    spinePos;
  const deferred = defer || new RSVP.defer();

  if (!this.isRendered) {
    this.settings.goto = url;
    return false;
  }

  // Currently going to a chapter
  if (this._moving || this._rendering) {
    this._gotoQ.enqueue('gotoHref', [url, deferred]);
    return false;
  }

  split = url.split('#');
  chapter = split[0];
  section = split[1] || false;
  if (chapter.search('://') == -1) {
    relativeURL = chapter.replace(EPUBJS.core.uri(this.settings.contentsPath).path, '');
  } else {
    relativeURL = chapter.replace(this.settings.contentsPath, '');
  }
  spinePos = this.spineIndexByURL[relativeURL];

  // -- If link fragment only stay on current chapter
  if (!chapter) {
    spinePos = this.currentChapter ? this.currentChapter.spinePos : 0;
  }

  // -- Check that URL is present in the index, or stop
  if (typeof (spinePos) !== 'number') return false;

  if (!this.currentChapter || spinePos != this.currentChapter.spinePos) {
    // -- Load new chapter if different than current
    return this.displayChapter(spinePos).then(() => {
      if (section) {
        this.renderer.section(section);
      }
      deferred.resolve(this.renderer.currentLocationCfi);
    });
  }
  // --  Goto section
  if (section) {
    this.renderer.section(section);
  } else {
    // Or jump to the start
    this.renderer.firstPage();
  }
  deferred.resolve(this.renderer.currentLocationCfi);


  deferred.promise.then(() => {
    this._gotoQ.dequeue();
  });

  return deferred.promise;
};

EPUBJS.Book.prototype.gotoPage = function (pg) {
  const cfi = this.pagination.cfiFromPage(pg);
  return this.gotoCfi(cfi);
};

EPUBJS.Book.prototype.gotoPercentage = function (percent) {
  const pg = this.pagination.pageFromPercentage(percent);
  return this.gotoPage(pg);
};

EPUBJS.Book.prototype.preloadNextChapter = function () {
  let next;
  const chap = this.spinePos + 1;

  if (chap >= this.spine.length) {
    return false;
  }

  next = new EPUBJS.Chapter(this.spine[chap]);
  if (next) {
    EPUBJS.core.request(next.absolute);
  }
};

EPUBJS.Book.prototype.storeOffline = function () {
  let book = this,
    assets = EPUBJS.core.values(this.manifest);

  // -- Creates a queue of all items to load
  return this.store.put(assets)
    .then(() => {
      book.settings.stored = true;
      book.trigger('book:stored');
    });
};

EPUBJS.Book.prototype.availableOffline = function () {
  return this.settings.stored > 0;
};

EPUBJS.Book.prototype.toStorage = function () {
  const key = this.settings.bookKey;
  this.store.isStored(key).then((stored) => {
    if (stored === true) {
      this.settings.stored = true;
      return true;
    }

    return this.storeOffline()
      .then(() => {
        this.store.token(key, true);
      });
  });
};
EPUBJS.Book.prototype.fromStorage = function (stored) {
  const hooks = [
    EPUBJS.replace.head,
    EPUBJS.replace.resources,
    EPUBJS.replace.posters,
    EPUBJS.replace.svg,
  ];

  if (this.contained || this.settings.contained) return;

  // -- If there is network connection, store the books contents
  if (this.online) {
    this.opened.then(this.toStorage.bind(this));
  }

  if (this.store && this.settings.fromStorage && stored === false) {
    this.settings.fromStorage = false;
    this.store.off('offline');
    // this.renderer.removeHook("beforeChapterRender", hooks, true);
    this.store = false;
  } else if (!this.settings.fromStorage) {
    this.store = new EPUBJS.Storage(this.settings.credentials);
    this.store.on('offline', (offline) => {
      if (!offline) {
        // Online
        this.offline = false;
        this.settings.fromStorage = false;
        // this.renderer.removeHook("beforeChapterRender", hooks, true);
        this.trigger('book:online');
      } else {
        // Offline
        this.offline = true;
        this.settings.fromStorage = true;
        // this.renderer.registerHook("beforeChapterRender", hooks, true);
        this.trigger('book:offline');
      }
    });
  }
};

EPUBJS.Book.prototype.setStyle = function (style, val, prefixed) {
  const noreflow = ['color', 'background', 'background-color'];

  if (!this.isRendered) return this._q.enqueue('setStyle', arguments);

  this.settings.styles[style] = val;

  this.renderer.setStyle(style, val, prefixed);

  if (noreflow.indexOf(style) === -1) {
    // clearTimeout(this.reformatTimeout);
    // this.reformatTimeout = setTimeout(function(){
    this.renderer.reformat();
    // }.bind(this), 10);
  }
};

EPUBJS.Book.prototype.removeStyle = function (style) {
  if (!this.isRendered) return this._q.enqueue('removeStyle', arguments);
  this.renderer.removeStyle(style);
  this.renderer.reformat();
  delete this.settings.styles[style];
};

EPUBJS.Book.prototype.resetClasses = function (classes) {
  if (!this.isRendered) return this._q.enqueue('setClasses', arguments);

  if (classes.constructor === String) classes = [classes];

  this.settings.classes = classes;

  this.renderer.setClasses(this.settings.classes);
  this.renderer.reformat();
};

EPUBJS.Book.prototype.addClass = function (aClass) {
  if (!this.isRendered) return this._q.enqueue('addClass', arguments);

  if (this.settings.classes.indexOf(aClass) == -1) {
    this.settings.classes.push(aClass);
  }

  this.renderer.setClasses(this.settings.classes);
  this.renderer.reformat();
};

EPUBJS.Book.prototype.removeClass = function (aClass) {
  if (!this.isRendered) return this._q.enqueue('removeClass', arguments);

  const idx = this.settings.classes.indexOf(aClass);

  if (idx != -1) {
    delete this.settings.classes[idx];

    this.renderer.setClasses(this.settings.classes);
    this.renderer.reformat();
  }
};

EPUBJS.Book.prototype.addHeadTag = function (tag, attrs) {
  if (!this.isRendered) return this._q.enqueue('addHeadTag', arguments);
  this.settings.headTags[tag] = attrs;
};

EPUBJS.Book.prototype.useSpreads = function (use) {
  console.warn('useSpreads is deprecated, use forceSingle or set a layoutOveride instead');
  if (use === false) {
    this.forceSingle(true);
  } else {
    this.forceSingle(false);
  }
};

EPUBJS.Book.prototype.forceSingle = function (_use) {
  const force = typeof _use === 'undefined' ? true : _use;

  this.renderer.forceSingle(force);
  this.settings.forceSingle = force;
  if (this.isRendered) {
    this.renderer.reformat();
  }
};

EPUBJS.Book.prototype.setMinSpreadWidth = function (width) {
  this.settings.minSpreadWidth = width;
  if (this.isRendered) {
    this.renderer.setMinSpreadWidth(this.settings.minSpreadWidth);
    this.renderer.reformat();
  }
};

EPUBJS.Book.prototype.setGap = function (gap) {
  this.settings.gap = gap;
  if (this.isRendered) {
    this.renderer.setGap(this.settings.gap);
    this.renderer.reformat();
  }
};

EPUBJS.Book.prototype.chapter = function (path) {
  const spinePos = this.spineIndexByURL[path];
  let spineItem;
  let chapter;

  if (spinePos) {
    spineItem = this.spine[spinePos];
    chapter = new EPUBJS.Chapter(spineItem, this.store, this.settings.withCredentials);
    chapter.load();
  }
  return chapter;
};

EPUBJS.Book.prototype.unload = function () {
  if (this.settings.restore && localStorage) {
    this.saveContents();
  }

  this.unlistenToRenderer(this.renderer);

  this.trigger('book:unload');
};

EPUBJS.Book.prototype.destroy = function () {
  window.removeEventListener('beforeunload', this.unload);

  if (this.currentChapter) this.currentChapter.unload();

  this.unload();

  if (this.renderer) this.renderer.remove();
};

EPUBJS.Book.prototype._ready = function () {
  this.trigger('book:ready');
};

EPUBJS.Book.prototype._rendered = function (err) {
  const book = this;

  this.isRendered = true;
  this.trigger('book:rendered');

  this._q.flush();
};


EPUBJS.Book.prototype.applyStyles = function (renderer, callback) {
  // if(!this.isRendered) return this._q.enqueue("applyStyles", arguments);
  renderer.applyStyles(this.settings.styles);
  callback();
};

EPUBJS.Book.prototype.applyClasses = function (renderer, callback) {
  // if(!this.isRendered) return this._q.enqueue("applyClasses", arguments);
  renderer.setClasses(this.settings.classes);
  callback();
};

EPUBJS.Book.prototype.applyHeadTags = function (renderer, callback) {
  // if(!this.isRendered) return this._q.enqueue("applyHeadTags", arguments);
  renderer.applyHeadTags(this.settings.headTags);
  callback();
};

EPUBJS.Book.prototype._registerReplacements = function (renderer) {
  renderer.registerHook('beforeChapterDisplay', this.applyStyles.bind(this, renderer), true);
  renderer.registerHook('beforeChapterDisplay', this.applyHeadTags.bind(this, renderer), true);
  renderer.registerHook('beforeChapterDisplay', this.applyClasses.bind(this, renderer), true);
  renderer.registerHook('beforeChapterDisplay', EPUBJS.replace.hrefs.bind(this), true);
};

EPUBJS.Book.prototype._needsAssetReplacement = function () {
  if (this.settings.fromStorage) {
    // -- Filesystem api links are relative, so no need to replace them
    // if(this.storage.getStorageType() == "filesystem") {
    // 	return false;
    // }

    return true;
  } else if (this.settings.contained) {
    return true;
  }

  return false;
};


// -- http://www.idpf.org/epub/fxl/
EPUBJS.Book.prototype.parseLayoutProperties = function (metadata) {
  const layout = (this.settings.layoutOveride && this.settings.layoutOveride.layout) || metadata.layout || 'reflowable';
  const spread = (this.settings.layoutOveride && this.settings.layoutOveride.spread) || metadata.spread || 'auto';
  const orientation = (this.settings.layoutOveride && this.settings.layoutOveride.orientation) || metadata.orientation || 'auto';
  return {
    layout,
    spread,
    orientation,
  };
};

// -- Enable binding events to book
RSVP.EventTarget.mixin(EPUBJS.Book.prototype);

// -- Handle RSVP Errors
RSVP.on('error', (event) => {
  console.error(event);
});

RSVP.configure('instrument', true); // -- true | will logging out all RSVP rejections
// RSVP.on('created', listener);
// RSVP.on('chained', listener);
// RSVP.on('fulfilled', listener);
// RSVP.on('rejected', function(event){
// 	console.error(event.detail.message, event.detail.stack);
// });

EPUBJS.Chapter = function (spineObject, store, credentials) {
  this.href = spineObject.href;
  this.absolute = spineObject.url;
  this.id = spineObject.id;
  this.spinePos = spineObject.index;
  this.cfiBase = spineObject.cfiBase;
  this.properties = spineObject.properties;
  this.manifestProperties = spineObject.manifestProperties;
  this.linear = spineObject.linear;
  this.pages = 1;
  this.store = store;
  this.credentials = credentials;
  this.epubcfi = new EPUBJS.EpubCFI();
  this.deferred = new RSVP.defer();
  this.loaded = this.deferred.promise;

  EPUBJS.Hooks.mixin(this);
  // -- Get pre-registered hooks for events
  this.getHooks('beforeChapterRender');

  // Cached for replacement urls from storage
  this.caches = {};
};


EPUBJS.Chapter.prototype.load = function (_store, _credentials) {
  const store = _store || this.store;
  const credentials = _credentials || this.credentials;
  let promise;
  // if(this.store && (!this.book.online || this.book.contained))
  if (store) {
    promise = store.getXml(this.absolute);
  } else {
    promise = EPUBJS.core.request(this.absolute, false, credentials);
  }

  promise.then((xml) => {
    try {
      this.setDocument(xml);
      this.deferred.resolve(this);
    } catch (error) {
      this.deferred.reject({
        message: `${this.absolute} -> ${error.message}`,
        stack: new Error().stack,
      });
    }
  });

  return promise;
};

EPUBJS.Chapter.prototype.render = function (_store) {
  return this.load().then((doc) => {
    const head = doc.querySelector('head');
    const base = doc.createElement('base');

    base.setAttribute('href', this.absolute);
    head.insertBefore(base, head.firstChild);

    this.contents = doc;

    return new RSVP.Promise(((resolve, reject) => {
      this.triggerHooks('beforeChapterRender', () => {
        resolve(doc);
      }, this);
    }));
  })
    .then((doc) => {
      const serializer = new XMLSerializer();
      const contents = serializer.serializeToString(doc);
      return contents;
    });
};

EPUBJS.Chapter.prototype.url = function (_store) {
  const deferred = new RSVP.defer();
  const store = _store || this.store;
  let loaded;
  const chapter = this;
  let url;

  if (store) {
    if (!this.tempUrl) {
      store.getUrl(this.absolute).then((url) => {
        chapter.tempUrl = url;
        deferred.resolve(url);
      });
    } else {
      url = this.tempUrl;
      deferred.resolve(url);
    }
  } else {
    url = this.absolute;
    deferred.resolve(url);
  }

  return deferred.promise;
};

EPUBJS.Chapter.prototype.setPages = function (num) {
  this.pages = num;
};

EPUBJS.Chapter.prototype.getPages = function (num) {
  return this.pages;
};

EPUBJS.Chapter.prototype.getID = function () {
  return this.ID;
};

EPUBJS.Chapter.prototype.unload = function (store) {
  this.document = null;
  if (this.tempUrl && store) {
    store.revokeUrl(this.tempUrl);
    this.tempUrl = false;
  }
};

EPUBJS.Chapter.prototype.setDocument = function (_document) {
  // var uri = _document.namespaceURI;
  // var doctype = _document.doctype;
  //
  // // Creates an empty document
  // this.document = _document.implementation.createDocument(
  // 		uri,
  // 		null,
  // 		null
  // );
  // this.contents = this.document.importNode(
  // 		_document.documentElement, //node to import
  // 		true                         //clone its descendants
  // );
  //
  // this.document.appendChild(this.contents);
  this.document = _document;
  this.contents = _document.documentElement;

  // Fix to apply wgxpath to new document in IE
  if (!this.document.evaluate && document.evaluate) {
    this.document.evaluate = document.evaluate;
  }

  // this.deferred.resolve(this.contents);
};

EPUBJS.Chapter.prototype.cfiFromRange = function (_range) {
  let range;
  let startXpath,
    endXpath;
  let startContainer,
    endContainer;
  let cleanTextContent,
    cleanStartTextContent,
    cleanEndTextContent;

  // Check for Contents
  if (!this.document) return;

  if (typeof document.evaluate !== 'undefined') {
    startXpath = EPUBJS.core.getElementXPath(_range.startContainer);
    // console.log(startContainer)
    endXpath = EPUBJS.core.getElementXPath(_range.endContainer);

    startContainer = this.document.evaluate(startXpath, this.document, EPUBJS.core.nsResolver, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;

    if (!_range.collapsed) {
      endContainer = this.document.evaluate(endXpath, this.document, EPUBJS.core.nsResolver, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
    }

    range = this.document.createRange();
    // Find Exact Range in original document
    if (startContainer) {
      try {
        range.setStart(startContainer, _range.startOffset);
        if (!_range.collapsed && endContainer) {
          range.setEnd(endContainer, _range.endOffset);
        }
      } catch (e) {
        console.log('missed');
        startContainer = false;
      }
    }

    // Fuzzy Match
    if (!startContainer) {
      console.log('not found, try fuzzy match');
      cleanStartTextContent = EPUBJS.core.cleanStringForXpath(_range.startContainer.textContent);
      startXpath = `//text()[contains(.,${cleanStartTextContent})]`;

      startContainer = this.document.evaluate(startXpath, this.document, EPUBJS.core.nsResolver, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;

      if (startContainer) {
        // console.log("Found with Fuzzy");
        range.setStart(startContainer, _range.startOffset);

        if (!_range.collapsed) {
          cleanEndTextContent = EPUBJS.core.cleanStringForXpath(_range.endContainer.textContent);
          endXpath = `//text()[contains(.,${cleanEndTextContent})]`;
          endContainer = this.document.evaluate(endXpath, this.document, EPUBJS.core.nsResolver, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
          if (endContainer) {
            range.setEnd(endContainer, _range.endOffset);
          }
        }
      }
    }
  } else {
    range = _range; // Just evaluate the current documents range
  }

  // Generate the Cfi
  return this.epubcfi.generateCfiFromRange(range, this.cfiBase);
};

EPUBJS.Chapter.prototype.find = function (_query) {
  const chapter = this;
  const matches = [];
  const query = _query.toLowerCase();
  // var xpath = this.document.evaluate(".//text()[contains(translate(., '"+query.toUpperCase()+"', '"+query+"'),'"+query+"')]", this.document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
  const find = function (node) {
    // Search String
    const text = node.textContent.toLowerCase();
    let range = chapter.document.createRange();
    let cfi;
    let pos;
    let last = -1;
    let excerpt;
    const limit = 150;

    while (pos != -1) {
      pos = text.indexOf(query, last + 1);

      if (pos != -1) {
        // If Found, Create Range
        range = chapter.document.createRange();
        range.setStart(node, pos);
        range.setEnd(node, pos + query.length);

        // Generate CFI
        cfi = chapter.cfiFromRange(range);

        // Generate Excerpt
        if (node.textContent.length < limit) {
          excerpt = node.textContent;
        } else {
          excerpt = node.textContent.substring(pos - limit / 2, pos + limit / 2);
          excerpt = `...${excerpt}...`;
        }

        // Add CFI to list
        matches.push({
          cfi,
          excerpt,
        });
      }

      last = pos;
    }
  };

  // Grab text nodes

  /*
	for ( var i=0 ; i < xpath.snapshotLength; i++ ) {
		find(xpath.snapshotItem(i));
	}
	*/

  this.textSprint(this.document, (node) => {
    find(node);
  });


  // Return List of CFIs
  return matches;
};


EPUBJS.Chapter.prototype.textSprint = function (root, func) {
  const treeWalker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      if (node.data && ! /^\s*$/.test(node.data)) {
        return NodeFilter.FILTER_ACCEPT;
      }
      return NodeFilter.FILTER_REJECT;
    },
  }, false);
  let node;
  while ((node = treeWalker.nextNode())) {
    func(node);
  }
};

EPUBJS.Chapter.prototype.replace = function (query, func, finished, progress) {
  let items = this.contents.querySelectorAll(query),
    resources = Array.prototype.slice.call(items),
    count = resources.length;


  if (count === 0) {
    finished(false);
    return;
  }
  _.each(resources, (item) => {
    let called = false;
    const after = function (result, full) {
      if (called === false) {
        count--;
        if (progress) progress(result, full, count);
        if (count <= 0 && finished) finished(true);
        called = true;
      }
    };

    func(item, after);
  });
};

EPUBJS.Chapter.prototype.replaceWithStored = function (query, attr, func, callback) {
  let _oldUrls,
    _newUrls = {},
    _store = this.store,
    _cache = this.caches[query],
    _uri = EPUBJS.core.uri(this.absolute),
    _chapterBase = _uri.base,
    _attr = attr,
    _wait = 5,
    progress = function (url, full, count) {
      _newUrls[full] = url;
    },
    finished = function (notempty) {
      if (callback) callback();
      _.each(EPUBJS.core.values(_oldUrls), (url) => {
        _store.revokeUrl(url);
      });

      _cache = _newUrls;
    };

  if (!_store) return;

  if (!_cache) _cache = {};
  _oldUrls = EPUBJS.core.clone(_cache);

  this.replace(query, (link, done) => {
    let src = link.getAttribute(_attr),
      full = EPUBJS.core.resolveUrl(_chapterBase, src);

    const replaceUrl = function (url) {
      let timeout;
      link.onload = function () {
        clearTimeout(timeout);
        done(url, full);
      };

      /*
				link.onerror = function(e){
					clearTimeout(timeout);
					done(url, full);
					console.error(e);
				};
				*/

      if (query == 'svg image') {
        // -- SVG needs this to trigger a load event
        link.setAttribute('externalResourcesRequired', 'true');
      }

      if (query == 'link[href]' && link.getAttribute('rel') !== 'stylesheet') {
        // -- Only Stylesheet links seem to have a load events, just continue others
        done(url, full);
      } else {
        timeout = setTimeout(() => {
          done(url, full);
        }, _wait);
      }

      if (url) {
        link.setAttribute(_attr, url);
      }
    };

    if (full in _oldUrls) {
      replaceUrl(_oldUrls[full]);
      _newUrls[full] = _oldUrls[full];
      delete _oldUrls[full];
    } else {
      func(_store, full, replaceUrl, link);
    }
  }, finished, progress);
};

var EPUBJS = EPUBJS || {};
EPUBJS.core = {};

const ELEMENT_NODE = 1;
const TEXT_NODE = 3;
const COMMENT_NODE = 8;
const DOCUMENT_NODE = 9;

// -- Get a element for an id
EPUBJS.core.getEl = function (elem) {
  return document.getElementById(elem);
};

// -- Get all elements for a class
EPUBJS.core.getEls = function (classes) {
  return document.getElementsByClassName(classes);
};

EPUBJS.core.request = function (url, type, withCredentials) {
  const supportsURL = window.URL;
  const BLOB_RESPONSE = supportsURL ? 'blob' : 'arraybuffer';
  const deferred = new RSVP.defer();
  const xhr = new XMLHttpRequest();
  let uri;

  // -- Check from PDF.js:
  //   https://github.com/mozilla/pdf.js/blob/master/web/compatibility.js
  const xhrPrototype = XMLHttpRequest.prototype;

  const handler = function () {
    let r;

    if (this.readyState != this.DONE) return;

    if ((this.status === 200 || this.status === 0) && this.response) { // Android & Firefox reporting 0 for local & blob urls
      if (type == 'xml') {
        // If this.responseXML wasn't set, try to parse using a DOMParser from text
        if (!this.responseXML) {
          r = new DOMParser().parseFromString(this.response, 'application/xml');
        } else {
          r = this.responseXML;
        }
      } else if (type == 'xhtml') {
        if (!this.responseXML) {
          r = new DOMParser().parseFromString(this.response, 'application/xhtml+xml');
        } else {
          r = this.responseXML;
        }
      } else if (type == 'html') {
        if (!this.responseXML) {
          r = new DOMParser().parseFromString(this.response, 'text/html');
        } else {
          r = this.responseXML;
        }
      } else if (type == 'json') {
        r = JSON.parse(this.response);
      } else if (type == 'blob') {
        if (supportsURL) {
          r = this.response;
        } else {
          // -- Safari doesn't support responseType blob, so create a blob from arraybuffer
          r = new Blob([this.response]);
        }
      } else {
        r = this.response;
      }

      deferred.resolve(r);
    } else {
      deferred.reject({
        message: this.response,
        stack: new Error().stack,
      });
    }
  };

  if (!('overrideMimeType' in xhrPrototype)) {
    // IE10 might have response, but not overrideMimeType
    Object.defineProperty(xhrPrototype, 'overrideMimeType', {
      value: function xmlHttpRequestOverrideMimeType(mimeType) {},
    });
  }

  xhr.onreadystatechange = handler;
  xhr.open('GET', url, true);

  if (withCredentials) {
    xhr.withCredentials = true;
  }

  // If type isn't set, determine it from the file extension
  if (!type) {
    uri = EPUBJS.core.uri(url);
    type = uri.extension;
    type = {
      htm: 'html',
    }[type] || type;
  }

  if (type == 'blob') {
    xhr.responseType = BLOB_RESPONSE;
  }

  if (type == 'json') {
    xhr.setRequestHeader('Accept', 'application/json');
  }

  if (type == 'xml') {
    xhr.responseType = 'document';
    xhr.overrideMimeType('text/xml'); // for OPF parsing
  }

  if (type == 'xhtml') {
    xhr.responseType = 'document';
  }

  if (type == 'html') {
    xhr.responseType = 'document';
 	}

  if (type == 'binary') {
    xhr.responseType = 'arraybuffer';
  }

  xhr.send();

  return deferred.promise;
};

EPUBJS.core.toArray = function (obj) {
  const arr = [];

  for (const member in obj) {
    var newitm;
    if (obj.hasOwnProperty(member)) {
      newitm = obj[member];
      newitm.ident = member;
      arr.push(newitm);
    }
  }

  return arr;
};

// -- Parse the different parts of a url, returning a object
EPUBJS.core.uri = function (url) {
  let uri = {
      protocol: '',
      host: '',
      path: '',
      origin: '',
      directory: '',
      base: '',
      filename: '',
      extension: '',
      fragment: '',
      href: url,
    },
    blob = url.indexOf('blob:'),
    doubleSlash = url.indexOf('://'),
    search = url.indexOf('?'),
    fragment = url.indexOf('#'),
    withoutProtocol,
    dot,
    firstSlash;

  if (blob === 0) {
    uri.protocol = 'blob';
    uri.base = url.indexOf(0, fragment);
    return uri;
  }

  if (fragment != -1) {
    uri.fragment = url.slice(fragment + 1);
    url = url.slice(0, fragment);
  }

  if (search != -1) {
    uri.search = url.slice(search + 1);
    url = url.slice(0, search);
    href = uri.href;
  }

  if (doubleSlash != -1) {
    uri.protocol = url.slice(0, doubleSlash);
    withoutProtocol = url.slice(doubleSlash + 3);
    firstSlash = withoutProtocol.indexOf('/');

    if (firstSlash === -1) {
      uri.host = uri.path;
      uri.path = '';
    } else {
      uri.host = withoutProtocol.slice(0, firstSlash);
      uri.path = withoutProtocol.slice(firstSlash);
    }


    uri.origin = `${uri.protocol}://${uri.host}`;

    uri.directory = EPUBJS.core.folder(uri.path);

    uri.base = uri.origin + uri.directory;
    // return origin;
  } else {
    uri.path = url;
    uri.directory = EPUBJS.core.folder(url);
    uri.base = uri.directory;
  }

  // -- Filename
  uri.filename = url.replace(uri.base, '');
  dot = uri.filename.lastIndexOf('.');
  if (dot != -1) {
    uri.extension = uri.filename.slice(dot + 1);
  }
  return uri;
};

// -- Parse out the folder, will return everything before the last slash

EPUBJS.core.folder = function (url) {
  const lastSlash = url.lastIndexOf('/');

  if (lastSlash == -1) var folder = '';

  folder = url.slice(0, lastSlash + 1);

  return folder;
};

// -- https://github.com/ebidel/filer.js/blob/master/src/filer.js#L128
EPUBJS.core.dataURLToBlob = function (dataURL) {
  let BASE64_MARKER = ';base64,',
    parts,
    contentType,
    raw,
    rawLength,
    uInt8Array;

  if (dataURL.indexOf(BASE64_MARKER) == -1) {
    parts = dataURL.split(',');
    contentType = parts[0].split(':')[1];
    raw = parts[1];

    return new Blob([raw], { type: contentType });
  }

  parts = dataURL.split(BASE64_MARKER);
  contentType = parts[0].split(':')[1];
  raw = window.atob(parts[1]);
  rawLength = raw.length;

  uInt8Array = new Uint8Array(rawLength);

  for (let i = 0; i < rawLength; ++i) {
    uInt8Array[i] = raw.charCodeAt(i);
  }

  return new Blob([uInt8Array], { type: contentType });
};

// -- Load scripts async: http://stackoverflow.com/questions/7718935/load-scripts-asynchronously
EPUBJS.core.addScript = function (src, callback, target) {
  let s,
    r;
  r = false;
  s = document.createElement('script');
  s.type = 'text/javascript';
  s.async = false;
  s.src = src;
  s.onload = s.onreadystatechange = function () {
    if (!r && (!this.readyState || this.readyState == 'complete')) {
      r = true;
      if (callback) callback();
    }
  };
  target = target || document.body;
  target.appendChild(s);
};

EPUBJS.core.addScripts = function (srcArr, callback, target) {
  var total = srcArr.length,
    curr = 0,
    cb = function () {
      curr++;
      if (total == curr) {
        if (callback) callback();
      } else {
        EPUBJS.core.addScript(srcArr[curr], cb, target);
      }
    };

  EPUBJS.core.addScript(srcArr[curr], cb, target);
};

EPUBJS.core.addCss = function (src, callback, target) {
  let s,
    r;
  r = false;
  s = document.createElement('link');
  s.type = 'text/css';
  s.rel = 'stylesheet';
  s.href = src;
  s.onload = s.onreadystatechange = function () {
    if (!r && (!this.readyState || this.readyState == 'complete')) {
      r = true;
      if (callback) callback();
    }
  };
  target = target || document.body;
  target.appendChild(s);
};

EPUBJS.core.prefixed = function (unprefixed) {
  let vendors = ['Webkit', 'Moz', 'O', 'ms'],
    prefixes = ['-Webkit-', '-moz-', '-o-', '-ms-'],
    upper = unprefixed[0].toUpperCase() + unprefixed.slice(1),
    length = vendors.length;

  if (typeof (document.documentElement.style[unprefixed]) !== 'undefined') {
    return unprefixed;
  }

  for (let i = 0; i < length; i++) {
    if (typeof (document.documentElement.style[vendors[i] + upper]) !== 'undefined') {
      return vendors[i] + upper;
    }
  }

  return unprefixed;
};

EPUBJS.core.resolveUrl = function (base, path) {
  let url,
    segments = [],
    uri = EPUBJS.core.uri(path),
    folders = base.split('/'),
    paths;

  if (uri.host) {
    return path;
  }

  folders.pop();

  paths = path.split('/');
  _.each(paths, (p) => {
    if (p === '..') {
      folders.pop();
    } else {
      segments.push(p);
    }
  });

  url = folders.concat(segments);

  return url.join('/');
};

// http://stackoverflow.com/questions/105034/how-to-create-a-guid-uuid-in-javascript
EPUBJS.core.uuid = function () {
  let d = new Date().getTime();
  const uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (d + Math.random() * 16) % 16 | 0;
    d = Math.floor(d / 16);
    return (c == 'x' ? r : (r & 0x7 | 0x8)).toString(16);
  });
  return uuid;
};

// Fast quicksort insert for sorted array -- based on:
// http://stackoverflow.com/questions/1344500/efficient-way-to-insert-a-number-into-a-sorted-array-of-numbers
EPUBJS.core.insert = function (item, array, compareFunction) {
  const location = EPUBJS.core.locationOf(item, array, compareFunction);
  array.splice(location, 0, item);

  return location;
};

EPUBJS.core.locationOf = function (item, array, compareFunction, _start, _end) {
  const start = _start || 0;
  const end = _end || array.length;
  const pivot = parseInt(start + (end - start) / 2);
  let compared;
  if (!compareFunction) {
    compareFunction = function (a, b) {
      if (a > b) return 1;
      if (a < b) return -1;
      if (a = b) return 0;
    };
  }
  if (end - start <= 0) {
    return pivot;
  }

  compared = compareFunction(array[pivot], item);
  if (end - start === 1) {
    return compared > 0 ? pivot : pivot + 1;
  }

  if (compared === 0) {
    return pivot;
  }
  if (compared === -1) {
    return EPUBJS.core.locationOf(item, array, compareFunction, pivot, end);
  }
  return EPUBJS.core.locationOf(item, array, compareFunction, start, pivot);
};

EPUBJS.core.indexOfSorted = function (item, array, compareFunction, _start, _end) {
  const start = _start || 0;
  const end = _end || array.length;
  const pivot = parseInt(start + (end - start) / 2);
  let compared;
  if (!compareFunction) {
    compareFunction = function (a, b) {
      if (a > b) return 1;
      if (a < b) return -1;
      if (a = b) return 0;
    };
  }
  if (end - start <= 0) {
    return -1; // Not found
  }

  compared = compareFunction(array[pivot], item);
  if (end - start === 1) {
    return compared === 0 ? pivot : -1;
  }
  if (compared === 0) {
    return pivot; // Found
  }
  if (compared === -1) {
    return EPUBJS.core.indexOfSorted(item, array, compareFunction, pivot, end);
  }
  return EPUBJS.core.indexOfSorted(item, array, compareFunction, start, pivot);
};


EPUBJS.core.queue = function (_scope) {
  let _q = [];
  const scope = _scope;
  // Add an item to the queue
  const enqueue = function (funcName, args, context) {
    _q.push({
      funcName,
      args,
      context,
    });
    return _q;
  };
  // Run one item
  const dequeue = function () {
    let inwait;
    if (_q.length) {
      inwait = _q.shift();
      // Defer to any current tasks
      // setTimeout(function(){
      scope[inwait.funcName].apply(inwait.context || scope, inwait.args);
      // }, 0);
    }
  };

  // Run All
  const flush = function () {
    while (_q.length) {
      dequeue();
    }
  };
  // Clear all items in wait
  const clear = function () {
    _q = [];
  };

  const length = function () {
    return _q.length;
  };

  return {
    enqueue,
    dequeue,
    flush,
    clear,
    length,
  };
};

// From: https://code.google.com/p/fbug/source/browse/branches/firebug1.10/content/firebug/lib/xpath.js
/**
 * Gets an XPath for an element which describes its hierarchical location.
 */
EPUBJS.core.getElementXPath = function (element) {
  if (element && element.id) {
    return `//*[@id="${element.id}"]`;
  }
  return EPUBJS.core.getElementTreeXPath(element);
};

EPUBJS.core.getElementTreeXPath = function (element) {
  const paths = [];
  const 	isXhtml = (element.ownerDocument.documentElement.getAttribute('xmlns') === 'http://www.w3.org/1999/xhtml');
  let index,
    nodeName,
    tagName,
    pathIndex;

  if (element.nodeType === Node.TEXT_NODE) {
    // index = Array.prototype.indexOf.call(element.parentNode.childNodes, element) + 1;
    index = EPUBJS.core.indexOfTextNode(element) + 1;

    paths.push(`text()[${index}]`);
    element = element.parentNode;
  }

  // Use nodeName (instead of localName) so namespace prefix is included (if any).
  for (; element && element.nodeType == 1; element = element.parentNode) {
    index = 0;
    for (let sibling = element.previousSibling; sibling; sibling = sibling.previousSibling) {
      // Ignore document type declaration.
      if (sibling.nodeType == Node.DOCUMENT_TYPE_NODE) {
        continue;
      }
      if (sibling.nodeName == element.nodeName) {
        ++index;
      }
    }
    nodeName = element.nodeName.toLowerCase();
    tagName = (isXhtml ? `xhtml:${nodeName}` : nodeName);
    pathIndex = (index ? `[${index + 1}]` : '');
    paths.splice(0, 0, tagName + pathIndex);
  }

  return paths.length ? `./${paths.join('/')}` : null;
};

EPUBJS.core.nsResolver = function (prefix) {
  const ns = {
    xhtml: 'http://www.w3.org/1999/xhtml',
    epub: 'http://www.idpf.org/2007/ops',
  };
  return ns[prefix] || null;
};

// https://stackoverflow.com/questions/13482352/xquery-looking-for-text-with-single-quote/13483496#13483496
EPUBJS.core.cleanStringForXpath = function (str) {
  let parts = str.match(/[^'"]+|['"]/g);
  parts = _.map(parts, (part) => {
    if (part === "'") {
      return '\"\'\"'; // output "'"
    }

    if (part === '"') {
      return "\'\"\'"; // output '"'
    }
    return `\'${part}\'`;
  });
  return `concat(\'\',${parts.join(',')})`;
};

EPUBJS.core.indexOfTextNode = function (textNode) {
  const parent = textNode.parentNode;
  const children = parent.childNodes;
  let sib;
  let index = -1;
  for (let i = 0; i < children.length; i++) {
    sib = children[i];
    if (sib.nodeType === Node.TEXT_NODE) {
      index++;
    }
    if (sib == textNode) break;
  }

  return index;
};

// Underscore
EPUBJS.core.defaults = function (obj) {
  for (let i = 1, length = arguments.length; i < length; i++) {
    const source = arguments[i];
    for (const prop in source) {
      if (obj[prop] === void 0) obj[prop] = source[prop];
    }
  }
  return obj;
};

EPUBJS.core.extend = function (target) {
  const sources = [].slice.call(arguments, 1);
  _.each(sources, (source) => {
    if (!source) return;
    Object.getOwnPropertyNames(source).forEach((propName) => {
      Object.defineProperty(target, propName, Object.getOwnPropertyDescriptor(source, propName));
    });
  });
  return target;
};

EPUBJS.core.clone = function (obj) {
  return EPUBJS.core.isArray(obj) ? obj.slice() : EPUBJS.core.extend({}, obj);
};

EPUBJS.core.isElement = function (obj) {
  return !!(obj && obj.nodeType == 1);
};

EPUBJS.core.isNumber = function (n) {
  return !isNaN(parseFloat(n)) && isFinite(n);
};

EPUBJS.core.isString = function (str) {
  return (typeof str === 'string' || str instanceof String);
};

EPUBJS.core.isArray = Array.isArray || function (obj) {
  return Object.prototype.toString.call(obj) === '[object Array]';
};

// Lodash
EPUBJS.core.values = function (object) {
  let index = -1;
  let props,
    length,
    result;

  if (!object) return [];

  props = Object.keys(object);
  length = props.length;
  result = Array(length);

  while (++index < length) {
    result[index] = object[props[index]];
  }
  return result;
};

EPUBJS.core.indexOfNode = function (node, typeId) {
  const parent = node.parentNode;
  const children = parent.childNodes;
  let sib;
  let index = -1;
  for (let i = 0; i < children.length; i++) {
    sib = children[i];
    if (sib.nodeType === typeId) {
      index++;
    }
    if (sib == node) break;
  }

  return index;
};

EPUBJS.core.indexOfTextNode = function (textNode) {
  return EPUBJS.core.indexOfNode(textNode, TEXT_NODE);
};

EPUBJS.core.indexOfElementNode = function (elementNode) {
  return EPUBJS.core.indexOfNode(elementNode, ELEMENT_NODE);
};

EPUBJS.EpubCFI = function (cfiStr) {
  if (cfiStr) return this.parse(cfiStr);
};

EPUBJS.EpubCFI.prototype.generateChapterComponent = function (_spineNodeIndex, _pos, id) {
  let pos = parseInt(_pos),
    spineNodeIndex = (_spineNodeIndex + 1) * 2,
    cfi = `/${spineNodeIndex}/`;

  cfi += (pos + 1) * 2;

  if (id) cfi += `[${id}]`;

  // cfi += "!";

  return cfi;
};

EPUBJS.EpubCFI.prototype.generatePathComponent = function (steps) {
  return _.map(steps, part => (part.index + 1) * 2 + (part.id ? `[${part.id}]` : '')).join('/');
};

EPUBJS.EpubCFI.prototype.generateCfiFromElement = function (element, chapter) {
  const steps = this.pathTo(element);
  const path = this.generatePathComponent(steps);
  if (!path.length) {
    // Start of Chapter
    return `epubcfi(${chapter}!/4/)`;
  }
  // First Text Node
  return `epubcfi(${chapter}!/${path}/1:0)`;
};

EPUBJS.EpubCFI.prototype.pathTo = function (node) {
  let stack = [],
    children;

  while (node && node.parentNode !== null && node.parentNode.nodeType != 9) {
    children = node.parentNode.children;

    stack.unshift({
      id: node.id,
      // 'classList' : node.classList,
      tagName: node.tagName,
      index: children ? Array.prototype.indexOf.call(children, node) : 0,
    });

    node = node.parentNode;
  }

  return stack;
};

EPUBJS.EpubCFI.prototype.getChapterComponent = function (cfiStr) {
  const splitStr = cfiStr.split('!');

  return splitStr[0];
};

EPUBJS.EpubCFI.prototype.getPathComponent = function (cfiStr) {
  const splitStr = cfiStr.split('!');
  const pathComponent = splitStr[1] ? splitStr[1].split(':') : '';

  return pathComponent[0];
};

EPUBJS.EpubCFI.prototype.getCharecterOffsetComponent = // backwards-compat
EPUBJS.EpubCFI.prototype.getCharacterOffsetComponent = function (cfiStr) {
  const splitStr = cfiStr.split(':');
  return splitStr[1] || '';
};


EPUBJS.EpubCFI.prototype.parse = function (cfiStr) {
  let cfi = {},
    chapSegment,
    chapterComponent,
    pathComponent,
    characterOffsetComponent,
    assertion,
    chapId,
    path,
    end,
    endInt,
    text,
    parseStep = function (part) {
      let type,
        index,
        has_brackets,
        id;

      type = 'element';
      index = parseInt(part) / 2 - 1;
      has_brackets = part.match(/\[(.*)\]/);
      if (has_brackets && has_brackets[1]) {
        id = has_brackets[1];
      }

      return {
        type,
        index,
        id: id || false,
      };
    };

  if (typeof cfiStr !== 'string') {
    return { spinePos: -1 };
  }

  cfi.str = cfiStr;

  if (cfiStr.indexOf('epubcfi(') === 0 && cfiStr[cfiStr.length - 1] === ')') {
    // Remove intial epubcfi( and ending )
    cfiStr = cfiStr.slice(8, cfiStr.length - 1);
  }

  chapterComponent = this.getChapterComponent(cfiStr);
  pathComponent = this.getPathComponent(cfiStr) || '';
  characterOffsetComponent = this.getCharacterOffsetComponent(cfiStr);
  // Make sure this is a valid cfi or return
  if (!chapterComponent) {
    return { spinePos: -1 };
  }

  // Chapter segment is always the second one
  chapSegment = chapterComponent.split('/')[2] || '';
  if (!chapSegment) return { spinePos: -1 };

  cfi.spinePos = (parseInt(chapSegment) / 2 - 1) || 0;

  chapId = chapSegment.match(/\[(.*)\]/);

  cfi.spineId = chapId ? chapId[1] : false;

  if (pathComponent.indexOf(',') != -1) {
    // Handle ranges -- not supported yet
    console.warn('CFI Ranges are not supported');
  }

  path = pathComponent.split('/');
  end = path.pop();

  cfi.steps = [];

  _.each(path, (part) => {
    let step;

    if (part) {
      step = parseStep(part);
      cfi.steps.push(step);
    }
  });

  // -- Check if END is a text node or element
  endInt = parseInt(end);
  if (!isNaN(endInt)) {
    if (endInt % 2 === 0) { // Even = is an element
      cfi.steps.push(parseStep(end));
    } else {
      cfi.steps.push({
        type: 'text',
        index: (endInt - 1) / 2,
      });
    }
  }

  assertion = characterOffsetComponent.match(/\[(.*)\]/);
  if (assertion && assertion[1]) {
    cfi.characterOffset = parseInt(characterOffsetComponent.split('[')[0]);
    // We arent handling these assertions yet
    cfi.textLocationAssertion = assertion[1];
  } else {
    cfi.characterOffset = parseInt(characterOffsetComponent);
  }

  return cfi;
};

EPUBJS.EpubCFI.prototype.addMarker = function (cfi, _doc, _marker) {
  const doc = _doc || document;
  const marker = _marker || this.createMarker(doc);
  let parent;
  let lastStep;
  let text;
  let split;

  if (typeof cfi === 'string') {
    cfi = this.parse(cfi);
  }
  // Get the terminal step
  lastStep = cfi.steps[cfi.steps.length - 1];

  // check spinePos
  if (cfi.spinePos === -1) {
    // Not a valid CFI
    return false;
  }

  // Find the CFI elements parent
  parent = this.findParent(cfi, doc);

  if (!parent) {
    // CFI didn't return an element
    // Maybe it isnt in the current chapter?
    return false;
  }

  if (lastStep && lastStep.type === 'text') {
    text = parent.childNodes[lastStep.index];
    if (cfi.characterOffset) {
      split = text.splitText(cfi.characterOffset);
      marker.classList.add('EPUBJS-CFI-SPLIT');
      parent.insertBefore(marker, split);
    } else {
      parent.insertBefore(marker, text);
    }
  } else {
    parent.insertBefore(marker, parent.firstChild);
  }

  return marker;
};

EPUBJS.EpubCFI.prototype.createMarker = function (_doc) {
  const doc = _doc || document;
  const element = doc.createElement('span');
  element.id = `EPUBJS-CFI-MARKER:${EPUBJS.core.uuid()}`;
  element.classList.add('EPUBJS-CFI-MARKER');

  return element;
};

EPUBJS.EpubCFI.prototype.removeMarker = function (marker, _doc) {
  const doc = _doc || document;
  // var id = marker.id;

  // Cleanup textnodes if they were split
  if (marker.classList.contains('EPUBJS-CFI-SPLIT')) {
    nextSib = marker.nextSibling;
    prevSib = marker.previousSibling;
    if (nextSib &&
        prevSib &&
        nextSib.nodeType === 3 &&
        prevSib.nodeType === 3) {
      prevSib.textContent += nextSib.textContent;
      marker.parentNode.removeChild(nextSib);
    }
    marker.parentNode.removeChild(marker);
  } else if (marker.classList.contains('EPUBJS-CFI-MARKER')) {
    // Remove only elements added as markers
    marker.parentNode.removeChild(marker);
  }
};

EPUBJS.EpubCFI.prototype.findParent = function (cfi, _doc) {
  let doc = _doc || document,
    element = doc.getElementsByTagName('html')[0],
    children = Array.prototype.slice.call(element.children),
    num,
    index,
    part,
    sections,
    text,
    textBegin,
    textEnd;

  if (typeof cfi === 'string') {
    cfi = this.parse(cfi);
  }

  sections = cfi.steps.slice(0); // Clone steps array
  if (!sections.length) {
    return doc.getElementsByTagName('body')[0];
  }

  while (sections && sections.length > 0) {
    part = sections.shift();
    // Find textNodes Parent
    if (part.type === 'text') {
      text = element.childNodes[part.index];
      element = text.parentNode || element;
    // Find element by id if present
    } else if (part.id) {
      element = doc.getElementById(part.id);
    // Find element in parent
    } else {
      element = children[part.index];
    }
    // Element can't be found
    if (!element || typeof element === 'undefined') {
      console.error('No Element For', part, cfi.str);
      return false;
    }
    // Get current element children and continue through steps
    children = Array.prototype.slice.call(element.children);
  }

  return element;
};

EPUBJS.EpubCFI.prototype.compare = function (cfiOne, cfiTwo) {
  if (typeof cfiOne === 'string') {
    cfiOne = new EPUBJS.EpubCFI(cfiOne);
  }
  if (typeof cfiTwo === 'string') {
    cfiTwo = new EPUBJS.EpubCFI(cfiTwo);
  }
  // Compare Spine Positions
  if (cfiOne.spinePos > cfiTwo.spinePos) {
    return 1;
  }
  if (cfiOne.spinePos < cfiTwo.spinePos) {
    return -1;
  }


  // Compare Each Step in the First item
  for (let i = 0; i < cfiOne.steps.length; i++) {
    if (!cfiTwo.steps[i]) {
      return 1;
    }
    if (cfiOne.steps[i].index > cfiTwo.steps[i].index) {
      return 1;
    }
    if (cfiOne.steps[i].index < cfiTwo.steps[i].index) {
      return -1;
    }
    // Otherwise continue checking
  }

  // All steps in First present in Second
  if (cfiOne.steps.length < cfiTwo.steps.length) {
    return -1;
  }

  // Compare the character offset of the text node
  if (cfiOne.characterOffset > cfiTwo.characterOffset) {
    return 1;
  }
  if (cfiOne.characterOffset < cfiTwo.characterOffset) {
    return -1;
  }

  // CFI's are equal
  return 0;
};

EPUBJS.EpubCFI.prototype.generateCfiFromHref = function (href, book) {
  const uri = EPUBJS.core.uri(href);
  const path = uri.path;
  const fragment = uri.fragment;
  const spinePos = book.spineIndexByURL[path];
  let loaded;
  const deferred = new RSVP.defer();
  const epubcfi = new EPUBJS.EpubCFI();
  let spineItem;

  if (typeof spinePos !== 'undefined') {
    spineItem = book.spine[spinePos];
    loaded = book.loadXml(spineItem.url);
    loaded.then((doc) => {
      const element = doc.getElementById(fragment);
      let cfi;
      cfi = epubcfi.generateCfiFromElement(element, spineItem.cfiBase);
      deferred.resolve(cfi);
    });
  }

  return deferred.promise;
};

EPUBJS.EpubCFI.prototype.generateCfiFromTextNode = function (anchor, offset, base) {
  const parent = anchor.parentNode;
  const steps = this.pathTo(parent);
  const path = this.generatePathComponent(steps);
  const index = 1 + (2 * Array.prototype.indexOf.call(parent.childNodes, anchor));
  return `epubcfi(${base}!/${path}/${index}:${offset || 0})`;
};

EPUBJS.EpubCFI.prototype.generateCfiFromRangeAnchor = function (range, base) {
  const anchor = range.anchorNode;
  const offset = range.anchorOffset;
  return this.generateCfiFromTextNode(anchor, offset, base);
};

EPUBJS.EpubCFI.prototype.generateCfiFromRange = function (range, base) {
  let start,
    startElement,
    startSteps,
    startPath,
    startOffset,
    startIndex;
  let end,
    endElement,
    endSteps,
    endPath,
    endOffset,
    endIndex;

  start = range.startContainer;

  if (start.nodeType === 3) { // text node
    startElement = start.parentNode;
    // startIndex = 1 + (2 * Array.prototype.indexOf.call(startElement.childNodes, start));
    startIndex = 1 + (2 * EPUBJS.core.indexOfTextNode(start));
    startSteps = this.pathTo(startElement);
  } else if (range.collapsed) {
    return this.generateCfiFromElement(start, base); // single element
  } else {
    startSteps = this.pathTo(start);
  }

  startPath = this.generatePathComponent(startSteps);
  startOffset = range.startOffset;

  if (!range.collapsed) {
    end = range.endContainer;

    if (end.nodeType === 3) { // text node
      endElement = end.parentNode;
      // endIndex = 1 + (2 * Array.prototype.indexOf.call(endElement.childNodes, end));
      endIndex = 1 + (2 * EPUBJS.core.indexOfTextNode(end));

      endSteps = this.pathTo(endElement);
    } else {
      endSteps = this.pathTo(end);
    }

    endPath = this.generatePathComponent(endSteps);
    endOffset = range.endOffset;

    // Remove steps present in startPath
    endPath = endPath.replace(startPath, '');

    if (endPath.length) {
      endPath += '/';
    }

    return `epubcfi(${base}!/${startPath}/${startIndex}:${startOffset},${endPath}${endIndex}:${endOffset})`;
  }
  return `epubcfi(${base}!/${startPath}/${startIndex}:${startOffset})`;
};

EPUBJS.EpubCFI.prototype.generateXpathFromSteps = function (steps) {
  const xpath = ['.', '*'];

  _.each(steps, (step) => {
    const position = step.index + 1;

    if (step.id) {
      xpath.push(`*[position()=${position} and @id='${step.id}']`);
    } else if (step.type === 'text') {
      xpath.push(`text()[${position}]`);
    } else {
      xpath.push(`*[${position}]`);
    }
  });

  return xpath.join('/');
};

EPUBJS.EpubCFI.prototype.generateQueryFromSteps = function (steps) {
  const query = ['html'];

  _.each(steps, (step) => {
    const position = step.index + 1;

    if (step.id) {
      query.push(`#${step.id}`);
    } else if (step.type === 'text') {
      // unsupported in querySelector
      // query.push("text()[" + position + "]");
    } else {
      query.push(`*:nth-child(${position})`);
    }
  });

  return query.join('>');
};


EPUBJS.EpubCFI.prototype.generateRangeFromCfi = function (cfi, _doc) {
  const doc = _doc || document;
  const range = doc.createRange();
  let lastStep;
  let xpath;
  let startContainer;
  let textLength;
  let query;
  let startContainerParent;
  if (typeof cfi === 'string') {
    cfi = this.parse(cfi);
  }

  // check spinePos
  if (cfi.spinePos === -1) {
    // Not a valid CFI
    return false;
  }

  // Get the terminal step
  lastStep = cfi.steps[cfi.steps.length - 1];

  if (typeof document.evaluate !== 'undefined') {
    xpath = this.generateXpathFromSteps(cfi.steps);
    startContainer = doc.evaluate(xpath, doc, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
  } else {
    // Get the query string
    query = this.generateQueryFromSteps(cfi.steps);
    // Find the containing element
    startContainerParent = doc.querySelector(query);
    // Find the text node within that element
    if (startContainerParent && lastStep.type == 'text') {
      startContainer = startContainerParent.childNodes[lastStep.index];
    }
  }

  if (!startContainer) {
    return null;
  }

  if (startContainer && cfi.characterOffset >= 0) {
    textLength = startContainer.length;

    if (cfi.characterOffset < textLength) {
      range.setStart(startContainer, cfi.characterOffset);
      range.setEnd(startContainer, textLength);
    } else {
      console.debug('offset greater than length:', cfi.characterOffset, textLength);
      range.setStart(startContainer, textLength - 1);
      range.setEnd(startContainer, textLength);
    }
  } else if (startContainer) {
    range.selectNode(startContainer);
  }
  // doc.defaultView.getSelection().addRange(range);
  return range;
};

EPUBJS.EpubCFI.prototype.isCfiString = function (target) {
  return typeof target === 'string' && target.indexOf('epubcfi(') === 0;
};

EPUBJS.Events = function (obj, el) {
  this.events = {};

  if (!el) {
    this.el = document.createElement('div');
  } else {
    this.el = el;
  }

  obj.createEvent = this.createEvent;
  obj.tell = this.tell;
  obj.listen = this.listen;
  obj.deafen = this.deafen;
  obj.listenUntil = this.listenUntil;

  return this;
};

EPUBJS.Events.prototype.createEvent = function (evt) {
  const e = new CustomEvent(evt);
  this.events[evt] = e;
  return e;
};

EPUBJS.Events.prototype.tell = function (evt, msg) {
  let e;

  if (!this.events[evt]) {
    console.warn('No event:', evt, 'defined yet, creating.');
    e = this.createEvent(evt);
  } else {
    e = this.events[evt];
  }

  if (msg) e.msg = msg;
  this.el.dispatchEvent(e);
};

EPUBJS.Events.prototype.listen = function (evt, func, bindto) {
  if (!this.events[evt]) {
    console.warn('No event:', evt, 'defined yet, creating.');
    this.createEvent(evt);
    return;
  }

  if (bindto) {
    this.el.addEventListener(evt, func.bind(bindto), false);
  } else {
    this.el.addEventListener(evt, func, false);
  }
};

EPUBJS.Events.prototype.deafen = function (evt, func) {
  this.el.removeEventListener(evt, func, false);
};

EPUBJS.Events.prototype.listenUntil = function (OnEvt, OffEvt, func, bindto) {
  this.listen(OnEvt, func, bindto);

  function unlisten() {
    this.deafen(OnEvt, func);
    this.deafen(OffEvt, unlisten);
  }

  this.listen(OffEvt, unlisten, this);
};
EPUBJS.hooks = {};
EPUBJS.Hooks = (function () {
  function hooks() {}

  // -- Get pre-registered hooks
  hooks.prototype.getHooks = function () {
    let plugs;
    this.hooks = {};
    _.each(Array.prototype.slice.call(arguments), (arg) => {
      this.hooks[arg] = [];
    });

    for (var plugType in this.hooks) {
      plugs = EPUBJS.core.values(EPUBJS.hooks[plugType]);

      _.each(plugs, function (hook) {
        this.registerHook(plugType, hook);
      }, this);
    }
  };

  // -- Hooks allow for injecting async functions that must all complete before continuing
  //   Functions must have a callback as their first argument.
  hooks.prototype.registerHook = function (type, toAdd, toFront) {
    if (typeof (this.hooks[type]) !== 'undefined') {
      if (typeof (toAdd) === 'function') {
        if (toFront) {
          this.hooks[type].unshift(toAdd);
        } else {
          this.hooks[type].push(toAdd);
        }
      } else if (Array.isArray(toAdd)) {
        _.each(toAdd, function (hook) {
          if (toFront) {
            this.hooks[type].unshift(hook);
          } else {
            this.hooks[type].push(hook);
          }
        }, this);
      }
    } else {
      // -- Allows for undefined hooks
      this.hooks[type] = [toAdd];

      if (typeof (toAdd) === 'function') {
        this.hooks[type] = [toAdd];
      } else if (Array.isArray(toAdd)) {
        this.hooks[type] = [];
        _.each(toAdd, function (hook) {
          this.hooks[type].push(hook);
        }, this);
      }
    }
  };

  hooks.prototype.removeHook = function (type, toRemove) {
    let index;

    if (typeof (this.hooks[type]) !== 'undefined') {
      if (typeof (toRemove) === 'function') {
        index = this.hooks[type].indexOf(toRemove);
        if (index > -1) {
          this.hooks[type].splice(index, 1);
        }
      } else if (Array.isArray(toRemove)) {
        _.each(toRemove, function (hook) {
          index = this.hooks[type].indexOf(hook);
          if (index > -1) {
            this.hooks[type].splice(index, 1);
          }
        }, this);
      }
    }
  };

  hooks.prototype.triggerHooks = function (type, callback, passed) {
    let hooks,
      count;

    if (typeof (this.hooks[type]) === 'undefined') return false;

    hooks = this.hooks[type];

    count = hooks.length;
    if (count === 0 && callback) {
      callback();
    }

    function countdown() {
      count--;
      if (count <= 0 && callback) callback();
    }

    _.each(hooks, (hook) => {
      hook(countdown, passed);
    });
  };

  return {
    register(name) {
      if (EPUBJS.hooks[name] === undefined) { EPUBJS.hooks[name] = {}; }
      if (typeof EPUBJS.hooks[name] !== 'object') { throw `Already registered: ${name}`; }
      return EPUBJS.hooks[name];
    },
    mixin(object) {
      for (const prop in hooks.prototype) {
        object[prop] = hooks.prototype[prop];
      }
    },
  };
}());

EPUBJS.Layout = EPUBJS.Layout || {};

// EPUB2 documents won't provide us with "rendition:layout", so this is used to
// duck type the documents instead.
EPUBJS.Layout.isFixedLayout = function (documentElement) {
  const viewport = documentElement.querySelector('[name=viewport]');
  if (!viewport || !viewport.hasAttribute('content')) {
    return false;
  }
  const content = viewport.getAttribute('content');
  return (/width=(\d+)/.test(content) && /height=(\d+)/.test(content));
};

EPUBJS.Layout.Reflowable = function () {
  this.documentElement = null;
  this.spreadWidth = null;
};

EPUBJS.Layout.Reflowable.prototype.format = function (documentElement, _width, _height, _gap) {
  // Get the prefixed CSS commands
  const columnAxis = EPUBJS.core.prefixed('columnAxis');
  const columnGap = EPUBJS.core.prefixed('columnGap');
  const columnWidth = EPUBJS.core.prefixed('columnWidth');
  const columnFill = EPUBJS.core.prefixed('columnFill');

  // -- Check the width and create even width columns
  const width = Math.floor(_width);
  // var width = (fullWidth % 2 === 0) ? fullWidth : fullWidth - 0; // Not needed for single
  const section = Math.floor(width / 8);
  const gap = (_gap >= 0) ? _gap : ((section % 2 === 0) ? section : section - 1);
  this.documentElement = documentElement;
  // -- Single Page
  this.spreadWidth = (width + gap);


  documentElement.style.overflow = 'hidden';

  // Must be set to the new calculated width or the columns will be off
  documentElement.style.width = `${width}px`;

  // -- Adjust height
  documentElement.style.height = `${_height}px`;

  // -- Add columns
  documentElement.style[columnAxis] = 'horizontal';
  documentElement.style[columnFill] = 'auto';
  documentElement.style[columnWidth] = `${width}px`;
  documentElement.style[columnGap] = `${gap}px`;
  this.colWidth = width;
  this.gap = gap;

  return {
    pageWidth: this.spreadWidth,
    pageHeight: _height,
  };
};

EPUBJS.Layout.Reflowable.prototype.calculatePages = function () {
  let totalWidth,
    displayedPages;
  this.documentElement.style.width = 'auto'; // -- reset width for calculations
  totalWidth = this.documentElement.scrollWidth;
  displayedPages = Math.ceil(totalWidth / this.spreadWidth);

  return {
    displayedPages,
    pageCount: displayedPages,
  };
};

EPUBJS.Layout.ReflowableSpreads = function () {
  this.documentElement = null;
  this.spreadWidth = null;
};

EPUBJS.Layout.ReflowableSpreads.prototype.format = function (documentElement, _width, _height, _gap) {
  const columnAxis = EPUBJS.core.prefixed('columnAxis');
  const columnGap = EPUBJS.core.prefixed('columnGap');
  const columnWidth = EPUBJS.core.prefixed('columnWidth');
  const columnFill = EPUBJS.core.prefixed('columnFill');

  let divisor = 2,
    cutoff = 800;

  // -- Check the width and create even width columns
  const fullWidth = Math.floor(_width);
  const width = (fullWidth % 2 === 0) ? fullWidth : fullWidth - 1;

  const section = Math.floor(width / 8);
  const gap = (_gap >= 0) ? _gap : ((section % 2 === 0) ? section : section - 1);

  // -- Double Page
  const colWidth = Math.floor((width - gap) / divisor);

  this.documentElement = documentElement;
  this.spreadWidth = (colWidth + gap) * divisor;


  documentElement.style.overflow = 'hidden';

  // Must be set to the new calculated width or the columns will be off
  documentElement.style.width = `${width}px`;

  // -- Adjust height
  documentElement.style.height = `${_height}px`;

  // -- Add columns
  documentElement.style[columnAxis] = 'horizontal';
  documentElement.style[columnFill] = 'auto';
  documentElement.style[columnGap] = `${gap}px`;
  documentElement.style[columnWidth] = `${colWidth}px`;

  this.colWidth = colWidth;
  this.gap = gap;
  return {
    pageWidth: this.spreadWidth,
    pageHeight: _height,
  };
};

EPUBJS.Layout.ReflowableSpreads.prototype.calculatePages = function () {
  const totalWidth = this.documentElement.scrollWidth;
  const displayedPages = Math.ceil(totalWidth / this.spreadWidth);

  // -- Add a page to the width of the document to account an for odd number of pages
  this.documentElement.style.width = `${(displayedPages * this.spreadWidth) - this.gap}px`;

  return {
    displayedPages,
    pageCount: displayedPages * 2,
  };
};

EPUBJS.Layout.Fixed = function () {
  this.documentElement = null;
};

EPUBJS.Layout.Fixed.prototype.format = function (documentElement, _width, _height, _gap) {
  const columnWidth = EPUBJS.core.prefixed('columnWidth');
  const transform = EPUBJS.core.prefixed('transform');
  const transformOrigin = EPUBJS.core.prefixed('transformOrigin');
  const viewport = documentElement.querySelector('[name=viewport]');
  let content;
  let contents;
  let width,
    height;
  this.documentElement = documentElement;
  /**
	* check for the viewport size
	* <meta name="viewport" content="width=1024,height=697" />
	*/
  if (viewport && viewport.hasAttribute('content')) {
    content = viewport.getAttribute('content');
    contents = content.split(',');
    if (contents[0]) {
      width = contents[0].replace('width=', '');
    }
    if (contents[1]) {
      height = contents[1].replace('height=', '');
    }
  }

  // -- Scale fixed documents so their contents don't overflow, and
  // vertically and horizontally center the contents
  const widthScale = _width / width;
  const heightScale = _height / height;
  const scale = widthScale < heightScale ? widthScale : heightScale;
  documentElement.style.position = 'absolute';
  documentElement.style.top = '50%';
  documentElement.style.left = '50%';
  documentElement.style[transform] = `scale(${scale}) translate(-50%, -50%)`;
  documentElement.style[transformOrigin] = '0px 0px 0px';

  // -- Adjust width and height
  documentElement.style.width = `${width}px` || 'auto';
  documentElement.style.height = `${height}px` || 'auto';

  // -- Remove columns
  documentElement.style[columnWidth] = 'auto';

  // -- Scroll
  documentElement.style.overflow = 'auto';

  this.colWidth = width;
  this.gap = 0;

  return {
    pageWidth: width,
    pageHeight: height,
  };
};

EPUBJS.Layout.Fixed.prototype.calculatePages = function () {
  return {
    displayedPages: 1,
    pageCount: 1,
  };
};

EPUBJS.Locations = function (spine, store, credentials) {
  this.spine = spine;
  this.store = store;
  this.credentials = credentials;

  this.epubcfi = new EPUBJS.EpubCFI();

  this._locations = [];
  this.total = 0;

  this.break = 150;

  this._current = 0;
};

EPUBJS.Locations.prototype.generate = function (chars) {
  const deferred = new RSVP.defer();
  let spinePos = -1;
  const spineLength = this.spine.length;
  let finished;
  var nextChapter = function (deferred) {
    let chapter;
    const next = spinePos + 1;
    const done = deferred || new RSVP.defer();
    let loaded;
    if (next >= spineLength) {
      done.resolve();
    } else {
      spinePos = next;
      chapter = new EPUBJS.Chapter(this.spine[spinePos], this.store, this.credentials);

      this.process(chapter).then(() => {
        // Load up the next chapter
        setTimeout(() => {
          nextChapter(done);
        }, 1);
      });
    }
    return done.promise;
  }.bind(this);

  if (typeof chars === 'number') {
    this.break = chars;
  }

  finished = nextChapter().then(() => {
    this.total = this._locations.length - 1;

    if (this._currentCfi) {
      this.currentLocation = this._currentCfi;
    }
    deferred.resolve(this._locations);
  });

  return deferred.promise;
};

EPUBJS.Locations.prototype.process = function (chapter) {
  return chapter.load()
    .then((_doc) => {
      let range;
      const doc = _doc;
      const contents = doc.documentElement.querySelector('body');
      let counter = 0;
      let prev;
      let cfi;
      const _break = this.break;

      this.sprint(contents, (node) => {
        const len = node.length;
        let dist;
        let pos = 0;

        if (node.textContent.trim().length === 0) {
          return false; // continue
        }

        // Start range
        if (counter === 0) {
          range = doc.createRange();
          range.setStart(node, 0);
        }

        dist = _break - counter;

        // Node is smaller than a break
        if (dist > len) {
          counter += len;
          pos = len;
        }

        while (pos < len) {
          dist = _break - counter;

          if (counter === 0) {
            pos += 1;
            range = doc.createRange();
            range.setStart(node, pos);
          }

          // Gone over
          if (pos + dist >= len) {
            // Continue counter for next node
            counter += len - pos;
            // break
            pos = len;
          // At End
          } else {
            // Advance pos
            pos += dist;

            // End the previous range
            range.setEnd(node, pos);
            cfi = chapter.cfiFromRange(range);
            this._locations.push(cfi);
            counter = 0;
          }
        }

        prev = node;
      });

      // Close remaining
      if (range) {
        range.setEnd(prev, prev.length);
        cfi = chapter.cfiFromRange(range);
        this._locations.push(cfi);
        counter = 0;
      }
    });
};

EPUBJS.Locations.prototype.sprint = function (root, func) {
  let node;
  const treeWalker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null, false);

  while ((node = treeWalker.nextNode())) {
    func(node);
  }
};

EPUBJS.Locations.prototype.locationFromCfi = function (cfi) {
  // Check if the location has not been set yet
  if (this._locations.length === 0) {
    return -1;
  }

  return EPUBJS.core.locationOf(cfi, this._locations, this.epubcfi.compare);
};

EPUBJS.Locations.prototype.percentageFromCfi = function (cfi) {
  // Find closest cfi
  const loc = this.locationFromCfi(cfi);
  // Get percentage in total
  return this.percentageFromLocation(loc);
};

EPUBJS.Locations.prototype.percentageFromLocation = function (loc) {
  if (!loc || !this.total) {
    return 0;
  }
  return (loc / this.total);
};

EPUBJS.Locations.prototype.cfiFromLocation = function (loc) {
  let cfi = -1;
  // check that pg is an int
  if (typeof loc !== 'number') {
    loc = parseInt(loc);
  }

  if (loc >= 0 && loc < this._locations.length) {
    cfi = this._locations[loc];
  }

  return cfi;
};

EPUBJS.Locations.prototype.cfiFromPercentage = function (value) {
  const percentage = (value > 1) ? value / 100 : value; // Normalize value to 0-1
  const loc = Math.ceil(this.total * percentage);

  return this.cfiFromLocation(loc);
};

EPUBJS.Locations.prototype.load = function (locations) {
  this._locations = JSON.parse(locations);
  this.total = this._locations.length - 1;
  return this._locations;
};

EPUBJS.Locations.prototype.save = function (json) {
  return JSON.stringify(this._locations);
};

EPUBJS.Locations.prototype.getCurrent = function (json) {
  return this._current;
};

EPUBJS.Locations.prototype.setCurrent = function (curr) {
  let loc;

  if (typeof curr === 'string') {
    this._currentCfi = curr;
  } else if (typeof curr === 'number') {
    this._current = curr;
  } else {
    return;
  }

  if (this._locations.length === 0) {
    return;
  }

  if (typeof curr === 'string') {
    loc = this.locationFromCfi(curr);
    this._current = loc;
  } else {
    loc = curr;
  }

  this.trigger('changed', {
    percentage: this.percentageFromLocation(loc),
  });
};

Object.defineProperty(EPUBJS.Locations.prototype, 'currentLocation', {
  get() {
    return this._current;
  },
  set(curr) {
    this.setCurrent(curr);
  },
});

RSVP.EventTarget.mixin(EPUBJS.Locations.prototype);

EPUBJS.Pagination = function (pageList) {
  this.pages = [];
  this.locations = [];
  this.epubcfi = new EPUBJS.EpubCFI();
  if (pageList && pageList.length) {
    this.process(pageList);
  }
};

EPUBJS.Pagination.prototype.process = function (pageList) {
  _.each(pageList, (item) => {
    this.pages.push(item.page);
    this.locations.push(item.cfi);
  });

  this.pageList = pageList;
  this.firstPage = parseInt(this.pages[0]);
  this.lastPage = parseInt(this.pages[this.pages.length - 1]);
  this.totalPages = this.lastPage - this.firstPage;
};

EPUBJS.Pagination.prototype.pageFromCfi = function (cfi) {
  let pg = -1;

  // Check if the pageList has not been set yet
  if (this.locations.length === 0) {
    return -1;
  }

  // TODO: check if CFI is valid?

  // check if the cfi is in the location list
  // var index = this.locations.indexOf(cfi);
  let index = EPUBJS.core.indexOfSorted(cfi, this.locations, this.epubcfi.compare);
  if (index != -1) {
    pg = this.pages[index];
  } else {
    // Otherwise add it to the list of locations
    // Insert it in the correct position in the locations page
    // index = EPUBJS.core.insert(cfi, this.locations, this.epubcfi.compare);
    index = EPUBJS.core.locationOf(cfi, this.locations, this.epubcfi.compare);
    // Get the page at the location just before the new one, or return the first
    pg = index - 1 >= 0 ? this.pages[index - 1] : this.pages[0];
    if (pg !== undefined) {
      // Add the new page in so that the locations and page array match up
      // this.pages.splice(index, 0, pg);
    } else {
      pg = -1;
    }
  }
  return pg;
};

EPUBJS.Pagination.prototype.cfiFromPage = function (pg) {
  let cfi = -1;
  // check that pg is an int
  if (typeof pg !== 'number') {
    pg = parseInt(pg);
  }

  // check if the cfi is in the page list
  // Pages could be unsorted.
  const index = this.pages.indexOf(pg);
  if (index != -1) {
    cfi = this.locations[index];
  }
  // TODO: handle pages not in the list
  return cfi;
};

EPUBJS.Pagination.prototype.pageFromPercentage = function (percent) {
  const pg = Math.round(this.totalPages * percent);
  return pg;
};

// Returns a value between 0 - 1 corresponding to the location of a page
EPUBJS.Pagination.prototype.percentageFromPage = function (pg) {
  const percentage = (pg - this.firstPage) / this.totalPages;
  return Math.round(percentage * 1000) / 1000;
};

// Returns a value between 0 - 1 corresponding to the location of a cfi
EPUBJS.Pagination.prototype.percentageFromCfi = function (cfi) {
  const pg = this.pageFromCfi(cfi);
  const percentage = this.percentageFromPage(pg);
  return percentage;
};
EPUBJS.Parser = function (baseUrl) {
  this.baseUrl = baseUrl || '';
};

EPUBJS.Parser.prototype.container = function (containerXml) {
  // -- <rootfile full-path="OPS/package.opf" media-type="application/oebps-package+xml"/>
  let rootfile,
    fullpath,
    folder,
    encoding;

  if (!containerXml) {
    console.error('Container File Not Found');
    return;
  }

  rootfile = containerXml.querySelector('rootfile');

  if (!rootfile) {
    console.error('No RootFile Found');
    return;
  }

  fullpath = rootfile.getAttribute('full-path');
  folder = EPUBJS.core.uri(fullpath).directory;
  encoding = containerXml.xmlEncoding;

  // -- Now that we have the path we can parse the contents
  return {
    packagePath: fullpath,
    basePath: folder,
    encoding,
  };
};

EPUBJS.Parser.prototype.identifier = function (packageXml) {
  let metadataNode;

  if (!packageXml) {
    console.error('Package File Not Found');
    return;
  }

  metadataNode = packageXml.querySelector('metadata');

  if (!metadataNode) {
    console.error('No Metadata Found');
    return;
  }

  return this.getElementText(metadataNode, 'identifier');
};

EPUBJS.Parser.prototype.packageContents = function (packageXml, baseUrl) {
  const parse = this;
  let metadataNode,
    manifestNode,
    spineNode;
  let manifest,
    navPath,
    tocPath,
    coverPath;
  let spineNodeIndex;
  let spine;
  let spineIndexByURL;
  let metadata;

  if (baseUrl) this.baseUrl = baseUrl;

  if (!packageXml) {
    console.error('Package File Not Found');
    return;
  }

  metadataNode = packageXml.querySelector('metadata');
  if (!metadataNode) {
    console.error('No Metadata Found');
    return;
  }

  manifestNode = packageXml.querySelector('manifest');
  if (!manifestNode) {
    console.error('No Manifest Found');
    return;
  }

  spineNode = packageXml.querySelector('spine');
  if (!spineNode) {
    console.error('No Spine Found');
    return;
  }

  manifest = parse.manifest(manifestNode);
  navPath = parse.findNavPath(manifestNode);
  tocPath = parse.findTocPath(manifestNode, spineNode);
  coverPath = parse.findCoverPath(packageXml);

  spineNodeIndex = Array.prototype.indexOf.call(spineNode.parentNode.childNodes, spineNode);

  spine = parse.spine(spineNode, manifest);

  spineIndexByURL = {};
  _.each(spine, (item) => {
    spineIndexByURL[item.href] = item.index;
  });

  metadata = parse.metadata(metadataNode);

  metadata.direction = spineNode.getAttribute('page-progression-direction');

  return {
    metadata,
    spine,
    manifest,
    navPath,
    tocPath,
    coverPath,
    spineNodeIndex,
    spineIndexByURL,
  };
};

// -- Find TOC NAV
EPUBJS.Parser.prototype.findNavPath = function (manifestNode) {
  // Find item with property 'nav'
  // Should catch nav irregardless of order
  const node = manifestNode.querySelector("item[properties$='nav'], item[properties^='nav '], item[properties*=' nav ']");
  return node ? node.getAttribute('href') : false;
};

// -- Find TOC NCX: media-type="application/x-dtbncx+xml" href="toc.ncx"
EPUBJS.Parser.prototype.findTocPath = function (manifestNode, spineNode) {
  let node = manifestNode.querySelector("item[media-type='application/x-dtbncx+xml']");
  let tocId;

  // If we can't find the toc by media-type then try to look for id of the item in the spine attributes as
  // according to http://www.idpf.org/epub/20/spec/OPF_2.0.1_draft.htm#Section2.4.1.2,
  // "The item that describes the NCX must be referenced by the spine toc attribute."
  if (!node) {
    tocId = spineNode.getAttribute('toc');
    if (tocId) {
      node = manifestNode.querySelector(`item[id='${tocId}']`);
    }
  }

  return node ? node.getAttribute('href') : false;
};

// -- Expanded to match Readium web components
EPUBJS.Parser.prototype.metadata = function (xml) {
  let metadata = {},
    p = this;

  metadata.bookTitle = p.getElementText(xml, 'title');
  metadata.creator = p.getElementText(xml, 'creator');
  metadata.description = p.getElementText(xml, 'description');

  metadata.pubdate = p.getElementText(xml, 'date');

  metadata.publisher = p.getElementText(xml, 'publisher');

  metadata.identifier = p.getElementText(xml, 'identifier');
  metadata.language = p.getElementText(xml, 'language');
  metadata.rights = p.getElementText(xml, 'rights');

  metadata.modified_date = p.querySelectorText(xml, "meta[property='dcterms:modified']");
  metadata.layout = p.querySelectorText(xml, "meta[property='rendition:layout']");
  metadata.orientation = p.querySelectorText(xml, "meta[property='rendition:orientation']");
  metadata.spread = p.querySelectorText(xml, "meta[property='rendition:spread']");

  return metadata;
};

// -- Find Cover: <item properties="cover-image" id="ci" href="cover.svg" media-type="image/svg+xml" />
// -- Fallback for Epub 2.0
EPUBJS.Parser.prototype.findCoverPath = function (packageXml) {
  const epubVersion = packageXml.querySelector('package').getAttribute('version');
  if (epubVersion === '2.0') {
    const metaCover = packageXml.querySelector('meta[name="cover"]');
    if (metaCover) {
      const coverId = metaCover.getAttribute('content');
      const cover = packageXml.querySelector(`item[id='${coverId}']`);
      return cover ? cover.getAttribute('href') : false;
    }

    return false;
  }

  const node = packageXml.querySelector("item[properties='cover-image']");
  return node ? node.getAttribute('href') : false;
};

EPUBJS.Parser.prototype.getElementText = function (xml, tag) {
  let found = xml.getElementsByTagNameNS('http://purl.org/dc/elements/1.1/', tag),
    el;

  if (!found || found.length === 0) return '';

  el = found[0];

  if (el.childNodes.length) {
    return el.childNodes[0].nodeValue;
  }

  return '';
};

EPUBJS.Parser.prototype.querySelectorText = function (xml, q) {
  const el = xml.querySelector(q);

  if (el && el.childNodes.length) {
    return el.childNodes[0].nodeValue;
  }

  return '';
};

EPUBJS.Parser.prototype.manifest = function (manifestXml) {
  let baseUrl = this.baseUrl,
    manifest = {};

  // -- Turn items into an array
  let selected = manifestXml.querySelectorAll('item'),
    items = Array.prototype.slice.call(selected);

  // -- Create an object with the id as key
  _.each(items, (item) => {
    let id = item.getAttribute('id'),
      href = item.getAttribute('href') || '',
      type = item.getAttribute('media-type') || '',
      properties = item.getAttribute('properties') || '';

    manifest[id] = {
      href,
      url: baseUrl + href, // -- Absolute URL for loading with a web worker
      type,
      properties,
    };
  });

  return manifest;
};

EPUBJS.Parser.prototype.spine = function (spineXml, manifest) {
  let selected = spineXml.getElementsByTagName('itemref'),
    items = Array.prototype.slice.call(selected);

  // var spineNodeIndex = Array.prototype.indexOf.call(spineXml.parentNode.childNodes, spineXml);
  const spineNodeIndex = EPUBJS.core.indexOfElementNode(spineXml);

  const epubcfi = new EPUBJS.EpubCFI();

  // -- Add to array to mantain ordering and cross reference with manifest
  return _.map(items, (item, index) => {
    const Id = item.getAttribute('idref');
    const cfiBase = epubcfi.generateChapterComponent(spineNodeIndex, index, Id);
    const props = item.getAttribute('properties') || '';
    const propArray = props.length ? props.split(' ') : [];
    const manifestProps = manifest[Id].properties;
    const manifestPropArray = manifestProps.length ? manifestProps.split(' ') : [];
    return {
      id: Id,
      linear: item.getAttribute('linear') || '',
      properties: propArray,
      manifestProperties: manifestPropArray,
      href: manifest[Id].href,
      url: manifest[Id].url,
      index,
      cfiBase,
      cfi: `epubcfi(${cfiBase})`,
    };
  });
};

EPUBJS.Parser.prototype.querySelectorByType = function (html, element, type) {
  let query = html.querySelector(`${element}[*|type="${type}"]`);
  // Handle IE not supporting namespaced epub:type in querySelector
  if (query === null || query.length === 0) {
    query = html.querySelectorAll(element);
    for (let i = 0; i < query.length; i++) {
      if (query[i].getAttributeNS('http://www.idpf.org/2007/ops', 'type') === type) {
        return query[i];
      }
    }
  } else {
    return query;
  }
};

EPUBJS.Parser.prototype.nav = function (navHtml, spineIndexByURL, bookSpine) {
  const toc = this.querySelectorByType(navHtml, 'nav', 'toc');
  return this.navItems(toc, spineIndexByURL, bookSpine);
};

EPUBJS.Parser.prototype.navItems = function (navNode, spineIndexByURL, bookSpine) {
  if (!navNode) return [];

  const list = navNode.querySelector('ol');
  if (!list) return [];

  let items = list.childNodes,
    result = [];

  Array.prototype.forEach.call(items, (item) => {
    if (item.tagName !== 'li') return;

    let content = item.querySelector('a, span'),
      href = content.getAttribute('href') || '',
      label = content.textContent || '',
      split = href.split('#'),
      baseUrl = split[0],
      spinePos = spineIndexByURL[baseUrl],
      spineItem = bookSpine[spinePos],
      cfi = spineItem ? spineItem.cfi : '',
      subitems = this.navItems(item, spineIndexByURL, bookSpine);

    result.push({
      href,
      label,
      spinePos,
      subitems,
      cfi,
    });
  });

  return result;
};

EPUBJS.Parser.prototype.toc = function (tocXml, spineIndexByURL, bookSpine) {
  const navPoints = tocXml.querySelectorAll('navMap navPoint');
  const length = navPoints.length;
  let i;
  const toc = {};
  const list = [];
  let item,
    parent;

  if (!navPoints || length === 0) return list;

  for (i = 0; i < length; ++i) {
    item = this.tocItem(navPoints[i], spineIndexByURL, bookSpine);
    toc[item.id] = item;
    if (!item.parent) {
      list.push(item);
    } else {
      parent = toc[item.parent];
      parent.subitems.push(item);
    }
  }

  return list;
};

EPUBJS.Parser.prototype.tocItem = function (item, spineIndexByURL, bookSpine) {
  let id = item.getAttribute('id') || false,
    content = item.querySelector('content'),
    src = content.getAttribute('src'),
    navLabel = item.querySelector('navLabel'),
    text = navLabel.textContent ? navLabel.textContent : '',
    split = src.split('#'),
    baseUrl = split[0],
    spinePos = spineIndexByURL[baseUrl],
    spineItem = bookSpine[spinePos],
    subitems = [],
    parentNode = item.parentNode,
    parent,
    cfi = spineItem ? spineItem.cfi : '';

  if (parentNode && parentNode.nodeName === 'navPoint') {
    parent = parentNode.getAttribute('id');
  }

  if (!id) {
    if (spinePos) {
      spineItem = bookSpine[spinePos];
      id = spineItem.id;
      cfi = spineItem.cfi;
    } else {
      id = `epubjs-autogen-toc-id-${EPUBJS.core.uuid()}`;
      item.setAttribute('id', id);
    }
  }

  return {
    id,
    href: src,
    label: text,
    spinePos,
    subitems,
    parent,
    cfi,
  };
};


EPUBJS.Parser.prototype.pageList = function (navHtml, spineIndexByURL, bookSpine) {
  const navElement = this.querySelectorByType(navHtml, 'nav', 'page-list');
  const navItems = navElement ? navElement.querySelectorAll('ol li') : [];
  const length = navItems.length;
  let i;
  const toc = {};
  const list = [];
  let item;

  if (!navItems || length === 0) return list;

  for (i = 0; i < length; ++i) {
    item = this.pageListItem(navItems[i], spineIndexByURL, bookSpine);
    list.push(item);
  }

  return list;
};

EPUBJS.Parser.prototype.pageListItem = function (item, spineIndexByURL, bookSpine) {
  let id = item.getAttribute('id') || false,
    content = item.querySelector('a'),
    href = content.getAttribute('href') || '',
    text = content.textContent || '',
    page = parseInt(text),
    isCfi = href.indexOf('epubcfi'),
    split,
    packageUrl,
    cfi;

  if (isCfi != -1) {
    split = href.split('#');
    packageUrl = split[0];
    cfi = split.length > 1 ? split[1] : false;
    return {
      cfi,
      href,
      packageUrl,
      page,
    };
  }
  return {
    href,
    page,
  };
};

EPUBJS.Render.Iframe = function () {
  this.iframe = null;
  this.document = null;
  this.window = null;
  this.docEl = null;
  this.bodyEl = null;

  this.leftPos = 0;
  this.pageWidth = 0;
  this.id = EPUBJS.core.uuid();
};

// -- Build up any html needed
EPUBJS.Render.Iframe.prototype.create = function () {
  this.element = document.createElement('div');
  this.element.id = `epubjs-view:${this.id}`;

  this.isMobile = navigator.userAgent.match(/(iPad|iPhone|iPod|Mobile|Android)/g);
  this.transform = EPUBJS.core.prefixed('transform');

  return this.element;
};

EPUBJS.Render.Iframe.prototype.addIframe = function () {
  this.iframe = document.createElement('iframe');
  this.iframe.id = `epubjs-iframe:${this.id}`;
  this.iframe.scrolling = this.scrolling || 'no';
  this.iframe.seamless = 'seamless';
  // Back up if seamless isn't supported
  this.iframe.style.border = 'none';

  this.iframe.addEventListener('load', this.loaded.bind(this), false);

  if (this._width || this._height) {
    this.iframe.height = this._height;
    this.iframe.width = this._width;
  }
  return this.iframe;
};

/**
* Sets the source of the iframe with the given URL string
* Takes:  Document Contents String
* Returns: promise with document element
*/
EPUBJS.Render.Iframe.prototype.load = function (contents, url) {
  let render = this,
    deferred = new RSVP.defer();

  if (this.window) {
    this.unload();
  }

  if (this.iframe) {
    this.element.removeChild(this.iframe);
  }

  this.iframe = this.addIframe();
  this.element.appendChild(this.iframe);


  this.iframe.onload = function (e) {
    let title;

    render.document = render.iframe.contentDocument;
    render.docEl = render.document.documentElement;
    render.headEl = render.document.head;
    render.bodyEl = render.document.body || render.document.querySelector('body');
    render.window = render.iframe.contentWindow;

    render.window.addEventListener('resize', render.resized.bind(render), false);

    // Reset the scroll position
    render.leftPos = 0;
    render.setLeft(0);

    // -- Clear Margins
    if (render.bodyEl) {
      render.bodyEl.style.margin = '0';
    }

    deferred.resolve(render.docEl);
  };

  this.iframe.onerror = function (e) {
    // console.error("Error Loading Contents", e);
    deferred.reject({
      message: `Error Loading Contents: ${e}`,
      stack: new Error().stack,
    });
  };

  // this.iframe.contentWindow.location.replace(url);
  this.document = this.iframe.contentDocument;

  if (!this.document) {
    deferred.reject(new Error('No Document Available'));
    return deferred.promise;
  }

  this.iframe.contentDocument.open();
  this.iframe.contentDocument.write(contents);
  this.iframe.contentDocument.close();

  return deferred.promise;
};


EPUBJS.Render.Iframe.prototype.loaded = function (v) {
  const url = this.iframe.contentWindow.location.href;
  let baseEl,
    base;

  this.document = this.iframe.contentDocument;
  this.docEl = this.document.documentElement;
  this.headEl = this.document.head;
  this.bodyEl = this.document.body || this.document.querySelector('body');
  this.window = this.iframe.contentWindow;
  this.window.focus();

  if (url != 'about:blank') {
    baseEl = this.iframe.contentDocument.querySelector('base');
    base = baseEl.getAttribute('href');
    this.trigger('render:loaded', base);
  }
};

// Resize the iframe to the given width and height
EPUBJS.Render.Iframe.prototype.resize = function (width, height) {
  let iframeBox;

  if (!this.element) return;

  this.element.style.height = height;


  if (!isNaN(width) && width % 2 !== 0) {
    width += 1; // -- Prevent cutting off edges of text in columns
  }

  this.element.style.width = width;

  if (this.iframe) {
    this.iframe.height = height;
    this.iframe.width = width;
  }

  // Set the width for the iframe
  this._height = height;
  this._width = width;

  // Get the fractional height and width of the iframe
  // Default to orginal if bounding rect is 0
  this.width = this.element.getBoundingClientRect().width || width;
  this.height = this.element.getBoundingClientRect().height || height;
};


EPUBJS.Render.Iframe.prototype.resized = function (e) {
  // Get the fractional height and width of the iframe
  this.width = this.iframe.getBoundingClientRect().width;
  this.height = this.iframe.getBoundingClientRect().height;
};

EPUBJS.Render.Iframe.prototype.totalWidth = function () {
  return this.docEl.scrollWidth;
};

EPUBJS.Render.Iframe.prototype.totalHeight = function () {
  return this.docEl.scrollHeight;
};

EPUBJS.Render.Iframe.prototype.setPageDimensions = function (pageWidth, pageHeight) {
  this.pageWidth = pageWidth;
  this.pageHeight = pageHeight;
  // -- Add a page to the width of the document to account an for odd number of pages
  // this.docEl.style.width = this.docEl.scrollWidth + pageWidth + "px";
};

EPUBJS.Render.Iframe.prototype.setDirection = function (direction) {
  this.direction = direction;

  // Undo previous changes if needed
  if (this.docEl && this.docEl.dir == 'rtl') {
    this.docEl.dir = 'rtl';
    if (this.layout !== 'pre-paginated') {
      this.docEl.style.position = 'static';
      this.docEl.style.right = 'auto';
    }
  }
};

EPUBJS.Render.Iframe.prototype.setLeft = function (leftPos) {
  // this.bodyEl.style.marginLeft = -leftPos + "px";
  // this.docEl.style.marginLeft = -leftPos + "px";
  // this.docEl.style[EPUBJS.Render.Iframe.transform] = 'translate('+ (-leftPos) + 'px, 0)';

  if (this.isMobile) {
    this.docEl.style[this.transform] = `translate(${-leftPos}px, 0)`;
  } else {
    this.document.defaultView.scrollTo(leftPos, 0);
  }
};

EPUBJS.Render.Iframe.prototype.setLayout = function (layout) {
  this.layout = layout;
};

EPUBJS.Render.Iframe.prototype.setStyle = function (style, val, prefixed) {
  if (prefixed) {
    style = EPUBJS.core.prefixed(style);
  }

  if (this.bodyEl) this.bodyEl.style[style] = val;
};

EPUBJS.Render.Iframe.prototype.removeStyle = function (style) {
  if (this.bodyEl) this.bodyEl.style[style] = '';
};

EPUBJS.Render.Iframe.prototype.setClasses = function (classes) {
  if (this.bodyEl) this.bodyEl.className = classes.join(' ');
};

EPUBJS.Render.Iframe.prototype.addHeadTag = function (tag, attrs, _doc) {
  const doc = _doc || this.document;
  const tagEl = doc.createElement(tag);
  const headEl = doc.head;

  for (const attr in attrs) {
    tagEl.setAttribute(attr, attrs[attr]);
  }

  if (headEl) headEl.insertBefore(tagEl, headEl.firstChild);
};

EPUBJS.Render.Iframe.prototype.page = function (pg) {
  this.leftPos = this.pageWidth * (pg - 1); // -- pages start at 1

  // Reverse for rtl langs
  if (this.direction === 'rtl') {
    this.leftPos = this.leftPos * -1;
  }

  this.setLeft(this.leftPos);
};

// -- Show the page containing an Element
EPUBJS.Render.Iframe.prototype.getPageNumberByElement = function (el) {
  let left,
    pg;
  if (!el) return;

  left = this.leftPos + el.getBoundingClientRect().left; // -- Calculate left offset compaired to scrolled position

  pg = Math.floor(left / this.pageWidth) + 1; // -- pages start at 1

  return pg;
};

// -- Show the page containing an Element
EPUBJS.Render.Iframe.prototype.getPageNumberByRect = function (boundingClientRect) {
  let left,
    pg;

  left = this.leftPos + boundingClientRect.left; // -- Calculate left offset compaired to scrolled position
  pg = Math.floor(left / this.pageWidth) + 1; // -- pages start at 1

  return pg;
};

// Return the root element of the content
EPUBJS.Render.Iframe.prototype.getBaseElement = function () {
  return this.bodyEl;
};

// Return the document element
EPUBJS.Render.Iframe.prototype.getDocumentElement = function () {
  return this.docEl;
};

// Checks if an element is on the screen
EPUBJS.Render.Iframe.prototype.isElementVisible = function (el) {
  let rect;
  let left;

  if (el && typeof el.getBoundingClientRect === 'function') {
    rect = el.getBoundingClientRect();
    left = rect.left; // + rect.width;
    if (rect.width !== 0 &&
				rect.height !== 0 && // Element not visible
				left >= 0 &&
				left < this.pageWidth) {
      return true;
    }
  }

  return false;
};


EPUBJS.Render.Iframe.prototype.scroll = function (bool) {
  if (bool) {
    // this.iframe.scrolling = "yes";
    this.scrolling = 'yes';
  } else {
    this.scrolling = 'no';
    // this.iframe.scrolling = "no";
  }
};

// Cleanup event listeners
EPUBJS.Render.Iframe.prototype.unload = function () {
  this.window.removeEventListener('resize', this.resized);
  this.iframe.removeEventListener('load', this.loaded);
};

// -- Enable binding events to Render
RSVP.EventTarget.mixin(EPUBJS.Render.Iframe.prototype);

EPUBJS.Renderer = function (renderMethod, hidden) {
  // Dom events to listen for
  this.listenedEvents = ['keydown', 'keyup', 'keypressed', 'mouseup', 'mousedown', 'click'];
  this.upEvent = 'mouseup';
  this.downEvent = 'mousedown';
  if ('ontouchstart' in document.documentElement) {
    this.listenedEvents.push('touchstart', 'touchend');
    this.upEvent = 'touchend';
    this.downEvent = 'touchstart';
  }
  /**
	* Setup a render method.
	* Options are: Iframe
	*/
  if (renderMethod && typeof (EPUBJS.Render[renderMethod]) !== 'undefined') {
    this.render = new EPUBJS.Render[renderMethod]();
  } else {
    console.error('Not a Valid Rendering Method');
  }

  // Listen for load events
  this.render.on('render:loaded', this.loaded.bind(this));

  // Cached for replacement urls from storage
  this.caches = {};

  // Blank Cfi for Parsing
  this.epubcfi = new EPUBJS.EpubCFI();

  this.spreads = true;
  this.isForcedSingle = false;
  this.resized = this.onResized.bind(this);

  this.layoutSettings = {};

  this.hidden = hidden || false;
  // -- Adds Hook methods to the Book prototype
  //   Hooks will all return before triggering the callback.
  EPUBJS.Hooks.mixin(this);
  // -- Get pre-registered hooks for events
  this.getHooks('beforeChapterDisplay');

  // -- Queue up page changes if page map isn't ready
  this._q = EPUBJS.core.queue(this);

  this._moving = false;
};

// -- Renderer events for listening
EPUBJS.Renderer.prototype.Events = [
  'renderer:keydown',
  'renderer:keyup',
  'renderer:keypressed',
  'renderer:mouseup',
  'renderer:mousedown',
  'renderer:click',
  'renderer:touchstart',
  'renderer:touchend',
  'renderer:selected',
  'renderer:chapterUnload',
  'renderer:chapterUnloaded',
  'renderer:chapterDisplayed',
  'renderer:locationChanged',
  'renderer:visibleLocationChanged',
  'renderer:visibleRangeChanged',
  'renderer:resized',
  'renderer:spreads',
  'renderer:beforeResize',
];

/**
* Creates an element to render to.
* Resizes to passed width and height or to the elements size
*/
EPUBJS.Renderer.prototype.initialize = function (element, width, height) {
  this.container = element;
  this.element = this.render.create();

  this.initWidth = width;
  this.initHeight = height;

  this.width = width || this.container.clientWidth;
  this.height = height || this.container.clientHeight;

  this.container.appendChild(this.element);

  if (width && height) {
    this.render.resize(this.width, this.height);
  } else {
    this.render.resize('100%', '100%');
  }

  document.addEventListener('orientationchange', this.onResized.bind(this));
};

/**
* Display a chapter
* Takes: chapter object, global layout settings
* Returns: Promise with passed Renderer after pages has loaded
*/
EPUBJS.Renderer.prototype.displayChapter = function (chapter, globalLayout) {
  const store = false;
  if (this._moving) {
    console.warning('Rendering In Progress');
    const deferred = new RSVP.defer();
    deferred.reject({
      message: 'Rendering In Progress',
      stack: new Error().stack,
    });
    return deferred.promise;
  }
  this._moving = true;
  // Get the url string from the chapter (may be from storage)
  return chapter.render()
    .then((contents) => {
      // Unload the previous chapter listener
      if (this.currentChapter) {
        this.trigger('renderer:chapterUnload');
        this.currentChapter.unload(); // Remove stored blobs

        if (this.render.window) {
          this.render.window.removeEventListener('resize', this.resized);
        }

        this.removeEventListeners();
        this.removeSelectionListeners();
        this.trigger('renderer:chapterUnloaded');
        this.contents = null;
        this.doc = null;
        this.pageMap = null;
      }

      this.currentChapter = chapter;

      this.chapterPos = 1;

      this.currentChapterCfiBase = chapter.cfiBase;

      this.layoutSettings = this.reconcileLayoutSettings(globalLayout, chapter.properties);

      return this.load(contents, chapter.href);
    }, () => {
      this._moving = false;
    });
};

/**
* Loads a url (string) and renders it,
* attaching event listeners and triggering hooks.
* Returns: Promise with the rendered contents.
*/

EPUBJS.Renderer.prototype.load = function (contents, url) {
  const deferred = new RSVP.defer();
  let loaded;

  // Switch to the required layout method for the settings
  this.layoutMethod = this.determineLayout(this.layoutSettings);
  this.layout = new EPUBJS.Layout[this.layoutMethod]();

  this.visible(false);

  this.render.load(contents, url).then((contents) => {
    // Duck-type fixed layout books.
    if (EPUBJS.Layout.isFixedLayout(contents)) {
      this.layoutSettings.layout = 'pre-paginated';
      this.layoutMethod = this.determineLayout(this.layoutSettings);
      this.layout = new EPUBJS.Layout[this.layoutMethod]();
    }
    this.render.setLayout(this.layoutSettings.layout);

    // HTML element must have direction set if RTL or columnns will
    // not be in the correct direction in Firefox
    // Firefox also need the html element to be position right
    if (this.render.direction == 'rtl' && this.render.docEl.dir != 'rtl') {
      this.render.docEl.dir = 'rtl';
      if (this.render.layout !== 'pre-paginated') {
        this.render.docEl.style.position = 'absolute';
        this.render.docEl.style.right = '0';
      }
    }

    this.afterLoad(contents);

    // -- Trigger registered hooks before displaying
    this.beforeDisplay(() => {
      this.afterDisplay();

      this.visible(true);


      deferred.resolve(this); // -- why does this return the renderer?
    });
  });

  return deferred.promise;
};

EPUBJS.Renderer.prototype.afterLoad = function (contents) {
  let formated;
  // this.currentChapter.setDocument(this.render.document);
  this.contents = contents;
  this.doc = this.render.document;

  // Format the contents using the current layout method
  this.formated = this.layout.format(contents, this.render.width, this.render.height, this.gap);
  this.render.setPageDimensions(this.formated.pageWidth, this.formated.pageHeight);

  // window.addEventListener("orientationchange", this.onResized.bind(this), false);
  if (!this.initWidth && !this.initHeight) {
    this.render.window.addEventListener('resize', this.resized, false);
  }

  this.addEventListeners();
  this.addSelectionListeners();
};

EPUBJS.Renderer.prototype.afterDisplay = function (contents) {
  const pages = this.layout.calculatePages();
  const msg = this.currentChapter;
  const queued = this._q.length();
  this._moving = false;

  this.updatePages(pages);

  this.visibleRangeCfi = this.getVisibleRangeCfi();
  this.currentLocationCfi = this.visibleRangeCfi.start;

  if (queued === 0) {
    this.trigger('renderer:locationChanged', this.currentLocationCfi);
    this.trigger('renderer:visibleRangeChanged', this.visibleRangeCfi);
  }

  msg.cfi = this.currentLocationCfi; // TODO: why is this cfi passed to chapterDisplayed
  this.trigger('renderer:chapterDisplayed', msg);
};

EPUBJS.Renderer.prototype.loaded = function (url) {
  this.trigger('render:loaded', url);
  // var uri = EPUBJS.core.uri(url);
  // var relative = uri.path.replace(book.bookUrl, '');
  // console.log(url, uri, relative);
};

/**
* Reconciles the current chapters layout properies with
* the global layout properities.
* Takes: global layout settings object, chapter properties string
* Returns: Object with layout properties
*/
EPUBJS.Renderer.prototype.reconcileLayoutSettings = function (global, chapter) {
  const settings = {};

  // -- Get the global defaults
  for (const attr in global) {
    if (global.hasOwnProperty(attr)) {
      settings[attr] = global[attr];
    }
  }
  // -- Get the chapter's display type
  _.each(chapter, (prop) => {
    const rendition = prop.replace('rendition:', '');
    const split = rendition.indexOf('-');
    let property,
      value;

    if (split != -1) {
      property = rendition.slice(0, split);
      value = rendition.slice(split + 1);

      settings[property] = value;
    }
  });
  return settings;
};

/**
* Uses the settings to determine which Layout Method is needed
* Triggers events based on the method choosen
* Takes: Layout settings object
* Returns: String of appropriate for EPUBJS.Layout function
*/
EPUBJS.Renderer.prototype.determineLayout = function (settings) {
  // Default is layout: reflowable & spread: auto
  let spreads = this.determineSpreads(this.minSpreadWidth);
  let layoutMethod = spreads ? 'ReflowableSpreads' : 'Reflowable';
  let scroll = false;

  if (settings.layout === 'pre-paginated') {
    layoutMethod = 'Fixed';
    scroll = true;
    spreads = false;
  }

  if (settings.layout === 'reflowable' && settings.spread === 'none') {
    layoutMethod = 'Reflowable';
    scroll = false;
    spreads = false;
  }

  if (settings.layout === 'reflowable' && settings.spread === 'both') {
    layoutMethod = 'ReflowableSpreads';
    scroll = false;
    spreads = true;
  }

  this.spreads = spreads;
  this.render.scroll(scroll);
  this.trigger('renderer:spreads', spreads);
  return layoutMethod;
};

// Shortcut to trigger the hook before displaying the chapter
EPUBJS.Renderer.prototype.beforeDisplay = function (callback, renderer) {
  this.triggerHooks('beforeChapterDisplay', callback, this);
};

// Update the renderer with the information passed by the layout
EPUBJS.Renderer.prototype.updatePages = function (layout) {
  this.pageMap = this.mapPage();
  // this.displayedPages = layout.displayedPages;

  if (this.spreads) {
    this.displayedPages = Math.ceil(this.pageMap.length / 2);
  } else {
    this.displayedPages = this.pageMap.length;
  }

  this.currentChapter.pages = this.pageMap.length;

  this._q.flush();
};

// Apply the layout again and jump back to the previous cfi position
EPUBJS.Renderer.prototype.reformat = function () {
  const renderer = this;
  let formated,
    pages;
  let spreads;

  if (!this.contents) return;

  spreads = this.determineSpreads(this.minSpreadWidth);

  // Only re-layout if the spreads have switched
  if (spreads != this.spreads) {
    this.spreads = spreads;
    this.layoutMethod = this.determineLayout(this.layoutSettings);
    this.layout = new EPUBJS.Layout[this.layoutMethod]();
  }

  // Reset pages
  this.chapterPos = 1;

  this.render.page(this.chapterPos);
  // Give the css styles time to update
  // clearTimeout(this.timeoutTillCfi);
  // this.timeoutTillCfi = setTimeout(function(){
  renderer.formated = renderer.layout.format(renderer.render.docEl, renderer.render.width, renderer.render.height, renderer.gap);
  renderer.render.setPageDimensions(renderer.formated.pageWidth, renderer.formated.pageHeight);

  pages = renderer.layout.calculatePages();
  renderer.updatePages(pages);

  // -- Go to current page after formating
  if (renderer.currentLocationCfi) {
    renderer.gotoCfi(renderer.currentLocationCfi);
  }
  // renderer.timeoutTillCfi = null;
};

// Hide and show the render's container .
EPUBJS.Renderer.prototype.visible = function (bool) {
  if (typeof (bool) === 'undefined') {
    return this.element.style.visibility;
  }

  if (bool === true && !this.hidden) {
    this.element.style.visibility = 'visible';
  } else if (bool === false) {
    this.element.style.visibility = 'hidden';
  }
};

// Remove the render element and clean up listeners
EPUBJS.Renderer.prototype.remove = function () {
  if (this.render.window) {
    this.render.unload();
    this.render.window.removeEventListener('resize', this.resized);
    this.removeEventListeners();
    this.removeSelectionListeners();
  }

  // clean container content
  // this.container.innerHtml = ""; // not safe
  this.container.removeChild(this.element);
};

// -- STYLES

EPUBJS.Renderer.prototype.applyStyles = function (styles) {
  for (const style in styles) {
    this.render.setStyle(style, styles[style]);
  }
};

EPUBJS.Renderer.prototype.setStyle = function (style, val, prefixed) {
  this.render.setStyle(style, val, prefixed);
};

EPUBJS.Renderer.prototype.removeStyle = function (style) {
  this.render.removeStyle(style);
};

EPUBJS.Renderer.prototype.setClasses = function (classes) {
  this.render.setClasses(classes);
};

// -- HEAD TAGS
EPUBJS.Renderer.prototype.applyHeadTags = function (headTags) {
  for (const headTag in headTags) {
    this.render.addHeadTag(headTag, headTags[headTag]);
  }
};

// -- NAVIGATION

EPUBJS.Renderer.prototype.page = function (pg) {
  if (!this.pageMap) {
    console.warn('pageMap not set, queuing');
    this._q.enqueue('page', arguments);
    return true;
  }

  if (pg >= 1 && pg <= this.displayedPages) {
    this.chapterPos = pg;

    this.render.page(pg);
    this.visibleRangeCfi = this.getVisibleRangeCfi();
    this.currentLocationCfi = this.visibleRangeCfi.start;
    this.trigger('renderer:locationChanged', this.currentLocationCfi);
    this.trigger('renderer:visibleRangeChanged', this.visibleRangeCfi);

    return true;
  }
  // -- Return false if page is greater than the total
  return false;
};

// Short cut to find next page's cfi starting at the last visible element
/*
EPUBJS.Renderer.prototype.nextPage = function(){
	var pg = this.chapterPos + 1;
	if(pg <= this.displayedPages){
		this.chapterPos = pg;

		this.render.page(pg);

		this.currentLocationCfi = this.getPageCfi(this.visibileEl);
		this.trigger("renderer:locationChanged", this.currentLocationCfi);

		return true;
	}
	//-- Return false if page is greater than the total
	return false;
};
*/
EPUBJS.Renderer.prototype.nextPage = function () {
  return this.page(this.chapterPos + 1);
};

EPUBJS.Renderer.prototype.prevPage = function () {
  return this.page(this.chapterPos - 1);
};

// -- Show the page containing an Element
EPUBJS.Renderer.prototype.pageByElement = function (el) {
  let pg;
  if (!el) return;

  pg = this.render.getPageNumberByElement(el);
  this.page(pg);
};

// Jump to the last page of the chapter
EPUBJS.Renderer.prototype.lastPage = function () {
  if (this._moving) {
    return this._q.enqueue('lastPage', arguments);
  }

  this.page(this.displayedPages);
};

// Jump to the first page of the chapter
EPUBJS.Renderer.prototype.firstPage = function () {
  if (this._moving) {
    return this._q.enqueue('firstPage', arguments);
  }

  this.page(1);
};

// -- Find a section by fragement id
EPUBJS.Renderer.prototype.section = function (fragment) {
  const el = this.doc.getElementById(fragment);

  if (el) {
    this.pageByElement(el);
  }
};

EPUBJS.Renderer.prototype.firstElementisTextNode = function (node) {
  const children = node.childNodes;
  const leng = children.length;

  if (leng &&
		children[0] && // First Child
		children[0].nodeType === 3 && // This is a textNodes
		children[0].textContent.trim().length) { // With non whitespace or return characters
    return true;
  }
  return false;
};

EPUBJS.Renderer.prototype.isGoodNode = function (node) {
  const embeddedElements = ['audio', 'canvas', 'embed', 'iframe', 'img', 'math', 'object', 'svg', 'video'];
  if (embeddedElements.indexOf(node.tagName.toLowerCase()) !== -1) {
    // Embedded elements usually do not have a text node as first element, but are also good nodes
    return true;
  }
  return this.firstElementisTextNode(node);
};

// Walk the node tree from a start element to next visible element
EPUBJS.Renderer.prototype.walk = function (node, x, y) {
  let r,
    children,
    leng,
    startNode = node,
    prevNode,
    stack = [startNode];

  let STOP = 10000,
    ITER = 0;

  while (!r && stack.length) {
    node = stack.shift();
    if (this.containsPoint(node, x, y) && this.isGoodNode(node)) {
      r = node;
    }

    if (!r && node && node.childElementCount > 0) {
      children = node.children;
      if (children && children.length) {
        leng = children.length ? children.length : 0;
      } else {
        return r;
      }
      for (let i = leng - 1; i >= 0; i--) {
        if (children[i] != prevNode) stack.unshift(children[i]);
      }
    }

    if (!r && stack.length === 0 && startNode && startNode.parentNode !== null) {
      stack.push(startNode.parentNode);
      prevNode = startNode;
      startNode = startNode.parentNode;
    }


    ITER++;
    if (ITER > STOP) {
      console.error('ENDLESS LOOP');
      break;
    }
  }

  return r;
};

// Checks if an element is on the screen
EPUBJS.Renderer.prototype.containsPoint = function (el, x, y) {
  let rect;
  let left;
  if (el && typeof el.getBoundingClientRect === 'function') {
    rect = el.getBoundingClientRect();
    // console.log(el, rect, x, y);

    if (rect.width !== 0 &&
				rect.height !== 0 && // Element not visible
				rect.left >= x &&
				x <= rect.left + rect.width) {
      return true;
    }
  }

  return false;
};

EPUBJS.Renderer.prototype.textSprint = function (root, func) {
  const filterEmpty = function (node) {
    if (! /^\s*$/.test(node.data)) {
      return NodeFilter.FILTER_ACCEPT;
    }
    return NodeFilter.FILTER_REJECT;
  };
  let treeWalker;
  let node;

  try {
    treeWalker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode: filterEmpty,
    }, false);
    while ((node = treeWalker.nextNode())) {
      func(node);
    }
  } catch (e) {
    // IE doesn't accept the object, just wants a function
    // https://msdn.microsoft.com/en-us/library/ff974820(v=vs.85).aspx
    treeWalker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, filterEmpty, false);
    while ((node = treeWalker.nextNode())) {
      func(node);
    }
  }
};

EPUBJS.Renderer.prototype.sprint = function (root, func) {
  const treeWalker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT, null, false);
  let node;
  while ((node = treeWalker.nextNode())) {
    func(node);
  }
};

EPUBJS.Renderer.prototype.mapPage = function () {
  const renderer = this;
  let map = [];
  let root = this.render.getBaseElement();
  let page = 1;
  const width = this.layout.colWidth + this.layout.gap;
  const offset = this.formated.pageWidth * (this.chapterPos - 1);
  let limit = (width * page) - offset;// (width * page) - offset;
  let elLimit = 0;
  let prevRange;
  let prevRanges;
  let cfi;
  const lastChildren = null;
  let prevElement;
  let startRange,
    endRange;
  let startCfi,
    endCfi;
  const check = function (node) {
    let elPos;
    let elRange;
    let found;
    if (node.nodeType == Node.TEXT_NODE) {
      elRange = document.createRange();
      elRange.selectNodeContents(node);
      elPos = elRange.getBoundingClientRect();
      if (!elPos || (elPos.width === 0 && elPos.height === 0)) {
        return;
      }

      // -- Element starts new Col
      if (elPos.left > elLimit) {
        found = checkText(node);
      }

      // -- Element Spans new Col
      if (elPos.right > elLimit) {
        found = checkText(node);
      }

      prevElement = node;

      if (found) {
        prevRange = null;
      }
    }
  };
  var checkText = function (node) {
    let result;
    const ranges = renderer.splitTextNodeIntoWordsRanges(node);

    _.each(ranges, (range) => {
      const pos = range.getBoundingClientRect();

      if (!pos || (pos.width === 0 && pos.height === 0)) {
        return;
      }
      if (pos.left + pos.width < limit) {
        if (!map[page - 1]) {
          range.collapse(true);
          cfi = renderer.currentChapter.cfiFromRange(range);
          // map[page-1].start = cfi;
          result = map.push({ start: cfi, end: null });
        }
      } else {
        // Previous Range is null since we already found our last map pair
        // Use that last walked textNode
        if (!prevRange && prevElement) {
          prevRanges = renderer.splitTextNodeIntoWordsRanges(prevElement);
          prevRange = prevRanges[prevRanges.length - 1];
        }

        if (prevRange && map.length) {
          prevRange.collapse(false);
          cfi = renderer.currentChapter.cfiFromRange(prevRange);
          if (map[map.length - 1]) {
            map[map.length - 1].end = cfi;
          }
        }

        range.collapse(true);
        cfi = renderer.currentChapter.cfiFromRange(range);

        result = map.push({
          start: cfi,
          end: null,
        });

        page += 1;
        limit = (width * page) - offset;
        elLimit = limit;
      }

      prevRange = range;
    });

    return result;
  };
  const docEl = this.render.getDocumentElement();
  const dir = docEl.dir;

  // Set back to ltr before sprinting to get correct order
  if (dir == 'rtl') {
    docEl.dir = 'ltr';
    if (this.layoutSettings.layout !== 'pre-paginated') {
      docEl.style.position = 'static';
    }
  }

  this.textSprint(root, check);

  // Reset back to previous RTL settings
  if (dir == 'rtl') {
    docEl.dir = dir;
    if (this.layoutSettings.layout !== 'pre-paginated') {
      docEl.style.left = 'auto';
      docEl.style.right = '0';
    }
  }

  // Check the remaining children that fit on this page
  // to ensure the end is correctly calculated
  if (!prevRange && prevElement) {
    prevRanges = renderer.splitTextNodeIntoWordsRanges(prevElement);
    prevRange = prevRanges[prevRanges.length - 1];
  }

  if (prevRange) {
    prevRange.collapse(false);
    cfi = renderer.currentChapter.cfiFromRange(prevRange);
    map[map.length - 1].end = cfi;
  }

  // Handle empty map
  if (!map.length) {
    startRange = this.doc.createRange();
    startRange.selectNodeContents(root);
    startRange.collapse(true);
    startCfi = renderer.currentChapter.cfiFromRange(startRange);

    endRange = this.doc.createRange();
    endRange.selectNodeContents(root);
    endRange.collapse(false);
    endCfi = renderer.currentChapter.cfiFromRange(endRange);


    /** *custom */
    map.push({ start: startCfi, end: endCfi });
  }


  /* custom */
  if (this.isPaginating) {
    map = this.addContentToMap(map);
  }


  // clean up
  prevRange = null;
  prevRanges = undefined;
  startRange = null;
  endRange = null;
  root = null;
  fullRange = null;

  return map;
};


EPUBJS.Renderer.prototype.addContentToMap = function (map) {
  for (let i = 0; i < map.length; i++) {
    let cfi = new EPUBJS.EpubCFI(),
      startCfi = map[i].start,
      endCfi = map[i].end;
    startRange = cfi.generateRangeFromCfi(startCfi, this.render.document),
    endRange = cfi.generateRangeFromCfi(endCfi, this.render.document);

    const fullRange = document.createRange();
    fullRange.setStart(startRange.startContainer, startRange.startOffset);
    fullRange.setEnd(endRange.startContainer, endRange.startOffset);
    const content = fullRange.toString();
    map[i].content = content;
  }
  return map;
};


EPUBJS.Renderer.prototype.createHTMLfromRange = function (range) {
  const contents = range.cloneContents();
  let html = '';
  const children = contents.children;
  for (let i = 0; i < children.length; i++) {
    html += children[i].outerHTML;
  }
  return html;
};


EPUBJS.Renderer.prototype.indexOfBreakableChar = function (text, startPosition) {
  const whiteCharacters = '\x2D\x20\t\r\n\b\f';
  // '-' \x2D
  // ' ' \x20

  if (! startPosition) {
    startPosition = 0;
  }

  for (let i = startPosition; i < text.length; i++) {
    if (whiteCharacters.indexOf(text.charAt(i)) != -1) {
      return i;
    }
  }

  return -1;
};


EPUBJS.Renderer.prototype.splitTextNodeIntoWordsRanges = function (node) {
  const ranges = [];
  const text = node.textContent.trim();
  let range;
  let rect;
  let list;

  // Usage of indexOf() function for space character as word delimiter
  // is not sufficient in case of other breakable characters like \r\n- etc
  let pos = this.indexOfBreakableChar(text);

  if (pos === -1) {
    range = this.doc.createRange();
    range.selectNodeContents(node);
    return [range];
  }

  range = this.doc.createRange();
  range.setStart(node, 0);
  range.setEnd(node, pos);
  ranges.push(range);

  // there was a word miss in case of one letter words
  range = this.doc.createRange();
  range.setStart(node, pos + 1);

  while (pos != -1) {
    pos = this.indexOfBreakableChar(text, pos + 1);
    if (pos > 0) {
      if (range) {
        range.setEnd(node, pos);
        ranges.push(range);
      }

      range = this.doc.createRange();
      range.setStart(node, pos + 1);
    }
  }

  if (range) {
    range.setEnd(node, text.length);
    ranges.push(range);
  }

  return ranges;
};

EPUBJS.Renderer.prototype.rangePosition = function (range) {
  let rect;
  let list;

  list = range.getClientRects();

  if (list.length) {
    rect = list[0];
    return rect;
  }

  return null;
};

/*
// Get the cfi of the current page
EPUBJS.Renderer.prototype.getPageCfi = function(prevEl){
	var range = this.doc.createRange();
	var position;
	// TODO : this might need to take margin / padding into account?
	var x = 1;//this.formated.pageWidth/2;
	var y = 1;//;this.formated.pageHeight/2;

	range = this.getRange(x, y);

	// var test = this.doc.defaultView.getSelection();
	// var r = this.doc.createRange();
	// test.removeAllRanges();
	// r.setStart(range.startContainer, range.startOffset);
	// r.setEnd(range.startContainer, range.startOffset + 1);
	// test.addRange(r);

	return this.currentChapter.cfiFromRange(range);
};
*/

// Get the cfi of the current page
EPUBJS.Renderer.prototype.getPageCfi = function () {
  const pg = (this.chapterPos * 2) - 1;
  return this.pageMap[pg].start;
};

EPUBJS.Renderer.prototype.getRange = function (x, y, forceElement) {
  let range = this.doc.createRange();
  let position;
  forceElement = true; // temp override
  if (typeof document.caretPositionFromPoint !== 'undefined' && !forceElement) {
    position = this.doc.caretPositionFromPoint(x, y);
    range.setStart(position.offsetNode, position.offset);
  } else if (typeof document.caretRangeFromPoint !== 'undefined' && !forceElement) {
    range = this.doc.caretRangeFromPoint(x, y);
  } else {
    this.visibileEl = this.findElementAfter(x, y);
    range.setStart(this.visibileEl, 1);
  }

  // var test = this.doc.defaultView.getSelection();
  // var r = this.doc.createRange();
  // test.removeAllRanges();
  // r.setStart(range.startContainer, range.startOffset);
  // r.setEnd(range.startContainer, range.startOffset + 1);
  // test.addRange(r);
  return range;
};

/*
EPUBJS.Renderer.prototype.getVisibleRangeCfi = function(prevEl){
	var startX = 0;
	var startY = 0;
	var endX = this.width-1;
	var endY = this.height-1;
	var startRange = this.getRange(startX, startY);
	var endRange = this.getRange(endX, endY); //fix if carret not avail
	var startCfi = this.currentChapter.cfiFromRange(startRange);
	var endCfi;
	if(endRange) {
		endCfi = this.currentChapter.cfiFromRange(endRange);
	}

	return {
		start: startCfi,
		end: endCfi || false
	};
};
*/

EPUBJS.Renderer.prototype.pagesInCurrentChapter = function () {
  let pgs;
  let length;

  if (!this.pageMap) {
    console.warn('page map not loaded');
    return false;
  }

  length = this.pageMap.length;

  // if(this.spreads){
  // 	pgs = Math.ceil(length / 2);
  // } else {
  // 	pgs = length;
  // }

  return length;
};

EPUBJS.Renderer.prototype.currentRenderedPage = function () {
  let pg;

  if (!this.pageMap) {
    console.warn('page map not loaded');
    return false;
  }

  if (this.spreads && this.pageMap.length > 1) {
    pg = (this.chapterPos * 2) - 1;
  } else {
    pg = this.chapterPos;
  }

  return pg;
};

EPUBJS.Renderer.prototype.getRenderedPagesLeft = function () {
  let pg;
  let lastPage;
  let pagesLeft;

  if (!this.pageMap) {
    console.warn('page map not loaded');
    return false;
  }

  lastPage = this.pageMap.length;

  if (this.spreads) {
    pg = (this.chapterPos * 2) - 1;
  } else {
    pg = this.chapterPos;
  }

  pagesLeft = lastPage - pg;
  return pagesLeft;
};

EPUBJS.Renderer.prototype.getVisibleRangeCfi = function () {
  let pg;
  let startRange,
    endRange;

  if (!this.pageMap) {
    console.warn('page map not loaded');
    return false;
  }

  if (this.spreads) {
    pg = this.chapterPos * 2;
    startRange = this.pageMap[pg - 2];
    endRange = startRange;

    if (this.pageMap.length > 1 && this.pageMap.length > pg - 1) {
      endRange = this.pageMap[pg - 1];
    }
  } else {
    pg = this.chapterPos;
    startRange = this.pageMap[pg - 1];
    endRange = startRange;
  }

  if (!startRange) {
    console.warn('page range miss:', pg, this.pageMap);
    startRange = this.pageMap[this.pageMap.length - 1];
    endRange = startRange;
  }

  return {
    start: startRange.start,
    end: endRange.end,
  };
};

// Goto a cfi position in the current chapter
EPUBJS.Renderer.prototype.gotoCfi = function (cfi) {
  let pg;
  let marker;
  let range;

  if (this._moving) {
    return this._q.enqueue('gotoCfi', arguments);
  }

  if (EPUBJS.core.isString(cfi)) {
    cfi = this.epubcfi.parse(cfi);
  }

  if (typeof document.evaluate === 'undefined') {
    marker = this.epubcfi.addMarker(cfi, this.doc);
    if (marker) {
      pg = this.render.getPageNumberByElement(marker);
      // Must Clean up Marker before going to page
      this.epubcfi.removeMarker(marker, this.doc);
      this.page(pg);
    }
  } else {
    range = this.epubcfi.generateRangeFromCfi(cfi, this.doc);
    if (range) {
      // jaroslaw.bielski@7bulls.com
      // It seems that sometimes getBoundingClientRect() returns null for first page CFI in chapter.
      // It is always reproductible if few consecutive chapters have only one page.
      // NOTE: This is only workaround and the issue needs an deeper investigation.
      // NOTE: Observed on Android 4.2.1 using WebView widget as HTML renderer (Asus TF300T).
      const rect = range.getBoundingClientRect();
      if (rect) {
        pg = this.render.getPageNumberByRect(rect);
      } else {
        // Goto first page in chapter
        pg = 1;
      }

      this.page(pg);

      // Reset the current location cfi to requested cfi
      this.currentLocationCfi = cfi.str;
    } else {
      // Failed to find a range, go to first page
      this.page(1);
    }
  }
};

//  Walk nodes until a visible element is found
EPUBJS.Renderer.prototype.findFirstVisible = function (startEl) {
  const el = startEl || this.render.getBaseElement();
  let	found;
  // kgolunski@7bulls.com
  // Looks like an old API usage
  // Set x and y as 0 to fullfill walk method API.
  found = this.walk(el, 0, 0);

  if (found) {
    return found;
  }
  return startEl;
};
// TODO: remove me - unsused
EPUBJS.Renderer.prototype.findElementAfter = function (x, y, startEl) {
  const el = startEl || this.render.getBaseElement();
  let	found;
  found = this.walk(el, x, y);
  if (found) {
    return found;
  }
  return el;
};

/*
EPUBJS.Renderer.prototype.route = function(hash, callback){
	var location = window.location.hash.replace('#/', '');
	if(this.useHash && location.length && location != this.prevLocation){
		this.show(location, callback);
		this.prevLocation = location;
		return true;
	}
	return false;
}

EPUBJS.Renderer.prototype.hideHashChanges = function(){
	this.useHash = false;
}

*/

EPUBJS.Renderer.prototype.resize = function (width, height, setSize) {
  let spreads;

  this.width = width;
  this.height = height;

  if (setSize !== false) {
    this.render.resize(this.width, this.height);
  }


  if (this.contents) {
    this.reformat();
  }

  this.trigger('renderer:resized', {
    width: this.width,
    height: this.height,
  });
};

// -- Listeners for events in the frame

EPUBJS.Renderer.prototype.onResized = function (e) {
  this.trigger('renderer:beforeResize');

  const width = this.container.clientWidth;
  const height = this.container.clientHeight;

  this.resize(width, height, false);
};

EPUBJS.Renderer.prototype.addEventListeners = function () {
  if (!this.render.document) {
    return;
  }

  _.each(this.listenedEvents, (eventName) => {
    this.render.document.addEventListener(eventName, this.triggerEvent.bind(this), false);
  });
};

EPUBJS.Renderer.prototype.removeEventListeners = function () {
  if (!this.render.document) {
    return;
  }
  _.each(this.listenedEvents, (eventName) => {
    this.render.document.removeEventListener(eventName, this.triggerEvent, false);
  });
};

// Pass browser events
EPUBJS.Renderer.prototype.triggerEvent = function (e) {
  this.trigger(`renderer:${e.type}`, e);
};

EPUBJS.Renderer.prototype.addSelectionListeners = function () {
  this.render.document.addEventListener('selectionchange', this.onSelectionChange.bind(this), false);
};

EPUBJS.Renderer.prototype.removeSelectionListeners = function () {
  if (!this.render.document) {
    return;
  }
  this.doc.removeEventListener('selectionchange', this.onSelectionChange, false);
};

EPUBJS.Renderer.prototype.onSelectionChange = function (e) {
  if (this.selectionEndTimeout) {
    clearTimeout(this.selectionEndTimeout);
  }
  this.selectionEndTimeout = setTimeout(() => {
    this.selectedRange = this.render.window.getSelection();
    this.trigger('renderer:selected', this.selectedRange);
  }, 500);
};


// -- Spreads

EPUBJS.Renderer.prototype.setMinSpreadWidth = function (width) {
  this.minSpreadWidth = width;
  this.spreads = this.determineSpreads(width);
};

EPUBJS.Renderer.prototype.determineSpreads = function (cutoff) {
  if (this.isForcedSingle || !cutoff || this.width < cutoff) {
    return false; // -- Single Page
  }
  return true; // -- Double Page
};

EPUBJS.Renderer.prototype.forceSingle = function (bool) {
  if (bool) {
    this.isForcedSingle = true;
    // this.spreads = false;
  } else {
    this.isForcedSingle = false;
    // this.spreads = this.determineSpreads(this.minSpreadWidth);
  }
};

EPUBJS.Renderer.prototype.setGap = function (gap) {
  this.gap = gap; // -- False == auto gap
};

EPUBJS.Renderer.prototype.setDirection = function (direction) {
  this.direction = direction;
  this.render.setDirection(this.direction);
};

// -- Content Replacements

EPUBJS.Renderer.prototype.replace = function (query, func, finished, progress) {
  let items = this.contents.querySelectorAll(query),
    resources = Array.prototype.slice.call(items),
    count = resources.length;


  if (count === 0) {
    finished(false);
    return;
  }
  _.each(resources, (item) => {
    let called = false;
    const after = function (result, full) {
      if (called === false) {
        count--;
        if (progress) progress(result, full, count);
        if (count <= 0 && finished) finished(true);
        called = true;
      }
    };

    func(item, after);
  });
};

// -- Enable binding events to Renderer
RSVP.EventTarget.mixin(EPUBJS.Renderer.prototype);

var EPUBJS = EPUBJS || {};
EPUBJS.replace = {};

// -- Replaces the relative links within the book to use our internal page changer
EPUBJS.replace.hrefs = function (callback, renderer) {
  const book = this;
  const replacments = function (link, done) {
    let href = link.getAttribute('href'),
      isRelative = href.search('://'),
      directory,
      relative,
      location,
      base,
      uri,
      url;

    if (href.indexOf('mailto:') === 0) {
      done();
      return;
    }

    if (isRelative != -1) {
      link.setAttribute('target', '_blank');
    } else {
      // Links may need to be resolved, such as ../chp1.xhtml
      base = renderer.render.docEl.querySelector('base');
      url = base.getAttribute('href');
      uri = EPUBJS.core.uri(url);
      directory = uri.directory;

      if (href.indexOf('#') === 0) {
        href = uri.filename + href;
      }

      if (directory) {
        // We must ensure that the file:// protocol is preserved for
        // local file links, as in certain contexts (such as under
        // Titanium), file links without the file:// protocol will not
        // work
        if (uri.protocol === 'file') {
          relative = EPUBJS.core.resolveUrl(uri.base, href);
        } else {
          relative = EPUBJS.core.resolveUrl(directory, href);
        }
      } else {
        relative = href;
      }

      link.onclick = function () {
        book.trigger('book:linkClicked', href);
        book.goto(relative);
        return false;
      };
    }
    done();
  };

  renderer.replace('a[href]', replacments, callback);
};

EPUBJS.replace.head = function (callback, renderer) {
  renderer.replaceWithStored('link[href]', 'href', EPUBJS.replace.links, callback);
};


// -- Replaces assets src's to point to stored version if browser is offline
EPUBJS.replace.resources = function (callback, renderer) {
  // srcs = this.doc.querySelectorAll('[src]');
  renderer.replaceWithStored('[src]', 'src', EPUBJS.replace.srcs, callback);
};

EPUBJS.replace.posters = function (callback, renderer) {
  renderer.replaceWithStored('[poster]', 'poster', EPUBJS.replace.srcs, callback);
};

EPUBJS.replace.svg = function (callback, renderer) {
  renderer.replaceWithStored('svg image', 'xlink:href', (_store, full, done) => {
    _store.getUrl(full).then(done);
  }, callback);
};

EPUBJS.replace.srcs = function (_store, full, done) {
  const isRelative = (full.search('://') === -1);

  if (isRelative) {
    _store.getUrl(full).then(done);
  } else {
    done();
  }
};

// -- Replaces links in head, such as stylesheets - link[href]
EPUBJS.replace.links = function (_store, full, done, link) {
  // -- Handle replacing urls in CSS
  if (link.getAttribute('rel') === 'stylesheet') {
    EPUBJS.replace.stylesheets(_store, full).then((url, full) => {
      // done
      done(url, full);
    }, (reason) => {
      // we were unable to replace the style sheets
      done(null);
    });
  } else {
    _store.getUrl(full).then(done, (reason) => {
      // we were unable to get the url, signal to upper layer
      done(null);
    });
  }
};

EPUBJS.replace.stylesheets = function (_store, full) {
  const deferred = new RSVP.defer();

  if (!_store) return;

  _store.getText(full).then((text) => {
    let url;

		 EPUBJS.replace.cssImports(_store, full, text).then((importText) => {
      text = importText + text;

      EPUBJS.replace.cssUrls(_store, full, text).then((newText) => {
        const _URL = window.URL || window.webkitURL || window.mozURL;

        let blob = new Blob([newText], { type: 'text\/css' }),
          url = _URL.createObjectURL(blob);

        deferred.resolve(url);
      }, (reason) => {
        deferred.reject(reason);
      });
    }, (reason) => {
      deferred.reject(reason);
    });
  }, (reason) => {
    deferred.reject(reason);
  });

  return deferred.promise;
};

EPUBJS.replace.cssImports = function (_store, base, text) {
  const deferred = new RSVP.defer();
  if (!_store) return;

  // check for css @import
  const importRegex = /@import\s+(?:url\()?\'?\"?((?!data:)[^\'|^\"^\)]*)\'?\"?\)?/gi;
  let importMatches,
    importFiles = [],
    allImportText = '';

  while (importMatches = importRegex.exec(text)) {
    importFiles.push(importMatches[1]);
  }

  if (importFiles.length === 0) {
    deferred.resolve(allImportText);
  }

  _.each(importFiles, (fileUrl) => {
    let full = EPUBJS.core.resolveUrl(base, fileUrl);
    full = EPUBJS.core.uri(full).path;
    _store.getText(full).then((importText) => {
      allImportText += importText;
      if (importFiles.indexOf(fileUrl) === importFiles.length - 1) {
        deferred.resolve(allImportText);
      }
    }, (reason) => {
      deferred.reject(reason);
    });
  });

  return deferred.promise;
};


EPUBJS.replace.cssUrls = function (_store, base, text) {
  let deferred = new RSVP.defer(),
    matches = text.match(/url\(\'?\"?((?!data:)[^\'|^\"^\)]*)\'?\"?\)/g);

  if (!_store) return;

  if (!matches) {
    deferred.resolve(text);
    return deferred.promise;
  }

  const promises = _.map(matches, (str) => {
    const full = EPUBJS.core.resolveUrl(base, str.replace(/url\(|[|\)|\'|\"]|\?.*$/g, ''));
    return _store.getUrl(full).then((url) => {
      text = text.replace(str, `url("${url}")`);
    }, (reason) => {
      deferred.reject(reason);
    });
  });

  RSVP.all(promises).then(() => {
    deferred.resolve(text);
  });

  return deferred.promise;
};


EPUBJS.Storage = function (withCredentials) {
  this.checkRequirements();
  this.urlCache = {};
  this.withCredentials = withCredentials;
  this.URL = window.URL || window.webkitURL || window.mozURL;
  this.offline = false;
};

// -- Load the zip lib and set the workerScriptsPath
EPUBJS.Storage.prototype.checkRequirements = function (callback) {
  if (typeof (localforage) === 'undefined') console.error('localForage library not loaded');
};

EPUBJS.Storage.prototype.put = function (assets, store) {
  const deferred = new RSVP.defer();
  const count = assets.length;
  let current = 0;
  var next = function (deferred) {
    const done = deferred || new RSVP.defer();
    let url;
    let encodedUrl;

    if (current >= count) {
      done.resolve();
    } else {
      url = assets[current].url;
      encodedUrl = window.encodeURIComponent(url);

      EPUBJS.core.request(url, 'binary')
        .then(data => localforage.setItem(encodedUrl, data))
        .then((data) => {
          current++;
          // Load up the next
          setTimeout(() => {
            next(done);
          }, 1);
        });
    }
    return done.promise;
  };

  if (!Array.isArray(assets)) {
    assets = [assets];
  }

  next().then(() => {
    deferred.resolve();
  });

  return deferred.promise;
};

EPUBJS.Storage.prototype.token = function (url, value) {
  const encodedUrl = window.encodeURIComponent(url);
  return localforage.setItem(encodedUrl, value)
    .then((result) => {
      if (result === null) {
        return false;
      }
      return true;
    });
};

EPUBJS.Storage.prototype.isStored = function (url) {
  const encodedUrl = window.encodeURIComponent(url);
  return localforage.getItem(encodedUrl)
    .then((result) => {
      if (result === null) {
        return false;
      }
      return true;
    });
};

EPUBJS.Storage.prototype.getText = function (url) {
  const encodedUrl = window.encodeURIComponent(url);

  return EPUBJS.core.request(url, 'arraybuffer', this.withCredentials)
    .then((buffer) => {
      if (this.offline) {
        this.offline = false;
        this.trigger('offline', false);
      }
      localforage.setItem(encodedUrl, buffer);
      return buffer;
    })
    .then((data) => {
      const deferred = new RSVP.defer();
      const mimeType = EPUBJS.core.getMimeType(url);
      const blob = new Blob([data], { type: mimeType });
      const reader = new FileReader();
      reader.addEventListener('loadend', () => {
        deferred.resolve(reader.result);
      });
      reader.readAsText(blob, mimeType);
      return deferred.promise;
    })
    .catch(() => {
      const deferred = new RSVP.defer();
      const entry = localforage.getItem(encodedUrl);

      if (!this.offline) {
        this.offline = true;
        this.trigger('offline', true);
      }

      if (!entry) {
        deferred.reject({
          message: `File not found in the storage: ${url}`,
          stack: new Error().stack,
        });
        return deferred.promise;
      }

      entry.then((data) => {
        const mimeType = EPUBJS.core.getMimeType(url);
        const blob = new Blob([data], { type: mimeType });
        const reader = new FileReader();
        reader.addEventListener('loadend', () => {
          deferred.resolve(reader.result);
        });
        reader.readAsText(blob, mimeType);
      });

      return deferred.promise;
    });
};

EPUBJS.Storage.prototype.getUrl = function (url) {
  const encodedUrl = window.encodeURIComponent(url);

  return EPUBJS.core.request(url, 'arraybuffer', this.withCredentials)
    .then((buffer) => {
      if (this.offline) {
        this.offline = false;
        this.trigger('offline', false);
      }
      localforage.setItem(encodedUrl, buffer);
      return url;
    })
    .catch(() => {
      const deferred = new RSVP.defer();
      let entry;
      const _URL = window.URL || window.webkitURL || window.mozURL;
      let tempUrl;

      if (!this.offline) {
        this.offline = true;
        this.trigger('offline', true);
      }

      if (encodedUrl in this.urlCache) {
        deferred.resolve(this.urlCache[encodedUrl]);
        return deferred.promise;
      }

      entry = localforage.getItem(encodedUrl);

      if (!entry) {
        deferred.reject({
          message: `File not found in the storage: ${url}`,
          stack: new Error().stack,
        });
        return deferred.promise;
      }

      entry.then((data) => {
        const blob = new Blob([data], { type: EPUBJS.core.getMimeType(url) });
        tempUrl = _URL.createObjectURL(blob);
        deferred.resolve(tempUrl);
        this.urlCache[encodedUrl] = tempUrl;
      });


      return deferred.promise;
    });
};

EPUBJS.Storage.prototype.getXml = function (url) {
  const encodedUrl = window.encodeURIComponent(url);

  return EPUBJS.core.request(url, 'arraybuffer', this.withCredentials)
    .then((buffer) => {
      if (this.offline) {
        this.offline = false;
        this.trigger('offline', false);
      }
      localforage.setItem(encodedUrl, buffer);
      return buffer;
    })
    .then((data) => {
      const deferred = new RSVP.defer();
      const mimeType = EPUBJS.core.getMimeType(url);
      const blob = new Blob([data], { type: mimeType });
      const reader = new FileReader();
      reader.addEventListener('loadend', () => {
        const parser = new DOMParser();
        const doc = parser.parseFromString(reader.result, 'text/xml');
        deferred.resolve(doc);
      });
      reader.readAsText(blob, mimeType);
      return deferred.promise;
    })
    .catch(() => {
      const deferred = new RSVP.defer();
      const entry = localforage.getItem(encodedUrl);

      if (!this.offline) {
        this.offline = true;
        this.trigger('offline', true);
      }

      if (!entry) {
        deferred.reject({
          message: `File not found in the storage: ${url}`,
          stack: new Error().stack,
        });
        return deferred.promise;
      }

      entry.then((data) => {
        const mimeType = EPUBJS.core.getMimeType(url);
        const blob = new Blob([data], { type: mimeType });
        const reader = new FileReader();
        reader.addEventListener('loadend', () => {
          const parser = new DOMParser();
          const doc = parser.parseFromString(reader.result, 'text/xml');
          deferred.resolve(doc);
        });
        reader.readAsText(blob, mimeType);
      });

      return deferred.promise;
    });
};

EPUBJS.Storage.prototype.revokeUrl = function (url) {
  const _URL = window.URL || window.webkitURL || window.mozURL;
  const fromCache = this.urlCache[url];
  if (fromCache) _URL.revokeObjectURL(fromCache);
};

EPUBJS.Storage.prototype.failed = function (error) {
  console.error(error);
};

RSVP.EventTarget.mixin(EPUBJS.Storage.prototype);

EPUBJS.Unarchiver = function (url) {
  this.checkRequirements();
  this.urlCache = {};
};

// -- Load the zip lib and set the workerScriptsPath
EPUBJS.Unarchiver.prototype.checkRequirements = function (callback) {
  if (typeof (JSZip) === 'undefined') console.error('JSZip lib not loaded');
};

EPUBJS.Unarchiver.prototype.open = function (zipUrl, callback) {
  if (zipUrl instanceof ArrayBuffer) {
    this.zip = new JSZip(zipUrl);
    const deferred = new RSVP.defer();
    deferred.resolve();
    return deferred.promise;
  }
  return EPUBJS.core.request(zipUrl, 'binary').then((data) => {
    this.zip = new JSZip(data);
  });
};

EPUBJS.Unarchiver.prototype.getXml = function (url, encoding) {
  const decodededUrl = window.decodeURIComponent(url);
  return this.getText(decodededUrl, encoding)
    .then((text) => {
      const parser = new DOMParser();
      const mimeType = EPUBJS.core.getMimeType(url);

      // Remove byte order mark before parsing
      // https://www.w3.org/International/questions/qa-byte-order-mark
      if (text.charCodeAt(0) === 0xFEFF) {
        text = text.slice(1);
      }

      return parser.parseFromString(text, mimeType);
    });
};

EPUBJS.Unarchiver.prototype.getUrl = function (url, mime) {
  const unarchiver = this;
  const deferred = new RSVP.defer();
  const decodededUrl = window.decodeURIComponent(url);
  const entry = this.zip.file(decodededUrl);
  const _URL = window.URL || window.webkitURL || window.mozURL;
  let tempUrl;
  let blob;

  if (!entry) {
    deferred.reject({
      message: `File not found in the epub: ${url}`,
      stack: new Error().stack,
    });
    return deferred.promise;
  }

  if (url in this.urlCache) {
    deferred.resolve(this.urlCache[url]);
    return deferred.promise;
  }

  blob = new Blob([entry.asUint8Array()], { type: EPUBJS.core.getMimeType(entry.name) });

  tempUrl = _URL.createObjectURL(blob);
  deferred.resolve(tempUrl);
  unarchiver.urlCache[url] = tempUrl;

  return deferred.promise;
};

EPUBJS.Unarchiver.prototype.getText = function (url, encoding) {
  const unarchiver = this;
  const deferred = new RSVP.defer();
  const decodededUrl = window.decodeURIComponent(url);
  const entry = this.zip.file(decodededUrl);
  let text;

  if (!entry) {
    deferred.reject({
      message: `File not found in the epub: ${url}`,
      stack: new Error().stack,
    });
    return deferred.promise;
  }

  text = entry.asText();
  deferred.resolve(text);

  return deferred.promise;
};

EPUBJS.Unarchiver.prototype.revokeUrl = function (url) {
  const _URL = window.URL || window.webkitURL || window.mozURL;
  const fromCache = this.urlCache[url];
  if (fromCache) _URL.revokeObjectURL(fromCache);
};

EPUBJS.Unarchiver.prototype.failed = function (error) {
  console.error(error);
};

EPUBJS.Unarchiver.prototype.afterSaved = function (error) {
  this.callback();
};

EPUBJS.Unarchiver.prototype.toStorage = function (entries) {
  let timeout = 0,
    delay = 20,
    that = this,
    count = entries.length;

  function callback() {
    count--;
    if (count === 0) that.afterSaved();
  }

  _.each(entries, (entry) => {
    setTimeout((entry) => {
      that.saveEntryFileToStorage(entry, callback);
    }, timeout, entry);

    timeout += delay;
  });

  console.log('time', timeout);

  // entries.forEach(this.saveEntryFileToStorage.bind(this));
};

// EPUBJS.Unarchiver.prototype.saveEntryFileToStorage = function(entry, callback){
// 	var that = this;
// 	entry.getData(new zip.BlobWriter(), function(blob) {
// 		EPUBJS.storage.save(entry.filename, blob, callback);
// 	});
// };

/*
 From Zip.js, by Gildas Lormeau
 */

(function () {
  const table = {
    application: {
      ecmascript: ['es', 'ecma'],
      javascript: 'js',
      ogg: 'ogx',
      pdf: 'pdf',
      postscript: ['ps', 'ai', 'eps', 'epsi', 'epsf', 'eps2', 'eps3'],
      'rdf+xml': 'rdf',
      smil: ['smi', 'smil'],
      'xhtml+xml': ['xhtml', 'xht'],
      xml: ['xml', 'xsl', 'xsd', 'opf', 'ncx'],
      zip: 'zip',
      'x-httpd-eruby': 'rhtml',
      'x-latex': 'latex',
      'x-maker': ['frm', 'maker', 'frame', 'fm', 'fb', 'book', 'fbdoc'],
      'x-object': 'o',
      'x-shockwave-flash': ['swf', 'swfl'],
      'x-silverlight': 'scr',
      'epub+zip': 'epub',
      'font-tdpfr': 'pfr',
      'inkml+xml': ['ink', 'inkml'],
      json: 'json',
      'jsonml+json': 'jsonml',
      'mathml+xml': 'mathml',
      'metalink+xml': 'metalink',
      mp4: 'mp4s',
      // "oebps-package+xml" : "opf",
      'omdoc+xml': 'omdoc',
      oxps: 'oxps',
      'vnd.amazon.ebook': 'azw',
      widget: 'wgt',
      // "x-dtbncx+xml" : "ncx",
      'x-dtbook+xml': 'dtb',
      'x-dtbresource+xml': 'res',
      'x-font-bdf': 'bdf',
      'x-font-ghostscript': 'gsf',
      'x-font-linux-psf': 'psf',
      'x-font-otf': 'otf',
      'x-font-pcf': 'pcf',
      'x-font-snf': 'snf',
      'x-font-ttf': ['ttf', 'ttc'],
      'x-font-type1': ['pfa', 'pfb', 'pfm', 'afm'],
      'x-font-woff': 'woff',
      'x-mobipocket-ebook': ['prc', 'mobi'],
      'x-mspublisher': 'pub',
      'x-nzb': 'nzb',
      'x-tgif': 'obj',
      'xaml+xml': 'xaml',
      'xml-dtd': 'dtd',
      'xproc+xml': 'xpl',
      'xslt+xml': 'xslt',
      'internet-property-stream': 'acx',
      'x-compress': 'z',
      'x-compressed': 'tgz',
      'x-gzip': 'gz',
    },
    audio: {
      flac: 'flac',
      midi: ['mid', 'midi', 'kar', 'rmi'],
      mpeg: ['mpga', 'mpega', 'mp2', 'mp3', 'm4a', 'mp2a', 'm2a', 'm3a'],
      mpegurl: 'm3u',
      ogg: ['oga', 'ogg', 'spx'],
      'x-aiff': ['aif', 'aiff', 'aifc'],
      'x-ms-wma': 'wma',
      'x-wav': 'wav',
      adpcm: 'adp',
      mp4: 'mp4a',
      webm: 'weba',
      'x-aac': 'aac',
      'x-caf': 'caf',
      'x-matroska': 'mka',
      'x-pn-realaudio-plugin': 'rmp',
      xm: 'xm',
      mid: ['mid', 'rmi'],
    },
    image: {
      gif: 'gif',
      ief: 'ief',
      jpeg: ['jpeg', 'jpg', 'jpe'],
      pcx: 'pcx',
      png: 'png',
      'svg+xml': ['svg', 'svgz'],
      tiff: ['tiff', 'tif'],
      'x-icon': 'ico',
      bmp: 'bmp',
      webp: 'webp',
      'x-pict': ['pic', 'pct'],
      'x-tga': 'tga',
      'cis-cod': 'cod',
    },
    message: {
      rfc822: ['eml', 'mime', 'mht', 'mhtml', 'nws'],
    },
    text: {
      'cache-manifest': ['manifest', 'appcache'],
      calendar: ['ics', 'icz', 'ifb'],
      css: 'css',
      csv: 'csv',
      h323: '323',
      html: ['html', 'htm', 'shtml', 'stm'],
      iuls: 'uls',
      mathml: 'mml',
      plain: ['txt', 'text', 'brf', 'conf', 'def', 'list', 'log', 'in', 'bas'],
      richtext: 'rtx',
      'tab-separated-values': 'tsv',
      'x-bibtex': 'bib',
      'x-dsrc': 'd',
      'x-diff': ['diff', 'patch'],
      'x-haskell': 'hs',
      'x-java': 'java',
      'x-literate-haskell': 'lhs',
      'x-moc': 'moc',
      'x-pascal': ['p', 'pas'],
      'x-pcs-gcd': 'gcd',
      'x-perl': ['pl', 'pm'],
      'x-python': 'py',
      'x-scala': 'scala',
      'x-setext': 'etx',
      'x-tcl': ['tcl', 'tk'],
      'x-tex': ['tex', 'ltx', 'sty', 'cls'],
      'x-vcard': 'vcf',
      sgml: ['sgml', 'sgm'],
      'x-c': ['c', 'cc', 'cxx', 'cpp', 'h', 'hh', 'dic'],
      'x-fortran': ['f', 'for', 'f77', 'f90'],
      'x-opml': 'opml',
      'x-nfo': 'nfo',
      'x-sfv': 'sfv',
      'x-uuencode': 'uu',
      webviewhtml: 'htt',
    },
    video: {
      mpeg: ['mpeg', 'mpg', 'mpe', 'm1v', 'm2v', 'mp2', 'mpa', 'mpv2'],
      mp4: ['mp4', 'mp4v', 'mpg4'],
      quicktime: ['qt', 'mov'],
      ogg: 'ogv',
      'vnd.mpegurl': ['mxu', 'm4u'],
      'x-flv': 'flv',
      'x-la-asf': ['lsf', 'lsx'],
      'x-mng': 'mng',
      'x-ms-asf': ['asf', 'asx', 'asr'],
      'x-ms-wm': 'wm',
      'x-ms-wmv': 'wmv',
      'x-ms-wmx': 'wmx',
      'x-ms-wvx': 'wvx',
      'x-msvideo': 'avi',
      'x-sgi-movie': 'movie',
      'x-matroska': ['mpv', 'mkv', 'mk3d', 'mks'],
      '3gpp2': '3g2',
      h261: 'h261',
      h263: 'h263',
      h264: 'h264',
      jpeg: 'jpgv',
      jpm: ['jpm', 'jpgm'],
      mj2: ['mj2', 'mjp2'],
      'vnd.ms-playready.media.pyv': 'pyv',
      'vnd.uvvu.mp4': ['uvu', 'uvvu'],
      'vnd.vivo': 'viv',
      webm: 'webm',
      'x-f4v': 'f4v',
      'x-m4v': 'm4v',
      'x-ms-vob': 'vob',
      'x-smv': 'smv',
    },
  };

  const mimeTypes = (function () {
    let type,
      subtype,
      val,
      index,
      mimeTypes = {};
    for (type in table) {
      if (table.hasOwnProperty(type)) {
        for (subtype in table[type]) {
          if (table[type].hasOwnProperty(subtype)) {
            val = table[type][subtype];
            if (typeof val === 'string') {
              mimeTypes[val] = `${type}/${subtype}`;
            } else {
              for (index = 0; index < val.length; index++) {
                mimeTypes[val[index]] = `${type}/${subtype}`;
              }
            }
          }
        }
      }
    }
    return mimeTypes;
  }());

  EPUBJS.core.getMimeType = function (filename) {
    const defaultValue = 'text/plain';// "application/octet-stream";
    return filename && mimeTypes[filename.split('.').pop().toLowerCase()] || defaultValue;
  };
}());

// # sourceMappingURL=epub.js.map
