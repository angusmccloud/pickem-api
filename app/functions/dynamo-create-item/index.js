'use strict';

const AWS = require('aws-sdk');
AWS.config.setPromisesDependency(require('bluebird'));
const dynamoDb = new AWS.DynamoDB.DocumentClient();

const dynamoCreateItem = (tableName, tableUniqueKey , insertObject) => {
  console.log('Creating Record in DynamoDB Table');

  const dataInfo = {
    TableName: tableName,
    Item: insertObject,
  };
  return dynamoDb.put(dataInfo).promise()
    .then(res => insertObject[tableUniqueKey]);
};

module.exports = dynamoCreateItem;