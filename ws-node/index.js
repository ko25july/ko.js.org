const WebSocket = require("ws");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const puppeteer = require("puppeteer");

const evalScript = (script) => {
  let result;

  if (typeof(script) === "string") {
    try {
      result = eval(script);
    } catch (error) {
      result = error;
    }
  }

  return result;
};

const parseCookies = (req) => {
  let lists = {};
  let cookies = req.headers.cookie;

  cookies && cookies.split(";").forEach((cookie) => {
    let parts = cookie.split("=");
    lists[parts.shift().trim()] = decodeURI(parts.join("="));
  });

  return lists;
};

const wss = new WebSocket.Server({
  server: server,
  verifyClient: (info, cb) => {
    let token = parseCookies(info.req).token;

    if (token) {
      getHtml(URL_KO_JS_ORG + "/ws-node/devices/" + token + ".js", (error, data) => {
        cb(!error);
      });
    } else {
      cb(false);
    }
  }
});

wss.devices = {};

wss.on("connection", (ws, req) => {
  ws.token = parseCookies(req).token;
  ws.ip = req.connection.remoteAddress;
  ws.isAlive = true;

  console.log("WebSocket open -> [%s]", ws.ip);

  ws.on("pong", () => {
    ws.isAlive = true;
  });

  ws.on("message", (message) => {
    console.log("WebSocket message -> [%s]:", ws.ip, message);

    let msgJSON;

    try {
      msgJSON = JSON.parse(message);

      if (msgJSON.server) {
        msgJSON.message = evalScript(msgJSON.server);
        console.log("WebSocket result -> [%s]:", ws.ip, msgJSON.message);
      }

      if (msgJSON.device === "ONLINE") {
        wss.devices[ws.token] = ws;
        ws.isDevice = true;
        ws.send(JSON.stringify({ "device": "DATENOW", "datenow": Date.now() }));
      }
    } catch (error) {
      msgJSON = { "error": error };
    } finally {
      message = JSON.stringify(msgJSON);
    }

    wss.clients.forEach((client) => {
      if ((!client.isDevice || !ws.isDevice) && client.readyState === WebSocket.OPEN) {
        try {
          client.send(message);
        } catch (error) {
          console.error(error);
        }
      }
    });
  });

  ws.on("close", () => {
    console.log("WebSocket close -> [%s]", ws.ip);

    if (ws.isDevice) {
      delete wss.devices[ws.token];

      wss.clients.forEach((client) => {
        if (client !== ws && client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({ "device": "OFFLINE" }));
        }
      });

      delete ws.isDevice;
    }
  });

  ws.on("error", (error) => {
    console.error("WebSocket error -> [%s]:", ws.ip, error);
  });

  if (wss.devices[ws.token]) {
    ws.send(JSON.stringify({ "device": "ONLINE" }));
  }
});

const interval = setInterval(() => {
  wss.clients.forEach((ws) => {
    if (!ws.isAlive) {
      if (ws.isDevice) {
        delete wss.devices[ws.token];

        wss.clients.forEach((client) => {
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

const getHtml = (urlHtml, callback) => {
  let protocol;

  if (urlHtml.startsWith("http://")) {
    protocol = http;
  } else if (urlHtml.startsWith("https://")) {
    protocol = https;
  }

  if (protocol) {
    protocol.get(urlHtml, (res) => {
      if (res.statusCode === 200) {
        let data = [];
        res.on("data", (chunk) => {
          data.push(chunk);
        });
        res.on("end", () => {
          if (callback) {
            callback(undefined, Buffer.concat(data));
          } else {
            console.log("Data length = %d bytes.", data.length);
          }
        });
      }
    }).on("error", (error) => {
      if (callback) {
        callback(error);
      } else {
        console.error(error);
      }
    });
  } else {
    console.error("Invalid protocol.");
  }
};

const routeUrl = (virtualPath, urlHtml, urlType) => {
  return new Promise((resolve, reject) => {
    getHtml(urlHtml, (error, data) => {
      if (!error) {
        app.get(virtualPath, (req, res) => {
          res.set("Content-Type", urlType);
          res.send(data);
        });

        resolve(data);
      } else {
        console.error(error);

        reject(error);
      }
    });
  });
};

const routeList = (urlList) => {
  return new Promise((resolve, reject) => {
    getHtml(urlList, (error, data) => {
      if (!error) {
        let promiseList = [];

        JSON.parse(data).forEach((html) => {
          promiseList.push(routeUrl(html.path, urlList.slice(0, urlList.lastIndexOf("/") + 1) + html.name, html.type));
        });

        Promise.all(promiseList).then((values) => {
          resolve(values);
        });
      } else {
        console.error(error);

        reject(error);
      }
    });
  });
};

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cookieParser());

app.get("/clear", (req, res) => {
  res.clearCookie("token");
  res.redirect(302, "/");
});

app.post("/command", (req, res) => {
  res.setHeader("Content-Type", "text/plain");
  res.send(JSON.stringify(evalScript(req.body.eval)));
});

app.get("/facebook", (req, res) => {
  (async () => {
    try {
      const browser = await puppeteer.launch({
        args: ["--no-sandbox", "--disable-setuid-sandbox"]
      });

      const page = await browser.newPage();
      await page.goto("https://www.facebook.com");
      await page.screenshot().then((buffer) => {
          res.setHeader("Content-Disposition", "attachment;filename=\"" + "screenshot" + ".png\"");
          res.setHeader("Content-Type", "image/png");
          res.send(buffer)
      });

      await browser.close();
    } catch (error) {
      console.error(error);
    }
  })();
});

Promise.all([
  routeList(URL_KO_JS_ORG + "/ws-node/devices/list.json"),
  routeList(URL_KO_JS_ORG + "/ws-node/html/list.json"),
  routeList(URL_KO_JS_ORG + "/ws-node/html/images/list.json"),
  routeUrl("/index", URL_KO_JS_ORG + "/ws-node/html/index.html", "text/html"),
  routeUrl("/index.htm", URL_KO_JS_ORG + "/ws-node/html/index.html", "text/html"),
  routeUrl("/index.html", URL_KO_JS_ORG + "/ws-node/html/index.html", "text/html"),
  routeUrl("/favicon.ico", URL_KO_JS_ORG + "/ws-node/html/favicon.ico", "image/x-icon"),
]).then((values) => {
  routeUrl("*", URL_KO_JS_ORG + "/ws-node/html/404.html", "text/html")
  console.log("Web Server initialized.");
});

"WebSocket Server ready."
