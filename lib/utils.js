var axios = require('axios');
var querystring = require('querystring');

module.exports = {
  modem: async function (options, callback) {
    let {client, command, method} = options;
    let parsed_body = {};

    // Remove empty paramaters from body. Sometimes empty domain property causes some issues.
    let requestBody = {};
    Object.keys(options.body).forEach((item) => {
      if(options.body[item] && options.body[item] !== '')
        requestBody[item] = options.body[item]
    });

    options.json = options.json || client.config.forceJsonRequests;
    if (!requestBody.responsetype)
      requestBody.responsetype = (options.json ? 'application/json':'text/plain');

    var serverOptions = {
      url: client.config.serverUrl + ':' + client.config.port + command,
      method: method,
      headers: {},
      auth: {
        username: client.config.username,
        password: client.config.password
      }
    };



    if(method == 'GET')
      serverOptions.url += '?' + querystring.stringify({...requestBody, json: options.json ? 'yes':'no'});
    else if(method == 'POST'){
      serverOptions.url += '?json=' + (options.json ? 'yes':'no');
      serverOptions.body = requestBody;
    }

    if (client.config.userAgent)
      serverOptions.headers['User-Agent'] = client.config.userAgent;

    function send(statusCode, data, callback) {
      if (command == '/CMD_API_POP' && requestBody.action == 'full_list') {
        if (data)
          parsed_body = JSON.parse('{"' + decodeURI(data).replace(/"/g, '\\"').replace(/&/g, '","').replace(/=/g, '":"') + '"}');
        if (parsed_body.error == 1) {
          return callback(parsed_body);
        }
        else {
          return callback(null, parsed_body);
        }
      } else {
        if (data)
          module.exports.parse_str(data, parsed_body);

        /* if (Object.keys(parsed_body).length === 0) {
          return callback(new Error('DIRECTADMIN Error (' + statusCode + '): ' + JSON.stringify(parsed_body)));
        }
        else  */
        if (parsed_body.error == 1) {
          return callback(parsed_body);
        }
        else {
          return callback(null, parsed_body);
        }
      }
    }

    let res = await axios(serverOptions);
    if(res.headers['content-type'].includes('json')){
      if(callback) callback(null, res.data);
      return res.data;
    } else {
      send(res.status.toString(), res.data, (err, data) => {
        if(callback)
          callback(err, data)
        else{
          if(err) throw err;
          return data;
        }
      });
    }
  },
  parse_str: function (str, array) {
    //       discuss at: https://locutus.io/php/parse_str/
    var strArr = String(str).replace(/^&/, '').replace(/&$/, '').split('&')
    var sal = strArr.length
    var i
    var j
    var ct
    var p
    var lastObj
    var obj
    var chr
    var tmp
    var key
    var value
    var postLeftBracketPos
    var keys
    var keysLen

    var _fixStr = function (str) {
      return decodeURIComponent(str.replace(/\+/g, '%20'))
    }

    var $global = (typeof window !== 'undefined' ? window : global)
    $global.$locutus = $global.$locutus || {}
    var $locutus = $global.$locutus
    $locutus.php = $locutus.php || {}

    if (!array) {
      array = $global
    }

    for (i = 0; i < sal; i++) {
      tmp = strArr[i].split('=')
      key = _fixStr(tmp[0])
      value = (tmp.length < 2) ? '' : _fixStr(tmp[1])

      while (key.charAt(0) === ' ') {
        key = key.slice(1)
      }

      if (key.indexOf('\x00') > -1) {
        key = key.slice(0, key.indexOf('\x00'))
      }

      if (key && key.charAt(0) !== '[') {
        keys = []
        postLeftBracketPos = 0

        for (j = 0; j < key.length; j++) {
          if (key.charAt(j) === '[' && !postLeftBracketPos) {
            postLeftBracketPos = j + 1
          } else if (key.charAt(j) === ']') {
            if (postLeftBracketPos) {
              if (!keys.length) {
                keys.push(key.slice(0, postLeftBracketPos - 1))
              }

              keys.push(key.substr(postLeftBracketPos, j - postLeftBracketPos))
              postLeftBracketPos = 0

              if (key.charAt(j + 1) !== '[') {
                break
              }
            }
          }
        }

        if (!keys.length) {
          keys = [key]
        }

        for (j = 0; j < keys[0].length; j++) {
          chr = keys[0].charAt(j)

          if (chr === ' ' || chr === '.' || chr === '[') {
            keys[0] = keys[0].substr(0, j) + '_' + keys[0].substr(j + 1)
          }

          if (chr === '[') {
            break
          }
        }

        obj = array

        for (j = 0, keysLen = keys.length; j < keysLen; j++) {
          key = keys[j].replace(/^['"]/, '').replace(/['"]$/, '')
          lastObj = obj

          if ((key === '' || key === ' ') && j !== 0) {
            // Insert new dimension
            ct = -1

            for (p in obj) {
              if (obj.hasOwnProperty(p)) {
                if (+p > ct && p.match(/^\d+$/g)) {
                  ct = +p
                }
              }
            }

            key = ct + 1
          }

          // if primitive value, replace with object
          if (Object(obj[key]) !== obj[key]) {
            obj[key] = {}
          }

          obj = obj[key]
        }

        lastObj[key] = value
      }
    }
  },
	/**
	 * Extend properties of one object with one or more Objects
	 * Copied from Underscore - http://underscorejs.org/
	 * @param obj Object
	 * @returns Object
	 */
  extend: function (obj) {
    if (typeof obj !== 'object') return obj;
    var source, prop;
    for (var i = 1, length = arguments.length; i < length; i++) {
      source = arguments[i];
      for (prop in source) {
        if (hasOwnProperty.call(source, prop)) {
          obj[prop] = source[prop];
        }
      }
    }
    return obj;
  },
  generatePassword: function () {
    var length = 12,
      charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$()",
      retVal = "";
    for (var i = 0, n = charset.length; i < length; ++i) {
      retVal += charset.charAt(Math.floor(Math.random() * n));
    }
    return retVal;
  }
};
