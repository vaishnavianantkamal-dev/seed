const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');

function requestJson(method, pathName, body, headers = {}) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: pathName,
      method,
      headers: { 'Content-Type': 'application/json', ...(headers || {}) }
    };
    if (body && typeof body === 'string') {
      options.headers['Content-Length'] = Buffer.byteLength(body);
    }
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve(data);
        }
      });
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

function uploadFile(token) {
  return new Promise((resolve, reject) => {
    const filePath = path.resolve(__dirname, 'CR.xlsx');
    const boundary = '----NodeBoundary' + Date.now();
    const CRLF = '\r\n';
    const fileBuffer = fs.readFileSync(filePath);
    const fileName = 'CR.xlsx';
    const payload = [
      `--${boundary}${CRLF}`,
      'Content-Disposition: form-data; name="file"; filename="' + fileName + '"' + CRLF,
      'Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' + CRLF + CRLF,
      fileBuffer.toString('binary'),
      CRLF,
      `--${boundary}--${CRLF}`
    ].join('');

    const options = {
      hostname: 'localhost',
      port: 5000,
      path: '/api/import/transactions',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': `multipart/form-data; boundary=${boundary}`
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch (e) { resolve(data); }
      });
    });
    req.on('error', reject);
    req.write(payload, 'binary');
    req.end();
  });
}

(async () => {
  const loginRes = await requestJson('POST', '/api/auth/login', JSON.stringify({ email: 'admin@ellora.local', password: 'Admin@123' }));
  const token = loginRes?.data?.token;
  if (!token) {
    console.error('LOGIN_FAILED', loginRes);
    process.exit(1);
  }
  const result = await uploadFile(token);
  console.log(JSON.stringify(result, null, 2));
})();
