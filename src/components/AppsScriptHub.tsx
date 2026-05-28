import React, { useState } from 'react';
import { Copy, Check, FileCode, HelpCircle, HardDrive, Database, Sliders, ExternalLink } from 'lucide-react';
import { AppSettings } from '../types';

interface AppsScriptHubProps {
  settings: AppSettings;
  onSaveSettings: (settings: AppSettings) => void;
}

export default function AppsScriptHub({ settings, onSaveSettings }: AppsScriptHubProps) {
  const [copiedScript, setCopiedScript] = useState<string | null>(null);
  const [showGuide, setShowGuide] = useState(true);
  
  // Local temporary settings
  const [gasUrl, setGasUrl] = useState(settings.gasUrl);
  const [employeeName, setEmployeeName] = useState(settings.employeeName);
  const [employeeId, setEmployeeId] = useState(settings.employeeId);
  const [position, setPosition] = useState(settings.position);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const appsScriptCode = `/**
 * Google Apps Script Kode (Code.gs)
 * Menampung input data dari web app Laporan E-Kinerja dan menyimpannya 
 * ke Google Sheet serta mengunduh berkas gambar langsung ke Google Drive Anda.
 * 
 * Struktur Kolom Google Sheet:
 * Kolom A : Tanggal
 * Kolom B : Waktu
 * Kolom C : Uraian
 * Kolom D : Foto (Link File Berkas Di Google Drive)
 * Kolom E : Link (Tautan Pendukung)
 */

function doGet(e) {
  return HtmlService.createHtmlOutput(
    "<h3>Web App E-Kinerja Aktif! silakan gunakan formulir React untuk mengirim data.</h3>"
  ).setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function doPost(e) {
  var response = { status: "error", message: "Gagal memproses data" };
  
  try {
    var rawData = e.postData.contents;
    var data = JSON.parse(rawData);
    
    // Akses Spreadsheet aktif
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    
    var tanggal = data.tanggal || "";
    var waktu = data.waktu || "";
    var uraian = data.uraian || "";
    var linkPendukung = data.link || "";
    var fotoUrl = "";
    
    // Jika ada kiriman foto/file berkas dalam format Base64
    if (data.fotoBase64 && data.fotoName) {
      try {
        var base64Data = data.fotoBase64.split(",")[1] || data.fotoBase64;
        var decoded = Utilities.base64Decode(base64Data);
        
        // Tentukan tipe konten file
        var contentType = "image/jpeg";
        if (data.fotoName.endsWith(".png")) contentType = "image/png";
        if (data.fotoName.endsWith(".pdf")) contentType = "application/pdf";
        
        var blob = Utilities.newBlob(decoded, contentType, data.fotoName);
        
        // Simpan file berkas ke Google Drive akar (atau folder tertentu)
        var file = DriveApp.createFile(blob);
        
        // Atur izin berkas agar bisa diakses public via link
        file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
        
        fotoUrl = file.getUrl();
      } catch (uploadError) {
        fotoUrl = "Gagal simpan file di Drive: " + uploadError.toString();
      }
    } else if (data.fotoUrl) {
      fotoUrl = data.fotoUrl;
    }
    
    // Kirim data ke sheet baru (Baris Terakhir)
    sheet.appendRow([
      tanggal,
      waktu,
      uraian,
      fotoUrl,
      linkPendukung
    ]);
    
    response.status = "success";
    response.message = "Data berhasil disimpan ke Google Sheets!";
    response.fileUrl = fotoUrl;
    
  } catch(error) {
    response.status = "error";
    response.message = error.toString();
  }
  
  // Format balasan CORS mendukung HTTP POST Cross-Origin
  return ContentService.createTextOutput(JSON.stringify(response))
    .setMimeType(ContentService.MimeType.JSON);
}`;

  const handleCopy = (code: string, type: 'gs') => {
    navigator.clipboard.writeText(code);
    setCopiedScript(type);
    setTimeout(() => setCopiedScript(null), 3000);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings({
      gasUrl: gasUrl.trim(),
      employeeName: employeeName.trim(),
      employeeId: employeeId.trim(),
      position: position.trim()
    });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  return (
    <div className="space-y-6" id="apps-script-hub">
      {/* Settings Card */}
      <div className="bg-white rounded-[32px] border border-slate-100 shadow-xl shadow-slate-200/40 overflow-hidden" id="card-integration-settings">
        <div className="bg-indigo-600 px-6 py-5 flex items-center justify-between shadow-lg shadow-indigo-100">
          <div className="flex items-center gap-3 text-white">
            <Sliders size={20} className="text-white animate-pulse" />
            <span className="font-bold tracking-tight text-sm md:text-base">Pengaturan Integrasi</span>
          </div>
          <span className="px-3 py-1 bg-white/15 text-white text-[10px] uppercase rounded-full font-bold tracking-wider">
            Konfigurasi
          </span>
        </div>
        
        <form onSubmit={handleSave} className="p-6 md:p-8 space-y-5">
          <p className="text-xs text-slate-500 leading-relaxed font-medium">
            Konfigurasikan detail nama, jabatan, serta tautan <strong>Web App Google Apps Script</strong> untuk menghubungkan formulir ponsel ini secara langsung dengan Google Sheet milik Anda.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-500 uppercase ml-1">Nama Pegawai</label>
              <input
                type="text"
                placeholder="Ahmad Fauzi, S.Kom"
                value={employeeName}
                onChange={(e) => setEmployeeName(e.target.value)}
                className="w-full px-4 py-3 text-sm rounded-2xl bg-slate-50 border border-transparent focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none text-slate-800 font-medium"
              />
            </div>
            
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-500 uppercase ml-1">NIP / ID Pegawai</label>
              <input
                type="text"
                placeholder="19920315 201804 1 003"
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                className="w-full px-4 py-3 text-sm rounded-2xl bg-slate-50 border border-transparent focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none text-slate-800 font-medium"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-500 uppercase ml-1">Jabatan / Satuan Kerja</label>
            <input
              type="text"
              placeholder="Pranata Komputer Ahli Pertama"
              value={position}
              onChange={(e) => setPosition(e.target.value)}
              className="w-full px-4 py-3 text-sm rounded-2xl bg-slate-50 border border-transparent focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none text-slate-800 font-medium"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-500 uppercase ml-1 flex items-center justify-between">
              <span>Google Apps Script Web App URL</span>
              {gasUrl ? (
                <span className="text-indigo-700 text-[9px] font-bold bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100 flex items-center gap-1">
                  <Database size={9} /> Terhubung Live
                </span>
              ) : (
                <span className="text-amber-700 text-[9px] font-bold bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100">
                  Mode Demo Lokal
                </span>
              )}
            </label>
            <input
              type="url"
              placeholder="https://script.google.com/macros/s/.../exec"
              value={gasUrl}
              onChange={(e) => setGasUrl(e.target.value)}
              className="w-full px-4 py-3 text-xs sm:text-sm font-mono rounded-2xl bg-slate-50 border border-transparent focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none text-slate-705 font-medium"
            />
            <p className="text-[10px] text-slate-400 mt-1 italic ml-1">
              *Kosongkan untuk mengaktifkan simulasi LocalStorage. Isi untuk langsung tersinkronisasi ke Google Sheet Anda.
            </p>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-4 text-center bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl shadow-lg shadow-indigo-150 transition-all focus:outline-none transform active:scale-95"
            >
              {saveSuccess ? '✓ Konfigurasi Berhasil Disimpan!' : 'Simpan Konfigurasi Integrasi'}
            </button>
          </div>
        </form>
      </div>

      {/* Guide Card Toggle */}
      <div className="bg-slate-900 rounded-[32px] border border-slate-800 shadow-xl overflow-hidden" id="card-apps-script-code">
        <div className="px-6 py-5 bg-slate-850/60 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileCode size={20} className="text-yellow-400" />
            <span className="font-bold tracking-tight text-sm md:text-base">Kode Google Apps Script (Code.gs)</span>
          </div>
          <button
            onClick={() => handleCopy(appsScriptCode, 'gs')}
            className="flex items-center gap-1.5 bg-slate-850 hover:bg-slate-800 active:bg-slate-750 text-white px-3.5 py-2 rounded-xl text-xs font-bold transition-all focus:outline-none cursor-pointer"
          >
            {copiedScript === 'gs' ? (
              <>
                <Check size={13} className="text-emerald-400" />
                <span>Tersalin!</span>
              </>
            ) : (
              <>
                <Copy size={13} />
                <span>Salin Kode</span>
              </>
            )}
          </button>
        </div>
        
        <div className="p-0 border-t border-slate-800">
          <pre className="p-5 bg-slate-950 text-slate-350 text-[11px] font-mono overflow-y-auto max-h-[350px] leading-relaxed custom-scrollbar">
            {appsScriptCode}
          </pre>
        </div>
      </div>

      {/* Step by Step Guide */}
      <div className="bg-slate-50 rounded-[24px] border border-slate-200/60 p-6 space-y-4" id="guide-sec">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <HelpCircle size={16} className="text-indigo-600 animate-pulse" />
            <span>Langkah Sukses Panduan Google Sheets</span>
          </h3>
          <button 
            onClick={() => setShowGuide(!showGuide)}
            className="text-xs text-indigo-600 font-bold hover:underline cursor-pointer"
          >
            {showGuide ? 'Sembunyikan' : 'Tampilkan'}
          </button>
        </div>
        
        {showGuide && (
          <ol className="text-xs text-slate-600 space-y-4 list-decimal pl-4">
            <li className="leading-relaxed">
              <strong>Buat Google Spreadsheet Baru</strong> di Google Drive Anda. Beri nama file (contoh: <code>Laporan E-Kinerja Pegawai</code>). Beri nama lembar tab pertama Anda dengan <code>Sheet1</code>.
            </li>
            <li className="leading-relaxed">
              <strong>Atur Judul Kolom di Baris 1</strong> sebagai berikut:
              <div className="grid grid-cols-5 gap-1.5 max-w-lg my-2.5 font-mono text-center text-[10px]">
                <div className="bg-white text-indigo-700 p-2 border border-slate-200 shadow-3xs rounded-xl">Kolom A<br/><strong>Tanggal</strong></div>
                <div className="bg-white text-indigo-700 p-2 border border-slate-200 shadow-3xs rounded-xl">Kolom B<br/><strong>Waktu</strong></div>
                <div className="bg-white text-indigo-700 p-2 border border-slate-200 shadow-3xs rounded-xl">Kolom C<br/><strong>Uraian</strong></div>
                <div className="bg-white text-indigo-700 p-2 border border-slate-200 shadow-3xs rounded-xl">Kolom D<br/><strong>Foto</strong></div>
                <div className="bg-white text-indigo-700 p-2 border border-slate-200 shadow-3xs rounded-xl">Kolom E<br/><strong>Link</strong></div>
              </div>
            </li>
            <li className="leading-relaxed">
              Buka spreadsheet Anda lalu klik menu <strong>Ekstensi (Extensions)</strong> &gt; <strong>Apps Script</strong> di bagian atas.
            </li>
            <li className="leading-relaxed">
              Hapus kode bawaan di dalam editor <code>Code.gs</code>, lalu <strong>salin dan tempelkan (paste)</strong> seluruh Kode Apps Script yang disalin di atas ke dalam editor tersebut. Klik ikon disket untuk Menyimpan.
            </li>
            <li className="leading-relaxed">
              Klik tombol biru <strong>Terapkan (Deploy)</strong> di kanan atas &gt; Pilih <strong>Terapkan baru (New deployment)</strong>.
            </li>
            <li className="leading-relaxed">
              Pada jendela dialog konfigurasi:
              <ul className="list-disc pl-4 mt-2 space-y-1 bg-white p-3 rounded-2xl border border-slate-100 my-2">
                <li>Klik tombol roda gigi &gt; pilih jenis <strong>Aplikasi web (Web app)</strong>.</li>
                <li>Tetapkan Deskripsi (bebas, cth. <code>Integrasi E-Kinerja</code>).</li>
                <li>Jalankan sebagai (Execute as): <strong>Saya (Email Anda / Me)</strong>.</li>
                <li>Siapa yang memiliki akses (Who has access): <strong>Siapa saja (Anyone)</strong>.</li>
              </ul>
            </li>
            <li className="leading-relaxed">
              Klik <strong>Terapkan (Deploy)</strong>. Jika muncul persetujuan keamanan, klik <strong>Berikan Akses (Authorize Access)</strong>, pilih akun Google Anda, klik <strong>Lanjutan (Advanced)</strong> di kiri bawah, pilih tautan <strong>Buka Laporan (Tidak Aman / Go to script)</strong>, lalu klik <strong>Izinkan (Allow)</strong>.
            </li>
            <li className="leading-relaxed">
              Salin URL Aplikasi Web Apps Script yang dihasilkan (biasanya berakhiran <code>/exec</code>) dan <strong>tempelkan (Paste) ke dalam kolom input berlabel Google Apps Script Web App URL</strong> di formulir pengaturan atas aplikasi ponsel Anda!
            </li>
          </ol>
        )}
      </div>
    </div>
  );
}

