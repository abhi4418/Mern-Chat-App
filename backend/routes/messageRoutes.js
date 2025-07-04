const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { sendMessage, allMessages, editMessage } = require('../controllers/messageControllers');

const router = express.Router(); 

router.route('/').post(protect , sendMessage) 
router.route('/:chatId').get(protect , allMessages)
router.route('/edit').put(protect, editMessage)

module.exports = router ;
