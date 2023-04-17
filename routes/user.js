const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController')
const cartController = require('../controllers/cartController')
const orderController = require('../controllers/orderControllers')
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
router.post('/otp-login',auth.userAuth, userController.otpLogin)

/* Post Otp vefify Page. */
router.post('/otp-verify', auth.userAuth, userController.otpVerify)

/* GET Shop Page. */
router.get('/shop',auth.userAuth, userController.getShop)

/* GET Product Detail Page. */
router.get('/product-detail/:id', auth.userAuth, userController.getProductDetail)

/* GET Cart Page */
router.get('/cart-list',auth.userAuth, cartController.getCart)

/* POST ADD To Cart Page */
router.post('/add-to-cart/:id',cartController.addToCart)

/* POST Update cart quantity Page */
router.patch('/change-product-quantity',auth.userAuth,cartController.updateQuantity)

/* Delete product from cart*/
router.delete('/delete-product-cart',auth.userAuth,cartController.deleteProduct)

/* GET User Profile Page */
router.get('/get-profile',auth.userAuth,orderController.getAddress)

/* POST Address Page */
router.route('/add-address').post(auth.userAuth,orderController.postAddress)

/* GET Check Out Page */
router.get('/check-out',auth.userAuth,orderController.getCheckOut)

/* POST Check Out Page */
router.post('/check-out',orderController.postCheckOut)

router.route('/order-product/:id').get(auth.userAuth,orderController.getProduct)

router.route('/verify_payment').post(auth.userAuth,orderController.verifyPayment)


module.exports = router;
