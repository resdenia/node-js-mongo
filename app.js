const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const mongoose = require('mongoose');
const path = require('path');
const session = require('express-session');
const MongoDBStore = require('connect-mongodb-session')(session);
const csrf = require('csurf');
const flash = require('connect-flash');
const multer = require('multer');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const https = require('https');

const fileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'images');
  },
  filename: (req, file, cb) => {
    cb(null, Math.round(Math.random() * 1000000000) + '-' + file.originalname);
  },
});
const is404Controller = require('./controllers/404');

const adminData = require('./routes/admin');

const shopRoutes = require('./routes/shop');
const authRoutes = require('./routes/auth');

const MONGODB_URI = `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@cluster0-3crz5.mongodb.net/${process.env.MONGO_DB}?retryWrites=true&w=majority`;

const User = require('./models/user');
const app = express();
const store = new MongoDBStore({
  uri: MONGODB_URI,
  collection: 'sessions',
});
const csrfProtection = csrf();
const privateKey = fs.readFileSync('server.key');
const certificate = fs.readFileSync('server.cert');

//setting view engine template(dynamic content)
// http://expressjs.com/ru/api.html#app.set

//handlebars integration dymapic template
// app.engine(
//   'hbs',
//   expressHbs({
//     layoutsDir: 'views/layouts/',
//     defaultLayout: 'main-layout',
//     extname: 'hbs',
//   })
// );
// app.set('view engine', 'hbs');
// app.set('views', 'views');

// pug build in we do not to declare as app.engine
//app.set('view engine', 'pug');

//if you want to re declare folder for templates
//app.set('views','/templates');

const fileFilter = (req, file, cb) => {
  if (
    file.mimetype === 'image/png' ||
    file.mimetype === 'image/jpg' ||
    file.mimetype === 'image/jpeg'
  ) {
    cb(null, true); //if we want to store file
  } else {
    cb(null, false); //if we don't want to store file
  }
};

//add ejs
app.set('view engine', 'ejs');
app.set('views', 'views');

const accessLogStream = fs.createWriteStream(
  path.join(__dirname, 'acess.log'),
  { flags: 'a' }
);

app.use(helmet());
app.use(compression());
app.use(morgan('combined', { stream: accessLogStream }));

app.use(bodyParser.urlencoded({ extended: false }));
app.use(
  multer({ storage: fileStorage, fileFilter: fileFilter }).single('image')
);
app.use(express.static(path.join(__dirname, 'public')));
app.use('/images', express.static(path.join(__dirname, 'images'))); //adding middleware '/images', if this is declared we put after images

app.use(
  session({
    secret: 'my secret',
    resave: false,
    saveUninitialized: false,
    store: store,
  })
);
app.use(csrfProtection); 
app.use(flash());
app.use((req, res, next) => {
  res.locals.isAuthenticated = req.session.isLoggedIn;
  res.locals.csrfToken = req.csrfToken();
  next();
});

app.use((req, res, next) => {
  if (!req.session.user) {
    return next();
  }
  User.findById(req.session.user._id)
    .then((user) => {
      if (!user) {
        return next();
      }
      req.user = user;
      next();
    })
    .catch((err) => {
      throw new Error(err);
    });
});

// app.use((req, res, next) => {

// });
// app.use((req, res, next) => {
//   console.log('that middleware runs always');
//   next();
// });
app.use('/admin', adminData);
app.use(shopRoutes);
app.use(authRoutes);
app.get('/500', is404Controller.is500);
app.use(is404Controller.is404);
// middleware will be starts for any incoming requests
// app.use((req, res, next) => {
//   console.log('In the middleware!');
//   //we have to call next fucntion to continue to the next middleware
//   // allows the request to continue to the next middleware in a line
//   next();
// });
// to create db tables

//without sequelize
// app.listen(4000, () => {
//   console.log('listening port 4000!!');
// });

app.use((error, req, res, next) => {
  // or res.status(error.httpStatusCode).render(...)
  //res.redirect('/500');
  console.log(error);
  res.status(500).render('500', {
    pageTitle: 'Some issue ocurred',
    path: '/500',
    isAuthenticated: req.session.isLoggedIn,
  });
});

mongoose
  .connect(MONGODB_URI)
  .then((result) => {
    // User.findOne().then((user) => {
    //   if (!user) {
    //     const user = new User({
    //       name: 'Anton',
    //       email: 'resdenia@gmail.com',
    //       cart: {
    //         items: [],
    //       },
    //     });
    //     user.save();
    //   }
    // });

    // code to start ssl/tls on localhost server
    // https
    //   .createServer({ key: privateKey, cert: certificate }, app)
    //   .listen(process.env.PORT || 4000);
    app.listen(process.env.PORT || 4000);
  })
  .catch((err) => {
    console.log(err);
  });
