// models/User.js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: String,
    email: String,
    tag: String,
    waifuImageUrl: String,  // Store the waifu image URL
});

const User = mongoose.model('User', userSchema);

module.exports = User;