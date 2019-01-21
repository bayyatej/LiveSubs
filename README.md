# LiveSubs
LiveSubs is a video chat web application that utilizes real-time translation captioning to improve communication between multiple cultures. Whether it is a simple video call with your friends across the world or an international business meeting, LiveSubs has you covered!

It uses the SimpleWebRTC API to establish P2P video chatting between users. Livesubs leverages the Google Translate API on Google Cloud Platform as well as Google Cloud App Engine to deliver fast accurate chat captions in real-time. 
Livesubs lives on a Node Express server and uses a WebSocket server to make API calls.

This was created during the 36-hour hackathon, [SpartaHack V](https://github.com/bayyatej/livesubs).

# Libraries/Packages Used
- [Node.js](https://nodejs.org)
- [SimpleWebRTC](https://www.simplewebrtc.com/)
- [Express](https://expressjs.com/)
- [Semantic UI](https://semantic-ui.com/)
- [Hark](https://www.npmjs.com/package/hark)
- [Handlebars](http://handlebarsjs.com/)
- [Into-Stream](https://github.com/sindresorhus/into-stream)
- [dotenv](https://github.com/motdotla/dotenv#readme)
- Many others can be viewed in package.json

# Services Used
- Google Cloud App Engine
- Google Translate API
- HTML5 Speech-to-Text API
