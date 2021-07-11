const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const summonerSchema = new Schema({
  summonerId: { type: String, required: true },
  leagueId: { type: String, required: true },
  summonerName: { type: String, required: true },
  tier: { type: String, required: true },
  rank: { type: String, required: true },
  leaguePoints: { type: Number, required: true },
  wins: { type: Number, required: true },
  losses: { type: Number, required: true },
  freshBlood: { type: Boolean, required: true },
  hotStreak: { type: Boolean, required: true },
  activeGame: { type: Object, required: true }
});

const Summoner = mongoose.model('Summoner', summonerSchema);

const findSummoner = async (summonerId) => {
  const summoner = await Summoner.find({ summonerId });
  return Promise.resolve(summoner);
}

const createSummoner = async (summoner, activeGame) => {
  const createdSummoner = new Summoner({ 
    summonerId: summoner.summonerId,
    leagueId: summoner.leagueId,
    summonerName: summoner.summonerName,
    tier: summoner.tier,
    rank: summoner.rank,
    leaguePoints: summoner.leaguePoints,
    wins: summoner.wins,
    losses: summoner.losses, 
    freshBlood: summoner.freshBlood, 
    hotStreak: summoner.hotStreak ,
    activeGame: activeGame 
  });

  const result = await createdSummoner.save();
  return Promise.resolve(result);
}

const updateSummoner = async (summoner, activeGame) => {
  const updatedSummoner = await Summoner.findOneAndUpdate({ summonerId: summoner.summonerId }, {
    summonerName: summoner.summonerName,
    tier: summoner.tier,
    rank: summoner.rank,
    leaguePoints: summoner.leaguePoints,
    wins: summoner.wins,
    losses: summoner.losses, 
    freshBlood: summoner.freshBlood, 
    hotStreak: summoner.hotStreak ,
    activeGame: activeGame 
  });

  const result = await updatedSummoner.save();
  return Promise.resolve(result);
}

const getAllSummoners = async () => {
  const result = await Summoner.find({});
  return Promise.resolve(result);
}

const deleteSummoners = async () => {
  await Summoner.deleteMany({});
  return Promise.resolve();
}

module.exports = {
  findSummoner,
  createSummoner,
  updateSummoner,
  getAllSummoners,
  deleteSummoners
};
