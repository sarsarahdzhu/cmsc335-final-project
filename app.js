const express = require('express');
const bodyParser = require('body-parser');
const fs = require("fs");
const path = require('path');
const {MongoClient, ServerApiVersion} = require('mongodb');
const app = express();



const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: String,
    email: String,
    tag: String,
    waifuImageUrl: String,  // Store the waifu image URL
});

const User = mongoose.model('User', userSchema);

module.exports = User;

//const NodeCache = require('node-cache');
//const cache = new NodeCache();

app.use(bodyParser.urlencoded({ extended: false }));
app.set("views", path.resolve(__dirname, "templates"));
app.set("view engine", "ejs");
// app.use(express.static(path.join(__dirname, 'public')));
app.use('/css', express.static(path.join(__dirname, 'css')));

const PORTNUMBER = process.env.PORT || 3000;

// connecting to the database on MongoDB
require("dotenv").config({path: path.resolve(__dirname, '.env')});
// retriving values from .env file
const db = process.env.MONGO_DB_NAME;
const collection = process.env.MONGO_COLLECTION;
const username = process.env.MONGO_DB_USERNAME;
const password = process.env.MONGO_DB_PASSWORD;

// other values needed to connect 
const databaseAndCollection = {db: db, collection:collection};
const uri = `mongodb+srv://${username}:${password}@cluster0.4ykhc.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`
const client = new MongoClient(uri, { serverApi: ServerApiVersion.v1 });


async function connectToMongoDB() {
    try {
        await client.connect();
        console.log("Connected")
    } catch (error) {
        console.error(`ERROR connecting to MongoDB server: ${error}`);
    } 
}
connectToMongoDB();

async function fetchWaifu(tag) {
    const apiUrl = 'https://api.waifu.im/search';
    const params = { included_tags: tag };  // Pass the selected tag to the API

    const queryParams = new URLSearchParams(params);
    const requestUrl = `${apiUrl}?${queryParams.toString()}`;

    try {
        const response = await fetch(requestUrl);
        if (!response.ok) {
            throw new Error('Request failed with status code: ' + response.status);
        }

        const data = await response.json();
        if (data.images && data.images.length > 0) {
            return data.images[0].url;  // Return the first waifu image URL
        } else {
            return null;
        }
    } catch (error) {
        console.error('Error fetching waifu:', error);
        return null;
    }
}

// Add user to MongoDB with Name, Email, Tag, and Waifu Image URL
async function addUserToDatabase(name, email, tag, waifuImageUrl) {
    const database = client.db(db);
    const userCollection = database.collection(collection);

    const newUser = {
        name: name,
        email: email,
        tag: tag,
        waifuImageUrl: waifuImageUrl
    };

    try {
        await userCollection.insertOne(newUser);
        console.log("User added to the database:", newUser);
    } catch (error) {
        console.error("Error adding user to the database:", error);
    }
}

// async function getWaifuImageByUsername(username) {
//     try {
//       const user = await User.findOne({ name: username }); // Query user by name
//       if (user) {
//         return user.waifuImageUrl; // Return the waifu image URL
//       } else {
//         return 'No waifu found for this username'; // If no user found
//       }
//     } catch (error) {
//       console.error('Error fetching waifu image:', error);
//       return 'Error fetching waifu image';
//     }
//   }

async function findUser(client, databaseAndCollection, userEmail) {
    let filter = {email : userEmail};
    try {
        const res = await client.db(databaseAndCollection.db).collection(databaseAndCollection.collection).findOne(filter);
        if (res) {
            console.log(`Found user email: ${res.email}`);
            return res;
        } else{
            console.log(`Could not find user with email: ${userEmail}`);
            return null;
        }

    } catch (error) {
        console.error(`(ERROR) Finding user email in MongoDB: ${error}`);
        return null;

    }

}

// Route to Handle Waifu Preference Submission and Display Results
app.post('/submit-preference', async (req, res) => {
    const { name, email, tag } = req.body;

    // Fetch waifu image based on the selected tag
    const waifuImageUrl = await fetchWaifu(tag);

    // Add the user with waifu information to the database
    await addUserToDatabase(name, email, tag, waifuImageUrl);

    // Render the result page with user's preference and fetched waifu image
    res.render('result', {
        name: name,
        tag: tag,
        waifuImage: waifuImageUrl
    });
});


// Route to view saved waifus
app.get('/saveWai', (req, res) => {
    res.render("saved");
});

app.post('/waifu-search', async (req, res) => {
   const userEmail = req.body.email;
   const user = await findUser(client, databaseAndCollection, userEmail);

   if (user) {
    let userData = {
        name : user.name,
        email: user.email,
        tag: user.tag,
        waifuImageUrl: user.waifuImageUrl

    }
    res.render("processSaved", userData);
}else {
    let userData = {
        name : "NONE",
        email: "NONE",
        tag: "NONE",
        waifuImageUrl: "NONE"
    }
    res.render("processSaved", userData);
}
   

  });

// Route to Render the Home Page (index)
app.get('/', (req, res) => {
    res.render('index');  // home.ejs should be the initial page where users input preferences
});


// Start the server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

