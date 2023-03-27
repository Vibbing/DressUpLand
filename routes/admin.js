const express = require('express');
const router = express.Router();
const multer = require('multer')
const adminController = require('../controllers/adminController')

//Multer_Function
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, 'public/productImages')
    },
    filename: function (req, file, cb) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
      cb(null, file.fieldname + '-' + uniqueSuffix)
    }
  })
  
  const upload = multer({ storage: storage })

/* GET Dashboard */
router.get('/dashboard',adminController.getDashboard)

/* GET Login Page. */
router.get('/login',adminController.getLogin)

/* Post Login Page. */
router.post('/login',adminController.postLogin)

/* GET addCategory Page. */
router.get('/addCategory',adminController.getAddCategory)

/* Post addCategory Page. */
router.post('/addCategory',adminController.postAddCategory)

/* GET editCategory Page. */
router.get('/editCategory',adminController.getEditCategory)

/* Post editCategory Page. */
router.get('/editCategory',adminController.postEditCategory)

/* GET addProduct Page. */
router.get('/addProduct',adminController.getAddProduct)

/* Post addProduct Page. */
router.post('/addProduct',upload.array('image'),adminController.postAddProduct);

/* GET EditProduct Page. */
router.get('/editProduct/:id',adminController.getEditProduct)

router.post('/editProduct/:id',adminController.getEditProduct)


/* GET ProductList Page. */
router.get('/productList',adminController.getProductList)


router.route('/api/edit-category/:id').get(adminController.handleEditCategorys).patch(adminController.handleEditCategoryPatch);

/* Delete Category Page. */
router.delete('/api/delete-category/:id',adminController.deleteCategory)
/* GET error Page. */
// router.get('/error',adminController.errorPage)
module.exports = router;
