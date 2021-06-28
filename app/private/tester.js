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
const createGame = require('../functions/createGame/createGame');
const updateGameTime = require('../functions/updateGameTime/updateGameTime');
const updateGameWinner = require('../functions/updateGameWinner/updateGameWinner');


module.exports.tester = async () => { 
  // const timestamp = new Date().getTime(); 
  // const leagues = await leagueInfo();
  // console.log(leagues);
  // const teams = await teamsInfo();
  // console.log(teams);
  const dt = new Date(2021, 8, 5, 13, 0, 0);
  // return await createGame('2021', 1, '1', false, true, 1, 7, true, dt.getTime());
  // return await updateGameTime('093aee60-d85c-11eb-910f-1392b5a10712', 2, '2', true, true, dt.getTime());
  // return await updateGameWinner('093aee60-d85c-11eb-910f-1392b5a10712', 7, 15, 20);
  return await updateGameWinner('8f41eb20-d78b-11eb-a319-1501a078bc2e', 6, 10, 15);

};
