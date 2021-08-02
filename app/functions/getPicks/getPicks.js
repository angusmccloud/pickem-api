'use strict';
const leagueInfo = require('../../data/leagues/leagues');
const teamsInfo = require('../../data/teams/teams');
const dynamoScanAllRows = require('../../utils/dynamoScanAllRows');
const cognitoGetAllUsers = require('../../utils/cognitoGetAllUsers/cognitoGetAllUsers');

const getPicks = async (leagueId, weekNumber, userId, adminOverride) => {
  const timestamp = new Date().getTime(); 
  const allUsers = await cognitoGetAllUsers();
  const leagues = await leagueInfo().allLeagues;
  const teams = await teamsInfo();
  const matchingLeague = leagues.find(league => league.leagueId === leagueId);

  if(matchingLeague === undefined) {
    return 'Invalid League ID';
  }
  if(weekNumber === undefined) {
    return 'Must pass a weekNumber';
  }

  const gamesPromise = dynamoScanAllRows(
    process.env.GAMES_TABLE, 
    'gameId, mondayNightFlag, divisionFlag, guessPointsFlag, visitingTeamId, homeTeamId, playoffFlag, totalPoints, weekName, weekNumber, winningTeamId', 
    'seasonName = :seasonName AND weekNumber = :weekNumber',
    {':seasonName': matchingLeague.seasonName, ':weekNumber': weekNumber},
    'gameId');

  const picksPromise = dynamoScanAllRows(
    process.env.PICKS_TABLE, 
    'gameId, pickedTeamId, totalPoints, userId', 
    userId ? 
      `seasonName = :seasonName AND weekNumber = :weekNumber AND userId = :userId` :
      `seasonName = :seasonName AND weekNumber = :weekNumber`,
    userId ? 
      {':seasonName': matchingLeague.seasonName, ':weekNumber': weekNumber, ':userId': userId} :
      {':seasonName': matchingLeague.seasonName, ':weekNumber': weekNumber},
    'pickId');

  const participantsPromise = dynamoScanAllRows(
    process.env.PARTICIPANTS_TABLE, 
    'userId, paid, playingSeason, playingPlayoffs', 
    userId ? 
      `leagueId = :leagueId AND playingSeason = :true AND userId = :userId` :
      `leagueId = :leagueId AND playingSeason = :true`, 
    userId ? 
      {':leagueId': leagueId, ':true': true, ':userId': userId} :
      {':leagueId': leagueId, ':true': true}, 
    'participantId');

  const games = await gamesPromise;
  const picks = await picksPromise;
  const participants = await participantsPromise;
  const playoffParticipants = participants.filter(participant => {
    return participant.playingPlayoffs
  });

  const gameResult = games.map(game => {
    return {
      gameId: game.gameId,
      guessPointsFlag: game.guessPointsFlag,
      visitingTeam: teams.find(team => team.teamId === game.visitingTeamId),
      homeTeam: teams.find(team => team.teamId === game.homeTeamId),
      divisionFlag: game.divisionFlag,
      mondayNightFlag: game.mondayNightFlag,
      gameDateTime: game.gameDateTime,
      winningTeamId: game.winningTeamId,
      totalPoints: game.totalPoints,
      showPicks: adminOverride ? true : timestamp > game.gameDateTime
    }
  })

  const thisWeekParticipants = games[0].playoffFlag ? playoffParticipants : participants;

  const picksResult = [];

  for(let i = 0; i < thisWeekParticipants.length; i++) {
    const thisUserId = thisWeekParticipants[i].userId;
    const thisUserPicks = picks.filter(pick => pick.userId === thisUserId);
    const thisUserPicksResult = [];
    const user = allUsers.find(user => user.userId === thisUserId);
    for(let ii = 0; ii < thisUserPicks.length; ii++) {
      const thisPick = thisUserPicks[ii];
      const thisGame = gameResult.find(game => game.gameId === thisPick.gameId);
      if(thisGame.showPicks || adminOverride || userId) {
        thisUserPicksResult.push(thisPick);
      }
    }
    picksResult.push({
      user: {
        userId: thisUserId,
        username: user.username,
      },
      picks: thisUserPicksResult
    });
  }
  
  return {
    games: gameResult,
    picks: picksResult
  };
};

module.exports = getPicks;
