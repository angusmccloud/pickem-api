'use strict';

const AWS = require('aws-sdk');
AWS.config.setPromisesDependency(require('bluebird'));
const dynamoDb = new AWS.DynamoDB.DocumentClient();

const dynamoDeleteSingleItem = async (tableName = process.env.MOVIES_TABLE, tableUniqueKey = 'movieId', keyValue = 'tt12345') => {
  console.log('Deleting Single Row from DynamoDB Table');

  try {
    let params = {
      Key: {
        [tableUniqueKey]: keyValue
      },
      TableName: tableName
    };
    const result = await dynamoDb.delete(params).promise();
    const item = result.Item;
    return item;
  } catch (error) {
    console.error(error);
    return 'Error deleting data';
  }
};

module.exports = dynamoDeleteSingleItem;