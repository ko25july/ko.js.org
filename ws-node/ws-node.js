const HOST_HEROKU = "ws-node.herokuapp.com";
const URL_KO_JS_ORG = "https://ko.js.org";

const express = require("express");
const http = require("http");
const https = require("https");
const WebSocket = require("ws");
const fs = require("fs");
const path = require("path");
const bodyParser = require("body-parser");
const puppeteer = require("puppeteer");

const app = express();
const server = http.createServer(app);
const port = process.env.PORT || 80;
server.listen(port);
console.log("HTTP Server listening on %d.", port);

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

  cookies && cookies.split(";").forEach(function(cookie) {
    let parts = cookie.split("=");
    list[parts.shift().trim()] = decodeURI(parts.join("="));
  });

  return list;
};

const wss = new WebSocket.Server({
  server: server,
  verifyClient: function(info, cb) {
    let cookies = parseCookies(info.req);
    if (cookies && cookies.token && info.req.headers.origin && info.req.headers.origin.indexOf(info.req.headers.host === "localhost" ? info.req.headers.host : HOST_HEROKU) > -1) {
      fs.access(__dirname + "/devices/" + cookies.token + ".js", function(error) { cb(!error); });
    } else {
      cb(false);
    }
  }
});

wss.devices = {};

wss.on("connection", function(ws, req) {
  ws.token = parseCookies(req).token;
  ws.ip = req.connection.remoteAddress;
  ws.isAlive = true;

  console.log("WebSocket open. [" + ws.ip + "]");

  ws.on("pong", function() {
    this.isAlive = true;
  });

  ws.on("message", function(message) {
    console.log("WebSocket message [" + this.ip + "]: " + message);

    let msgJSON;

    try {
      msgJSON = JSON.parse(message);

      if (msgJSON.server) {
        msgJSON.message = runScript(msgJSON.server);
        console.log("WebSocket result [" + this.ip + "]: " + msgJSON.message);
      }

      if (msgJSON.device === "ONLINE") {
        wss.devices[this.token] = this;
        this.isDevice = true;
      }
    } catch (error) {
      msgJSON = { "error": error.message };
    } finally {
      message = JSON.stringify(msgJSON);
    }

    wss.clients.forEach(function(client) {
      console.log("client.isDevice:", client.isDevice);
      console.log("ws.isDevice:", ws.isDevice);

      if (((!client.isDevice && ws.isDevice) || !ws.isDevice) && client.readyState === WebSocket.OPEN) {
        try {
          client.send(message);
        } catch (error) {
          console.log("ERROR:", error.message);
        }
      }
    });
  });

  ws.on("close", function() {
    console.log("WebSocket close. [" + this.ip + "]");

    if (this.isDevice) {
      delete wss.devices[this.token];

      wss.clients.forEach(function(client) {
        if (client !== ws && client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({ "device": "OFFLINE" }));
        }
      });

      delete this.isDevice;
    }
  });

  ws.on("error", function(error) {
    console.log("WebSocket error. [" + this.ip + "]: " + error.message);
  });

  if (wss.devices[ws.token]) {
    ws.send(JSON.stringify({ "device": "ONLINE" }));
  } else {
    ws.send(JSON.stringify({ "device": "OFFLINE" }));
  }
});

const interval = setInterval(function() {
  wss.clients.forEach(function(ws) {
    if (ws.isAlive === false) {
      if (ws.isDevice) {
        delete wss.devices[ws.token];

        wss.clients.forEach(function(client) {
          if (client !== ws && client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({ "device": "OFFLINE" }));
          }
        });

        delete ws.isDevice;
      }

      return ws.terminate();
    }

    ws.isAlive = false;
    ws.ping();
  });
}, 10000);

const getHtml = function(urlHtml, success, failure) {
  let protocol;

  if (urlHtml.startsWith("http://")) {
    protocol = http;
  } else if (urlHtml.startsWith("https://")) {
    protocol = https;
  }

  if (protocol) {
    https.get(urlHtml, function(res) {
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
  } else {
    console.log("ERROR:", "Invalid protocol.");
  }
};

const mkdirSyncP = function(location) {
  let parsedPath = path.parse(path.normalize(location));
  let currentDir = __dirname;
  let listDir = parsedPath.dir.split(path.sep);

  listDir.push(parsedPath.base);

  for (let itemDir of listDir) {
    currentDir = path.join(currentDir, itemDir);

    if (!fs.existsSync(currentDir)) {
      fs.mkdirSync(currentDir);
    }
  }
};

const routeUrl = function(virtualPath, urlHtml) {
  getHtml(urlHtml,
    function(success) {
      let hostname;
      let urlSplit = urlHtml.split("://");

      if (urlSplit.length > 1) {
        hostname = urlSplit[1].split("/")[0];
      } else {
        hostname = urlSplit[0];
      }

      let pathUrl = urlHtml.slice(urlHtml.indexOf("://") + 3, urlHtml.lastIndexOf("/"));
      let filename = urlHtml.slice(urlHtml.lastIndexOf("/") + 1);
      let fullname = path.join(__dirname, pathUrl, filename);

      mkdirSyncP(pathUrl);

      fs.writeFile(fullname, success, function(error) {
        if (error) {
          console.log(error.message);
        } else {
          app.get(virtualPath, function(req, res) {
            res.sendFile(fullname);
          });
        }
      });
    },
    function(failure) {
      console.log(failure.message);
    });
};

const routeHtml = function(urlList) {
  getHtml(urlList,
    function(success) {
      JSON.parse(success).forEach(function(html) {
        routeUrl(html.path, urlList.slice(0, urlList.lastIndexOf("/") + 1) + html.html);
      });
    },
    function(failure) {
      console.log(failure.message);
    });
};

//app.use(express.static(__dirname + "/html"));
//app.use("/images", express.static(__dirname + "/html/images"));
//app.use("/devices", express.static(__dirname + "/html/devices"));
//app.use("/status", express.static(__dirname + "/html/status.html"));
//app.use("/remote", express.static(__dirname + "/html/remote.html"));
//app.use("/console", express.static(__dirname + "/html/console.html"));

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

/*
app.get("/", function(req, res) {
  res.status(200).send("");
});
*/

app.get("/clear", function(req, res) {
  res.clearCookie("token");
  res.redirect(302, "/");
});

app.post("/command", function(req, res) {
  res.setHeader("Content-Type", "text/plain");
  res.end(JSON.stringify(runScript(req.body.eval)));
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

routeHtml(URL_KO_JS_ORG + "/ws-node/devices/list.json");
routeHtml(URL_KO_JS_ORG + "/ws-node/html/list.json");

console.log("WebSocket Server ready.");
