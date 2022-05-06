const express = require('express');
const path = require('path');
const { check, body } = require('express-validator/check');

//const rootDir = require('../util/path');
const isAuth = require('../middleware/is-auth');
const adminController = require('../controllers/admin');

const router = express.Router();

// we can use the same path if we are using different method(POST,GET)
//and to filter mage we can add before path as /admin to root file

// /admin/add-product => GET
router.get(
    '/add-product',
    adminController.getAddProduct,
    // res.send(
    //   '<form action="/admin/add-product" method="POST"><input type="text" name="title"><button type="submit">Submit</button></form>'
    // );
);

// /admin/add-product => POST isAuth is middleware
router.post(
    '/add-product',
    [
        body('title').isString().trim(),
        body('price').isFloat().trim(),
        body('description').isLength({ min: 5, max: 200 }),
    ],
    isAuth,
    adminController.postAddProduct,
);

// // /admin/add-product => GET
router.get('/products', isAuth, adminController.getProducts);

router.get('/edit-product/:productId', isAuth, adminController.getEditProduct);

router.post(
    '/edit-product',
    [
        body('title').isString().trim(),
        body('price').isFloat().trim(),
        body('description').isLength({ min: 5, max: 200 }),
    ],
    isAuth,
    adminController.postEditProduct,
);
// // //module.exports = router;
router.delete('/product/:productId', isAuth, adminController.DeleteProduct);

module.exports = router;
