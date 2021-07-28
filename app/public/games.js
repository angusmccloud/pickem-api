'use strict';
const AWS = require('aws-sdk');
AWS.config.setPromisesDependency(require('bluebird'));

const getUserId = require('../utils/getUserId/getUserId');
const createGame = require('../functions/createGame/createGame');
const updateGameTime = require('../functions/updateGameTime/updateGameTime');
const updateGameWinner = require('../functions/updateGameWinner/updateGameWinner');

module.exports.createGame = async (event, context, callback) => {
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
    const { seasonName, weekNumber, weekName, playoffFlag, guessPointsFlag, visitingTeamId, homeTeamId, mondayNightFlag, gameDateTime } = requestBody;

    let anyErrors = false;
    let errorsText = '';
    if (userId === undefined) {
        anyErrors = true;
        errorsText = 'Invalid request parameters, must include userId';
    } else if (seasonName === undefined || typeof(seasonName) !== 'string') {
        anyErrors = true;
        errorsText = 'Invalid request parameters, must include seasonName';
    } else if (weekNumber === undefined || typeof(weekNumber) !== 'number') {
        anyErrors = true;
        errorsText = 'Invalid request parameters, must include weekNumber';
    } else if (weekName === undefined || typeof(weekName) !== 'string') {
        anyErrors = true;
        errorsText = 'Invalid request parameters, must include weekName';
    } else if (homeTeamId === undefined || typeof(homeTeamId) !== 'number') {
        anyErrors = true;
        errorsText = 'Invalid request parameters, must include homeTeamId';
    } else if (visitingTeamId === undefined || typeof(visitingTeamId) !== 'number') {
        anyErrors = true;
        errorsText = 'Invalid request parameters, must include visitingTeamId';
    } else if (gameDateTime === undefined || typeof(gameDateTime) !== 'number') {
        anyErrors = true;
        errorsText = 'Invalid request parameters, must include gameDateTime';
    } else if (playoffFlag === undefined || typeof(playoffFlag) !== 'boolean') {
        anyErrors = true;
        errorsText = 'Invalid request parameters, must include playoffFlag';
    } else if (guessPointsFlag === undefined || typeof(guessPointsFlag) !== 'boolean') {
        anyErrors = true;
        errorsText = 'Invalid request parameters, must include guessPointsFlag';
    } else if (mondayNightFlag === undefined || typeof(mondayNightFlag) !== 'boolean') {
        anyErrors = true;
        errorsText = 'Invalid request parameters, must include mondayNightFlag';
    }

    ////
    // TO-DO:
    // Verify that userId has permission to create a game
    ////

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
        const gameId = await createGame(seasonName, weekNumber, weekName, playoffFlag, guessPointsFlag, visitingTeamId, homeTeamId, mondayNightFlag, gameDateTime);

        const response = {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                success: true,
                gameId
            })
        };

        callback(null, response);
    }
};

module.exports.updateGame = async (event, context, callback) => {
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
    const gameId = event.pathParameters.gameId;
    const { weekNumber, weekName, guessPointsFlag, mondayNightFlag, gameDateTime } = requestBody;

    let anyErrors = false;
    let errorsText = '';
    if (userId === undefined) {
        anyErrors = true;
        errorsText = 'Invalid request parameters, must include userId';
    } else if (gameId === undefined || typeof(gameId) !== 'string') {
        anyErrors = true;
        errorsText = 'Invalid request parameters, must include seasonName';
    } else if (weekNumber === undefined || typeof(weekNumber) !== 'number') {
        anyErrors = true;
        errorsText = 'Invalid request parameters, must include weekNumber';
    } else if (weekName === undefined || typeof(weekName) !== 'string') {
        anyErrors = true;
        errorsText = 'Invalid request parameters, must include weekName';
    } else if (gameDateTime === undefined || typeof(gameDateTime) !== 'number') {
        anyErrors = true;
        errorsText = 'Invalid request parameters, must include gameDateTime';
    } else if (guessPointsFlag === undefined || typeof(guessPointsFlag) !== 'boolean') {
        anyErrors = true;
        errorsText = 'Invalid request parameters, must include guessPointsFlag';
    } else if (mondayNightFlag === undefined || typeof(mondayNightFlag) !== 'boolean') {
        anyErrors = true;
        errorsText = 'Invalid request parameters, must include mondayNightFlag';
    }

    ////
    // TO-DO:
    // Verify that userId has permission to create a game
    ////

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
        const result = await updateGameTime(gameId, weekNumber, weekName, guessPointsFlag, mondayNightFlag, gameDateTime);

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

module.exports.setWinner = async (event, context, callback) => {
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
    const gameId = event.pathParameters.gameId;
    const { winningTeamId, homeTeamPoints, visitingTeamPoints } = requestBody;

    let anyErrors = false;
    let errorsText = '';
    if (userId === undefined) {
        anyErrors = true;
        errorsText = 'Invalid request parameters, must include userId';
    } else if (gameId === undefined || typeof(gameId) !== 'string') {
        anyErrors = true;
        errorsText = 'Invalid request parameters, must include seasonName';
    } else if (winningTeamId === undefined || typeof(winningTeamId) !== 'number') {
        anyErrors = true;
        errorsText = 'Invalid request parameters, must include winningTeamId';
    } else if (homeTeamPoints === undefined || typeof(homeTeamPoints) !== 'number') {
        anyErrors = true;
        errorsText = 'Invalid request parameters, must include homeTeamPoints';
    } else if (visitingTeamPoints === undefined || typeof(visitingTeamPoints) !== 'number') {
        anyErrors = true;
        errorsText = 'Invalid request parameters, must include visitingTeamPoints';
    }

    ////
    // TO-DO:
    // Verify that userId has permission to Set Winner
    ////

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
        const result = await updateGameWinner(gameId, winningTeamId, homeTeamPoints, visitingTeamPoints);

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