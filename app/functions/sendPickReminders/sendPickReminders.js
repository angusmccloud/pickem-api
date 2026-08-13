'use strict';
const leagueInfo = require('../../data/leagues/leagues');
const teamsInfo = require('../../data/teams/teams');
const dynamoScanAllRows = require('../../utils/dynamoScanAllRows');
const cognitoGetAllUsers = require('../../utils/cognitoGetAllUsers/cognitoGetAllUsers');
const sesSendEmail = require('../../utils/sesSendEmail');
const { zonedDayKey, addDaysToDayKey, formatKickoffTime } = require('../../utils/easternTime/easternTime');

const SITE_URL = process.env.SITE_URL || 'https://nflpickgames.com/';
const SUBJECT = 'Reminder to Get Your Picks In!';

// options.asOf       -- timestamp to treat as "now" when working out the today/tomorrow window.
//                       Lets the job be tested against real games before the season starts.
// options.onlyUserId -- restrict to a single participant, so a test run can't email the league.
const sendPickReminders = async (dryRun = true, options = {}) => {
  const timestamp = options.asOf || new Date().getTime();
  const { defaultLeague } = leagueInfo();

  if(options.asOf) {
    console.log(`-- Test mode -- treating ${new Date(options.asOf).toISOString()} as now`);
  }
  if(options.onlyUserId) {
    console.log(`-- Test mode -- restricted to userId ${options.onlyUserId}`);
  }

  if(defaultLeague === undefined) {
    return 'No default league is set';
  }

  const teams = teamsInfo();

  const gamesPromise = dynamoScanAllRows(
    process.env.GAMES_TABLE,
    'gameId, seasonName, weekNumber, playoffFlag, visitingTeamId, homeTeamId, gameDateTime',
    `seasonName = :seasonName`,
    {':seasonName': defaultLeague.seasonName},
    'gameId');

  // Scanned by season rather than by week, because a today/tomorrow window can straddle two
  // weeks (a Monday night game and that Thursday's opener are in different weeks).
  const picksPromise = dynamoScanAllRows(
    process.env.PICKS_TABLE,
    'pickId, gameId, userId',
    `seasonName = :seasonName`,
    {':seasonName': defaultLeague.seasonName},
    'pickId');

  const participantsPromise = dynamoScanAllRows(
    process.env.PARTICIPANTS_TABLE,
    'userId, playingSeason, playingPlayoffs, paid',
    `leagueId = :leagueId`,
    {':leagueId': defaultLeague.leagueId},
    'participantId');

  const games = await gamesPromise;
  const picks = await picksPromise;
  const participants = await participantsPromise;
  const allUsers = await cognitoGetAllUsers();

  // Games kicking off today or tomorrow that can still be picked. Already-started games are
  // excluded -- setPick rejects them, so there's nothing the recipient could do about them.
  const todayKey = zonedDayKey(timestamp);
  const tomorrowKey = addDaysToDayKey(todayKey, 1);

  const upcomingGames = games
    .filter(game => {
      const gameDayKey = zonedDayKey(game.gameDateTime);
      return (gameDayKey === todayKey || gameDayKey === tomorrowKey)
        && game.gameDateTime > timestamp;
    })
    .sort((a, b) => a.gameDateTime - b.gameDateTime);

  if(upcomingGames.length === 0) {
    console.log('No pickable games today or tomorrow -- nothing to remind anyone about');
    return { seasonName: defaultLeague.seasonName, upcomingGames: 0, reminders: [] };
  }

  const describeGame = (game) => {
    const visitingTeam = teams.find(team => team.teamId === game.visitingTeamId);
    const homeTeam = teams.find(team => team.teamId === game.homeTeamId);
    const visitingName = visitingTeam ? visitingTeam.teamName : `Team ${game.visitingTeamId}`;
    const homeName = homeTeam ? homeTeam.teamName : `Team ${game.homeTeamId}`;
    return {
      dayKey: zonedDayKey(game.gameDateTime),
      text: `${visitingName} @ ${homeName} at ${formatKickoffTime(game.gameDateTime)}`,
    };
  };

  const targetParticipants = options.onlyUserId
    ? participants.filter(participant => participant.userId === options.onlyUserId)
    : participants;

  const reminders = [];

  for(let i = 0; i < targetParticipants.length; i++) {
    const participant = targetParticipants[i];

    // Same eligibility rule setPick enforces: playoff games need playingPlayoffs,
    // regular season games need playingSeason.
    const eligibleGames = upcomingGames.filter(game => (
      game.playoffFlag ? participant.playingPlayoffs : participant.playingSeason
    ));

    if(eligibleGames.length === 0) {
      continue;
    }

    const missingGames = eligibleGames.filter(game => (
      picks.find(pick => pick.gameId === game.gameId && pick.userId === participant.userId) === undefined
    ));

    if(missingGames.length === 0) {
      continue;
    }

    const user = allUsers.find(user => user.userId === participant.userId);
    if(user === undefined) {
      // Disabled or deleted in Cognito but still has a participant row
      console.log(`Skipping ${participant.userId} -- no matching enabled Cognito user`);
      continue;
    }

    reminders.push({
      userId: participant.userId,
      username: user.username,
      email: user.email,
      missingCount: missingGames.length,
      missingGames: missingGames.map(describeGame),
      todayKey,
      tomorrowKey,
    });
  }

  if(dryRun) {
    console.log(`-- Dry run -- would email ${reminders.length} participants`);
    return {
      dryRun: true,
      seasonName: defaultLeague.seasonName,
      upcomingGames: upcomingGames.length,
      reminders,
    };
  }

  const ccAddresses = process.env.REMINDER_CC_EMAIL ? [process.env.REMINDER_CC_EMAIL] : [];
  const sent = [];

  for(let i = 0; i < reminders.length; i++) {
    const reminder = reminders[i];
    const messageId = await sesSendEmail(
      reminder.email,
      SUBJECT,
      buildHtmlBody(reminder),
      buildTextBody(reminder),
      ccAddresses
    );
    sent.push({ email: reminder.email, missingCount: reminder.missingCount, messageId });
  }

  return {
    dryRun: false,
    seasonName: defaultLeague.seasonName,
    upcomingGames: upcomingGames.length,
    emailsSent: sent.length,
    sent,
  };
};

// Games are grouped under Today/Tomorrow headings when the window spans both days, so a bare
// "at 1pm" can't be mistaken for the wrong day.
const groupMissingGames = (reminder) => {
  const today = reminder.missingGames.filter(game => game.dayKey === reminder.todayKey);
  const tomorrow = reminder.missingGames.filter(game => game.dayKey === reminder.tomorrowKey);
  const groups = [];
  if(today.length > 0) {
    groups.push({ heading: 'Today', games: today });
  }
  if(tomorrow.length > 0) {
    groups.push({ heading: 'Tomorrow', games: tomorrow });
  }
  return groups;
};

const buildHtmlBody = (reminder) => {
  const groups = groupMissingGames(reminder);
  const showHeadings = groups.length > 1;
  const sections = groups.map(group => {
    const items = group.games.map(game => `<li>${game.text}</li>`).join('');
    return showHeadings
      ? `<p style="margin-bottom:4px;"><strong>${group.heading}</strong></p><ul>${items}</ul>`
      : `<ul>${items}</ul>`;
  }).join('');

  return `<html><body>`
    + `<p>Friendly reminder to get your picks in at <a href="${SITE_URL}">NFL Pick Games</a> before kickoff! You're missing picks for:</p>`
    + sections
    + `<p>This mailbox isn't monitored, please reach out to Connor if you have any questions or run into any issues.</p>`
    + `</body></html>`;
};

const buildTextBody = (reminder) => {
  const groups = groupMissingGames(reminder);
  const showHeadings = groups.length > 1;
  const sections = groups.map(group => {
    const items = group.games.map(game => `  - ${game.text}`).join('\n');
    return showHeadings ? `${group.heading}:\n${items}` : items;
  }).join('\n\n');

  return `Friendly reminder to get your picks in at NFL Pick Games (${SITE_URL}) before kickoff! You're missing picks for:\n\n`
    + `${sections}\n\n`
    + `This mailbox isn't monitored, please reach out to Connor if you have any questions or run into any issues.\n`;
};

module.exports = sendPickReminders;
