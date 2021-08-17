'use strict';
const AWS = require('aws-sdk');
AWS.config.setPromisesDependency(require('bluebird'));

const getUserId = require('../utils/getUserId/getUserId');
const getStandings = require('../functions/getStandings/getStandings');
const leagueInfo = require('../data/leagues/leagues');

module.exports.getStandings = async (event, context, callback) => {
    /** Immediate response for WarmUP plugin so things don't keep running */
    if (event.source === 'serverless-plugin-warmup') {
        console.log('WarmUP - Lambda is warm!')
        return callback(null, 'Lambda is warm!')
    }
    const league = await leagueInfo().defaultLeague;
    console.log('-- Event --', event);
    const jwtToken = event.headers.jwtheader;
    console.log('-- About to Check UserId for Token', jwtToken);
    const userId = await getUserId(jwtToken);

    let anyErrors = false;
    let errorsText = '';
    if(!userId.validUser) {
        anyErrors = true;
        errorsText += 'UserId is invalid. ';
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
        const result = await getStandings(league.leagueId);

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


module.exports.getStandingsByWeek = async (event, context, callback) => {
    /** Immediate response for WarmUP plugin so things don't keep running */
    if (event.source === 'serverless-plugin-warmup') {
        console.log('WarmUP - Lambda is warm!')
        return callback(null, 'Lambda is warm!')
    }
    const league = await leagueInfo().defaultLeague;
    console.log('-- Event --', event);
    const jwtToken = event.headers.jwtheader;
    console.log('-- About to Check UserId for Token', jwtToken);
    const userId = await getUserId(jwtToken);
    const weekNumber = parseInt(event.pathParameters.weekNumber);

    let anyErrors = false;
    let errorsText = '';
    if(!userId.validUser) {
        anyErrors = true;
        errorsText += 'UserId is invalid.';
    } else if (weekNumber === undefined || isNaN(weekNumber) || typeof weekNumber !== 'number' || weekNumber <= 0) { 
        anyErrors = true;
        errorsText += 'Week number is invalid or missing.';
    };

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
        const result = await getStandings(league.leagueId, weekNumber);

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