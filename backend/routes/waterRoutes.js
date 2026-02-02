const express = require('express');
const router = express.Router();
const water = require('../controllers/waterController');
const auth = require('../middleware/auth');

router.get('/latest',  water.latest);
router.get('/years',   water.years);
router.get('/history', water.history);
router.get('/',        water.list);

router.post('/', water.insert);

module.exports = router;
