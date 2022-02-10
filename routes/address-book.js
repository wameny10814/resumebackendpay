const express = require('express');
const db = require('./../modules/connect-db');
const upload = require('./../modules/upload-imgs');

const router = express.Router();

async function getListData(req, res){
    const perPage = 5; // 每一頁最多幾筆
    // 用戶要看第幾頁
    let page = req.query.page ? parseInt(req.query.page) : 1;
    if(page<1){
        return res.redirect('/address-book/list');
    }
    const conditions = {};  // 傳到 ejs 的條件
    let search = req.query.search ? req.query.search : '';
    search = search.trim(); // 去掉頭尾空白
    let sqlWhere = ' WHERE 1 ';
    if(search){
        sqlWhere += ` AND \`name\` LIKE ${db.escape('%'+search+'%')} `;
        conditions.search = search;
    }

    // 輸出
    const output = {
        // success: false,
        perPage,
        page,
        totalRows: 0,
        totalPages: 0,
        rows: [],
        conditions
    };

    const t_sql = `SELECT COUNT(1) num FROM address_book ${sqlWhere} `;
    // return res.send(t_sql); // 除錯用
    const [rs1] = await db.query(t_sql);
    const totalRows = rs1[0].num;
    // let totalPages = 0;
    if(totalRows) {
        output.totalPages = Math.ceil(totalRows/perPage);
        output.totalRows = totalRows;
        if(page > output.totalPages){
            // 到最後一頁
            return res.redirect(`/address-book/list?page=${output.totalPages}`);
        }

        const sql = `SELECT * FROM \`address_book\` ${sqlWhere} ORDER BY sid DESC LIMIT ${perPage*(page-1)}, ${perPage} `;
        const [rs2] = await db.query(sql);
        rs2.forEach(el=>{
            el.birthday = res.locals.toDateString(el.birthday);
        });
        output.rows = rs2;
    }

    return output;
}

router.get('/', async (req, res)=>{
    res.redirect('/address-book/list');
});
router.get('/list', async (req, res)=>{
    res.render('address-book/list', await getListData(req, res));
});
router.get('/api/list', async (req, res)=>{
    res.json(await getListData(req, res));
});

router.get('/add', async (req, res)=>{
    res.render('address-book/add');
});
router.post('/add', upload.none(), async (req, res)=>{
    res.json(req.body);
});


module.exports = router;