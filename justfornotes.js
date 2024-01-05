// starting a scheduled job
schedules.setJobSchedule ({hour: 14, minute: 16, dayOfWeek: 2});

// Unix time to date
let unix_timestamp = 1672614000;
var date = new Date (unix_timestamp * 1000);
console.log (date.toLocaleString ('de-DE', {timeZone: 'Europe/Berlin'}));

// Preise ziehen API
price.gatherPrice ('2024-01-05T00:00', '2024-01-05T23:45');

//Modbus schreiben (register, wert)
modbus_client_239.writeRegister (30, 100);

// DB insert:
async function insDb () {
  const doc = {
    chargeConfig: {
      active: false,
      date: null,
    },
  };

  try {
    const newDoc = await db.insertAsync (doc);
  } catch (error) {
    console.log (error);
  }
}
