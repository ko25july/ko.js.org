if (typeof(dateOffset) !== "undefined") {
  delete dateOffset;
}

global.dateOffset = 0;

if (typeof(minutesInterval) !== "undefined") {
  try {
    clearInterval(minutesInterval);
  } catch (error) {
    console.log("ERROR:", error);
  } finally {
    delete minutesInterval;
  }
}

global.minutesInterval = setInterval(function() {
  let hours = new Date(Date.now() + dateOffset).getHours();

  if (hours >= 4) {
    if (typeof(wsClient) === "undefined" || !wsClient.connected) {
      connectWebSocket();
    } else {
      wsClient.send(JSON.stringify({
        "device": "ONLINE"
      }));
    }
  }
}, 60 * 1000);

if (typeof(connectWebSocket) !== "undefined") {
  delete connectWebSocket;
}

global.connectWebSocket = function() {
  if (typeof(wsClient) !== "undefined") {
    if (wsClient.connected) {
      wsClient.close();
    }

    delete wsClient;
  }

  if (wifi.getStatus().station !== "connected") {
    return;
  }

  let wsHost = initJSON.INIT.slice(initJSON.INIT.indexOf("://") + 3, initJSON.INIT.indexOf("/", initJSON.INIT.indexOf("://") + 3));
  let wsOrigin = initJSON.INIT.slice(0, initJSON.INIT.indexOf("/", initJSON.INIT.indexOf("://") + 3));

  global.wsClient = new require("ws")(wsHost, {
    origin: wsOrigin,
    headers: {
      cookie: "token=" + initJSON.HOST_NAME
    }
  });

  wsClient.on("open", function() {
    this.send(JSON.stringify({
      "device": "ONLINE"
    }));

    console.log("WebSocket Client connected.");
  });

  wsClient.on("message", function(message) {
    let msgJSON;

    try {
      msgJSON = JSON.parse(message);

      if (msgJSON.device) {
        if (msgJSON.datenow && msgJSON.device === "DATENOW") {
          dateOffset = msgJSON.datenow - Date.now() + (7 * 3600 * 1000);
        } else {
          let result = eval(msgJSON.device);

          if (!result) {
            result = typeof(result);
          }

          this.send(JSON.stringify({ "message": result }));

          delete result;
        }
      }
    } catch (error) {
      this.send(JSON.stringify({ "error": error.message }));
    }

    delete msgJSON;
  });

  wsClient.on("close", function() {
    delete wsClient;

    console.log("WebSocket Client disconnected.");
  });

  return "WebSocket Client ready.";
};

connectWebSocket();
