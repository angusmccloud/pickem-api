'use strict';
const leagueInfo = require('../../data/leagues/leagues');
const dynamoScanAllRows = require('../../utils/dynamoScanAllRows');
const dynamoFetchSingleItem = require('../../utils/dynamoFetchSingleItem');

const getPicksByWeek = async (leagueId, userId) => {
  const timestamp = new Date().getTime(); 
  const leagues = await leagueInfo().allLeagues;
  const matchingLeague = leagues.find(league => league.leagueId === leagueId);

  if(matchingLeague === undefined) {
    return 'Invalid League ID';
  }

  const gamesPromise = dynamoScanAllRows(
    process.env.GAMES_TABLE, 
    'gameId, mondayNightFlag, divisionFlag, guessPointsFlag, visitingTeamId, homeTeamId, playoffFlag, totalPoints, weekName, weekNumber, winningTeamId, gameDateTime', 
    'seasonName = :seasonName',
    {':seasonName': matchingLeague.seasonName},
    'gameId');

  const picksPromise = dynamoScanAllRows(
    process.env.PICKS_TABLE, 
    'gameId, pickedTeamId',
    `seasonName = :seasonName AND userId = :userId`,
    {':seasonName': matchingLeague.seasonName, ':userId': userId},
    'pickId');

  const participantPromise = dynamoFetchSingleItem(
    process.env.PARTICIPANTS_TABLE,
    'participantId',
    `${leagueId}-${userId}`
  );

  const games = await gamesPromise;
  const picks = await picksPromise;
  const participant = await participantPromise;

  games.sort((a, b) => {
    return a.weekNumber - b.weekNumber
      || a.gameDateTime - b.gameDateTime;
  });

  const weeks = [];
  for (let i = 0; i < games.length; i++) {
    const game = games[i];
    const matchingWeek = weeks.find(week => week.weekNumber === game.weekNumber);
    if (matchingWeek === undefined) {
      const weekGames = games.filter(g => g.weekNumber === game.weekNumber);
      let weekPicks = 0;
      for(let ii = 0; ii < weekGames.length; ii++) {
        const pick = picks.find(p => p.gameId === weekGames[ii].gameId);
        if(pick !== undefined) {
          weekPicks++;
        };
      }
      weeks.push({
        weekNumber: game.weekNumber,
        weekName: game.weekName,
        numberOfGames: weekGames.length,
        numberOfPicks: weekPicks,
        minTime: weekGames[0].gameDateTime,
        maxTime: weekGames[weekGames.length - 1].gameDateTime,
        pickingWeek: !game.playoffFlag || participant.playingPlayoffs,
      });
    }
  };

  return weeks;
};

module.exports = getPicksByWeek;
