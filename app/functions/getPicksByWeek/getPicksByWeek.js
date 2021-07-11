'use strict';
const { toLower, times } = require('lodash');
const leagueInfo = require('../../data/leagues/leagues');
const teamsInfo = require('../../data/teams/teams');
const dynamoScanAllRows = require('../../utils/dynamoScanAllRows');

const getPicksByWeek = async (leagueId, userId) => {
  const timestamp = new Date().getTime(); 
  const leagues = await leagueInfo().allLeagues;
  const teams = await teamsInfo();
  const matchingLeague = leagues.find(league => league.leagueId === leagueId);

  if(matchingLeague === undefined) {
    return 'Invalid League ID';
  }

  const gamesPromise = dynamoScanAllRows(
    process.env.GAMES_TABLE, 
    'gameId, mondayNightFlag, divisionFlag, guessPointsFlag, visitingTeamId, homeTeamId, playoffFlag, totalPoints, weekName, weekNumber, winningTeamId', 
    'seasonName = :seasonName',
    {':seasonName': matchingLeague.seasonName},
    'gameId');

  const picksPromise = dynamoScanAllRows(
    process.env.PICKS_TABLE, 
    'gameId, pickedTeamId',
    `seasonName = :seasonName AND userId = :userId`,
    {':seasonName': matchingLeague.seasonName, ':userId': userId},
    'pickId');

  const participantsPromise = dynamoScanAllRows(
    process.env.PARTICIPANTS_TABLE, 
    'userId, paid, playingSeason, playingPlayoffs', 
    `leagueId = :leagueId AND playingSeason = :true`, 
    {':leagueId': leagueId, ':true': true}, 
    'participantId');

  const games = await gamesPromise;
  const picks = await picksPromise;
  const participants = await participantsPromise;
  const playoffParticipants = participants.filter(participant => {
    return participant.playingPlayoffs
  });

  games.sort((a, b) => {
    return a.weekNumber - b.weekNumber;
  });

  const weeks = [];
  for(let i = 0; i < games.length; i++) {
    const game = games[i];
    if(weeks.find(week => week.weekNumber === game.weekNumber) === undefined) {
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
        numberOfPicks: weekPicks
      });
    }
  };

  return weeks;
};

module.exports = getPicksByWeek;
