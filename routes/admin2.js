const express = require('express');

const router = express.Router();

router.get('/', (req, res)=>{
    res.send('admin2: root');
});

router.get('/:p1?/:p2?', (req, res)=>{
    let {
        params,
        url,
        originalUrl,
        baseUrl,
    } = req;

    res.json({
        params,
        url,
        originalUrl,
        baseUrl,
    });
});

module.exports = router;

