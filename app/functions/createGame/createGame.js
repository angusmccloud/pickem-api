'use strict';

const dynamoCreateItem = require('../../utils/dynamoCreateItem');
const teamsInfo = require('../../data/teams/teams');
const leagueInfo = require('../../data/leagues/leagues');

const createGame = (tableName, tableUniqueKey , insertObject) => {
  console.log('Creating Record in DynamoDB Table');

  const dataInfo = {
    TableName: tableName,
    Item: insertObject,
  };
  return dynamoDb.put(dataInfo).promise()
    .then(res => insertObject[tableUniqueKey]);
};

module.exports = dynamoCreateItem;