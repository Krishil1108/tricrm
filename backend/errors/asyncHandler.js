/**
 * Async Error Wrapper
 * Catches async errors in route handlers and passes to error middleware
 */

const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * Async Method Wrapper for controller classes
 */
const asyncMethod = (method) => {
  return function(...args) {
    return Promise.resolve(method.apply(this, args)).catch(args[args.length - 1]);
  };
};

module.exports = {
  asyncHandler,
  asyncMethod
};
