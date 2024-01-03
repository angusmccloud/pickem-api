'use strict';

const AWS = require('aws-sdk');
AWS.config.setPromisesDependency(require('bluebird'));
const dynamoDb = new AWS.DynamoDB.DocumentClient();
const cognitoidentityserviceprovider = new AWS.CognitoIdentityServiceProvider();

const jwt = require('jsonwebtoken');

// Base Dynamo Functions
const dynamoScanAllRows = require('../utils/dynamoScanAllRows');
const dynamoFetchSingleItem = require('../utils/dynamoFetchSingleItem');
const dynamoDeleteSingleItem = require('../utils/dynamoDeleteSingleItem');
const dynamoCreateItem = require('../utils/dynamoCreateItem');
const dynamoUpdateItem = require('../utils/dynamoUpdateItem');

// Utils
const getUserId = require('../utils/getUserId/getUserId');
const leagueInfo = require('../data/leagues/leagues');
const teamsInfo = require('../data/teams/teams');
const cognitoGetAllUsers = require('../utils/cognitoGetAllUsers/cognitoGetAllUsers');

// Functions
const createGame = require('../functions/createGame/createGame');
const updateGameTime = require('../functions/updateGameTime/updateGameTime');
const updateGameWinner = require('../functions/updateGameWinner/updateGameWinner');
const updateParticipant = require('../functions/updateParticipant/updateParticipant');
const setPick = require('../functions/setPick/setPick');
const getStandings = require('../functions/getStandings/getStandings');
const getPicks = require('../functions/getPicks/getPicks');
const getPicksByWeek = require('../functions/getPicksByWeek/getPicksByWeek');
const getUsers = require('../functions/getUsers/getUsers');
const getUser = require('../functions/getUser/getUser');
const getPayoutStructure = require('../functions/getPayoutStructure/getPayoutStructure');
const getGamesByWeek = require('../functions/getGamesByWeek/getGamesByWeek');


module.exports.tester = async () => { 
  // const timestamp = new Date().getTime(); 
  // const leagues = await leagueInfo();
  // return leagues;
  // console.log(leagues);
  // const teams = await teamsInfo();
  // console.log(teams);
  // const dt = new Date(2021, 8, 5, 13, 0, 0);
  // return await createGame('2021', 1, '1', false, true, 1, 7, true, dt.getTime());
  // return await updateGameTime('093aee60-d85c-11eb-910f-1392b5a10712', 2, '2', true, true, dt.getTime());
  // return await updateGameWinner('093aee60-d85c-11eb-910f-1392b5a10712', 7, 15, 20);
  // return await updateParticipant('c22a77cd-afa2-4559-8469-79af4c01fe84', 1, true, false, true);
  // return await setPick('14198a9d-787a-482a-9181-664215a9c424', 1, 'ce403b78-ce6e-40c7-92da-6700f63879ba', 11, 0, true);
  // 
  // 
  // for(let i = 0; i < 10; i++){
  //   console.log(5
  // }
  // return await getStandings(1);
  // return await getStandings(1, 5);
  // return await getPicks(1, 1, '2ce7edd7-87aa-4638-9d9b-c9a4e77d5b84', true);
  // return await getPicksByWeek(1, '2ce7edd7-87aa-4638-9d9b-c9a4e77d5b84');
  // return await getUsers(1);

  // return await getUser(1, '980a0f9e-ede3-4d7b-a195-6367e68d3d40');
  // return await getPayoutStructure(1);

  // return await dynamoScanAllRows('testTable', 'testTable');
  // return await cognitoGetAllUsers();

  // return await getGamesByWeek(1);

  await setPick('8b874838-005a-4d83-8c00-78227859fb47', 3, 'f1d42473-2164-4d09-99b8-c033b0840228', 15, 0, true); 
  await setPick('c09e2025-8f5b-4341-9195-1bd39b8f5888', 3, 'f1d42473-2164-4d09-99b8-c033b0840228', 15, 0, true); 

};

