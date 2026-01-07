const express = require('express');
const router = express.Router();
const {
    getDashboardAnalytics,
    getBoardAnalytics,
    getProductivityStats
} = require('../controllers/analyticsController');
const { protect } = require('../middleware/auth');
const { validateObjectId } = require('../middleware/validation');

// All routes are protected
router.use(protect);

router.get('/dashboard', getDashboardAnalytics);
router.get('/boards/:boardId', validateObjectId('boardId'), getBoardAnalytics);
router.get('/productivity', getProductivityStats);

module.exports = router;
