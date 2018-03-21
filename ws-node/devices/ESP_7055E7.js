(function() {
  var wsHost = initJSON.INIT.slice(initJSON.INIT.indexOf("://") + 3, initJSON.INIT.indexOf("/", initJSON.INIT.indexOf("://") + 3));
  var wsOrigin = initJSON.INIT.slice(0, initJSON.INIT.indexOf("/", initJSON.INIT.indexOf("://") + 3));
  var wsClient = new require("ws")(wsHost, {
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
    console.log(message);

    var msgJSON;

    try {
      msgJSON = JSON.parse(message);

      if (msgJSON.device) {
        var result = eval(msgJSON.device);

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
      clearTimeout();
      setTimeout(function() {
        connectWebSocket(function(result) {
          console.log(result);
        });
      }, 30000);
    }
  });

  return "WebSocket Client ready.";
})();
