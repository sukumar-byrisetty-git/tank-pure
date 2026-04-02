const express = require('express');
const multer = require('multer');
const MAX_FILE_SIZE = parseInt(process.env.UPLOAD_MAX_FILE_SIZE || '5242880', 10); // 5MB
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: MAX_FILE_SIZE } });
const auth = require('../middlewares/auth');
const { requireRole } = require('../middlewares/roles');
const { uploadJobImages } = require('../controllers/uploadController');

const router = express.Router();

router.post('/booking/:id', auth, requireRole('worker'), upload.fields([
    { name: 'beforeImages', maxCount: 5 },
    { name: 'afterImages', maxCount: 5 },
]), uploadJobImages);

module.exports = router;
