fetch('http://localhost:3000/api/admin/products')
  .then(async r => {
    console.log('Status:', r.status);
    console.log('Body:', await r.text());
  })
  .catch(console.error);