const express = require('express');
const expressWebSocket = require('express-ws');
const fs = require('fs');
const websocketStream = require('websocket-stream/stream');
const app = express();
const port = 8080;
const intoStream = require('into-stream');

//google cloud speech to text API setup
const api_key = 'AIzaSyAmHUszpQhr4bik5IFMBddONoarqsggB8c';
const record = require('node-record-lpcm16');
// Imports the Google Cloud client library
const speech = require('@google-cloud/speech');

// Creates a client
const client = new speech.SpeechClient();

const encoding = 'LINEAR16';
const sampleRateHertz = 16000;
const languageCode = 'en-US';


const request = {
    config: {
      encoding: encoding,
      sampleRateHertz: sampleRateHertz,
      languageCode: languageCode,
    },
    interimResults: true, // If you want interim results, set this to true
  };

// Create a recognize stream
const recognizeStream = client
  .streamingRecognize(request)
  .on('error', console.error)
  .on('data', data => //change below to send to client
    process.stdout.write(
      data.results[0] && data.results[0].alternatives[0]
        ? `Transcription: ${data.results[0].alternatives[0].transcript}\n`
        : `\n\nReached transcription time limit, press Ctrl+C\n`
    )
  );


//express server setup
app.all('/', function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");
    next();
});
var WebSocketServer = require('ws').Server,
  wss = new WebSocketServer({port: 40510})
wss.on('connection', function (ws) {
    console.log("connected")
  ws.on('message', function (message) {
    console.log(message)
    console.log("message recieved by server")
    //turn into readable stream
    const stream = message

    console.log('stream found');
    intoStream(stream).pipe(recognizeStream);
  })
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

// extend express app with app.ws()
expressWebSocket(app, null, {
    // ws options here
    perMessageDeflate: false,
}); 

app.listen(port, () => {
    console.log('listening on ' + port);
});