const Blog = require('../models/Blog');
const { validationResult } = require('express-validator');

exports.getBlogs = async (req, res) => {
  try {
    const blogs = await Blog.find()
      .populate('author', 'name email')
      .populate('comments.user', 'name email');
    res.json(blogs);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching blogs', error: error.message });
  }
};

exports.getBlog = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id)
      .populate('author', 'name email')
      .populate('comments.user', 'name email');
    if (!blog) {
      return res.status(404).json({ message: 'Blog not found' });
    }
    res.json(blog);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching blog', error: error.message });
  }
};

exports.createBlog = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const blog = await Blog.create({
      ...req.body,
      author: req.user.id
    });
    res.status(201).json(blog);
  } catch (error) {
    res.status(500).json({ message: 'Error creating blog', error: error.message });
  }
};

exports.updateBlog = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) {
      return res.status(404).json({ message: 'Blog not found' });
    }

    if (blog.author.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to update this blog' });
    }

    const updatedBlog = await Blog.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: Date.now() },
      { new: true }
    );
    res.json(updatedBlog);
  } catch (error) {
    res.status(500).json({ message: 'Error updating blog', error: error.message });
  }
};

exports.deleteBlog = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) {
      return res.status(404).json({ message: 'Blog not found' });
    }

    if (blog.author.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to delete this blog' });
    }

    await Blog.findByIdAndDelete(req.params.id);
    res.json({ message: 'Blog deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting blog', error: error.message });
  }
};

exports.addComment = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) {
      return res.status(404).json({ message: 'Blog not found' });
    }

    blog.comments.push({
      user: req.user.id,
      content: req.body.content
    });

    await blog.save();
    res.json(blog);
  } catch (error) {
    res.status(500).json({ message: 'Error adding comment', error: error.message });
  }
};