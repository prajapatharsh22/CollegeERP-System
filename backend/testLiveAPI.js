const https = require('https');

const data = JSON.stringify({
  email: 'prajapatharsh221205@gmail.com'
});

const options = {
  hostname: 'collegeerp-system.onrender.com',
  path: '/api/auth/send-otp',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

console.log("Sending live API check to Render: https://collegeerp-system.onrender.com/api/auth/send-otp...");

const req = https.request(options, (res) => {
  let body = '';
  console.log(`LIVE STATUS: ${res.statusCode}`);
  console.log(`LIVE HEADERS:`, res.headers);
  res.setEncoding('utf8');
  res.on('data', (chunk) => {
    body += chunk;
  });
  res.on('end', () => {
    console.log('LIVE RESPONSE:', body);
  });
});

req.on('error', (e) => {
  console.error(`Live Request Failed: ${e.message}`);
});

// Set a timeout of 15 seconds
req.on('timeout', () => {
  console.error('Live Request Timeout!');
  req.destroy();
});

req.write(data);
req.end();
