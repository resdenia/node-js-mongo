const Product = require('../models/product');
const { validationResult } = require('express-validator/check');
const product = require('../models/product');
const fileHelper = require('../util/file');

exports.getAddProduct = (req, res, next) => {
    const isLoggedIn = req.session.isLoggedIn;
    // console.log('In anonther middleware!');
    //res.sendFile(path.join(rootDir, 'views', 'add-product.html'));
    //for templating we suppose to render files not to send. Send using only for static

    res.render('admin/edit-product', {
        pageTitle: 'Add Products',
        path: '/admin/add-product',
        editing: false,
        hasError: false,
        errorMessage: null,
        isAuthenticated: isLoggedIn,
        validationErrors: [],
    });
};
exports.postAddProduct = (req, res) => {
    // res.sendFile(path.join(rootDir, 'views', 'add-product.html'));
    // products.push({ title: req.body.title });
    //   const title = req.body.title;
    const image = req.file;
    //   const price = req.body.price;
    //   const description = req.body.description;
    const { title, price, description } = req.body;
    const errors = validationResult(req);
    //   console.log(image);
    if (!image) {
        return res.status(422).render('admin/edit-product', {
            pageTitle: 'Add Products',
            path: '/admin/add-product',
            editing: false,
            hasError: true,
            isAuthenticated: req.session.isLoggedIn,
            product: {
                title: title,
                price: price,
                description: description,
            },
            errorMessage: errors.array()[0].msg,
            validationErrors: errors.array(),
        });
    }

    if (!errors.isEmpty()) {
        console.log('46', errors);
        return res.status(422).render('admin/edit-product', {
            pageTitle: 'Add Products',
            path: '/admin/add-product',
            editing: false,
            hasError: true,
            isAuthenticated: req.session.isLoggedIn,

            product: {
                title: title,
                price: price,
                imageUrl: imageUrl,
                description: description,
            },
            errorMessage: 'Attached file is not an image.',
            validationErrors: [],
        });
    }

    //sequelize with user created by user
    const imageUrl = image.path;
    console.log(imageUrl);
    console.log(image);

    const product = new Product({
        title: title,
        price: price,
        description: description,
        imageUrl: imageUrl,
        userId: req.user._id,
    });
    product
        .save()
        .then((result) => {
            console.log('Created Product');
            res.redirect('/admin/products');
        })
        .catch((err) => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
};

exports.getProducts = (req, res, next) => {
    const isLoggedIn = req.session.isLoggedIn;
    Product.find({ userId: req.user._id })
        // .select('title price -_id')
        // .populate('userId')
        .then((products) => {
            res.render('admin/products', {
                path: '/admin/products',
                prods: products,
                docTitle: 'Admin Products List',
                pageTitle: 'Admin Products List',
                isAuthenticated: isLoggedIn,
            });
        })
        .catch((err) => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
};
exports.getEditProduct = (req, res, next) => {
    const isLoggedIn = req.session.isLoggedIn;
    //get query params examle url/?name=Anton&secondname=Kolomiiets
    const editMode = req.query.edit; // where edit it's name of vairalbe that i call ?edit=True
    if (!editMode) {
        res.redirect('/');
    }

    const prodId = req.params.productId;

    Product.findById(prodId)
        .then((product) => {
            if (!product) {
                res.redirect('/');
            }
            res.render('admin/edit-product', {
                pageTitle: 'Edit Products',
                path: '/admin/edit-product',
                editing: editMode,
                product: product,
                hasError: false,
                isAuthenticated: isLoggedIn,
                errorMessage: null,
                validationErrors: [],
            });
        })
        .catch((err) => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
};

exports.postEditProduct = (req, res, next) => {
    //comes from edit-post hidden field productId
    const prodId = req.body.productId;
    const updateTitle = req.body.title;
    const updatePrice = req.body.price;
    const image = req.file;
    const updateDesc = req.body.description;
    console.log(req.body);
    if (image) {
        fileHelper.deleteFile(product.imageUrl);
        product.imageUrl = image.path;
    }
    console;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        console.log(errors);
        return res.status(422).render('admin/edit-product', {
            pageTitle: 'Edit Products',
            path: '/admin/edit-product',
            editing: true,
            hasError: true,
            product: {
                title: updateTitle,
                imageUrl: image.path,
                price: updatePrice,
                description: updateDesc,
                _id: prodId,
            },
            errorMessage: errors.array()[0].msg,
            validationErrors: errors.array(),
        });
    }
    // const product = new Product(
    //   updateTitle,
    //   updatePrice,
    //   updateDesc,
    //   updateImageUrl,
    //   prodId
    // );
    Product.findById(prodId)
        .then((product) => {
            if (product.userId.toString() !== req.user._id.toString()) {
                return res.redirect('/');
            }
            product.title = updateTitle;
            product.price = updatePrice;
            product.descirption = updateDesc;
            product.imageUrl = image.path;
            return product.save().then((result) => {
                console.log('Updated Product');
                res.redirect('/admin/products');
            });
        })

        .catch((err) => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
};

exports.DeleteProduct = (req, res) => {
    const prodId = req.params.productId;
    Product.findById(prodId)
        .then((product) => {
            if (!product) {
                return next(new Error('Product not exists!'));
            }
            fileHelper.deleteFile(product.imageUrl);
            return Product.deleteOne({ _id: prodId, userId: req.user._id });
        })
        .then((result) => {
            // console.log('PRODUCT REMOVED');
            res.status(200).json({ message: 'Success!' });
        })
        .catch((err) => {
            res.status(500).json({ message: 'Deleting product failed.' });
            // const error = new Error(err);
            // error.httpStatusCode = 500;
            // return next(error);
        });
};
