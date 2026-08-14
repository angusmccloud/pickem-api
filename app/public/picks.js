'use strict';
const AWS = require('aws-sdk');
AWS.config.setPromisesDependency(require('bluebird'));

const authenticate = require('../utils/authenticate/authenticate');
const { ok, badRequest, forbidden, notFound } = require('../utils/httpResponse');
const dynamoFetchSingleItem = require('../utils/dynamoFetchSingleItem');
const leagueInfo = require('../data/leagues/leagues');
const getPicksByWeek = require('../functions/getPicksByWeek/getPicksByWeek');
const getPicks = require('../functions/getPicks/getPicks');
const setPick = require('../functions/setPick/setPick');

const isWarmup = (event) => event.source === 'serverless-plugin-warmup';

const readWeekNumber = (event) => parseInt((event.pathParameters || {}).weekNumber, 10);
const weekNumberIsInvalid = (weekNumber) => isNaN(weekNumber) || weekNumber <= 0;

module.exports.getPicksByWeek = async (event, context, callback) => {
    /** Immediate response for WarmUP plugin so things don't keep running */
    if (isWarmup(event)) {
        console.log('WarmUP - Lambda is warm!')
        return callback(null, 'Lambda is warm!')
    }

    const auth = await authenticate(event);
    if (!auth.authorized) {
        return callback(null, auth.response);
    }
    const user = auth.user;
    const league = await leagueInfo().defaultLeague;
    const weekNumber = readWeekNumber(event);

    if (weekNumberIsInvalid(weekNumber)) {
        return callback(null, badRequest('Week number is invalid or missing.'));
    }

    const picks = await getPicks(league.leagueId, weekNumber, undefined, user.admin);

    callback(null, ok({ picks }));
};

module.exports.getPicksByWeekByPlayer = async (event, context, callback) => {
    /** Immediate response for WarmUP plugin so things don't keep running */
    if (isWarmup(event)) {
        console.log('WarmUP - Lambda is warm!')
        return callback(null, 'Lambda is warm!')
    }

    const auth = await authenticate(event);
    if (!auth.authorized) {
        return callback(null, auth.response);
    }
    const user = auth.user;
    const league = await leagueInfo().defaultLeague;
    const weekNumber = readWeekNumber(event);

    if (weekNumberIsInvalid(weekNumber)) {
        return callback(null, badRequest('Week number is invalid or missing.'));
    }

    const picks = await getPicks(league.leagueId, weekNumber, user.userId, user.admin);

    callback(null, ok({ picks }));
};

module.exports.getPicksByPlayer = async (event, context, callback) => {
    /** Immediate response for WarmUP plugin so things don't keep running */
    if (isWarmup(event)) {
        console.log('WarmUP - Lambda is warm!')
        return callback(null, 'Lambda is warm!')
    }

    const auth = await authenticate(event);
    if (!auth.authorized) {
        return callback(null, auth.response);
    }
    const league = await leagueInfo().defaultLeague;

    const picks = await getPicksByWeek(league.leagueId, auth.user.userId);

    callback(null, ok({ picks }));
};

module.exports.updatePick = async (event, context, callback) => {
    /** Immediate response for WarmUP plugin so things don't keep running */
    if (isWarmup(event)) {
        console.log('WarmUP - Lambda is warm!')
        return callback(null, 'Lambda is warm!')
    }

    const auth = await authenticate(event);
    if (!auth.authorized) {
        return callback(null, auth.response);
    }
    const user = auth.user;
    const requestBody = JSON.parse(event.body);
    const { gameId, pickedTeamId, totalPoints } = requestBody;
    const league = await leagueInfo().defaultLeague;

    const invalidField = findInvalidPickField(gameId, pickedTeamId, totalPoints);
    if (invalidField) {
        return callback(null, badRequest(invalidField));
    }

    // Note: no admin override here, even for admins. This endpoint sets *your own* picks, and
    // letting an admin quietly backdate their own is exactly the thing the league would object to.
    // Admins who need to fix a pick after kickoff -- theirs or anyone's -- go through
    // updatePickForPlayer below, which is an explicit, auditable action.
    const result = await setPick(user.userId, league.leagueId, gameId, pickedTeamId, totalPoints, false);

    if (!result.success) {
        return callback(null, badRequest(result.message));
    }

    callback(null, ok({ result }));
};

/**
 * Admin-only: read another player's picks for a week, ignoring the usual "hide picks until kickoff"
 * rule so the admin can see what they're about to change.
 */
module.exports.getPicksByWeekForPlayer = async (event, context, callback) => {
    /** Immediate response for WarmUP plugin so things don't keep running */
    if (isWarmup(event)) {
        console.log('WarmUP - Lambda is warm!')
        return callback(null, 'Lambda is warm!')
    }

    const auth = await authenticate(event);
    if (!auth.authorized) {
        return callback(null, auth.response);
    }
    if (!auth.user.admin) {
        return callback(null, forbidden('You do not have permission to view another player\'s picks'));
    }

    const league = await leagueInfo().defaultLeague;
    const weekNumber = readWeekNumber(event);
    const targetUserId = (event.pathParameters || {}).userId;

    if (weekNumberIsInvalid(weekNumber)) {
        return callback(null, badRequest('Week number is invalid or missing.'));
    }
    if (targetUserId === undefined || typeof targetUserId !== 'string') {
        return callback(null, badRequest('Invalid request parameters, must include a userId in the path'));
    }

    const participant = await dynamoFetchSingleItem(process.env.PARTICIPANTS_TABLE, 'participantId', `${league.leagueId}-${targetUserId}`);
    if (participant === undefined) {
        return callback(null, notFound('That user isn\'t a participant in this league'));
    }

    console.log(`-- Admin ${auth.user.username} reading picks for ${targetUserId}, week ${weekNumber} --`);
    const picks = await getPicks(league.leagueId, weekNumber, targetUserId, true);

    callback(null, ok({ picks }));
};

/**
 * Admin-only: set another player's pick. Passes adminOverride into setPick, so unlike the
 * self-serve endpoint this one still works after kickoff.
 */
module.exports.updatePickForPlayer = async (event, context, callback) => {
    /** Immediate response for WarmUP plugin so things don't keep running */
    if (isWarmup(event)) {
        console.log('WarmUP - Lambda is warm!')
        return callback(null, 'Lambda is warm!')
    }

    const auth = await authenticate(event);
    if (!auth.authorized) {
        return callback(null, auth.response);
    }
    if (!auth.user.admin) {
        return callback(null, forbidden('You do not have permission to set another player\'s picks'));
    }

    const requestBody = JSON.parse(event.body);
    const { gameId, pickedTeamId, totalPoints } = requestBody;
    const targetUserId = (event.pathParameters || {}).userId;
    const league = await leagueInfo().defaultLeague;

    if (targetUserId === undefined || typeof targetUserId !== 'string') {
        return callback(null, badRequest('Invalid request parameters, must include a userId in the path'));
    }
    const invalidField = findInvalidPickField(gameId, pickedTeamId, totalPoints);
    if (invalidField) {
        return callback(null, badRequest(invalidField));
    }

    // Logged rather than persisted -- there's no audit table, and adding one would mean a fourth
    // Dynamo table. CloudWatch at least leaves a trail of who changed whose pick.
    console.log(`-- Admin ${auth.user.username} (${auth.user.userId}) setting pick for ${targetUserId}: game ${gameId} -> team ${pickedTeamId} --`);
    const result = await setPick(targetUserId, league.leagueId, gameId, pickedTeamId, totalPoints, true);

    if (!result.success) {
        return callback(null, badRequest(result.message));
    }

    callback(null, ok({ result }));
};

const findInvalidPickField = (gameId, pickedTeamId, totalPoints) => {
    if (gameId === undefined || typeof(gameId) !== 'string') {
        return 'Invalid request parameters, must include gameId';
    }
    if (pickedTeamId === undefined || typeof(pickedTeamId) !== 'number') {
        return 'Invalid request parameters, must include pickedTeamId';
    }
    if (totalPoints === undefined || typeof(totalPoints) !== 'number') {
        return 'Invalid request parameters, must include totalPoints';
    }
    return undefined;
};
