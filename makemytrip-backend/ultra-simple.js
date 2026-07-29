import http from 'http';

const server = http.createServer((req, res) => {
  console.log('Request:', req.url);
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({status: 'ok'}));
  } else {
    res.writeHead(404);
    res.end();
  }
});

server.listen(5000, '0.0.0.0', () => {
  console.log('✅ Server listening on port 5000');
});

server.on('error', (err) => {
  console.error('Error:', err.message);
  process.exit(1);
});

setTimeout(() => {
  server.close();
  process.exit(0);
}, 20000);
