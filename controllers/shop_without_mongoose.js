const Product = require('../models/product');
// const Cart = require('../models/cart');

exports.getProducts = (req, res, next) => {
  Product.fetchAll()
    .then((products) => {
      res.render('shop/product-list', {
        path: '/products',
        prods: products,
        docTitle: 'Products List',
        pageTitle: 'Products List',
        hasProducts: products.length > 0,
      });
    })
    .catch((err) => {
      console.log(err);
    });
};
exports.getIndex = (req, res, next) => {
  Product.fetchAll()
    .then((products) => {
      res.render('shop/index', {
        path: '/',
        prods: products,
        docTitle: 'Shop',
        pageTitle: 'Shop',
        hasProducts: products.length > 0,
      });
    })
    .catch((err) => {
      console.log();
    });
};

exports.getProduct = (req, res, next) => {
  const prodId = req.params.productId;

  Product.findById(prodId)
    .then((product) => {
      res.render('shop/product-detail', {
        product: product,
        pageTitle: product.title,
        path: '/products',
      });
    })
    .catch((err) => console.log(err));
};
exports.postCart = (req, res, next) => {
  //productId using in product-detail.ejs
  const prodId = req.body.productId;
  Product.findById(prodId)
    .then((product) => {
      return req.user.addCart(product);
    })
    .then((result) => {
      console.log(result);
      res.redirect('/cart');
    });
};

exports.getCart = (req, res, next) => {
  req.user
    .getCart()
    .then((products) => {
      res.render('shop/cart', {
        pageTitle: 'Your Cart',
        path: '/cart',
        products: products,
      });
    })
    .catch((err) => {
      console.log(err);
    });
};

exports.postCartDeleteProduct = (req, res, next) => {
  const prodId = req.body.productId;

  req.user
    .deleteItemFromCart(prodId)
    .then((result) => {
      res.redirect('/cart');
    })
    .catch((err) => {
      console.log(err);
    });
};

exports.postOrder = (req, res, next) => {
  req.user
    .addOrder()
    .then((result) => {
      res.redirect('/orders');
    })
    .catch((err) => {
      console.log(err);
    });
};

exports.getOrders = (req, res, next) => {
  //magic method for sequilize
  //     .getOrders({inculde:['products']}) from sequilize we include our 'product' items what related to the order
  //cause we have that line in app.js Order.belongsToMany(Product, { through: OrderItem });

  req.user
    .getOrders()
    .then((orders) => {
      res.render('shop/orders', {
        pageTitle: 'Your orders',
        path: '/orders',
        orders: orders,
      });
    })
    .catch((err) => {
      console.log(err);
    });
};

// // exports.getCheckout = (req, res, next) => {
// //   res.render('shop/checkout', {
// //     pageTitle: 'Checkout',
// //     path: '/checkout',
// //   });
// // };
