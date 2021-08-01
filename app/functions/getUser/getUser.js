'use strict';
const leagueInfo = require('../../data/leagues/leagues');
const dynamoFetchSingleItem = require('../../utils/dynamoFetchSingleItem');
const cognitoGetAllUsers = require('../../utils/cognitoGetAllUsers/cognitoGetAllUsers');

const getUser = async (leagueId, userId) => {
  const allUsers = await cognitoGetAllUsers();
  const cognitoUser = allUsers.find(user => user.userId === userId);
  const leagues = await leagueInfo().allLeagues;
  const matchingLeague = leagues.find(league => league.leagueId === leagueId);

  if(matchingLeague === undefined) {
    return 'Invalid League ID';
  } else if (cognitoUser === undefined) {
    return 'Invalid User ID';
  };

  const user = await dynamoFetchSingleItem(
    process.env.PARTICIPANTS_TABLE,
    'participantId',
    `${leagueId}-${userId}`
  );

  if(user === undefined) {
    return {
      userId,
      paid: false,
      playingSeason: false,
      playingPlayoffs: false
    };
  };
  
  return {
    userId,
    paid: user.paid,
    playingSeason: user.playingSeason,
    playingPlayoffs: user.playingPlayoffs
  };
};

module.exports = getUser;
