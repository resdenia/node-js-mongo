exports.is404 = (req, res, next) => {
  // render static template
  // res.status(404).sendFile(path.join(__dirname, 'views', '404.html'));
  //render dymanic template
  const isLoggedIn = req.session.isLoggedIn;

  res.status(404).render('404', {
    pageTitle: 'Page not found',
    path: '',
    isAuthenticated: isLoggedIn,
  });
};

exports.is500 = (req, res, next) => {
  // render static template
  // res.status(404).sendFile(path.join(__dirname, 'views', '404.html'));
  //render dymanic template
  res.status(500).render('500', {
    pageTitle: 'Error!',
    path: '/500',
    isAuthenticated: req.session.isLoggedIn,
  });
};
