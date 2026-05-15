const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbx-2y76bO3ZfhYjQHplFe-tisjKv9zPmdXIBwLiz_bYo10ceMxaqBoBueyr6Qre85oS/exec";

let curRider = {}, masterTarif = [], cart = [], curNomStr = "0";

function showLoading(s) { document.getElementById('loader').style.display = s ? 'flex' : 'none'; }

// LOGIN & DASHBOARD
function prosesLogin() {
  showLoading(true);
  const u = document.getElementById('user').value;
  const p = document.getElementById('pin').value;
  const url = `${WEB_APP_URL}?action=login&user=${encodeURIComponent(u)}&pin=${p}`;
  
  fetch(url).then(r => r.json()).then(res => {
    if(res.status === "success") {
      localStorage.setItem('kukami_session', JSON.stringify(res.rider));
      initDashboard();
    } else { showLoading(false); alert(res.message); }
  }).catch(() => { showLoading(false); alert("Respon Server Tidak Valid"); });
}

function initDashboard() {
  const session = JSON.parse(localStorage.getItem('kukami_session') || "{}");
  if(!session.id) return;

  document.getElementById('p-login').style.display = 'none';
  document.getElementById('app-content').style.display = 'block';
  showLoading(true);

  fetch(`${WEB_APP_URL}?action=getDashboard&id=${session.id}`).then(r => r.json()).then(res => {
    showLoading(false);
    if(res.status === "success") {
      document.getElementById('r-nama').innerText = (res.sapaan ? res.sapaan + ", " : "") + res.namaAsli;
      document.getElementById('r-saldo').innerText = "Rp " + Number(res.saldo).toLocaleString('id-ID');
      document.getElementById('h-total').innerText = Number(res.stats.hari.on) + Number(res.stats.hari.off);
      document.getElementById('h-on').innerText = res.stats.hari.on;
      document.getElementById('h-off').innerText = res.stats.hari.off;
      if(res.foto) document.getElementById('r-foto').src = res.foto;
      
      masterTarif = res.listTarif;
      renderKategori();
    }
  }).catch(() => showLoading(false));
}

// KALKULATOR MANUAL
function pressNum(v) {
  const input = document.getElementById('m-nom');
  if(v === 'C') curNomStr = "0";
  else if(v === '⌫') curNomStr = curNomStr.length > 1 ? curNomStr.slice(0, -1) : "0";
  else curNomStr = curNomStr === "0" ? v : curNomStr + v;
  input.value = "Rp " + curNomStr.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

// NAVIGASI
function setSubTab(n) {
  document.getElementById('f-manual').style.display = n === 1 ? 'block' : 'none';
  document.getElementById('f-tarif').style.display = n === 2 ? 'block' : 'none';
  document.getElementById('tb1').className = n === 1 ? 'tab-btn tab-active' : 'tab-btn tab-inactive';
  document.getElementById('tb2').className = n === 2 ? 'tab-btn tab-inactive' : 'tab-btn tab-active';
}

function switchMainTab(tab) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.getElementById('p-' + tab).classList.add('active');
  document.getElementById('n-' + tab).classList.add('active');
}

function logout() { localStorage.removeItem('kukami_session'); location.reload(); }

window.onload = function() {
  if (localStorage.getItem('kukami_session')) initDashboard();
};
