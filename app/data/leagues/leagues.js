//// Not how this SHOULD be stored, but hardcoding to get this working year-1...
const leagueInfo = () => {
  const leagues = [
    {
      leagueId: 1,
      seasonName: '2021',
      defaultLeague: true,
      leagueType: 'standard'
    },
    {
      leagueId: 2,
      seasonName: '2020',
      defaultLeague: false,
      leagueType: 'standard'
    }
];

  const defaultLeague = leagues.filter(league => league.defaultLeague);

  return {
    allLeagues: leagues,
    defaultLeague: defaultLeague
  };
};

module.exports = leagueInfo;