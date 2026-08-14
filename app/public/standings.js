'use strict';
const AWS = require('aws-sdk');
AWS.config.setPromisesDependency(require('bluebird'));

const authenticate = require('../utils/authenticate/authenticate');
const { ok, badRequest } = require('../utils/httpResponse');
const getStandings = require('../functions/getStandings/getStandings');
const leagueInfo = require('../data/leagues/leagues');

const isWarmup = (event) => event.source === 'serverless-plugin-warmup';

module.exports.getStandings = async (event, context, callback) => {
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

    const result = await getStandings(league.leagueId);

    callback(null, ok({ result }));
};

module.exports.getStandingsByWeek = async (event, context, callback) => {
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
    const weekNumber = parseInt((event.pathParameters || {}).weekNumber, 10);

    if (isNaN(weekNumber) || weekNumber <= 0) {
        return callback(null, badRequest('Week number is invalid or missing.'));
    }

    const result = await getStandings(league.leagueId, weekNumber);

    callback(null, ok({ result }));
};
