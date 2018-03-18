const HOST_HEROKU = "ws-node.herokuapp.com";
const URL_KO_JS_ORG = "https://ko.js.org";

const express = require("express");
const http = require("http");
const https = require("https");
const WebSocket = require("ws");
const fs = require("fs");
const path = require('path');
const puppeteer = require("puppeteer");

const app = express();
const server = http.createServer(app);
const port = process.env.PORT || 80;
server.listen(port);
console.log("HTTP Server listening on %d.", port);

const getHtml = function(url, success, failure) {
  https.get(url, function(res) {
    let data = "";

    res.on("data", function(chunk) {
      data += chunk;
    });

    res.on("end", function() {
      if (success) {
        success(data);
      } else {
        console.log("RESULT:", "Data length = " + data.length + " bytes.");
      }
    });
  }).on("error", function(error) {
    if (failure) {
      failure(error);
    } else {
      console.log("ERROR:", error.message);
    }
  });
}

const routeUrl = function(virtualPath, url) {
  getHtml(url,
    function(success) {
      let hostname;
      let urlSplit = url.split("://");

      if (urlSplit.length > 1) {
        hostname = urlSplit[1].split("/")[0];
      } else {
        hostname = urlSplit[0];
      }

      let pathUrl = path.join(__dirname, hostname);
      let filename = path.join(pathUrl, url.slice(url.lastIndexOf("/") + 1));

      fs.mkdir(pathUrl, function(error) {
        fs.writeFile(filename, success, function(error) {
          if (error) {
            console.log(error.message);
          } else {
            app.get(virtualPath, function(req, res) {
              res.sendFile(filename);
            });
          }
        });
      });
    },
    function(failure) {
      console.log(failure.message);
    });
};

const runScript = function(script) {
  let result;

  if (typeof(script) === "string") {
    try {
      result = eval(script);
    } catch (error) {
      result = error.message;
    }
  }

  return result;
};

const parseCookies = function(request) {
  let list = {};
  let cookies = request.headers.cookie;

  cookies && cookies.split(";").forEach(function (cookie) {
    let parts = cookie.split("=");
    list[parts.shift().trim()] = decodeURI(parts.join("="));
  });

  return list;
};

const wss = new WebSocket.Server({
  server: server,
  verifyClient: function (info, cb) {
    let cookies = parseCookies(info.req);
    if (cookies && cookies.token && info.req.headers.origin && info.req.headers.origin.indexOf(info.req.headers.host === "localhost" ? info.req.headers.host : HOST_HEROKU) > -1) {
      fs.access(__dirname + "/html/devices/" + cookies.token + ".js", function (error) { cb(!error); });
    } else {
      cb(false);
    }
  }
});

wss.devices = {};

wss.on("connection", function (ws, req) {
  ws.token = parseCookies(req).token;
  ws.ip = req.connection.remoteAddress;
  ws.isAlive = true;

  console.log("WebSocket open. [" + ws.ip + "]");

  ws.on("pong", function () {
    this.isAlive = true;
  });

  ws.on("message", function (message) {
    try {
      let msgJSON = JSON.parse(message);

      if (msgJSON.device) {
        if (msgJSON.device === this.token) {
          this.device = this.token;
          wss.devices[this.device] = this;
          message = { "online": this.device };
        } else if (wss.devices[this.token]) {
          wss.devices[this.token].send(JSON.stringify({
            "device": this.token,
            "message": msgJSON.device
          }));
          return;
        }
      } else if (msgJSON.server) {
        message = { "message": runScript(msgJSON.server) };
      } else if (msgJSON.message) {
        message = { "message": msgJSON.message };
      }
    } catch (error) {
      message = { "message": error.message };
      console.log("ERROR:", error.message);
    } finally {
      try {
        message = JSON.stringify(message);
        console.log("WebSocket message [" + this.ip + "]: " + message);
      } catch (error2) {
        message = JSON.stringify({ "message": error2.message });
        console.log("ERROR:", error2.message);
      }
    }

    wss.clients.forEach(function (client) {
      if (!client.device && client.readyState === WebSocket.OPEN) {
        try {
          client.send(message);
        } catch (error) {
          console.log("ERROR:", error.message);
        }
      }
    });
  });

  ws.on("close", function () {
    console.log("WebSocket close. [" + this.ip + "]");

    if (this.device) {
      wss.clients.forEach(function (client) {
        if (client !== ws && client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({ "offline": ws.device }));
        }
      });

      delete this.device;
    }
  });

  ws.on("error", function (error) {
    console.log("WebSocket error. [" + this.ip + "]: " + error.message);
  });
});

const interval = setInterval(function () {
  wss.clients.forEach(function (ws) {
    if (ws.isAlive === false) {
      if (ws.device) {
        wss.clients.forEach(function (client) {
          if (client !== ws && client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({
              "device": ws.device,
              "message": "XX"
            }));
          }
        });

        delete ws.device;
      }

      return ws.terminate();
    }

    ws.isAlive = false;
    ws.ping();
  });
}, 30000);

app.use(express.static(__dirname + "/html"));
//app.use("/images", express.static(__dirname + "/html/images"));
//app.use("/devices", express.static(__dirname + "/html/devices"));
app.use("/status", express.static(__dirname + "/html/status.html"));
app.use("/remote", express.static(__dirname + "/html/remote.html"));

app.get("/", function(req, res) {
  res.status(200).send("");
});

app.get("/clear", function(req, res) {
  res.clearCookie("token");
  res.redirect(302, "/");
});

app.get("/facebook", function(req, res) {
  (async() => {
      const browser = await puppeteer.launch({
          args: ["--no-sandbox", "--disable-setuid-sandbox"]
      });

      const page = await browser.newPage();
      await page.goto("https://www.facebook.com");
      await page.screenshot().then(function(buffer) {
          res.setHeader("Content-Disposition", "attachment;filename=\"" + "screenshot" + ".png\"");
          res.setHeader("Content-Type", "image/png");
          res.send(buffer)
      });

      await browser.close();
  })();
});

routeUrl("/test", URL_KO_JS_ORG + "/ESP_7055E7.js");

console.log("WebSocket Server ready.");
