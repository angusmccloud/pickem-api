'use strict';

const AWS = require('aws-sdk');
const { update } = require('lodash');
AWS.config.setPromisesDependency(require('bluebird'));
const dynamoDb = new AWS.DynamoDB.DocumentClient();

const dynamoUpdateItem = (tableName, tableUniqueKey, uniqueKeyValue, updateFieldArray) => {
  console.log('Updating a Record in DynamoDB Table');
  const timestamp = new Date().getTime(); 
  let updateExpression = 'set updatedTime = :updatedTime';
  let expressionAttributes = {':updatedTime' : timestamp};
  for(let i = 0; i < updateFieldArray.length; i++) {
    const fieldName = updateFieldArray[i].fieldName;
    const value = updateFieldArray[i].value;
    updateExpression = updateExpression + `, ${fieldName} = :${fieldName}`;
    expressionAttributes[`:${fieldName}`] = value;
  }
  
  if(updateFieldArray.length > 0) {
    const dataInfo = {
      TableName: tableName,
      Key: {
        [tableUniqueKey]: uniqueKeyValue
      },
      UpdateExpression: updateExpression,
      ExpressionAttributeValues: expressionAttributes
    };
    return dynamoDb.update(dataInfo).promise()
      .then(res => `Updated ${uniqueKeyValue} Successfully`);
  } else {
    return 'Must provide an updateFieldArray';
  }

};

module.exports = dynamoUpdateItem;