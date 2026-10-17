'use strict';

const findDuplicatePicks = require('../functions/findDuplicatePicks/findDuplicatePicks');

// Runs daily against the default league. A manual invoke can pass { "leagueId": 5 } to clean up an
// older season instead.
module.exports.removeDuplicatePicks = async (event = {}) => {
  if(event.source === 'serverless-plugin-warmup') {
    return 'Warmed';
  }

  const result = await findDuplicatePicks(event.leagueId);
  if(Array.isArray(result)) {
    console.log(`-- Duplicate pick run complete -- ${result.length} game/user combinations had duplicates`, JSON.stringify(result));
  } else {
    console.log('-- Duplicate pick run did not complete --', result);
  }
  return result;
};
