/*! Respond.js v1.4.2: min/max-width media query polyfill
 * Copyright 2014 Scott Jehl
 * Licensed under MIT
 * http://j.mp/respondjs */

/*! matchMedia() polyfill - Test a CSS media type/query in JS. Authors & copyright (c) 2012: Scott Jehl, Paul Irish, Nicholas Zakas. Dual MIT/BSD license */
/*! NOTE: If you're already including a window.matchMedia polyfill via Modernizr or otherwise, you don't need this part */

/*! MediaMatch v.2.0.3 - Testing css media queries in Javascript. Authors & copyright (c) 2013: WebLinc, David Knight. */



(function(w) {
  "use strict";
  var respond = {};
  w.respond = respond;
  respond.update = function() {};
  var requestQueue = [], xmlHttp = function() {
    var xmlhttpmethod = false;
    try {
      xmlhttpmethod = new w.XMLHttpRequest();
    } catch (e) {
      xmlhttpmethod = new w.ActiveXObject("Microsoft.XMLHTTP");
    }
    return function() {
      return xmlhttpmethod;
    };
  }(), ajax = function(url, callback) {
    var req = xmlHttp();
    if (!req) {
      return;
    }
    req.open("GET", url, true);
    req.onreadystatechange = function() {
      if (req.readyState !== 4 || req.status !== 200 && req.status !== 304) {
        return;
      }
      callback(req.responseText);
    };
    if (req.readyState === 4) {
      return;
    }
    req.send(null);
  }, isUnsupportedMediaQuery = function(query) {
    return query.replace(respond.regex.minmaxwh, "").match(respond.regex.other);
  };
  respond.ajax = ajax;
  respond.queue = requestQueue;
  respond.unsupportedmq = isUnsupportedMediaQuery;
  respond.regex = {
    media: /@media[^\{]+\{([^\{\}]*\{[^\}\{]*\})+/gi,
    keyframes: /@(?:\-(?:o|moz|webkit)\-)?keyframes[^\{]+\{(?:[^\{\}]*\{[^\}\{]*\})+[^\}]*\}/gi,
    comments: /\/\*[^*]*\*+([^/][^*]*\*+)*\//gi,
    urls: /(url\()['"]?([^\/\)'"][^:\)'"]+)['"]?(\))/g,
    findStyles: /@media *([^\{]+)\{([\S\s]+?)$/,
    only: /(only\s+)?([a-zA-Z]+)\s?/,
    minw: /\(\s*min\-width\s*:\s*(\s*[0-9\.]+)(px|em)\s*\)/,
    maxw: /\(\s*max\-width\s*:\s*(\s*[0-9\.]+)(px|em)\s*\)/,
    minmaxwh: /\(\s*m(in|ax)\-(height|width)\s*:\s*(\s*[0-9\.]+)(px|em)\s*\)/gi,
    other: /\([^\)]*\)/g
  };
  respond.mediaQueriesSupported = w.matchMedia && w.matchMedia("only all") !== null && w.matchMedia("only all").matches;
  if (respond.mediaQueriesSupported) {
    return;
  }
  var doc = w.document, docElem = doc.documentElement, mediastyles = [], rules = [], appendedEls = [], parsedSheets = {}, resizeThrottle = 900, head = doc.getElementsByTagName("head")[0] || docElem, base = doc.getElementsByTagName("base")[0], links = head.getElementsByTagName("link"), lastCall, resizeDefer, eminpx, getEmValue = function() {
    var ret, div = doc.createElement("div"), body = doc.body, originalHTMLFontSize = docElem.style.fontSize, originalBodyFontSize = body && body.style.fontSize, fakeUsed = false;
    div.style.cssText = "position:absolute;font-size:1em;width:1em";
    if (!body) {
      body = fakeUsed = doc.createElement("body");
      body.style.background = "none";
    }
    docElem.style.fontSize = "100%";
    body.style.fontSize = "100%";
    body.appendChild(div);
    if (fakeUsed) {
      docElem.insertBefore(body, docElem.firstChild);
    }
    ret = div.offsetWidth;
    if (fakeUsed) {
      docElem.removeChild(body);
    } else {
      body.removeChild(div);
    }
    docElem.style.fontSize = originalHTMLFontSize;
    if (originalBodyFontSize) {
      body.style.fontSize = originalBodyFontSize;
    }
    ret = eminpx = parseFloat(ret);
    return ret;
  }, applyMedia = function(fromResize) {
    var name = "clientWidth", docElemProp = docElem[name], currWidth = doc.compatMode === "CSS1Compat" && docElemProp || doc.body[name] || docElemProp, styleBlocks = {}, lastLink = links[links.length - 1], now = new Date().getTime();
    if (fromResize && lastCall && now - lastCall < resizeThrottle) {
      w.clearTimeout(resizeDefer);
      resizeDefer = w.setTimeout(applyMedia, resizeThrottle);
      return;
    } else {
      lastCall = now;
    }
    for (var i in mediastyles) {
      if (mediastyles.hasOwnProperty(i)) {
        var thisstyle = mediastyles[i], min = thisstyle.minw, max = thisstyle.maxw, minnull = min === null, maxnull = max === null, em = "em";
        if (!!min) {
          min = parseFloat(min) * (min.indexOf(em) > -1 ? eminpx || getEmValue() : 1);
        }
        if (!!max) {
          max = parseFloat(max) * (max.indexOf(em) > -1 ? eminpx || getEmValue() : 1);
        }
        if (!thisstyle.hasquery || (!minnull || !maxnull) && (minnull || currWidth >= min) && (maxnull || currWidth <= max)) {
          if (!styleBlocks[thisstyle.media]) {
            styleBlocks[thisstyle.media] = [];
          }
          styleBlocks[thisstyle.media].push(rules[thisstyle.rules]);
        }
      }
    }
    for (var j in appendedEls) {
      if (appendedEls.hasOwnProperty(j)) {
        if (appendedEls[j] && appendedEls[j].parentNode === head) {
          head.removeChild(appendedEls[j]);
        }
      }
    }
    appendedEls.length = 0;
    for (var k in styleBlocks) {
      if (styleBlocks.hasOwnProperty(k)) {
        var ss = doc.createElement("style"), css = styleBlocks[k].join("\n");
        ss.type = "text/css";
        ss.media = k;
        head.insertBefore(ss, lastLink.nextSibling);
        if (ss.styleSheet) {
          ss.styleSheet.cssText = css;
        } else {
          ss.appendChild(doc.createTextNode(css));
        }
        appendedEls.push(ss);
      }
    }
  }, translate = function(styles, href, media) {
    var qs = styles.replace(respond.regex.comments, "").replace(respond.regex.keyframes, "").match(respond.regex.media), ql = qs && qs.length || 0;
    href = href.substring(0, href.lastIndexOf("/"));
    var repUrls = function(css) {
      return css.replace(respond.regex.urls, "$1" + href + "$2$3");
    }, useMedia = !ql && media;
    if (href.length) {
      href += "/";
    }
    if (useMedia) {
      ql = 1;
    }
    for (var i = 0; i < ql; i++) {
      var fullq, thisq, eachq, eql;
      if (useMedia) {
        fullq = media;
        rules.push(repUrls(styles));
      } else {
        fullq = qs[i].match(respond.regex.findStyles) && RegExp.$1;
        rules.push(RegExp.$2 && repUrls(RegExp.$2));
      }
      eachq = fullq.split(",");
      eql = eachq.length;
      for (var j = 0; j < eql; j++) {
        thisq = eachq[j];
        if (isUnsupportedMediaQuery(thisq)) {
          continue;
        }
        mediastyles.push({
          media: thisq.split("(")[0].match(respond.regex.only) && RegExp.$2 || "all",
          rules: rules.length - 1,
          hasquery: thisq.indexOf("(") > -1,
          minw: thisq.match(respond.regex.minw) && parseFloat(RegExp.$1) + (RegExp.$2 || ""),
          maxw: thisq.match(respond.regex.maxw) && parseFloat(RegExp.$1) + (RegExp.$2 || "")
        });
      }
    }
    applyMedia();
  }, makeRequests = function() {
    if (requestQueue.length) {
      var thisRequest = requestQueue.shift();
      ajax(thisRequest.href, function(styles) {
        translate(styles, thisRequest.href, thisRequest.media);
        parsedSheets[thisRequest.href] = true;
        w.setTimeout(function() {
          makeRequests();
        }, 0);
      });
    }
  }, ripCSS = function() {
    for (var i = 0; i < links.length; i++) {
      var sheet = links[i], href = sheet.href, media = sheet.media, isCSS = sheet.rel && sheet.rel.toLowerCase() === "stylesheet";
      if (!!href && isCSS && !parsedSheets[href]) {
        if (sheet.styleSheet && sheet.styleSheet.rawCssText) {
          translate(sheet.styleSheet.rawCssText, href, media);
          parsedSheets[href] = true;
        } else {
          if (!/^([a-zA-Z:]*\/\/)/.test(href) && !base || href.replace(RegExp.$1, "").split("/")[0] === w.location.host) {
            if (href.substring(0, 2) === "//") {
              href = w.location.protocol + href;
            }
            requestQueue.push({
              href: href,
              media: media
            });
          }
        }
      }
    }
    makeRequests();
  };
  ripCSS();
  respond.update = ripCSS;
  respond.getEmValue = getEmValue;
  function callMedia() {
    applyMedia(true);
  }
  if (w.addEventListener) {
    w.addEventListener("resize", callMedia, false);
  } else if (w.attachEvent) {
    w.attachEvent("onresize", callMedia);
  }
})(this);


window.matchMedia || (window.matchMedia = function (win) {
  'use strict';

  // Internal globals
  var _doc        = win.document,
      _viewport   = _doc.documentElement,
      _queries    = [],
      _queryID    = 0,
      _type       = '',
      _features   = {},
                  // only screen
                  // only screen and
                  // not screen
                  // not screen and
                  // screen
                  // screen and
      _typeExpr   = /\s*(only|not)?\s*(screen|print|[a-z\-]+)\s*(and)?\s*/i,
                  // (-vendor-min-width: 300px)
                  // (min-width: 300px)
                  // (width: 300px)
                  // (width)
                  // (orientation: portrait|landscape)
      _mediaExpr  = /^\s*\(\s*(-[a-z]+-)?(min-|max-)?([a-z\-]+)\s*(:?\s*([0-9]+(\.[0-9]+)?|portrait|landscape)(px|em|dppx|dpcm|rem|%|in|cm|mm|ex|pt|pc|\/([0-9]+(\.[0-9]+)?))?)?\s*\)\s*$/,
      _timer      = 0,

      // Helper methods

      /*
          _matches
       */
      _matches = function (media) {
          // screen and (min-width: 400px), screen and (max-width: 500px)
          var mql         = (media.indexOf(',') !== -1 && media.split(',')) || [media],
              mqIndex     = mql.length - 1,
              mqLength    = mqIndex,
              mq          = null,

              // not screen, screen
              negateType      = null,
              negateTypeFound = '',
              negateTypeIndex = 0,
              negate          = false,
              type            = '',

              // (min-width: 400px), (min-width)
              exprListStr = '',
              exprList    = null,
              exprIndex   = 0,
              exprLength  = 0,
              expr        = null,

              prefix      = '',
              length      = '',
              unit        = '',
              value       = '',
              feature     = '',

              match       = false;

          if (media === '') {
              return true;
          }

          do {
              mq          = mql[mqLength - mqIndex];
              negate      = false;
              negateType  = mq.match(_typeExpr);

              if (negateType) {
                  negateTypeFound = negateType[0];
                  negateTypeIndex = negateType.index;
              }

              if (!negateType || ((mq.substring(0, negateTypeIndex).indexOf('(') === -1) && (negateTypeIndex || (!negateType[3] && negateTypeFound !== negateType.input)))) {
                  match = false;
                  continue;
              }

              exprListStr = mq;

              negate = negateType[1] === 'not';

              if (!negateTypeIndex) {
                  type        =  negateType[2];
                  exprListStr = mq.substring(negateTypeFound.length);
              }

              // Test media type
              // Test type against this device or if 'all' or empty ''
              match       = type === _type || type === 'all' || type === '';

              exprList    = (exprListStr.indexOf(' and ') !== -1 && exprListStr.split(' and ')) || [exprListStr];
              exprIndex   = exprList.length - 1;
              exprLength  = exprIndex;

              if (match && exprIndex >= 0 && exprListStr !== '') {
                  do {
                      expr = exprList[exprIndex].match(_mediaExpr);

                      if (!expr || !_features[expr[3]]) {
                          match = false;
                          break;
                      }

                      prefix  = expr[2];
                      length  = expr[5];
                      value   = length;
                      unit    = expr[7];
                      feature = _features[expr[3]];

                      // Convert unit types
                      if (unit) {
                          if (unit === 'px') {
                              // If unit is px
                              value = Number(length);
                          } else if (unit === 'em' || unit === 'rem') {
                              // Convert relative length unit to pixels
                              // Assumed base font size is 16px
                              value = 16 * length;
                          } else if (expr[8]) {
                              // Convert aspect ratio to decimal
                              value = (length / expr[8]).toFixed(2);
                          } else if (unit === 'dppx') {
                              // Convert resolution dppx unit to pixels
                              value = length * 96;
                          } else if (unit === 'dpcm') {
                              // Convert resolution dpcm unit to pixels
                              value = length * 0.3937;
                          } else {
                              // default
                              value = Number(length);
                          }
                      }

                      // Test for prefix min or max
                      // Test value against feature
                      if (prefix === 'min-' && value) {
                          match = feature >= value;
                      } else if (prefix === 'max-' && value) {
                          match = feature <= value;
                      } else if (value) {
                          match = feature === value;
                      } else {
                          match = !!feature;
                      }

                      // If 'match' is false, break loop
                      // Continue main loop through query list
                      if (!match) {
                          break;
                      }
                  } while (exprIndex--);
              }

              // If match is true, break loop
              // Once matched, no need to check other queries
              if (match) {
                  break;
              }
          } while (mqIndex--);

          return negate ? !match : match;
      },

      /*
          _setFeature
       */
      _setFeature = function () {
          // Sets properties of '_features' that change on resize and/or orientation.
          var w   = win.innerWidth || _viewport.clientWidth,
              h   = win.innerHeight || _viewport.clientHeight,
              dw  = win.screen.width,
              dh  = win.screen.height,
              c   = win.screen.colorDepth,
              x   = win.devicePixelRatio;

          _features.width                     = w;
          _features.height                    = h;
          _features['aspect-ratio']           = (w / h).toFixed(2);
          _features['device-width']           = dw;
          _features['device-height']          = dh;
          _features['device-aspect-ratio']    = (dw / dh).toFixed(2);
          _features.color                     = c;
          _features['color-index']            = Math.pow(2, c);
          _features.orientation               = (h >= w ? 'portrait' : 'landscape');
          _features.resolution                = (x && x * 96) || win.screen.deviceXDPI || 96;
          _features['device-pixel-ratio']     = x || 1;
      },

      /*
          _watch
       */
      _watch = function () {
          clearTimeout(_timer);

          _timer = setTimeout(function () {
              var query   = null,
                  qIndex  = _queryID - 1,
                  qLength = qIndex,
                  match   = false;

              if (qIndex >= 0) {
                  _setFeature();

                  do {
                      query = _queries[qLength - qIndex];

                      if (query) {
                          match = _matches(query.mql.media);

                          if ((match && !query.mql.matches) || (!match && query.mql.matches)) {
                              query.mql.matches = match;

                              if (query.listeners) {
                                  for (var i = 0, il = query.listeners.length; i < il; i++) {
                                      if (query.listeners[i]) {
                                          query.listeners[i].call(win, query.mql);
                                      }
                                  }
                              }
                          }
                      }
                  } while(qIndex--);
              }


          }, 10);
      },

      /*
          _init
       */
      _init = function () {
          var head        = _doc.getElementsByTagName('head')[0],
              style       = _doc.createElement('style'),
              info        = null,
              typeList    = ['screen', 'print', 'speech', 'projection', 'handheld', 'tv', 'braille', 'embossed', 'tty'],
              typeIndex   = 0,
              typeLength  = typeList.length,
              cssText     = '#mediamatchjs { position: relative; z-index: 0; }',
              eventPrefix = '',
              addEvent    = win.addEventListener || (eventPrefix = 'on') && win.attachEvent;

          style.type  = 'text/css';
          style.id    = 'mediamatchjs';

          head.appendChild(style);

          // Must be placed after style is inserted into the DOM for IE
          info = (win.getComputedStyle && win.getComputedStyle(style)) || style.currentStyle;

          // Create media blocks to test for media type
          for ( ; typeIndex < typeLength; typeIndex++) {
              cssText += '@media ' + typeList[typeIndex] + ' { #mediamatchjs { position: relative; z-index: ' + typeIndex + ' } }';
          }

          // Add rules to style element
          if (style.styleSheet) {
              style.styleSheet.cssText = cssText;
          } else {
              style.textContent = cssText;
          }

          // Get media type
          _type = typeList[(info.zIndex * 1) || 0];

          head.removeChild(style);

          _setFeature();

          // Set up listeners
          addEvent(eventPrefix + 'resize', _watch, false);
          addEvent(eventPrefix + 'orientationchange', _watch, false);
      };

  _init();

  /*
      A list of parsed media queries, ex. screen and (max-width: 400px), screen and (max-width: 800px)
  */
  return function (media) {
      var id  = _queryID,
          mql = {
              matches         : false,
              media           : media,
              addListener     : function addListener(listener) {
                  _queries[id].listeners || (_queries[id].listeners = []);
                  listener && _queries[id].listeners.push(listener);
              },
              removeListener  : function removeListener(listener) {
                  var query   = _queries[id],
                      i       = 0,
                      il      = 0;

                  if (!query) {
                      return;
                  }

                  il = query.listeners.length;

                  for ( ; i < il; i++) {
                      if (query.listeners[i] === listener) {
                          query.listeners.splice(i, 1);
                      }
                  }
              }
          };

      if (media === '') {
          mql.matches = true;
          return mql;
      }

      mql.matches = _matches(media);

      _queryID = _queries.push({
          mql         : mql,
          listeners   : null
      });

      return mql;
  };
}(window));



