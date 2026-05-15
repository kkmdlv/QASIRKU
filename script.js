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
    if(s) setTimeout(() => { if(l) l.style.display = 'none'; }, 15000);
};

// --- AUTH (PROSES LOGIN) ---
function prosesLogin() { 
    showLoading(true); 
    const user = document.getElementById('user').value;
    const pin = document.getElementById('pin').value;
    
    if(!user || !pin) { showLoading(false); return alert("Isi Nama & PIN!"); }

    const url = WEB_APP_URL + "?action=login&user=" + encodeURIComponent(user) + "&pin=" + encodeURIComponent(pin) + "&fp=" + getFingerprint() + "&ua=" + encodeURIComponent(navigator.userAgent);

    var xhr = new XMLHttpRequest();
    xhr.open("GET", url, true);
    
    xhr.onreadystatechange = function() {
        if (xhr.readyState == 4) {
            if (xhr.status == 200) {
                try {
                    var res = JSON.parse(xhr.responseText);
                    if(res.status === "success") { 
                        curRider = res.rider; 
                        localStorage.setItem('kukami_session', JSON.stringify(curRider)); 
                        alert("Selamat Datang, " + curRider.nama);
                        initDashboard(); 
                    } else {
                        showLoading(false);
                        alert("Akses Ditolak: Cek Nama & PIN");
                    }
                } catch(e) {
                    showLoading(false);
                    alert("Format Data Server Salah! Periksa Deploy GAS Bos.");
                }
            } else {
                showLoading(false);
                alert("Server Google Tidak Merespon (Error " + xhr.status + ")");
            }
        }
    };
    xhr.send();
}

// --- DASHBOARD (SATU FUNGSI SAJA) ---
function initDashboard() {
    // Pindah Tampilan
    document.getElementById('p-login').style.display = 'none'; 
    document.getElementById('app-content').style.display = 'block';
    showLoading(true);

    const targetId = curRider.id || JSON.parse(localStorage.getItem('kukami_session') || "{}").id;
    
    // Jika ID tetap kosong, jangan lanjut
    if(!targetId) {
        showLoading(false);
        document.getElementById('p-login').style.display = 'block';
        return;
    }

    const url = WEB_APP_URL + "?action=getDashboard&id=" + encodeURIComponent(targetId);
    
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
                    if(res.stats) {
                        document.getElementById('h-total').innerText = res.stats.hari.total || 0;
                        document.getElementById('h-on').innerText = res.stats.hari.on || 0;
                        document.getElementById('h-off').innerText = res.stats.hari.off || 0;
                        document.getElementById('b-total').innerText = res.stats.bulan.total || 0;
                        document.getElementById('b-on').innerText = res.stats.bulan.on || 0;
                        document.getElementById('b-off').innerText = res.stats.bulan.off || 0;
                    }

                    masterTarif = res.listTarif || [];
                    if(typeof renderRiwayat === 'function') renderRiwayat(res.riwayat);
                    
                    // Render Kategori
                    let cats = [...new Set(masterTarif.map(x => x.kategori))];
                    if (cats.length > 0) {
                        const catList = document.getElementById('cat-list');
                        if(catList) {
                            catList.innerHTML = cats.map(cat => 
                                `<div class="chip" onclick="renderGrid('${cat}')">${cat}</div>`).join('');
                            if(typeof renderGrid === 'function') renderGrid(cats[0]);
                        }
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
