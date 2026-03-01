const fs = require('fs');
try {
  const content = fs.readFileSync('src/modules/i18n/messages/az.json', 'utf8');
  JSON.parse(content);
  console.log('JSON is valid');
} catch (e) {
  console.error('JSON Error:', e.message);
}
