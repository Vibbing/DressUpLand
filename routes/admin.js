const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController')
const auth = require('../middleware/auth')
const multer = require('../config/multer')


/* GET Dashboard */
router.get('/dashboard', auth.adminAuth, adminController.getDashboard)

/* GET Login Page. */
router.get('/login', auth.adminAuth, adminController.getLogin)

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

/* GET editCategory Page. */
router.get('/editCategory',auth.adminAuth,adminController.getEditCategory)

/* Post editCategory Page. */
router.get('/editCategory',auth.adminAuth,adminController.postEditCategory)

router.route('/api/edit-category/:id').get(auth.adminAuth,adminController.handleEditCategorys).patch(adminController.handleEditCategoryPatch);

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
/* GET ProductList Page. */
router.get('/productList',auth.adminAuth, adminController.getProductList)


/* GET error Page. */
// router.get('/error',adminController.errorPage)
module.exports = router;
