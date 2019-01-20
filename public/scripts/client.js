// Global constants.
const ENTER_KEY = 13;
const MAX_SUBTITLE_LENGTH = 96; // Max subtitle characters to display.
const SUBTITLE_MULTILINE_THRESHOLD = 60; // In pixels. Subtitle height above this number = multiline styling.

// Chat platform
const chatTemplate = Handlebars.compile($('#chat-template').html());
const chatContentTemplate = Handlebars.compile($('#chat-content-template').html());
const chatEl = $('#chat');
const formEl = $('.form');
const messages = [];
var userName = 'Undefined User';
var inRoom = false;
var myUniqueId = "";
var subtitleParent = document.getElementById('subtitleParent');
var subtitle = document.getElementById('subtitle');
// Translation and speech.
// Translate -> Google Translate language code; HTML -> BCP-47.
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

function setSubtitleText(text) {

    subtitle.textContent = text;
    $( '.box' ).each(function ( i, box ) {

        var width = $( box ).width(),
            html = '<span style="white-space:nowrap"></span>',
            line = $( box ).wrapInner( html ).children()[ 0 ],
            n = 100;
    
        $( box ).css( 'font-size', n );
    
        while ( $( line ).width() > width ) {
            $( box ).css( 'font-size', --n );
        }
    
        $( box ).text( $( line ).text() );
    
    });
    var subtitleHeight = $('#subtitle').height();
    let isMultiLine = (subtitleHeight > SUBTITLE_MULTILINE_THRESHOLD);

    if (isMultiLine) {
        subtitleParent.style.bottom = '62px'; // TWO LINES: Push subtitles up.
    }
    else {
        subtitleParent.style.bottom = '34px'; // ONE LINE: Subtitle back to bottom.
    }
}

function capitalizeSentence(sentence) {
    let firstChar = sentence.charAt(0);
    let firstCharUpper = firstChar.toUpperCase();

    if(firstChar !== firstCharUpper) {
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
            let message = data.payload;

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
                    console.log(id);
                    if ($('#' + id + "_video_incoming").length > 0) {
                        if ($('#' + id + "_video_incoming").parent().attr('id') == 'spotlight') {
                            let fullText = subtitle.textContent;

                            if(fullText.length > 0) {
                                // Prepend a space if there is something already.
                                fullText += ' ';
                            }
                            
                            // Append the new sentence and period.
                            fullText += message.text + '.';

                            if (fullText.length > MAX_SUBTITLE_LENGTH) {
                                // Prepend ellipsis when previous sentences are cut off.
                                fullText = '...' + fullText.substr(fullText.length - MAX_SUBTITLE_LENGTH, fullText.length);
                            }

                            setSubtitleText(fullText);
                            updateChatMessages();
                            console.log('spotlight still speaking...');
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

                    console.log('updated');
                }

                updateChatMessages();
                /*
            }
*/
        }
    });

    // Remote video was added
    webrtc.on('videoAdded', (video, peer) => {
        console.log(remoteVideosCount + " videos, now adding", video);
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
    var ws = new WebSocket('ws://localhost:40510');
    // event emmited when connected
    // ws.onopen = function () {
    //     console.log('websocket is connected ...')
    //     // sending a send event to websocket server
    //     ws.send(JSON.stringify({'connected':[1,2,3,4],'isfake':true}))
    // }
    // event emmited when receiving message 
    ws.onmessage = function (ev) {
        console.log(ev);
    }
});
