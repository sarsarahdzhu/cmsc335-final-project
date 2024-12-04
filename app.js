const express = require('express');
const bodyParser = require('body-parser');
const axios = require('./node_modules/axios/index.d.cts');
const fs = require("fs");
const path = require('path');
const {MongoClient, ServerApiVersion} = require('mongodb');
const app = express();

app.use(bodyParser.urlencoded({ extended: false }));
app.set("views", path.resolve(__dirname, "templates"));
app.set("view engine", "ejs");

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
    } catch (error) {
        console.error(`ERROR connecting to MongoDB server: ${error}`);
    } 
}
connectToMongoDB();

// function to add user to the server
async function addUser(client, databaseAndCollection, newUser) {
  try {
      const res = await client.db(databaseAndCollection.db)
          .collection(databaseAndCollection.collection)
          .insertOne(newUser);
          console.log(`User entry created with id ${res.insertedId}`);
  } catch (error) {
      console.error(`(ERROR) inserting new user data into MongoDB: ${error}`)
  }

}

// function to search for a specific user using username 
async function findUser(client, databaseAndCollection, username) {
  let filter = { username: username }; // Filter by username
  try {
      const res = await client.db(databaseAndCollection.db).collection(databaseAndCollection.collection).findOne(filter);
      if (res) {
          console.log(`Found user username: ${res.username}`);
          return res;
      } else {
          console.log(`Could not find user with username: ${username}`);
          return null;
      }
  } catch (error) {
      console.error(`(ERROR) Finding user username in MongoDB: ${error}`);
      return null;
  }
}

// express 
app.get('/', (req, res) => {
  res.render('waifu');  // Render the waifu form
});

app.post('/submit-preference', async (req, res) => {
  const tag = req.body.tag; // Get the user-selected tag
  
  try {
    // Fetch waifu image based on selected preferences
    const waifuImageUrl = await fetchWaifu(tag);
    res.render('result', { waifuImageUrl });  // Display the waifu image in result page
  } catch (err) {
    console.error('Error fetching waifu:', err);
    res.send('<p>Error fetching waifu. Please try again later.</p>');
  }
});

// Fetch waifu image from API based on the selected tag
async function fetchWaifu(tag) {
  const apiUrl = 'https://api.waifu.im/search';
  const params = {
    included_tags: tag,  // Use only the selected tag
  };

  const queryParams = new URLSearchParams();
  for (const key in params) {
    queryParams.set(key, params[key]);
  }

  const requestUrl = `${apiUrl}?${queryParams.toString()}`;

  try {
    const response = await fetch(requestUrl);
    if (!response.ok) {
      throw new Error('Request failed with status code: ' + response.status);
    }

    const data = await response.json();
    if (data.images && data.images.length > 0) {
      return data.images[0].url;  // Return the URL of the first waifu image
    } else {
      return null;
    }
  } catch (error) {
    console.error('Error fetching waifu:', error);
    return null;
  }
}

// Start the server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

