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

  return await getGamesByWeek(1);

  ////
  // Load up fake picks for a few users
  // Or to set fake winners
  ////
  // const fakeUsers = ['980a0f9e-ede3-4d7b-a195-6367e68d3d40', '2ce7edd7-87aa-4638-9d9b-c9a4e77d5b84', 'f7c41f90-ba10-4d86-a9b8-83520f4797e0']; // All Fake Teams
  // // const fakeUsers = ['u1235', 'u1237']; // Fake Playoff Teams
  // const minWeek = 1;
  // const maxWeek = 18;
  // for(let i = minWeek; i <= maxWeek; i++) {
  //   const games = await dynamoScanAllRows(
  //     process.env.GAMES_TABLE, 
  //     'gameId, homeTeamId, visitingTeamId, guessPointsFlag', 
  //     `seasonName = :seasonName AND weekNumber = :weekNumber`, 
  //     {':seasonName': '2021', ':weekNumber': i}, 
  //     'pickId');
  //   for(let ii = 0; ii < games.length; ii++) {
  //     const game = games[ii];
  //     for(let u = 0; u < fakeUsers.length; u++) {
  //       const userId = fakeUsers[u];
  //       const guess = Math.round(Math.random() * 1) === 1 ? game.homeTeamId : game.visitingTeamId;
  //       // Used to set fake picks
  //       setPick(userId, 1, game.gameId, guess, Math.round(Math.random() * 45));
  //     }
  //     // Used to set fake winners
  //     const winner = Math.round(Math.random() * 1) === 1 ? game.homeTeamId : game.visitingTeamId;
  //     updateGameWinner(game.gameId, winner, Math.round(Math.random() * 25), Math.round(Math.random() * 25));
  //   }
  // }

  // createGame('2021', 21, 'Conference Championship', true, true, 6, 14, false, 1643572800000);
  // createGame('2021', 21, 'Conference Championship', true, true, 30, 32, false, 1643585400000);
  // createGame('2021', 22, 'Superbowl', true, true, 32, 6, false, 1644795000000);


  // await setPick('c22a77cd-afa2-4559-8469-79af4c01fe84', 2, '2f47b5cc-176d-41d7-8529-b25ee948b1b5', 1, 0, true);
  // await setPick('292222bb-7aeb-4b3d-b0e9-926ce945f565', 2, '2f47b5cc-176d-41d7-8529-b25ee948b1b5', 1, 0, true);
  // await setPick('7caca09a-93e9-4eb1-b40c-45aab7fb4e85', 2, '2f47b5cc-176d-41d7-8529-b25ee948b1b5', 1, 0, true);
  // await setPick('7a78ff32-d5e5-43c7-8712-d67597933d5b', 2, '2f47b5cc-176d-41d7-8529-b25ee948b1b5', 1, 0, true);
  // await setPick('031e3e8-e288-44e9-898f-6b8b927b0cc2', 2, '2f47b5cc-176d-41d7-8529-b25ee948b1b5', 1, 0, true);
  // await setPick('1031e3e8-e288-44e9-898f-6b8b927b0cc2', 2, '2f47b5cc-176d-41d7-8529-b25ee948b1b5', 1, 0, true);

  // await setPick('8b874838-005a-4d83-8c00-78227859fb47', 2, 'd5c85b09-a52d-4144-bc72-c77b1f5aade7', 29, 0, true);
  // await setPick('8b874838-005a-4d83-8c00-78227859fb47', 2, '55bac94f-2bc1-47b1-bf07-129d46fd127f', 2, 0, true);
  // await setPick('8b874838-005a-4d83-8c00-78227859fb47', 2, 'bdb59732-3320-4bc4-aac8-1f24f44eecd1', 19, 0, true);
  // await setPick('8b874838-005a-4d83-8c00-78227859fb47', 2, '7da2cbe9-cf90-4725-a7cf-e21e128f096f', 4, 0, true);
  // await setPick('8b874838-005a-4d83-8c00-78227859fb47', 2, '07b20e91-bf01-4559-9092-c9eb158bb5fd', 15, 0, true);
  // await setPick('8b874838-005a-4d83-8c00-78227859fb47', 2, 'ca07eeb9-6f8e-4c8d-9304-6299414f9778', 17, 0, true);
  // await setPick('8b874838-005a-4d83-8c00-78227859fb47', 2, '0ed9fed3-b6d2-4bba-aa53-d0982cdfe0d2', 27, 0, true);



  // 14198a9d-787a-482a-9181-664215a9c424 = Keefe
  // 8b673a7e-462c-4602-bbf5-30924b1bc0d2 = Britt
  // 8b874838-005a-4d83-8c00-78227859fb47 = Michael perry

//   createGame('2022', 20, 'Divisional', true, true, 11, 14, false, 1674336600000);
// createGame('2022', 20, 'Divisional', true, true, 18, 19, false, 1674350100000);
// createGame('2022', 20, 'Divisional', true, true, 6, 1, false, 1674417600000);
// createGame('2022', 20, 'Divisional', true, true, 17, 30, false, 1674430200000);
};

