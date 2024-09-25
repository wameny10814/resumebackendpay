console.log(process.env.NODE_ENV);

require('dotenv').config();
const express = require('express');
const session = require('express-session');
const MysqlStore = require('express-mysql-session')(session);
const moment = require('moment-timezone');
const multer = require('multer');
// const upload = multer({dest: 'tmp_uploads/'});
// const upload = require(__dirname + '/modules/upload-imgs');
const fs = require('fs').promises;
// const db = require('./modules/connect-db');
// const sessionStore = new MysqlStore({}, db);
const cors = require('cors');
const fetch = require('node-fetch');
const axios = require('axios');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();

app.set('view engine', 'ejs');


// Top-level middleware
const corsOptions = {
    credentials: true,
    origin: function(origin, cb){
        console.log({origin});
        cb(null, true);
    }
};
app.use(cors(corsOptions));
app.use(express.urlencoded({extended: false})); // application/x-www-form-urlencoded
app.use(express.json()); // application/json
app.use(express.static('public'));
app.use('/joi', express.static('node_modules/joi/dist/'));


app.use('/admin2',  require('./routes/admin2') );













// ********** 所有路由的後面
app.use( (req, res)=>{
    res.status(404).send(`<h2>走錯路了</h2>`);
});

const port = process.env.PORT || 3001;
app.listen(port, ()=>{
    console.log(`server started: ${port} - `, new Date());
});