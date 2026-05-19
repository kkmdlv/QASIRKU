/**
* KUKAMI ENGINE v2.5 - PRODUCTION STABLE
* UPDATE: AUTO-CONVERT FOTO DRIVE, ANTI-FRAUD RATING, & REKAP NAMA RIDER
*/

const SS = SpreadsheetApp.getActiveSpreadsheet();
const RIDER_SHEET = "DB_DASHBOARD";

function doGet(e) {
 var url = ScriptApp.getService().getUrl();
  if (e && e.parameter.page === "rating") {
   var tmp = HtmlService.createTemplateFromFile('Rating');
   tmp.webAppUrl = url;
  
   // Tangkap parameter dari URL dan suapkan langsung ke HTML (Scriptlet)
   tmp.inv = e.parameter.inv ? e.parameter.inv : "-";
   tmp.rider = e.parameter.rider ? e.parameter.rider : "";
  
   return tmp.evaluate()
     .setTitle('KUKAMI - Rating Layanan')
     .addMetaTag('viewport', 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no')
     .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
 }
  var tmp = HtmlService.createTemplateFromFile('Index');
 tmp.webAppUrl = url;
 return tmp.evaluate()
   .setTitle('KUKAMI')
   .addMetaTag('viewport', 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no')
   .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function getMonthlyLogSheet() {
 const monthNames = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
 const now = new Date();
 const sheetName = "Log_" + monthNames[now.getMonth()] + "_" + now.getFullYear();
 let sheet = SS.getSheetByName(sheetName);
 if (!sheet) {
   sheet = SS.insertSheet(sheetName);
   const headers = ["INVOICE", "TANGGAL", "ID_RIDER", "NAMA_RIDER", "KETERANGAN", "DEVICE_INFO", "TIPE_TRX", "NOMINAL", "STATUS", "POTONGAN"];
   sheet.getRange(1, 1, 1, headers.length).setValues([headers]).setBackground("#800000").setFontColor("#fff").setFontWeight("bold");
 }
 return sheet;
}

function loginRider(u, p, d, t) {
 const sheet = SS.getSheetByName(RIDER_SHEET);
 const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
   if (data[i][1].toString().trim().toLowerCase() === u.trim().toLowerCase() && data[i][2].toString().trim() === p.trim()) {
    
     // Ambil Device ID (Fingerprint) yang tersimpan di Kolom E (Indeks 4)
     var savedDeviceId = data[i][4] ? data[i][4].toString().trim() : "";

     // Jika masih kosong (belum pernah login) ATAU cocok dengan HP saat ini
     if (savedDeviceId === "" || savedDeviceId === d) {
      
       // Kunci perangkat jika sebelumnya masih kosong
       if (savedDeviceId === "") {
         sheet.getRange(i + 1, 5).setValue(d);
         sheet.getRange(i + 1, 6).setValue(t);
       }
      
       // 🌟 INJEKSI TAHAP 5: PENGAMBILAN DATA STATISTIK & RANKING
       // ⚠️ PENTING: Silakan ganti angka indeks [23], [24], dst di bawah ini 
       // sesuai dengan posisi kolom asli statistik di DB_DASHBOARD Bos.
       // (Ingat hitungannya: A=0, B=1, C=2 ... W=22, X=23, Y=24, Z=25 dst)
       var dataStat = {
         hariIniTrip: data[i][31] || 0,     // Kolom Total Trip Harian
         hariIniRank: data[i][24] || "-",   // Kolom Rank Total Harian
         hariIniOn: data[i][17] || 0,       // Kolom Trip ON Harian
         hariIniRankOn: data[i][25] || "-", // Kolom Rank ON Harian
         hariIniOff: data[i][18] || 0,      // Kolom Trip OFF Harian
         hariIniRankOff: data[i][26] || "-",// Kolom Rank OFF Harian
         
         bulanIniTrip: data[i][32] || 0,    // Kolom Total Trip Bulanan
         bulanIniRank: data[i][27] || "-",  // Kolom Rank Total Bulanan
         bulanIniOn: data[i][19] || 0,      // Kolom Trip ON Bulanan
         bulanIniRankOn: data[i][28] || "-",// Kolom Rank ON Bulanan
         bulanIniOff: data[i][20] || 0,     // Kolom Trip OFF Bulanan
         bulanIniRankOff: data[i][29] || "-"// Kolom Rank OFF Bulanan
       };

       return {
         status: "success",
         rider: {
           id: data[i][0],
           nama: data[i][1],
           rekening: data[i][22] || "" // 🌟 Rekening aman tidak tersentuh
         },
         // 🌟 Menitipkan paket statistik ke dalam koper pengiriman ke HP Rider
         dataStatistikKukami: dataStat 
       };
     } else {
       // DEVICE BERBEDA! Tendang keluar.
       return { status: "device_locked" };
     }
   }
 }
 return { status: "error" };
}

function getDashboardData(id) {
 const sheet = SS.getSheetByName(RIDER_SHEET);
 const data = sheet.getDataRange().getValues();
 const rIdx = data.findIndex(r => r[0].toString().trim() === id.toString().trim());
 if (rIdx === -1) return null;
 const row = data[rIdx];
  const logSheet = getMonthlyLogSheet();
 const logs = logSheet.getDataRange().getValues();
 const riwayat = logs.filter(r => r[2].toString().trim() === id.toString().trim())
   .reverse().slice(0, 20).map(r => ({
     id: r[0],
     jam: Utilities.formatDate(new Date(r[1]), "GMT+7", "HH.mm") + " WIB",
     tglDisplay: Utilities.formatDate(new Date(r[1]), "GMT+7", "dd MMM yyyy"),
     ket: r[4], tipe: r[6], nom: r[7],
     status: r[8] ? r[8].toString().trim() : "OK" // 🌟 SUNTIKAN EMAS: Menyertakan kolom STATUS
   }));

 return {
   kelas: row[21],
   saldo: row[16],
   foto: row[3], 
   sapaan: row[23],
   rekening: row[22] || "", // 🌟 PERBAIKAN EMAS: Kolom W (Indeks 22) WAJIB dikirim
   stats: {
     // 🌟 PENYEMPURNAAN TAHAP 5: Menambahkan rank_tot agar terbaca di Widget UI Maroon-Gold
     hari: { 
       total: Number(row[17]) + Number(row[18]), 
       rank_tot: row[24] || "-", // ⬅️ SUNTIKAN RANKING TOTAL HARIAN
       on: row[17], 
       off: row[18], 
       rank_on: row[25], 
       rank_off: row[26] 
     },
     bulan: { 
       total: Number(row[19]) + Number(row[20]), 
       rank_tot: row[27] || "-", // ⬅️ SUNTIKAN RANKING TOTAL BULANAN
       on: row[19], 
       off: row[20], 
       rank_on: row[28], 
       rank_off: row[29] 
     }
   },
   riwayat: riwayat,
   listTarif: SS.getSheetByName("Tarif").getDataRange().getValues().slice(1).map(r => ({ kategori: r[0], layanan: r[1], nominal: r[2], potongan: r[3] || 0 }))
 };
}

function simpanTransaksi(p) {
 const logSheet = getMonthlyLogSheet();
 const dbSheet = SS.getSheetByName(RIDER_SHEET);
 const dbData = dbSheet.getDataRange().getValues();
 const rIdx = dbData.findIndex(r => r[0].toString() === p.idRider.toString());
 const namaRider = rIdx > -1 ? dbData[rIdx][1] : "Unknown";

 const logData = logSheet.getDataRange().getValues();
 const totalTrxRider = logData.filter(row => row[2].toString() === p.idRider.toString()).length;
 const nextSeq = (totalTrxRider + 1).toString().padStart(3, '0');

 const idStr = p.idRider.toString();
 const last3Id = idStr.replace(/\D/g, "").slice(-3).padStart(3, '0');
 const mm = ("0" + (new Date().getMonth() + 1)).slice(-2);
 const inv = "KKM-" + last3Id + mm + nextSeq;

 let tot = 0, pot = 0, dsk = [];
 p.items.forEach(i => {
   let sub = Number(i.nominal) * Number(i.qty);
   tot += sub;
   pot += (sub * (i.potongan || 0));
   
   // 🌟 GASS OPSI 1: Menyimpan teks beserta Harga Satuan Asli dengan pemisah "|"
   dsk.push(i.qty + "x " + i.ket + "|" + i.nominal);
 });

 logSheet.appendRow([inv, new Date(), p.idRider, namaRider, dsk.join(", "), p.deviceInfo, p.tipe, tot, "OK", pot]);
 return {
   status: "success",
   nota: inv,
   total: tot,
   waktu: Utilities.formatDate(new Date(), "GMT+7", "HH.mm") + " WIB"
 };
}

function requestTopUp(p) {
 const logSheet = getMonthlyLogSheet();
 const dbSheet = SS.getSheetByName(RIDER_SHEET);
 const dbData = dbSheet.getDataRange().getValues();
 const rIdx = dbData.findIndex(r => r[0].toString() === p.idRider.toString());
 const namaRider = rIdx > -1 ? dbData[rIdx][1] : "Unknown";

 const mm = ("0" + (new Date().getMonth() + 1)).slice(-2);
 const inv = "TOP-" + p.idRider.toString().slice(-3) + mm + Date.now().toString().slice(-4);
  logSheet.appendRow([inv, new Date(), p.idRider, namaRider, "TOP UP VIA " + p.metode, p.deviceId, "TOPUP", p.nominal, "PENDING", 0]);
 return { status: "success" };
}

function getProfileRiderForRating(idRider) {
 try {
   if (!idRider || idRider === "") return null;
  
   var sheet = SS.getSheetByName(RIDER_SHEET);
   var data = sheet.getDataRange().getValues();
   var searchId = idRider.toString().replace(/\s+/g, '').toLowerCase();
  
   for (var i = 1; i < data.length; i++) {
     if (!data[i][0]) continue;
    
     var dbId = data[i][0].toString().replace(/\s+/g, '').toLowerCase();
    
     if (dbId === searchId) {
       var namaRider = data[i][1] ? data[i][1].toString().trim() : "Rider KUKAMI";
       var fotoRaw = data[i][3] ? data[i][3].toString().trim() : ""; // Ambil Kolom D
      
       // 🌟 JALUR BYPASS: Hanya konversi jika formatnya valid link Drive lama
       if (fotoRaw.indexOf("drive.google.com") !== -1 && fotoRaw.indexOf("id=") === -1) {
         var idMatch = fotoRaw.match(/[-\w]{25,}/);
         if (idMatch) {
           fotoRaw = "https://drive.google.com/uc?export=view&id=" + idMatch[0];
         }
       }
      
       return {
         nama: namaRider,
         foto: fotoRaw, // Lempar ke Rating.html dengan aman
         savedFp: data[i][4] || ""
       };
     }
   }
 } catch(e) {
   return null;
 }
 return null;
}

function simpanUlasanKonsumen(p) {
 try {
   let ratingSheet = SS.getSheetByName("DB_RATING");
   if (!ratingSheet) {
     ratingSheet = SS.insertSheet("DB_RATING");
     // 🌟 DIUBAH: Header tabel baru, menambahkan kolom NAMA RIDER di kolom ke-4
     ratingSheet.appendRow(["TANGGAL", "INVOICE", "ID RIDER", "NAMA RIDER", "RATING", "ULASAN"]);
     ratingSheet.getRange(1, 1, 1, 6).setFontWeight("bold").setBackground("#800000").setFontColor("#fff");
   }
  
   const dataRating = ratingSheet.getDataRange().getValues();
   for (let i = 1; i < dataRating.length; i++) {
     if (dataRating[i][1].toString().trim() === p.invoice.trim()) return "duplicate";
   }

   // Ambil data profil riil untuk divalidasi silang nama & sidik jari HP
   var profilRider = getProfileRiderForRating(p.riderId);
   var namaRiderAsli = profilRider ? profilRider.nama : "UNKNOWN RIDER";
   var tokenFpRider = profilRider ? profilRider.savedFp : "";

   // 🛡️ SECURITY KUNCIAN: Jika Fingerprint browser HP pengisi rating SAMA PERSIS dengan HP Rider pembuat nota, BLOKIR!
   if (tokenFpRider !== "" && tokenFpRider === p.consumerFp) {
     return "fraud_blocked";
   }

   // 🌟 SEKARANG STRUKTUR MASUK MENAMPILKAN NAMA RIDER SECARA LENGKAP DI KOLOM 4
   ratingSheet.appendRow([new Date(), p.invoice, p.riderId, namaRiderAsli, Number(p.rating), p.ulasan]);
   return "success";
 } catch(e) { return "error"; }
}

/**
* 🌟 FITUR PREMIUM KUKAMI: AJUKAN PEMBATALAN STRUK (SEMI-TERKUNCI)
* Berfungsi mengubah status di Log Bulanan menjadi PENDING CANCEL untuk di-approve Admin di Sheets.
*/
function ajukanPembatalanStrukRider(idStruk, idRider, alasanRider) {
 try {
   if (!idStruk || !idRider || !alasanRider) {
     return { status: "error", message: "Data tidak lengkap!" };
   }
  
   // 1. Kunci lembar log bulanan yang aktif digunakan otomatis
   var logSheet = getMonthlyLogSheet();
   var data = logSheet.getDataRange().getValues();
  
   var cleanStrukId = idStruk.toString().trim().toLowerCase();
   var cleanRiderId = idRider.toString().trim().toLowerCase();
  
   // 2. Lakukan looping pencarian data dari baris paling bawah (transaksi terbaru)
   for (var i = data.length - 1; i >= 1; i--) {
     var dbStrukId = data[i][0] ? data[i][0].toString().trim().toLowerCase() : "";
     var dbRiderId = data[i][2] ? data[i][2].toString().trim().toLowerCase() : "";
    
     if (dbStrukId === cleanStrukId) {
       // KEAMANAN TINGKAT 1: Pastikan Rider yang mau cancel adalah pemilik asli struk tersebut!
       if (dbRiderId !== cleanRiderId) {
         return { status: "error", message: "Akses Ditolak! Anda bukan pemilik resmi struk transaksi ini." };
       }
      
       var statusSaatIni = data[i][8] ? data[i][8].toString().trim() : "";
      
       // KEAMANAN TINGKAT 2: Cek jika struk sudah pernah di-cancel sebelumnya
       if (statusSaatIni.indexOf("CANCEL") !== -1) {
         return { status: "error", message: "Struk transaksi ini sudah dalam status pembatalan/batal." };
       }
      
       // 3. Eksekusi suntikan data ke Kolom I (Indeks ke-8 adalah kolom STATUS)
       var teksStatusBaru = "PENDING CANCEL: " + alasanRider.toString().replace(/"/g, "'");
       logSheet.getRange(i + 1, 9).setValue(teksStatusBaru);
      
       return {
         status: "success",
         message: "Pengajuan pembatalan Struk #" + idStruk + " berhasil dikirim ke sistem. Silakan hubungi Admin untuk persetujuan pengembalian saldo & penghapusan trip!"
       };
     }
   }
  
   return { status: "error", message: "ID Struk tidak ditemukan di dalam log database bulan ini." };
  
 } catch (e) {
   return { status: "error", message: "Kesalahan Server: " + e.toString() };
 }
}

/**
 * 🌟 AUTOMATION BACKEND KUKAMI FIXED WORKFLOW
 * Mengunci Saldo & Trip Tetap Utuh Saat Pending, Dan Baru Refund Pas Admin Approve
 */
function onEdit(e) {
  var range = e.range;
  var sheet = range.getSheet();
  var sheetName = sheet.getName();
  
  // 1. Gembok Sensor: Hanya aktif di Sheet Log Bulanan (Log_xxx)
  if (sheetName.indexOf("Log_") === 0) {
    var row = range.getRow();
    var col = range.getColumn();
    
    // 2. Sensor Kolom: Hanya aktif jika Admin mengubah KOLOM I (Kolom nomor 9 - STATUS)
    if (col === 9) { 
      var valueI = range.getValue().toString().trim().toUpperCase();
      
      // 3. Eksekusi Hanya Jika Admin Mengetik "CANCELED" Sebagai Tanda Approval
      if (valueI === "CANCELED") {
        var oldStatusI = e.oldValue ? e.oldValue.toString().trim() : "";
        var alasanMurni = "";
        
        // Ambil intisari alasan lama dari Rider
        if (oldStatusI.toUpperCase().indexOf("PENDING CANCEL:") !== -1) {
          alasanMurni = oldStatusI.substring(15).trim();
        } else if (oldStatusI.toUpperCase().indexOf("PENDING CANCEL") !== -1) {
          alasanMurni = oldStatusI.substring(14).trim();
        } else {
          alasanMurni = oldStatusI;
        }
        
        if (alasanMurni === "" || alasanMurni.toUpperCase() === "CANCELED") {
          alasanMurni = "STRUK DIBATALKAN ADMIN";
        }
        
        // Targetkan Kolom G (TIPE_TRX - Kolom nomor 7)
        var cellG = sheet.getRange(row, 7);
        var currentG = cellG.getValue().toString().trim().toUpperCase();
        
        // 🔒 DOUBLE-LOCK SECURITY: Mencegah eksekusi berulang jika admin tidak sengaja klik dua kali
        if (currentG === "ONLINE" || currentG === "OFFLINE" || currentG === "HP ADMIN") {
          
          // AKSYON 1: Ubah Tipe Transaksi di Kolom G menjadi Alasan (Trip Rider Berkurang)
          cellG.setValue(alasanMurni.toUpperCase());
          
          // AKSYON 2: Netralkan Kolom J (POTONGAN - Kolom nomor 10) Menjadi 0 
          // Detik ini juga, Rumus Dashboard akan melihat potongan hilang, dan SALDO RIDER LANGSUNG REFUND REAL-TIME!
          var cellJ = sheet.getRange(row, 10);
          cellJ.setValue(0); 
        }
      }
    }
  }
}
