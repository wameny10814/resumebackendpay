require('dotenv').config();
const db = require('./../modules/connect-db');

class Product {

    constructor(data={}){
        //  sid, author, bookname, category_sid, book_id, publish_date, pages, price, isbn, on_sale, introduction
        // TODO: 哪些是必要的欄位
        const defaultData = {
            author: '',
            bookname: '', 
            category_sid: 4,
            book_id: '', 
            publish_date: '1970-01-01', 
            pages: 0, 
            price: 0, 
            isbn: '', 
            on_sale: 1, 
            introduction: ''
        }
        this.data = {...defaultData, ...data};
    }

    async save() {
        const [result] = await db.query('INSERT INTO `products` SET ?', [this.data]);
        console.log(result);
    }
}

module.exports = Product;