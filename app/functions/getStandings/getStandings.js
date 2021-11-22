'use strict';
const { toLower } = require('lodash');
const leagueInfo = require('../../data/leagues/leagues');
const dynamoScanAllRows = require('../../utils/dynamoScanAllRows');
const cognitoGetAllUsers = require('../../utils/cognitoGetAllUsers/cognitoGetAllUsers');

const getStandings = async (leagueId, weekNumber) => {
  const allUsers = await cognitoGetAllUsers();
  const leagues = await leagueInfo().allLeagues;
  const matchingLeague = leagues.find(league => league.leagueId === leagueId);

  if(matchingLeague === undefined) {
    return 'Invalid League ID';
  }

  const gamesPromise = dynamoScanAllRows(
    process.env.GAMES_TABLE, 
    'gameId, mondayNightFlag, divisionFlag, guessPointsFlag, visitingTeamId, homeTeamId, playoffFlag, totalPoints, weekName, weekNumber, winningTeamId', 
    weekNumber ? 
      'seasonName = :seasonName AND winningTeamId <> :null AND weekNumber = :weekNumber' :
      'seasonName = :seasonName AND winningTeamId <> :null',
    weekNumber ?   
      {':seasonName': matchingLeague.seasonName, ':null': null, ':weekNumber': weekNumber} :
      {':seasonName': matchingLeague.seasonName, ':null': null},
    'gameId');

  const picksPromise = dynamoScanAllRows(
    process.env.PICKS_TABLE, 
    'gameId, pickedTeamId, totalPoints, userId', 
    weekNumber ? 
      `seasonName = :seasonName AND weekNumber = :weekNumber` :
      `seasonName = :seasonName`,
    weekNumber ? 
      {':seasonName': matchingLeague.seasonName, ':weekNumber': weekNumber} :
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
  const playoffParticipants = participants.filter(participant => {
    return participant.playingPlayoffs
  });
  
  const standings = participants.map(participant => {
    const user = allUsers.find(user => user.userId === participant.userId);
    return {
      userId: participant.userId,
      username: user.username,
      correct: 0,
      incorrect: 0,
      mnfCorrect: 0,
      divisionCorrect: 0,
      pointDifference: 0,
    }
  });

  const playoffStandings = playoffParticipants.map(participant => {
    const user = allUsers.find(user => user.userId === participant.userId);
    return {
      userId: participant.userId,
      username: user.username,
      correct: 0,
      incorrect: 0,
      wildCardCorrect: 0,
      divisionalCorrect: 0,
      conferenceChampionshipCorrect: 0,
      superbowlCorrect: 0,
      pointDifference: 0
    };
  });

  let regularSeasonGames = 0;
  let playofGames = 0;
  
  for(let i = 0; i < games.length; i++) {
    const game = games[i];
    const gamePicks = picks.filter(pick => pick.gameId === game.gameId);
    for(let ii = 0; ii < gamePicks.length; ii++) {
      const pick = gamePicks[ii];
      if(game.playoffFlag) {
        playofGames++;
        const standingsIndex = playoffStandings.findIndex(record => record.userId === pick.userId);
        if(pick.pickedTeamId === game.winningTeamId) {
          playoffStandings[standingsIndex].correct = playoffStandings[standingsIndex].correct +1;
          if(toLower(game.weekName) === 'wild card') {
            playoffStandings[standingsIndex].wildCardCorrect = playoffStandings[standingsIndex].wildCardCorrect +1;
          }
          if(toLower(game.weekName) === 'divisional') {
            playoffStandings[standingsIndex].divisionalCorrect = playoffStandings[standingsIndex].divisionalCorrect +1;
          }
          if(toLower(game.weekName) === 'conference championship') {
            playoffStandings[standingsIndex].conferenceChampionshipCorrect = playoffStandings[standingsIndex].conferenceChampionshipCorrect +1;
          }
          if(toLower(game.weekName) === 'superbowl') {
            playoffStandings[standingsIndex].superbowlCorrect = playoffStandings[standingsIndex].superbowlCorrect +1;
          }
        } else if (pick.pickedTeamId === game.visitingTeamId) {
          playoffStandings[standingsIndex].incorrect = playoffStandings[standingsIndex].incorrect +1; 
        }
        if(game.guessPointsFlag) {
          playoffStandings[standingsIndex].pointDifference = playoffStandings[standingsIndex].pointDifference + Math.abs(game.totalPoints - pick.totalPoints); 
        }
      } else {
        regularSeasonGames++;
        const standingsIndex = standings.findIndex(record => record.userId === pick.userId);
        if(pick.pickedTeamId === game.winningTeamId) {
          standings[standingsIndex].correct = standings[standingsIndex].correct +1;
          if(game.divisionFlag) {
            standings[standingsIndex].divisionCorrect = standings[standingsIndex].divisionCorrect +1;
          }
          if(game.mondayNightFlag) {
            standings[standingsIndex].mnfCorrect = standings[standingsIndex].mnfCorrect +1;
          }
        } else if (pick.pickedTeamId === game.visitingTeamId) {
          standings[standingsIndex].incorrect = standings[standingsIndex].incorrect +1; 
        }
        if(game.guessPointsFlag) {
          standings[standingsIndex].pointDifference = standings[standingsIndex].pointDifference + Math.abs(game.totalPoints - pick.totalPoints); 
        }
      }
    }
  };

  standings.sort((a, b) => {
    return b.correct - a.correct
      || b.mnfCorrect - a.mnfCorrect
      || b.divisionCorrect - a.divisionCorrect
      || a.pointDifference - b.pointDifference;
  });
  let lastRank = 0;
  let lastRecord = '';
  for(let i = 0; i < standings.length; i++) {
    const row = standings[i];
    const record = `${row.correct}-${row.mnfCorrect}-${row.divisionCorrect}-${row.pointDifference}`;
    if(record !== lastRecord) {
      standings[i].rank = i + 1;
      lastRank = i + 1;
      lastRecord = record;
    } else {
      standings[i].rank = lastRank;
    }
  }

  playoffStandings.sort((a, b) => {
    return b.correct - a.correct
      || b.superbowlCorrect - a.superbowlCorrect
      || b.conferenceChampionshipCorrect - a.conferenceChampionshipCorrect
      || b.divisionalCorrect - a.divisionalCorrect
      || b.wildCardCorrect - a.wildCardCorrect
      || a.pointDifference - b.pointDifference;
  });
  lastRank = 0;
  lastRecord = '';
  for(let i = 0; i < playoffStandings.length; i++) {
    const row = playoffStandings[i];
    const record = `${row.correct}-${row.superbowlCorrect}-${row.conferenceChampionshipCorrect}-${row.divisionalCorrect}-${row.wildCardCorrect}-${row.pointDifference}`;
    if(record !== lastRecord) {
      playoffStandings[i].rank = i + 1;
      lastRank = i + 1;
      lastRecord = record;
    } else {
      playoffStandings[i].rank = lastRank;
    }
  }

  return {
    regularSeason: standings,
    playoffs: playoffStandings,
    standingsInfo: {
      regularSeason: regularSeasonGames > 0 || weekNumber === undefined,
      playoffs: playofGames > 0,
      singleWeek: weekNumber !== undefined
    }
  };
};

module.exports = getStandings;
