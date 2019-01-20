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
// Translate -> Google Translate language code, HTML -> BCP-47.
const languages = [
    { displayName: "English", translateLangCode: "en", htmlLangCode: "en-US" },
    { displayName: "Français", translateLangCode: "fr", htmlLangCode: "fr-FR" },
    { displayName: "中文 (简体)", translateLangCode: "zh-CN", htmlLangCode: "zh-CN" }
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

// Update Chat Messages
const updateChatMessages = () => {
    const html = chatContentTemplate({ messages });
    const chatContentEl = $('#chatList');
    chatContentEl.html(html);

    // automatically scroll to the bottom.
    const scrollHeight = chatContentEl.prop('scrollHeight');
    chatContentEl.animate({ scrollTop: scrollHeight }, 150);
};

function transmitSpeech(message) {
    if (!inRoom) {
        return; // Don't transcribe audio when inside room.
    }

    message = message.trim(); // Remove whitespace.

    if (message.length == 0) {
        return;
    }

    const msg = {
        name: userName,
        text: message,
        type: 2,
        uniqueId: myUniqueId
    };

    // Send message to all peers.
    webrtc.sendToAll('msg', msg);
    // Update our message list locally.
    messages.push(msg);
    updateChatMessages();
}


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
    webrtc.on('localStream', () => {
        myUniqueId = webrtc.connection.connection.id;

        beginSpeechRecognition();
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
            const message = data.payload;
            messages.push(message);

            if (message.type == 2) {
                // Received transcription data.
                subtitle.textContent = message.text;
                let id = message.uniqueId;
                console.log(id);
                if ($('#' + id + "_video_incoming").length > 0) {
                    console.log('found id');
                    if ($('#' + id + "_video_incoming").parent().attr('id') == 'spotlight') {
                        console.log('its already there');
                        return;
                    }

                    let newSpotlight = $('#' + id + "_video_incoming").detach();
                    let oldSpotlight = $('#spotlight').children().detach();
                    console.log(newSpotlight);
                    console.log(oldSpotlight);
                    $('#spotlight').append(newSpotlight);
                    $('#remoteVideos').append(oldSpotlight);
                }
                console.log('updated');
            }

            updateChatMessages();
        }
    });

    // Remote video was added
    webrtc.on('videoAdded', (video, peer) => {
        console.log(remoteVideosCount + " videos, now adding", video);
        const id = webrtc.getDomId(peer);
        if (remoteVideosCount === 0) {
            $('#spotlight').append(video);
        } else {
            remoteVideosEl.append(video);
        }
        // $(`#${id}`).html(video);
        remoteVideosCount += 1;
    });
});
