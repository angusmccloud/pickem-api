'use strict';
const AWS = require('aws-sdk');
AWS.config.setPromisesDependency(require('bluebird'));

const getUserId = require('../utils/getUserId/getUserId');
const leagueInfo = require('../data/leagues/leagues');
const getPicksByWeek = require('../functions/getPicksByWeek/getPicksByWeek');
const getPicks = require('../functions/getPicks/getPicks');
const setPick = require('../functions/setPick/setPick');

module.exports.getPicksByWeek = async (event, context, callback) => {
    /** Immediate response for WarmUP plugin so things don't keep running */
    if (event.source === 'serverless-plugin-warmup') {
        console.log('WarmUP - Lambda is warm!')
        return callback(null, 'Lambda is warm!')
    }

    console.log('-- Event --', event);
    const jwtToken = event.headers.jwtheader;
    console.log('-- About to Check UserId for Token', jwtToken);
    const user = await getUserId(jwtToken);
    const league = await leagueInfo().defaultLeague;
    const weekNumber = parseInt(event.pathParameters.weekNumber);

    let anyErrors = false;
    let errorsText = '';
    if (user.userId === undefined) {
        anyErrors = true;
        errorsText = 'Invalid JWT Token';
    } else if (weekNumber === undefined || isNaN(weekNumber) || typeof weekNumber !== 'number' || weekNumber <= 0) { 
        anyErrors = true;
        errorsText += 'Week number is invalid or missing.';
    };

    if (anyErrors) {
        console.log('There are errors', errorsText);
        const response = {
            statusCode: 400,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                success: false,
                message: errorsText
            })
        };

        callback(null, response);
    } else {
        console.log('No Errors');
        const picks = await getPicks(league.leagueId, weekNumber, undefined, user.admin);

        const response = {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                success: true,
                picks
            })
        };

        callback(null, response);
    }
};

module.exports.getPicksByWeekByPlayer = async (event, context, callback) => {
    /** Immediate response for WarmUP plugin so things don't keep running */
    if (event.source === 'serverless-plugin-warmup') {
        console.log('WarmUP - Lambda is warm!')
        return callback(null, 'Lambda is warm!')
    }

    console.log('-- Event --', event);
    const jwtToken = event.headers.jwtheader;
    console.log('-- About to Check UserId for Token', jwtToken);
    const user = await getUserId(jwtToken);
    const league = await leagueInfo().defaultLeague;
    const weekNumber = parseInt(event.pathParameters.weekNumber);

    let anyErrors = false;
    let errorsText = '';
    if (user.userId === undefined) {
        anyErrors = true;
        errorsText = 'Invalid JWT Token';
    } else if (weekNumber === undefined || isNaN(weekNumber) || typeof weekNumber !== 'number' || weekNumber <= 0) { 
        anyErrors = true;
        errorsText += 'Week number is invalid or missing.';
    };

    if (anyErrors) {
        console.log('There are errors', errorsText);
        const response = {
            statusCode: 400,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                success: false,
                message: errorsText
            })
        };

        callback(null, response);
    } else {
        console.log('No Errors');
        const picks = await getPicks(league.leagueId, weekNumber, user.userId, user.admin);

        const response = {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                success: true,
                picks
            })
        };

        callback(null, response);
    }
};

module.exports.getPicksByPlayer = async (event, context, callback) => {
    /** Immediate response for WarmUP plugin so things don't keep running */
    if (event.source === 'serverless-plugin-warmup') {
        console.log('WarmUP - Lambda is warm!')
        return callback(null, 'Lambda is warm!')
    }

    console.log('-- Event --', event);
    const jwtToken = event.headers.jwtheader;
    console.log('-- About to Check UserId for Token', jwtToken);
    const user = await getUserId(jwtToken);
    const league = await leagueInfo().defaultLeague;

    let anyErrors = false;
    let errorsText = '';
    if (user.userId === undefined) {
        anyErrors = true;
        errorsText = 'Invalid JWT Token';
    }

    if (anyErrors) {
        console.log('There are errors', errorsText);
        const response = {
            statusCode: 400,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                success: false,
                message: errorsText
            })
        };

        callback(null, response);
    } else {
        console.log('No Errors');
        const picks = await getPicksByWeek(league.leagueId, user.userId);

        const response = {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                success: true,
                picks
            })
        };

        callback(null, response);
    }
};

module.exports.updatePick = async (event, context, callback) => {
    /** Immediate response for WarmUP plugin so things don't keep running */
    if (event.source === 'serverless-plugin-warmup') {
        console.log('WarmUP - Lambda is warm!')
        return callback(null, 'Lambda is warm!')
    }

    console.log('-- Event --', event);
    const jwtToken = event.headers.jwtheader;
    console.log('-- About to Check UserId for Token', jwtToken);
    const user = await getUserId(jwtToken);
    const requestBody = JSON.parse(event.body);
    const { gameId, pickedTeamId, totalPoints } = requestBody;
    const league = await leagueInfo().defaultLeague;

    let anyErrors = false;
    let errorsText = '';
    if (user.userId === undefined) {
        anyErrors = true;
        errorsText = 'Invalid JWT Token';
    } else if (gameId === undefined || typeof(gameId) !== 'string') {
        anyErrors = true;
        errorsText = 'Invalid request parameters, must include gameId';
    } else if (pickedTeamId === undefined || typeof(pickedTeamId) !== 'number') {
        anyErrors = true;
        errorsText = 'Invalid request parameters, must include pickedTeamId';
    } else if (totalPoints === undefined || typeof(totalPoints) !== 'number') {
        anyErrors = true;
        errorsText = 'Invalid request parameters, must include totalPoints';
    };

    if (anyErrors) {
        console.log('There are errors', errorsText);
        const response = {
            statusCode: 400,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                success: false,
                message: errorsText
            })
        };

        callback(null, response);
    } else {
        console.log('No Errors');
        const result = await setPick(user.userId, league.leagueId, gameId, pickedTeamId, totalPoints, user.admin);

        const response = {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                success: true,
                result
            })
        };

        callback(null, response);
    }
};