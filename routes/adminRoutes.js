// routes/adminRoutes.js
const express = require('express');
const router = express.Router();
const { getAllUsers, changeUserStatus, deleteUser, editUser   } = require('../controllers/adminController');


router.get('/users', getAllUsers);
router.post('/change-status', changeUserStatus);
router.delete('/users/:userId', deleteUser); // Fixed: added deleteUser
router.put('/users/:userId', editUser);
// In your user routes file (e.g., routes/users.js)
router.get('/:userId', async (req, res) => {
    try {
        const user = await User.findById(req.params.userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
