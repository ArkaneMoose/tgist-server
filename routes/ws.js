const express = require('express');
const router = express.Router();

const channels = {
    speech: new Set(),
};

router.ws('/speech', (ws, req) => {
    channels.speech.add(ws);
    ws.on('message', msg => {
        Array.from(channels.speech)
            .filter(that => that !== ws)
            .forEach(ws => ws.send(msg));
    });
    ws.on('close', () => {
        channels.speech.delete(ws)
    });
});

module.exports = router;
