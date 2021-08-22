const teamsInfo = () => {
  const teams = [
    { teamId: 1, cityName: 'Buffalo', divisionName: 'AFC East', teamName: 'Bills', imageUrl: 'https://pickem-teamlogos.s3.amazonaws.com/bills.png' },
    { teamId: 2, cityName: 'Miami', divisionName: 'AFC East', teamName: 'Dolphins', imageUrl: 'https://pickem-teamlogos.s3.amazonaws.com/dolphins.png' },
    { teamId: 3, cityName: 'New England', divisionName: 'AFC East', teamName: 'Patriots', imageUrl: 'https://pickem-teamlogos.s3.amazonaws.com/patriots.png' },
    { teamId: 4, cityName: 'New York', divisionName: 'AFC East', teamName: 'Jets', imageUrl: 'https://pickem-teamlogos.s3.amazonaws.com/jets.png' },
    { teamId: 5, cityName: 'Baltimore', divisionName: 'AFC North', teamName: 'Ravens', imageUrl: 'https://pickem-teamlogos.s3.amazonaws.com/ravens.png' },
    { teamId: 6, cityName: 'Cincinnati', divisionName: 'AFC North', teamName: 'Bengals', imageUrl: 'https://pickem-teamlogos.s3.amazonaws.com/bengals.png' },
    { teamId: 7, cityName: 'Cleveland', divisionName: 'AFC North', teamName: 'Browns', imageUrl: 'https://pickem-teamlogos.s3.amazonaws.com/browns.png' },
    { teamId: 8, cityName: 'Pittsburgh', divisionName: 'AFC North', teamName: 'Steelers', imageUrl: 'https://pickem-teamlogos.s3.amazonaws.com/steelers.png' },
    { teamId: 9, cityName: 'Indianapolis', divisionName: 'AFC South', teamName: 'Colts', imageUrl: 'https://pickem-teamlogos.s3.amazonaws.com/colts.png' },
    { teamId: 10, cityName: 'Houston', divisionName: 'AFC South', teamName: 'Texans', imageUrl: 'https://pickem-teamlogos.s3.amazonaws.com/texans.png' },
    { teamId: 11, cityName: 'Jacksonville', divisionName: 'AFC South', teamName: 'Jaguars', imageUrl: 'https://pickem-teamlogos.s3.amazonaws.com/jaguars.png' },
    { teamId: 12, cityName: 'Tennessee', divisionName: 'AFC South', teamName: 'Titans', imageUrl: 'https://pickem-teamlogos.s3.amazonaws.com/titans.png' },
    { teamId: 13, cityName: 'Denver', divisionName: 'AFC West', teamName: 'Broncos', imageUrl: 'https://pickem-teamlogos.s3.amazonaws.com/broncos.png' },
    { teamId: 14, cityName: 'Kansas City', divisionName: 'AFC West', teamName: 'Chiefs', imageUrl: 'https://pickem-teamlogos.s3.amazonaws.com/chiefs.png' },
    { teamId: 15, cityName: 'Las Vegas', divisionName: 'AFC West', teamName: 'Raiders', imageUrl: 'https://pickem-teamlogos.s3.amazonaws.com/raiders.png' },
    { teamId: 16, cityName: 'Los Angeles', divisionName: 'AFC West', teamName: 'Chargers', imageUrl: 'https://pickem-teamlogos.s3.amazonaws.com/chargers.png' },
    { teamId: 17, cityName: 'Dallas', divisionName: 'NFC East', teamName: 'Cowboys', imageUrl: 'https://pickem-teamlogos.s3.amazonaws.com/cowboys.png' },
    { teamId: 18, cityName: 'New York', divisionName: 'NFC East', teamName: 'Giants', imageUrl: 'https://pickem-teamlogos.s3.amazonaws.com/giants.png' },
    { teamId: 19, cityName: 'Philadelphia', divisionName: 'NFC East', teamName: 'Eagles', imageUrl: 'https://pickem-teamlogos.s3.amazonaws.com/eagles.png' },
    { teamId: 20, cityName: 'Washington', divisionName: 'NFC East', teamName: 'Football Team', imageUrl: 'https://pickem-teamlogos.s3.amazonaws.com/wft.png' },
    { teamId: 21, cityName: 'Chicago', divisionName: 'NFC North', teamName: 'Bears', imageUrl: 'https://pickem-teamlogos.s3.amazonaws.com/bears.png' },
    { teamId: 22, cityName: 'Detroit', divisionName: 'NFC North', teamName: 'Lions', imageUrl: 'https://pickem-teamlogos.s3.amazonaws.com/lions.png' },
    { teamId: 23, cityName: 'Green Bay', divisionName: 'NFC North', teamName: 'Packers', imageUrl: 'https://pickem-teamlogos.s3.amazonaws.com/packers.png' },
    { teamId: 24, cityName: 'Minnesota', divisionName: 'NFC North', teamName: 'Vikings', imageUrl: 'https://pickem-teamlogos.s3.amazonaws.com/vikings.png' },
    { teamId: 25, cityName: 'Tampa Bay', divisionName: 'NFC South', teamName: 'Buccaneers', imageUrl: 'https://pickem-teamlogos.s3.amazonaws.com/buccaneers.png' },
    { teamId: 26, cityName: 'Atlanta', divisionName: 'NFC South', teamName: 'Falcons', imageUrl: 'https://pickem-teamlogos.s3.amazonaws.com/falcons.png' },
    { teamId: 27, cityName: 'Carolina', divisionName: 'NFC South', teamName: 'Panthers', imageUrl: 'https://pickem-teamlogos.s3.amazonaws.com/panthers.png' },
    { teamId: 28, cityName: 'New Orleans', divisionName: 'NFC South', teamName: 'Saints', imageUrl: 'https://pickem-teamlogos.s3.amazonaws.com/saints.png' },
    { teamId: 29, cityName: 'Arizona', divisionName: 'NFC West', teamName: 'Cardinals', imageUrl: 'https://pickem-teamlogos.s3.amazonaws.com/cardinals.png' },
    { teamId: 30, cityName: 'San Francisco', divisionName: 'NFC West', teamName: '49ers', imageUrl: 'https://pickem-teamlogos.s3.amazonaws.com/49ers.png' },
    { teamId: 31, cityName: 'Seattle', divisionName: 'NFC West', teamName: 'Seahawks', imageUrl: 'https://pickem-teamlogos.s3.amazonaws.com/seahawks.png' },
    { teamId: 32, cityName: 'Los Angeles', divisionName: 'NFC West', teamName: 'Rams', imageUrl: 'https://pickem-teamlogos.s3.amazonaws.com/rams.png' },
  ];

  return teams;
};

module.exports = teamsInfo;