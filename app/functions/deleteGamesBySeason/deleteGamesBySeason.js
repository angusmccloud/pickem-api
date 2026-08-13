'use strict';
const leagueInfo = require('../../data/leagues/leagues');
const dynamoScanAllRows = require('../../utils/dynamoScanAllRows');
const dynamoDeleteSingleItem = require('../../utils/dynamoDeleteSingleItem');

const deleteGamesBySeason = async (leagueId, weekNumbers = null, dryRun = true) => {
  const leagues = await leagueInfo().allLeagues;
  const matchingLeague = leagues.find(league => league.leagueId === leagueId);

  if(matchingLeague === undefined) {
    return 'Invalid League ID';
  }

  const games = await dynamoScanAllRows(
    process.env.GAMES_TABLE,
    'gameId, seasonName, weekNumber, playoffFlag, homeTeamId, visitingTeamId, gameDateTime',
    `seasonName = :seasonName`,
    {':seasonName': matchingLeague.seasonName},
    'gameId');

  // Belt and braces: re-assert the season in JS so a bad filter can never reach another year
  const gamesToDelete = games.filter(game =>
    game.seasonName === matchingLeague.seasonName
    && (weekNumbers === null || weekNumbers.includes(game.weekNumber))
  );

  // Count up how many games we found in each week, so the dry run is easy to eyeball
  const byWeek = {};
  gamesToDelete.forEach(game => {
    byWeek[game.weekNumber] = (byWeek[game.weekNumber] || 0) + 1;
  });

  if(dryRun) {
    console.log(`-- Dry run -- would delete ${gamesToDelete.length} games from ${matchingLeague.seasonName}`);
    return {
      dryRun: true,
      seasonName: matchingLeague.seasonName,
      count: gamesToDelete.length,
      byWeek,
    };
  }

  for(let i = 0; i < gamesToDelete.length; i++) {
    const game = gamesToDelete[i];
    console.log(`Deleting gameId ${game.gameId} (${matchingLeague.seasonName} week ${game.weekNumber})`);
    await dynamoDeleteSingleItem(process.env.GAMES_TABLE, 'gameId', game.gameId);
  }

  return {
    dryRun: false,
    seasonName: matchingLeague.seasonName,
    deleted: gamesToDelete.length,
    byWeek,
  };
};

module.exports = deleteGamesBySeason;
