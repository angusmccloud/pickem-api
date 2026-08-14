'use strict';

const { CognitoJwtVerifier } = require('aws-jwt-verify');
const {
  FetchError,
  NonRetryableFetchError,
  JwksNotAvailableInCacheError,
  JwksValidationError,
  JwkValidationError,
} = require('aws-jwt-verify/error');
const { unauthorized, serviceUnavailable } = require('../httpResponse');

// This replaces getUserId(), which only base64-decoded the token. That meant anyone could hand us
// a self-made JWT claiming any `sub` -- including an admin's -- and every handler believed it.
// Here we verify the RS256 signature against the user pool's JWKS and check exp / iss / client_id /
// token_use before trusting a single claim.
//
// Built at module scope on purpose: the verifier caches the JWKS, so only the first invocation in a
// container pays the fetch. Nothing here talks to the network until the first verify() call, so a
// missing env var surfaces as a failed request rather than a broken cold start.
const verifier = CognitoJwtVerifier.create({
  userPoolId: process.env.USER_POOL_ID,
  tokenUse: 'access',
  clientId: process.env.USER_POOL_CLIENT_ID,
});

// Start fetching the JWKS as soon as the container boots rather than making the first real request
// wait for it. Fire-and-forget on purpose: verify() awaits the same in-flight fetch, and retries on
// its own if this failed, so the only thing to do here is stop an unhandled rejection escaping.
// The warmup pings keep containers alive, so in prod this usually happens well before a user calls.
verifier.hydrate().catch((error) => {
  console.log('-- JWKS pre-fetch failed, will retry on first verify --', error.message);
});

// Unlike the old jwt.decode(), verifying touches the network. These are the failures that mean
// "we couldn't check the token", not "the token is bad" -- a transient one would otherwise log out
// every user at once. Anything not on this list falls through to 401, so the default stays deny.
//
// Deliberately NOT here: WaitPeriodNotYetEndedJwkError. That fires when a token's `kid` isn't in the
// JWKS and the library is rate-limiting the re-fetch, so it means "bad token", not "outage".
// Classifying it as retryable answered forged-token traffic with "try again" instead of 401.
const INFRASTRUCTURE_ERRORS = [
  FetchError,
  NonRetryableFetchError,
  JwksNotAvailableInCacheError,
  JwksValidationError,
  JwkValidationError,
];

const isInfrastructureFailure = (error) => INFRASTRUCTURE_ERRORS.some((type) => error instanceof type);

const ADMIN_GROUP = 'admin';
const GAME_ADMIN_GROUP = 'gameAdmin';

// Roles come from `cognito:groups` and nothing else. There used to be a temporary fallback that also
// granted admin to three hardcoded subs, needed while tokens minted before the groups existed were
// still in circulation. It's gone now that the claim is confirmed present in live tokens -- and it had
// to go before role changes could be tested at all, since it would have kept granting admin to those
// subs no matter what their Cognito group membership said.

// API Gateway's REST integration passes header names through with whatever case the client sent,
// and HTTP header names are case-insensitive anyway. A true case-insensitive scan rather than
// guessing two spellings: getting this wrong would reject every request from the live site, which is
// the one failure mode here that takes down all users at once.
const readHeader = (headers, name) => {
  const wanted = name.toLowerCase();
  const match = Object.keys(headers).find((key) => key.toLowerCase() === wanted);
  return match === undefined ? undefined : headers[match];
};

const extractToken = (event) => {
  const headers = event.headers || {};

  const authorization = readHeader(headers, 'Authorization');
  if (authorization) {
    const bearer = /^Bearer\s+(.+)$/i.exec(authorization.trim());
    if (bearer) {
      return bearer[1].trim();
    }
  }

  // Legacy header. The frontend used to send the raw token as `jwtheader`, so we keep accepting it
  // to decouple the two deploys -- the API can go out before the site does.
  // TODO: drop this branch once the deployed frontend only sends `Authorization: Bearer`.
  return readHeader(headers, 'jwtHeader');
};

/**
 * Verifies the caller's Cognito access token and resolves their role.
 *
 * Returns `{ authorized: true, user }` on success, or `{ authorized: false, response }` carrying a
 * ready-made HTTP response. Handlers just pass `auth.response` straight back, which keeps the
 * 401-vs-503 decision here instead of duplicated across sixteen of them. Never throws.
 */
const authenticate = async (event) => {
  const token = extractToken(event);

  if (!token) {
    return { authorized: false, response: unauthorized('Missing access token') };
  }

  let payload;
  try {
    payload = await verifier.verify(token);
  } catch (error) {
    if (isInfrastructureFailure(error)) {
      console.error('-- Could not reach the JWKS to verify a token --', error.message);
      return {
        authorized: false,
        response: serviceUnavailable('Could not verify your session right now, please try again'),
      };
    }
    // Deliberately vague to the caller -- the reason (expired vs. bad signature vs. wrong pool) is
    // useful in CloudWatch but only helps an attacker if we return it.
    console.log('-- Token verification failed --', error.message);
    return { authorized: false, response: unauthorized('Invalid or expired access token') };
  }

  const groups = payload['cognito:groups'] || [];
  const admin = groups.includes(ADMIN_GROUP);

  return {
    authorized: true,
    user: {
      userId: payload.sub,
      username: payload.username,
      groups,
      admin,
      // An admin can do anything a game admin can.
      gameAdmin: admin || groups.includes(GAME_ADMIN_GROUP),
    },
  };
};

module.exports = authenticate;
