
module.exports = {
  auth: () => (req, res, next) => {
    // Fake user object gets injected here
    req.auth = {
      sub: 'auth0|mock-user-id',
      scope: 'read:all write:all',
    };
    next();
  },
};
