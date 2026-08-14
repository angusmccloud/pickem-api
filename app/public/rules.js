'use strict';
const AWS = require('aws-sdk');
AWS.config.setPromisesDependency(require('bluebird'));

const authenticate = require('../utils/authenticate/authenticate');
const { ok } = require('../utils/httpResponse');
const getPayoutStructure = require('../functions/getPayoutStructure/getPayoutStructure');
const leagueInfo = require('../data/leagues/leagues');

const isWarmup = (event) => event.source === 'serverless-plugin-warmup';

module.exports.getPayoutStructure = async (event, context, callback) => {
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

    const result = await getPayoutStructure(league.leagueId);

    callback(null, ok({ result }));
};
