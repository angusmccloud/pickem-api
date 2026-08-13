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
const findDuplicatePicks = require('../functions/findDuplicatePicks/findDuplicatePicks');
const deleteGamesBySeason = require('../functions/deleteGamesBySeason/deleteGamesBySeason');


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

  // Run this to remove duplicate picks (NOTE: Change Season ID)
  // return await findDuplicatePicks(6);

  // Run this to delete a season's games so they can be reloaded (NOTE: Change Season ID)
  // Args: (leagueId, weekNumbers = null, dryRun = true) -- weekNumbers null means the whole season.
  // ALWAYS dry run first and check the count before passing false. Comment out the createGame
  // calls below when deleting, otherwise this deletes and the reload runs in the same invoke.
  // return await deleteGamesBySeason(6, [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18]);
  // return await deleteGamesBySeason(6, [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18], false);

  // Brittni Keefe (2025)
  // return await setPick('8b673a7e-462c-4602-bbf5-30924b1bc0d2', 5, '8af4839c-2a10-4bdf-b147-1f197afb2717', 13, 0, true);

  // Wild Card Weekend:
  // createGame('2025', 19, 'Wild Card', true, true, 32, 27, false, 1768080600000);
  // createGame('2025', 19, 'Wild Card', true, true, 23, 21, false, 1768093200000);
  // createGame('2025', 19, 'Wild Card', true, true, 1, 11, false, 1768068000000);
  // createGame('2025', 19, 'Wild Card', true, true, 30, 19, false, 1768167000000);
  // createGame('2025', 19, 'Wild Card', true, true, 16, 3, false, 1768179600000);
  // createGame('2025', 19, 'Wild Card', true, true, 10, 8, true, 1768266900000);

  // Divisional Weekend:
  // createGame('2025', 20, 'Divisional', true, true, 1, 13, false, 1768685400000);
  // createGame('2025', 20, 'Divisional', true, true, 30, 31, false, 1768698000000);
  // createGame('2025', 20, 'Divisional', true, true, 10, 3, false, 1768766400000);
  // createGame('2025', 20, 'Divisional', true, true, 32, 21, false, 1768779000000);

  // Conference Championship
  // createGame('2025', 21, 'Conference Championship', true, true, 3, 13, false, 1769371200000);
  // createGame('2025', 21, 'Conference Championship', true, true, 32, 31, false, 1769383800000);

  // Superbowl
  // createGame('2025', 22, 'Superbowl', true, true, 3, 31, false, 1770593400000);


};

