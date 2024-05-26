const express = require('express');
const req = require('express/lib/request');
const res = require('express/lib/response');
const axios = require('axios');
const hmacSHA256 = require('crypto-js/hmac-sha256');
const CryptoJS = require('crypto-js');

const Base64 = require('crypto-js/enc-base64');

const router = express.Router();
const nodemailer = require("nodemailer");



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



// 自訂的 middleware
// router.use((req, res, next) => {
//     res.locals.shin += ' admin2';
//     next();
// });
let orders = {};
router.post('/checkout', async (req, res) => {
    let frontendData = req.body;
    console.log('frontendData', frontendData);
    let frontendDataDeleAttr = [];
    const DeletAttr = () => {
        for (let i = 0; i < frontendData.length; i++) {
            console.log('for')
            delete frontendData[i].incre;
            delete frontendData[i].decre;
            delete frontendData[i].total;
            delete frontendData[i].key;
        }
        return frontendData;

    }
    DeletAttr();
    console.log('afterDeleAttr', frontendData)
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
    console.log('afterpackageGenerate', package);

    // after
    // { name: '豆漿波堤', price: 40, id: 1, quantity: 1 },
    // { name: '原味波堤', price: 35, id: 2, quantity: 1 }

    let order = {
        amount: frontendData.map((data) => data.price * 1 * data.quantity).reduce((a, b) => a + b),//package.amount 相加
        currency: 'TWD',
        orderId: parseInt(new Date().getTime() / 1000),
        packages: package,
    };
    console.log('order', order);
    if (order) {
        //後端收到訂單打line api('/payments/request')
        try {
            console.log('try', order)
            let linepayBody = {
                ...order,
                'redirectUrls': {
                    confirmUrl: `${LINEPAY_RETURN_HOST}${LINEPAY_RETURN_CONFIRM_URL}`,
                    cancelUrl: `${LINEPAY_RETURN_HOST}${LINEPAY_RETURN_CANCEL_URL}`,
                },
            };
            console.log('linepayBody', linepayBody)
            const uri = '/payments/request';
            const nonce = parseInt(new Date().getTime() / 1000);

            const signature = Base64.stringify(hmacSHA256(`${LINEPAY_CHANNEL_SECRET_KEY}/${LINEPAY_VERSION}${uri}${JSON.stringify(linepayBody)}${nonce}`, LINEPAY_CHANNEL_SECRET_KEY,));
            console.log('signature', signature);
            const headers = {
                'X-LINE-ChannelId': LINEPAY_CHANNEL_ID,
                'Content-Type': 'application/json',
                'X-LINE-Authorization-Nonce': nonce,
                'X-LINE-Authorization': signature,
            };
            console.log('headers', headers);
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
        console.log('無訂單')
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
        console.log('linepayBody', linepayBody)
        const uri = '/payments/request';
        const nonce = parseInt(new Date().getTime() / 1000);

        const signature = Base64.stringify(hmacSHA256(`${LINEPAY_CHANNEL_SECRET_KEY}/${LINEPAY_VERSION}${uri}${JSON.stringify(linepayBody)}${nonce}`, LINEPAY_CHANNEL_SECRET_KEY,));
        const headers = {
            'X-LINE-ChannelId': LINEPAY_CHANNEL_ID,
            'Content-Type': 'application/json',
            'X-LINE-Authorization-Nonce': nonce,
            'X-LINE-Authorization': signature,
        };
        console.log('headers', headers);
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
        console.log('linepayBody', linepayBody)
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
        console.log('headers', headers);
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
//login 還沒建立資料庫 以及 sql
//希望可以加密
router.post('/logindesu', async (req, res) => {
    const { account, password } = req.body;

    const output = {
        success: false,
    };
    let result = output;
    if(account === password){
        result = { ...output, success: true };
    }
    res.json(result);

})











module.exports = router;

