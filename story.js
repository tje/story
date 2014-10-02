/*global window*/
function Story (ns) {
  var delimiter = '.';

  var ls = window.localStorage;

  var defaults = false;

  var _escapeRexp = function (key) {
    return key && key.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&') || '';
  };

  var namespace = ns || 'story';

  var useCookies = false;

  var YEAR = 365 * 24 * 60 * 60 * 1000;

  var _enc = function (value) {
    var type = typeof value;

    if (type === 'object' && value instanceof Date) {
      type = 'date';
    }

    var pre = 'S';

    switch (type) {
      case 'boolean':
        pre = 'B';
      break;
      case 'number':
        pre = value.toString().indexOf('.') === -1 ? 'N' : 'F';
      break;
      case 'array':
        pre = 'A';
        value = JSON.stringify(value);
      break;
      case 'date':
        pre = 'D';
        value = value.toISOString();
      case 'string':
      default:
      break;
    }

    return pre + '|' + value;
  };

  var _dec = function (value) {
    var type = value[0];
    value = value.substr(2);

    switch (type) {
      case 'N':
        value = parseInt(value, 10);
      break;
      case 'F':
        value = parseFloat(value);
      break;
      case 'B':
        value = value === 'true';
      break;
      case 'A':
        value = JSON.parse(value);
      break;
      case 'D':
        value = new Date(value);
      break;
    }

    return value;
  };

  var _makeMap = function (obj) {
    var map = [];
    for (var i in obj) {
      if (obj.hasOwnProperty(i)) {
        if (typeof obj[i] === 'object' && !(obj[i] instanceof Date)) {
          var subMap = _makeMap(obj[i]);
          subMap.forEach(function (mapItem) {
            mapItem.key = i + delimiter + mapItem.key;
            map.push(mapItem);
          });
        } else {
          map.push({
            key: i,
            value: obj[i]
          });
        }
      }
    }
    return map;
  };

  var _getMap = function (key) {
    var out = [];
    var pattern = new RegExp('^' + _escapeRexp(key + delimiter));

    for (var i in _list()) {
      if (!key || i.match(pattern)) {
        out.push(i);
      }
    }

    if (defaults) {
      for (var i in defaults) {
        if (out.indexOf(i) === -1 && (!key || i.match(pattern))) {
          out.push(i);
        }
      }
    }

    return out;
  };

  this.set = function (key, value) {
    var map;

    if (typeof key === 'object' && !value) {
      value = key;
      key = false;
    }

    if (typeof value === 'object' && !(value instanceof Date)) {
      if (key) {
        this.delete(key);
      }
      map = _makeMap(value);
      map.forEach(function (mapItem) {
        _set((key && key + delimiter || '') + mapItem.key, _enc(mapItem.value));
      });
    } else {
      _set(key, _enc(value));
      map = _getMap(key);
      map.map(_remove.bind(ls));
    }
    _updateCookie.call(this);
  };

  var _nest = function (obj, key, value) {
    var joint = key.indexOf(delimiter);
    if (joint === -1) {
      obj[key] = value;
      return obj;
    }

    var nestKey = key.substr(0, joint);
    var nest = obj[nestKey];
    if (!nest) {
      nest = {};
    }

    obj[nestKey] = _nest(nest, key.substr(joint + 1), value);

    return obj;
  };

  this.get = function (key) {
    var map = _getMap(key);
    var out = {};

    var existing = _get(key);
    if (typeof existing === 'string') {
      existing = _dec(_get(key));
    } else {
      existing = defaults[key];
    }

    if (key && map.length === 0 && existing !== null) {
      return existing;
    }

    map.forEach(function (mapKey) {
      _nest(out, mapKey, _get(mapKey) && _dec(_get(mapKey)) || defaults[mapKey]);
    });

    if (key) {
      key.split(delimiter).forEach(function (keyDown) {
        out = out && out[keyDown];
      });
    }

    return out;
  };

  this.delete = function (key) {
    var map = _getMap(key);

    map.push(key);
    map.forEach(_remove.bind(this));
    _updateCookie.call(this);
  };

  this.clear = function () {
    this.delete();
  };

  this.defaults = function (obj) {
    defaults = {};
    _makeMap(obj).forEach(function (mapItem) {
      defaults[mapItem.key] = mapItem.value;
    });
  };

  var _set = function (key, value) {
    return ls.setItem(namespace + delimiter + key, value);
  };

  var _get = function (key) {
    return ls.getItem(namespace + delimiter + key);
  };

  var _remove = function (key) {
    return ls.removeItem(namespace + delimiter + key);
  };

  var _list = function () {
    var o = {};
    var pattern = new RegExp('^' + _escapeRexp(namespace + delimiter));
    for (var i in ls) {
      if (ls.hasOwnProperty(i) && i.match(pattern)) {
        o[i.replace(pattern, '')] = ls[i];
      }
    }
    return o;
  };

  var _updateCookie = function () {
    if (useCookies && document) {
      var expiryDate = new Date();
      expiryDate.setTime(expiryDate.getTime() + YEAR);

      var store = btoa(unescape(encodeURIComponent(JSON.stringify(this.get()))));

      var cookieStr = namespace + '=' + store
                    + '; expires=' + expiryDate.toUTCString()
                    + '; path=/';

      if (cookieStr.length > 4000) {
        _warn('Unstable cookie fallback (' + cookieStr.length + ' characters long)');
      }

      document.cookie = cookieStr;
    }
  };

  this._restoreFromCookie = function () {
    if (useCookies && document) {
      var cookies = document.cookie.split('; '),
          cookie = false;

      for (var i = 0; i < cookies.length; i++) {
        if (cookies[i].substr(0, namespace.length + 1) === namespace + '=') {
          cookie = cookies[i].substr(namespace.length + 1);
          break;
        }
      }

      if (cookie) {
        cookie = JSON.parse(decodeURIComponent(escape(atob(cookie))));
        this.set(cookie);
      }
    }
  };

  this.config = function (options) {
    if (options.hasOwnProperty('useCookies')) {
      useCookies = !!options['useCookies'];
      if (useCookies) {
        this._restoreFromCookie();
      }
    }

    if (options.hasOwnProperty('defaults')) {
      this.defaults(options.defaults);
    }

    return this;
  };

  var _warn = function (msg) {
    return console.warn('Story: ' + msg);
  };

  return this;
}
