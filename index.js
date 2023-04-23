var mysql = require('mysql')

const express = require("express");
const app = express()

const PORT = process.env.PORT || 3000

app.set('view engine','ejs');

const bodyParser = require("body-parser");
const encoder = bodyParser.urlencoded();

var session = require('express-session');
app.use(session({
	secret: 'secret',
	resave: true,
	saveUninitialized: true
}));

const cookieParser = require('cookie-parser');
const { render } = require('ejs');
app.use(cookieParser());

app.use('/assets', express.static('assets'));
app.use('/resources', express.static('resources'));

// var connection = mysql.createConnection({
//     host: "localhost",
//     user: "root",
//     password:"Apto123",
//     database: "treasurehunt"
// });

var connection = mysql.createConnection({
    host: "sql12.freemysqlhosting.net",
    user: "sql12614019",
    password:"WrVSrP1R4R",
    database: "sql12614019"
});

connection.connect(function(err){
    if(err)
        throw err;  
    console.log("Connection Successfull..");
})

app.get("/", function(req, res){
    var message = " ";
            res.render("index", {message});
})

app.post("/signIn", encoder, function(req, res){
    var userMailID = req.body.userMailID;
    var password = req.body.password;

    connection.query("select * from login where userMailID = ? and password = ?",[userMailID, password], function(error, results, fields){
        if (results.length > 0){
            req.session.loggedIn = true;
            Object.keys(results).forEach(key => {
                var row = results[key];
                req.session.userID = row.userID;
                req.session.userMailID = row.userMailID,
                req.session.isAdmin = row.isAdmin
              });
            
            if(req.session.isAdmin == true){
                console.log("admin");
                connection.query("SELECT userMailID, levelUnlocked, accuracy, error, score FROM login INNER JOIN usergamedata ON login.userID = usergamedata.userID;", function(error, customerList, fields){
                    console.log(customerList);
                    res.render('user-list', { title: 'User List', userData: customerList});
                });
            }
            else{
                res.redirect("/emojiHunt.html");
            }
        }
        
        else{
            var message = " Wrong UserName and Password";
            res.render("index", {message});  
        }
        // res.end();
    })
})

app.post("/register", encoder, function(req, res){
    var userMailID = req.body.userMailID;
    var password = req.body.password;
    var falseValue = false;
    
    connection.query("select * from login where userMailID = ? and password = ?",[userMailID, password], function(error, results, fields){
        if (results.length > 0){
            res.redirect("/");
        }
        else{
            connection.query("INSERT INTO login(userMailID, password, isAdmin) values(?, ?, ?)",[userMailID, password, falseValue], function(){
            })

            var tempUserID;
            connection.query("select userID from login where userMailID = ? and password = ?",[userMailID, password], function(error, results, fields){
                if (results.length > 0){
                    req.session.loggedIn = true;
                    Object.keys(results).forEach(key => {
                        var row = results[key];
                        tempUserID = row.userID;
                    });

                    connection.query("INSERT INTO usergamedata(userID, levelUnlocked, accuracy, error, attempts, timeTaken, score) values(?, 0, 0, 0, 0, 0, 0)",[tempUserID], function(errorr, results, fields){
                        var message = " User registered successfully";
                        res.render("index", {message});
                    })
                }
            }) 
        }
    })
})

app.post("/saveAns", encoder, function(req, res){
    var newLevelUnlocked = (req.cookies[`levelUnlocked`]);
    var timeTaken = (req.cookies[`timeTaken`]);
    var error = (req.cookies[`error`]);
    var attempts = (req.cookies[`attempts`]);
    var accuracy=0;
    var score = 0;

    var userID = req.session.userID;


    connection.query("SELECT userID from usergamedata where userID = ?", [userID], function(errorr, results, fields){
        if(results.length > 0){
            
            accuracy = ((attempts-error)/attempts)*100;
            score = ((100*newLevelUnlocked) + (7*accuracy) + (700-timeTaken))/20;


            connection.query("UPDATE usergamedata SET levelunlocked = ?, timeTaken = ?, error = ?, attempts = ?, accuracy = ?, score = ? WHERE userID = ?",[newLevelUnlocked, timeTaken, error, attempts, accuracy, score, userID], function(errorr, results, fields){
            })
        }

    })
                res.redirect("/emojiHunt.html");
    
    res.end();  
})

app.post("/logOut", encoder, function(req, res){
    console.log("Logging Off")
    req.session.destroy((err) => {
        res.redirect('/') // will always fire after session is destroyed
      })
})

app.get("/emojiHunt.html", function(req, res){
    var levelUnlocked = 0;
    var timeTaken;
    var error;
    var attempts;
    if(req.session.loggedIn){
        var userID = req.session.userID;
        connection.query("select levelUnlocked, timeTaken, error, attempts from usergamedata where userID = ?",[userID], function(errorr, results, fields){
        if(results.length > 0){
            Object.keys(results).forEach(key => {
                var row = results[key];
                levelUnlocked = row.levelUnlocked;
                timeTaken = row.timeTaken;
                error = row.error;
                attempts = row.attempts;
                var user = {
                    userID: userID,
                    userMailID: req.session.userMailID,
                    levelUnlocked: levelUnlocked,
                    timeTaken: timeTaken,
                    error: error,
                    attempts: attempts
                }
                res.render("emojiHunt", {user});

            });
        }
        else{
            var user = {
                userID: userID,
                userMailID: req.session.userMailID,
                levelUnlocked: levelUnlocked,
                timeTaken: timeTaken,
                error: error,
                attempts: attempts
            }
            res.render("emojiHunt", {user});
        }
        })

    }
    else{
        res.send('Please login to view this page');
    }
})




// set app port
app.listen(PORT, () => {

})