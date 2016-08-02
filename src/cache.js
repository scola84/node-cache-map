export default class MapCache {
  constructor() {
    this._expire = new Map();
    this._values = new Map();

    this._lifetime = 0;
    this._interval = null;
  }

  destroy() {
    this.interval(null, false);
    this._expiries = new Map();
    this._values.clear();
  }

  lifetime(lifetime) {
    this._lifetime = lifetime;
    return this;
  }

  interval(interval, action) {
    clearInterval(this._interval);

    if (action === false) {
      return this;
    }

    this._interval = setInterval(this._gc.bind(this), interval);
    return this;
  }

  get(key, callback = () => {}) {
    callback(null, this._values.get(key));
  }

  set(key, value, lifetime, callback = () => {}) {
    if (typeof lifetime === 'function') {
      callback = lifetime;
      lifetime = null;
    }

    const expires = this._expires(lifetime);

    if (expires !== null) {
      this._expire.set(key, expires);
    }

    this._values.set(key, value);
    callback();
  }

  delete(key, callback = () => {}) {
    this._expire.delete(key);
    this._values.delete(key);

    callback();
  }

  touch(key, lifetime, callback = () => {}) {
    if (typeof lifetime === 'function') {
      callback = lifetime;
      lifetime = null;
    }

    if (!this._expire.has(key)) {
      return;
    }

    this._expire.set(key, this._expires(lifetime));
    callback();
  }

  _expires(lifetime) {
    if (lifetime === null) {
      lifetime = this._lifetime;
    }

    if (lifetime === 0) {
      return null;
    }

    return Date.now() + lifetime;
  }

  _gc() {
    const now = Date.now();

    this._expire.forEach((expires, key) => {
      if (expires < now) {
        this._expire.delete(key);
        this._values.delete(key);
      }
    });
  }
}
