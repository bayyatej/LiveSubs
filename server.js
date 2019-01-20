const express = require('express');
const expressWebSocket = require('express-ws');
const fs = require('fs');
const websocketStream = require('websocket-stream/stream');
const app = express();
const port = 8080;
// const intoStream = require('into-stream');
var apiKey="AIzaSyBsGGlwPghAxSwIhaRANfXBbV65fq2OMWM";
//google cloud speech to text API setup
// const record = require('node-record-lpcm16');
// Imports the Google Cloud client library
// const speech = require('@google-cloud/speech');

// Creates a client
// const client = new speech.SpeechClient();

// const encoding = 'LINEAR16';
// const sampleRateHertz = 48000;
// const languageCode = 'en-US';
const {Translate} = require('@google-cloud/translate');

// Your Google Cloud Platform project ID
const projectId = 'livesub-229106';

// Instantiates a client
const translate = new Translate({
    projectId: projectId,
});

// const request = {
//     config: {
//         encoding: encoding,
//         sampleRateHertz: sampleRateHertz,
//         languageCode: languageCode,
//     },
//     interimResults: true, // If you want interim results, set this to true
//     single_utterance: true,
// };



//express server setup
app.all('/', function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");
    next();
});
var WebSocketServer = require('ws').Server;
var wss = new WebSocketServer({ port: 40510 });
wss.on('connection', function (ws) {
    // Create a recognize stream
    // const recognizeStream = client
    // .streamingRecognize(request)
    // .on('error', function (e) {
    //     console.log('error');
    //     console.log(e);
    // })
    // .on('data', function (data) {

    //     process.stdout.write(
    //         data.results[0] && data.results[0].alternatives[0]
    //             ? `Transcription: ${data.results[0].alternatives[0].transcript}\n`
    //             : `\n\nReached transcription time limit, press Ctrl+C\n`
    //     );
    //     console.log(data);
    // }
    // );
    // ws.send(apikey);
    // recognizeStream.write(request);
    ws.on('message', function (data) {
        if(data==="key"){
            ws.send(apiKey);
        }
        
        //MODIFY: data.data.payload.text
        //RETURN: data.data
        //LANGUAGE: data.lang
        // data=JSON.parse(data);
        // const apikey="AIzaSyBsGGlwPghAxSwIhaRANfXBbV65fq2OMWM";
        // console.log("data: %j",data.data);
        // var requestURL = "https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=" +
        // data.lang + "&dt=t&q=" + encodeURI(data.data.payload.text)+"&key=";
        // var request = new XMLHttpRequest();
        // request.open('GET', requestURL);
        // request.responseType = 'text';
        // request.send();

        // console.log(requestURL);

        // request.onload = function () {
        //     let resp = JSON.parse('{"data":' + request.response + '}');
        //     console.log(resp);
        //     data.data.payload.text = resp.data[0][0][0];
        //     ws.send(data.data);
        // }
        // translate
        // .translate(data.data.payload.text, data.lang)
        // .then(results => {
        //     const translation = results.data;
        //     data.data.payload.text=translation;
        //     ws.send(data.data);
        // })
        // .catch(err => {
        //     console.error('ERROR:', err);
        //     ws.send(false);
        // });
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