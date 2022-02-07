console.log(process.env.NODE_ENV);

require('dotenv').config();
const express = require('express');
const multer = require('multer');
// const upload = multer({dest: 'tmp_uploads/'});
const upload = require(__dirname + '/modules/upload-imgs');
const fs = require('fs').promises;

const app = express();

app.set('view engine', 'ejs');
/*
app.get('/a.html', (req, res)=>{
    res.send(`<h2>動態內容</h2><p>${Math.random()}</p>`);
});
*/

// Top-level middleware
app.use(express.urlencoded({extended: false}));
app.use(express.json());
app.use(express.static('public'));



app.get('/', (req, res)=>{
    res.render('home', {name:'Shinder'});
});

app.get('/a/b', (req, res)=>{
    res.render('home', {name:'Shinder'});
});


app.get('/json-sales', (req, res)=>{
    // req.query.orderByCol=age
    // req.query.orderByRule=desc

    const sales = require('./data/sales');  // 進來變成陣列
    // TODO: 排序
    console.log(sales);
    res.render('json-sales', {sales});
    
});

app.get('/try-qs', (req, res)=>{
    res.json(req.query);
});


app.post('/try-post', (req, res)=>{
    res.json(req.body);
});

app.get('/try-post-form', (req, res)=>{
    res.render('try-post-form');
});
app.post('/try-post-form', (req, res)=>{
    res.render('try-post-form', req.body);
});

app.post('/try-upload', upload.single('avatar'), async (req, res)=>{
    res.json(req.file);
    /*
    const types = ['image/jpeg', 'image/png'];
    const f = req.file;
    if(f && f.originalname){
        if(types.includes(f.mimetype)){
            await fs.rename(f.path, __dirname + '/public/img/' + f.originalname);
            return res.redirect('/img/' + f.originalname);
        } else {
            return res.send('檔案類型不符');
        }
    }
    res.send('bad');
    */
});

app.post('/try-uploads', upload.array('photos'), async (req, res)=>{
    const result = req.files.map(({mimetype, filename, size}) => {
        return {mimetype, filename, size};
    });

    /*
    const result = req.files.map(el => {
        return {
            "mimetype": el.mimetype,
            "filename": el.filename,
            "size": el.size
        }
    });
*/
    res.json(result);
});

app.get('/aa', (req, res)=>{
    // 錯誤的作法
    res.send('aaa');
    res.send('bbb');
});

app.get('/my-params1/:action?/:id?', (req, res)=>{
    res.json(req.params);
});

app.get(['/xxx', '/yyy'], (req, res)=>{
    res.json({x:'y', url: req.url});
});

app.get(/^\/m\/09\d{2}-?\d{3}-?\d{3}$/i, (req, res)=>{
    let u = req.url.split('?')[0];
    u = u.slice(3);
    
    // 用空字串取代掉所有的 -
    u = u.replace(/-/g, '');  // u = u.split('-').join('');

    res.json({mobile: u});
});


// ********** 所有路由的後面
app.use((req, res)=>{
    res.status(404).send(`<h2>走錯路了</h2>`);
});

const port = process.env.PORT || 3001;
app.listen(port, ()=>{
    console.log(`server started: ${port} - `, new Date());
});