'use strict';
const uuid = require('uuid');
const dynamoCreateItem = require('../../utils/dynamoCreateItem');
const teamsInfo = require('../../data/teams/teams');

const createGame = (seasonName, weekNumber, weekName, playoffFlag, guessPointsFlag, visitingTeamId, homeTeamId, mondayNightFlag, gameDateTime) => {
  const timestamp = new Date().getTime(); 
  const teams = teamsInfo();
  const theseTeams = [];
  for(let i = 0; i < teams.length; i++) {
    if(teams[i].teamId === homeTeamId || teams[i].teamId === visitingTeamId) {
      theseTeams.push(teams[i]);
    }
  }
  console.log('-- These teams --', theseTeams);
  console.log('-- IDs --', homeTeamId, visitingTeamId);
  if(theseTeams.length === 2) {
    const gameObj = {
      gameId: uuid.v1(),
      seasonName,
      weekNumber,
      weekName,
      playoffFlag,
      guessPointsFlag,
      homeTeamId,
      visitingTeamId,
      divisionFlag: theseTeams[0].divisionName === theseTeams['1'].divisionName,
      mondayNightFlag,
      gameDateTime,
      winningTeamId: null,
      totalPoints: 0,
      homeTeamPoints: 0,
      visitingTeamPoints: 0,
      createdTime: timestamp,
      updatedTime: timestamp,
    };

    const created = dynamoCreateItem(
      process.env.GAMES_TABLE, 
      'gameId', 
      gameObj
    );
  
    return created;
  } else {
    return "Invalid team IDs passed";
  }
  

};

module.exports = createGame;
