///////// UNUSED YET //////////

const schedule = require('node-schedule');
var modbus_client = null;

function setModbusClient(client) {
  modbus_client = client;
}

function setJobSchedule(_schedule) {
  let job = schedule.scheduleJob(_schedule, function () {
    job.cancel()
  });
}

module.exports = {
  setModbusClient: setModbusClient,
  setJobSchedule: setJobSchedule,
};
