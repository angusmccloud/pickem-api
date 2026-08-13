'use strict';
const leagueInfo = require('../../data/leagues/leagues');
const dynamoScanAllRows = require('../../utils/dynamoScanAllRows');
const dynamoFetchSingleItem = require('../../utils/dynamoFetchSingleItem');
const dynamoDeleteSingleItem = require('../../utils/dynamoDeleteSingleItem');

const findDuplicatePicks = async (leagueId) => {
  const timestamp = new Date().getTime(); 
  const leagues = await leagueInfo().allLeagues;
  const matchingLeague = leagues.find(league => league.leagueId === leagueId);

  if(matchingLeague === undefined) {
    return 'Invalid League ID';
  }

  const picks = await dynamoScanAllRows(
    process.env.PICKS_TABLE, 
    'pickId, gameId, updatedTime, userId',
    `seasonName = :seasonName`,
    {':seasonName': matchingLeague.seasonName},
    'pickId');

  // Create a list of unique gameId + userId combinations, and how many records there are for each
  const uniquePicks = [];
  picks.forEach(pick => {
    const matchingPick = uniquePicks.find(uniquePick => uniquePick.gameId === pick.gameId && uniquePick.userId === pick.userId);
    if(matchingPick === undefined) {
      uniquePicks.push({gameId: pick.gameId, userId: pick.userId, count: 1, picks: [{pickId: pick.pickId, updatedTime: pick.updatedTime}]});
    } else {
      matchingPick.count++;
      matchingPick.picks.push({pickId: pick.pickId, updatedTime: pick.updatedTime});
    }
  });

  // Create a list of picks that have more than one record
  const duplicatePicks = uniquePicks.filter(uniquePick => uniquePick.count > 1);

  // For each pick that has more than one record, find the most recent record and delete the rest
  for(let i = 0; i < duplicatePicks.length; i++) {
    const pick = duplicatePicks[i];
    const sortedPicks = pick.picks.sort((a, b) => b.updatedTime - a.updatedTime);
    const mostRecentPick = sortedPicks[0];
    const picksToDelete = sortedPicks.slice(1);
    for(let j = 0; j < picksToDelete.length; j++) {
      const pickToDelete = picksToDelete[j];
      console.log(`Deleting pickId ${pickToDelete.pickId}`);
      await dynamoDeleteSingleItem(process.env.PICKS_TABLE, 'pickId', pickToDelete.pickId);
    }
  }

  return duplicatePicks
};

module.exports = findDuplicatePicks;
