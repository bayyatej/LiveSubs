// Global constants.
const ENTER_KEY = 13;

// Chat platform
const chatTemplate = Handlebars.compile($('#chat-template').html());
const chatContentTemplate = Handlebars.compile($('#chat-content-template').html());
const chatEl = $('#chat');
const formEl = $('.form');
const messages = [];
var userName = 'Undefined User';
var inRoom = false;
var myUniqueId = "";
var subtitle = document.getElementById('subtitle');
// Translation and speech.
// Translate -> Google Translate language code; HTML -> BCP-47.
const languages = [
    { // English
        displayName: "English",
        translateLangCode: "en",
        htmlLangCode: "en-US",
        maxSubtitleChars: 96
    },
    { // French
        displayName: "Français",
        translateLangCode: "fr",
        htmlLangCode: "fr-FR",
        maxSubtitleChars: 96
    },
    { // Chinese (Simplified)
        displayName: "中文 (简体)",
        translateLangCode: "zh-CN",
        htmlLangCode: "zh-CN",
        maxSubtitleChars: 48
    }
];

var languageIndex = 0; // Default to English.

// Local Video
const localVideoEl = $('#localVideo');

// Remote Videos
const remoteVideosEl = $('#remoteVideos');
let remoteVideosCount = 0;

// Register new Chat Room
const createRoom = (roomName) => {
    webrtc.createRoom(roomName, (err, name) => {
        showChatRoom(name);
    });
};

// Join existing Chat Room
const joinRoom = (roomName) => {
    webrtc.joinRoom(roomName);
    showChatRoom(roomName);
};

// create our WebRTC connection
const webrtc = new SimpleWebRTC({
    // the id/element dom element that will hold "our" video
    localVideoEl: 'localVideo',
    // the id/element dom element that will hold remote videos
    remoteVideosEl: 'remoteVideos',
    // immediately ask for camera access
    autoRequestMedia: true,
});

const showChatRoom = (room) => {
    inRoom = true;

    // Update chat header (room name and selected language).
    let lang = languages[languageIndex].displayName;
    const html = chatTemplate({ room, lang });
    chatEl.html(html);

    // Hide login screen.
    formEl.hide();
    $('#roomGrid').removeClass("center aligned page");
    $('#chatSegment').removeClass("login").addClass("right wide sidebar visible");

    // Clear chat/transcription log.
    messages.length = 0;

    // Post welcome message for yourself.
    const joinMsgLocal = {
        name: '',
        text: 'Hello, ' + userName + '. Welcome to ' + room + '!',
        type: 0,
        uniqueId: ''
    };

    messages.push(joinMsgLocal);
    updateChatMessages();

    // Broadcast the user's name to other users (200 ms delay to workaround bug).
    setTimeout(function () {
        const joinMsgOthers = {
            name: '',
            text: userName + ' joined the room!',
            type: 0,
            uniqueId: ''
        };

        webrtc.sendToAll('msg', joinMsgOthers);
    }, 200);

    // Setup messaging event listeners.
    $('#submitMsgBtn').on('click', () => {
        // Add listener for clicking submit button.
        const message = $('#msgField').val();
        postClientMessage(message);
    });
    $('#msgField').on('keydown', (event) => {
        // Add listener for pressing enter key.
        if (event.keyCode === ENTER_KEY) {
            const message = $('#msgField').val();
            postClientMessage(message);
        }
    });
};

// Post Local Message
const postClientMessage = (message) => {
    // Clear chat input field.
    $('#msgField').val('');

    // Remove whitespace padding.
    message = message.trim();

    if (message.length == 0) {
        return;
    }

    const msg = {
        name: userName,
        text: message,
        type: 1,
        uniqueId: myUniqueId
    };

    // Send message to all peers.
    webrtc.sendToAll('msg', msg);
    // Update our message list locally.
    messages.push(msg);
    updateChatMessages();
};

function send() {
    var number = {
        value: document.getElementById('num').value
    }
    var xhr = new window.XMLHttpRequest()
    xhr.open('POST', '/num', true)
    xhr.setRequestHeader('Content-Type', 'application/json;charset=UTF-8')
    xhr.send(JSON.stringify(number))
}

function setSubtitleText(text) {
    subtitle.textContent = text;
    let subParent = $('#subtitleParent');
    let curFontSize = 32;
    let targetSubtitleHeight = curFontSize * 2; // Desired subtitles element height to approx. two lines.

    subParent.css('font-size', curFontSize);

    while(subParent.height() > targetSubtitleHeight) {
        subParent.css('font-size', curFontSize);
        curFontSize--;
    }
    
    // Automatically anchor subtitles to bottom of spotlight video.
    subParent.css('bottom', subParent.height() + 10) + 'px';
}

function capitalizeSentence(sentence) {
    let firstChar = sentence.charAt(0);
    let firstCharUpper = firstChar.toUpperCase();

    if (firstChar !== firstCharUpper) {
        return firstCharUpper + sentence.substring(1);
    }

    return sentence; // Already capitalized.
}

// Update Chat Messages
const updateChatMessages = () => {
    const html = chatContentTemplate({ messages });
    const chatContentEl = $('#chatList');
    chatContentEl.html(html);

    // automatically scroll to the bottom.
    const scrollHeight = chatContentEl.prop('scrollHeight');
    chatContentEl.animate({ scrollTop: scrollHeight }, 150);
};

window.addEventListener('load', () => {
    // Setup language dropdown.
    $('#langDropdown').dropdown('set selected', 'English');

    $('#langDropdown').change(function () {
        // Update language index.
        languageIndex = $('#langDropdown').dropdown('get value');
    });

    // Set a new helper function for comparison in Handlebars.
    Handlebars.registerHelper('equals', function (v1, v2, options) {
        if (v1 === v2) {
            return options.fn(this);
        }
        else {
            return options.inverse(this);
        }
    });

    // Add validation rules to Create/Join Room Form
    formEl.form({
        fields: {
            roomName: 'empty',
            userName: 'empty'
        },
    });

    // We got access to local camera
    webrtc.on('localStream', (AVStream) => {
        myUniqueId = webrtc.connection.connection.id;

        beginSpeechRecognition(AVStream);
        localVideoEl.show();
    });

    $('.submit').on('click', (event) => {
        if (!formEl.form('is valid')) {
            return false;
        }
        userName = $('#userName').val();
        const roomName = $('#roomName').val();
        if (event.target.id === 'createBtn') {
            createRoom(roomName);
        }
        else {
            joinRoom(roomName);
        }
        return false;
    });

    // Receive message from remote user
    webrtc.connection.on('message', (data) => {
        if (data.type === 'msg') {
            // Received message data from room, chat messages, transcriptions, etc.
            let message = data.payload;
            let maxSubChars = languages[languageIndex].maxSubtitleChars;

            // Translate the message!
            /*
            var requestURL = "https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=" +
                languages[languageIndex].translateLangCode + "&dt=t&q=" + encodeURI(message.text);
            var request = new XMLHttpRequest();
            request.open('GET', requestURL);
            request.responseType = 'text';
            request.send();

            console.log(requestURL);

            request.onload = function () {
                let resp = JSON.parse('{"data":' + request.response + '}');
                console.log(resp);
                message.text = resp.data[0][0][0];*/
            messages.push(message);

            if (message.type == 2) {
                // Received transcription data.

                let id = message.uniqueId;
                // console.log(id);
                if ($('#' + id + "_video_incoming").length > 0) {
                    if ($('#' + id + "_video_incoming").parent().attr('id') == 'spotlight') {
                        let fullText = subtitle.textContent;

                        if (fullText.length > 0) {
                            // Prepend a space if there is something already.
                            fullText += ' ';
                        }

                        // Append the new sentence and period.
                        fullText += message.text + '.';

                        if (fullText.length > maxSubChars) {
                            // Prepend ellipsis when previous sentences are cut off.
                            fullText = '...' + fullText.substr(fullText.length - maxSubChars, fullText.length);
                        }

                        setSubtitleText(fullText);
                        updateChatMessages();
                        // console.log('spotlight still speaking...');
                        return;
                    }

                    // Move spotlight to user who just spoke
                    setSubtitleText(message.text); // Reset subtitle.
                    let newSpotlight = $('#' + id + "_video_incoming").detach();
                    let oldSpotlight = $('#spotlight').children("video").detach();
                    //console.log(newSpotlight);
                    //console.log(oldSpotlight);

                    // Swap places with spotlight and small video.
                    $('#spotlight').prepend(newSpotlight);
                    $('#remoteVideos').append(oldSpotlight);
                }
            }

            updateChatMessages();
        }
    });

    // Remote video was added
    webrtc.on('videoAdded', (video, peer) => {
        // console.log(remoteVideosCount + " videos, now adding", video);
        const id = webrtc.getDomId(peer);
        if (remoteVideosCount === 0) {
            $('#spotlight').prepend(video);
        }
        else {
            remoteVideosEl.append(video);
        }
        // $(`#${id}`).html(video);
        remoteVideosCount += 1;
    });
});
