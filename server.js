const http = require('http');
const WebSocket = require('ws');
const mongoose = require('mongoose');
const axios = require('axios');
if (process.env.NODE_ENV !== 'production') { require('dotenv').config(); }

const app = require('./app');
const { findSummoner, createSummoner, updateSummoner, deleteSummoners } = require('./models/summoner');

const normalizePort = (value) => {
  const parsedValue = parseInt(value, 10);

  if (isNaN(parsedValue)) { return value; }
  if (parsedValue >= 0) { return parsedValue; }
  return false;
};

const onError = (error) => {
  if (error.syscall !== 'listen') { throw error; }

  const bind = typeof port === 'string' ? `pipe ${port}` : `port ${port}`;

  console.log(`Error Code: ${error.code}`);
  
  switch (error.code) {
    case 'EACCES':
      console.log(`${bind} requires elevated privileges`);
      process.exit(1);
    case 'EPORTINUSE':
      console.log(`${bind} is already in use`);
      process.exit(1);
    default: 
      throw error;
  }
};

const onListening = () => {
  const address = server.address();
  const bind = typeof address === 'string' ? `pipe ${address}` : `port ${port}`;
  console.log(`Listening on ${bind}`);
};

const port = normalizePort(process.env.PORT || '8080');
app.set('port', port);

// HTTP Server
const server = http.createServer(app);
server.on('error', onError);
server.on('listening', onListening);
server.listen(port);

// WS Server
const wss = new WebSocket.Server({ server });
wss.on('connection', (ws) => {
  console.log('WSS Connected');
});

setInterval(async () => {
  try {
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        console.log('UPDATING WS MESSAGE SENT');
        client.send(JSON.stringify({ status: 'updating', timestamp: new Date().getTime() }));
      }
    });
    // Get Summoners
    const firstPageUrl = `https://na1.api.riotgames.com/lol/league-exp/v4/entries/RANKED_SOLO_5x5/CHALLENGER/I?page=1&api_key=${process.env.RIOT_DEV_KEY}`;
    const firstResponse = await axios.get(firstPageUrl);
    let summoners = firstResponse.data;
    const secondPageUrl = `https://na1.api.riotgames.com/lol/league-exp/v4/entries/RANKED_SOLO_5x5/CHALLENGER/I?page=2&api_key=${process.env.RIOT_DEV_KEY}`;
    const secondResponse = await axios.get(secondPageUrl);
    summoners = summoners.concat(secondResponse.data);
    await deleteSummoners();
    // Get ActiveGames & Store Summoners in DB
    for (let i = 0; i < 75; i++) {
      try {
        const url = `https://na1.api.riotgames.com/lol/spectator/v4/active-games/by-summoner/${summoners[i].summonerId}?api_key=${process.env.RIOT_DEV_KEY}`;
        const response = await axios.get(url);
        const result = await createSummoner(summoners[i], { status: true, data: response.data });
        console.log('CREATED:', result.summonerName, 'true');
      } catch (error) {
        const result = await createSummoner(summoners[i], { status: false, data: null });
        console.log('CREATED:', result.summonerName, 'false');
      }
    }
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        console.log('UPDATED WS MESSAGE SENT');
        client.send(JSON.stringify({ status: 'updated', timestamp: new Date().getTime() }));
      }
    });
  } catch (error) {
    console.log(error)
  }
}, 120000);

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.DB_URI, { authSource: 'admin', useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false });
    console.log('Connected to DB');
  } catch (error) {
    console.log(error);
  }
}

// MongoDB
connectDB();