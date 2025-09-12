document.addEventListener('DOMContentLoaded', () => {
  let mac = getQueryParam('mac') || sessionStorage.getItem('deviceMac');
  const username = sessionStorage.getItem('username');

  if (!username) {
    alert('Please login first.');
    window.location.href = 'login.html';
    return;
  }

  if (!mac) {
    alert('No device MAC address provided.');
    return;
  }

  sessionStorage.setItem('deviceMac', mac);
  const formattedMac = mac.replace(/-/g, ':').toUpperCase();
  const macDisplay = document.getElementById('macAddress');
  if (macDisplay) macDisplay.textContent = formattedMac;

  const esp32BaseUrl = "http://10.41.215.235"; // ESP32 IP

  // ================================
  // Chart.js setup
  // ================================
  const ctx = document.getElementById('energyChart').getContext('2d');
  const energyChart = new Chart(ctx, {
    type: 'line',
    data: { labels: [], datasets: [{ label: 'Energy Usage (W)', data: [], borderColor: 'rgb(75,192,192)', tension: 0.3 }] },
    options: {
      responsive: true,
      scales: {
        x: { title: { display: true, text: 'Time' } },
        y: { title: { display: true, text: 'Watts' } }
      }
    }
  });

  async function fetchLiveData() {
    try {
      const response = await fetch(`${esp32BaseUrl}/api/data`);
      if (response.ok) {
        const data = await response.json();

        document.getElementById('liveEnergy').textContent = data.energyUsage.toFixed(2) + ' W';
        document.getElementById('voltage').textContent = data.voltage.toFixed(2) + ' V';
        document.getElementById('current').textContent = data.current.toFixed(2) + ' A';
        document.getElementById('predictedBill').textContent = '₹' + data.predictedBillRs.toFixed(2);
        document.getElementById('peakHours').textContent = data.peakUsageW.toFixed(2) + ' W';
        document.getElementById('tamperAlerts').textContent = data.tamperAlertFlag ? '⚠️ Tamper Detected!' : 'None';
        document.getElementById('theftStatus').textContent = data.theftAlertFlag ? 'Theft Detection: ON ⚠️' : 'Theft Detection: OFF ❌';
        document.getElementById('totalEnergy').textContent = 'Total Energy: ' + data.totalEnergy.toFixed(2) + ' kWh';

        // Update chart
        const now = new Date().toLocaleTimeString();
        if (energyChart.data.labels.length > 20) {
          energyChart.data.labels.shift();
          energyChart.data.datasets[0].data.shift();
        }
        energyChart.data.labels.push(now);
        energyChart.data.datasets[0].data.push(data.energyUsage.toFixed(2));
        energyChart.update();

        checkEnergyAndPower();
      } else {
        console.error('Failed to fetch live data:', response.status);
      }
    } catch (err) {
      console.error('Error fetching live data:', err);
    }
  }

  fetchLiveData();
  setInterval(fetchLiveData, 3000);

  // ================================
  // Logout
  // ================================
  document.getElementById('logoutBtn')?.addEventListener('click', () => {
    sessionStorage.clear();
    window.location.href = 'login.html';
  });

  // ================================
  // Recharge
  // ================================
  document.getElementById('rechargeBtn')?.addEventListener('click', () => {
    const rechargeAmount = parseFloat(document.getElementById('rechargeAmount').value);
    let balance = parseFloat(document.getElementById('balanceBox').textContent);

    if (isNaN(rechargeAmount) || rechargeAmount <= 0) { alert('Enter valid amount'); return; }

    balance += rechargeAmount;
    document.getElementById('balanceBox').textContent = balance.toFixed(2);
    document.getElementById('rechargePreview').textContent = `+₹${rechargeAmount.toFixed(2)} added ✅`;
    document.getElementById('rechargeAmount').value = '';
  });

  // ================================
  // Set Monthly Usage
  // ================================
  document.getElementById('setMonthlyBtn')?.addEventListener('click', () => {
    const inputAmount = parseFloat(document.getElementById('monthlyInput').value);
    let balance = parseFloat(document.getElementById('balanceBox').textContent);
    let monthlyUsage = parseFloat(document.getElementById('monthlyUsage').textContent.replace(/[^\d.]/g, '')) || 0;
    let remainingEnergy = parseFloat(document.getElementById('remainingEnergy').textContent.replace(/[^\d.]/g, '')) || 0;

    if (isNaN(inputAmount) || inputAmount <= 0) { alert('Enter valid amount'); return; }
    if (inputAmount > balance) { alert('Not enough balance'); return; }

    balance -= inputAmount;
    const kwhProvided = inputAmount / 6;

    monthlyUsage += kwhProvided;
    remainingEnergy += kwhProvided;

    document.getElementById('balanceBox').textContent = balance.toFixed(2);
    document.getElementById('monthlyUsage').textContent = monthlyUsage.toFixed(2) + ' kWh';
    document.getElementById('remainingEnergy').textContent = remainingEnergy.toFixed(2) + ' kWh';
    document.getElementById('monthlyPreview').textContent = `+${kwhProvided.toFixed(2)} kWh added ✅`;
    document.getElementById('monthlyInput').value = '';

    checkEnergyAndPower();
  });

  // ================================
  // Allocate Monthly Energy
  // ================================
  const allocateKwhBtn = document.getElementById('allocateKwhBtn');
  const resetMonthlyBtn = document.getElementById('resetMonthlyBtn');

  allocateKwhBtn?.addEventListener('click', () => {
    const inputAmount = parseFloat(document.getElementById('monthlyKwhInput').value);
    if (isNaN(inputAmount) || inputAmount <= 0) { alert('Enter valid amount'); return; }

    const kwhProvided = inputAmount / 6;
    document.getElementById('monthlyUsage').textContent = kwhProvided.toFixed(2) + ' kWh';
    document.getElementById('remainingEnergy').textContent = kwhProvided.toFixed(2) + ' kWh';
    document.getElementById('monthlyKwhPreview').textContent = `Monthly allocation set: ${kwhProvided.toFixed(2)} kWh ✅`;

    allocateKwhBtn.disabled = true;
    document.getElementById('monthlyKwhInput').value = '';

    checkEnergyAndPower();
  });

  resetMonthlyBtn?.addEventListener('click', () => {
    document.getElementById('monthlyUsage').textContent = '0 kWh';
    document.getElementById('remainingEnergy').textContent = '0 kWh';
    document.getElementById('monthlyKwhPreview').textContent = 'Monthly allocation reset 🔄';
    allocateKwhBtn.disabled = false;
    document.getElementById('monthlyKwhInput').value = '';
    checkEnergyAndPower();
  });

  // ================================
  // Power Control
  // ================================
  const powerOnBtn = document.getElementById('powerOnBtn');
  const powerOffBtn = document.getElementById('powerOffBtn');
  const powerStatus = document.getElementById('powerStatus');

  function getRemainingEnergy() {
    return parseFloat(document.getElementById('remainingEnergy').textContent.replace(/[^\d.]/g, '')) || 0;
  }

  function checkEnergyAndPower() {
    if (getRemainingEnergy() <= 0) {
      powerStatus.textContent = 'Power: OFF ❌';
      powerOnBtn.disabled = true;
    } else {
      powerOnBtn.disabled = false;
    }
  }

  powerOnBtn?.addEventListener('click', () => {
    if (getRemainingEnergy() > 0) powerStatus.textContent = 'Power: ON ⚡';
    else { alert('No remaining energy!'); powerStatus.textContent = 'Power: OFF ❌'; }
  });

  powerOffBtn?.addEventListener('click', () => {
    powerStatus.textContent = 'Power: OFF ❌';
  });

  setInterval(checkEnergyAndPower, 3000);

  // ================================
  // Relay Control (GET method for ESP32)
  // ================================
  const relaySwitch1 = document.getElementById('relaySwitch1');
  const relaySwitch2 = document.getElementById('relaySwitch2');
  const relayStatus1 = document.getElementById('relayStatus1');
  const relayStatus2 = document.getElementById('relayStatus2');

  async function controlRelay(channel, state) {
    try {
      await fetch(`${esp32BaseUrl}/relay/${channel}/${state}`); // GET
    } catch (err) {
      console.error(`Relay ${channel} ${state} failed:`, err);
    }
  }

  relaySwitch1?.addEventListener('change', () => {
    if (relaySwitch1.checked) { relayStatus1.textContent = "Relay 1: ON ⚡"; controlRelay(1, "on"); }
    else { relayStatus1.textContent = "Relay 1: OFF ❌"; controlRelay(1, "off"); }
  });

  relaySwitch2?.addEventListener('change', () => {
    if (relaySwitch2.checked) { relayStatus2.textContent = "Relay 2: ON ⚡"; controlRelay(2, "on"); }
    else { relayStatus2.textContent = "Relay 2: OFF ❌"; controlRelay(2, "off"); }
  });
});

// ================================
// Helper: Get URL query parameters
// ================================
function getQueryParam(param) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(param);
}
