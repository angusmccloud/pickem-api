const { stubFalse } = require("lodash");

//// Not how this SHOULD be stored, but hardcoding to get this working year-1...
const leagueInfo = () => {
  const leagues = [
    {
      leagueId: 1,
      seasonName: '2021',
      defaultLeague: false,
      leagueType: 'standard',
      payoutStructure: {
        finalized: true,
        weeklyPayout: 25,
        regularSeason: [
          {
            rank: '1st',
            payout: 325
          },
          {
            rank: '2nd',
            payout: 150
          },
          {
            rank: '3rd',
            payout: 100
          },
          {
            rank: '4th',
            payout: 50
          }
        ],
        playoffs: [
          {
            rank: '1st',
            payout: 325
          },
          {
            rank: '2nd',
            payout: 150
          },
          {
            rank: '3rd',
            payout: 100
          },
          {
            rank: '4th',
            payout: 50
          }
        ]
      },
    },
    {
      leagueId: 2,
      seasonName: '2022',
      defaultLeague: false,
      leagueType: 'standard',
      payoutStructure: {
        finalized: true,
        weeklyPayout: 25,
        regularSeason: [
          {
            rank: '1st',
            payout: 300
          },
          {
            rank: '2nd',
            payout: 200
          },
          {
            rank: '3rd',
            payout: 125
          },
          {
            rank: '4th',
            payout: 75
          }
        ],
        playoffs: [
          {
            rank: '1st',
            payout: 350
          },
          {
            rank: '2nd',
            payout: 225
          },
          {
            rank: '3rd',
            payout: 125
          },
        ]
      },
    },
    {
      leagueId: 3,
      seasonName: '2023',
      defaultLeague: true,
      leagueType: 'standard',
      payoutStructure: {
        finalized: false,
        weeklyPayout: 25,
        regularSeason: [],
        playoffs: []
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