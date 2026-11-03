require('dotenv').config();
const https = require("https");
const fs = require("fs");
const next = require("next");

(async () => {
  // mode prod pour build
  const dev = false; 
  const app = next({ dev });
  const handle = app.getRequestHandler();

  const httpsOptions = {
    key: fs.readFileSync('/etc/letsencrypt/live/vps118934.serveur-vps.net/privkey.pem', 'utf8'),
    cert: fs.readFileSync('/etc/letsencrypt/live/vps118934.serveur-vps.net/fullchain.pem', 'utf8')
  };

  await app.prepare();

  const port = process.env.PORT;

  https.createServer(httpsOptions, (req, res) => {
    handle(req, res);
  }).listen(port, "0.0.0.0", () => {
    console.log(`Next.js HTTPS running on https://vps118934.serveur-vps.net:${port}`);
  });
})();