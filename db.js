const mysql = require("mysql");
const con = mysql.createConnection({
    host: "127.0.0.1",
    user: "root",
    password: "root",
    database: "zavrsni_amila",
    //port:"3306"
})
//Konekcija na bazu + kreiranje tabela
con.connect(function (err) {
    if (err) console.log("greska :( " + err.stack);
    else console.log("uspjesno ste konektovani!");
})

var customers = 'CREATE TABLE IF NOT EXISTS customers (user_id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(255), last_name VARCHAR(255), email VARCHAR(255), credit_card VARCHAR(255), phone VARCHAR(255), address VARCHAR(255), sifra VARCHAR(255))';
var items = 'CREATE TABLE IF NOT EXISTS items (item_id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(255), price DECIMAL, category VARCHAR(255), image LONGBLOB)';
var carts = 'CREATE TABLE IF NOT EXISTS carts (cart_id INT AUTO_INCREMENT PRIMARY KEY, user_id_fk INT, FOREIGN KEY(user_id_fk) REFERENCES customers (user_id) ON DELETE RESTRICT ON UPDATE CASCADE,shipping_addr VARCHAR(255))';
var cart_items = 'CREATE TABLE IF NOT EXISTS cart_items (cart_item_id INT AUTO_INCREMENT PRIMARY KEY, cart_id_fk INT, item_id_fk INT, FOREIGN KEY(cart_id_fk) REFERENCES carts (cart_id) ON DELETE RESTRICT ON UPDATE CASCADE, FOREIGN KEY(item_id_fk) REFERENCES items (item_id) ON DELETE RESTRICT ON UPDATE CASCADE)';
con.query(customers, function (err) {
    if (err) console.log(err);
    con.query(items, function (err) {
        if (err) console.log(err);
        con.query(carts, function (err) {
            if (err) console.log(err);
            con.query(cart_items, function (err) {
                if (err) console.log(err);
                else console.log("uspjesno kreirane tabele!");
            })
        })
    })
})

//if u mess up ima ovo ispod
/*con.query("SET FOREIGN_KEY_CHECKS = 0;", function (err) {
    if (err) console.log(err);
    con.query("DROP TABLE IF EXISTS customers", function (err) {
        if (err) console.log(err);
        con.query("DROP TABLE IF EXISTS carts", function (err) {
            if (err) console.log(err);
            con.query("DROP TABLE IF EXISTS cart_items", function (err) {
                if (err) console.log(err);
                con.query(" SET FOREIGN_KEY_CHECKS = 1;", function (err) {
                    if (err) console.log(err);
                })
            })
        })

    })
})*/

module.exports = con;