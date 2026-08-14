'use strict';
const AWS = require('aws-sdk');
AWS.config.setPromisesDependency(require('bluebird'));

const authenticate = require('../utils/authenticate/authenticate');
const { ok, badRequest, forbidden } = require('../utils/httpResponse');
const leagueInfo = require('../data/leagues/leagues');
const getUser = require('../functions/getUser/getUser');
const getUsers = require('../functions/getUsers/getUsers');
const updateParticipant = require('../functions/updateParticipant/updateParticipant');

const isWarmup = (event) => event.source === 'serverless-plugin-warmup';

module.exports.getSingleParticipant = async (event, context, callback) => {
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

    const user = await getUser(league.leagueId, auth.user.userId);

    callback(null, ok({ user }));
};

module.exports.getAllParticipants = async (event, context, callback) => {
    /** Immediate response for WarmUP plugin so things don't keep running */
    if (isWarmup(event)) {
        console.log('WarmUP - Lambda is warm!')
        return callback(null, 'Lambda is warm!')
    }

    const auth = await authenticate(event);
    if (!auth.authorized) {
        return callback(null, auth.response);
    }
    // This returns every player's email address alongside their paid status. It used to be readable
    // by any signed-in participant, which was an accident of the auth check only looking for a
    // userId. The only callers are admin screens (Manage Participants, Set Someone's Picks).
    if (!auth.user.admin) {
        return callback(null, forbidden('You do not have permission to list participants'));
    }
    const league = await leagueInfo().defaultLeague;

    const users = await getUsers(league.leagueId);

    callback(null, ok({ users }));
};

module.exports.updateParticipant = async (event, context, callback) => {
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
        return callback(null, forbidden('You do not have permission to update participants'));
    }

    const requestBody = JSON.parse(event.body);
    const passedUserId = (event.pathParameters || {}).userId;
    const { playingSeason, playingPlayoffs, paid } = requestBody;
    const league = await leagueInfo().defaultLeague;

    if (passedUserId === undefined || typeof(passedUserId) !== 'string') {
        return callback(null, badRequest('Invalid request parameters, must include a userId in the path'));
    }
    if (playingSeason === undefined || typeof(playingSeason) !== 'boolean') {
        return callback(null, badRequest('Invalid request parameters, must include playingSeason'));
    }
    if (playingPlayoffs === undefined || typeof(playingPlayoffs) !== 'boolean') {
        return callback(null, badRequest('Invalid request parameters, must include playingPlayoffs'));
    }
    if (paid === undefined || typeof(paid) !== 'boolean') {
        return callback(null, badRequest('Invalid request parameters, must include paid'));
    }

    ////
    // TO-DO:
    // Verify that passedUserId is Valid
    ////

    console.log(`-- Admin ${auth.user.username} updating participant ${passedUserId} --`);
    const result = await updateParticipant(passedUserId, league.leagueId, playingSeason, playingPlayoffs, paid);

    callback(null, ok({ result }));
};
