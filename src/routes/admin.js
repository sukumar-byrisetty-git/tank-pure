const express = require('express');
const auth = require('../middlewares/auth');
const { requireRole } = require('../middlewares/roles');
const { assignWorker, dashboard, createUser, updateUserRole } = require('../controllers/adminController');

const router = express.Router();

router.put('/assign-worker', auth, requireRole('admin', 'superadmin'), assignWorker);
router.get('/dashboard', auth, requireRole('admin', 'superadmin'), dashboard);

// Superadmin only:
router.post('/users', auth, requireRole('superadmin'), createUser);
router.put('/users/:id/role', auth, requireRole('superadmin'), updateUserRole);

module.exports = router;
