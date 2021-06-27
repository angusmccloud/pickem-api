'use strict';

const AWS = require('aws-sdk');
AWS.config.setPromisesDependency(require('bluebird'));
const jwt = require('jsonwebtoken');

const getUserId = (jwtToken) => {
  const decoded = jwt.decode(jwtToken);
  return decoded.sub;
};

module.exports = getUserId;