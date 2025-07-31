const express = require('express');
const router = express.Router();
const eventController = require('../controllers/eventController');

router.get('/', eventController.getEvents);
router.get('/:slug', eventController.getEventBySlug);
router.post('/', eventController.createEvent);

module.exports = router;
