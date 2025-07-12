const { expressjwt: jwt } = require('express-jwt');
const jwksRsa = require('jwks-rsa');

const authMiddleware = jwt({
    secret: jwksRsa.expressJwtSecret({
      cache: true,
      rateLimit: true,
      jwksRequestsPerMinute: 5,
      jwksUri: 'https://dev-22potfdnbjbkavt5.us.auth0.com/.well-known/jwks.json',
    }),
    audience: 'NsgXrww8zrrelAXHXrIUwqp8M4vEYeMq',
    issuer: 'https://dev-22potfdnbjbkavt5.us.auth0.com/',
    algorithms: ['RS256'],
  });
  
  module.exports = authMiddleware;