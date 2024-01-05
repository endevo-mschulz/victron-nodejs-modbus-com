const axios = require ('axios');
const https = require ('https');
const Datastore = require ('@seald-io/nedb');
const db = new Datastore ({filename: 'weather.db', autoload: false});
db.loadDatabase ();

const agent = new https.Agent ({
  rejectUnauthorized: false,
});

async function gatherRain () {
  console.log ('Gathering rain');
  let config = {
    method: 'get',
    maxBodyLength: Infinity,
    httpsAgent: agent,
    url: 'https://api.open-meteo.com/v1/forecast?latitude=52.92&longitude=9.23&daily=rain_sum&timezone=Europe%2FBerlin&past_days=2',
    headers: {},
  };
  let response = await axios.request (config);
  console.log (response.data.daily.time);
  console.log (response.data.daily.rain_sum);
  for (element in response.data.daily.time) {
    let newDoc = await db.insertAsync ({
      date: response.data.daily.time[element],
      rain: response.data.daily.rain_sum[element],
    });
  }
}

async function getRain () {
  let docs = await db.findAsync ({}).sort ({date: -1}).limit (39);
  return docs;
}

module.exports = {
  gatherRain: gatherRain,
  getRain: getRain,
};
