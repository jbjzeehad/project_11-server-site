const express = require('express');
const cors = require('cors');
const app = express();
const jwt = require('jsonwebtoken');
require('dotenv').config()
const port = process.env.PORT || 5000;
/////////////

app.use(cors());
app.use(express.json());

////////////

const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@brandshop.fsu7nul.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        // await client.connect();

        /// database collection

        const userCollection = client.db("adoptiondb").collection("users");
        const petCollection = client.db("adoptiondb").collection("pets");
        const donationCollection = client.db("adoptiondb").collection("donations");
        const adoptionCollection = client.db("adoptiondb").collection("adoption");
        const courseCollection = client.db("adoptiondb").collection("courses");
        const enrolledCollection = client.db("adoptiondb").collection("enrolled");

        /// jwt related api

        app.post('/jwt', async (req, res) => {
            const user = req.body;
            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
                expiresIn: '1h'
            });
            res.send({ token });
        })

        /// middlewares

        const verifyToken = (req, res, next) => {
            // console.log(req.headers);
            console.log('inside verify token', req.headers.authorization);
            if (!req.headers.authorization) {
                return res.status(401).send({
                    message: 'unauthorized access'
                });
            }
            const token = req.headers.authorization.split(' ')[1];
            jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
                if (err) {
                    return res.status(401).send({ message: 'unauthorized access' });
                }
                req.decoded = decoded;
                next();
            })
        }

        /// verify admin afrwe verification

        const verifyAdmin = async (req, res, next) => {
            const email = req.decoded.email;
            const query = { email: email };
            const user = await userCollection.findOne(query);
            const isAdmin = user?.role === 'admin';
            if (!isAdmin) {
                return res.status(403).send({ message: 'forbidden access' });
            }
            next();
        }

        /**
         * 
         *  USERS API
         * 
         */

        /// users api get
        app.get('/users', async (req, res) => {

            const result = await userCollection.find().toArray();
            res.send(result);
        })

        /// users api post

        app.post('/users', async (req, res) => {
            const user = req.body;
            const query = { email: user.email };
            const existingUser = await userCollection.findOne(query);
            if (existingUser) {
                return res.send({ message: 'User already exist', insertedId: null })
            }
            const result = await userCollection.insertOne(user);
            res.send(result);
        })

        /// user + admin api get

        app.get('/users/admin/:email', async (req, res) => {
            const email = req.params.email;
            if (email !== req.decoded.email) {
                return res.status(403).send({ message: "forbidden access" })
            }
            const query = { email: email };
            const user = await userCollection.findOne(query);
            let admin = false;
            if (user) {
                admin = user?.role === 'admin';
            }
            res.send({ admin });

        })

        /// user + admin patch

        app.patch('/users/admin/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) };
            const updateDoc = {
                $set: {
                    role: 'admin'
                }
            }
            const result = await userCollection.updateOne(filter, updateDoc);
            res.send(result);
        });

        /// user + admin patch

        app.patch('/users/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) };
            const updateDoc = {
                $set: {
                    role: 'ban'
                }
            }
            const result = await userCollection.updateOne(filter, updateDoc);
            res.send(result);

        });

        /**
         * 
         *  COURSES API
         * 
         */
        /// courses api get

        app.get('/courses', async (req, res) => {
            const result = await courseCollection.find().toArray();
            res.send(result);
        })

        /// courses api post

        app.post('/courses', async (req, res) => {
            const list = req.body;
            const result = await courseCollection.insertOne(list);
            res.send(result);
        })

        /// courses individual api get

        app.get('/courses/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await courseCollection.findOne(query);
            res.send(result);
        })

        // courses individual api patch

        app.patch('/courses/:id', async (req, res) => {
            const item = req.body;
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) };
            const updateDoc = {
                $set: {
                    name: item.name,
                    instructor: item.instructor,
                    duration: item.duration,
                    location: item.location,
                    outline: item.outline,
                    image: item.image,
                }
            }
            const result = await courseCollection.updateOne(filter, updateDoc);
            res.send(result);
        });

        // courses individual api put

        app.put('/courses/:id', async (req, res) => {
            const id = req.params.id;
            const course = req.body;
            // console.log(id, user);
            const filter = { _id: new ObjectId(id) };
            const options = { upsert: true };
            const updatedUser = {
                $set: {
                    name: course.name,
                    instructor: course.instructor,
                    duration: course.duration,
                    location: course.location,
                    outline: course.outline,
                    image: course.image,
                    email: course.email,
                    endcourse: course.endcourse
                }
            }
            const result = await courseCollection.updateOne(filter, updatedUser, options);
            res.send(result);
        })

        // courses individual api delete

        app.delete('/courses/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await courseCollection.deleteOne(query);
            res.send(result);
        })

        /**
         * 
         *  PETS API
         * 
         */

        /// pets api get

        app.get('/pets', async (req, res) => {
            const result = await petCollection.find().toArray();
            res.send(result);
        })

        /// pets api post

        app.post('/pets', async (req, res) => {
            const list = req.body;
            const result = await petCollection.insertOne(list);
            res.send(result);
        })

        /// pets individual api get

        app.get('/pets/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await petCollection.findOne(query);
            res.send(result);
        })

        /// pets individual api patch

        app.patch('/pets/:id', async (req, res) => {
            const item = req.body;
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) };
            const updateDoc = {
                $set: {
                    name: item.name,
                    age: item.age,
                    category: item.category,
                    location: item.location,
                    shortdescription: item.shortdescription,
                    longdescription: item.longdescription,
                    image: item.image,
                    time: item.time
                }
            }
            const result = await petCollection.updateOne(filter, updateDoc);
            res.send(result);
        });

        //pets individual api put

        app.put('/pets/:id', async (req, res) => {
            const id = req.params.id;
            const pet = req.body;
            // console.log(id, user);
            const filter = { _id: new ObjectId(id) };
            const options = { upsert: true };
            const updatedUser = {
                $set: {
                    name: pet.name,
                    age: pet.age,
                    category: pet.category,
                    location: pet.location,
                    shortdescription: pet.shortdescription,
                    longdescription: pet.longdescription,
                    image: pet.image,
                    time: pet.time,
                    email: pet.email,
                    adopted: pet.adopted
                }
            }
            const result = await petCollection.updateOne(filter, updatedUser, options);
            res.send(result);
        })

        /// pets individual api patch

        app.patch('/pets/:id', async (req, res) => {
            const item = req.body;
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) };
            const updateDoc = {
                $set: {
                    adopted: item.adopted
                }
            }
            const result = await petCollection.updateOne(filter, updateDoc);
            res.send(result);
        });

        /// pets individual api delete

        app.delete('/pets/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await petCollection.deleteOne(query);
            res.send(result);
        })

        /**
         * 
         * DONATIONS API
         * 
         */

        /// donations api get

        app.get('/donations', async (req, res) => {
            const result = await donationCollection.find().toArray();
            res.send(result);
        })

        /// donations api post

        app.post('/donations', async (req, res) => {
            const list = req.body;
            const result = await donationCollection.insertOne(list);
            res.send(result);
        })

        /// donations individual api get

        app.get('/donations/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await donationCollection.findOne(query);
            res.send(result);
        })

        /// donations individual api put

        app.put('/donations/:id', async (req, res) => {
            const id = req.params.id;
            const don = req.body;
            // console.log(id, user);
            const filter = { _id: new ObjectId(id) };
            const options = { upsert: true };
            const updatedDon = {
                $set: {
                    name: don.name,
                    maxdonation: don.maxdonation,
                    lastdate: don.lastdate,
                    shortdescription: don.shortdescription,
                    longdescription: don.longdescription,
                    image: don.image,
                    time: don.time,
                    email: don.email,
                    donstatus: don.donstatus
                }
            }
            const result = await donationCollection.updateOne(filter, updatedDon, options);
            res.send(result);
        })

        /// donations individual api patch

        app.patch('/donations/:id', async (req, res) => {
            const item = req.body;
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) };
            const updateDoc = {
                $set: {
                    name: item.name,
                    maxdonation: item.maxdonation,
                    lastdate: item.lastdate,
                    shortdescription: item.shortdescription,
                    longdescription: item.longdescription,
                    image: item.image,
                    time: item.time
                }
            }
            const result = await donationCollection.updateOne(filter, updateDoc);
            res.send(result);
        });

        /// donations individual api delete

        app.delete('/donations/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await donationCollection.deleteOne(query);
            res.send(result);
        })

        /**
        * 
        *  ADOPTION API
        * 
        */

        // adoption api get

        app.get('/adoption', async (req, res) => {
            const result = await adoptionCollection.find().toArray();
            res.send(result);
        })

        // adoption api post

        app.post('/adoption', async (req, res) => {
            const list = req.body;
            const result = await adoptionCollection.insertOne(list);
            res.send(result);
        })

        // adoption individual api patch

        app.patch('/adoption/:id', async (req, res) => {

            const id = req.params.id;
            const filter = { _id: new ObjectId(id) };
            const updateDoc = {
                $set: {
                    adpreq: "false"
                }
            }
            const result = await adoptionCollection.updateOne(filter, updateDoc);
            res.send(result);
        });

        // adoption individual api delete

        app.delete('/adoption/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await adoptionCollection.deleteOne(query);
            res.send(result);
        })

        /**
        * 
        *  ENROLLED API
        * 
        */

        /// enrolled api get

        app.get('/enrolled', async (req, res) => {
            const result = await enrolledCollection.find().toArray();
            res.send(result);
        })

        /// enrolled api post

        app.post('/enrolled', async (req, res) => {
            const list = req.body;
            const result = await enrolledCollection.insertOne(list);
            res.send(result);
        })

        /// enrolled individual api patch

        app.patch('/enrolled/:id', async (req, res) => {

            const id = req.params.id;
            const filter = { _id: new ObjectId(id) };
            const updateDoc = {
                $set: {
                    finished: "true"
                }
            }
            const result = await enrolledCollection.updateOne(filter, updateDoc);
            res.send(result);
        });

        /// enrolled individual api delete

        app.delete('/enrolled/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await enrolledCollection.deleteOne(query);
            res.send(result);
        })

        ////////////

        // Send a ping to confirm a successful connection
        // await client.db("admin").command({ ping: 1 });
        // console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);

//////////// 

app.get('/', (req, res) => {
    res.send('SERVER IS RUNNING');
});
app.listen(port, () => {
    console.log(`RUNNING ON PORT: ${port}`);
});