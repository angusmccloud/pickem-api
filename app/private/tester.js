'use strict';

const AWS = require('aws-sdk');
AWS.config.setPromisesDependency(require('bluebird'));
const dynamoDb = new AWS.DynamoDB.DocumentClient();

var { upperCaseFirst } = require('upper-case-first');
var he = require('he');
const jwt = require('jsonwebtoken');

const dynamoScanAllRows = require('../functions/dynamo-scan-all-rows');
const dynamoFetchSingleItem = require('../functions/dynamo-fetch-single-item');
const dynamoDeleteSingleItem = require('../functions/dynamo-delete-single-item');
const dynamoCreateItem = require('../functions/dynamo-create-item');
const dynamoUpdateItem = require('../functions/dynamo-update-item');
const getUserId = require('../functions/getUserId/getUserId');


module.exports.tester = async () => { 
  const timestamp = new Date().getTime(); 


};
