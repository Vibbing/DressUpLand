const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController')
const cartController = require('../controllers/cartController')
const auth = require('../middleware/auth')

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

/* Post Otp Login Page. */
router.post('/otp-login',userController.otpLogin)

/* GET Shop Page. */
router.get('/shop',auth.userAuth, userController.getShop)

/* GET Product Detail Page. */
router.get('/product-detail/:id', auth.userAuth, userController.getProductDetail)

/* GET Cart Page */
router.get('/cart-list',cartController.getCart)



module.exports = router;
