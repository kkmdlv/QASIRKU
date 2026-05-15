const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbwnyxovvVjNqIWYrxAG53n3c7_dZnpuscDyxriE06yH_Ots4dpdmOuiE48wzV2hLyk3/exec";

let warnedOnce = false;
let curRider = {}, masterTarif = [], cart = [], pendingItem = null, curNomStr = "0";

// UTILS
const getFingerprint = () => localStorage.getItem('kukami_fp') || (() => { let id = 'ID-' + Math.random().toString(36).substr(2, 9).toUpperCase(); localStorage.setItem('kukami_fp', id); return id; })();
const formatRibuan = (v) => v.toString().replace(/\D/g, "").replace(/\B(?=(\d{3})+(?!\d))/g, ".");
const getAngka = (v) => Number(v.toString().replace(/\./g, ""));
const toast = (m) => { const c = document.getElementById('toast-container'); if(c) { const d = document.createElement('div'); d.className = 'toast'; d.innerHTML = m; c.appendChild(d); setTimeout(() => d.remove(), 2500); } };
const showLoading = (s) => { const l = document.getElementById('loader'); if(l) l.style.display = s ? 'flex' : 'none'; };

// UI TABS
const setSubTab = (n) => { document.getElementById('f-manual').style.display = (n === 1) ? 'block' : 'none'; document.getElementById('f-tarif').style.display = (n === 2) ? 'block' : 'none'; document.getElementById('tb1').className = 'tab-btn ' + (n === 1 ? 'tab-active' : 'tab-inactive'); document.getElementById('tb2').className = 'tab-btn ' + (n === 2 ? 'tab-active' : 'tab-inactive'); };
const switchMainTab = (t) => { document.getElementById('p-home').style.display = t === 'home' ? 'block' : 'none'; document.getElementById('p-riwayat').style.display = t === 'riwayat' ? 'block' : 'none'; document.getElementById('n-home').className = 'nav-item ' + (t === 'home' ? 'active' : ''); document.getElementById('n-riwayat').className = 'nav-item ' + (t === 'riwayat' ? 'active' : ''); };

// AUTH
function prosesLogin() { 
    showLoading(true); 
    const user = document.getElementById('user').value;
    const pin = document.getElementById('pin').value;
    const fp = getFingerprint();
    const ua = navigator.userAgent;

    // Ganti bagian fetch di prosesLogin atau initDashboard dengan ini
fetch(url, {
    method: 'GET',
    mode: 'cors', // Paksa mode CORS
    cache: 'no-cache', // Jangan simpan memori lama
    headers: {
        'Content-Type': 'application/json'
    }
})
.then(res => res.json())
// ... sisa kodenya sama
    .then(res => {
        showLoading(false); 
        if(res.status === "success") { 
            curRider = res.rider; 
            localStorage.setItem('kukami_session', JSON.stringify(curRider)); 
            initDashboard(); 
        } else alert("Akses Ditolak: " + (res.message || "Pin Salah")); 
    })
    .catch(err => { showLoading(false); alert("Koneksi Gagal! Periksa Sinyal."); console.error(err); });
}

// DASHBOARD DATA
function initDashboard() {
    document.getElementById('p-login').style.display = 'none'; 
    document.getElementById('app-content').style.display = 'block';
    showLoading(true);
    
    fetch(`${WEB_APP_URL}?action=getDashboard&id=${curRider.id}`)
    .then(res => res.json())
    .then(res => {
        showLoading(false);
        if(!res) return;

        const perfMap = {
            "TOP PERFORM": { icon: "💎", class: "anim-diamond" },
            "TOP PERFORMER": { icon: "💎", class: "anim-diamond" },
            "PERFORM": { icon: "🛡️", class: "" },
            "PERFORMER": { icon: "🛡️", class: "" },
            "UNDERPERFORM": { icon: "🚨", class: "anim-red" },
            "UNDERPERFORMER": { icon: "🚨", class: "anim-red" }
        };

        let statusRider = res.kelas ? res.kelas.toUpperCase().trim() : "";
        let dataPerf = perfMap[statusRider] || { icon: "👤", class: "" };
        let badgeHtml = `<span class="perf-icon ${dataPerf.class}">${dataPerf.icon}</span>`;
        
        document.getElementById('r-nama').innerHTML = `${curRider.nama} ${badgeHtml}`;
        document.getElementById('r-saldo').innerText = "Rp " + Number(res.saldo || 0).toLocaleString();
        if(res.foto) document.getElementById('r-foto').src = res.foto;
        
        document.getElementById('h-total').innerText = res.stats.hari.total;
        document.getElementById('h-on').innerText = res.stats.hari.on;
        document.getElementById('h-off').innerText = res.stats.hari.off;
        document.getElementById('b-total').innerText = res.stats.bulan.total;
        document.getElementById('b-on').innerText = res.stats.bulan.on;
        document.getElementById('b-off').innerText = res.stats.bulan.off;
        
        updateRank('rk-h-on', res.stats.hari.rank_on, 'hari');
        updateRank('rk-h-off', res.stats.hari.rank_off, 'hari');
        updateRank('rk-on', res.stats.bulan.rank_on, 'bulan');
        updateRank('rk-off', res.stats.bulan.rank_off, 'bulan');

        masterTarif = res.listTarif || []; 
        renderRiwayat(res.riwayat);
        
        let cats = [...new Set(masterTarif.map(x => x.kategori))];
        if (cats.length > 0) {
        document.getElementById('cat-list').innerHTML = cats.map(cat => 
          `<div class="chip" onclick="renderGrid('${cat}')">${cat}</div>`).join('');
        if (typeof renderGrid === 'function') renderGrid(cats[0]);
      }
    })
    .catch(err => { showLoading(false); console.error(err); }); // Penutup yang benar
}

// LOGIKA LAINNYA TETAP SAMA... (NUMPAD, GRID, DLL)
function pressNum(v) { if (v === 'C') curNomStr = "0"; else if (v === '⌫') curNomStr = curNomStr.length > 1 ? curNomStr.slice(0, -1) : "0"; else { if (curNomStr === "0") curNomStr = v; else curNomStr += v; } document.getElementById('m-nom').value = "Rp " + formatRibuan(curNomStr); }

function renderGrid(cat) { 
    let f = masterTarif.filter(x => x.kategori === cat); 
    document.getElementById('grid-list').innerHTML = f.map(i => `
        <div class="service-card" onclick="hitService('${i.layanan}', ${i.nominal})">
            <b>${i.layanan}</b><span>Rp ${Number(i.nominal).toLocaleString()}</span>
        </div>`).join(''); 
}

function hitService(ket, nom) { 
    let ketUpper = ket.toUpperCase();
    let itemData = masterTarif.find(t => t.layanan.toUpperCase() === ketUpper);
    let pot = itemData ? itemData.potongan : 0;

    let nominalFix = (ketUpper.includes("HP ADMIN")) ? 10000 : nom;
    let potonganFix = (ketUpper.includes("HP ADMIN")) ? 0.2 : pot;

    pendingItem = { ket: ketUpper, nominal: nominalFix, qty: 1, potongan: potonganFix }; 
    
    if (ketUpper.includes("HP ADMIN")) {
        finalProcess('Online', [pendingItem]); 
    } else {
        executeAddToCart(); 
    }
}

function executeAddToCart() {
    if(document.getElementById('m-confirm')) document.getElementById('m-confirm').style.display = 'none';
    const idx = cart.findIndex(c => c.ket === pendingItem.ket);
    if(idx > -1) cart[idx].qty++; else cart.push(pendingItem);
    renderCart(); toast("✅ Ditambah"); curNomStr = "0"; document.getElementById('m-nom').value = "Rp 0";
}

function renderCart() { 
    document.getElementById('cart-float').style.display = cart.length ? 'block' : 'none';
    let tot = cart.reduce((a,c)=>a+(c.nominal*c.qty), 0);
    document.getElementById('c-qty').innerText = cart.length; 
    document.getElementById('c-total').innerText = "Rp " + tot.toLocaleString();
    document.getElementById('c-list').innerHTML = cart.map((i, idx)=>`<div class="cart-row"><div style="flex:1;"><b>${i.ket}</b><br><small>Rp ${i.nominal.toLocaleString()}</small></div><div style="display:flex; align-items:center; gap:8px;"><button class="qty-btn" onclick="updateQty(${idx}, -1)">-</button><span style="font-weight:bold; min-width:20px; text-align:center;">${i.qty}</span><button class="qty-btn" onclick="updateQty(${idx}, 1)">+</button><button onclick="removeItem(${idx})" style="border:none;background:none;color:red;font-size:18px;">🗑</button></div></div>`).join('');
}

function updateQty(idx, d) { cart[idx].qty += d; if (cart[idx].qty <= 0) removeItem(idx); else renderCart(); }
function removeItem(idx) { cart.splice(idx, 1); renderCart(); if(!cart.length) document.getElementById('m-cart').style.display = 'none'; }
function showCart() { document.getElementById('m-cart').style.display = 'block'; renderCart(); setTimeout(cekValidasiQty, 300); }

function finalProcess(tipe, overrideItems) {
    const itemsToSubmit = overrideItems || cart;
    if (itemsToSubmit.length === 0) return toast("⚠️ Keranjang kosong!");
    showLoading(true);

    const payload = { idRider: curRider.id, namaRider: curRider.nama, items: itemsToSubmit, tipe: tipe, deviceInfo: navigator.userAgent };

    fetch(`${WEB_APP_URL}?action=saveTrx&data=${encodeURIComponent(JSON.stringify(payload))}`)
    .then(res => res.json())
    .then(res => {
        showLoading(false);
        toast("✅ Berhasil!");
        if (!overrideItems) { cart = []; renderCart(); }
        initDashboard();
        showStruk(res, payload.items);
    })
    .catch(err => { showLoading(false); alert("Gagal Simpan!"); });
}

function showStruk(res, items) {
    document.getElementById('s-inv').innerText = res.nota;
    document.getElementById('s-rider').innerText = curRider.nama;
    let raw = res.waktu || "";
    let clean = raw.replace(/WIB/g, "").trim(); 
    document.getElementById('s-tgl').innerText = clean + " WIB";
    
    let h = ''; 
    items.forEach(i => { 
        h += `<div style="margin-bottom:10px;">
                <div style="display:flex; justify-content:space-between; font-weight:bold;">
                  <span>${i.ket}</span>
                  <span>Rp ${(i.nominal*i.qty).toLocaleString()}</span> </div>
                <div style="font-size:10px; color:#666;">${i.qty} x Rp ${i.nominal.toLocaleString()}</div> </div>`; 
    });
    document.getElementById('s-items').innerHTML = h; 
    document.getElementById('s-total').innerText = "Rp " + res.total.toLocaleString(); 
    document.getElementById('m-struk').style.display = 'block';
}

function renderRiwayat(data) {
    let h = '', lastD = '';
    if (!data || !data.length) return document.getElementById('list-riwayat').innerHTML = '<div style="padding:30px; text-align:center; color:#888;">Belum ada riwayat</div>';
    data.forEach(i => {
        if(i.tglDisplay !== lastD) { h += `<div class="date-separator"><span>${i.tglDisplay}</span><div class="date-line"></div></div>`; lastD = i.tglDisplay; }
        let tClass = i.tipe.toLowerCase();
        if (i.ket.toUpperCase().includes("HP ADMIN")) tClass = "hp";
        h += `<div class="item-r"><div style="flex: 1; font-size: 10px;"><div style="color: #888;">${i.jam} | ${i.id}</div><div>${i.ket}</div><div><span class="hl-tag hl-${tClass}">${i.tipe}</span></div></div><div style="text-align: right;"><span style="color: #800000; font-weight: bold;">Rp ${Number(i.nom).toLocaleString()}</span></div></div>`;
    });
    document.getElementById('list-riwayat').innerHTML = h;
}

// PERBAIKAN TOPUP UNTUK GITHUB
function saveTopUp() {
    const nom = getAngka(document.getElementById('u-nom').value);
    if (nom <= 0) return toast("⚠️ Isi nominal!");
    showLoading(true);
    
    fetch(`${WEB_APP_URL}?action=requestTopUp&idRider=${curRider.id}&nominal=${nom}&metode=${document.getElementById('u-met').value}`)
    .then(() => { 
        document.getElementById('m-topup').style.display = 'none';
        showLoading(false); 
        toast("🚀 Terkirim!");
        initDashboard();
    })
    .catch(() => showLoading(false));
}

function updateRank(id, val, tipe) { 
    const el = document.getElementById(id);
    if (!el) return; 
    if (!val) { el.innerHTML = ''; return; }
    let warna = (val <= 10) ? (tipe === 'hari' ? 'bg-rank-hari-top' : 'bg-rank-bulan-top') : 'bg-rank-grey';
    el.innerHTML = `<span class="rank-badge ${warna}">#${val}</span>`; 
}

window.onload = function() { 
    const s = localStorage.getItem('kukami_session'); 
    if (s) { curRider = JSON.parse(s); initDashboard(); } 
    document.getElementById('u-nom').addEventListener('input', function(e) { this.value = formatRibuan(this.value); }); 
};
