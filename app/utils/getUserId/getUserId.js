'use strict';

const AWS = require('aws-sdk');
AWS.config.setPromisesDependency(require('bluebird'));
const jwt = require('jsonwebtoken');

////
// To-Do:
// Change this back
// And check token validity
////

const getUserId = (jwtToken) => {
  const decoded = jwt.decode(jwtToken);
  // return decoded.sub;
  return {
    validUser: true,
    userId: decoded.sub,
    // userId: '980a0f9e-ede3-4d7b-a195-6367e68d3d40',
    admin: true,
    gameAdmin: true,
  };
};

module.exports = getUserId;