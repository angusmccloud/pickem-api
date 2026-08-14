'use strict';
const AWS = require('aws-sdk');
AWS.config.setPromisesDependency(require('bluebird'));

const authenticate = require('../utils/authenticate/authenticate');
const { ok, badRequest, forbidden } = require('../utils/httpResponse');
const getGamesByWeek = require('../functions/getGamesByWeek/getGamesByWeek');
const createGame = require('../functions/createGame/createGame');
const leagueInfo = require('../data/leagues/leagues');
const updateGameTime = require('../functions/updateGameTime/updateGameTime');
const updateGameWinner = require('../functions/updateGameWinner/updateGameWinner');

const isWarmup = (event) => event.source === 'serverless-plugin-warmup';

module.exports.createGame = async (event, context, callback) => {
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
        return callback(null, forbidden('You do not have permission to create a game'));
    }

    const requestBody = JSON.parse(event.body);
    const { seasonName, weekNumber, weekName, playoffFlag, guessPointsFlag, visitingTeamId, homeTeamId, mondayNightFlag, gameDateTime } = requestBody;

    const required = [
        ['seasonName', seasonName, 'string'],
        ['weekNumber', weekNumber, 'number'],
        ['weekName', weekName, 'string'],
        ['homeTeamId', homeTeamId, 'number'],
        ['visitingTeamId', visitingTeamId, 'number'],
        ['gameDateTime', gameDateTime, 'number'],
        ['playoffFlag', playoffFlag, 'boolean'],
        ['guessPointsFlag', guessPointsFlag, 'boolean'],
        ['mondayNightFlag', mondayNightFlag, 'boolean'],
    ];
    const missing = required.find(([, value, type]) => value === undefined || typeof(value) !== type);
    if (missing) {
        return callback(null, badRequest(`Invalid request parameters, must include ${missing[0]}`));
    }

    console.log(`-- Admin ${auth.user.username} creating game --`);
    const gameId = await createGame(seasonName, weekNumber, weekName, playoffFlag, guessPointsFlag, visitingTeamId, homeTeamId, mondayNightFlag, gameDateTime);

    callback(null, ok({ gameId }));
};

module.exports.updateGame = async (event, context, callback) => {
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
        return callback(null, forbidden('You do not have permission to update games'));
    }

    const requestBody = JSON.parse(event.body);
    const gameId = (event.pathParameters || {}).gameId;
    const { weekNumber, weekName, guessPointsFlag, mondayNightFlag, gameDateTime } = requestBody;

    const required = [
        ['gameId', gameId, 'string'],
        ['weekNumber', weekNumber, 'number'],
        ['weekName', weekName, 'string'],
        ['gameDateTime', gameDateTime, 'number'],
        ['guessPointsFlag', guessPointsFlag, 'boolean'],
        ['mondayNightFlag', mondayNightFlag, 'boolean'],
    ];
    const missing = required.find(([, value, type]) => value === undefined || typeof(value) !== type);
    if (missing) {
        return callback(null, badRequest(`Invalid request parameters, must include ${missing[0]}`));
    }

    console.log(`-- Admin ${auth.user.username} updating game ${gameId} --`);
    const result = await updateGameTime(gameId, weekNumber, weekName, guessPointsFlag, mondayNightFlag, gameDateTime);

    callback(null, ok({ result }));
};

module.exports.setWinner = async (event, context, callback) => {
    /** Immediate response for WarmUP plugin so things don't keep running */
    if (isWarmup(event)) {
        console.log('WarmUP - Lambda is warm!')
        return callback(null, 'Lambda is warm!')
    }

    const auth = await authenticate(event);
    if (!auth.authorized) {
        return callback(null, auth.response);
    }
    if (!auth.user.gameAdmin) {
        return callback(null, forbidden('You do not have permission to set game winners'));
    }

    const requestBody = JSON.parse(event.body);
    const gameId = (event.pathParameters || {}).gameId;
    const { winningTeamId, homeTeamPoints, visitingTeamPoints } = requestBody;

    const required = [
        ['gameId', gameId, 'string'],
        ['winningTeamId', winningTeamId, 'number'],
        ['homeTeamPoints', homeTeamPoints, 'number'],
        ['visitingTeamPoints', visitingTeamPoints, 'number'],
    ];
    const missing = required.find(([, value, type]) => value === undefined || typeof(value) !== type);
    if (missing) {
        return callback(null, badRequest(`Invalid request parameters, must include ${missing[0]}`));
    }

    console.log(`-- Game admin ${auth.user.username} setting winner for game ${gameId} --`);
    const result = await updateGameWinner(gameId, winningTeamId, homeTeamPoints, visitingTeamPoints);

    callback(null, ok({ result }));
};

module.exports.getGamesByWeek = async (event, context, callback) => {
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

    const result = await getGamesByWeek(league.leagueId);

    callback(null, ok({ result }));
};
