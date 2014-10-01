/*global window*/
function Story (ns) {
  var delimiter = '.';

  var ls = window.localStorage;

  var defaults = false;

  var namespace = ns || 'story';

  var events = [];

  var _escapeRexp = function (key) {
    return key.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
  };

  var _enc = function (value) {
    var type = typeof value;
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
    }

    return value;
  };

  var _makeMap = function (obj) {
    var map = [];
    for (var i in obj) {
      if (obj.hasOwnProperty(i)) {
        if (typeof obj[i] === 'object') {
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

    for (var i in ls) {
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
    if (typeof value === 'object') {
      this.delete(key);
      map = _makeMap(value);
      map.forEach(function (mapItem) {
        ls.setItem(key + delimiter + mapItem.key, _enc(mapItem.value));
      });
    } else {
      ls.setItem(key, _enc(value));
      map = _getMap(key);
      map.map(ls.removeItem.bind(ls));
    }
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

    var existing = ls.getItem(key) && _dec(ls.getItem(key));
    if (existing === null) {
      existing = defaults[key];
    }
    if (map.length === 0 && existing !== null) {
      return existing;
    }

    map.forEach(function (mapKey) {
      var existing = ls.getItem(mapKey) && _dec(ls.getItem(mapKey));
      if (existing === null) {
        existing = defaults[mapKey];
      }
      _nest(out, mapKey, existing);
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

    map.forEach(ls.removeItem.bind(ls));
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

  this.on = function (key, callback) {
    events.push({
      key: key,
      callback: callback
    });
  };

  var _handleChange = function (ev) {
    console.log(ev);
  };

  return this;
}
