'use strict';
const { v4: uuidv4 } = require('uuid');
const leagueInfo = require('../../data/leagues/leagues');
const dynamoCreateItem = require('../../utils/dynamoCreateItem');
const dynamoUpdateItem = require('../../utils/dynamoUpdateItem');
const dynamoFetchSingleItem = require('../../utils/dynamoFetchSingleItem');
const dynamoScanAllRows = require('../../utils/dynamoScanAllRows');

// Validation problems used to come back as bare strings, which the HTTP handler happily wrapped in
// { success: true } -- so "This game has already started" reached the browser as a saved pick.
// Returning a tagged object lets the caller tell a rejection from a write.
const rejected = (message) => ({ success: false, message });

const setPick = async (userId, leagueId, gameId, pickedTeamId, totalPoints = 0, adminOverride = false) => {
  const timestamp = new Date().getTime();
  const leagues = await leagueInfo().allLeagues;
  const matchingLeague = leagues.find(league => league.leagueId === leagueId);
  console.log(matchingLeague);
  if(matchingLeague === undefined) {
    return rejected('Invalid League ID');
  }

  const existingParticipant = await dynamoFetchSingleItem(process.env.PARTICIPANTS_TABLE, 'participantId', `${leagueId}-${userId}`);
  if(existingParticipant === undefined) {
    return rejected('Invalid User ID & League ID combo');
  }

  const gameInfo = await dynamoFetchSingleItem(process.env.GAMES_TABLE, 'gameId', gameId);
  if(gameInfo === undefined) {
    return rejected('Invalid Game ID');
  }

  if(matchingLeague.seasonName !== gameInfo.seasonName) {
    return rejected('leagueId and gameId are from different seasons');
  }

  if(gameInfo.playoffFlag && !existingParticipant.playingPlayoffs) {
    return rejected('This user isn\'t in the playoffs');
  }

  if(!gameInfo.playoffFlag && !existingParticipant.playingSeason) {
    return rejected('This user isn\'t in the league this year');
  }

  if(gameInfo.gameDateTime <= timestamp && !adminOverride) {
    return rejected('This game has already started');
  }

  if(pickedTeamId !== gameInfo.homeTeamId && pickedTeamId !== gameInfo.visitingTeamId) {
    return rejected('pickedTeamId isn\'t playing in that gameId');
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
      pickId: uuidv4(),
      seasonName: gameInfo.seasonName,
      weekNumber: gameInfo.weekNumber,
      gameId,
      userId,
      pickedTeamId,
      totalPoints: gameInfo.guessPointsFlag ? totalPoints : 0,
      createdTime: timestamp,
      updatedTime: timestamp,
    };

    const pickId = await dynamoCreateItem(
      process.env.PICKS_TABLE,
      'pickId',
      pickObj
    );

    return { success: true, pickId, created: true };
  } else {
    // Update existing pick
    const updatedValues = [
      {
        fieldName: 'pickedTeamId',
        value: pickedTeamId
      },
      {
        fieldName: 'totalPoints',
        value: gameInfo.guessPointsFlag ? totalPoints : 0,
      }
    ];

    await dynamoUpdateItem(process.env.PICKS_TABLE, 'pickId', existingPick[0].pickId, updatedValues);
    return { success: true, pickId: existingPick[0].pickId, created: false };
  }
};

module.exports = setPick;
