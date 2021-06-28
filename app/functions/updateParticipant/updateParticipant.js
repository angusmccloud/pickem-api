'use strict';
const leagueInfo = require('../../data/leagues/leagues');
const dynamoCreateItem = require('../../utils/dynamoCreateItem');
const dynamoUpdateItem = require('../../utils/dynamoUpdateItem');
const dynamoFetchSingleItem = require('../../utils/dynamoFetchSingleItem');

const updateParticipant = async (userId, leagueId, playingSeason, playingPlayoffs, paid) => {
  const timestamp = new Date().getTime(); 
  const leagues = await leagueInfo().allLeagues;
  const matchingLeague = leagues.filter(league => league.leagueId === leagueId);
  if(matchingLeague.length === 1) {
    const existingParticipant = await dynamoFetchSingleItem(process.env.PARTICIPANTS_TABLE, 'participantId', `${leagueId}-${userId}`);
    if(existingParticipant !== undefined) {
      const updatedValues = [
        {
          fieldName: 'playingSeason',
          value: playingSeason
        },
        {
          fieldName: 'playingPlayoffs',
          value: playingPlayoffs
        },
        {
          fieldName: 'paid',
          value: paid
        }
      ];
    
      const result = await dynamoUpdateItem(process.env.PARTICIPANTS_TABLE, 'participantId', `${leagueId}-${userId}`, updatedValues);
      return result;
    }
    const participantObj = {
      participantId: `${leagueId}-${userId}`,
      userId: userId,
      leagueId: leagueId,
      playingSeason: playingSeason,
      playingPlayoffs: playingPlayoffs,
      paid: paid,
      createdTime: timestamp,
      updatedTime: timestamp,
    };
  
    const created = dynamoCreateItem(
      process.env.PARTICIPANTS_TABLE, 
      'participantId', 
      participantObj
    );
  
    return created;
  }
  return 'Invalid League ID';
};

module.exports = updateParticipant;
