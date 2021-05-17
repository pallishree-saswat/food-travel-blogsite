const express = require('express');
const router = express.Router();
// bring in normalize to give us a proper url, regardless of what user entered
//const normalize = require('normalize-url');
const Profile = require('../models/profile');
const User = require('../models/user');
const Post = require('../models/post');
const  { isLoggedIn} = require('../middleware/authMiddleware.js')
//File Handler
const upload = require('../utils/multer')
const bufferConversion = require('../utils/bufferConversion')
const cloudinary = require('../utils/cloudinary')




// Get the form for profile
router.get('/profile/new',isLoggedIn,(req, res) => {
 
 res.render('profile/new');
})


// Create user profile
router.post('/profile',isLoggedIn, upload.single('pic'),  async (req,res) => {
    try {
      
        const imgUrl = await bufferConversion(req.file.originalname, req.file.buffer)
        const imgResponse = await cloudinary.uploader.upload(imgUrl)
        
        const user = await User.findById(req.user._id).select('-password');
        //console.log(user)
         const { status,bio,location,company} = req.body;
          
          const newProfile = await new Profile({
             status,
             bio,
             location,
             company,
             pic:imgResponse.secure_url,
             user:req.user._id
          });
             
    const createdProfile = await newProfile.save()
    console.log(createdProfile)
    user.profile.push(newProfile._id)
    await user.save()
    res.status(201).redirect('/posts')
 
 
     }  catch (e) {
        console.log(e.message);
        req.flash('error', 'Cannot Create profile,Something is Wrong');
        res.render('error');
    } 
})


// Get the edit form
router.get('/profile/:id/edit',isLoggedIn,  async(req, res) => {

    try {
        const profile =await Profile.findById(req.params.id);
      
        res.render('profile/edit',{profile});
    }
    catch (e) {
        console.log(e.message);
        req.flash('error', 'Cannot Edit this profile');
        res.redirect('/error');
    }
});

// Upadate user profile
router.patch('/profile/:id',isLoggedIn,async(req, res) => {

    try {
        await Profile.findByIdAndUpdate(req.params.id, req.body.profile);
        req.flash('success', 'Updated Successfully!');
        res.redirect(`/user/${req.user._id}`) 
    }
    catch (e) {
        console.log(e.message);
        req.flash('error', 'Cannot update this Product');
        res.redirect('/error');
    }

});


//update profile pic
router.put("/uploadpic/:id",isLoggedIn, upload.single('pic'), async(req,res) => {
  try{
    const imgUrl = await bufferConversion(req.file.originalname, req.file.buffer)
    const imgResponse = await cloudinary.uploader.upload(imgUrl)
    const pic = await  Profile.findByIdAndUpdate(req.params.id,{
        $set:{pic:imgResponse.secure_url}
    },{new:true})
    req.flash('success', 'Updated Successfully!');
    res.redirect(`/posts`) 
    //console.log("profile" ,pic)
    //res.json({pic})
  }
   catch(err){
       console.log(err);
       res.redirect('error')
   }
    

})





module.exports = router;