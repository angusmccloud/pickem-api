'use strict';
const leagueInfo = require('../../data/leagues/leagues');

const getPayoutStructure = async (leagueId) => {
  const leagues = await leagueInfo().allLeagues;
  const matchingLeague = leagues.find(league => league.leagueId === leagueId);

  if(matchingLeague === undefined) {
    return 'Invalid League ID';
  }
  return matchingLeague.payoutStructure;
};

module.exports = getPayoutStructure;
