'use strict';
const { toLower, times } = require('lodash');
const leagueInfo = require('../../data/leagues/leagues');
const dynamoScanAllRows = require('../../utils/dynamoScanAllRows');
////
// This function needs to be re-written once we're connected to Cognito
// Should pull all Cognito users
// Then merge those in with the Participants table users
////

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
