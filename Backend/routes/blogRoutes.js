const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const { check } = require('express-validator');
const {
  getBlogs,
  getBlog,
  createBlog,
  updateBlog,
  deleteBlog,
  addComment
} = require('../controllers/blogController');

const router = express.Router();

const blogValidation = [
  check('title').notEmpty().trim(),
  check('content').notEmpty(),
  check('featuredImage').notEmpty().isURL(),
  check('tags').isArray()
];

router.get('/', getBlogs);
router.get('/:id', getBlog);

router.post('/', protect, authorize('admin'), blogValidation, createBlog);
router.put('/:id', protect, authorize('admin'), blogValidation, updateBlog);
router.delete('/:id', protect, authorize('admin'), deleteBlog);

router.post('/:id/comments', protect, 
  [check('content').notEmpty().trim()],
  addComment
);

module.exports = router;