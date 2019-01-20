function beginSpeechRecognition() {
    console.log('began');
    
    window.SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
    
    const recognition = new window.SpeechRecognition();
    recognition.onresult = (event) => {
        const speechToText = event.results[0][0].transcript;
        transmitSpeech(speechToText);
    }
    recognition.onaudiostart = function (event) {
    }
    recognition.onaudioend = function (event) {
        recognition.stop();
        startRecognition(25);
    }
    function startRecognition(delay) {
        setTimeout(function () {
            try {
                recognition.lang = languages[languageIndex].htmlLangCode;
                recognition.start();
            } catch (e) {
                startRecognition(delay);
            }
        }, delay)
    }
    // Start recognition loop.
    recognition.start();

    function startRecognition(delay) {
        setTimeout(function () {
            try {
                recognition.lang = languages[languageIndex].htmlLangCode;
                recognition.start();
            } catch (e) {
                startRecognition(delay);
            }
        }, delay)
    }

    // Start recognition loop.
    startRecognition(10);
}

function transmitSpeech(message) {
    if (!inRoom) {
        return; // Don't transcribe audio when not connected to a room.
    }

    message = message.trim(); // Remove whitespace.

    if (message.length == 0) {
        return;
    }

    // Capitalize the transcribed message, we are treating it as a sentence.
    message = capitalizeSentence(message);

    if(message.charAt(message.length - 1) == '.') {
        // Remove periods picked up (sometimes) from the speech recognition.
        // We are automatically handling this.
        message = message.substring(0, message.length - 1);
    }

    const msg = {
        name: userName,
        text: message,
        type: 2,
        uniqueId: myUniqueId,
        sl: languages[languageIndex]['translateLangCode']
    };

    // Send message to all peers.
    webrtc.sendToAll('msg', msg);

    // Update our message list locally.
    messages.push(msg);
    updateChatMessages();
}