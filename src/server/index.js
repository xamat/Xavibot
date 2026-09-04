const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const app = require('./app');
const config = require('./config');
const PORT = process.env.PORT || config.SERVER.PORT;

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server started on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Backend type: ${config.BACKEND_TYPE}`);
});

// Add error handling for the server
server.on('error', (error) => {
  console.error('Server error:', error);
  process.exit(1);
});