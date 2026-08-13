'use strict';

// The frontend's formatTime util relies on the browser's local timezone, which is wrong in a
// Lambda (those run in UTC). Everything here is explicit about the zone instead.
const TIME_ZONE = process.env.REMINDER_TIMEZONE || 'America/New_York';

const pad = (number) => (number < 10 ? `0${number}` : `${number}`);

// Pull out the zone-local calendar/clock parts for a timestamp.
// hourCycle h23 rather than hour12:false, because the latter reports midnight as hour 24.
const zonedParts = (timestamp) => {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    weekday: 'short',
    hourCycle: 'h23',
  }).formatToParts(new Date(timestamp));

  const result = {};
  parts.forEach(part => {
    if(part.type !== 'literal') {
      result[part.type] = part.value;
    }
  });

  return {
    year: parseInt(result.year, 10),
    month: parseInt(result.month, 10),
    day: parseInt(result.day, 10),
    hour: parseInt(result.hour, 10),
    minute: parseInt(result.minute, 10),
    weekday: result.weekday,
  };
};

// 'YYYY-MM-DD' in the target zone. Comparing these strings is how we decide whether a game
// falls on "today" or "tomorrow" -- doing it with day keys rather than timestamp boundaries
// keeps it correct across the November DST change.
const zonedDayKey = (timestamp) => {
  const { year, month, day } = zonedParts(timestamp);
  return `${year}-${pad(month)}-${pad(day)}`;
};

// Calendar arithmetic on a day key. Pure date math via Date.UTC, so no timezone is involved
// and month/year rollover is handled for us.
const addDaysToDayKey = (dayKey, days) => {
  const [year, month, day] = dayKey.split('-').map(Number);
  const shifted = new Date(Date.UTC(year, month - 1, day + days));
  return `${shifted.getUTCFullYear()}-${pad(shifted.getUTCMonth() + 1)}-${pad(shifted.getUTCDate())}`;
};

// The hour (0-23) in the target zone. Used to gate the reminder job so it only actually runs
// at 10am local, no matter which of the two UTC crons woke it up.
const zonedHour = (timestamp) => zonedParts(timestamp).hour;

// '1pm' / '8:15pm' -- minutes are dropped when they're zero, matching the format Connor asked for.
const formatKickoffTime = (timestamp) => {
  const { hour, minute } = zonedParts(timestamp);
  const meridiem = hour < 12 ? 'am' : 'pm';
  let displayHour = hour % 12;
  if(displayHour === 0) {
    displayHour = 12;
  }
  return minute === 0
    ? `${displayHour}${meridiem}`
    : `${displayHour}:${pad(minute)}${meridiem}`;
};

module.exports = {
  TIME_ZONE,
  zonedParts,
  zonedDayKey,
  addDaysToDayKey,
  zonedHour,
  formatKickoffTime,
};
