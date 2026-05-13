const { error } = require('../utils/apiResponse');

const errorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  
  if (err.isOperational) {
    // Expected operational error
    return error(res, err.message, err.statusCode);
  }

  // Programming or unknown error
  console.error('ERROR 💥', err);
  return error(res, 'Internal Server Error', 500);
};

module.exports = errorHandler;
