const express = require('express');
const router = express.Router();

const channels = {
    speech: [],
};

router.ws('/speech/send', (ws, req) => {
    ws.on('message', msg =>
        channels.speech.forEach(ws => ws.send(msg))
    );
});

router.ws('/speech/recv', (ws, req) => {
    channels.speech.push(ws);
    ws.on('close', () =>
        channels.speech = channels.speech.filter(that => that !== ws)
    );
});

module.exports = router;
