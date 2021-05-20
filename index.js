const express = require('express')
const cors = require('cors')
const bodyParser = require('body-parser')
const admin = require('firebase-admin')
const MongoClient = require('mongodb').MongoClient;
require('dotenv').config()
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.rbrep.mongodb.net/burjAlArab?retryWrites=true&w=majority`;
const port = 5000
const app = express()
app.use(cors())
app.use(bodyParser.json())
var serviceAccount = require("./configs/burj-al-arab-49421-firebase-adminsdk-n9o9z-35a92fe29a.json");
const { database } = require('firebase-admin');
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
});
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
client.connect(err => {
    const collection = client.db("burjAlArab").collection("bookings");
    app.post("/addBooking", (req, res) => {
        const newBooking = req.body
        collection.insertOne(newBooking)
            .then(result => {
                res.send(result.insertOne > 0)
            })
    })
    app.get("/bookings", (req, res) => {
        const bearer = req.headers.authorization
        if (bearer && bearer.startsWith('Bearer ')) {
            const idToken = bearer.split(' ')[1]
            console.log({ idToken })
            admin
                .auth()
                .verifyIdToken(idToken)
                .then((decodedToken) => {
                    const tokenEmail = decodedToken.email;
                    const queryEmail = req.query.email
                    console.log(tokenEmail, queryEmail)
                    if (tokenEmail === queryEmail) {
                        collection.find({ email: req.query.email })
                            .toArray((err, documents) => {
                                res.status(200).send(documents)
                            })
                    }
                    else {
                        res.status(401).send('Unauthorizes access')
                    }
                })
                .catch((error) => {
                    res.status(401).send('Unauthorizes access')
                });
        }
        else {
            res.status(401).send('Unauthorizes access')
        }
    })
});

app.listen(process.env.PORT || port)