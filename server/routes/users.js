const express = require('express');
const router = express.Router();

// Placeholder user route
router.get('/', (req, res) => {
  res.json({ message: 'User route working' });
});

module.exports = router;
