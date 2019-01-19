
// Chat platform
const chatTemplate = Handlebars.compile($('#chat-template').html());
const chatContentTemplate = Handlebars.compile($('#chat-content-template').html());
const chatEl = $('#chat');
const formEl = $('.form');
const messages = [];
let userName = 'Undefined User';
var lang_HTML5='en-US';
var lang_
// Local Video
const localImageEl = $('#localImage');
const localVideoEl = $('#localVideo');

// Remote Videos
const remoteVideoTemplate = Handlebars.compile($('#remote-video-template').html());
const remoteVideosEl = $('#remoteVideos');
let remoteVideosCount = 0;

// Register new Chat Room
const createRoom = (roomID) => {
    webrtc.createRoom(roomID, (err, name) => {
        showChatRoom(name);
    });
};

// Join existing Chat Room
const joinRoom = (roomID) => {
    webrtc.joinRoom(roomID);
    showChatRoom(roomID);
};

// Post Local Message
const postClientMessage = (message) => {
    const msg = {
        userName,
        message
    };

    // Send message to all peers.
    webrtc.sendToAll('chat', msg);
    // Clear chat input field.
    $('#msgField').val('');
    // Update our message list locally.
    messages.push(msg);
    updateChatMessages();
};
function send () {
    var number = {
      value: document.getElementById('num').value
    }
    var xhr = new window.XMLHttpRequest()
    xhr.open('POST', '/num', true)
    xhr.setRequestHeader('Content-Type', 'application/json;charset=UTF-8')
    xhr.send(JSON.stringify(number))
  }
// Display Chat Interface
const showChatRoom = (room) => {
    // Hide room join form.
    formEl.hide();
    const html = chatTemplate({ room });
    chatEl.html(html);
    const postForm = $('form');

    // Post Message Validation Rules
    postForm.form({
        message: 'empty',
    });

    // Post message for joining user.
    const joinMsg = {
        userName: 'Room',
        message: 'Hello, ' + userName + '. Welcome to ' + room + '!'
    };

    messages.push(joinMsg);
    updateChatMessages();

    $('#submitMsgBtn').on('click', () => {
        const message = $('#msgField').val();
        postClientMessage(message);
    });
    $('#msgField').on('keydown', (event) => {
        // Add listener for enter key.
        if (event.keyCode === 13) {
            const message = $('#msgField').val();
            postClientMessage(message);
        }
    });
};

// Update Chat Messages
const updateChatMessages = () => {
    const html = chatContentTemplate({ messages });
    const chatContentEl = $('#chatList');
    chatContentEl.html(html);

    // automatically scroll to the bottom.
    const scrollHeight = chatContentEl.prop('scrollHeight');
    chatContentEl.animate({ scrollTop: scrollHeight }, 150);
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

window.addEventListener('load', () => {
    // Add validation rules to Create/Join Room Form
    formEl.form({
        fields: {
            roomID: 'empty',
            userName: 'empty',
        },
    });

    // We got access to local camera
    webrtc.on('localStream', () => {
        localImageEl.hide();
        localVideoEl.show();
    });

    $('.submit').on('click', (event) => {
        if (!formEl.form('is valid')) {
            return false;
        }
        userName = $('#userName').val();
        const roomID = $('#roomID').val();
        if (event.target.id === 'createBtn') {
            createRoom(roomID);
        }
        else {
            joinRoom(roomID);
        }
        return false;
    });

    // Receive message from remote user
    webrtc.connection.on('message', (data) => {
        if (data.type === 'chat') {
            const message = data.payload;
            messages.push(message);
            updateChatMessages();
        }
    });

    // Remote video was added
    webrtc.on('videoAdded', (video, peer) => {
        const id = webrtc.getDomId(peer);
        const html = remoteVideoTemplate({ id });
        if (remoteVideosCount === 0) {
            remoteVideosEl.html(html);
        } else {
            remoteVideosEl.append(html);
        }
        $(`#${id}`).html(video);
        $(`#${id} video`).addClass('ui image medium');
        remoteVideosCount += 1;
    });
});