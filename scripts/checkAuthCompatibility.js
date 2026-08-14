/**
 * Compatibility check: can the CURRENTLY DEPLOYED frontend and the NEW frontend both talk to the
 * new API?
 *
 * The two differ only in how they present the token:
 *   deployed  ->  jwtheader: <token>
 *   new       ->  Authorization: Bearer <token>  +  jwtheader: <token>
 *
 * We stub ONLY the signature check (that's aws-jwt-verify's own job and needs a real Cognito key).
 * Everything else runs for real: header extraction, claim reading, group resolution, the legacy
 * sub-ID fallback, and the handlers' own authorization. That means this exercises the accept path,
 * which the forgery tests can't.
 */
'use strict';

process.env.USER_POOL_ID = 'us-east-1_Biu0dPvx6';
process.env.USER_POOL_CLIENT_ID = '7u3h401u9ett3ers014i7j62pk';
process.env.PARTICIPANTS_TABLE = 'pickem-prod-participants';

const CONNOR = '17432f6a-5442-480c-97a1-896172a0821f';
const GREG = 'c22a77cd-afa2-4559-8469-79af4c01fe84';
const PLAYER = '2ce7edd7-87aa-4638-9d9b-c9a4e77d5b84';

// Shape of a real Cognito access token payload for this pool.
const claimsFor = (sub, username, groups) => {
  const payload = {
    sub,
    iss: 'https://cognito-idp.us-east-1.amazonaws.com/us-east-1_Biu0dPvx6',
    client_id: '7u3h401u9ett3ers014i7j62pk',
    token_use: 'access',
    scope: 'aws.cognito.signin.user.admin',
    username,
  };
  // Omitted entirely for tokens minted before the groups existed.
  if (groups !== undefined) {
    payload['cognito:groups'] = groups;
  }
  return payload;
};

const TOKENS = {
  player: claimsFor(PLAYER, 'someplayer', []),
  gameAdmin: claimsFor(GREG, 'gregwappett', ['gameAdmin']),
  admin: claimsFor(CONNOR, 'connortyrrell', ['admin']),
  // No cognito:groups claim at all. The legacy sub-ID fallback used to grant these admin anyway;
  // now that it's gone they must resolve to no privileges, even for subs that were hardcoded before.
  // This is what makes a Cognito group change actually take effect.
  adminSubNoGroups: claimsFor(CONNOR, 'connortyrrell', undefined),
  gameAdminSubNoGroups: claimsFor(GREG, 'gregwappett', undefined),
};

// Patch the verifier before authenticate.js loads and captures it.
const awsJwtVerify = require('aws-jwt-verify');
let tokensSeen = [];
awsJwtVerify.CognitoJwtVerifier.create = () => ({
  hydrate: async () => {},
  verify: async (token) => {
    tokensSeen.push(token);
    if (Object.prototype.hasOwnProperty.call(TOKENS, token)) {
      return TOKENS[token];
    }
    throw new Error('signature mismatch');
  },
});

const authenticate = require('../app/utils/authenticate/authenticate');
const picks = require('../app/public/picks');

// The exact header objects each frontend produces, plus case variants in case API Gateway or a
// proxy ever normalises them differently than it does today.
const FRONTENDS = {
  'deployed (jwtheader only)': (t) => ({ 'Content-Type': 'application/json', jwtheader: t }),
  'deployed, Jwtheader cased': (t) => ({ 'Content-Type': 'application/json', Jwtheader: t }),
  'deployed, JWTHEADER upper': (t) => ({ 'Content-Type': 'application/json', JWTHEADER: t }),
  'new (Bearer + jwtheader)': (t) => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${t}`, jwtheader: t }),
  'new, lowercase authz': (t) => ({ 'Content-Type': 'application/json', authorization: `Bearer ${t}`, jwtheader: t }),
  'new, bearer lowercase': (t) => ({ 'Content-Type': 'application/json', Authorization: `bearer ${t}`, jwtheader: t }),
  'future (Bearer only)': (t) => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${t}` }),
};

const ROLES = {
  player: { admin: false, gameAdmin: false },
  gameAdmin: { admin: false, gameAdmin: true },
  admin: { admin: true, gameAdmin: true },
  adminSubNoGroups: { admin: false, gameAdmin: false },
  gameAdminSubNoGroups: { admin: false, gameAdmin: false },
};

const invoke = (handler, event) => new Promise((resolve) => handler(event, {}, (_e, r) => resolve(r)));

let failures = 0;
const check = (label, actual, expected) => {
  const ok = actual === expected;
  if (!ok) failures += 1;
  console.log(`  ${ok ? 'ok  ' : 'FAIL'} ${label.padEnd(46)} ${ok ? String(actual) : `expected ${expected}, got ${actual}`}`);
};

(async () => {
  console.log('=== authenticate(): every frontend x every role ===');
  for (const [frontendName, buildHeaders] of Object.entries(FRONTENDS)) {
    console.log(`\n-- ${frontendName}`);
    for (const [role, expected] of Object.entries(ROLES)) {
      const auth = await authenticate({ headers: buildHeaders(role) });
      if (!auth.authorized) {
        failures += 1;
        console.log(`  FAIL ${role.padEnd(46)} rejected with ${auth.response.statusCode}`);
        continue;
      }
      const got = `admin=${auth.user.admin} gameAdmin=${auth.user.gameAdmin}`;
      check(role, got, `admin=${expected.admin} gameAdmin=${expected.gameAdmin}`);
    }
  }

  console.log('\n=== real handlers, using the DEPLOYED frontend header shape ===');
  const oldHeaders = FRONTENDS['deployed (jwtheader only)'];
  // Status code tells us extraction + role resolution both worked: a failed extraction would be
  // 401, so 403 and 400 each prove the token was read and the role applied.
  const handlerCases = [
    ['player  -> admin-only GET is forbidden', 'player', picks.getPicksByWeekForPlayer, { pathParameters: { userId: PLAYER, weekNumber: '1' } }, 403],
    ['gameAdmin -> admin-only GET forbidden', 'gameAdmin', picks.getPicksByWeekForPlayer, { pathParameters: { userId: PLAYER, weekNumber: '1' } }, 403],
    ['admin   -> reaches week validation', 'admin', picks.getPicksByWeekForPlayer, { pathParameters: { userId: PLAYER, weekNumber: 'zz' } }, 400],
    ['admin sub, no groups -> forbidden', 'adminSubNoGroups', picks.getPicksByWeekForPlayer, { pathParameters: { userId: PLAYER, weekNumber: '1' } }, 403],
    ['player  -> admin-only PUT is forbidden', 'player', picks.updatePickForPlayer, { pathParameters: { userId: PLAYER }, body: '{}' }, 403],
    ['admin   -> reaches body validation', 'admin', picks.updatePickForPlayer, { pathParameters: { userId: PLAYER }, body: '{}' }, 400],
    ['player  -> own-pick PUT reaches validation', 'player', picks.updatePick, { body: '{}' }, 400],
  ];
  for (const [label, role, handler, event, expected] of handlerCases) {
    const res = await invoke(handler, { ...event, headers: oldHeaders(role) });
    check(label, res.statusCode, expected);
  }

  console.log('\n=== the new frontend must reach the same verdicts ===');
  const newHeaders = FRONTENDS['new (Bearer + jwtheader)'];
  for (const [label, role, handler, event, expected] of handlerCases) {
    const res = await invoke(handler, { ...event, headers: newHeaders(role) });
    check(label, res.statusCode, expected);
  }

  console.log('\n=== both frontends must hand the verifier an identical token ===');
  tokensSeen = [];
  await authenticate({ headers: oldHeaders('admin') });
  await authenticate({ headers: newHeaders('admin') });
  check('same token extracted from both', tokensSeen[0] === tokensSeen[1] && tokensSeen.length === 2, true);

  console.log(failures === 0
    ? '\nPASS: deployed and new frontends both work against the new API'
    : `\nFAIL: ${failures} case(s) broken`);
  process.exit(failures === 0 ? 0 : 1);
})();
