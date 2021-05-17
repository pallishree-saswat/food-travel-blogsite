const express = require('express');
const router = express.Router();
const User = require('../models/user');
const passport = require('passport');
const { isLoggedIn } = require('../middleware/authMiddleware');
const sendEmail = require('../utils/nodemailer')
/* 
//Email
const sendEmail = require('../utils/nodemailer')

//validation
const validateOTP = require('../validation/otpValidation')
const validateForgotPassword = require('../validation/forgotPassword')
const validateUserUpdatePassword = require('../validation/updatePassword')

*/



//get all users

router.get('/users',isLoggedIn,async(req,res) => {
    const users = await User.find({}).populate('profile',['status','pic','bio','company','location'])
    //console.log(users)
    res.render('profile/all', {users})
   });






// Get the signup form
router.get('/register', async (req, res) => {
    res.render('auth/signup');
})

router.post('/register', async (req, res) => {
    
    try {
        const user = new User({ username: req.body.username, email: req.body.email });
        const newUser = await User.register(user, req.body.password);
        req.flash('success', 'Registered Successfully');
        res.redirect('/home');
    }
    catch (e) {
        req.flash('error', e.message);
        res.redirect('/register')
    }
});


// Get the login form
router.get('/login', async (req, res) => {
    
    res.render('auth/login')
})

router.post('/login',
    passport.authenticate('local',
        {
            failureRedirect: '/login',
            failureFlash: true
        }
    ), (req, res) => {
        req.flash('success', `Welcome Back!! ${req.user.username}`)
        res.redirect('/home');
});


//render profile page for user

router.get('/profile', isLoggedIn, async(req, res) => {
    
    try {
        const user = await User.findById(req.user._id)
        .populate('posts',['name','desc','img','snippet','timeCreated'])
        .populate('profile',['status','pic','bio','company','location'])
        .populate('followers' ,['_id' , 'username'])
        .populate('following' ,['_id' , 'username'])
      
        //console.log(user)

        res.render('auth/profile',{user}); 
    } catch (e) {
        console.log(e,"Something Went Wrong");
        req.flash('error', 'Cannot Find user');
        res.render('error');
    }
});




//get user by id

router.get('/user/:id',isLoggedIn,async(req,res) => {
 const user = await User.findById(req.params.id)
 .populate('posts',['name','desc','img','snippet','timeCreated'])
 .populate('profile',['status','pic','bio','company','location'])
 .populate('followers' ,['_id' , 'username'])
 .populate('following' ,['_id' , 'username'])
 
 //console.log(user)
 res.render('auth/user', {user})
});



// Logout the user from the current session
router.get('/logout', (req, res) => {
    req.logout();
    req.flash('success', 'Logged Out Successfully');
    res.redirect('/login');
})



//followers and following
router.put('/follow/:id', isLoggedIn, (req,res) => {
   
   
     User.findByIdAndUpdate(req.params.id, {
        $push:{followers:req.user._id}
    },{
        new:true
    },(err,result) => {
        if(err){
            return res.status(422).json({error:err})
        }
        User.findByIdAndUpdate(req.user._id,{
            $push:{following:req.params.id}
        },{
            new:true
        }).select("-password").then(result => {
            //res.json(result)
            res.redirect(`/user/${req.params.id}`);
        }).catch(err => {
            return res.status(422).json({error:err})
        })
    }
    )
})

//unfollow and unfollowing
router.put('/unfollow/:id', isLoggedIn, (req,res) => {
    User.findByIdAndUpdate(req.params.id, {
        $pull:{followers:req.user._id}
    },{
        new:true
    },(err,result) => {
        if(err){
            return res.status(422).json({error:err})
        }
        User.findByIdAndUpdate(req.user._id,{
            $pull:{following:req.params.id}
        },{
            new:true
        }).select("-password").then(result => {
           //res.json(result)
           //req.flash('success','You liked the post!')
           res.redirect(`/user/${req.params.id}`);

        }).catch(err => {
            return res.status(422).json({error:err})
        })
    }
    )
})

//forgot password

router.get('/forgotPassword', (req,res) => {
    res.render('auth/followers')
});



router.post('/forgotPassword', async(req, res, next) => {
    try {
     
        const { email } = req.body
        const user = await User.findOne({ email })
        if (!user) {
            errors.email = "Email Not found, Provide registered email"
            return res.status(400).json(errors)
        }
        function generateOTP() {
            var digits = '0123456789';
            let OTP = '';
            for (let i = 0; i < 6; i++) {
                OTP += digits[Math.floor(Math.random() * 10)];
            }
            return OTP;
        }
        const OTP = await generateOTP()
        user.otp = OTP
        await user.save()
        await sendEmail(user.email, OTP, "OTP")
        res.status(200).json({ message: "check your registered email for OTP" })
        const helper = async () => {
            user.otp = ""
            await user.save()
        }
        setTimeout(function () {
            helper()
        }, 300000);
    }
    catch (err) {
        console.log("Error in sending email", err.message)
        return res.status(400).json({ message: `Error in generateOTP${err.message}` })
    }
});


router.post('/changePassword', async (req, res, next) => {
    try {
      
        const { email, otp, newPassword, confirmNewPassword } = req.body
        if (newPassword !== confirmNewPassword) {
            //errors.confirmNewPassword = 'Password Mismatch'
            return res.status(400).json(errors);
        }
        const user = await User.findOne({ email });

        if (user.otp === "") {
            errors.otp = "OTP has expired"
            return res.status(400).json(errors)
        }
        if (user.otp !== otp) {

            errors.otp = "Invalid OTP, check your email again"
            return res.status(400).json(errors)
        }
        let hashedPassword;
        hashedPassword = await bcrypt.hash(newPassword, 10)
        user.password = hashedPassword;
        await user.save()
        return res.status(200).json({ message: "Password Changed" })
    }
    catch (err) {
        console.log("Error in submitting otp", err.message)
        return res.status(400).json({ message: `Error in postOTP${err.message}` })
    }
})

module.exports = router;