const fs = require('fs');
const path = require('path');
const Product = require('../models/product');
const Order = require('../models/order');
const stripe = require('stripe')(process.env.STRIPE_KEY);

const ITEMS_PER_PAGE = 2;

const PDFDocument = require('pdfkit');
// const Cart = require('../models/cart');

exports.getProducts = (req, res, next) => {
  const isLoggedIn = req.session.isLoggedIn;
  let totalItems;
  const page = +req.query.page || 1; // || 1 means that is page is NaN or undefined we use default value as 1
  Product.find()
    .countDocuments()
    .then((numProducts) => {
      totalItems = numProducts;
      return Product.find()
        .skip((page - 1) * ITEMS_PER_PAGE) //mongoose function to skip from the begining
        .limit(ITEMS_PER_PAGE); // how much product we want to display
    })
    .then((products) => {
      console.log(products);
      res.render('shop/product-list', {
        path: '/products',
        prods: products,
        docTitle: 'Products List',
        pageTitle: 'Products List',
        hasProducts: products.length > 0,
        isAuthenticated: isLoggedIn,
        currentPage: page,
        hasNextPage: ITEMS_PER_PAGE * page < totalItems,
        hasPreviousPage: page > 1,
        nextPage: page + 1,
        previousPage: page - 1,
        lastPage: Math.ceil(totalItems / ITEMS_PER_PAGE),
      });
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};
exports.getIndex = (req, res, next) => {
  const isLoggedIn = req.session.isLoggedIn;
  let totalItems;
  const page = +req.query.page || 1; // || 1 means that is page is NaN or undefined we use default value as 1
  Product.find()
    .countDocuments()
    .then((numProducts) => {
      totalItems = numProducts;
      return Product.find()
        .skip((page - 1) * ITEMS_PER_PAGE) //mongoose function to skip from the begining
        .limit(ITEMS_PER_PAGE); // how much product we want to display
    })
    .then((products) => {
      res.render('shop/index', {
        path: '/',
        prods: products,
        docTitle: 'Shop',
        pageTitle: 'Shop',
        hasProducts: products.length > 0,
        currentPage: page,
        hasNextPage: ITEMS_PER_PAGE * page < totalItems,
        hasPreviousPage: page > 1,
        nextPage: page + 1,
        previousPage: page - 1,
        lastPage: Math.ceil(totalItems / ITEMS_PER_PAGE),
      });
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getProduct = (req, res, next) => {
  const isLoggedIn = req.session.isLoggedIn;
  const prodId = req.params.productId;
  //findById defined by mongoose
  Product.findById(prodId)
    .then((product) => {
      res.render('shop/product-detail', {
        product: product,
        pageTitle: product.title,
        path: '/products',
        isAuthenticated: isLoggedIn,
      });
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
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
  const isLoggedIn = req.session.isLoggedIn;
  req.user
    .populate('cart.items.productId')
    .execPopulate()
    .then((user) => {
      console.log(user.cart.items);
      const products = user.cart.items;
      res.render('shop/cart', {
        pageTitle: 'Your Cart',
        path: '/cart',
        products: products,
        isAuthenticated: isLoggedIn,
      });
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.postCartDeleteProduct = (req, res, next) => {
  const prodId = req.body.productId;

  req.user
    .removeFromCart(prodId)
    .then((result) => {
      res.redirect('/cart');
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};
exports.getCheckout = (req, res, next) => {
  const isLoggedIn = req.session.isLoggedIn;
  let products;
  let total = 0;
  req.user
    .populate('cart.items.productId')
    .execPopulate()
    .then((user) => {
      products = user.cart.items;
      products.forEach((p) => {
        total += p.quantity * p.productId.price;
      });

      return stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: products.map((p) => {
          return {
            name: p.productId.title,
            description: p.productId.description,
            amount: p.productId.price * 100,
            currency: 'usd',
            quantity: p.quantity,
          };
        }), //we are transform product with map function
        success_url:
          req.protocol + '://' + req.get('host') + '/checkout/success',
        cancel_url: req.protocol + '://' + req.get('host') + '/checkout/cancel',
      });
    })
    .then((session) => {
      res.render('shop/checkout', {
        pageTitle: 'Checkout',
        path: '/checkout',
        products: products,
        totalSum: total,
        isAuthenticated: isLoggedIn,
        sessionId: session.id,
      });
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getCheckoutSuccess = (req, res, next) => {
  req.user
    .populate('cart.items.productId')
    .execPopulate()
    .then((user) => {
      const products = user.cart.items.map((i) => {
        return { quantity: i.quantity, product: { ...i.productId._doc } };
      });
      const order = new Order({
        user: {
          email: req.user.email,
          userId: req.user, //pick id from object
        },
        products: products,
      });
      return order.save();
    })
    .then((result) => {
      return req.user.clearCart();
    })
    .then((result) => {
      res.redirect('/orders');
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};
//---debrecated---
exports.postOrder = (req, res, next) => {
  req.user
    .populate('cart.items.productId')
    .execPopulate()
    .then((user) => {
      const products = user.cart.items.map((i) => {
        return { quantity: i.quantity, product: { ...i.productId._doc } };
      });
      const order = new Order({
        user: {
          email: req.user.email,
          userId: req.user, //pick id from object
        },
        products: products,
      });
      return order.save();
    })
    .then((result) => {
      return req.user.clearCart();
    })
    .then((result) => {
      res.redirect('/orders');
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getOrders = (req, res, next) => {
  const isLoggedIn = req.session.isLoggedIn;
  //magic method for sequilize
  //     .getOrders({inculde:['products']}) from sequilize we include our 'product' items what related to the order
  //cause we have that line in app.js Order.belongsToMany(Product, { through: OrderItem });
  Order.find({ 'user.userId': req.user._id })
    .then((orders) => {
      res.render('shop/orders', {
        pageTitle: 'Your orders',
        path: '/orders',
        orders: orders,
        isAuthenticated: isLoggedIn,
      });
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getInvoice = (req, res, next) => {
  const orderId = req.params.orderId;
  Order.findById(orderId)
    .then((order) => {
      if (!order) {
        return next(new Error('No order found.'));
      }
      if (order.user.userId.toString() !== req.user._id.toString()) {
        return next(new Error('Unauthorized'));
      }
      const invoiceName = 'invoice-' + orderId + '.pdf';
      const invoicePath = path.join('data', 'invoices', invoiceName);

      const pdfDoc = new PDFDocument();
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Distination',
        'inline; filename="' + invoiceName + '"'
      ); //we can declare here name of order change name
      pdfDoc.pipe(fs.createWriteStream(invoicePath));
      pdfDoc.pipe(res);
      pdfDoc.fontSize(26).text('Invoce', { underline: true });

      pdfDoc.text('-----------------');
      let totalPrice = 0;
      order.products.forEach((prod) => {
        totalPrice = totalPrice + prod.quantity * prod.product.price;
        pdfDoc
          .fontSize(14)
          .text(
            prod.product.title +
              ' - ' +
              prod.quantity +
              ' x ' +
              '$' +
              prod.product.price
          );
      });
      pdfDoc.text('-------');
      pdfDoc.fontSize(30).text('Total: $' + totalPrice);
      pdfDoc.end();
      // fs.readFile(invoicePath, (err, data) => {
      //   if (err) {
      //     return next(err);
      //   }
      //   // in that option we can find how to control (change name/ or download/open file in a browser)
      //   //jsut we have to setHeaders
      //   res.setHeader('Content-Type', 'application/pdf');
      //   res.setHeader(
      //     'Content-Distination',
      //     'inline; filename="' + invoiceName + '"'
      //   ); //we can declare here name of order change name
      //   res.send(data);
      // });
      // const file = fs.createReadStream(invoicePath);

      // file.pipe(res); // only for createReadStream to solve with big files.
    })
    .catch((err) => {
      next(err);
    });
};

// // exports.getCheckout = (req, res, next) => {
// //   res.render('shop/checkout', {
// //     pageTitle: 'Checkout',
// //     path: '/checkout',
// //   });
// // };
