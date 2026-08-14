/**
 * Guards the bug this auth rewrite existed to fix.
 *
 * The old getUserId() called jwt.decode(), which only base64-decodes. Anyone could hand the API a
 * self-made token claiming an admin's `sub` and every endpoint believed it. These cases use the REAL
 * verifier against the live pool's JWKS -- no stubbing -- so a regression here is a genuine hole.
 *
 * Run: npm run check:auth
 * Needs outbound internet for the JWKS fetch, though most cases fail before reaching it.
 */
'use strict';

process.env.USER_POOL_ID = process.env.USER_POOL_ID || 'us-east-1_Biu0dPvx6';
process.env.USER_POOL_CLIENT_ID = process.env.USER_POOL_CLIENT_ID || '7u3h401u9ett3ers014i7j62pk';

const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const authenticate = require('../app/utils/authenticate/authenticate');

// Connor's sub -- the account the old code granted full admin to on an unsigned token.
const ADMIN_SUB = '17432f6a-5442-480c-97a1-896172a0821f';
const ISS = 'https://cognito-idp.us-east-1.amazonaws.com/us-east-1_Biu0dPvx6';

const adminClaims = { sub: ADMIN_SUB, username: 'connortyrrell', token_use: 'access', client_id: process.env.USER_POOL_CLIENT_ID, iss: ISS, 'cognito:groups': ['admin'] };

const hs256 = jwt.sign(adminClaims, 'attacker-picked-this-secret', { expiresIn: '1h' });
const hs256WithKid = jwt.sign(adminClaims, 'attacker-picked-this-secret', { expiresIn: '1h', keyid: 'somekid' });
const algNone = `${Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url')}.${Buffer.from(JSON.stringify(adminClaims)).toString('base64url')}.`;

// Correctly signed, but with a key that isn't in the pool's JWKS.
const { privateKey } = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });
const rs256WrongKey = jwt.sign(adminClaims, privateKey.export({ type: 'pkcs8', format: 'pem' }), { algorithm: 'RS256', keyid: 'somekid', expiresIn: '1h' });

const expired = jwt.sign({ ...adminClaims, exp: Math.floor(Date.now() / 1000) - 3600 }, 'secret', { keyid: 'somekid' });

const CASES = [
  ['no headers at all', {}],
  ['no token, other headers only', { headers: { 'Content-Type': 'application/json' } }],
  ['empty Authorization', { headers: { Authorization: '' } }],
  ['empty jwtheader', { headers: { jwtheader: '' } }],
  ['Authorization missing Bearer prefix', { headers: { Authorization: hs256 } }],
  ['not a JWT at all', { headers: { Authorization: 'Bearer nonsense' } }],
  ['forged HS256 claiming admin', { headers: { Authorization: `Bearer ${hs256}` } }],
  ['forged HS256 with a kid', { headers: { Authorization: `Bearer ${hs256WithKid}` } }],
  ['alg:none claiming admin', { headers: { Authorization: `Bearer ${algNone}` } }],
  ['RS256 signed with a foreign key', { headers: { Authorization: `Bearer ${rs256WrongKey}` } }],
  ['expired token', { headers: { Authorization: `Bearer ${expired}` } }],
  ['forgery via legacy jwtheader', { headers: { jwtheader: hs256 } }],
  ['forgery via lowercase authorization', { headers: { authorization: `Bearer ${hs256}` } }],
];

(async () => {
  let failures = 0;
  for (const [name, event] of CASES) {
    const result = await authenticate(event);
    // 503 would mean we couldn't reach the JWKS -- not a pass, but not a security failure either.
    const verdict = result.authorized ? 'ACCEPTED' : result.response.statusCode;
    const ok = verdict === 401;
    if (result.authorized) {
      failures += 1;
    } else if (!ok) {
      console.log(`  warn ${name.padEnd(40)} got ${verdict} (JWKS unreachable? not a security failure)`);
      continue;
    }
    console.log(`  ${ok ? 'ok  ' : 'FAIL'} ${name.padEnd(40)} ${verdict}`);
  }
  console.log(failures === 0
    ? '\nPASS: no forged or missing token is accepted'
    : `\nFAIL: ${failures} forged token(s) ACCEPTED -- this is the original vulnerability`);
  process.exit(failures === 0 ? 0 : 1);
})();
