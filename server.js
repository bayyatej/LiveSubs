const express = require('express');
const expressWebSocket = require('express-ws');
const app = express();
const port = 8080;
require('dotenv').load();

const { Translate } = require('@google-cloud/translate');

// GCP project ID
const projectId = 'livesub-229106';

// Instantiates a client
const translate = new Translate({
  projectId: projectId,
});

//express server setup
app.all('/', function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "X-Requested-With");
  next();
});
var WebSocketServer = require('ws').Server;
var wss = new WebSocketServer({ port: 40510 });
wss.on('connection', function (ws) {
  ws.on('message', function (data) {
    if (data === "key") {
      ws.send(process.env.apiKey);
    }
  })
})
// Set 'public' folder as root
app.use(express.static('public'));
// Provide access to node_modules folder from the client-side
app.use('/scripts', express.static(`${__dirname}/node_modules/`));
// Redirect all traffic to index.html
app.use((req, res) => res.sendFile(`${__dirname}/public/index.html`));

// extend express app with app.ws()
expressWebSocket(app, null, {
  // ws options here
  perMessageDeflate: false,
});

app.listen(port, () => {
  console.log('Listening on ' + port);
});