function buildDateNoTime(){
    let today = new Date ();
    let datewithouthours = ''
    datewithouthours = datewithouthours + today.getFullYear ();
    datewithouthours = datewithouthours + '-';
    datewithouthours = datewithouthours + ('0' + (today.getMonth () + 1)).slice (-2);
    datewithouthours = datewithouthours + '-';
    datewithouthours = datewithouthours + ('0' + today.getDate ()).slice (-2);
    return datewithouthours;
}

function dateBuilderPriceAPI (date) {
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

  module.exports = {
    buildDateNoTime,
    dateBuilderPriceAPI
  }