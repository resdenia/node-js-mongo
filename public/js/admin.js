const product = require('../../models/product');

const deleteProduct = (btn) => {
  const prodId = btn.parentNode.querySelector('[name=productId]').value;
  const csrf = btn.parentNode.querySelector('[name=_csrf]').value;

  const productElement = btn.closest('article');
  fetch('/admin/product/' + prodId, {
    method: 'DELETE',
    headers: {
      'csrf-token': csrf,
    },
  })
    .then((result) => {
      return result.json();
    })
    .then((data) => {
      console.log(data);
      //productElement.parentNode.removeChild(productElement);// will work in all browser +IE
      productElement.remove(); //will work in modern browsers -IE
    })
    .catch((err) => {
      console.log(err);
    });
};
