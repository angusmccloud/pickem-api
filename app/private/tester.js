'use strict';

const AWS = require('aws-sdk');
AWS.config.setPromisesDependency(require('bluebird'));
const dynamoDb = new AWS.DynamoDB.DocumentClient();

const jwt = require('jsonwebtoken');

const dynamoScanAllRows = require('../utils/dynamoScanAllRows');
const dynamoFetchSingleItem = require('../utils/dynamoFetchSingleItem');
const dynamoDeleteSingleItem = require('../utils/dynamoDeleteSingleItem');
const dynamoCreateItem = require('../utils/dynamoCreateItem');
const dynamoUpdateItem = require('../utils/dynamoUpdateItem');
const getUserId = require('../utils/getUserId/getUserId');
const leagueInfo = require('../data/leagues/leagues');
const teamsInfo = require('../data/teams/teams');


module.exports.tester = async () => { 
  const timestamp = new Date().getTime(); 
  const leagues = await leagueInfo();
  console.log(leagues);
  const teams = await teamsInfo();
  console.log(teams);

};
