'use strict';
const leagueInfo = require('../../data/leagues/leagues');
const dynamoScanAllRows = require('../../utils/dynamoScanAllRows');
const cognitoGetAllUsers = require('../../utils/cognitoGetAllUsers/cognitoGetAllUsers');

const getUsers = async (leagueId) => {
  const allUsers = await cognitoGetAllUsers();
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

  const users = allUsers.map(user => {
    const userId = user.userId;
    const email = user.email;
    const username = user.username;
    const participant = participants.find(participant => participant.userId === userId);
    const paid = participant ? participant.paid : false;
    const playingSeason = participant ? participant.playingSeason : false;
    const playingPlayoffs = participant ? participant.playingPlayoffs : false;
    return {
      userId,
      email,
      username,
      paid,
      playingSeason,
      playingPlayoffs,
    };
  });


  users.sort((a, b) => {
    return b.playingSeason - a.playingSeason || a.username.localeCompare(b.username);
  });

  return {
    users
  };
};

module.exports = getUsers;
