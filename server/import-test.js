const fs = require('fs');
const path = require('path');
const http = require('http');
const FormData = require('form-data');

async function login() {
  const payload = JSON.stringify({ email: 'admin@ellora.local', password: 'Admin@123' });
  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) }
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => resolve(JSON.parse(data)));
    });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

(async () => {
  const loginRes = await login();
  const token = loginRes?.data?.token;
  if (!token) {
    console.error('LOGIN_FAILED', loginRes);
    process.exit(1);
  }

  const form = new FormData();
  form.append('file', fs.createReadStream(path.resolve(__dirname, '..', 'CR.xlsx')), {
    filename: 'CR.xlsx',
    contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  });

  const headers = form.getHeaders({ Authorization: `Bearer ${token}` });
  const req = http.request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/import/transactions',
    method: 'POST',
    headers
  }, (res) => {
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => {
      console.log(data);
    });
  });

  req.on('error', (err) => {
    console.error(err);
    process.exit(1);
  });

  form.pipe(req);
})();
