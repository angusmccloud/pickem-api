/**
 * Verifies a REAL Cognito access token end to end. This is the one thing the other two checks can't
 * do: they either use forged tokens or stub the signature step, because a genuine signature needs a
 * live Cognito key.
 *
 * The token stays on your machine. Nothing is printed except derived facts (groups, flags, expiry),
 * so the output is safe to share.
 *
 *   pbpaste | node scripts/checkRealToken.js        # nothing touches disk or shell history
 *   node scripts/checkRealToken.js token.txt        # or read from a file
 *   PICKEM_TOKEN=... node scripts/checkRealToken.js # or an env var
 *
 * To get a token: sign in at https://nflpickgames.com (no deploy needed -- the token comes from
 * Cognito, not from the API), then in DevTools:
 *   Application -> Local Storage -> CognitoIdentityServiceProvider.<clientId>.<username>.accessToken
 */
'use strict';

const fs = require('fs');

process.env.USER_POOL_ID = process.env.USER_POOL_ID || 'us-east-1_Biu0dPvx6';
process.env.USER_POOL_CLIENT_ID = process.env.USER_POOL_CLIENT_ID || '7u3h401u9ett3ers014i7j62pk';

const EXPECTED_ISS = `https://cognito-idp.us-east-1.amazonaws.com/${process.env.USER_POOL_ID}`;

// Read stdin as a stream rather than readFileSync(0): a pipe can be non-blocking, which makes the
// sync read fail with EAGAIN.
const readStdin = () => new Promise((resolve, reject) => {
  let data = '';
  process.stdin.setEncoding('utf8');
  process.stdin.on('data', (chunk) => { data += chunk; });
  process.stdin.on('end', () => resolve(data));
  process.stdin.on('error', reject);
});

const readToken = async () => {
  if (process.env.PICKEM_TOKEN) {
    return process.env.PICKEM_TOKEN.trim();
  }
  if (process.argv[2]) {
    return fs.readFileSync(process.argv[2], 'utf8').trim();
  }
  if (!process.stdin.isTTY) {
    return (await readStdin()).trim();
  }
  return '';
};

const line = (label, value) => console.log(`  ${String(label).padEnd(26)} ${value}`);

(async () => {
  // Strip an accidental "Bearer " prefix so pasting either form works.
  const token = (await readToken()).replace(/^Bearer\s+/i, '');
  if (!token) {
    console.error('No token supplied. Try:  pbpaste | node scripts/checkRealToken.js');
    process.exit(2);
  }

  const { CognitoJwtVerifier } = require('aws-jwt-verify');
  const authenticate = require('../app/utils/authenticate/authenticate');

  const verifier = CognitoJwtVerifier.create({
    userPoolId: process.env.USER_POOL_ID,
    tokenUse: 'access',
    clientId: process.env.USER_POOL_CLIENT_ID,
  });

  console.log('\n=== 1. cryptographic verification against the live JWKS ===');
  let payload;
  try {
    payload = await verifier.verify(token);
    line('signature', 'VALID');
  } catch (error) {
    line('signature', `REJECTED -- ${error.message}`);
    console.log('\nFAIL: a real token from this pool should verify. Check it was copied whole and');
    console.log('      that it is the accessToken (not the idToken), and that it has not expired.');
    process.exit(1);
  }

  console.log('\n=== 2. claims the API relies on ===');
  const groups = payload['cognito:groups'] || [];
  const secondsLeft = payload.exp - Math.floor(Date.now() / 1000);
  line('sub', payload.sub);
  line('username', payload.username);
  line('token_use', `${payload.token_use} ${payload.token_use === 'access' ? '(correct)' : '(WRONG -- want access)'}`);
  line('client_id', `${payload.client_id} ${payload.client_id === process.env.USER_POOL_CLIENT_ID ? '(matches)' : '(MISMATCH)'}`);
  line('iss', payload.iss === EXPECTED_ISS ? 'matches expected pool' : `UNEXPECTED: ${payload.iss}`);
  line('cognito:groups', groups.length ? groups.join(', ') : '(claim absent)');
  line('expires in', `${Math.floor(secondsLeft / 60)}m ${secondsLeft % 60}s`);

  console.log('\n=== 3. the app path: authenticate() on a real request ===');
  for (const [shape, headers] of [
    ['deployed frontend', { jwtheader: token }],
    ['new frontend', { Authorization: `Bearer ${token}`, jwtheader: token }],
  ]) {
    const auth = await authenticate({ headers });
    if (!auth.authorized) {
      line(shape, `REJECTED with ${auth.response.statusCode}`);
      process.exitCode = 1;
      continue;
    }
    line(shape, `admin=${auth.user.admin} gameAdmin=${auth.user.gameAdmin} groups=[${auth.user.groups.join(', ')}]`);
  }

  // Group membership is the only input now, so this token's groups are the whole story. If they don't
  // match what Cognito says, the token predates the change -- sign out and back in to mint a new one.
  console.log('\n=== 4. roles this token grants ===');
  const isAdmin = groups.includes('admin');
  line('admin', isAdmin);
  line('gameAdmin', isAdmin || groups.includes('gameAdmin'));
  if (groups.length === 0) {
    line('note', 'no groups claim -- this token grants no admin rights at all');
  }

  console.log(process.exitCode ? '\nFAIL: see above' : '\nPASS: real token verifies and resolves correctly through the app\n');
})();
