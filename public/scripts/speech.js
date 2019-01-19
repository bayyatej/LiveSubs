function beginSpeechRecognition(){
    console.log('began');
    window.SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
    const recognition=new window.SpeechRecognition();
    recognition.lang=lang_HTML5;
    // recognition.interimResults=true;
    recognition.onresult = (event) => {
        const speechToText = event.results[0][0].transcript;
        transmitSpeech(speechToText);
        console.log(speechToText);
    }
    recognition.onaudiostart=function(event){
        console.log('started');
    }
    recognition.onaudioend=function(event){
        console.log('ended');
        recognition.stop();
        startRecognition(25);
    }
    function startRecognition(delay){
        setTimeout(function(){
            try{
                recognition.start();
            }catch(e){
                startRecognition(delay);
            }
        },delay)
    }
    recognition.start();
}