'use strict';

const sendPickReminders = require('../functions/sendPickReminders/sendPickReminders');
const { zonedHour, TIME_ZONE } = require('../utils/easternTime/easternTime');

const TARGET_HOUR = 10;

// Scheduled twice a day in UTC (14:00 and 15:00) so that one of the two invokes always lands on
// 10am in TIME_ZONE regardless of Daylight Saving. The other one exits here without doing work.
module.exports.sendPickReminders = async (event = {}) => {
  // serverless-plugin-warmup pings every function every 5 minutes. Without this, any ping landing
  // in the 10am hour would pass the guard below and fire a full real send -- a dozen duplicate
  // blasts a day. Must stay ahead of every other check.
  if(event.source === 'serverless-plugin-warmup') {
    return 'Warmed';
  }

  const timestamp = new Date().getTime();
  const localHour = zonedHour(timestamp);

  if(localHour !== TARGET_HOUR && !event.force) {
    console.log(`Skipping -- it's ${localHour}:00 in ${TIME_ZONE}, reminders only run at ${TARGET_HOUR}:00`);
    return { skipped: true, localHour, timeZone: TIME_ZONE };
  }

  // Manual-invoke knobs. { "dryRun": true } previews without sending; asOf and onlyUserId let a
  // real send be tested out of season against one person. The daily schedule passes none of these.
  const dryRun = event.dryRun === true;
  const options = {};
  if(event.asOf) {
    options.asOf = event.asOf;
  }
  if(event.onlyUserId) {
    options.onlyUserId = event.onlyUserId;
  }

  const result = await sendPickReminders(dryRun, options);
  console.log('-- Reminder run complete --', JSON.stringify(result));
  return result;
};
