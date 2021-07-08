const express = require('express');
const path = require('path');
const axios = require('axios');
const { createSpectatorFile, deleteSpectatorFile } = require('./utils/spectatorFile');

const app = express();

const apiKey = 'RGAPI-35fab531-09e1-4595-8c64-e0febd1bb93e';

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
    const summonerUrl = `https://na1.api.riotgames.com/lol/summoner/v4/summoners/by-name/${req.params.name}?api_key=${apiKey}`;
    const summoner = await axios.get(summonerUrl);
    const rankUrl = `https://na1.api.riotgames.com/lol/league/v4/entries/by-summoner/${summoner.data.id}?api_key=${apiKey}`;
    const response = await axios.get(rankUrl);
    res.status(200).send(response.data[0]);
  } catch (error) {
    res.status(404).send(error);
  }
});

app.use('/api/summoners', async (req, res, next) => {
  console.log(`/api/summoners`);
  try {
    const firstPageUrl = `https://na1.api.riotgames.com/lol/league-exp/v4/entries/RANKED_SOLO_5x5/CHALLENGER/I?page=1&api_key=${apiKey}`;
    const firstResponse = await axios.get(firstPageUrl);
    let summoners = firstResponse.data;
    const secondPageUrl = `https://na1.api.riotgames.com/lol/league-exp/v4/entries/RANKED_SOLO_5x5/CHALLENGER/I?page=2&api_key=${apiKey}`;
    const secondResponse = await axios.get(secondPageUrl);
    summoners = summoners.concat(secondResponse.data);
    res.status(200).send(summoners);
  } catch (error) {
    res.status(404).send(error);
  }
});

app.use('/api/activeGame/:id', async (req, res, next) => {
  console.log(`/api/activeGame/${req.params.id}`);
  try {
    const url = `https://na1.api.riotgames.com/lol/spectator/v4/active-games/by-summoner/${req.params.id}?api_key=${apiKey}`;
    const response = await axios.get(url);
    res.status(200).send({ activeGame: true, data: response.data });
  } catch (error) {
    res.status(200).send({ activeGame: false, data: null });
  }
});

app.use('/api/spectate/:gameId/:observerKey([^/]+/[^/]+)', async (req, res, next) => {
  console.log(`/api/spectate/${req.params.gameId}/${req.params.observerKey}`);
  try {
    await createSpectatorFile(req.params.gameId, req.params.observerKey);
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