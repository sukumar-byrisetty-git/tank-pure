const express = require('express');
const auth = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const { addTank, listTanks } = require('../controllers/tankController');
const { addTankSchema } = require('../validators/tankValidator');

const router = express.Router();

router.post('/add', auth, validate(addTankSchema), addTank);
router.get('/list', auth, listTanks);

module.exports = router;
