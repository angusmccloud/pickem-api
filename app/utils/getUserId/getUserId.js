'use strict';

const AWS = require('aws-sdk');
AWS.config.setPromisesDependency(require('bluebird'));
const jwt = require('jsonwebtoken');

const getUserId = (jwtToken) => {
  const decoded = jwt.decode(jwtToken);
  const userId = decoded.sub;
  // return decoded.sub;
  return {
    validUser: true,
    userId,
    admin: userId === '17432f6a-5442-480c-97a1-896172a0821f',
    gameAdmin: userId === '17432f6a-5442-480c-97a1-896172a0821f' || userId === 'c22a77cd-afa2-4559-8469-79af4c01fe84' || userId === '8d004187-4844-4bea-8685-05da79005d30',
  };
};

module.exports = getUserId;