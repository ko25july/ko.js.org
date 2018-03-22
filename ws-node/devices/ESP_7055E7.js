global.connectWebSocket = function() {
  if (typeof(wsClient) !== "undefined") {
    wsClient.close();
    delete wsClient;
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
  });

  wsClient.on("message", function(message) {
    let msgJSON;

    try {
      msgJSON = JSON.parse(message);

      if (msgJSON.device) {
        let result = eval(msgJSON.device);

        if (!result) {
          result = typeof(result);
        }

        this.send(JSON.stringify({ "message": result }));

        delete result;
      }
    } catch (error) {
      this.send(JSON.stringify({ "error": error.message }));
    }

    delete msgJSON;
  });

  wsClient.on("close", function() {
    if (wifi.getStatus().station === "connected") {
      console.log("WebSocket Client will retry in 30 seconds...");
      setTimeout(connectWebSocket, 30000);
    }
  });

  return "WebSocket Client ready.";
};

connectWebSocket();
