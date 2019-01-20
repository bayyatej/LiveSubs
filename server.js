const express = require('express');
const fs = require('fs');
const app = express();
const port = 8080;

app.all('/', function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");
    next();
});
var WebSocketServer = require('ws').Server,
  wss = new WebSocketServer({port: 40510})
wss.on('connection', function (ws) {
  ws.on('message', function (message) {
      //TODO: Send to cloud speech api and send back to client
    console.log(JSON.parse(message).connected[2]);
  })
//   setInterval(
//     () => ws.send(`${new Date()}`),
//     1000
//   )
  //PSEUDOCODE
  /*ws.on('message',function(){
      //send to cloud speech api
      send to translate api?maybe
      on result: ws.send(detectedspeech)

  })*/
})
// Set 'public' folder as root
app.use(express.static('public'));
// Provide access to node_modules folder from the client-side
app.use('/scripts', express.static(`${__dirname}/node_modules/`));
// Redirect all traffic to index.html
app.use((req, res) => res.sendFile(`${__dirname}/public/index.html`));

app.listen(port, () => {
    console.log('listening on ' + port);
});