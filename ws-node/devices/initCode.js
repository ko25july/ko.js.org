console.log("Initializing...");

global.evalRemoteScript = function(callback) {
  if (wifi.getStatus().station === "connected") {
    let httpClientReq = http.get(initJSON.INIT, function(res) {
      let contents = "";

      res.on("data", function(data) {
        contents += data;
      });

      res.on("close", function() {
        let result = eval(contents);

        if (callback) {
          callback(result);
        }

        delete result;
        delete contents;
        delete httpClientReq;
      });
    }).on("error", function(error) {
      console.log("ERROR:", error);

      delete httpClientReq;

      if (wifi.getStatus().station === "connected") {
        console.log("WebSocket Client will retry in 30 seconds...");
        setTimeout(evalRemoteScript, 30000, callback);
      }
    });
  }
};

global.createWebSocket = function() {
  if (typeof(wsServer) !== "undefined") {
    wsServer.close();
    delete wsServer;
  }

  global.wsServer = require("ws").createServer(function(req, res) {
    if (typeof(httpHandle) === "function") {
      httpHandle(req, res);
    } else {
      let reqUrl = url.parse(req.url, true);

      if (reqUrl.pathname === "/") {
        res.writeHead(200, {
          "Content-Type": "text/html"
        });

        res.end(require("Storage").read("httpPage").replace("{HOST_NAME}", initJSON.HOST_NAME));
      } else if (reqUrl.pathname === "/favicon.ico") {
        res.writeHead(200, {
          "Content-Type": "image/x-icon"
        });

        res.end(require("Storage").read("favicon"));
      } else if (reqUrl.pathname === "/command") {
        res.writeHead(200, {
          "Content-Type": "text/plain"
        });

        let result = "";

        try {
          if (reqUrl.query && reqUrl.query.eval) {
            result = eval(reqUrl.query.eval);
          }
        } catch (error) {
          result = error.msg;
        }

        res.end(JSON.stringify(result));

        delete result;
      } else {
        res.writeHead(404, {
          "Content-Type": "text/plain"
        });

        res.end("Cannot GET " + reqUrl.pathname);
      }

      delete reqUrl;
    }
  });

  wsServer.on("websocket", function(ws) {
    ws.on("message", function(message) {
      let msgJSON;

      try {
        msgJSON = JSON.parse(message);

        if (msgJSON.device === initJSON.HOST_NAME) {
          msgJSON.message = eval(msgJSON.message);
          this.send(JSON.stringify(msgJSON));
        }
      } catch (error) {
        this.send(JSON.stringify({
          "device": initJSON.HOST_NAME,
          "message": error.msg
        }));
      } finally {
        delete msgJSON;
      }
    });

    ws.send(JSON.stringify({
      "device": initJSON.HOST_NAME,
      "message": "OK"
    }));

    console.log("WebSocket Client connected.");
  });

  wsServer.listen(80);
  console.log("WebSocket Server ready.");
};

global.initJSON = require("Storage").readJSON("initJSON");
global.wifi = require("Wifi");
global.http = require("http");

Modules.addCached("ws", require("Storage").read("wsModule"));

global.connectWifi = function(isAP) {
  global.isConnecting = true;

  wifi.disconnect(function() {
    wifi.stopAP(function() {
      if (isAP) {
        console.log("Access Point Starting...");
        wifi.startAP(initJSON.AP_SSID, {
          password: initJSON.AP_PASSWORD
        }, function(error) {
          if (error) {
            console.log("ERROR:", error);
            wifi.stopAP();
          } else {
            console.log("Access Point ready.");
            createWebSocket();
          }

          console.log("The system will reset in 60 seconds...");
          setTimeout(reset, 60000);

          delete isConnecting;
        });
      } else {
        console.log("Station Connecting...");
        wifi.connect(initJSON.STA_SSID, {
          password: initJSON.STA_PASSWORD
        }, function(error) {
          if (error) {
            console.log("ERROR:", error);

            console.log("The system will start access point in 60 seconds...");
            setTimeout(connectWifi, 60000, true);
          } else {
            console.log("Station ready.");
          }

          delete isConnecting;
        });
      }
    });
  });
};

wifi.on("connected", function(details) {
  console.log("Station Connected.");
  console.log(details);

  delete isConnecting;

  createWebSocket();

  evalRemoteScript(function(result) {
    console.log(result);
  });
});

wifi.on("disconnected", function(details) {
  console.log("Station Disconnected.");
  console.log(details);

  if (typeof(wsServer) !== "undefined") {
    wsServer.close();
    delete wsServer;
  }

  if (typeof(isConnecting) === "undefined") {
    console.log("The system will start station in 60 seconds...");
    setTimeout(connectWifi, 60000);
  }
});

connectWifi();
