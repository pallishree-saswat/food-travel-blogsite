const express = require('express');
const router = express.Router();
const Post = require('../models/post');
const User = require('../models/user');
const Review = require('../models/review');
const Category = require("../models/category");
const  { isLoggedIn} = require('../middleware/authMiddleware.js')

//File Handler
const upload = require('../utils/multer')
const bufferConversion = require('../utils/bufferConversion')
const cloudinary = require('../utils/cloudinary')


router.get('/', async(req, res) => {
    res.render('posts/home');

})

// Display all the posts
router.get('/home', async(req, res) => {
    
    try {
        const posts=await Post.find({}).sort({ timeCreated: 'desc' });
        const viewedPosts= await Post.find({}).sort({ viewCount: -1 }).limit(3)
        const likedPosts= await Post.find({}).sort({ likes: -1 }).limit(3)
        const categories = await Category.find({}).sort({ createdAt: -1 }).exec()
       //console.log(posts)
        res.render('posts/index',{posts,categories,viewedPosts,likedPosts}); 
    } catch (e) {
        console.log("Something Went Wrong");
        req.flash('error', 'Cannot Find posts');
        res.render('error');
    }
})


//get all followings  post
router.get('/followingpost', isLoggedIn, async(req,res) => {

    try{
    //if postedBy is in the following list then show the post of that posted by
  const posts = await Post.find({user:{$in: req.user.following}})
    .populate("user" ,["_id", "name"])
    .sort('-createdAt')

    //res.json({posts})
    res.render('posts/subpost',{posts}); 

    }
    catch(err){
        console.log(err);
    }
  
})

// Get the form for new post
router.get('/posts/new',isLoggedIn,async (req, res) => {

    const categories = await Category.find({}).sort({ createdAt: -1 }).exec()
    res.render('posts/new',{categories});
})

 // Create New post
router.post('/posts',isLoggedIn, upload.single('img'),  async (req,res) => {
    try {
      
        const imgUrl = await bufferConversion(req.file.originalname, req.file.buffer)
        const imgResponse = await cloudinary.uploader.upload(imgUrl)
        
        const user = await User.findById(req.user._id).select('-password');
        //console.log(user)
         const { name , desc} = req.body.post;
          
          const newPost = await new Post({
             name,
             desc,
             img: imgResponse.secure_url,
             category: req.body.category,
             postedBy:user.username,
             user:req.user._id
          });
             
        
    const createdPost= await newPost.save()
    //console.log(createdPost)
    user.posts.push(newPost._id)
    await user.save()
    res.status(201).redirect('/posts')
 
 
     }  catch (e) {
        console.log(e.message);
        req.flash('error', 'Cannot Create posts,Something is Wrong');
        res.render('error');
    } 
})


// Show particular post
router.get('/posts/:id',isLoggedIn, async(req, res) => {
    try {
        const post=await Post.findById(req.params.id).populate('reviews').populate('category');
        post.viewCount++;
        post.save();
        res.render('posts/show', { post});
    }
    catch (e) {
        console.log(e.message);
        req.flash('error', 'Cannot find this post');
        res.redirect('/error');
    }
})

// Get the edit form
router.get('/posts/:id/edit',isLoggedIn,  async(req, res) => {

    try {
        const post=await Post.findById(req.params.id);
        const categories = await Category.find({}).sort({ createdAt: -1 }).exec()
        res.render('posts/edit',{post,categories});
    }
    catch (e) {
        console.log(e.message);
        req.flash('error', 'Cannot Edit this post');
        res.redirect('/error');
    }
})

// Upadate the particular post
router.patch('/posts/:id',isLoggedIn,  async(req, res) => {
    req.post = await Post.findById(req.params.id);
    let post = req.post;
    post.name = req.body.post.name;
    post.img = req.body.post.img;
    post.desc = req.body.post.desc;
    post.category = req.body.category;
  
    try {
      post = await post.save();
      req.flash('success', 'Updated Successfully!');
      res.redirect(`/posts/${req.params.id}`) 
    }
  
    catch (e) {
        console.log(e.message);
        req.flash('error', 'Cannot update this post');
        res.redirect('/error');
    }
})


// Delete a particular post
router.delete('/posts/:id',isLoggedIn,  async (req, res) => {

    try {
        await Post.findByIdAndDelete(req.params.id);
        req.flash('success', 'Deleted the post successfully');
        res.redirect('/posts');
    }
    catch (e) {
        console.log(e.message);
        req.flash('error', 'Cannot delete this post');
        res.redirect('/error');
    }
})




// Creating a New Comment on a post

router.post('/posts/:id/review',isLoggedIn, async (req, res) => {
    
    try {
        const post = await Post.findById(req.params.id);
        //const review = new Review(req.body);


        const review = new Review({
            user:req.user._id,
            postedBy:req.user.username,
            ...req.body
        });

      post.reviews.push(review);

        await review.save();
        await post.save();

        req.flash('success','Successfully added your review!')
        res.redirect(`/posts/${req.params.id}`);
    }
    catch (e) {
        console.log(e.message);
        req.flash('error', 'Cannot add review to this post');
        res.redirect('/error');
    }
    
});


// Delete a particular comment
router.delete('/review/:id/:review_id', isLoggedIn, async (req, res) => {
    try {
        const post = await Post.findByIdAndUpdate(req.params.id ,{
            $pull:{'reviews': {_id : req.params.review_id}}},{new : true}
        );
        //console.log(post)

        if (!post) {
            return res.status(400).send("Post not found");
          }
      
         await Review.findByIdAndDelete(req.params.review_id);
      
   

         req.flash('success','Successfully delete your review!')
         res.redirect(`/posts/${req.params.id}`);

    } catch (err) {
        console.log(err.message);
        res.status(500).redirect('error')
        
    }
})



//like a post
router.put('/like/:id',isLoggedIn, async (req,res) => {
    try {

    const post = await Post.findById(req.params.id);
    //check if the post has already been liked
      if(post.likes.filter(like => like.user.toString() === req.user.id).length > 0) 
      {
         return res.status(400).json({msg :" post already liked"})
      }

      post.likes.unshift({ user : req.user.id})

      await post.save();
      //res.json(post.likes)
      res.redirect(`/posts/${req.params.id}`);


    } catch (err) {
        console.log(err.message)
    res.status(500).send('Server error')        
    }
});


router.put('/unlike/:id',isLoggedIn, async (req,res) => {
    try {
      
      const post = await Post.findById(req.params.id);

      //check if the post has already been liked
      if(post.likes.filter(like => like.user.toString() === req.user.id).length === 0) 
      {
         return res.status(400).json({msg :" posthas not yet been liked"})
      }

     //get remove index 
     const removeIndex = post.likes
     .map(like => like.user.toString())
     .indexOf(req.user.id);

     post.likes.splice(removeIndex, 1)

      await post.save();
      
      //res.json(post.likes)
      res.redirect(`/posts/${req.params.id}`);
       
    } catch (err) {
        console.log(err.message)
    res.status(500).send('Server error')        
    }
})

//search users
router.post('/search-users',(req,res) => {
    let userPattern = new RegExp("^"+req.body.query)
    User.find({email:{$regex:userPattern}})
    .select("_id email")
    .then(user => {
        res.json({user})
    }).catch(err => {
        console.log(err)
    })
})


router.get('/error', (req, res) => {
    res.status(404).render('error');
});


module.exports = router;