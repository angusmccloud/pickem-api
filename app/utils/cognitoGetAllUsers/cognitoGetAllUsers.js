'use strict';

const AWS = require('aws-sdk');
const cognitoidentityserviceprovider = new AWS.CognitoIdentityServiceProvider();

const cognitoGetAllUsers = async () => {
  let fetchMoreData = true;
  const users = [];
  let startKey;
  let params;

  while (fetchMoreData){
    if (!startKey) {
      params = {
        UserPoolId: process.env.USER_POOL_ID
      };
    } else {
      params = {
        UserPoolId: process.env.USER_POOL_ID,
        PaginationToken: startKey
      };
    }

    const result = await cognitoidentityserviceprovider.listUsers(params).promise();
    if (result.Users !== undefined || result.Users.length !== 0) {
      // console.log('---- COGNITO RESULT ----', result);
      for (let i = 0; i < result.Users.length; i++) {
        const user = result.Users[i];
        const attributes = user.Attributes;
        const userId = attributes.find(attribute => attribute.Name === 'sub').Value;
        const email = attributes.find(attribute => attribute.Name === 'email').Value;
        if(user.Enabled) {
          users.push({
            userId,
            email,
            username: user.Username
          });
        }
      };
    };

    if(result.PaginationToken){
      startKey = result.PaginationToken;
    } else {
      fetchMoreData = false;
    }
  }

  return users;
};

module.exports = cognitoGetAllUsers;