# 🎵 AI MUSIC & VOCAL STUDIO (PRO v1.0)
> **100% Free API & Local Audio Processing Studio Engine**  
> Ứng dụng Desktop chuyên nghiệp kết hợp **Electron (UI Glassmorphism Studio)** và **Python Backend (FastAPI, Librosa, Gemini 1.5 Flash, Edge-TTS, Pedalboard/Pydub)**.

---

## 🌟 TÍNH NĂNG CỐT LÕI (CORE FEATURES)

1. **🎚️ Beat & BPM Analyzer (Librosa AI)**:
   - Tải lên / Kéo thả file Beat (`.mp3`, `.wav`, `.flac`, `.ogg`, `.m4a`).
   - Tự động đo và hiển thị chính xác **BPM (Nhịp độ)**, **Tone/Key (C Major, A Minor,...)**, **Thời lượng**.
   - Waveform Canvas Visualizer trực quan với thanh phát nhạc realtime.

2. **✍️ AI Lyricist & Smart Songwriter (Google Gemini 1.5 Flash)**:
   - Viết lời theo chủ đề, thể loại nhạc (*V-Pop Ballad, Rap, R&B, Lofi, EDM...*), tâm trạng và tự động căn số lượng âm tiết theo BPM của beat.
   - Chia 7 phân đoạn chuẩn phòng thu: `[Intro]`, `[Verse 1]`, `[Pre-Chorus]`, `[Chorus]`, `[Verse 2]`, `[Bridge]`, `[Outro]`.

3. **📋 Smart Paste & Export JSON (1-Click)**:
   - Nút **"📋 Dán nhanh JSON từ Clipboard"**: 1-click nhận diện cấu trúc bài hát từ ChatGPT / Claude / Gemini Web.
   - Nút **"📤 Xuất Project JSON"** & **"📥 Nạp file JSON"**: Lưu trữ và chia sẻ project dễ dàng.

4. **🎙️ Neural Vocal Studio & Master Mixing (Edge-TTS & Studio DSP)**:
   - Thư viện giọng hát AI đa dạng: Hoài My (Nữ), Nam Minh (Nam), Jenny, Guy, Christopher (Rap Flow), Nanami (J-Pop), Sun-Hi (K-Pop).
   - Tùy chỉnh Tốc độ hát (Tempo), Cao độ (Pitch Shift), Độ trễ (Vocal Offset).
   - Bàn trộn âm thanh: Volume Beat & Vocal, Reverb không gian, Delay Echo, Studio Compressor, 4 Presets EQ chuyên nghiệp.
   - Xuất file hoàn chỉnh chất lượng cao `.mp3` / `.wav` kèm máy phát đĩa than quay visualizer và nút tải về máy.

---

## 🚀 HƯỚNG DẪN CÀI ĐẶT & SỬ DỤNG NHANH

### Cách 1: Khởi Chạy 1-Click
Chỉ cần nhấp đúp vào file:
```cmd
run_app.bat
```
*(Script sẽ tự động kiểm tra, cài đặt môi trường ảo Python và Electron dependencies nếu chưa có, sau đó mở app ngay lập tức).*

### Cách 2: Tạo Phím Tắt Ngoài Desktop
Nhấp đúp vào file:
```cmd
create_desktop_shortcut.bat
```
*(Một Shortcut "AI Music & Vocal Studio" với icon chuyên nghiệp sẽ xuất hiện trên màn hình Desktop của bạn).*

### Cách 3: Đẩy Mã Nguồn Lên GitHub
Nhấp đúp vào file:
```cmd
git_push.bat
```
*(Tự động add, commit và push lên `https://github.com/HoangKyAnh05/Tool_Music.git`).*

---

## 📁 CẤU TRÚC THƯ MỤC DỰ ÁN

```
Tool_Music/
├── data/
│   ├── uploads/            # Beat audio tải lên
│   ├── vocals/             # File vocal AI sinh ra
│   ├── outputs/            # File bài hát sau khi mix hoàn chỉnh
│   ├── projects/           # File project JSON
│   └── temp/               # File tạm trong quá trình xử lý
├── python_backend/
│   ├── main.py             # FastAPI server (REST endpoints & Static file server)
│   ├── audio_engine.py     # Module đo BPM, Key với Librosa & Studio Mixer
│   ├── ai_lyricist.py      # Tích hợp Gemini 1.5 Flash & Smart Paste JSON parser
│   ├── tts_engine.py       # Module sinh giọng hát AI với Edge-TTS
│   └── requirements.txt    # Danh sách thư viện Python
├── electron_app/
│   ├── package.json        # Cấu hình Electron
│   ├── main.js             # Electron Main Process & Python background spawner
│   ├── preload.js          # IPC Bridge an toàn
│   └── src/
│       ├── index.html      # Giao diện Studio Dark Glassmorphism
│       ├── styles.css      # Hệ thống CSS Studio cao cấp (Visualizer, Faders, VU meters)
│       ├── app.js          # Logic điều khiển toàn bộ ứng dụng
│       └── assets/
│           └── icon.svg    # Icon Studio
├── run_app.bat             # File khởi chạy toàn bộ hệ thống 1-click
├── create_desktop_shortcut.bat # File tạo shortcut Desktop
├── git_push.bat            # File tự động đẩy code lên GitHub
└── README.md
```

---

## 🔑 CẤU HÌNH GOOGLE GEMINI API KEY (MIỄN PHÍ)
1. Truy cập [Google AI Studio](https://aistudio.google.com/app/apikey) và nhấn **Create API Key**.
2. Mở Tab **4. Cài Đặt** trong ứng dụng và dán API Key vào ô cấu hình rồi nhấn **Lưu Cài Đặt**.
*(Lưu ý: Nếu chưa có API Key, bạn vẫn có thể sử dụng tính năng Smart Paste JSON hoặc bộ mẫu lời tích hợp sẵn 100% bình thường).*

---

## 🛠️ CÔNG NGHỆ SỬ DỤNG
- **Frontend / Desktop**: Electron.js, Vanilla JS, Modern CSS Glassmorphism.
- **Backend API**: Python 3.11/3.14, FastAPI, Uvicorn.
- **Audio DSP & AI**: Librosa, SoundFile, Pydub, Pedalboard (Spotify), Edge-TTS, Google Gemini 1.5 Flash.
