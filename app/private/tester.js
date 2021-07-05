'use strict';

const AWS = require('aws-sdk');
AWS.config.setPromisesDependency(require('bluebird'));
const dynamoDb = new AWS.DynamoDB.DocumentClient();

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

// Functions
const createGame = require('../functions/createGame/createGame');
const updateGameTime = require('../functions/updateGameTime/updateGameTime');
const updateGameWinner = require('../functions/updateGameWinner/updateGameWinner');
const updateParticipant = require('../functions/updateParticipant/updateParticipant');
const setPick = require('../functions/setPick/setPick');
const getStandings = require('../functions/getStandings/getStandings');


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
  // return await updateParticipant('u1237', 1, true, false, true);
  // return await setPick('u1234', 1, '093aee60-d85c-11eb-910f-1392b5a10712', 1, 35);
  // for(let i = 0; i < 10; i++){
  //   console.log(5
  // }
  return await getStandings(1);



  ////
  // Load up fake picks for a few users
  // Or to set fake winners
  ////
  // const userId = 'u1237';
  // for(let i = 1; i <= 3; i++) {
  //   const games = await dynamoScanAllRows(
  //     process.env.GAMES_TABLE, 
  //     'gameId, homeTeamId, visitingTeamId, guessPointsFlag', 
  //     `seasonName = :seasonName AND weekNumber = :weekNumber`, 
  //     {':seasonName': '2021', ':weekNumber': i}, 
  //     'pickId');
  //   for(let ii = 0; ii < games.length; ii++) {
  //     const game = games[ii];
  //     const guess = Math.round(Math.random() * 1) === 1 ? game.homeTeamId : game.visitingTeamId;
  //     // Used to set fake picks
  //     // setPick(userId, 1, game.gameId, guess, Math.round(Math.random() * 45));
  //     // Used to set fake winners
  //     // updateGameWinner(game.gameId, guess, Math.round(Math.random() * 25), Math.round(Math.random() * 25));
  //   }
  // }
};
