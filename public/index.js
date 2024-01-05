var socket = io();
var chargeConfig = null;
var prices_labels = [];
var prices_data = [];
var rain_labels = [];
var rain_data = [];

const prices = document.getElementById('prices');
const rain = document.getElementById('rain');

$('#socDateActive').on('click', function () {
  console.log($('#socDateActive').prop('checked'));
  chargeConfig.active = $('#socDateActive').prop('checked');
  socket.emit('chargeConfig', chargeConfig);
});

$('#minSOCslider').on('input change', function () {
  chargeConfig.minSOC = $('#minSOCslider').val();
  $('#lblMinSOC').html(chargeConfig.minSOC + '%');
  socket.emit('chargeConfig', chargeConfig);
});

socket.on('version', function (data) {
  $('#version').html(data);
});

socket.on('multiplus_data', function (data) {
  $('#td_state').html(data.state);
  $('#td_soc').html(data.soc);
});

socket.on('config', function (data) {
  $('#td_ip').html(data[0].modbus.master_ip);
  $('#td_port').html(data[0].modbus.master_port);
  chargeConfig = data[1].chargeConfig;
  if (chargeConfig.date != null) {
    let chargeDate = new Date(chargeConfig.date);
    $('#chargeTime').html(
      chargeDate.toLocaleString('de-DE', { timeZone: 'Europe/Berlin' })
    );
  }
  $('#socDateActive').prop('checked', chargeConfig.active);
  $('#minSOCslider').val(chargeConfig.minSOC);
  $('#lblMinSOC').html(chargeConfig.minSOC + '%');
});

socket.on('prices', function (data) {
  $('#prices').html('');
  for (i = data.length - 1; i >= 0; i--) {
    let date = new Date(data[i].date * 1000);
    prices_labels.push(
      date.toLocaleString('de-DE', {
        timeZone: 'Europe/Berlin',
        dateStyle: 'short',
        timeStyle: 'short',
      })
    );
    prices_data.push(data[i].price);
  }
  new Chart(prices, {
    type: 'line',
    data: {
      labels: prices_labels,
      datasets: [
        {
          label: 'EUR/MWh',
          data: prices_data,
          borderWidth: 1,
        },
      ],
    },
    options: {
      scales: {
        y: {
          beginAtZero: true,
        },
      },
      responsive: true,
      maintainAspectRatio: false,
    },
  });
});

socket.on('rain', function (data) {
  $('#tbl_rain').html('');
  console.log(data)
  for (i = data.length - 1; i >= 0; i--) {
    let date = new Date(data[i].date);
    rain_labels.push(
      date.toLocaleString('de-DE', {
        timeZone: 'Europe/Berlin',
        dateStyle: 'short',
        timeStyle: 'short',
      })
    );
    rain_data.push(data[i].rain);
  }
  new Chart(rain, {
    type: 'bar',
    data: {
      labels: rain_labels,
      datasets: [
        {
          label: 'mm',
          data: rain_data,
          borderWidth: 1,
        },
      ],
    },
    options: {
      scales: {
        y: {
          beginAtZero: true,
        },
      },
      responsive: true,
      maintainAspectRatio: false,
    },
  });
});


setInterval(function () {
  dtnow = new Date();
  $('#timenow').html(
    dtnow.toLocaleString('de-DE', { timeZone: 'Europe/Berlin' })
  );
}, 1000);

flatpickr('#SOCdatePicker', {
  enableTime: true,
  dateFormat: 'Y-m-d H:i',
  time_24hr: true,
  locale: 'de',
  enableTime: true,
  plugins: [new confirmDatePlugin()],
  onClose: function (selectedDates) {
    chargeConfig.date = selectedDates[0];
    socket.emit('chargeConfig', chargeConfig);
    $('#chargeTime').html(
      selectedDates[0].toLocaleString('de-DE', { timeZone: 'Europe/Berlin' })
    );
  },
});

socket.on('chargeConfig', function (data) {
  chargeConfig = data;
  if (chargeConfig.date != null) {
    let chargeDate = new Date(chargeConfig.date);
    $('#chargeTime').html(
      chargeDate.toLocaleString('de-DE', { timeZone: 'Europe/Berlin' })
    );
  }
  $('#socDateActive').prop('checked', chargeConfig.active);
});
