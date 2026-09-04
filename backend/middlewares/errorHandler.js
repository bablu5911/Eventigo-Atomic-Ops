const ApiError = require('../utils/ApiError');

const errorHandler = (err, req, res, next) => {
  let error = err;

  if (!(error instanceof ApiError)) {
    const statusCode = error.statusCode || error.status || 500;
    const message = error.message || 'Internal Server Error';
    error = new ApiError(statusCode, message, false, err.stack);
  }

  const statusCode = error.statusCode || 500;
  const response = {
    success: false,
    error: error.message || 'Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  };

  if (process.env.NODE_ENV === 'development') {
    console.error(`[Error ${statusCode}]:`, err);
  }

  res.status(statusCode).json(response);
};

module.exports = errorHandler;
