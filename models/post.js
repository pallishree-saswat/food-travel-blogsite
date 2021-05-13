const mongoose = require('mongoose');

const User = require('./user');
const Review = require('./review');
const Category = require('./category');
const domPurifier = require('dompurify');
const { JSDOM } = require('jsdom');
const htmlPurify = domPurifier(new JSDOM().window);

const {stripHtml} = require('string-strip-html');

const postSchema = new mongoose.Schema({
    name: {
        type: String,
        required:true
    },
    img: {
        type: String,
    },
      desc: {
        type: String
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
    },
    timeCreated: {
        type: Date,
        default: () => Date.now(),
      },
      snippet: {
        type: String,
      },
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    postedBy:{
      type:String
    },
    reviews: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref:'Review'
        }
    ],
    likes:[
      {
          user:{
              type:mongoose.Schema.Types.ObjectId,
              ref:'User'
          }
      }
  ],
  viewCount: {
    type: Number,
    required: true,
    default: 0
  }
});


postSchema.pre('validate', function (next) {
    //check if there is a description
    if (this.desc) {
      this.desc = htmlPurify.sanitize(this.desc);
      this.snippet = stripHtml(this.desc.substring(0, 70)).result;
    }
  
    next();
  });



const Post = mongoose.model('Post', postSchema);

module.exports = Post;