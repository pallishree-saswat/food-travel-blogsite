const mongoose = require('mongoose');
const User = require('./user');

const reviewSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },

    comment: {
        type: String,
        required: true
    },
    postedBy:{
        type:String
      },
},  { timestamps: true })

const Review = mongoose.model('Review',reviewSchema);

module.exports = Review;