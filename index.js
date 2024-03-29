const ModbusRTU = require ('modbus-serial');
const modbus_client_100 = new ModbusRTU ();
const modbus_client_239 = new ModbusRTU ();
const path = require ('path');
const express = require ('express');
const app = express ();
const http = require ('http');
const server = http.createServer (app);
const {Server} = require ('socket.io');
const io = new Server (server);
const Datastore = require ('@seald-io/nedb');
const schedules = require ('./schedules.js');
const parser = require ('./parser.js');
const price = require ('./price.js');
const {version} = require ('./package.json');
const db = new Datastore ({filename: 'config.db', autoload: false});
db.loadDatabase ();

var modbusConnected = false;
var chargeConfig = null;
var minSOC = 0;

db.findOne ({_id: 'Ac2aN9K1rQf3Y9GR'}, function (err, doc) {
  console.log (doc);
  modbus_client_100
    .connectTCP (doc.modbus.master_ip, {
      port: doc.modbus.master_port,
    })
    .then (function () {
      console.log ('Connected to VE.Bus');
      modbusConnected = true;
      modbus_client_100.setID (100);
      modbus_client_100.setTimeout (2000);
      schedules.setModbusClient (modbus_client_100);
    })
    .catch (function (e) {
      console.log (e.message);
    });

  modbus_client_239
    .connectTCP (doc.modbus.master_ip, {
      port: doc.modbus.master_port,
    })
    .then (function () {
      console.log ('Connected to VE.Bus');
      modbus_client_239.setID (239);
      modbus_client_239.setTimeout (1000);
    })
    .catch (function (e) {
      console.log (e.message);
    });
});

db.findOne ({_id: 'NKEQKAcAypYSrwSO'}, function (err, doc) {
  chargeConfig = doc.chargeConfig;
});

const modbus_registers = {
  ve_bus_state_of_charge: 30,
  ve_bus_state: 31,
  ve_system_minsoc: 2901,
};

var multiplus_data = {
  state: null,
  soc: null,
};

function modbus_gatherer () {
  modbus_client_239.readInputRegisters (
    modbus_registers.ve_bus_state,
    1,
    function (err, data) {
      multiplus_data.state = parser.vebus_state (data.data[0]);
    }
  );
  modbus_client_239.readInputRegisters (
    modbus_registers.ve_bus_state_of_charge,
    1,
    function (err, data) {
      multiplus_data.soc = parser.vebus_state_of_charge (data.data[0]);
    }
  );
  io.emit ('multiplus_data', multiplus_data);
}

interval_modbus_gatherer = setInterval (() => {
  if (modbusConnected == true) {
    modbus_gatherer ();
  }
}, 2000);

//////////////// EXPRESS ///////////////////////////////////////////////
app.use (express.static (__dirname + '/public'));
app.get ('/', (req, res) => {
  res.sendFile (path.join (__dirname, './public/index.html'));
});
app.get ('/index.js', (req, res) => {
  res.sendFile (path.join (__dirname, './public/index.js'));
});
app.get ('/bootstrap/dist/css/bootstrap.min.css', function (req, res) {
  res.sendFile (
    path.join (__dirname, './node_modules/bootstrap/dist/css/bootstrap.min.css')
  );
});
app.get ('/bootstrap/dist/js/bootstrap.bundle.min.js', function (req, res) {
  res.sendFile (
    path.join (
      __dirname,
      './node_modules/bootstrap/dist/js/bootstrap.bundle.min.js'
    )
  );
});
app.get ('/jquery/jquery.js', function (req, res) {
  res.sendFile (
    path.join (__dirname, './node_modules/jquery/dist/jquery.min.js')
  );
});
server.listen (8080, () => {
  console.log ('listening on *:8080');
});
//////////////// EXPRESS ENDE///////////////////////////////////////////

/////////////// SOCKET.io /////////////////////////////////////////////
io.on ('connection', function (socket) {
  console.log ('Socket.io connected');
  emitConfig ();
  emitPrice ();
  io.emit ('version', version);
  socket.on ('chargeConfig', function (data) {
    updateDoc (data);
  });
});
///////////// SOCKET.io ENDE ////////////////////////////////////////

async function emitConfig () {
  const docs = await db.findAsync ({});
  io.emit ('config', docs);
}

async function emitPrice () {
  let prices = await price.getPrice ();
  io.emit ('prices', prices);
}

async function updateDoc (data) {
  let active = data.active;
  let date = data.date;
  let numAffected = await db.updateAsync (
    {_id: 'NKEQKAcAypYSrwSO'},
    {$set: {chargeConfig: {active: active, date: date, minSOC: data.minSOC}}},
    {}
  );
}

setInterval (() => {
  modbusRunner ();
}, 900);

async function modbusRunner (data) {
  const docs = await db.findAsync ({});
  if (docs[1].chargeConfig.active == true) {
    let date_now = new Date (); // current time
    let j_datenow = {
      day: date_now.getDay (),
      month: date_now.getMonth () + 1,
      year: date_now.getFullYear (),
      hours: date_now.getHours (),
      mins: date_now.getMinutes (),
    };

    let datecharge = new Date (docs[1].chargeConfig.date);
    let j_datecharge = {
      day: datecharge.getDay (),
      month: datecharge.getMonth () + 1,
      year: datecharge.getFullYear (),
      hours: datecharge.getHours (),
      mins: datecharge.getMinutes (),
    };

    if (
      j_datenow.day == j_datecharge.day &&
      j_datenow.month == j_datecharge.month &&
      j_datenow.year == j_datecharge.year &&
      j_datenow.hours == j_datecharge.hours &&
      j_datenow.mins == j_datecharge.mins
    ) {
      if (modbusConnected == true) {
        modbus_client_100.writeRegister (modbus_registers.ve_system_minsoc, 0);
      }
      updateDoc ({active: false, date: null});
      io.emit ('chargeConfig', {active: false, date: null});
    }
  }
}

setInterval (() => {
  priceRunnerToday ();
  priceRunnerTomorrow ();
}, 10000);

async function priceRunnerToday () {
  let prices = await price.getPrice ();
  if (prices.length == 0) {
    price.gatherPrice (dateBuilder ('today')[0], dateBuilder ('today')[1]);
  }
  let date_now = new Date ();
  let j_datenow = {
    day: date_now.getDay (),
    month: date_now.getMonth () + 1,
    year: date_now.getFullYear (),
    hours: date_now.getHours (),
    mins: date_now.getMinutes (),
  };

  for (element in prices) {
    let date_target = new Date (prices[element].date * 1000);
    j_datetarget = {
      day: date_target.getDay (),
      month: date_target.getMonth () + 1,
      year: date_target.getFullYear (),
      hours: date_target.getHours (),
      mins: date_target.getMinutes (),
    };
    if (
      j_datenow.day == j_datetarget.day &&
      j_datenow.month == j_datetarget.month &&
      j_datenow.year == j_datetarget.year
    ) {
      break;
    } else {
      price.gatherPrice (dateBuilder ('today')[0], dateBuilder ('today')[1]);
    }
  }
}

async function priceRunnerTomorrow () {
  let prices = await price.getPrice ();
  let date_now = new Date ();
  let j_datenow = {
    day: date_now.getDay (),
    month: date_now.getMonth () + 1,
    year: date_now.getFullYear (),
    hours: date_now.getHours (),
    mins: date_now.getMinutes (),
  };

  if (j_datenow.hours >= 13 && j_datenow.mins >= 2) {
    for (element in prices) {
      let date_target = new Date (prices[element].date * 1000);
      j_datetarget = {
        day: date_target.getDay (),
        month: date_target.getMonth () + 1,
        year: date_target.getFullYear (),
        hours: date_target.getHours (),
        mins: date_target.getMinutes (),
      };
      if (
        j_datenow.day + 1 == j_datetarget.day + 1 &&
        j_datenow.month == j_datetarget.month &&
        j_datenow.year == j_datetarget.year
      ) {
        break;
      } else {
        price.gatherPrice (
          dateBuilder ('tomorrow')[0],
          dateBuilder ('tomorrow')[1]
        );
      }
    }
  }
}

function dateBuilder (date) {
  let date_now = new Date ();
  let j_datenow = {
    day: date_now.getDay (),
    month: date_now.getMonth () + 1,
    year: date_now.getFullYear (),
    hours: date_now.getHours (),
    mins: date_now.getMinutes (),
  };
  let today_start =
    j_datenow.year +
    '-' +
    ('0' + j_datenow.month).slice (-2) +
    '-' +
    ('0' + j_datenow.day).slice (-2) +
    'T' +
    '00:00';
  let today_end =
    j_datenow.year +
    '-' +
    ('0' + j_datenow.month).slice (-2) +
    '-' +
    ('0' + j_datenow.day).slice (-2) +
    'T' +
    '23:45';
  let tomorrow_start =
    j_datenow.year +
    '-' +
    ('0' + j_datenow.month).slice (-2) +
    '-' +
    ('0' + (j_datenow.day + 1)).slice (-2) +
    'T' +
    '00:00';
  let tomorrow_end =
    j_datenow.year +
    '-' +
    ('0' + j_datenow.month).slice (-2) +
    '-' +
    ('0' + (j_datenow.day + 1)).slice (-2) +
    'T' +
    '23:45';

  switch (date) {
    case 'today':
      return [today_start, today_end];
      break;
    case 'tomorrow':
      return [tomorrow_start, tomorrow_end];
      break;
  }
}
