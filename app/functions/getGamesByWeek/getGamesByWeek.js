'use strict';
const leagueInfo = require('../../data/leagues/leagues');
const dynamoScanAllRows = require('../../utils/dynamoScanAllRows');

const getGamesByWeek = async (leagueId) => {
  const leagues = await leagueInfo().allLeagues;
  const matchingLeague = leagues.find(league => league.leagueId === leagueId);

  if (matchingLeague === undefined) {
    return 'Invalid League ID';
  }

  const games = await dynamoScanAllRows(
    process.env.GAMES_TABLE,
    'gameId, mondayNightFlag, divisionFlag, gameDateTime, guessPointsFlag, visitingTeamId, homeTeamId, playoffFlag, totalPoints, weekName, weekNumber, winningTeamId',
    'seasonName = :seasonName',
    { ':seasonName': matchingLeague.seasonName },
    'gameId');

  games.sort((a, b) => {
    return a.weekNumber - b.weekNumber
      || a.gameDateTime - b.gameDateTime;
  });

  const weeks = [];
  for (let i = 0; i < games.length; i++) {
    const matchingWeek = weeks.find(week => week.weekNumber === games[i].weekNumber);
    if (matchingWeek === undefined) {
      weeks.push({
        weekNumber: games[i].weekNumber,
        weekName: games[i].weekName,
        minTime: games[i].gameDateTime,
        maxTime: games[i].gameDateTime,
        numberOfGames: 1,
        numberOfWinners: games[i].winningTeamId === null ? 0 : 1,
        playoffFlag: games[i].playoffFlag,
      });
    } else { 
      matchingWeek.numberOfGames++;
      matchingWeek.numberOfWinners += games[i].winningTeamId === null ? 0 : 1;
      matchingWeek.maxTime = games[i].gameDateTime;
    }
  }

  return weeks;
};

module.exports = getGamesByWeek;
