'use strict';
const { toLower, times } = require('lodash');
const leagueInfo = require('../../data/leagues/leagues');
const dynamoScanAllRows = require('../../utils/dynamoScanAllRows');

const getUsers = async (leagueId) => {
  const timestamp = new Date().getTime(); 
  const leagues = await leagueInfo().allLeagues;
  const matchingLeague = leagues.find(league => league.leagueId === leagueId);

  if(matchingLeague === undefined) {
    return 'Invalid League ID';
  }

  const participants = await dynamoScanAllRows(
    process.env.PARTICIPANTS_TABLE, 
    'userId, paid, playingSeason, playingPlayoffs', 
    `leagueId = :leagueId`, 
    {':leagueId': leagueId}, 
    'participantId');

  participants.sort((a, b) => {
    return a.playingSeason - b.playingSeason;
  });

  return {
    participants
  };
};

module.exports = getUsers;
