const { expressjwt: jwt } = require('express-jwt');
const jwksRsa = require('jwks-rsa');

const authMiddleware = jwt({
    secret: jwksRsa.expressJwtSecret({
      cache: true,
      rateLimit: true,
      jwksRequestsPerMinute: 5,
      jwksUri: 'https://dev-0abaxu1ggacd3wwr.us.auth0.com/api/v2/',
    }),
    audience: 'https://dev-0abaxu1ggacd3wwr.us.auth0.com/api/v2/',
    issuer: 'dev-0abaxu1ggacd3wwr.us.auth0.com',
    algorithms: ['RS256'],
  });
  
  module.exports = authMiddleware;