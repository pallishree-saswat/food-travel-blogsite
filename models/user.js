const mongoose = require('mongoose');
const Post = require('./post');
const passportLocalMongoose = require('passport-local-mongoose');

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique:true
    },
    posts:[
        {
            type: mongoose.Schema.Types.ObjectId,
            ref:'Post'
        }
    ],
    profile:
        {
            type: mongoose.Schema.Types.ObjectId,
            ref:'Profile'
        },
    following: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    followers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
})

userSchema.plugin(passportLocalMongoose);

const User = mongoose.model('User', userSchema);

module.exports = User;