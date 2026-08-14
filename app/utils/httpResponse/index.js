'use strict';

// Every handler was building this same object by hand, which is why auth failures used to come back
// as 400s. Centralising it means "not signed in" and "signed in but not allowed" get the status
// codes a client can actually branch on.
const HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Credentials': true,
};

const respond = (statusCode, body) => ({
  statusCode,
  headers: HEADERS,
  body: JSON.stringify(body),
});

const ok = (payload = {}) => respond(200, { success: true, ...payload });
const badRequest = (message) => respond(400, { success: false, message });
const unauthorized = (message = 'Invalid or missing access token') => respond(401, { success: false, message });
const forbidden = (message = 'You do not have permission to do that') => respond(403, { success: false, message });
const notFound = (message) => respond(404, { success: false, message });
// For "we couldn't check your token right now", which is not the same as "your token is bad".
// A 401 tells the client to sign in again; a 503 tells it to try again.
const serviceUnavailable = (message) => respond(503, { success: false, message });

module.exports = { ok, badRequest, unauthorized, forbidden, notFound, serviceUnavailable };
