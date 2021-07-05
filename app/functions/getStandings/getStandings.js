'use strict';
const uuid = require('uuid');
const leagueInfo = require('../../data/leagues/leagues');
const dynamoScanAllRows = require('../../utils/dynamoScanAllRows');

const getStandings = async (leagueId, standingsType = 'all', weekNumber = 0) => {
  const timestamp = new Date().getTime(); 
  const leagues = await leagueInfo().allLeagues;
  const matchingLeague = leagues.find(league => league.leagueId === leagueId);

  if(matchingLeague === undefined) {
    return 'Invalid League ID';
  }
  
  const gamesPromise = dynamoScanAllRows(
    process.env.GAMES_TABLE, 
    'gameId, mondayNightFlag, divisionFlag, guessPointsFlag, visitingTeamId, homeTeamId, playoffFlag, totalPoints, weekName, weekNumber, winningTeamId', 
    `seasonName = :seasonName AND winningTeamId <> :null`, 
    {':seasonName': matchingLeague.seasonName, ':null': null}, 
    'gameId');

  const picksPromise = dynamoScanAllRows(
    process.env.PICKS_TABLE, 
    'gameId, pickedTeamId, totalPoints, userId', 
    `seasonName = :seasonName`, 
    {':seasonName': matchingLeague.seasonName}, 
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
  
  const standings = participants.map(participant => {
    return {
      userId: participant.userId,
      correct: 0,
      incorrect: 0,
      mnfCorrect: 0,
      divisionCorrect: 0,
      pointDifference: 0,
    }
  });
  
  for(let i = 0; i < games.length; i++) {
    const game = games[i];
    const gamePicks = picks.filter(pick => pick.gameId === game.gameId);
    for(let ii = 0; ii < gamePicks.length; ii++) {
      const pick = gamePicks[ii];
      const standingsIndex = standings.findIndex(record => record.userId === pick.userId);
      if(pick.pickedTeamId === game.winningTeamId) {
        standings[standingsIndex].correct = standings[standingsIndex].correct +1;
        if(game.divisionFlag) {
          standings[standingsIndex].divisionCorrect = standings[standingsIndex].divisionCorrect +1;
        }
        if(game.mondayNightFlag) {
          standings[standingsIndex].mnfCorrect = standings[standingsIndex].mnfCorrect +1;
        }
      } else {
        standings[standingsIndex].incorrect = standings[standingsIndex].incorrect +1; 
      }
      if(game.guessPointsFlag) {
        standings[standingsIndex].pointDifference = standings[standingsIndex].pointDifference + Math.abs(game.totalPoints - pick.totalPoints); 
      }
    }
  };

  standings.sort((a, b) => {
    return b.correct - a.correct
      || b.mnfCorrect - a.mnfCorrect
      || b.divisionCorrect - a.divisionCorrect
      || a.pointDifference - b.pointDifference;
  });

  return standings;
};

module.exports = getStandings;
