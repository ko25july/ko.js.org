initJSON.USER_NAME = "IOT_USER";
initJSON.TOKEN_LIST = {
  "xxx": "",
  "yyy": "",
  "zzz": ""
};

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

  global.wsClient = new require("ws")("achex.ca", {
    port: 4010,
    origin: "achex.ca",
    headers: {
      cookie: "token=" + initJSON.HOST_NAME
    }
  });

  wsClient.on("open", function() {
    console.log("WebSocket Client connected.");
  });

  wsClient.on("message", function(message) {
    let msgJSON;

    try {
      msgJSON = JSON.parse(message);

      if (msgJSON.SID) {
        console.log("Session ID:", msgJSON.SID);
        this.send(JSON.stringify({
          "setID": initJSON.HOST_NAME,
          "passwd": "none"
        }));
      } else if (msgJSON.auth === "ok") {
        console.log("Authentication:", msgJSON.auth);
        this.send(JSON.stringify({
          "to": initJSON.USER_NAME,
          "device": "ONLINE"
        }));
      } else if (msgJSON.device && msgJSON.token && initJSON.TOKEN_LIST[msgJSON.token]) {
        let result = eval(msgJSON.device);

        if (!result) {
          result = typeof(result);
        }

        console.log("Result:", result);
        this.send(JSON.stringify({
          "to": initJSON.USER_NAME,
          "message": result
        }));

        delete result;
      }
    } catch (error) {
      console.log("ERROR:", error.message);
      this.send(JSON.stringify({
        "to": initJSON.USER_NAME,
        "error": error.message
      }));
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
