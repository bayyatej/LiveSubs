// Global constants.
const ENTER_KEY = 13;

// Chat platform
const chatTemplate = Handlebars.compile($('#chat-template').html());
const chatContentTemplate = Handlebars.compile($('#chat-content-template').html());
const chatEl = $('#chat');
const formEl = $('.form');
const messages = [];
let userName = 'Undefined User';
var myUniqueId = "";
var subtitle = document.getElementById('subtitle');
// Translation and speech.
// Translate -> Google Translate language code, HTML -> BCP-47.
const languages = [
    { displayName: "English", translateLangCode: "en", htmlLangCode: "en-US" },
    { displayName: "French", translateLangCode: "fr", htmlLangCode: "fr-FR" },
    { displayName: "Chinese (Simplified)", translateLangCode: "zh-CN", htmlLangCode: "zh-CN" }
];

var languageIndex = 0; // Default to English.

// Local Video
const localVideoEl = $('#localVideo');

// Remote Videos
const remoteVideoTemplate = Handlebars.compile($('#remote-video-template').html());
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
    // Hide room join form.
    formEl.hide();
    const html = chatTemplate({ room });
    chatEl.html(html);

    $('#roomGrid').removeClass("center aligned page");
    $('#chatSegment').removeClass("login").addClass("right wide sidebar visible");

    // Post message for joining user.
    const joinMsg = {
        name: '',
        text: 'Hello, ' + userName + '. Welcome to ' + room + '!',
        type: 0,
        uniqueId: ''
    };

    messages.push(joinMsg);
    updateChatMessages();

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
    updateVideo(msg);
    updateChatMessages();
}

function updateVideo(message) {
    if (message.text.length < 1) {
        return;
    }
    console.log(message);
}

window.addEventListener('load', () => {
    // Setup language dropdown.
    $('#langDropdown').dropdown('set selected', 'English');

    $('#langDropdown').change(function() {
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
            //translate data
            const message = data.payload;
            messages.push(message);
            if (message.type==2){
                subtitle.textContent=message.text;
                console.log('updated');
            }
            //show this user
            updateChatMessages();
        }
    });

    // Remote video was added
    webrtc.on('videoAdded', (video, peer) => {
        const id = webrtc.getDomId(peer);
        const html = remoteVideoTemplate({ id });
        if (remoteVideosCount === 0) {
            $('#spotlight').html(html);
        } else {
            remoteVideosEl.append(html);
        }
        $(`#${id}`).html(video);
        remoteVideosCount += 1;
    });

    // //You speak
    // webrtc.on('volumeChange', function (volume, threshold)
    // {

    // });
});