const express = require('express');
const req = require('express/lib/request');
const res = require('express/lib/response');
// const db = require(__dirname + "/../modules/mysql-connect");
const mariadb = require('mariadb');
const multer = require('multer');
const path = require('path');

const axios = require('axios');
const hmacSHA256 = require('crypto-js/hmac-sha256');
const CryptoJS = require('crypto-js');


const Base64 = require('crypto-js/enc-base64');
const bodyParser = require('body-parser');

const router = express.Router();
const nodemailer = require("nodemailer");
const { date } = require('joi');
const { log } = require('console');

const cors = require('cors');





// 環境變數
const {
    LINEPAY_CHANNEL_ID,
    LINEPAY_RETURN_HOST,
    LINEPAY_SITE,
    LINEPAY_VERSION,
    LINEPAY_CHANNEL_SECRET_KEY,
    LINEPAY_RETURN_CONFIRM_URL,
    LINEPAY_RETURN_CANCEL_URL,
    CONTACT_MAIL,
    CONTACT_MAIL_USER,
    CONTACT_MAIL_PASS,
} = process.env;

const pool = mariadb.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    connectionLimit: 5
});

// 配置 Multer 的存儲選項
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      // 設定文件存儲的目錄
    cb(null, 'public/uploads/');
},
filename: function (req, file, cb) {
    // 設定文件名，例如：1234567890.jpg
    cb(null, Date.now() + path.extname(file.originalname));
}
});

// 創建 Multer 上傳中間件
const upload = multer({ storage: storage });

router.use(bodyParser.json({ limit: '10mb' })); // 設置 JSON 數據解析大小限制
router.use(bodyParser.urlencoded({ limit: '10mb', extended: true })); // 設置 URL 編碼數據的解析大小限制




// 自訂的 middleware
// router.use((req, res, next) => {
//     res.locals.shin += ' admin2';
//     next();
// });

router.get('/test', async (req, res) => {
    
        res.json({
            'message': '訂單金額為零'
        })
    
})
let orders = {};
router.post('/checkout', async (req, res) => {
    let frontendData = req.body;
    // console.log('frontendData', frontendData);
    frontendData = frontendData.filter((data) => data.id !== 0)
    let frontendDataDeleAttr = [];
    const DeletAttr = () => {
        for (let i = 0; i < frontendData.length; i++) {
            delete frontendData[i].incre;
            delete frontendData[i].decre;
            delete frontendData[i].total;
            delete frontendData[i].key;
            delete frontendData[i].firstname;
            delete frontendData[i].lastname;
            delete frontendData[i].emial;
            delete frontendData[i].address;
            delete frontendData[i].orderdate;
        }
        return frontendData;

    }
    DeletAttr();
    // console.log('afterDeleAttr', frontendData)
    let package = []

    const packageGenerate = () => {
        for (let i = 0; i < frontendData.length; i++) {
            package.push({
                id: 'donuts',
                amount: frontendData[i].price * frontendData[i].quantity,
                products: [
                    frontendData[i]
                ]
            })
        }
        return package;
    }
    packageGenerate();
    // console.log('afterpackageGenerate', package);

    // after
    // { name: '豆漿波堤', price: 40, id: 1, quantity: 1 },
    // { name: '原味波堤', price: 35, id: 2, quantity: 1 }

    let order = {
        amount: frontendData.map((data) => data.price * 1 * data.quantity).reduce((a, b) => a + b),//package.amount 相加
        currency: 'TWD',
        orderId: parseInt(new Date().getTime() / 1000),
        packages: package,
    };
    // console.log('order', order);
    if (order) {
        //後端收到訂單打line api('/payments/request')
        try {
            // console.log('try', order)
            let linepayBody = {
                ...order,
                'redirectUrls': {
                    confirmUrl: `${LINEPAY_RETURN_HOST}${LINEPAY_RETURN_CONFIRM_URL}`,
                    cancelUrl: `${LINEPAY_RETURN_HOST}${LINEPAY_RETURN_CANCEL_URL}`,
                },
            };
            // console.log('linepayBody', linepayBody)
            const uri = '/payments/request';
            const nonce = parseInt(new Date().getTime() / 1000);

            const signature = Base64.stringify(hmacSHA256(`${LINEPAY_CHANNEL_SECRET_KEY}/${LINEPAY_VERSION}${uri}${JSON.stringify(linepayBody)}${nonce}`, LINEPAY_CHANNEL_SECRET_KEY,));
            // console.log('signature', signature);
            const headers = {
                'X-LINE-ChannelId': LINEPAY_CHANNEL_ID,
                'Content-Type': 'application/json',
                'X-LINE-Authorization-Nonce': nonce,
                'X-LINE-Authorization': signature,
            };
            // console.log('headers', headers);
            const posturi = `${LINEPAY_SITE}/v3/payments/request`;

            const linePayRes = await axios.post(posturi, linepayBody, { headers });
            console.log('linePayRes', linePayRes);
            console.log('linePayRes', linePayRes.data.info);
            if (linePayRes?.data?.returnCode === '0000') {
                res.json(linePayRes.data.info);
            }

        } catch (error) {
            console.log('error', error);
            res.end();
        }

    } else {
        res.json({
            'message': '訂單金額為零'
        })
    }
    //order insert orderID to fit in line pay 資料結構
    // order.orderId = parseInt(new Date().getTime() / 1000);
    // orders[order.orderId]=order;
    // orders {
    //     '1678452076': {
    //       amount: 1000,
    //       currency: 'TWD',
    //       packages: [ [Object] ],
    //       orderID: 1678452076
    //     }
    //   }
    //   checkout order {
    //     amount: 1000,
    //     currency: 'TWD',
    //     packages: [ { id: 'products_1', amount: 1000, products: [Array] } ],
    //     orderID: 1678452076
    //   }

})

///測試用
router.post('/createOrder/:orderid', async (req, res) => {
    const { orderid } = req.params;
    let order = orders[orderid];
    // console.log('createOrder orderid', orderid)
    // console.log('createOrder orders', orders)
    // console.log('createOrder order', order)
    // createOrder orders {
    //     '1678452076': {
    //       amount: 1000,
    //       currency: 'TWD',
    //       packages: [ [Object] ],
    //       orderID: 1678452076
    //     }
    //   }
    // createOrder order {
    //     amount: 1000,
    //     currency: 'TWD',
    //     packages: [ { id: 'products_1', amount: 1000, products: [Array] } ],
    //     orderID: 1678452076
    //   }


    // line api Signature 格式(from document)
    // Signature = Base64(HMAC-SHA256(Your ChannelSecret, (Your ChannelSecret + URI + RequestBody + nonce)))
    try {
        let linepayBody = {
            ...order,
            'currency': 'TWD',
            'redirectUrls': {
                confirmUrl: `${LINEPAY_RETURN_HOST}${LINEPAY_RETURN_CONFIRM_URL}`,
                cancelUrl: `${LINEPAY_RETURN_HOST}${LINEPAY_RETURN_CANCEL_URL}`,
            },
        };
        // console.log('linepayBody', linepayBody)
        const uri = '/payments/request';
        const nonce = parseInt(new Date().getTime() / 1000);

        const signature = Base64.stringify(hmacSHA256(`${LINEPAY_CHANNEL_SECRET_KEY}/${LINEPAY_VERSION}${uri}${JSON.stringify(linepayBody)}${nonce}`, LINEPAY_CHANNEL_SECRET_KEY,));
        const headers = {
            'X-LINE-ChannelId': LINEPAY_CHANNEL_ID,
            'Content-Type': 'application/json',
            'X-LINE-Authorization-Nonce': nonce,
            'X-LINE-Authorization': signature,
        };
        // console.log('headers', headers);
        const posturi = `${LINEPAY_SITE}/v3/payments/request`;
        const linePayRes = await axios.post(posturi, linepayBody, { headers });
        console.log('linePayRes', linePayRes.data.info);
        if (linePayRes?.data?.returnCode === '0000') {
            res.json(linePayRes.data.info);
            // res.redirect(linePayRes?.data?.info?.web)
        } else {
            console.log('end')
        };

        // res.json(order);

    } catch (error) {
        console.log('error', error);
        res.end();
    }

})

router.get('/confirm', async (req, res) => {
    const { transactionId, orderId } = req.query;
    const order = orders[orderId];

    try {
        let linepayBody = {
            "amount": order.amount,
            'currency': 'TWD',
        };
        // console.log('linepayBody', linepayBody)
        // 文件 POST /v3/payments/{transactionId}/confirm
        const uri = `/payments/${transactionId}/confirm`;
        const nonce = parseInt(new Date().getTime() / 1000);

        const signature = Base64.stringify(hmacSHA256(`${LINEPAY_CHANNEL_SECRET_KEY}/${LINEPAY_VERSION}${uri}${JSON.stringify(linepayBody)}${nonce}`, LINEPAY_CHANNEL_SECRET_KEY,));
        const headers = {
            'X-LINE-ChannelId': LINEPAY_CHANNEL_ID,
            'Content-Type': 'application/json',
            'X-LINE-Authorization-Nonce': nonce,
            'X-LINE-Authorization': signature,
        };
        // console.log('headers', headers);
        const posturi = `${LINEPAY_SITE}/v3/payments/${transactionId}/confirm`;
        const linePayRes = await axios.post(posturi, linepayBody, { headers });
        console.log('linePayRes', linePayRes);
        if (linePayRes?.data?.returnCode === '0000') {
            // res.json(linePayRes.data.info);
            res.redirect('http://localhost:3000/linePay/confirm')
        } else {
            console.log('end')
        };

        // res.json(order);

    } catch (error) {
        console.log('error', error);
        res.end();
    }
})

router.post('/gotopay', async (req, res) => {
    let date = new Date();
    const sql =
    "INSERT INTO `cartlist`(`productname`, `price`, `quantity`, `total`, `firstname`, `lastname`,`email`,`address`,`orderid`,`orderdate`,`section`,`gender`,`birthday`) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)";

    try {
        const conn = await pool.getConnection(); 
        try {
            for (const value of req.body) {
                await conn.query(sql, [
                    value.name, 
                    value.price, 
                    value.quantity, 
                    value.total,
                    value.firstname,
                    value.lastname,
                    value.email,
                    value.address,
                    value.orderid,
                    date,
                    value.section,
                    value.gender,
                    value.birthday
                ]);
            }

            const result = { success: true };
            res.json(result);
        } catch (err) {
            console.error('Database query error:', err);
            res.json({ success: false, error: err.message });
        } finally {
            conn.release(); 
        }
    } catch (error) {
        console.error('Connection error:', error);
        res.json({ success: false, error: error.message });
    }
});

router.post('/contactus', async (req, res) => {
    const { name, email, context } = req.body;
    const output = {
        success: false,
    };
    const transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 465,
        auth: {
            user: CONTACT_MAIL_USER,
            pass: CONTACT_MAIL_PASS,
        },
    });
    //信件內容!!!!
    var options = {
        //寄件者
        from: email,
        //收件者
        to: CONTACT_MAIL,
        //副本
        // cc: 'account3@gmail.com',
        //密件副本
        // bcc: 'account4@gmail.com',
        //主旨
        subject: "來自" + name + "客服訊息", // Subject line
        //純文字
        text: " ", // plaintext body
        //嵌入 html 的內文
        html: `
        <p>來自${name}的訊息</p>
        <p>聯絡方式: ${email}</p>
        <p>信件內容如下:</p>
        <p>${context}</p>`,
        //附件檔案
    };

    // 信件發送!!!
    transporter.sendMail(options, function (error, info) {
        if (error) {
            console.log(error);
        } else {
            console.log("訊息發送: " + info.response);
        }
    });
    const result = { ...output, success: true };
    res.json(result);

})

router.post('/getproductlist', async (req, res) => {


    const { currentpage } = req.body;
    const output = {
        success: false,
    };

    const sql = `SELECT * FROM prosuctlist WHERE sid BETWEEN ? AND ? AND status = 1`;
    const params = [currentpage * 10 - 9, currentpage * 10];


    pool
    .getConnection()
    .then((conn) => {
        conn
        .query(sql,params)
        .then((rows) => {
            // rows.forEach((row) => {
            // console.log(`name: ${row.name}, sid: ${row.sid}`)
            // })

            const result = { ...output, success: true,data:rows };
            res.json(result);
            conn.release()
        })
        .catch((err) => {
            conn.release()
            throw err
        })
    })
    .catch((err) => {
        throw err
    })



})


//login 還沒建立資料庫 以及 sql
//希望可以加密
router.post('/logindesu', async (req, res) => {
    const { username, password } = req.body;

    let result = {
        success: false,
    };

    const sql = `SELECT * FROM membership WHERE account = ? AND password = ?`
    const params = [username, password];

    pool
    .getConnection()
    .then((conn) => {
        conn
        .query(sql,params)
        .then((rows) => {

            if(rows.length ==1){
                
                result = { ...result, success: true,data:rows };
                res.json(result);
                conn.release()

            }else{

                res.json(result);
                conn.release()

            }
        })
        .catch((err) => {
            conn.release()
            throw err
        })
    })
    .catch((err) => {
        throw err
    })

    

 

})

router.get('/findproducttyps', async (req, res) => {
    let result = {
        success: false,
    };

    const sql = `SELECT name FROM prosuctlist `


    pool
    .getConnection()
    .then((conn) => {
        conn
        .query(sql)
        .then((rows) => {

            if(rows.length >=1){
        
                result = { ...result, success: true,data:rows };
                res.json(result);
                conn.release()

            }else{

                res.json(result);
                conn.release()

            }

        })
        .catch((err) => {
            conn.release()
            throw err
        })
    })
    .catch((err) => {
        throw err
    })

    

 

})

router.get('/getproducts', async (req, res) => {
    let result = {
        success: false,
    };

    const sql = `SELECT * FROM prosuctlist`;


    pool
    .getConnection()
    .then((conn) => {
        conn
        .query(sql)
        .then((rows) => {

            if(rows.length >=1){
        
                result = { ...result, success: true,data:rows };
                res.json(result);
                conn.release()

            }else{

                res.json(result);
                conn.release()

            }

        })
        .catch((err) => {
            conn.release()
            throw err
        })
    })
    .catch((err) => {
        throw err
    })

})

router.get('/getproductdetail/:id', async (req, res) => {
    let result = {
        success: false,
    };
    let id = req.params.id
    const sql = `SELECT * FROM prosuctlist WHERE sid = ?`;
    const params = [id];


    pool
    .getConnection()
    .then((conn) => {
        conn
        .query(sql,params)
        .then((rows) => {

            if(rows.length >=1){
        
                result = { ...result, success: true,data:rows };
                res.json(result);
                conn.release()

            }else{

                res.json(result);
                conn.release()

            }

        })
        .catch((err) => {
            conn.release()
            throw err
        })
    })
    .catch((err) => {
        throw err
    })

})


router.post('/filter', async (req, res) => {
    let date = new Date();
    const { startdate, enddate,selectedproduct } = req.body;

    // console.log('startdate',startdate);
    // console.log('enddate',enddate);
    // console.log('selectedproduct',selectedproduct);
    
    //區間全品項數量 假如資料庫有記時間的話可以這樣寫sql
    // const sql =
    // "SELECT * FROM cartlist WHERE orderdate >= '2024-09-02' AND orderdate < '2024-09-03'";

    const sqlforall =
    "SELECT * ,TO_CHAR(birthday, 'YYYY')AS birthyear FROM cartlist WHERE orderdate BETWEEN ? AND ?";
    const sqlforselectedproduct = 
    "SELECT quantity, TO_CHAR(orderdate, 'YYYY-MM-DD')AS order_month FROM cartlist WHERE productname = ? AND orderdate BETWEEN ? AND ? GROUP BY order_month"
    const sqlforgender = "SELECT SUM(gender = 'F' ) AS F ,SUM(gender = 'M' ) AS M,SUM(gender = 'O' ) AS O FROM cartlist";
    
    
    



    const paramsForBar = [startdate,enddate];
    const paramsForLiner = [selectedproduct,startdate,enddate];

    let result = {
        success: false,
    };

    let datesForLiner = [];
    let quantitiesForLiner =[];

    
    pool
    .getConnection()
    .then((conn) => {
        conn
        .query(sqlforall,paramsForBar)
        .then((rows) => {
            // console.log('rows1 這是全資料',rows);
            //年齡比資料
            let newdate = new Date();
            let thisyear = newdate.getFullYear();

            let ages =  rows.map(item=>{
                return thisyear-item.birthyear*1
            })
            let agebirdge = {};
            ages.forEach((currentage)=>{
                if(agebirdge[currentage]){
                    agebirdge[currentage] +=1
                }else{
                    agebirdge[currentage] = 1
                }
                
            })

            let ageslabes = [];
            let agesdata = [];

            Object.entries(agebirdge).forEach(([key, value]) => {
                ageslabes.push(key);      
                agesdata.push(value);  
            });

        

            //區域比資料

            let sections =  rows.map(item=>{
                return item.section
            })

            let sectionsbirdge = {};
            sections.forEach((current)=>{
                if(sectionsbirdge[current]){
                    sectionsbirdge[current] +=1
                }else{
                    sectionsbirdge[current] = 1
                }
                
            })

            let sectionslabes = [];
            let sectionsdata = [];

            Object.entries(sectionsbirdge).forEach(([key, value]) => {
                sectionslabes.push(key);      
                sectionsdata.push(value);  
            });

            result = { ...result,
                    agesData:{labels:ageslabes, data:agesdata},
                    sectionsData:{labels:sectionslabes, data:sectionsdata}
                 };

            


            


            
            
        
            conn.query(sqlforselectedproduct,paramsForLiner)
            .then((rowsforliner)=>{
                rowsforliner.forEach(item=>{
                    datesForLiner.push(item.order_month);
                    quantitiesForLiner.push(item.quantity);
                })


                result = { ...result,linerData:{labels:datesForLiner, data:quantitiesForLiner} };

                if(rows){

                    const totalQuantities = {};
    
                    rows.forEach(item => {
                    if (totalQuantities[item.productname]) {
                        totalQuantities[item.productname] += item.quantity;
                    } else {
                        totalQuantities[item.productname] = item.quantity;
                    }
                    });
    
                    // console.log(totalQuantities);
    
                    const productnames = [];
                    const quantities = [];
    
                    Object.entries(totalQuantities).forEach(([key, value]) => {
                        productnames.push(key);      
                        quantities.push(value);  
                    });
    
                    result = { ...result, success: true,barData:{
                        labels:productnames,data:quantities
                    }};
                    conn.release()
    
                }else{
    
                    res.json(result);
                    conn.release()
    
                }
                
            });

            conn.query(sqlforgender)
            .then((datas)=>{
                
                result = { ...result, success: true,genderData:{
                    labels:['女性','男性','其他'],data:[datas[0].F,datas[0].M,datas[0].O],
                },selecteditem:selectedproduct};

                res.json(result);
                // console.log('result!!',result);
            })

    






        })
        .catch((err) => {
            conn.release()
            throw err
        })
    })
    .catch((err) => {
        throw err
    })

 

});

router.post('/addproducs', async (req, res) => {

    const { name, price,description,type,status,pic } = req.body;
    let result = {
        success: false,
    };

    let date =  new Date();

    const sql =  "INSERT INTO `prosuctlist`(`name`, `price`, `description`, `type`, `status`,`updatedate`) VALUES (?,?,?,?,?,?)";
    const params = [name,price,description,type,status,date];
    //找出剛新增完最新的那筆資料
    const getLatestIdSql = "SELECT sid FROM `prosuctlist` ORDER BY `updatedate` DESC LIMIT 1"; 



    pool
    .getConnection()
    .then((conn) => {
        conn
        .query(sql,params)
        .then((rows) => {
            // console.log('rows',rows);

            if(rows){
                if (rows.affectedRows > 0) {
                    // 插入成功後，查詢最新的 `sid`
                    // console.log('rows2',rows.affectedRows);
                    conn.query(getLatestIdSql)
                        .then((idRows) => {
                            const sid = idRows[0].sid; // 獲取最新的 sid
                            result = { ...result, success: true, sid: sid,type:'added' }; // 返回 sid
                            res.json(result);
                            conn.release();
                        })
                        .catch((err) => {
                            conn.release();
                            throw err;
                        });
                } else {
                    res.json(result);
                    conn.release();
                }

            }else{

                res.json(result);
                conn.release()

            }

        })
        .catch((err) => {
            conn.release()
            throw err
        })
    })
    .catch((err) => {
        throw err
    })

})

router.post('/editproducs', async (req, res) => {

    const { name, price,description,type,status,sid } = req.body;
    let date =  new Date();
    let result = {
        success: false,
    };

    const sql =  "UPDATE `prosuctlist` SET `name` =?, `price` =?, `description` = ?, `type` =?, `status`=?, `updatedate`=? WHERE sid = ?";
    const params = [name,price,description,type,status,date,sid];


    pool
    .getConnection()
    .then((conn) => {
        conn
        .query(sql,params)
        .then((rows) => {

            // console.log('rows',rows);

            if(rows){
        
                result = { ...result, success: true,type:'edited' };
                res.json(result);
                conn.release()

            }else{

                res.json(result);
                conn.release()

            }

        })
        .catch((err) => {
            conn.release()
            throw err
        })
    })
    .catch((err) => {
        throw err
    })


})

router.delete('/deleteproducs', async (req, res) => {

    const { sid } = req.body;
    let result = {
        success: false,
    };

    const sql =  "DELETE FROM `prosuctlist` WHERE  `sid`=?";
    const params = [sid];

    pool
    .getConnection()
    .then((conn) => {
        conn
        .query(sql,params)
        .then((rows) => {

            // console.log('rows',rows);

            if(rows){
        
                result = { ...result, success: true };
                res.json(result);
                conn.release()

            }else{

                res.json(result);
                conn.release()

            }

        })
        .catch((err) => {
            conn.release()
            throw err
        })
    })
    .catch((err) => {
        throw err
    })

})



//修改商品
router.post('/upload', upload.single('image'), (req, res) => {
    // `req.file` 包含上傳的文件
    const { pic,sid } = req.body;
    const { filename} = req.file;
    // console.log('req',filename);
    // console.log('sid',sid);

    let result = {
        success: false,
    };

    const sql =  "UPDATE `prosuctlist` SET `pic`=?  WHERE sid = ?";
    const params = [filename,sid];

    pool
    .getConnection()
    .then((conn) => {
        conn
        .query(sql,params)
        .then((rows) => {
            if(rows){
        
                result = { ...result, success: true };
                res.json(result);
                conn.release()

            }else{

                res.json(result);
                conn.release()

            }

        })
        .catch((err) => {
            conn.release()
            throw err
        })
    })
    .catch((err) => {
        throw err
    })

    
});





















module.exports = router;

