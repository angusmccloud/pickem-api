'use strict';
const dynamoUpdateItem = require('../../utils/dynamoUpdateItem');
const dynamoFetchSingleItem = require('../../utils/dynamoFetchSingleItem');

const updateGameWinner = async (gameId, winningTeamId, homeTeamPoints, visitingTeamPoints) => {
  const existingGame = await dynamoFetchSingleItem(process.env.GAMES_TABLE, 'gameId', gameId);
  if(existingGame !== undefined) {
    const updatedValues = [
      {
        fieldName: 'winningTeamId',
        value: winningTeamId
      }
    ];

    if(existingGame.guessPointsFlag) {
      updatedValues.push({
        fieldName: 'homeTeamPoints',
        value: homeTeamPoints
      });
      updatedValues.push({
        fieldName: 'visitingTeamPoints',
        value: visitingTeamPoints
      });
      updatedValues.push({
        fieldName: 'totalPoints',
        value: homeTeamPoints + visitingTeamPoints
      });
    }
    
    const result = await dynamoUpdateItem(process.env.GAMES_TABLE, 'gameId', gameId, updatedValues);
    return result;
  }
  
  return 'Invalid gameId';
};

module.exports = updateGameWinner;
