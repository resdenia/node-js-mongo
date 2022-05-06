const express = require('express');

const authController = require('../controllers/auth');
//we can check header, body, param, query
const { check, body } = require('express-validator/check');
const bcryptjs = require('bcryptjs');

const router = express.Router();

const User = require('../models/user');

router.get('/login', authController.getLogin);

router.get('/signup', authController.getSignup);

router.post(
  '/login',
  [
    check('email')
      .isEmail()
      .withMessage('Please enter valid email')
      .normalizeEmail()
      .custom((value, { req }) => {
        return User.findOne({ email: value }).then((userDoc) => {
          if (!userDoc) {
            return Promise.reject('That email or password invalid');
          }
        });
      })
      .trim(),
    body('password', 'Please fill valid password at least 5 characters. ')
      .isLength({ min: 5, max: 20 })
      .isAlphanumeric()
      .custom((password, { req }) => {
        return User.findOne({ email: req.body.email })
          .then((user) => {
            if (!bcryptjs.compare(password, user.password)) {
              return Promise.reject('password is not correct');
            }
            return true;
          })
          .catch((err) => console.log(err));
      }),
  ],
  authController.postLogin
);
//name="email" in check
// to create default error message we can use as second parameter in built-in functions,
// ex=> check('email', 'second parameter for all rules as isEmail')
router.post(
  '/signup',
  [
    check('email')
      .isEmail()
      .withMessage('Invalid email. Please enter valid email.')
      .normalizeEmail()
      .custom((value, { req }) => {
        return User.findOne({ email: value }).then((userDoc) => {
          if (userDoc) {
            return Promise.reject(
              'E-mail exists already, please pick a different one.'
            );
          }
        });
        // if (value === 'test@test.com') {
        //   throw new Error('This email address is forbidden.');
        // }
        // return true;
      })
      .trim(),
    body(
      'password',
      'Please enter password with only numbers and text and at least 5 characters'
    )
      .isLength({ min: 5, max: 20 })
      .isAlphanumeric()
      .trim(),
    body('confirmPassword')
      .trim()
      .custom((value, { req }) => {
        if (value !== req.body.password) {
          throw new Error('passwords have to match!');
        }
        return true;
      }),
  ],
  authController.postSignup
);

router.post('/logout', authController.postLogout);

router.get('/reset', authController.getReset);
router.post('/reset', authController.postReset);
router.get('/reset/:token', authController.getNewPassword);
router.post('/new-password', authController.postNewPassword);
module.exports = router;
