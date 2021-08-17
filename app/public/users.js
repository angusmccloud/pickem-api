'use strict';
const AWS = require('aws-sdk');
AWS.config.setPromisesDependency(require('bluebird'));

const getUserId = require('../utils/getUserId/getUserId');
const leagueInfo = require('../data/leagues/leagues');
const getUser = require('../functions/getUser/getUser');
const getUsers = require('../functions/getUsers/getUsers');
const updateParticipant = require('../functions/updateParticipant/updateParticipant');

module.exports.getSingleParticipant = async (event, context, callback) => {
    /** Immediate response for WarmUP plugin so things don't keep running */
    if (event.source === 'serverless-plugin-warmup') {
        console.log('WarmUP - Lambda is warm!')
        return callback(null, 'Lambda is warm!')
    }

    console.log('-- Event --', event);
    const jwtToken = event.headers.jwtheader;
    console.log('-- About to Check UserId for Token', jwtToken);
    const userId = await getUserId(jwtToken).userId;
    const league = await leagueInfo().defaultLeague;

    let anyErrors = false;
    let errorsText = '';
    if (userId === undefined) {
        anyErrors = true;
        errorsText = 'Invalid JWT Token';
    }

    if (anyErrors) {
        console.log('There are errors', errorsText);
        const response = {
            statusCode: 400,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Credentials': true,
            },
            body: JSON.stringify({
                success: false,
                message: errorsText
            })
        };

        callback(null, response);
    } else {
        console.log('No Errors');
        const user = await getUser(league.leagueId, userId);

        const response = {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Credentials': true,
            },
            body: JSON.stringify({
                success: true,
                user
            })
        };

        callback(null, response);
    }
};

module.exports.getAllParticipants = async (event, context, callback) => {
    /** Immediate response for WarmUP plugin so things don't keep running */
    if (event.source === 'serverless-plugin-warmup') {
        console.log('WarmUP - Lambda is warm!')
        return callback(null, 'Lambda is warm!')
    }

    console.log('-- Event --', event);
    const jwtToken = event.headers.jwtheader;
    console.log('-- About to Check UserId for Token', jwtToken);
    const userId = await getUserId(jwtToken).userId;
    const league = await leagueInfo().defaultLeague;

    let anyErrors = false;
    let errorsText = '';
    if (userId === undefined) {
        anyErrors = true;
        errorsText = 'Invalid JWT Token';
    }

    if (anyErrors) {
        console.log('There are errors', errorsText);
        const response = {
            statusCode: 400,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Credentials': true,
            },
            body: JSON.stringify({
                success: false,
                message: errorsText
            })
        };

        callback(null, response);
    } else {
        console.log('No Errors');
        const users = await getUsers(league.leagueId);

        const response = {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Credentials': true,
            },
            body: JSON.stringify({
                success: true,
                users
            })
        };

        callback(null, response);
    }
};

module.exports.updateParticipant = async (event, context, callback) => {
    /** Immediate response for WarmUP plugin so things don't keep running */
    if (event.source === 'serverless-plugin-warmup') {
        console.log('WarmUP - Lambda is warm!')
        return callback(null, 'Lambda is warm!')
    }

    console.log('-- Event --', event);
    const jwtToken = event.headers.jwtheader;
    console.log('-- About to Check UserId for Token', jwtToken);
    const userId = await getUserId(jwtToken).userId;
    const requestBody = JSON.parse(event.body);
    const passedUserId = event.pathParameters.userId;
    const { playingSeason, playingPlayoffs, paid } = requestBody;
    const league = await leagueInfo().defaultLeague;

    let anyErrors = false;
    let errorsText = '';
    if (userId === undefined) {
        anyErrors = true;
        errorsText = 'Invalid JWT Token';
    } else if (passedUserId === undefined || typeof(passedUserId) !== 'string') {
        anyErrors = true;
        errorsText = 'Invalid request parameters, must include a userId in the path';
    } else if (playingSeason === undefined || typeof(playingSeason) !== 'boolean') {
        anyErrors = true;
        errorsText = 'Invalid request parameters, must include playingSeason';
    } else if (playingPlayoffs === undefined || typeof(playingPlayoffs) !== 'boolean') {
        anyErrors = true;
        errorsText = 'Invalid request parameters, must include playingPlayoffs';
    } else if (paid === undefined || typeof(paid) !== 'boolean') {
        anyErrors = true;
        errorsText = 'Invalid request parameters, must include paid';
    }

    ////
    // TO-DO:
    // Verify that userId has permission to Update Participants
    // Verify that passedUserId is Valid
    ////

    if (anyErrors) {
        console.log('There are errors', errorsText);
        const response = {
            statusCode: 400,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Credentials': true,
            },
            body: JSON.stringify({
                success: false,
                message: errorsText
            })
        };

        callback(null, response);
    } else {
        console.log('No Errors');
        const result = await updateParticipant(passedUserId, league.leagueId, playingSeason, playingPlayoffs, paid);

        const response = {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Credentials': true,
            },
            body: JSON.stringify({
                success: true,
                result
            })
        };

        callback(null, response);
    }
};