'use strict';
const AWS = require('aws-sdk');
AWS.config.setPromisesDependency(require('bluebird'));

const getUserId = require('../functions/getUserId/getUserId');

module.exports.createGame = async (event, context, callback) => {
    /** Immediate response for WarmUP plugin so things don't keep running */
    if (event.source === 'serverless-plugin-warmup') {
        console.log('WarmUP - Lambda is warm!')
        return callback(null, 'Lambda is warm!')
    }

    console.log('-- Event --', event);
    const jwtToken = event.headers.jwtheader;
    console.log('-- About to Check UserId for Token', jwtToken);
    const userId = await getUserId(jwtToken);
    const comicId = event.pathParameters.comicId;

    let anyErrors = false;
    let errorsText = '';
    if (userId === undefined) {
        anyErrors = true;
        errorsText = 'Invalid request parameters, must include userId';
        console.log('Missing a field');
    } 

    if (anyErrors) {
        console.log('There are errors', errorsText);
        const response = {
            statusCode: 400,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(errorsText)
        };

        callback(null, response);
    } else {
        console.log('No Errors');
        const favorites = await listAllFavorites(userId);

        const response = {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify('Success!')
        };

        callback(null, response);
    }
};

module.exports.add = async (event, context, callback) => {
    /** Immediate response for WarmUP plugin so things don't keep running */
    if (event.source === 'serverless-plugin-warmup') {
        console.log('WarmUP - Lambda is warm!')
        return callback(null, 'Lambda is warm!')
    }

    console.log('-- Event --', event);
    const jwtToken = event.headers.jwtheader;
    console.log('-- About to Check UserId for Token', jwtToken);
    const userId = await getUserId(jwtToken);
    const comicId = event.pathParameters.comicId;

    let anyErrors = false;
    let errorsText = '';
    if (userId === undefined) {
        anyErrors = true;
        errorsText = 'Invalid JWT, must include userId';
        console.log('Missing a field');
    } 

    if (anyErrors) {
        console.log('There are errors', errorsText);
        const response = {
            statusCode: 400,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(errorsText)
        };

        callback(null, response);
    } else {
        console.log('No Errors');

        addFavorite(userId, comicId);

        const response = {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify("Added Successfully")
        };

        callback(null, response);
    }
};

module.exports.remove = async (event, context, callback) => {
    /** Immediate response for WarmUP plugin so things don't keep running */
    if (event.source === 'serverless-plugin-warmup') {
        console.log('WarmUP - Lambda is warm!')
        return callback(null, 'Lambda is warm!')
    }

    const jwtToken = event.headers.jwtheader;
    const userId = await getUserId(jwtToken);
    const comicId = event.pathParameters.comicId;

    let anyErrors = false;
    let errorsText = '';
    if (userId === undefined) {
        anyErrors = true;
        errorsText = 'Invalid JWT, must include userId';
        console.log('Missing a field');
    } 

    if (anyErrors) {
        console.log('There are errors', errorsText);
        const response = {
            statusCode: 400,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(errorsText)
        };

        callback(null, response);
    } else {
        console.log('No Errors');

        removeFavorite(userId, comicId);

        const response = {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify("Added Successfully")
        };

        callback(null, response);
    }
};
