'use strict';
const uuid = require('uuid');
const leagueInfo = require('../../data/leagues/leagues');
const dynamoCreateItem = require('../../utils/dynamoCreateItem');
const dynamoUpdateItem = require('../../utils/dynamoUpdateItem');
const dynamoFetchSingleItem = require('../../utils/dynamoFetchSingleItem');
const dynamoScanAllRows = require('../../utils/dynamoScanAllRows');

const setPick = async (userId, leagueId, gameId, pickedTeamId, totalPoints = 0) => {
  const timestamp = new Date().getTime(); 
  const leagues = await leagueInfo().allLeagues;
  const matchingLeague = leagues.filter(league => league.leagueId === leagueId);
  if(matchingLeague.length !== 1) {
    return 'Invalid League ID';
  }

  const existingParticipant = await dynamoFetchSingleItem(process.env.PARTICIPANTS_TABLE, 'participantId', `${leagueId}-${userId}`);
  if(existingParticipant === undefined) {
    return 'Invalid User ID & League ID combo';
  }

  const gameInfo = await dynamoFetchSingleItem(process.env.GAMES_TABLE, 'gameId', gameId);
  if(gameInfo === undefined) {
    return 'Invalid Game ID';
  }

  if(matchingLeague[0].seasonName !== gameInfo.seasonName) {
    return 'leagueId and gameId are from different seasons';
  }

  if(gameInfo.playoffFlag && !existingParticipant.playingPlayoffs) {
    return 'This user isn\'t in the playoffs';
  }

  if(!gameInfo.playoffFlag && !existingParticipant.playingSeason) {
    return 'This user isn\'t in the league this year';
  }

  if(gameInfo.gameDateTime <= timestamp) {
    return 'This game has already started';
  }

  if(pickedTeamId !== gameInfo.homeTeamId && pickedTeamId !== gameInfo.visitingTeamId) {
    return 'pickedTeamId isn\'t playing in that gameId';
  }

  // Ok, seems to be a valid game...
  const existingPick = await dynamoScanAllRows(
    process.env.PICKS_TABLE, 
    'pickId', 
    `userId = :userId AND gameId = :gameId`, 
    {':userId': userId, ':gameId': gameId}, 
    'pickId');
  
  if(existingPick.length === 0) {
    // Hasn't made this pick before, create record
    const pickObj = {
      pickId: uuid.v1(),
      seasonName: gameInfo.seasonName,
      weekNumber: gameInfo.weekNumber,
      gameId,
      userId,
      pickedTeamId,
      totalPoints: gameInfo.guessPointsFlag ? totalPoints : 0,
      createdTime: timestamp,
      updatedTime: timestamp,
    };

    const created = dynamoCreateItem(
      process.env.PICKS_TABLE, 
      'pickId', 
      pickObj
    );
  
    return created;
  } else {
    // Update existing pick
    const updatedValues = [
      {
        fieldName: 'pickedTeamId',
        value: pickedTeamId
      },
      {
        fieldName: 'totalPoints',
        value: totalPoints
      }
    ];

    const result = await dynamoUpdateItem(process.env.PICKS_TABLE, 'pickId', existingPick[0].pickId, updatedValues);
    return result;
  }
};

module.exports = setPick;