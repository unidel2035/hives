const http = require('http');

const hostname = '127.0.0.1';
const port = 3000;

const server = http.createServer((req, res) => {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  
  if (req.url === '/') {
    res.end('<h1>Привет! Это простой Node.js сервер</h1>');
  } else if (req.url === '/api') {
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ message: 'API работает!', timestamp: new Date() }));
  } else {
    res.statusCode = 404;
    res.end('<h1>404 - Страница не найдена</h1>');
  }
});

server.listen(port, hostname, () => {
  console.log(`Сервер запущен на http://${hostname}:${port}/`);
});
