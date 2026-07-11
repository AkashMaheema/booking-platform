const fs = require('fs');
const http = require('http');
const Converter = require('openapi-to-postmanv2');

http.get('http://localhost:3000/api/docs-json', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    Converter.convert({ type: 'string', data }, {}, (err, conversionResult) => {
      if (!conversionResult.result) {
        console.error('Conversion failed', conversionResult.reason);
      } else {
        const collection = conversionResult.output[0].data;
        fs.mkdirSync('docs', { recursive: true });
        fs.writeFileSync('docs/postman_collection.json', JSON.stringify(collection, null, 2));
        console.log('Postman collection generated successfully');
      }
    });
  });
});
