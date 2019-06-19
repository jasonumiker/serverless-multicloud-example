//const express = require('express')
const express = require('serverless-express/express')
const app = express()
const bodyParser = require('body-parser')
//const port = 3000

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

// Setup Mongo
const MongoClient = require('mongodb').MongoClient;
const assert = require('assert')
const url = 'mongodb://localhost:27017'
const dbName = 'todolist'
const client = new MongoClient(url)
var ObjectID = require('mongodb').ObjectID;

// Get all records
app.get(['/documents/all', '/api/app/documents/all'], (req, res, next) => {
    client.connect(function (err) {
        assert.equal(null, err)
        console.log("Connected successfully to mongo")
        const db = client.db(dbName)
        const collection = db.collection('items');

        collection.find({}).toArray((err, result) => {
            if (err) {
                res.status(400).send({ 'error': err })
            }
            if (result === undefined || result.length === 0) {
                res.status(400).send({ 'error': 'No documents in database' })
            } else {
                res.status(200).send(result)
            }
        })

        client.close()
    })
})

// Get specific record
app.get(['/documents/id', '/api/app/documents/id'], (req, res, next) => {
    client.connect(function (err) {
        console.log(req.query)
        assert.equal(null, err)
        console.log("Connected successfully to mongo")
        const db = client.db(dbName)
        const collection = db.collection('items');

        if (req.query.id != undefined){
            var o_id = new ObjectID(req.query.id)
            collection.findOne({_id: o_id}, (err, result) => {
                if (err) {
                    res.status(400).send({ 'error': err })
                }
                if (result === undefined) {
                    res.status(400).send({ 'error': 'No document matching that id was found' })
                } else {
                    res.status(200).send(result)
                }
            })
        }
        else {
            res.status(400).send({ 'error': 'No id parameter specified' })
        }

        client.close()
    })
})

//Insert a document
app.post(['/documents/new', '/api/app/documents/new'], (req, res, next) => {
    console.log(req.body)
    client.connect(function (err) {
        assert.equal(null, err)
        console.log("Connected successfully to mongo")
        const db = client.db(dbName)
        const collection = db.collection('items');

        collection.insertOne({
            "created":Date.now(), "updated":Date.now(), "description":req.body.description, "duedate":req.body.duedate
        }, (err, result) => {
            if (err) {
                res.status(400).send({ 'error': err })
            }
            res.status(200).send(result)
        })

        client.close()
    })
})

//Delete a document
app.delete(['/documents/id', '/api/app/documents/id'], (req, res, next) => {
    client.connect(function (err) {
        console.log(req.query)
        assert.equal(null, err)
        console.log("Connected successfully to mongo")
        const db = client.db(dbName)
        const collection = db.collection('items');

        if (req.query.id != undefined){
            var o_id = new ObjectID(req.query.id)
            collection.deleteOne({_id: o_id}, (err, result) => {
                if (err) {
                    res.status(400).send({ 'error': err })
                }
                res.status(200).send(result)
            })
        }
        else {
            res.status(400).send({ 'error': 'No id parameter specified' })
        }

        client.close()
    })
})

//Update a document
app.patch(['/documents/id', '/api/app/documents/id'], (req, res, next) => {
    client.connect(function (err) {
        console.log(req.query)
        assert.equal(null, err)
        console.log("Connected successfully to mongo")
        const db = client.db(dbName)
        const collection = db.collection('items');

        if (req.query.id != undefined){
            var o_id = new ObjectID(req.query.id)
            collection.updateOne({_id: o_id}, 
                {$set:
                    {
                        updated: Date.now(),
                        description: req.query.description,
                        duedate: req.query.duedate
                    }  
                },
                (err, result) => {
                if (err) {
                    res.status(400).send({ 'error': err })
                }
                res.status(200).send(result)
            })
        }
        else {
            res.status(400).send({ 'error': 'No id parameter specified' })
        }

        client.close()
    })
})

// Azure's default URI path for this is /api/app and it sends that through so we need to cater for that
app.get(['/', '/api/app'], (req, res) => res.send('todolist v1.0.0'))

//app.listen(port, () => console.log(`Example app listening on port ${port}!`))
module.exports = app