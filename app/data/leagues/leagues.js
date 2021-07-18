//// Not how this SHOULD be stored, but hardcoding to get this working year-1...
const leagueInfo = () => {
  const leagues = [
    {
      leagueId: 1,
      seasonName: '2021',
      defaultLeague: true,
      leagueType: 'standard',
      payoutStructure: {
        finalized: false,
        weeklyPayout: 25,
      },
    },
    {
      leagueId: 2,
      seasonName: '2020',
      defaultLeague: false,
      leagueType: 'standard',
      payoutStructure: {
        finalized: true,
        weeklyPayout: 25,
        regularSeason: [
          {
            rank: '1',
            payout: 250
          },
          {
            rank: '2',
            payout: 200
          },
          {
            rank: '3',
            payout: 150
          },
          {
            rank: '4-6',
            payout: 50
          }
        ],
        playoffs: [
          {
            rank: '1',
            payout: 250
          },
          {
            rank: '2',
            payout: 200
          },
          {
            rank: '3',
            payout: 150
          },
          {
            rank: '4',
            payout: 100
          }
        ]
      },
    }
];

  const defaultLeague = leagues.find(league => league.defaultLeague);

  return {
    allLeagues: leagues,
    defaultLeague: defaultLeague
  };
};

module.exports = leagueInfo;