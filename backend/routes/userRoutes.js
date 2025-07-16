const express = require('express') ;
const { registerUser , authUser , allUsers , getPublicKey } = require('../controllers/userControllers');
const { setPublicKey } = require('../controllers/userControllers');
const {protect} = require('../middleware/authMiddleware');

const router = express.Router() ;

router.route('/').post(registerUser).get(protect , allUsers)
router.post('/login' , authUser)
router.post('/publicKey', protect, setPublicKey)
router.get('/:userId/publicKey', protect, getPublicKey)

module.exports = router