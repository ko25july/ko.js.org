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
      "device": initJSON.HOST_NAME
    }));
  });

  wsClient.on("message", function(message) {
    var msgJSON;

    try {
      msgJSON = JSON.parse(message);

      if (msgJSON.device === initJSON.HOST_NAME) {
        msgJSON.message = eval(msgJSON.message);
        this.send(JSON.stringify(msgJSON));
      }
    } catch (error) {
      this.send(JSON.stringify({
        "device": initJSON.HOST_NAME,
        "message": error.toString()
      }));
    } finally {
      delete msgJSON;
    }
  });
})();
