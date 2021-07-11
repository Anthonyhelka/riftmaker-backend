const express = require('express');
const path = require('path');
const axios = require('axios');

const { getAllSummoners } = require('./models/summoner');
const { createSpectatorFile, deleteSpectatorFile } = require('./utils/spectatorFile');

const app = express();

// CORS Middleware
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-RequestedWith, Content-Type, Accept');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
  next();
});

app.use('/api/ping', async (req, res, next) => {
  console.log('/api/ping');
  res.status(200).send('pong');
});

app.use('/api/summoner/:name', async (req, res, next) => {
  console.log(`/api/summoner/${req.params.name}`);
  try {
    const summonerUrl = `https://na1.api.riotgames.com/lol/summoner/v4/summoners/by-name/${req.params.name}?api_key=${process.env.RIOT_DEV_KEY}`;
    const summoner = await axios.get(summonerUrl);
    const rankUrl = `https://na1.api.riotgames.com/lol/league/v4/entries/by-summoner/${summoner.data.id}?api_key=${process.env.RIOT_DEV_KEY}`;
    const response = await axios.get(rankUrl);
    res.status(200).send(response.data[0]);
  } catch (error) {
    res.status(404).send(error);
  }
});

app.use('/api/summoners', async (req, res, next) => {
  // Get from DB
  console.log(`/api/summoners`);
  try {
    const summoners = await getAllSummoners();
    res.status(200).send(summoners);
  } catch (error) {
    res.status(404).send(error);
  }
});

app.use('/api/activeGame/:id', async (req, res, next) => {
  console.log(`/api/activeGame/${req.params.id}`);
  try {
    const url = `https://na1.api.riotgames.com/lol/spectator/v4/active-games/by-summoner/${req.params.id}?api_key=${process.env.RIOT_DEV_KEY}`;
    const response = await axios.get(url);
    res.status(200).send({ activeGame: true, data: response.data });
  } catch (error) {
    res.status(200).send({ activeGame: false, data: null });
  }
});

app.use('/api/spectate/:gameId/:observerKey', async (req, res, next) => {
  const observerKey = req.params.observerKey.replace('ForwardSlash', '/');
  console.log(`/api/spectate/${req.params.gameId}/${observerKey}`);
  try {
    await createSpectatorFile(req.params.gameId, observerKey);
    res.setHeader('Content-disposition', `attachment; filename=riftmaker-spectate-${req.params.gameId}.bat`)
    res.status(200).sendFile(`riftmaker-spectate-${req.params.gameId}.bat`, { root: path.join(__dirname, './public') }, async () => {
      await deleteSpectatorFile(req.params.gameId);
    });
  } catch (error) {
    console.log(error)
    res.status(200).send(error);
  }
});

module.exports = app;