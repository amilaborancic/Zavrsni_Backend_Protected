var express = require("express");
const app = express();
const con = require("./db");
const bodyParser = require('body-parser');
const multer = require("multer");
var async = require("async");
const fs = require("fs");

app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());
app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header('Access-Control-Allow-Methods', 'GET,HEAD,OPTIONS,POST,PUT,DELETE');
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
    next();
});

//DODATNO
app.get("/", function (req, res) {

    con.query("SELECT * FROM customers", function (err, result) {
        if (err) console.log(err);
        else {
            res.send(result);
        }
    })
})
//info oko tabela
app.get("/tabele",(req,res)=>{
    con.query("SELECT TABLE_NAME, TABLE_SCHEMA FROM information_schema.tables",(err,result)=>{
        if(err){
            res.send({
                success: false,
                msg: err,
                data: null
            })
        }
        else{
            res.send({
                success: true,
                msg: err,
                data: result
            })
        }
    })
})
app.get("/items", (req, res) => {
    con.query("SELECT * FROM items", function (err, result) {
        if (err) {
            res.send({
                success: false,
                msg: err,
                data: null
            })
        }
        else {
            const blob = result[0].image;
            var url = "";

            if (blob != null) {
                var buffer = Buffer.from(blob);
                url = "data:image/png;base64," + buffer;
            }
            res.send({
                success: true,
                msg: "",
                data: {
                    imgUrl: url,
                    result: result
                }

            })
        }
    })
})

//popunjavanje items
//slika
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './slike/');
    },
    filename: function (req, file, cb) {

        cb(null, file.fieldname);
    }
})

//Dodavanje ograncicenja na velicinu i tip
const upload = multer({
    storage: storage,
    fileFilter: function (req, file, cb) {
        if (file.mimetype === 'image/png' || file.mimetype === 'image/jpeg' || file.mimetype === 'image/jpg') {
            cb(null, true);
        }
        else {
            cb('wrong mimetype', false);
        }
    }
})

app.post("/items/insert", upload.single("image"), (req, res) => {
    var data = fs.readFileSync(req.file.path);
    var foto = data.toString('base64');

    var query = "INSERT INTO items SET ?",
        values = {
            name: req.body.itemName,
            price: req.body.itemPrice,
            category: req.body.itemCategory,
            image: foto
        };
    con.query(query, values, (err, result) => {
        if (err) {
            res.send({
                success: false,
                msg: err,
                data: null
            })
        }
        else {
            res.send({
                success: true,
                msg: "",
                data: result
            })
        }
    })

})

// FOR VIEWING THE CART
app.get("/cartItems", (req, res) => {
    con.query("SELECT * FROM cart_items", function (err, result) {
        if (err) console.log(err);
        else {
            res.send(result);
        }
    })
})


app.get("/carts", (req, res) => {
    con.query("SELECT * FROM carts", function (err, result) {
        if (err) console.log(err);
        else {
            res.send(result);
        }
    })
})

//brisanje svih podataka osim itema
app.delete("/", (req, res) => {
    con.query("DELETE from customers", (err, result) => {
        if (err) console.log(err);
        else {
            con.query("DELETE from cart_items", (err, l) => {
                if (err) console.log(err);
                else {
                    con.query("DELETE from carts", (err, data) => {
                        if (err) console.log(err);
                        else {
                            res.send("Uspjesno obrisano sve");
                        }
                    })
                }
            })

        }
    })
})
//
//RUTE
//post - za login
app.post("/login", function (req, res) {

    var user = {
        email: req.body.email,
        password: req.body.password
    }
    //much sqli here
    con.query("SELECT * FROM customers WHERE email = '" + user.email + "' AND sifra = '" + user.password + "'", function (err, result) {

        if (err) {
            res.send({
                success: false,
                msg: "An error has occurred!" + err,
                data: null
            })
        }
        else if (result.length != 0) {
            res.send({
                success: true,
                msg: "User successfully found.",
                data: result
            })
        }
        else {
            res.send({
                success: false,
                msg: "Wrong credentials!",
                data: null
            })
        }
    })
})
//post - registracija
app.post("/register", function (req, res) {
    var noviUser = {
        name: req.body.name,
        lastName: req.body.lastName,
        email: req.body.email,
        creditCard: req.body.creditCard,
        phone: req.body.phone,
        address: req.body.address,
        pass: req.body.password
    }
    con.query("INSERT INTO customers (name, last_name, email, credit_card, phone, address, sifra) VALUES ('" + noviUser.name +
        "','" + noviUser.lastName + "','" + noviUser.email + "','" + noviUser.creditCard + "','" + noviUser.phone + "','" + noviUser.address +
        "','" + noviUser.pass + "')", function (err, result) {
            if (err) {
                res.send({
                    success: false,
                    msg: "An error has occurred! " + err,
                    data: null
                })
            }
            else {
                //odmah pravimo cart
                con.query("INSERT INTO carts (shipping_addr, user_id_fk) VALUES ('" + noviUser.address + "', " + result.insertId + ")", (err, novi) => {
                    if (err) {
                        res.send({
                            success: false,
                            msg: err,
                            data: null
                        })
                    }
                    else {
                        //dohvatimo info o customeru i cartu
                        con.query("SELECT * FROM customers WHERE user_id = " + result.insertId, (err, help) => {
                            if (err) {
                                res.send({
                                    success: false,
                                    msg: err,
                                    data: null
                                })
                            }
                            else {
                                res.send({
                                    success: true,
                                    msg: "You have been successfully registered!",
                                    data: {
                                        customer: help,
                                        cart: novi.insertId
                                    }
                                })
                            }
                        })

                    }
                })

            }
        })
})

//get - info
app.get("/customer/info/:idCustomer", (req, res) => {
    let userId = req.params.idCustomer;
    con.query("SELECT * FROM customers WHERE user_id = " + userId, (err, result) => {
        if (err) {
            res.send({
                success: false,
                msg: err,
                data: null
            })
        }
        else {
            res.send({
                success: true,
                msg: "",
                data: result
            })
        }
    })
})

//get - search
app.get("/search/:keyword", (req, res) => {

    let word = req.params.keyword;
    con.query("SELECT * FROM items WHERE name LIKE '%" + word + "%';", (err, result) => {
        if (err) {
            res.send({
                success: false,
                msg: err,
                data: null
            })
        }
        else {
            //slike
            if (result.length == 0) {
                res.send({
                    success: true,
                    msg: "",
                    data: []
                })
            }
            else {
                //moramo kroz svaki proci
                var konacni = [];
                for (var i = 0; i < result.length; i++) {
                    const blob = result[i].image;
                    var url = "";

                    if (blob != null) {
                        var buffer = Buffer.from(blob);
                        url = "data:image/png;base64," + buffer;
                        konacni.push({
                            imgUrl: url,
                            result: result[i]
                        })
                    }
                }

                res.send({
                    success: true,
                    msg: "",
                    data: konacni
                })
            }

        }
    })

})

//ADD TO CART - post
app.post("/cart/add", (req, res) => {
    var item = req.body.itemId;
    var cart = req.body.cartId;
    con.query("INSERT INTO cart_items (cart_id_fk, item_id_fk) VALUES ( " + cart + " , " + item + ")", (err, result) => {
        if (err) {
            res.send({
                success: false,
                msg: err,
                data: null
            })
        }
        else {
            //vratimo rez
            res.send({
                success: true,
                msg: "Successfully added to cart!",
                data: result
            })
        }
    })

})
//REMOVE FROM CART - delete
app.delete("/cart/delete", (req, res) => {
    let cart_item = req.body.cartItemId;

    con.query("DELETE FROM cart_items WHERE cart_item_id = " + cart_item, (err, result) => {
        if (err) {
            res.send({
                success: false,
                msg: err,
                data: null
            })
        }
        else {
            //vratimo rez
            res.send({
                success: true,
                msg: "Successfully removed item from cart.",
                data: result
            })
        }
    })
})

//CART nekog usera
app.get("/cart/:userId", (req, res) => {
    let user = req.params.userId;
    con.query("SELECT * FROM carts WHERE user_id_fk = " + user, (err, result) => {
        if (err) {
            res.send({
                success: false,
                msg: err,
                data: null
            })
        }
        else {
            res.send({
                success: true,
                msg: "",
                data: result
            })
        }
    })
})

//items in cart za nekog usera
app.get("/cart/items/:cartId", (req, res) => {
    let cart = req.params.cartId;
    con.query("SELECT * FROM cart_items WHERE cart_id_fk = " + cart, (err, result) => {
        if (err) {
            res.send({
                success: false,
                msg: err,
                data: null
            })
        }
        else {
            let niz = [];
            let itemIds = result.map(x => ({
                item: x.item_id_fk,
                cartItem: x.cart_item_id
            }));
            async.eachSeries(itemIds, function (item, outCb) {
                con.query("SELECT * FROM items WHERE item_id = " + item.item, (err, rez) => {
                    if (err) {
                        outCb(err, null);
                    }
                    else {
                        const blob = rez[0].image;
                        var url = "";
                        if (blob != null) {
                            var buffer = Buffer.from(blob);
                            url = "data:image/png;base64," + buffer;
                        }
                        pom = {
                            itemInfo: rez[0],
                            cart_item_id: item.cartItem,
                            imgUrl: url
                        }
                        niz.push(pom);
                        outCb(null, null);
                    }
                })
            }, function (err, results) {
                //ovdje je gotovo
                if (err) {
                    res.send({
                        success: false,
                        msg: err,
                        data: null
                    })
                }
                else {
                    res.send({
                        success: true,
                        msg: "",
                        data: niz
                    })
                }
            })
        }
    })
})
//pronadji item na osnovu id
app.get("/items/:itemId", (req, res) => {
    let item = req.params.itemId;
    con.query("SELECT * FROM items WHERE item_id = " + item, (err, result) => {
        if (err) {
            res.send({
                success: false,
                msg: err,
                data: null
            })
        }
        else {
            //slike
            var konacni = [];
            for (var i = 0; i < result.length; i++) {
                const blob = result[i].image;
                var url = "";

                if (blob != null) {
                    var buffer = Buffer.from(blob);
                    url = "data:image/png;base64," + buffer;
                    konacni.push({
                        imgUrl: url,
                        result: result[i]
                    })
                }
            }
            res.send({
                success: true,
                msg: "",
                data: konacni
            })
        }
    })
})
app.listen(8080);