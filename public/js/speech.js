const SPEECH_AUTHORIZATION_ENDPOINT = '/api/speechtoken';
const SPEECH_SEND_SOCKET_ENDPOINT = `${location.protocol === 'https:' ? 'wss:' : 'ws:'}//${location.host}/ws/speech/send`;

document.addEventListener('DOMContentLoaded', () => {
    const startBtn = document.getElementById('start');
    const endBtn = document.getElementById('end');
    const xferBtn = document.getElementById('xfer');
    const agentRadio = document.getElementById('speaker-agent');
    const customerRadio = document.getElementById('speaker-customer');
    const socket = new WebSocket(SPEECH_SEND_SOCKET_ENDPOINT);
    let authorizationToken, serviceRegion;
    let speechConfig, audioConfig, recognizer, speaker, recognizing;

    const getSpeaker = () => {
        if (agentRadio.checked) return 'agent';
        if (customerRadio.checked) return 'customer';
    };

    startBtn.addEventListener('click', () => {
        speaker = getSpeaker();

        document.body.classList.add('speech-in-progress');
        document.body.classList.remove('speech-ready');

        if (recognizer) {
            recognizer.close();
        }
        recognizer = new SpeechSDK.SpeechRecognizer(speechConfig, audioConfig);

        // The event recognizing signals that an intermediate recognition result is received.
        // You will receive one or more recognizing events as a speech phrase is recognized, with each containing
        // more recognized speech. The event will contain the text for the recognition since the last phrase was recognized.
        recognizer.recognizing = (s, e) => {
            recognizing = true;
            socket.send(JSON.stringify({
                type: 'recognizing',
                speaker: speaker,
                result: e.result.text || '',
            }));
        };
        // The event recognized signals that a final recognition result is received.
        // This is the final event that a phrase has been recognized.
        // For continuous recognition, you will get one recognized event for each phrase recognized.
        recognizer.recognized = (s, e) => {
            if (!recognizing && !e.result.text) {
                return;
            }
            recognizing = false;
            socket.send(JSON.stringify({
                type: 'recognized',
                speaker: speaker,
                result: e.result.text || '',
            }));
        };
        // Signals the end of a session with the speech service.
        recognizer.sessionStopped = (s, e) => {
            document.body.classList.add('speech-ready');
            document.body.classList.remove('speech-in-progress');
        };

        recognizer.startContinuousRecognitionAsync(
            () => {},
            err => {
                console.error(err);
                document.body.classList.add('speech-ready');
                document.body.classList.remove('speech-in-progress');
            }
        );
        recognizing = false;
    });

    endBtn.addEventListener('click', e => {
        recognizer.stopContinuousRecognitionAsync(
            () => {
                document.body.classList.add('speech-ready');
                document.body.classList.remove('speech-in-progress');
            },
            err => {
                console.error(err);
            }
        );

        e.preventDefault();
        return false;
    });

    xferBtn.addEventListener('click', e => {
        socket.send(JSON.stringify({ type: 'transfer' }));
    })

    Promise.all([
        fetch(SPEECH_AUTHORIZATION_ENDPOINT).then(res => res.text()).then(text => {
            authorizationToken = text;
            serviceRegion = JSON.parse(atob(authorizationToken.split('.')[1])).region;
        }),
        new Promise(resolve => { socket.addEventListener('open', resolve); }),
    ]).then(() => {
        document.body.classList.add('speech-ready');
        document.body.classList.remove('speech-in-progress');

        speechConfig = SpeechSDK.SpeechConfig.fromAuthorizationToken(authorizationToken, serviceRegion);
        speechConfig.speechRecognitionLanguage = 'en-US';
        audioConfig = SpeechSDK.AudioConfig.fromDefaultMicrophoneInput();
    });
});
