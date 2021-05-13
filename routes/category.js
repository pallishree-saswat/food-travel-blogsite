const express = require('express');

const router = express.Router();

const Category = require("../models/category");
const { isLoggedIn } = require('../middleware/authMiddleware');
const Post = require("../models/post");
const slugify = require("slugify");



router.get('/category',isLoggedIn,async (req, res) =>{
  //res.json(await Category.find({}).sort({ createdAt: -1 }).exec());
  res.render('category/create')
});

  router.post('/category',isLoggedIn,async (req, res) => {
    try {
      const { name } = req.body;
      const category = await new Category({ name, slug: slugify(name) }).save();
      res.json(category);
      //res.json(await new Category({ name, slug: slugify(name) }).save());
    } catch (err) {
      console.log(err);
      res.status(400).send("Create category failed");
    }
  });

/* exports.read = async (req, res) => {
  let category = await Category.findOne({ slug: req.params.slug }).exec();
  res.json(category);
}; */

router.get("/category/:slug",isLoggedIn, async (req, res) => {
  let category = await Category.findOne({ slug: req.params.slug }).exec();
  // res.json(category);
  const posts = await Post.find({ category }).populate("category").exec();
  res.render('category/categories',{category, posts})
/*   res.json({
    category,
    posts,
  }); */
});



router.put("/category/:slug",isLoggedIn, async (req, res) => {
  const { name } = req.body;
  try {
    const updated = await Category.findOneAndUpdate(
      { slug: req.params.slug },
      { name, slug: slugify(name) },
      { new: true }
    );
    res.json(updated);
  } catch (err) {
    res.status(400).send("Create update failed");
  }
});

router.delete("/category/:slug",isLoggedIn,async (req, res) => {
  try {
    const deleted = await Category.findOneAndDelete({ slug: req.params.slug });
    res.json(deleted);
  } catch (err) {
    res.status(400).send("Create delete failed");
  }
});

module.exports = router;