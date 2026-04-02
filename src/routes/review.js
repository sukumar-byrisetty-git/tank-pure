const express = require('express');
const auth = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const { createReview } = require('../controllers/reviewController');
const { createReviewSchema } = require('../validators/reviewValidator');

const router = express.Router();

router.post('/', auth, validate(createReviewSchema), createReview);

module.exports = router;
