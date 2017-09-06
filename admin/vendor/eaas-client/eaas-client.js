var EaasClient = EaasClient || {};

EaasClient.Client = function(api_entrypoint, container) {
  var _this = this;
  
  var API_URL = api_entrypoint.replace(/([^:])(\/\/+)/g, '$1/').replace(/\/+$/, '');

  this.componentId = null;
  this.networkId = null;
  this.driveId = null;
  this.params = null;

  function formatStr(format) {
    var args = Array.prototype.slice.call(arguments, 1);
    return format.replace(/{(\d+)}/g, function(match, number) {
      return typeof args[number] != 'undefined' ? args[number] : match;
    });
  }

  function strParamsToObject(str) {
    var result = {};
    if (!str) return result; // return on empty string

    str.split("&").forEach(function(part) {
      var item = part.split("=");
        result[item[0]] = decodeURIComponent(item[1]);
      });
    return result;
  }

  var hasConnected = false;
  this.pollState = function(componentId) {
    $.get(API_URL + formatStr("/components/{0}/state", _this.componentId))
    
    .then(function(data, status, xhr) {
      if (!_this.guac) {
        
        $.get(API_URL + formatStr("/components/{0}/controlurls", _this.componentId))
        .then(function(data, status, xhr) {
          _this.params = strParamsToObject(data.guacamole.substring(data.guacamole.indexOf("#") + 1));
          _this.establishGuacamoleTunnel(data.guacamole);
          _this.keepaliveIntervalId = setInterval(_this.keepalive, 1000);

          // call onConnectListeners
          hasConnected = true;

          for (var i = 0; i < listeners.length; i++) {
              // don't call removed listeners..
              if (listeners[i]) {
                  listeners[i]();
              }
          }
        });
      }
    }, function(xhr) {
      _this._onError($.parseJSON(xhr.responseText))
    })
  };
  
  var listeners = [];
  this.addOnConnectListener = function(callback) {
    // immediately execute callback when already connected
    if (hasConnected) {
        callback();
        return {remove: function(){}}
    }

    var index = listeners.push(callback) - 1;

    // can be used to remove the listener
    return {
      remove: function() {
        delete listeners[index];
      }
    };
  };

  this._onError = function(msg) {
    if (this.keepaliveIntervalId)
      clearInterval(this.keepaliveIntervalId);
    if (this.guac)
      this.guac.disconnect();
    if (this.onError) {
      this.onError(msg || { "error": "No error message specified"});
    }
  };

  this._onResize = function(width, height) {
    container.style.width = width;
    container.style.height = height;

    if (this.onResize) {
      this.onResize(width, height);
    }
  };

  this.keepalive = function() {
    var url = null;
    if (_this.networkId != null) {
      url = formatStr("/networks/{0}/keepalive", _this.networkId);
    } else if (_this.componentId != null) {
      url = formatStr("/components/{0}/keepalive", _this.componentId);
    }
    
    $.post(API_URL + url);
  };

  this.establishGuacamoleTunnel = function(controlUrl) {
    window.onbeforeunload = function() {
        this.guac.disconnect();
    }.bind(this);

    $.fn.focusWithoutScrolling = function() {
        var x = window.scrollX, y = window.scrollY;
        this.focus();
        window.scrollTo(x, y);
        return this;
    };

    this.guac = new Guacamole.Client(new Guacamole.HTTPTunnel(controlUrl.split("#")[0]));
    var displayElement = this.guac.getDisplay().getElement();

    BWFLA.hideClientCursor(this.guac);
    container.insertBefore(displayElement, container.firstChild);

    BWFLA.registerEventCallback(this.guac.getDisplay(), 'resize', this._onResize.bind(this));
    this.guac.connect();

    var mouse = new Guacamole.Mouse(displayElement);
    var touch = new Guacamole.Mouse.Touchpad(displayElement);
    var mousefix = new BwflaMouse(this.guac);

    //touch.onmousedown = touch.onmouseup = touch.onmousemove =
    //mouse.onmousedown = mouse.onmouseup = mouse.onmousemove =
    //function(mouseState) { guac.sendMouseState(mouseState); };

    mouse.onmousedown = touch.onmousedown = mousefix.onmousedown;
    mouse.onmouseup = touch.onmouseup = mousefix.onmouseup;
    mouse.onmousemove = touch.onmousemove = mousefix.onmousemove;

    var keyboard = new Guacamole.Keyboard(displayElement);

    keyboard.onkeydown = function (keysym) { this.guac.sendKeyEvent(1, keysym); }.bind(this);
    keyboard.onkeyup = function (keysym) { this.guac.sendKeyEvent(0, keysym); }.bind(this);

    $(displayElement).attr('tabindex', '0');
    $(displayElement).css('outline', '0');
    $(displayElement).mouseenter(function() {$(this).focusWithoutScrolling();});

    if (this.onReady) {
      this.onReady();
    }

    /*
    oskeyboard = new Guacamole.OnScreenKeyboard("/emucomp/resources/layouts/en-us-qwerty.xml");

    $('#keyboard-wrapper').addClass('keyboard-container');
    $('#keyboard-wrapper').html(oskeyboard.getElement());

    function resizeKeyboardTimer()
    {
        oskeyboard.resize($('#display > div').width()*0.95);
        setTimeout(resizeKeyboardTimer, 200);
    }

    resizeKeyboardTimer();

    oskeyboard.onkeydown = function (keysym) { guac.sendKeyEvent(1, keysym); };
    oskeyboard.onkeyup = function (keysym) { guac.sendKeyEvent(0, keysym); };
    */
  };



  this.startEnvironment = function(environmentId, args) {
    var data = {};
    data.type = "machine";
    data.environment = environmentId;
    
    if (typeof args !== "undefined") {
      data.keyboardLayout = args.keyboardLayout;
      data.keyboardModel = args.keyboardModel;
      data.object = args.object;
      
      if (args.object == null) {
        data.software = args.software;
      }
    }
    
    $.ajax({
      type: "POST",
      url: API_URL + "/components",
      data: JSON.stringify(data),
      contentType: "application/json"
    })
    .then(function(data, status, xhr) {
      _this.componentId = data.id;
      _this.driveId = data.driveId;
      _this.pollState();
    }, function(xhr) {
      _this._onError($.parseJSON(xhr.responseText))
    });
  };
  
  this.getScreenshotUrl = function() {
      return API_URL + formatStr("/components/{0}/screenshot", _this.componentId);
  };

  this.getPrintUrl = function() {
    return API_URL + formatStr("/components/{0}/print", _this.componentId);
  };

  this.stopEnvironment = function() {
      this.guac.disconnect();
      $.ajax({
            type: "GET",
            url: API_URL + formatStr("/components/{0}/stop", _this.componentId),
            async: false,
          });
      $(container).empty();
  };

  this.clearTimer = function () {
    clearInterval(this.keepaliveIntervalId);
  };

  this.release = function () {
      this.stopEnvironment();
      this.clearTimer();
  };

  this.changeMedia = function(postObj, onChangeDone)
      {
          $.ajax({
              type: "POST",
              url: API_URL + formatStr("/components/{0}/changeMedia", _this.componentId),
              data: JSON.stringify(postObj),
              contentType: "application/json"
          })
          .then(function (data, status, xhr) {
              onChangeDone(data, status);
          });
      };


  this.startEnvironmentWithInternet = function(environmentId, kbLanguage,
      kbLayout) {
    $.ajax({
      type : "POST",
      url : API_URL + "/components",
      data : JSON.stringify({
        environment : environmentId,
        keyboardLayout : kbLanguage,
        keyboardModel : kbLayout
      }),
      contentType : "application/json"
    }).done(
        function(data) {
          this.tmpdata = data;
          $.ajax({
            type : "POST",
            url : API_URL + "/networks",
            data : JSON.stringify({
              components : [ {
                componentId : data.id
              } ],
              hasInternet : true
            }),
            contentType : "application/json"
          }).done(
              function(data2) {
                this.pollState(this.tmpdata.controlUrl.replace(
                    /([^:])(\/\/+)/g, '$1/'), this.tmpdata.id);
              }.bind(this)).fail(function(xhr, textStatus, error) {
            this._onError($.parseJSON(xhr.responseText));
          }.bind(this));

        }.bind(this)).fail(function(xhr, textStatus, error) {
      //this._onError($.parseJSON(xhr.responseText).message);
    }.bind(this));
  }
  
};
/*
 *  Example usage:
 *
 *      var centerOnScreen = function(width, height) {
 *          ...
 *      }
 *
 *      var resizeIFrame = function(width, height) {
 *          ...
 *      }
 *
 *      BWFLA.registerEventCallback(<target-1>, 'resize', centerOnScreen);
 *      BWFLA.registerEventCallback(<target-2>, 'resize', centerOnScreen);
 *      BWFLA.registerEventCallback(<target-2>, 'resize', resizeIFrame);
 */

var BWFLA = BWFLA || {};

// Method to attach a callback to an event
BWFLA.registerEventCallback = function(target, eventName, callback)
{
  var event = 'on' + eventName;

  if (!(event in target)) {
    console.error('Event ' + eventName + ' not supported!');
    return;
  }

  // Add placeholder for event-handlers to target's prototype
  if (!('__bwFlaEventHandlers__' in target))
    target.constructor.prototype.__bwFlaEventHandlers__ = {};

  // Initialize the list for event's callbacks
  if (!(event in target.__bwFlaEventHandlers__))
    target.__bwFlaEventHandlers__[event] = [];

  // Add the new callback to event's callback-list
  var callbacks = target.__bwFlaEventHandlers__[event];
  callbacks.push(callback);

  // If required, initialize handler management function
  if (target[event] == null) {
    target[event] = function() {
      var params = arguments;  // Parameters to the original callback

      // Call all registered callbacks one by one
      callbacks.forEach(function(func) {
        func.apply(target, params);
      });
    };
  }
};


// Method to unregister a callback for an event
BWFLA.unregisterEventCallback = function(target, eventName, callback)
{
  // Look in the specified target for the callback and
  // remove it from the execution chain for this event

  if (!('__bwFlaEventHandlers__' in target))
    return;

  var callbacks = target.__bwFlaEventHandlers__['on' + eventName];
  if (callbacks == null)
    return;

  var index = callbacks.indexOf(callback);
  if (index > -1)
    callbacks.splice(index, 1);
};

/** Custom mouse-event handlers for use with the Guacamole.Mouse */
var BwflaMouse = function(client)
{
  var events = [];
  var handler = null;
  var waiting = false;


  /** Adds a state's copy to the current event-list. */
  function addEventCopy(state)
  {
    var copy = new Guacamole.Mouse.State(state.x, state.y, state.left,
        state.middle, state.right, state.up, state.down);

    events.push(copy);
  }

  /** Sets a new timeout-callback, replacing the old one. */
  function setNewTimeout(callback, timeout)
  {
    if (handler != null)
      window.clearTimeout(handler);

    handler = window.setTimeout(callback, timeout);
  }

  /** Handler, called on timeout. */
  function onTimeout()
  {
    while (events.length > 0)
      client.sendMouseState(events.shift());

    handler = null;
    waiting = false;
  };


  /** Handler for mouse-down events. */
  this.onmousedown = function(state)
  {
    setNewTimeout(onTimeout, 100);
    addEventCopy(state);
    waiting = true;
  };

  /** Handler for mouse-up events. */
  this.onmouseup = function(state)
  {
    setNewTimeout(onTimeout, 150);
    addEventCopy(state);
    waiting = true;
  };

  /** Handler for mouse-move events. */
  this.onmousemove = function(state)
  {
    if (waiting == true)
      addEventCopy(state);
    else client.sendMouseState(state);
  };
};

var BWFLA = BWFLA || {};


/** Requests a pointer-lock on given element, if supported by the browser. */
BWFLA.requestPointerLock = function(target, event)
{
  function lockPointer() {
    var havePointerLock = 'pointerLockElement' in document
                          || 'mozPointerLockElement' in document
                          || 'webkitPointerLockElement' in document;

    if (!havePointerLock) {
      var message = "Your browser does not support the PointerLock API!\n"
                + "Using relative mouse is not possible.\n\n"
                + "Mouse input will be disabled for this virtual environment.";

      console.warn(message);
      alert(message);
      return;
    }

    // Activate pointer-locking
    target.requestPointerLock = target.requestPointerLock
                                || target.mozRequestPointerLock
                                || target.webkitRequestPointerLock;

    target.requestPointerLock();
  };

  function enableLockEventListener()
  {
    target.addEventListener(event, lockPointer, false);
  };

  function disableLockEventListener()
  {
    target.removeEventListener(event, lockPointer, false);
  };

  function onPointerLockChange() {
    if (document.pointerLockElement === target
        || document.mozPointerLockElement === target
        || document.webkitPointerLockElement === target) {
      // Pointer was just locked
      console.debug("Pointer was locked!");
      target.isPointerLockEnabled = true;
      disableLockEventListener();
    } else {
      // Pointer was just unlocked
      console.debug("Pointer was unlocked.");
      target.isPointerLockEnabled = false;
      enableLockEventListener();
    }
  };

  function onPointerLockError(error) {
    var message = "Pointer lock failed!";
    console.warn(message);
    alert(message);
  }

  // Hook for pointer lock state change events
  document.addEventListener('pointerlockchange', onPointerLockChange, false);
  document.addEventListener('mozpointerlockchange', onPointerLockChange, false);
  document.addEventListener('webkitpointerlockchange', onPointerLockChange, false);

  // Hook for pointer lock errors
  document.addEventListener('pointerlockerror', onPointerLockError, false);
  document.addEventListener('mozpointerlockerror', onPointerLockError, false);
  document.addEventListener('webkitpointerlockerror', onPointerLockError, false);

  enableLockEventListener();

  // Set flag for relative-mouse mode
  target.isRelativeMouse = true;
};


/** Hides the layer containing client-side mouse-cursor. */
BWFLA.hideClientCursor = function(guac)
{
  var display = guac.getDisplay();
  display.showCursor(false);
};


/** Shows the layer containing client-side mouse-cursor. */
BWFLA.showClientCursor = function(guac)
{
  var display = guac.getDisplay();
  display.showCursor(true);
};
