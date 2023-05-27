const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController')
const auth = require('../middleware/auth')
const multer = require('../config/multer');
const orderControllers = require('../controllers/orderControllers');


/* GET Dashboard */
router.get('/dashboard', auth.adminAuth, adminController.getDashboard)

/* GET Login Page. */
router.get('/login',auth.adminRedirecting, adminController.getLogin)

/* Post Login Page. */
router.post('/login',  adminController.postLogin)

/* Post Login Page. */
router.get('/logout',adminController.doLogout)

/* GET User List Page. */
router.get('/userList', auth.adminAuth,adminController.getUserList)

// Put change user stastus//
router.put('/change_user_status',adminController.changeUserStatus)

/* GET addCategory Page. */
router.get('/addCategory',auth.adminAuth, adminController.getAddCategory)

/* Post addCategory Page. */
router.post('/addCategory',adminController.postAddCategory)

// /* GET and Post editCategory Page. */

router.route('/api/edit-category/:id').get(auth.adminAuth,adminController.handleEditCategorys).patch(adminController.handleEditCategoryPatch);

/* GET Sub Category list for Add Product Page. */
router.route('/getSubcategories').post(adminController.getSubCategory)

/* Delete Sub Category Page. */
router.route('/remove-subCategory/:id').delete(adminController.removeSubCategory)

/* Delete Category Page. */
router.delete('/api/delete-category/:id',adminController.deleteCategory)

/* GET addProduct Page. */
router.get('/addProduct',auth.adminAuth,adminController.getAddProduct)

/* Post addProduct Page. */
router.post('/addProduct',multer.uploads, adminController.postAddProduct);

/* GET EditProduct Page. */
router.get('/editProduct/:id',auth.adminAuth,adminController.getEditProduct)

/* Post EditProduct Page. */
router.post('/editProduct/:id',multer.editeduploads,adminController.postEditProduct)

/*  Delete Product Page. */
router.delete('/deleteProduct/:id',adminController.deleteProduct)

/* GET Product List Page. */
router.get('/productList',auth.adminAuth, adminController.getProductList)

/* GET Order List Page. */
router.route('/order-list/:id').get(auth.adminAuth, adminController.getOrderList)

/* GET Order Details Page. */
router.route('/order-details').get(auth.adminAuth, adminController.getOrderDetails)

/* POST Order Status Page. */
router.route('/change-order-status').post(orderControllers.changeOrderStatus)

/* GET Add Coupon Page. */
router.route('/add-coupon').get(auth.adminAuth,adminController.getAddCoupon).post(adminController.postaddCoupon)

/* GET Generate Coupon Code Page. */
router.route('/generate-coupon-code').get(auth.adminAuth,adminController.generatorCouponCode)

/* GET Coupon List Page. */
router.route('/coupon-list').get(auth.adminAuth,adminController.getCouponList)

/* DELETE Coupon  Page. */
router.route('/remove-coupon').delete(adminController.removeCoupon)

/* GET and POST Sales Report Page. */
router.route('/sales-report').get( auth.adminAuth,adminController.getSalesReport).post(adminController.postSalesReport)

router.route('/add-banner').get(auth.adminAuth,adminController.getAddBanner).post(multer.addBannerupload,adminController.postAddBanner)

router.route('/banner-list').get(auth.adminAuth, adminController.getBannerList)

router.route('/edit-banner').get(auth.adminAuth, adminController.getEditBanner)

router.route('/edit-banner').post(multer.editBannerupload,adminController.postEditBanner)

router.route('/delete-banner/:id').delete(auth.adminAuth,adminController.deleteBanner)


/* GET error Page. */
// router.get('/error',adminController.errorPage)
module.exports = router;
