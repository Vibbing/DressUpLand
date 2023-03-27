const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController')

/* GET Home Page. */
router.get('/',userController.getHomePage)

/* GET SignUp Page. */
router.get('/signup',userController.getSignup)

/* Post SignUp Page. */
router.post('/signup',userController.postSignup)

/* GET Login Page. */
router.get('/login',userController.getLogin)

/* Post Login Page. */
router.post('/login',userController.postLogin)

/* GET LogOut Page. */
router.get('/logout',userController.getLogout)


/* GET Shop Page. */
router.get('/shop',userController.getShop)



module.exports = router;
