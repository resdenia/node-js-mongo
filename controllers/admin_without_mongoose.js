const Product = require('../models/product');

exports.getAddProduct = (req, res, next) => {
  // console.log('In anonther middleware!');
  //res.sendFile(path.join(rootDir, 'views', 'add-product.html'));
  //for templating we suppose to render files not to send. Send using only for static
  res.render('admin/edit-product', {
    pageTitle: 'Add Products',
    path: '/admin/add-product',
    editing: false,
  });
};
exports.postAddProduct = (req, res) => {
  // res.sendFile(path.join(rootDir, 'views', 'add-product.html'));
  // products.push({ title: req.body.title });
  const title = req.body.title;
  const imageUrl = req.body.imageUrl;
  const price = req.body.price;
  const description = req.body.description;
  //sequelize with user created by user
  const product = new Product(
    title,
    price,
    description,
    imageUrl,
    null,
    req.user._id
  );
  product
    .save()
    .then((result) => {
      console.log('Created Product');
      res.redirect('/admin/products');
    })
    .catch((err) => {
      console.log(err);
    });
};

exports.getProducts = (req, res, next) => {
  Product.fetchAll()
    .then((products) => {
      res.render('admin/products', {
        path: '/admin/products',
        prods: products,
        docTitle: 'Admin Products List',
        pageTitle: 'Admin Products List',
      });
    })
    .catch((err) => {
      console.log(err);
    });
};
exports.getEditProduct = (req, res, next) => {
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
      });
    })
    .catch((err) => {
      console.log(err);
    });
};

exports.postEditProduct = (req, res, next) => {
  //comes from edit-post hidden field productId
  const prodId = req.body.productId;
  const updateTitle = req.body.title;
  const updatePrice = req.body.price;
  const updateImageUrl = req.body.imageUrl;
  const updateDesc = req.body.description;

  const product = new Product(
    updateTitle,
    updatePrice,
    updateDesc,
    updateImageUrl,
    prodId
  );
  product
    .save()
    .then((result) => {
      console.log('Updated Product');
      res.redirect('/admin/products');
    })
    .catch((err) => {
      console.log(err);
    });
};

exports.postDeleteProduct = (req, res) => {
  Product.deleteById(req.body.productId)

    .then((result) => {
      console.log('PRODUCT REMOVED');
      res.redirect('/admin/products');
    })
    .catch((err) => {
      console.log(err);
    });
};
