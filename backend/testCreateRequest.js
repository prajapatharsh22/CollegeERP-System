const http = require('http');

const data = JSON.stringify({
  name: 'Raj Yadav',
  email: 'rajyadav123@gmail.com',
  username: 'rajyadav123',
  password: 'password123',
  role: 'Student'
});

const options = {
  hostname: '127.0.0.1',
  port: 5000,
  path: '/api/requests/create',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = http.request(options, (res) => {
  let body = '';
  console.log(`STATUS: ${res.statusCode}`);
  console.log(`HEADERS:`, res.headers);
  res.setEncoding('utf8');
  res.on('data', (chunk) => {
    body += chunk;
  });
  res.on('end', () => {
    console.log('RESPONSE:', body);
  });
});

req.on('error', (e) => {
  console.error(`Problem with request: ${e.message}`);
});

req.write(data);
req.end();
