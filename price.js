const axios = require ('axios');
const https = require ('https');
const Datastore = require ('@seald-io/nedb');
const db = new Datastore ({filename: 'price.db', autoload: false});
db.loadDatabase ();

const agent = new https.Agent ({
  rejectUnauthorized: false,
});

async function gatherPrice (dateFrom, dateTo) {
  let config = {
    method: 'get',
    maxBodyLength: Infinity,
    httpsAgent: agent,
    url: `https://api.energy-charts.info/price?bzn=DE-LU&start=${dateFrom}&end=${dateTo}`,
    headers: {},
  };
  let response = await axios.request (config);
  for (element in response.data.unix_seconds) {
    let newDoc = await db.insertAsync ({
      date: response.data.unix_seconds[element],
      price: response.data.price[element],
    });
  }
}

async function getPrice (date) {
  let docs = await db.findAsync ({}).sort({ date: -1 }).limit(39);
  return docs;
}

async function getAllPrices () {
  let docs = await db.findAsync ({}).sort({ date: -1 });
  return docs;
}

module.exports = {
  gatherPrice: gatherPrice,
  getPrice: getPrice,
  getAllPrices: getAllPrices,
};
