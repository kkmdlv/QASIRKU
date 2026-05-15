// DEBUG: Jika muncul alert ini, koneksi GitHub ke APK AMAN
alert("KUKAMI Engine v1.1 Aktif!");

const WEB_APP_URL = "https://script.google.com/macros/s/AKfycby1x8eNx_ynDqES6BvcagDUI5ZXsjTIb_K0cwj0vfNCU-yfBWhz-rDDCh0EzgG3iWtU/exec";

let curRider = {}, masterTarif = [], cart = [], curNomStr = "0";

// --- UTILS ---
const getFingerprint = () => localStorage.getItem('kukami_fp') || (() => { 
    let id = 'ID-' + Math.random().toString(36).substr(2, 9).toUpperCase(); 
    localStorage.setItem('kukami_fp', id); return id; 
})();

const formatRibuan = (v) => v.toString().replace(/\D/g, "").replace(/\B(?=(\d{3})+(?!\d))/g, ".");
const getAngka = (v) => Number(v.toString().replace(/\./g, ""));

const showLoading = (s) => { 
    const l = document.getElementById('loader'); 
    if(l) l.style.display = s ? 'flex' : 'none'; 
    // Emergency stop: Jika 15 detik masih muter, matikan paksa
    if(s) setTimeout(() => { if(l) l.style.display = 'none'; }, 15000);
};

// --- AUTH (PROSES LOGIN) ---
function prosesLogin() { 
    showLoading(true); 
    const user = document.getElementById('user').value;
    const pin = document.getElementById('pin').value;
    
    const url = WEB_APP_URL + "?action=login&user=" + encodeURIComponent(user) + "&pin=" + encodeURIComponent(pin);

    var xhr = new XMLHttpRequest();
    xhr.open("GET", url, true);
    
    xhr.onreadystatechange = function() {
        if (xhr.readyState == 4) {
            if (xhr.status == 200) {
                try {
                    var res = JSON.parse(xhr.responseText);
                    if(res.status === "success") { 
    // Ambil data rider yang dikirim GAS (Penting: res.rider.id harus ada isinya)
    curRider = res.rider; 
    localStorage.setItem('kukami_session', JSON.stringify(curRider)); 
    
    alert("Selamat Datang, " + curRider.nama); // Tambahkan alert ini untuk tes
    initDashboard();
                    } else {
                        showLoading(false);
                        alert("Akses Ditolak: Cek Nama & PIN");
                    }
                } catch(e) {
                    showLoading(false);
                    alert("Format Data Server Salah!");
                }
            } else {
                showLoading(false);
                alert("Server Google Tidak Merespon (Error " + xhr.status + ")");
            }
        }
    };
    xhr.send();
}

function initDashboard() {
    // PAKSA PINDAH HALAMAN DULUAN
    document.getElementById('p-login').style.display = 'none'; 
    document.getElementById('app-content').style.display = 'block';
    showLoading(true);

    const targetId = curRider.id || "Unknown";
    
    var xhr = new XMLHttpRequest();
    xhr.open("GET", WEB_APP_URL + "?action=getDashboard&id=" + encodeURIComponent(targetId), true);
    
    xhr.onreadystatechange = function() {
        if (xhr.readyState == 4) {
            // APAPUN HASILNYA, LOADING HARUS MATI
            showLoading(false); 
            
            if (xhr.status == 200) {
                try {
                    var res = JSON.parse(xhr.responseText);
                    // Update UI (Gunakan pengecekan agar tidak crash jika data kosong)
                    document.getElementById('r-nama').innerHTML = (res.sapaan || curRider.nama || targetId);
                    document.getElementById('r-saldo').innerText = "Rp " + Number(res.saldo || 0).toLocaleString();
                    
                    if(res.stats) {
                        document.getElementById('h-total').innerText = res.stats.hari.total || 0;
                        document.getElementById('b-total').innerText = res.stats.bulan.total || 0;
                    }
                    
                    masterTarif = res.listTarif || [];
                    renderRiwayat(res.riwayat);
                    // ... sisanya aman
                } catch(e) {
                    console.log("Render gagal tapi layar sudah pindah.");
                }
            }
        }
    };
    xhr.send();
}

// --- DASHBOARD ---
function initDashboard() {
    document.getElementById('p-login').style.display = 'none'; 
    document.getElementById('app-content').style.display = 'block';
    showLoading(true);

    const targetId = curRider.id || JSON.parse(localStorage.getItem('kukami_session') || "{}").id;
    const url = WEB_APP_URL + "?action=getDashboard&id=" + targetId;
    
    var xhr = new XMLHttpRequest();
    xhr.open("GET", url, true);
    
    xhr.onreadystatechange = function() {
        if (xhr.readyState == 4) {
            showLoading(false);
            if (xhr.status == 200) {
                try {
                    var res = JSON.parse(xhr.responseText);
                    
                    // RENDER DATA KE UI
                    document.getElementById('r-nama').innerHTML = (res.sapaan || curRider.nama || "Rider");
                    document.getElementById('r-saldo').innerText = "Rp " + Number(res.saldo || 0).toLocaleString();
                    if(res.foto) document.getElementById('r-foto').src = res.foto;
                    
                    // Stats
                    document.getElementById('h-total').innerText = res.stats.hari.total;
                    document.getElementById('h-on').innerText = res.stats.hari.on;
                    document.getElementById('h-off').innerText = res.stats.hari.off;
                    document.getElementById('b-total').innerText = res.stats.bulan.total;
                    document.getElementById('b-on').innerText = res.stats.bulan.on;
                    document.getElementById('b-off').innerText = res.stats.bulan.off;

                    masterTarif = res.listTarif || [];
                    if(typeof renderRiwayat === 'function') renderRiwayat(res.riwayat);
                    
                    let cats = [...new Set(masterTarif.map(x => x.kategori))];
                    if (cats.length > 0) {
                        document.getElementById('cat-list').innerHTML = cats.map(cat => 
                            `<div class="chip" onclick="renderGrid('${cat}')">${cat}</div>`).join('');
                        if(typeof renderGrid === 'function') renderGrid(cats[0]);
                    }
                } catch(e) {
                    console.error("Gagal Render Dashboard", e);
                }
            }
        }
    };
    xhr.send();
}

// --- INITIALIZE ---
window.onload = function() { 
    const s = localStorage.getItem('kukami_session'); 
    if (s) { 
        curRider = JSON.parse(s); 
        initDashboard(); 
    } 
    
    const topupInput = document.getElementById('u-nom');
    if(topupInput) {
        topupInput.addEventListener('input', function() { 
            this.value = formatRibuan(this.value); 
        });
    }
};
