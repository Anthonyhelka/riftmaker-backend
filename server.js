const http = require('http');
const app = require('./app');

const normalizePort = (value) => {
  const parsedValue = parseInt(value, 10);

  if (isNaN(parsedValue)) { return value; }
  if (parsedValue >= 0) { return parsedValue; }
  return false;
};

const onError = (error) => {
  if (error.syscall !== 'listen') { throw error; }

  const bind = typeof port === 'string' ? `pipe ${port}` : `port ${port}`;

  console.log(`Error Code: ${error.code}`);
  
  switch (error.code) {
    case 'EACCES':
      console.log(`${bind} requires elevated privileges`);
      process.exit(1);
    case 'EPORTINUSE':
      console.log(`${bind} is already in use`);
      process.exit(1);
    default: 
      throw error;
  }
};

const onListening = () => {
  const address = server.address();
  const bind = typeof address === 'string' ? `pipe ${address}` : `port ${port}`;
  console.log(`Listening on ${bind}`);
};

const port = normalizePort(process.env.PORT || '8080');
app.set('port', port);

const server = http.createServer(app);
server.on('error', onError);
server.on('listening', onListening);
server.listen(port);