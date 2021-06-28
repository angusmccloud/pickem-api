'use strict';
const uuid = require('uuid');
const dynamoUpdateItem = require('../../utils/dynamoUpdateItem');
const dynamoFetchSingleItem = require('../../utils/dynamoFetchSingleItem');

const updateGameTime = async (gameId, weekNumber, weekName, guessPointsFlag, mondayNightFlag, gameDateTime) => {
  const existingGame = await dynamoFetchSingleItem(process.env.GAMES_TABLE, 'gameId', gameId);
  if(existingGame !== undefined) {
    const updatedValues = [
      {
        fieldName: 'weekNumber',
        value: weekNumber
      },
      {
        fieldName: 'weekName',
        value: weekName
      },
      {
        fieldName: 'guessPointsFlag',
        value: guessPointsFlag
      },
      {
        fieldName: 'mondayNightFlag',
        value: mondayNightFlag
      },
      {
        fieldName: 'gameDateTime',
        value: gameDateTime
      }
    ];
    const result = await dynamoUpdateItem(process.env.GAMES_TABLE, 'gameId', gameId, updatedValues);
    return result;
  }
  
  return 'Invalid gameId';
};

module.exports = updateGameTime;
