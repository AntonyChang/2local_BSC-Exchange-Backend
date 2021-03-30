var express = require('express');
var router = express.Router();
var duser        = require('../api/duser_model');
router.use('/duser',duser);
module.exports = router;
