const WEB_APP_URL = "ISI_DENGAN_URL_DEPLOYMENT_GOOGLE_BOS_DI_SINI";

<script>
    let warnedOnce = false;
    let curRider = {}, masterTarif = [], cart = [], pendingItem = null, curNomStr = "0";

    // UTILS
    const getFingerprint = () => localStorage.getItem('kukami_fp') || (() => { let id = 'ID-' + Math.random().toString(36).substr(2, 9).toUpperCase(); localStorage.setItem('kukami_fp', id); return id; })();
    const formatRibuan = (v) => v.toString().replace(/\D/g, "").replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    const getAngka = (v) => Number(v.toString().replace(/\./g, ""));
    const toast = (m) => { const c = document.getElementById('toast-container'); const d = document.createElement('div'); d.className = 'toast'; d.innerHTML = m; c.appendChild(d); setTimeout(() => d.remove(), 2500); };
    const showLoading = (s) => document.getElementById('loader').style.display = s ? 'flex' : 'none';

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

  fetch(`${WEB_APP_URL}?action=login&user=${user}&pin=${pin}&fp=${fp}&ua=${ua}`)
    .then(res => res.json())
    .then(res => {
      showLoading(false); 
      if(res.status === "success") { 
        curRider = res.rider; 
        localStorage.setItem('kukami_session', JSON.stringify(curRider)); 
        initDashboard(); 
      } else alert("Akses Ditolak!"); 
    })
    .catch(() => { showLoading(false); alert("Koneksi Gagal!"); });
}

    // DASHBOARD DATA (SMART-SHEET ENGINE) - FULL VERSION
    function initDashboard() {
      document.getElementById('p-login').style.display = 'none'; 
      document.getElementById('app-content').style.display = 'block';
      showLoading(true);
      
     fetch(`${WEB_APP_URL}?action=getDashboard&id=${curRider.id}`)
    .then(res => res.json())
    .then(res => {
      showLoading(false);
      if(!res) return;

        // 1. Logic Icon Performa (Opsi 2)
        // --- LOGIKA MAPPING ICON + ANIMASI ---
         perfMap = {
          "TOP PERFORM": { icon: "💎", class: "anim-diamond" },
          "TOP PERFORMER": { icon: "💎", class: "anim-diamond" },
          "PERFORM": { icon: "🛡️", class: "" }, // Stabil, tidak perlu animasi
          "PERFORMER": { icon: "🛡️", class: "" },
          "UNDERPERFORM": { icon: "🚨", class: "anim-red" },
          "UNDERPERFORMER": { icon: "🚨", class: "anim-red" }
        };

         statusRider = res.kelas ? res.kelas.toUpperCase().trim() : "";
         dataPerf = perfMap[statusRider] || { icon: "👤", class: "" };

        // Tampilkan dengan class animasi yang sesuai
         badgeHtml = `<span class="perf-icon ${dataPerf.class}">${dataPerf.icon}</span>`;
        document.getElementById('r-nama').innerHTML = `${curRider.nama} ${badgeHtml}`;
        
        // 3. TAMPILKAN SALDO & FOTO
        document.getElementById('r-saldo').innerText = "Rp " + Number(res.saldo || 0).toLocaleString();
        if(res.foto) document.getElementById('r-foto').src = res.foto;
        
        // 4. UPDATE STATS
        document.getElementById('h-total').innerText = res.stats.hari.total;
        document.getElementById('h-on').innerText = res.stats.hari.on;
        document.getElementById('h-off').innerText = res.stats.hari.off;
        document.getElementById('b-total').innerText = res.stats.bulan.total;
        document.getElementById('b-on').innerText = res.stats.bulan.on;
        document.getElementById('b-off').innerText = res.stats.bulan.off;
        
        // 5. UPDATE RANKING STABILO
        if (typeof updateRank === 'function') {
          updateRank('rk-h-on', res.stats.hari.rank_on, 'hari');
          updateRank('rk-h-off', res.stats.hari.rank_off, 'hari');
          updateRank('rk-on', res.stats.bulan.rank_on, 'bulan');
          updateRank('rk-off', res.stats.bulan.rank_off, 'bulan');
        }

        // 6. RENDER RIWAYAT & TARIF (DIPASTIKAN MUNCUL)
        masterTarif = res.listTarif || []; 
        if (typeof renderRiwayat === 'function') {
          renderRiwayat(res.riwayat);
        }
        
         cats = [...new Set(masterTarif.map(x => x.kategori))];
        if (cats.length > 0) {
          document.getElementById('cat-list').innerHTML = cats.map(cat => 
            `<div class="chip" onclick="renderGrid('${cat}')">${cat}</div>`).join('');
          if (typeof renderGrid === 'function') renderGrid(cats[0]);
        }

      }).getDashboardData(curRider.id);
    }


    // NUMPAD
    function pressNum(v) { if (v === 'C') curNomStr = "0"; else if (v === '⌫') curNomStr = curNomStr.length > 1 ? curNomStr.slice(0, -1) : "0"; else { if (curNomStr === "0") curNomStr = v; else curNomStr += v; } document.getElementById('m-nom').value = "Rp " + formatRibuan(curNomStr); }

    // TARIF GRID
    function renderGrid(cat) { 
       f = masterTarif.filter(x => x.kategori === cat); 
      document.getElementById('grid-list').innerHTML = f.map(i => `
        <div class="service-card" onclick="hitService('${i.layanan}', ${i.nominal}, ${i.potongan})">
          <b>${i.layanan}</b><span>Rp ${Number(i.nominal).toLocaleString()}</span>
        </div>`).join(''); 
    }

  // --- UPDATE: Fungsi Hit Service dengan Logika Bypass HP ADMIN ---
function hitService(ket, nom) { 
   ketUpper = ket.toUpperCase();
  
  // Cari data asli di masterTarif untuk mendapatkan nilai potongan
   itemData = masterTarif.find(t => t.layanan.toUpperCase() === ketUpper);
   pot = itemData ? itemData.potongan : 0;

  // RULE KHUSUS HP ADMIN (Paksa Nominal 10.000 dan Potongan 20%)
  let nominalFix = (ketUpper.includes("HP ADMIN")) ? 10000 : nom;
  let potonganFix = (ketUpper.includes("HP ADMIN")) ? 0.2 : pot;

  pendingItem = { 
    ket: ketUpper, 
    nominal: nominalFix, 
    qty: 1, 
    potongan: potonganFix 
  }; 
  
  if (ketUpper.includes("HP ADMIN")) {
    // BYPASS: Langsung kirim sebagai ONLINE
    finalProcess('Online', [pendingItem]); 
  } else {
    // NORMAL: Masuk keranjang
    executeAddToCart(); 
  }
}

    function openKetManual() { if(getAngka(curNomStr) <= 0) return toast("⚠️ Isi Nominal!"); document.getElementById('m-ket-manual').style.display = 'block'; }

    function submitKetManual() {
       inputKet = document.getElementById('m-input-ket');
       ketRaw = inputKet.value.trim();
       ket = ketRaw.toLowerCase();
      if (!ketRaw) return toast("⚠️ Isi keterangan belanja!");
      document.getElementById('m-ket-manual').style.display = 'none';

      // HP-LOCK LOGIC
      if (ket === "hp admin") {
        pendingItem = { ket: "HP ADMIN", nominal: 10000, qty: 1, potongan: 0.2 };
        executeAddToCart();
      } else {
         isRev = ["ongkir", "ongkos", "tarif", "tarip", "fee", "jasa"].some(k => ket.includes(k));
        pendingItem = { ket: ketRaw.toUpperCase(), nominal: getAngka(curNomStr), qty: 1, potongan: isRev ? 0.2 : 0 };
        if (isRev) {
          document.getElementById('confirm-msg').innerHTML = "Layanan '" + ketRaw + "' memotong komisi 20%.";
          document.getElementById('m-confirm').style.display = 'block';
        } else { executeAddToCart(); }
      }
      inputKet.value = "";
    }

    function executeAddToCart() {
      document.getElementById('m-confirm').style.display = 'none';
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
    function showCart() { 
  document.getElementById('m-cart').style.display = 'block'; 
  renderCart(); 
  setTimeout(cekValidasiQty, 300); 
}
    function tutupKeranjang() { document.getElementById('m-cart').style.display = 'none'; }
    function closeConfirm() { document.getElementById('m-confirm').style.display = 'none'; pendingItem = null; }

    // --- UPDATE: Fungsi Final Process agar bisa menerima data Bypass ---
// Contoh untuk Final Process
function finalProcess(tipe, overrideItems) {
  const itemsToSubmit = overrideItems || cart;
  if (itemsToSubmit.length === 0) return toast("⚠️ Keranjang kosong!");
  showLoading(true);

  const payload = { 
    idRider: curRider.id, 
    namaRider: curRider.nama,
    items: itemsToSubmit, 
    tipe: tipe, 
    deviceInfo: navigator.userAgent 
  };

  fetch(`${WEB_APP_URL}?action=saveTrx&data=${encodeURIComponent(JSON.stringify(payload))}`)
    .then(res => res.json())
    .then(res => {
      showLoading(false);
      toast("✅ Berhasil!");
      if (!overrideItems) { cart = []; renderCart(); }
      initDashboard();
      showStruk(res, payload.items);
    });
}

    // STRUK - FINAL VERSION WITH Rp DETAIL
    function showStruk(res, items) {
      document.getElementById('s-inv').innerText = res.nota; // Sudah tidak bold
      document.getElementById('s-rider').innerText = curRider.nama; // Sudah tidak bold
      
      // Logika Penentuan Tanggal & Waktu
      let raw = res.waktu || "";
      let clean = raw.replace(/WIB/g, "").trim(); 
      let finalWaktu = "";
      
      if (clean.includes("/") || clean.includes("-")) {
        finalWaktu = clean.replace(" ", " | ") + " WIB";
      } else {
        let d = new Date();
        let opsi = { day: 'numeric', month: 'long', year: 'numeric' };
        let tglSekarang = d.toLocaleDateString('id-ID', opsi); 
        finalWaktu = tglSekarang + " | " + clean + " WIB";
      }
      
      document.getElementById('s-tgl').innerText = finalWaktu; // Sudah tidak bold
      
      // Render Item dengan "Rp" di setiap nominalnya
      let h = ''; 
      items.forEach(i => { 
        h += `<div style="margin-bottom:10px; font-family: 'Inter', sans-serif;">
                <div style="display:flex; justify-content:space-between; font-weight:bold; color:#000;">
                  <span>${i.ket}</span>
                  <span>Rp ${(i.nominal*i.qty).toLocaleString()}</span> </div>
                <div style="font-size:10px; color:#666;">${i.qty} x Rp ${i.nominal.toLocaleString()}</div> </div>`; 
      });
      
      document.getElementById('s-items').innerHTML = h; 
      document.getElementById('s-total').innerText = "Rp " + res.total.toLocaleString(); 
      document.getElementById('m-struk').style.display = 'block';
    }

    function printStruk() { html2canvas(document.getElementById("struk-area")).then(canvas => { const link = document.createElement('a'); link.download = 'STRUK_KUKAMI.png'; link.href = canvas.toDataURL(); link.click(); }); }
    
    async function shareStruk() {
      const area = document.getElementById('struk-area'); showLoading(true);
      try {
        const canvas = await html2canvas(area, { scale: 2 });
        canvas.toBlob(async (blob) => {
          const file = new File([blob], 'Struk_KUKAMI.png', { type: 'image/png' });
          if (navigator.share) { await navigator.share({ files: [file], text: '*KUKAMI DELIVERY*\nBukti transaksi berhasil.', title: 'Struk KUKAMI' }); } 
          else { toast("⚠️ Browser tidak dukung share."); }
          showLoading(false);
        });
      } catch (err) { showLoading(false); toast("⚠️ Gagal."); }
    }

    function closeStruk() { document.getElementById('m-struk').style.display = 'none'; initDashboard(); }

    // RIWAYAT
    function renderRiwayat(data) {
      let h = '', lastD = '';
      if (!data || !data.length) return document.getElementById('list-riwayat').innerHTML = '<div style="padding:30px; text-align:center; color:#888;">Belum ada riwayat</div>';
      data.forEach(i => {
        if(i.tglDisplay !== lastD) { h += `<div class="date-separator"><span>${i.tglDisplay}</span><div class="date-line"></div></div>`; lastD = i.tglDisplay; }
        let tClass = i.tipe.toLowerCase();
        if (i.ket.toUpperCase().includes("HP ADMIN")) tClass = "hp";
        if (i.tipe.toUpperCase() === "TOPUP") tClass = "topup";
        h += `<div class="item-r"><div style="flex: 1; padding-right: 10px; font-size: 10px;"><div style="color: #888; margin-bottom: 3px;">${i.jam} | <span style="font-weight: bold; color: #333;">${i.id}</span></div><div style="color: #333; margin-bottom: 5px; line-height: 1.3;">${i.ket}</div><div><span class="hl-tag hl-${tClass}">${i.tipe}</span></div></div><div style="text-align: right; min-width: 85px; padding-top: 2px;"><span style="color: var(--maroon); font-weight: bold; font-size: 12px;">Rp ${Number(i.nom).toLocaleString()}</span></div></div>`;
      });
      document.getElementById('list-riwayat').innerHTML = h;
    }

    function saveTopUp() {
      const nom = getAngka(document.getElementById('u-nom').value);
      if (nom <= 0) return toast("⚠️ Isi nominal!");
      document.getElementById('m-topup').style.display = 'none'; showLoading(true);
      google.script.run.withSuccessHandler(() => { initDashboard(); showLoading(false); toast("🚀 Terkirim!"); }).requestTopUp({ idRider: curRider.id, nominal: nom, metode: document.getElementById('u-met').value });
    }

    function logout() { if(confirm("Logout?")) { localStorage.clear(); location.reload(); } }

    window.onload = function() { 
      const s = localStorage.getItem('kukami_session'); 
      if (s) { curRider = JSON.parse(s); initDashboard(); } 
      document.getElementById('u-nom').addEventListener('input', function(e) { this.value = formatRibuan(this.value); }); 
    };

   function cekValidasiQty() {
  // 1. Hitung total semua layanan Ongkir di keranjang
  let listOngkir = cart.filter(i => i.ket.toLowerCase().includes("ongkir"));
  let totalQtyOngkir = listOngkir.reduce((a, b) => a + b.qty, 0);

  // 2. Cari layanan selain Parkir/Tambah Tempat yang Qty-nya > 1
  let qtyViolators = cart.filter(i => {
    let k = i.ket.toLowerCase();
    return i.qty > 1 && !k.includes("parkir") && !k.includes("tambah tempat");
  });

  // 3. Tentukan apakah ada kondisi yang harus diperingatkan
  let doubleOngkir = totalQtyOngkir > 1;
  let missingOngkir = totalQtyOngkir === 0;
  let hasQtyViolation = qtyViolators.length > 0;

  if (doubleOngkir || missingOngkir || hasQtyViolation) {
    const alertModal = document.getElementById('m-alert');
    const content = alertModal.querySelector('.m-content');

    // Desain Modern Clean
    content.style.padding = "30px 20px";
    content.style.borderRadius = "24px";
    content.style.border = "none";

    let htmlBody = "";
    if (missingOngkir) htmlBody += `<b style="color:var(--navy);">❌ Layanan ONGKIR belum ada!</b><br>`;
    if (doubleOngkir) htmlBody += `<b style="color:var(--maroon);">⚠️ ONGKIR lebih dari 1 detected!</b> (Total: ${totalQtyOngkir})<br>`;
    if (hasQtyViolation) htmlBody += `<b style="color:var(--maroon);">⚠️ Qty Layanan > 1:</b> ${qtyViolators.map(v => v.ket).join(', ')}<br>`;

    content.innerHTML = `
      <div style="font-size: 50px; margin-bottom: 15px;">⚠️</div>
      <h3 style="margin: 0 0 10px 0; color: #333; font-family: 'Montserrat', sans-serif; font-weight: 900; font-size: 18px;">CEK KERANJANG!</h3>
      <div style="color: #666; font-size: 13px; line-height: 1.6; margin-bottom: 25px;">
        ${htmlBody}
        <br>Mohon pastikan kembali pesanan Anda sebelum lanjut.
      </div>
      <button class="btn" onclick="tutupAlert()" style="background: var(--maroon); border-radius: 12px; font-size: 14px; letter-spacing: 1px;">SAYA MENGERTI</button>
    `;

    alertModal.style.display = 'block';
  }
}

// FUNGSI UNTUK MENUTUP MODAL NOTIFIKASI
    function tutupAlert() {
  document.getElementById('m-alert').style.display = 'none';
}

// TARUH INI DI PALING BAWAH SCRIPT (DI LUAR FUNGSI LAIN)
function updateRank(id, val, tipe) { 
  const el = document.getElementById(id);
  if (!el) return; 
  
  // Jika nilai rank kosong, nol, atau undefined, bersihkan tampilannya
  if (!val || val == 0 || val == "") { 
    el.innerHTML = ''; 
    return; 
  }
  
  // Ambil class sesuai CSS Stabilo yang Bos punya
  let warna = (val <= 10) ? (tipe === 'hari' ? 'bg-rank-hari-top' : 'bg-rank-bulan-top') : 'bg-rank-grey';

  // Cetak balutan stabilo
  el.innerHTML = `<span class="rank-badge ${warna}">#${val}</span>`; 
}

  </script>
