/**
 * AI Music & Vocal Studio - Main Frontend Application Logic
 */

const API_BASE = "http://127.0.0.1:8888";

// Application State
const state = {
  beat: {
    file: null,
    serverPath: null,
    url: null,
    bpm: 90,
    key: "C Major",
    duration: 0,
    waveform: []
  },
  lyrics: {
    title: "Bản Tình Ca Mùa Hạ",
    genre: "V-Pop Ballad",
    bpm: 90,
    key: "C Major",
    mood: "Sâu lắng, cảm xúc",
    voice_style: "Nam trầm ấm",
    sections: {
      intro: "",
      verse_1: "",
      pre_chorus: "",
      chorus: "",
      verse_2: "",
      bridge: "",
      outro: ""
    }
  },
  mixer: {
    voice_id: "vi-VN-HoaiMyNeural",
    speed: 0,
    pitch: 0,
    offset_ms: 0,
    beat_vol: 1.0,
    vocal_vol: 1.2,
    reverb: 0.35,
    delay: 0.15,
    compressor: true,
    eq_preset: "warm_vocal"
  },
  recording: {
    mediaRecorder: null,
    audioChunks: [],
    rawBlob: null,
    rawVocalPath: null,
    tunedVocalPath: null,
    isRecording: false,
    timerInterval: null,
    secondsElapsed: 0,
    audioContext: null,
    analyser: null,
    animFrameId: null
  },
  timeline: {
    totalDurationSec: 50.0,
    isPlaying: false,
    playheadSec: 0,
    playInterval: null,
    audioNodes: {},
    tracks: [
      { id: "track_1", name: "Beat Lofi 90 BPM", filepath: "data/uploads/demo_beat_lofi_90bpm.wav", start_time_sec: 0.0, volume: 1.0, pan: 0.0, muted: false, duration_sec: 32.0 },
      { id: "track_2", name: "Sound FX Drop", filepath: "data/uploads/1787303339_diamond_tunes-cinematic-sound-effect-327618.mp3", start_time_sec: 12.0, volume: 0.9, pan: 0.0, muted: false, duration_sec: 8.0 },
      { id: "track_3", name: "Vocal Thu Âm (Micro)", filepath: "", start_time_sec: 4.0, volume: 1.2, pan: 0.0, muted: false, duration_sec: 15.0 },
      { id: "track_4", name: "Giọng Hát AI (Neural)", filepath: "", start_time_sec: 8.0, volume: 1.15, pan: 0.0, muted: false, duration_sec: 20.0 }
    ]
  },
  audioPlayer: new Audio(),
  masterAudioUrl: null
};

// --- DOM Elements ---
const navTabs = document.querySelectorAll(".nav-tab");
const tabContents = document.querySelectorAll(".tab-content");
const toastContainer = document.getElementById("toastContainer");

// Video File Input
const videoFileInput = document.getElementById("videoFileInput");
const btnSelectVideo = document.getElementById("btnSelectVideo");

// Beat Tab Elements
const dropZone = document.getElementById("dropZone");
const beatFileInput = document.getElementById("beatFileInput");
const btnSelectBeat = document.getElementById("btnSelectBeat");
const metricBpm = document.getElementById("metricBpm");
const metricKey = document.getElementById("metricKey");
const metricDuration = document.getElementById("metricDuration");
const metricFilename = document.getElementById("metricFilename");
const beatStatusBadge = document.getElementById("beatStatusBadge");
const waveformCanvas = document.getElementById("waveformCanvas");
const waveformProgress = document.getElementById("waveformProgress");
const btnPlayPauseBeat = document.getElementById("btnPlayPauseBeat");
const playIcon = document.getElementById("playIcon");
const currentTimeEl = document.getElementById("currentTime");
const totalTimeEl = document.getElementById("totalTime");
const beatSeekSlider = document.getElementById("beatSeekSlider");
const beatVolumeSlider = document.getElementById("beatVolumeSlider");

// Lyrics Tab Elements
const songTitleInput = document.getElementById("songTitleInput");
const promptIdeaInput = document.getElementById("promptIdeaInput");
const genreSelect = document.getElementById("genreSelect");
const moodSelect = document.getElementById("moodSelect");
const lyricsBpmInput = document.getElementById("lyricsBpmInput");
const lyricsKeyInput = document.getElementById("lyricsKeyInput");
const btnOptimizeLyrics = document.getElementById("btnOptimizeLyrics");
const btnClearLyrics = document.getElementById("btnClearLyrics");
const btnSmartPaste = document.getElementById("btnSmartPaste");
const btnExportJson = document.getElementById("btnExportJson");
const btnImportJson = document.getElementById("btnImportJson");

// Modal Elements
const smartPasteModal = document.getElementById("smartPasteModal");
const smartPasteInput = document.getElementById("smartPasteInput");
const btnCloseModal = document.getElementById("btnCloseModal");
const btnCancelModal = document.getElementById("btnCancelModal");
const btnApplySmartPaste = document.getElementById("btnApplySmartPaste");

// Mixer Tab Elements
const voiceSelect = document.getElementById("voiceSelect");
const voiceSpeedSlider = document.getElementById("voiceSpeedSlider");
const voicePitchSlider = document.getElementById("voicePitchSlider");
const vocalOffsetSlider = document.getElementById("vocalOffsetSlider");
const valSpeed = document.getElementById("valSpeed");
const valPitch = document.getElementById("valPitch");
const valOffset = document.getElementById("valOffset");
const mixBeatVol = document.getElementById("mixBeatVol");
const mixVocalVol = document.getElementById("mixVocalVol");
const mixReverb = document.getElementById("mixReverb");
const mixDelay = document.getElementById("mixDelay");
const valMixBeatVol = document.getElementById("valMixBeatVol");
const valMixVocalVol = document.getElementById("valMixVocalVol");
const valMixReverb = document.getElementById("valMixReverb");
const valMixDelay = document.getElementById("valMixDelay");
const eqPresetSelect = document.getElementById("eqPresetSelect");
const compressorToggle = document.getElementById("compressorToggle");
const btnStartMixing = document.getElementById("btnStartMixing");
const masterProgressBox = document.getElementById("masterProgressBox");
const masterAudioPlayer = document.getElementById("masterAudioPlayer");
const vinylDisc = document.getElementById("vinylDisc");
const masterSongTitle = document.getElementById("masterSongTitle");
const masterSongSub = document.getElementById("masterSongSub");
const btnDownloadMaster = document.getElementById("btnDownloadMaster");
const masterStatusBadge = document.getElementById("masterStatusBadge");

// Settings Tab Elements
const geminiApiKeyInput = document.getElementById("geminiApiKeyInput");
const btnToggleApiKey = document.getElementById("btnToggleApiKey");
const btnSaveSettings = document.getElementById("btnSaveSettings");
const linkAiStudio = document.getElementById("linkAiStudio");
const defaultVoiceSelect = document.getElementById("defaultVoiceSelect");

// --- Initialization ---
document.addEventListener("DOMContentLoaded", () => {
  setupNavigation();
  setupRefreshButton();
  setupCopyPrompt();
  setupDemoSampleLoaders();
  setupBeatUpload();
  setupVideoExtraction();
  setupStudioRecorder();
  setupAutoTuneControls();
  setupMultiTrackTimeline();
  setupAudioPlayer();
  setupLyricsActions();
  setupSmartPasteModal();
  setupMixerControls();
  setupSettings();
  loadBackendSettings();
  initSampleData();
});

// Refresh Application Button Handler (Khởi động lại toàn bộ app)
function setupRefreshButton() {
  const btnRefresh = document.getElementById("btnRefreshApp");
  const refreshIcon = document.getElementById("refreshIcon");

  if (!btnRefresh) return;

  btnRefresh.addEventListener("click", () => {
    if (refreshIcon) refreshIcon.classList.add("refresh-spinning");
    showToast("🔄 Đang khởi động lại ứng dụng (Reload)...", "info");

    setTimeout(() => {
      if (window.electronAPI && window.electronAPI.reloadApp) {
        window.electronAPI.reloadApp();
      } else {
        window.location.reload();
      }
    }, 250);
  });
}

// Toast notification helper
function showToast(message, type = "info") {
  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `<span>${type === "error" ? "⚠️" : type === "success" ? "✅" : "ℹ️"}</span><span>${message}</span>`;
  toastContainer.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = "0";
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// Navigation Tabs & Workflow Steps
function switchTab(targetId) {
  navTabs.forEach((t) => t.classList.remove("active"));
  tabContents.forEach((c) => c.classList.remove("active"));
  
  const targetNav = document.querySelector(`.nav-tab[data-tab="${targetId}"]`);
  if (targetNav) targetNav.classList.add("active");
  
  const targetContent = document.getElementById(targetId);
  if (targetContent) targetContent.classList.add("active");

  // Sync Workflow Step Bar
  document.querySelectorAll(".step-item").forEach((item) => {
    if (item.getAttribute("data-step") === targetId) {
      item.classList.add("active");
    } else {
      item.classList.remove("active");
    }
  });
}

function setupNavigation() {
  navTabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      const targetId = tab.getAttribute("data-tab");
      switchTab(targetId);
    });
  });

  // Workflow steps bar click
  document.querySelectorAll(".step-item").forEach((step) => {
    step.addEventListener("click", () => {
      const targetId = step.getAttribute("data-step");
      if (targetId) switchTab(targetId);
    });
  });

  // Step 1 -> Step 2
  const btnGoToStep2 = document.getElementById("btnGoToStep2");
  if (btnGoToStep2) {
    btnGoToStep2.addEventListener("click", () => {
      switchTab("tab-lyrics");
      showToast("Bước 2: Hãy soạn lời hoặc dùng nút Copy Prompt cho ChatGPT!", "info");
    });
  }

  // Step 2 -> Step 3
  const btnGoToStep3 = document.getElementById("btnGoToStep3");
  if (btnGoToStep3) {
    btnGoToStep3.addEventListener("click", () => {
      switchTab("tab-mixer");
      showToast("Bước 3: Chọn giọng hát AI và bấm Tạo bài hát & Mix nhạc!", "info");
    });
  }
}

// Setup Copy Prompt for ChatGPT
function setupCopyPrompt() {
  const btnCopyPrompt = document.getElementById("btnCopyChatGptPrompt");
  if (!btnCopyPrompt) return;

  btnCopyPrompt.addEventListener("click", () => {
    const genre = genreSelect.value || "V-Pop Ballad";
    const mood = moodSelect.value || "Sâu lắng, cảm xúc";
    const bpm = parseFloat(lyricsBpmInput.value) || state.beat.bpm || 90;
    const key = lyricsKeyInput.value || state.beat.key || "C Major";
    const idea = promptIdeaInput.value.trim() || "Ký ức ngọt ngào và những ước mơ thời thanh xuân";

    const chatGptPrompt = `Hãy sáng tác một bài hát hoàn chỉnh khớp với các thông số sau:
- Thể loại nhạc: ${genre}
- Nhịp độ (BPM): ${bpm} BPM
- Tone nhạc (Key): ${key}
- Tâm trạng: ${mood}
- Ý tưởng / Chủ đề bài hát: "${idea}"

Yêu cầu kỹ thuật:
1. Gieo vần điệu mượt mà, số âm tiết mỗi câu đều đặn, nhịp nhàng theo nhịp độ ${bpm} BPM.
2. Trả về DUY NHẤT một chuỗi JSON hợp lệ theo định dạng chuẩn sau (không thêm văn bản ngoài JSON):

{
  "title": "Tên bài hát",
  "genre": "${genre}",
  "bpm": ${bpm},
  "key": "${key}",
  "mood": "${mood}",
  "lyrics": {
    "intro": "(Nhạc dạo acoustic guitar du dương...)",
    "verse_1": "Viết 4 câu lời 1 có vần điệu...",
    "pre_chorus": "Viết 2 câu tiền điệp khúc...",
    "chorus": "Viết 4 câu điệp khúc cao trào cảm xúc...",
    "verse_2": "Viết 4 câu lời 2...",
    "bridge": "Viết 2 câu cao trào chuyển tiếp...",
    "outro": "(Giai điệu dịu dần, lắng sâu...)"
  }
}`;

    navigator.clipboard.writeText(chatGptPrompt).then(() => {
      showToast("✅ Đã sao chép Prompt ChatGPT! Dán vào ChatGPT rồi copy kết quả bấm 'Dán nhanh JSON'.", "success");
    }).catch(() => {
      // Fallback
      promptIdeaInput.value = chatGptPrompt;
      showToast("Đã tạo prompt mẫu!", "info");
    });
  });
}

// --- Beat Upload & Librosa Analysis ---
function setupBeatUpload() {
  btnSelectBeat.addEventListener("click", (e) => {
    e.stopPropagation();
    if (window.electronAPI) {
      window.electronAPI.selectBeatFile().then((filePath) => {
        if (filePath) handleNativeFileSelected(filePath);
      });
    } else {
      beatFileInput.click();
    }
  });

  dropZone.addEventListener("click", () => {
    if (window.electronAPI) {
      window.electronAPI.selectBeatFile().then((filePath) => {
        if (filePath) handleNativeFileSelected(filePath);
      });
    } else {
      beatFileInput.click();
    }
  });

  beatFileInput.addEventListener("change", (e) => {
    if (e.target.files.length > 0) {
      uploadAndAnalyzeBeat(e.target.files[0]);
    }
  });

  // Drag & Drop
  ["dragenter", "dragover"].forEach((eventName) => {
    dropZone.addEventListener(eventName, (e) => {
      e.preventDefault();
      dropZone.classList.add("dragover");
    });
  });

  ["dragleave", "drop"].forEach((eventName) => {
    dropZone.addEventListener(eventName, (e) => {
      e.preventDefault();
      dropZone.classList.remove("dragover");
    });
  });

  dropZone.addEventListener("drop", (e) => {
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      uploadAndAnalyzeBeat(e.dataTransfer.files[0]);
    }
  });
}

async function handleNativeFileSelected(filePath) {
  showToast("Đang nạp và phân tích beat...", "info");
  beatStatusBadge.innerText = "Đang phân tích BPM & Tone...";
  
  // Create a Blob from local path via fetch if needed, or upload formData
  try {
    const response = await fetch(`file://${filePath}`);
    const blob = await response.blob();
    const filename = filePath.split(/[\/\\]/).pop();
    const file = new File([blob], filename, { type: blob.type || "audio/mpeg" });
    uploadAndAnalyzeBeat(file);
  } catch (err) {
    console.error(err);
    showToast("Lỗi mở file: " + err.message, "error");
  }
}

async function uploadAndAnalyzeBeat(file) {
  showToast(`Đang tải & phân tích file ${file.name}...`, "info");
  beatStatusBadge.innerText = "AI đang đo BPM & Key...";
  
  const formData = new FormData();
  formData.append("file", file);

  try {
    const res = await fetch(`${API_BASE}/api/analyze-beat`, {
      method: "POST",
      body: formData
    });
    const json = await res.json();
    
    if (json.status === "success") {
      const data = json.data;
      state.beat.serverPath = data.server_filepath;
      state.beat.url = `${API_BASE}${data.url}`;
      state.beat.bpm = data.bpm;
      state.beat.key = data.full_key;
      state.beat.duration = data.duration_seconds;
      state.beat.waveform = data.waveform;

      // Sync to Timeline Track 1
      if (state.timeline && state.timeline.tracks[0]) {
        state.timeline.tracks[0].filepath = data.server_filepath;
        state.timeline.tracks[0].name = data.filename;
        state.timeline.tracks[0].duration_sec = data.duration_seconds;
        const blockT1 = document.getElementById("blockTrack1");
        const titleT1 = document.getElementById("blockTrack1Title");
        if (blockT1) blockT1.style.display = "flex";
        if (titleT1) titleT1.innerText = `${data.filename} (${formatSeconds(0)}s)`;
      }

      // Update UI
      metricBpm.innerText = `${data.bpm}`;
      metricKey.innerText = data.full_key;
      metricDuration.innerText = data.duration_formatted;
      metricFilename.innerText = data.filename;
      beatStatusBadge.innerText = "Đã phân tích xong";
      beatStatusBadge.className = "badge badge-success";

      // Sync BPM and Key to Lyrics tab
      lyricsBpmInput.value = Math.round(data.bpm);
      lyricsKeyInput.value = data.full_key;

      // Load audio to player
      state.audioPlayer.src = state.beat.url;
      state.audioPlayer.load();
      btnPlayPauseBeat.disabled = false;
      beatSeekSlider.disabled = false;

      // Draw Waveform Canvas
      drawWaveform(data.waveform);
      showToast(`Phân tích thành công: ${data.bpm} BPM | Key: ${data.full_key}`, "success");
    } else {
      showToast("Lỗi phân tích: " + (json.detail || "Không rõ"), "error");
    }
  } catch (e) {
    console.error(e);
    showToast("Không thể kết nối Python Backend. Hãy kiểm tra server!", "error");
  }
}

// Waveform Canvas Drawing
function drawWaveform(peaks) {
  const ctx = waveformCanvas.getContext("2d");
  const width = waveformCanvas.width;
  const height = waveformCanvas.height;
  
  ctx.clearRect(0, 0, width, height);
  if (!peaks || peaks.length === 0) return;

  const barWidth = width / peaks.length;
  const centerY = height / 2;

  for (let i = 0; i < peaks.length; i++) {
    const val = peaks[i];
    const barHeight = Math.max(val * (height - 16), 4);
    
    // Gradient bar
    const grad = ctx.createLinearGradient(0, centerY - barHeight / 2, 0, centerY + barHeight / 2);
    grad.addColorStop(0, "#00f2fe");
    grad.addColorStop(0.5, "#4facfe");
    grad.addColorStop(1, "#a855f7");

    ctx.fillStyle = grad;
    ctx.fillRect(i * barWidth, centerY - barHeight / 2, barWidth - 1.5, barHeight);
  }
}

// Audio Player Controller
function setupAudioPlayer() {
  btnPlayPauseBeat.addEventListener("click", () => {
    if (state.audioPlayer.paused) {
      state.audioPlayer.play();
      playIcon.innerText = "⏸";
    } else {
      state.audioPlayer.pause();
      playIcon.innerText = "▶";
    }
  });

  state.audioPlayer.addEventListener("timeupdate", () => {
    const current = state.audioPlayer.currentTime;
    const total = state.audioPlayer.duration || 1;
    const percent = (current / total) * 100;
    
    beatSeekSlider.value = percent;
    waveformProgress.style.width = `${percent}%`;
    currentTimeEl.innerText = formatSeconds(current);
    totalTimeEl.innerText = formatSeconds(total);
  });

  state.audioPlayer.addEventListener("ended", () => {
    playIcon.innerText = "▶";
    beatSeekSlider.value = 0;
    waveformProgress.style.width = "0%";
  });

  beatSeekSlider.addEventListener("input", (e) => {
    const percent = e.target.value;
    const total = state.audioPlayer.duration || 1;
    state.audioPlayer.currentTime = (percent / 100) * total;
  });

  beatVolumeSlider.addEventListener("input", (e) => {
    state.audioPlayer.volume = parseFloat(e.target.value);
  });
}

function formatSeconds(secs) {
  if (isNaN(secs)) return "00:00";
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m < 10 ? "0" : ""}${m}:${s < 10 ? "0" : ""}${s}`;
}

// --- AI Lyricist & Editor ---
function setupLyricsActions() {
  btnOptimizeLyrics.addEventListener("click", async () => {
    const idea = promptIdeaInput.value.trim();
    const genre = genreSelect.value;
    const mood = moodSelect.value;
    const bpm = parseFloat(lyricsBpmInput.value) || 90;
    const key = lyricsKeyInput.value.trim() || "C Major";

    showToast("Gemini AI đang sáng tác và gieo vần căn nhịp...", "info");
    btnOptimizeLyrics.disabled = true;

    try {
      const res = await fetch(`${API_BASE}/api/optimize-lyrics`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt_idea: idea || "Tình yêu và ước mơ",
          genre: genre,
          bpm: bpm,
          key: key,
          mood: mood,
          voice_style: "Nam trầm ấm"
        })
      });
      const json = await res.json();
      if (json.status === "success") {
        applySongDataToEditor(json.data);
        showToast("Đã tạo lời bài hát hoàn chỉnh khớp nhịp beat!", "success");
      } else {
        showToast("Lỗi: " + (json.detail || "Không thể tạo lời"), "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Lỗi kết nối API Lyricist", "error");
    } finally {
      btnOptimizeLyrics.disabled = false;
    }
  });

  btnClearLyrics.addEventListener("click", () => {
    if (confirm("Bạn có chắc muốn làm trống toàn bộ lời bài hát?")) {
      ["intro", "verse_1", "pre_chorus", "chorus", "verse_2", "bridge", "outro"].forEach((sec) => {
        const el = document.getElementById(`sec_${sec}`);
        if (el) el.value = "";
      });
      showToast("Đã xóa trắng lời", "info");
    }
  });

  // Export Project JSON
  btnExportJson.addEventListener("click", async () => {
    const projectData = gatherCurrentSongData();
    if (window.electronAPI) {
      const savedPath = await window.electronAPI.saveProjectFile(projectData);
      if (savedPath) showToast(`Đã xuất file: ${savedPath}`, "success");
    } else {
      // Browser fallback download
      const blob = new Blob([JSON.stringify(projectData, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${projectData.title || "AI_Song"}.json`;
      a.click();
      showToast("Đã tải xuống file Project JSON", "success");
    }
  });

  // Import Project JSON
  btnImportJson.addEventListener("click", async () => {
    if (window.electronAPI) {
      const projectData = await window.electronAPI.openProjectFile();
      if (projectData) {
        applySongDataToEditor(projectData);
        showToast("Đã nạp file Project thành công!", "success");
      }
    } else {
      smartPasteModal.style.display = "flex";
    }
  });
}

function gatherCurrentSongData() {
  return {
    title: songTitleInput.value.trim() || "Bài hát mới",
    genre: genreSelect.value,
    bpm: parseFloat(lyricsBpmInput.value) || 90,
    key: lyricsKeyInput.value.trim() || "C Major",
    mood: moodSelect.value,
    voice_style: voiceSelect.value,
    lyrics: {
      intro: document.getElementById("sec_intro").value,
      verse_1: document.getElementById("sec_verse_1").value,
      pre_chorus: document.getElementById("sec_pre_chorus").value,
      chorus: document.getElementById("sec_chorus").value,
      verse_2: document.getElementById("sec_verse_2").value,
      bridge: document.getElementById("sec_bridge").value,
      outro: document.getElementById("sec_outro").value
    }
  };
}

function applySongDataToEditor(data) {
  if (data.title) songTitleInput.value = data.title;
  if (data.genre) genreSelect.value = data.genre;
  if (data.bpm) lyricsBpmInput.value = data.bpm;
  if (data.key) lyricsKeyInput.value = data.key;
  if (data.mood) moodSelect.value = data.mood;

  const lyrics = data.lyrics || {};
  document.getElementById("sec_intro").value = lyrics.intro || "";
  document.getElementById("sec_verse_1").value = lyrics.verse_1 || "";
  document.getElementById("sec_pre_chorus").value = lyrics.pre_chorus || "";
  document.getElementById("sec_chorus").value = lyrics.chorus || "";
  document.getElementById("sec_verse_2").value = lyrics.verse_2 || "";
  document.getElementById("sec_bridge").value = lyrics.bridge || "";
  document.getElementById("sec_outro").value = lyrics.outro || "";
}

// --- Smart Paste Modal ---
function setupSmartPasteModal() {
  btnSmartPaste.addEventListener("click", async () => {
    // Try reading directly from clipboard if allowed
    try {
      if (navigator.clipboard) {
        const text = await navigator.clipboard.readText();
        if (text && text.trim().length > 0) {
          smartPasteInput.value = text;
        }
      }
    } catch (e) {}
    smartPasteModal.style.display = "flex";
  });

  btnCloseModal.addEventListener("click", () => smartPasteModal.style.display = "none");
  btnCancelModal.addEventListener("click", () => smartPasteModal.style.display = "none");

  btnApplySmartPaste.addEventListener("click", async () => {
    const rawText = smartPasteInput.value.trim();
    if (!rawText) {
      showToast("Vui lòng dán nội dung vào ô", "error");
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/smart-paste`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clipboard_text: rawText })
      });
      const json = await res.json();
      if (json.status === "success") {
        applySongDataToEditor(json.data);
        smartPasteModal.style.display = "none";
        showToast("Đã phân tích và áp dụng cấu trúc bài hát thành công!", "success");
      } else {
        showToast("Lỗi phân tích: " + json.detail, "error");
      }
    } catch (e) {
      console.error(e);
      showToast("Lỗi gọi API Smart Paste", "error");
    }
  });
}

// --- Vocal & Studio Mixer Controls ---
function setupMixerControls() {
  voiceSpeedSlider.addEventListener("input", (e) => {
    valSpeed.innerText = `${e.target.value > 0 ? "+" : ""}${e.target.value}%`;
  });
  voicePitchSlider.addEventListener("input", (e) => {
    valPitch.innerText = `${e.target.value > 0 ? "+" : ""}${e.target.value} Hz`;
  });
  vocalOffsetSlider.addEventListener("input", (e) => {
    valOffset.innerText = `${e.target.value} ms`;
  });

  mixBeatVol.addEventListener("input", (e) => {
    valMixBeatVol.innerText = `${e.target.value}x`;
  });
  mixVocalVol.addEventListener("input", (e) => {
    valMixVocalVol.innerText = `${e.target.value}x`;
  });
  mixReverb.addEventListener("input", (e) => {
    valMixReverb.innerText = `${Math.round(e.target.value * 100)}%`;
  });
  mixDelay.addEventListener("input", (e) => {
    valMixDelay.innerText = `${Math.round(e.target.value * 100)}%`;
  });

  // 1-Click Master Mix
  btnStartMixing.addEventListener("click", async () => {
    if (!state.beat.serverPath) {
      showToast("Vui lòng tải lên hoặc chọn file Beat ở Tab 1 trước!", "error");
      // Switch to Tab 1
      navTabs[0].click();
      return;
    }

    const songData = gatherCurrentSongData();
    const lyricsSections = songData.lyrics;
    const hasLyrics = Object.values(lyricsSections).some((v) => v && v.trim().length > 0);
    
    if (!hasLyrics) {
      showToast("Vui lòng nhập hoặc tạo lời bài hát ở Tab 2 trước!", "error");
      navTabs[1].click();
      return;
    }

    // Start UI Processing Mode
    masterProgressBox.style.display = "flex";
    btnStartMixing.disabled = true;
    masterStatusBadge.innerText = "Đang mix nhạc...";
    masterStatusBadge.className = "badge";

    const payload = {
      beat_path: state.beat.serverPath,
      lyrics: lyricsSections,
      voice_id: voiceSelect.value,
      speed_percent: parseInt(voiceSpeedSlider.value, 10),
      pitch_hz: parseInt(voicePitchSlider.value, 10),
      mix_settings: {
        beat_volume: parseFloat(mixBeatVol.value),
        vocal_volume: parseFloat(mixVocalVol.value),
        reverb: parseFloat(mixReverb.value),
        delay: parseFloat(mixDelay.value),
        compressor: compressorToggle.checked,
        eq_preset: eqPresetSelect.value,
        vocal_offset_ms: parseInt(vocalOffsetSlider.value, 10)
      },
      song_title: songTitleInput.value.trim() || "AI_Master_Song"
    };

    try {
      const res = await fetch(`${API_BASE}/api/mix-song`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const json = await res.json();
      
      if (json.status === "success") {
        const masterUrl = `${API_BASE}${json.master_url}`;
        state.masterAudioUrl = masterUrl;

        masterAudioPlayer.src = masterUrl;
        masterAudioPlayer.load();

        masterSongTitle.innerText = songTitleInput.value.trim() || "Bản Mix Hoàn Chỉnh";
        masterSongSub = `${genreSelect.value} • ${voiceSelect.options[voiceSelect.selectedIndex].text}`;
        
        btnDownloadMaster.href = masterUrl;
        btnDownloadMaster.download = json.filename || "AI_Master_Song.mp3";
        btnDownloadMaster.classList.remove("disabled");

        masterStatusBadge.innerText = "Mix hoàn tất 100%";
        masterStatusBadge.className = "badge badge-success";

        // Sync AI Vocal to Timeline Track 4
        if (state.timeline && state.timeline.tracks[3]) {
          state.timeline.tracks[3].filepath = json.vocal_url;
          state.timeline.tracks[3].name = `Giọng Hát AI (${voiceSelect.options[voiceSelect.selectedIndex].text})`;
          const blockT4 = document.getElementById("blockTrack4");
          const titleT4 = document.getElementById("blockTrack4Title");
          if (blockT4) blockT4.style.display = "flex";
          if (titleT4) titleT4.innerText = `${state.timeline.tracks[3].name} (${formatSeconds(state.timeline.tracks[3].start_time_sec)}s)`;
        }

        showToast("Mix bài hát thành công! Hãy nhấn Play để thưởng thức!", "success");
      } else {
        showToast("Lỗi trong quá trình mix: " + (json.detail || "Không rõ"), "error");
      }
    } catch (e) {
      console.error(e);
      showToast("Lỗi kết nối server khi mix nhạc", "error");
    } finally {
      masterProgressBox.style.display = "none";
      btnStartMixing.disabled = false;
    }
  });

  // Vinyl Spin Visualizer
  masterAudioPlayer.addEventListener("play", () => {
    vinylDisc.classList.add("spinning");
  });
  masterAudioPlayer.addEventListener("pause", () => {
    vinylDisc.classList.remove("spinning");
  });
  masterAudioPlayer.addEventListener("ended", () => {
    vinylDisc.classList.remove("spinning");
  });
}

// --- Settings ---
function setupSettings() {
  btnToggleApiKey.addEventListener("click", () => {
    if (geminiApiKeyInput.type === "password") {
      geminiApiKeyInput.type = "text";
      btnToggleApiKey.innerText = "🙈 Ẩn";
    } else {
      geminiApiKeyInput.type = "password";
      btnToggleApiKey.innerText = "👁️ Hiện";
    }
  });

  linkAiStudio.addEventListener("click", (e) => {
    e.preventDefault();
    const url = "https://aistudio.google.com/app/apikey";
    if (window.electronAPI) {
      window.electronAPI.openExternalUrl(url);
    } else {
      window.open(url, "_blank");
    }
  });

  btnSaveSettings.addEventListener("click", async () => {
    const key = geminiApiKeyInput.value.trim();
    const defVoice = defaultVoiceSelect.value;
    try {
      const res = await fetch(`${API_BASE}/api/settings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gemini_api_key: key,
          default_voice: defVoice
        })
      });
      const json = await res.json();
      if (json.status === "success") {
        showToast("Đã lưu cấu hình thành công!", "success");
      }
    } catch (e) {
      showToast("Lỗi lưu cấu hình", "error");
    }
  });
}

async function loadBackendSettings() {
  try {
    const res = await fetch(`${API_BASE}/api/settings`);
    const data = await res.json();
    if (data.gemini_api_key) {
      geminiApiKeyInput.value = data.gemini_api_key;
    }
    if (data.default_voice) {
      defaultVoiceSelect.value = data.default_voice;
      voiceSelect.value = data.default_voice;
    }
  } catch (e) {
    console.log("Could not load backend settings yet");
  }
}

function initSampleData() {
  loadDemoBalladLyrics();
}

function loadDemoBeatData() {
  const demoFilename = "demo_beat_lofi_90bpm.wav";
  const demoUrl = `${API_BASE}/static/uploads/${demoFilename}`;
  
  state.beat.serverPath = `data/uploads/${demoFilename}`;
  state.beat.url = demoUrl;
  state.beat.bpm = 90.0;
  state.beat.key = "C Major";
  state.beat.duration = 32.0;

  // Sync to Timeline Track 1
  if (state.timeline && state.timeline.tracks[0]) {
    state.timeline.tracks[0].filepath = `data/uploads/${demoFilename}`;
    state.timeline.tracks[0].name = "Beat Lofi 90 BPM";
    state.timeline.tracks[0].duration_sec = 32.0;
    const blockT1 = document.getElementById("blockTrack1");
    const titleT1 = document.getElementById("blockTrack1Title");
    if (blockT1) blockT1.style.display = "flex";
    if (titleT1) titleT1.innerText = `Beat Lofi 90 BPM (${formatSeconds(0)}s)`;
  }

  // Generate pleasant waveform peaks
  const demoPeaks = [];
  for (let i = 0; i < 120; i++) {
    const val = 0.3 + 0.5 * Math.abs(Math.sin(i * 0.15)) * (0.8 + 0.2 * Math.cos(i * 0.05));
    demoPeaks.push(Math.round(val * 100) / 100);
  }
  state.beat.waveform = demoPeaks;

  // Update UI Metrics
  metricBpm.innerText = "90.0";
  metricKey.innerText = "C Major";
  metricDuration.innerText = "00:32";
  metricFilename.innerText = demoFilename;
  beatStatusBadge.innerText = "Đã nạp Beat Mẫu Lofi 90 BPM";
  beatStatusBadge.className = "badge badge-success";

  // Sync to Lyrics tab
  lyricsBpmInput.value = 90;
  lyricsKeyInput.value = "C Major";
  genreSelect.value = "V-Pop Ballad";

  // Enable Player
  state.audioPlayer.src = demoUrl;
  state.audioPlayer.load();
  btnPlayPauseBeat.disabled = false;
  beatSeekSlider.disabled = false;

  drawWaveform(demoPeaks);
  showToast("🎵 Đã nạp Beat mẫu Lofi 90 BPM (C Major) thành công!", "success");
}

function loadDemoBalladLyrics() {
  songTitleInput.value = "Bản Tình Ca Mùa Hạ";
  genreSelect.value = "V-Pop Ballad";
  moodSelect.value = "Sâu lắng, cảm xúc";
  lyricsBpmInput.value = 90;
  lyricsKeyInput.value = "C Major";
  voiceSelect.value = "vi-VN-HoaiMyNeural";

  document.getElementById("sec_intro").value = "(Nhạc dạo acoustic guitar êm dịu, nhịp trống nhẹ nhàng)";
  document.getElementById("sec_verse_1").value = "Từng giọt mưa rơi nhẹ bên góc hiên xưa\nNhớ lại ngày tháng ta cùng đón cơn mưa\nÁnh mắt trao nhau bao điều chưa kịp nói\nĐể lại nỗi nhớ theo năm tháng không vơi.";
  document.getElementById("sec_pre_chorus").value = "Dù thời gian trôi qua muôn trùng xa cách\nTrái tim anh vẫn luôn hướng về em.";
  document.getElementById("sec_chorus").value = "Và anh sẽ hát khúc ca này gửi trao em\nGiữ trọn bao thương nhớ trong từng đêm đen\nNguyện cùng nhau đi qua muôn trùng giông bão\nĐến nơi chân trời lung linh ngàn ánh sao.";
  document.getElementById("sec_verse_2").value = "Bầu trời đêm rạng ngời muôn ánh trăng thanh\nNhư gửi gắm yêu thương về phía em nhanh\nNụ cười rạng rỡ xóa tan mọi âu lo\nCho tình yêu này mãi không hề đắn đo.";
  document.getElementById("sec_bridge").value = "Dẫu ngày mai đường đời chia đôi ngả\nLời hẹn ước xưa vẫn luôn vẹn nguyên.";
  document.getElementById("sec_outro").value = "(Giai điệu dịu dần, tiếng ngân nga lắng đọng vào không gian...)";
}

function loadDemoRapLyrics() {
  songTitleInput.value = "Cháy Cùng Đam Mê (Rap)";
  genreSelect.value = "V-Rap / Hip-Hop";
  moodSelect.value = "Mạnh mẽ, tự tin";
  lyricsBpmInput.value = 90;
  lyricsKeyInput.value = "A Minor";
  voiceSelect.value = "vi-VN-NamMinhNeural";

  document.getElementById("sec_intro").value = "(Tiếng bass rền vang, nhịp trống dồn dập)";
  document.getElementById("sec_verse_1").value = "Bước qua bao chông gai ta vẫn luôn ngẩng đầu\nKhông bao giờ chùn bước dẫu đêm tối phía trước\nÂm nhạc là ngọn lửa cháy rực trong con tim\nKhát khao những đỉnh cao ta miệt mài đi tìm.";
  document.getElementById("sec_pre_chorus").value = "Mọi khó khăn chỉ làm ta thêm vững vàng\nTiến về phía trước mở lối vinh quang.";
  document.getElementById("sec_chorus").value = "Bật beat lên và ta cháy hết đêm nay\nCùng âm thanh cuồng nhiệt bay bổng ngất ngây\nKhông dừng lại dẫu thế giới có đổi thay\nKhẳng định bản lĩnh ngay tại nơi đây.";
  document.getElementById("sec_verse_2").value = "Từng câu rap là tuyên ngôn của tuổi trẻ\nĐi con đường của mình không ngại ai phán xét\nNắm lấy cơ hội khi thời cơ đã tới\nBiến những ước mơ thành chân trời mới.";
  document.getElementById("sec_bridge").value = "Âm vang này sẽ lan tỏa muôn nơi\nĐam mê bất tận rực sáng một đời.";
  document.getElementById("sec_outro").value = "(Tiếng scratch đĩa than mờ dần...)";
}

function loadDemoMixPreset() {
  mixBeatVol.value = "1.0";
  valMixBeatVol.innerText = "1.0x";
  mixVocalVol.value = "1.25";
  valMixVocalVol.innerText = "1.25x";
  mixReverb.value = "0.35";
  valMixReverb.innerText = "35%";
  mixDelay.value = "0.15";
  valMixDelay.innerText = "15%";
  voiceSpeedSlider.value = "0";
  valSpeed.innerText = "0%";
  voicePitchSlider.value = "0";
  valPitch.innerText = "0 Hz";
  eqPresetSelect.value = "warm_vocal";
  compressorToggle.checked = true;
}

function setupDemoSampleLoaders() {
  const btnLoadSampleBeat = document.getElementById("btnLoadSampleBeat");
  if (btnLoadSampleBeat) {
    btnLoadSampleBeat.addEventListener("click", () => {
      loadDemoBeatData();
    });
  }

  const btnLoadSampleLyricsBallad = document.getElementById("btnLoadSampleLyricsBallad");
  if (btnLoadSampleLyricsBallad) {
    btnLoadSampleLyricsBallad.addEventListener("click", () => {
      loadDemoBalladLyrics();
      showToast("Đã nạp lời mẫu: V-Pop Ballad", "success");
    });
  }

  const btnLoadSampleLyricsRap = document.getElementById("btnLoadSampleLyricsRap");
  if (btnLoadSampleLyricsRap) {
    btnLoadSampleLyricsRap.addEventListener("click", () => {
      loadDemoRapLyrics();
      showToast("Đã nạp lời mẫu: V-Rap / Hip-Hop", "success");
    });
  }

  const btnLoadSampleMixPreset = document.getElementById("btnLoadSampleMixPreset");
  if (btnLoadSampleMixPreset) {
    btnLoadSampleMixPreset.addEventListener("click", () => {
      loadDemoMixPreset();
      showToast("Đã nạp Preset Mixer Studio (Reverb 35%, Warm Vocal)", "success");
    });
  }

  const btnAutoLoadFullDemo = document.getElementById("btnAutoLoadFullDemo");
  if (btnAutoLoadFullDemo) {
    btnAutoLoadFullDemo.addEventListener("click", () => {
      loadDemoBeatData();
      loadDemoBalladLyrics();
      loadDemoMixPreset();
      switchTab("tab-mixer");
      showToast("⚡ Đã nạp TRỌN BỘ MẪU! Hãy bấm 'TẠO BÀI HÁT & MIX NHẠC' bên dưới để nghe thử ngay!", "success");
    });
  }
}

// =========================================================================
// 1. VIDEO AUDIO EXTRACTOR
// =========================================================================
function setupVideoExtraction() {
  if (!btnSelectVideo || !videoFileInput) return;

  btnSelectVideo.addEventListener("click", (e) => {
    e.stopPropagation();
    videoFileInput.click();
  });

  videoFileInput.addEventListener("change", async (e) => {
    if (e.target.files.length === 0) return;
    const videoFile = e.target.files[0];

    showToast(`🎬 Đang trích xuất luồng âm thanh từ video '${videoFile.name}'...`, "info");
    beatStatusBadge.innerText = "Đang tách âm từ video...";
    beatStatusBadge.className = "badge badge-warning";

    const formData = new FormData();
    formData.append("file", videoFile);

    try {
      const res = await fetch(`${API_BASE}/api/extract-video-audio`, {
        method: "POST",
        body: formData
      });

      const json = await res.json();
      if (json.status === "success") {
        const d = json.data;
        state.beat.serverPath = d.server_filepath;
        state.beat.url = `${API_BASE}${d.url}`;
        state.beat.bpm = d.bpm;
        state.beat.key = d.key;
        state.beat.duration = d.duration;
        state.beat.waveform = d.waveform;

        // Update Timeline Track 1 with this extracted audio
        state.timeline.tracks[0].filepath = d.server_filepath;
        state.timeline.tracks[0].name = `Video Audio: ${videoFile.name}`;
        const t1Title = document.getElementById("blockTrack1Title");
        if (t1Title) t1Title.innerText = `Audio từ Video (00:00.0s)`;

        // Update metrics
        metricBpm.innerText = d.bpm.toFixed(1);
        metricKey.innerText = d.key;
        metricDuration.innerText = formatSeconds(d.duration);
        metricFilename.innerText = d.filename;
        beatStatusBadge.innerText = "Đã trích xuất âm thanh từ Video thành công!";
        beatStatusBadge.className = "badge badge-success";

        // Sync to lyrics & autotune
        lyricsBpmInput.value = Math.round(d.bpm);
        lyricsKeyInput.value = d.key;

        // Auto-select key for Auto-Tune
        syncKeyToAutoTune(d.key);

        state.audioPlayer.src = state.beat.url;
        btnPlayPauseBeat.disabled = false;
        beatSeekSlider.disabled = false;

        drawWaveform(d.waveform);
        showToast("✅ Đã tách âm thanh từ video và phân tích Beat BPM thành công!", "success");
      } else {
        throw new Error(json.detail || "Lỗi tách video");
      }
    } catch (err) {
      beatStatusBadge.innerText = "Lỗi tách video";
      beatStatusBadge.className = "badge badge-error";
      showToast(`Lỗi: ${err.message}`, "error");
    }
  });
}

function syncKeyToAutoTune(fullKey) {
  const autoTuneKeySelect = document.getElementById("autoTuneKeySelect");
  const autoTuneScaleSelect = document.getElementById("autoTuneScaleSelect");
  if (!autoTuneKeySelect || !autoTuneScaleSelect) return;

  const parts = fullKey.split(" ");
  if (parts.length >= 1) {
    const keyLetter = parts[0];
    const scale = parts[1] || "Major";
    autoTuneKeySelect.value = keyLetter;
    autoTuneScaleSelect.value = scale;
  }
}

// =========================================================================
// 2. STUDIO VOICE RECORDER (MICROPHONE & REAL-TIME VISUALIZER)
// =========================================================================
function setupStudioRecorder() {
  const btnToggleRecord = document.getElementById("btnToggleRecord");
  const recordBtnLabel = document.getElementById("recordBtnLabel");
  const liveRecBadge = document.getElementById("liveRecBadge");
  const recTimerText = document.getElementById("recTimerText");
  const chkCountIn = document.getElementById("chkCountIn");
  const chkPlayBeat = document.getElementById("chkPlayBeatWhileRecording");
  const rawRecordPlayer = document.getElementById("rawRecordAudioPlayer");
  const mixedRecordPlayer = document.getElementById("mixedRecordAudioPlayer");
  const btnQuickMixRecBeat = document.getElementById("btnQuickMixRecBeat");
  const canvas = document.getElementById("recorderWaveCanvas");
  if (!btnToggleRecord || !canvas) return;

  async function quickMixRecordingWithBeat(customVocalPath) {
    const vocalPath = customVocalPath || state.recording.tunedVocalPath || state.recording.rawVocalPath;
    if (!vocalPath) {
      showToast("⚠️ Chưa có bản thu âm để ghép với beat!", "warning");
      return;
    }

    const beatPath = state.beat.serverPath || "data/uploads/demo_beat_lofi_90bpm.wav";
    showToast("🎧 Đang tự động ghép bản thu với Beat nền...", "info");
    if (btnQuickMixRecBeat) btnQuickMixRecBeat.disabled = true;

    try {
      const res = await fetch(`${API_BASE}/api/mix-recording-with-beat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vocal_path: vocalPath,
          beat_path: beatPath,
          vocal_volume: 1.25,
          beat_volume: 1.0
        })
      });
      const data = await res.json();
      if (data.status === "success") {
        const fullUrl = `${API_BASE}${data.mixed_url}`;
        if (mixedRecordPlayer) {
          mixedRecordPlayer.src = fullUrl;
          mixedRecordPlayer.load();
        }
        showToast("🎉 Đã ghép bản thu với Beat nền thành công!", "success");
      } else {
        throw new Error(data.detail || "Lỗi ghép beat");
      }
    } catch (e) {
      console.error(e);
      showToast(`Lỗi ghép beat: ${e.message}`, "error");
    } finally {
      if (btnQuickMixRecBeat) btnQuickMixRecBeat.disabled = false;
    }
  }

  if (btnQuickMixRecBeat) {
    btnQuickMixRecBeat.addEventListener("click", () => {
      quickMixRecordingWithBeat();
    });
  }

  const ctx = canvas.getContext("2d");

  // Idle visualizer wave
  function drawIdleWave() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = "rgba(0, 242, 254, 0.4)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    const midY = canvas.height / 2;
    for (let x = 0; x < canvas.width; x += 4) {
      const y = midY + Math.sin(x * 0.05 + Date.now() * 0.003) * 6;
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
    if (!state.recording.isRecording) {
      state.recording.animFrameId = requestAnimationFrame(drawIdleWave);
    }
  }
  drawIdleWave();

  btnToggleRecord.addEventListener("click", async () => {
    if (state.recording.isRecording) {
      stopRecording();
    } else {
      if (chkCountIn.checked) {
        showToast("⏱️ Chuẩn bị thu âm: 3...", "info");
        recordBtnLabel.innerText = "⏳ 3...";
        setTimeout(() => {
          recordBtnLabel.innerText = "⏳ 2...";
          setTimeout(() => {
            recordBtnLabel.innerText = "⏳ 1...";
            setTimeout(() => {
              startRecording();
            }, 800);
          }, 800);
        }, 800);
      } else {
        startRecording();
      }
    }
  });

  function encodeWAVFromPCM(samples, sampleRate) {
    let maxAmp = 0;
    for (let i = 0; i < samples.length; i++) {
      const abs = Math.abs(samples[i]);
      if (abs > maxAmp) maxAmp = abs;
    }
    let gainMultiplier = 1.0;
    if (maxAmp > 0.01 && maxAmp < 0.85) {
      gainMultiplier = Math.min(3.5, 0.88 / maxAmp);
    }

    const buffer = new ArrayBuffer(44 + samples.length * 2);
    const view = new DataView(buffer);

    function writeString(offset, string) {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    }

    writeString(0, 'RIFF');
    view.setUint32(4, 36 + samples.length * 2, true);
    writeString(8, 'WAVE');

    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);

    writeString(36, 'data');
    view.setUint32(40, samples.length * 2, true);

    let offset = 44;
    for (let i = 0; i < samples.length; i++, offset += 2) {
      let s = samples[i] * gainMultiplier;
      if (s > 0.98) s = 0.98;
      if (s < -0.98) s = -0.98;
      view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
    }

    return new Blob([view], { type: 'audio/wav' });
  }

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
          channelCount: 1,
          latency: 0
        }
      });
      state.recording.stream = stream;
      state.recording.recordedPCM = [];

      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      state.recording.audioContext = audioCtx;
      state.recording.sampleRate = audioCtx.sampleRate;

      const source = audioCtx.createMediaStreamSource(stream);

      // Analyser node for live visualizer
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      state.recording.analyser = analyser;
      source.connect(analyser);

      // Script processor for raw PCM sample capture
      const processor = audioCtx.createScriptProcessor(4096, 1, 1);
      state.recording.processorNode = processor;
      processor.onaudioprocess = (e) => {
        if (!state.recording.isRecording) return;
        const inputData = e.inputBuffer.getChannelData(0);
        const copy = new Float32Array(inputData.length);
        copy.set(inputData);
        state.recording.recordedPCM.push(copy);
      };

      source.connect(processor);
      const silentGain = audioCtx.createGain();
      silentGain.gain.value = 0;
      processor.connect(silentGain);
      silentGain.connect(audioCtx.destination);

      state.recording.isRecording = true;
      state.recording.secondsElapsed = 0;

      // Update UI
      btnToggleRecord.classList.add("recording");
      recordBtnLabel.innerText = "⏹ DỪNG THU ÂM";
      liveRecBadge.innerText = "🔴 Đang thu âm...";
      liveRecBadge.className = "live-rec-badge live";

      // Optional: Play beat simultaneously
      if (chkPlayBeat.checked && state.audioPlayer.src) {
        state.audioPlayer.currentTime = 0;
        state.audioPlayer.play().catch(() => {});
      }

      // Timer
      state.recording.timerInterval = setInterval(() => {
        state.recording.secondsElapsed++;
        recTimerText.innerText = formatSeconds(state.recording.secondsElapsed);
      }, 1000);

      // Live waveform visualizer
      drawLiveVisualizer();
      showToast("🎙️ Đang thu âm... Hãy hát vào micro!", "info");
    } catch (err) {
      showToast("Không thể truy cập Microphone: " + err.message, "error");
    }
  }

  function stopRecording() {
    state.recording.isRecording = false;
    clearInterval(state.recording.timerInterval);

    // Stop beat playback if playing
    if (chkPlayBeat.checked && !state.audioPlayer.paused) {
      state.audioPlayer.pause();
    }

    btnToggleRecord.classList.remove("recording");
    recordBtnLabel.innerText = "🔴 BẮT ĐẦU THU ÂM";
    liveRecBadge.innerText = "✅ Thu âm hoàn tất";
    liveRecBadge.className = "live-rec-badge";

    // Merge PCM buffers
    const chunks = state.recording.recordedPCM || [];
    let totalLength = 0;
    for (let i = 0; i < chunks.length; i++) {
      totalLength += chunks[i].length;
    }

    const mergedPCM = new Float32Array(totalLength);
    let offset = 0;
    for (let i = 0; i < chunks.length; i++) {
      mergedPCM.set(chunks[i], offset);
      offset += chunks[i].length;
    }

    if (state.recording.processorNode) {
      state.recording.processorNode.disconnect();
      state.recording.processorNode = null;
    }
    if (state.recording.stream) {
      state.recording.stream.getTracks().forEach((track) => track.stop());
      state.recording.stream = null;
    }

    if (totalLength > 0) {
      const sampleRate = state.recording.sampleRate || 44100;
      const wavBlob = encodeWAVFromPCM(mergedPCM, sampleRate);
      state.recording.rawBlob = wavBlob;

      const audioUrl = URL.createObjectURL(wavBlob);
      rawRecordPlayer.src = audioUrl;
      rawRecordPlayer.load();

      // Upload to backend and auto-mix with beat
      uploadRecordingToBackend(wavBlob);
    }

    if (state.recording.audioContext) {
      state.recording.audioContext.close().catch(() => {});
      state.recording.audioContext = null;
    }

    drawIdleWave();
  }

  function drawLiveVisualizer() {
    if (!state.recording.isRecording || !state.recording.analyser) return;

    const bufferLength = state.recording.analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    state.recording.analyser.getByteFrequencyData(dataArray);

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const barWidth = (canvas.width / bufferLength) * 2.5;
    let x = 0;

    for (let i = 0; i < bufferLength; i++) {
      const barHeight = (dataArray[i] / 255) * canvas.height;
      const gradient = ctx.createLinearGradient(0, canvas.height, 0, 0);
      gradient.addColorStop(0, "#00f2fe");
      gradient.addColorStop(1, "#ff007f");

      ctx.fillStyle = gradient;
      ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
      x += barWidth + 1;
    }

    requestAnimationFrame(drawLiveVisualizer);
  }

  async function uploadRecordingToBackend(blob) {
    showToast("Đang lưu bản thu âm vào Studio...", "info");
    const formData = new FormData();
    formData.append("file", blob, "my_mic_recording.wav");

    try {
      const res = await fetch(`${API_BASE}/api/save-recording`, {
        method: "POST",
        body: formData
      });
      const data = await res.json();
      if (data.status === "success") {
        state.recording.rawVocalPath = data.vocal_path;
        state.recording.tunedVocalPath = data.vocal_path; // Default to raw until tuned
        showToast("✅ Đã lưu bản thu âm! Đang tự động ghép với Beat nền...", "success");
        // Automatically mix recording with beat
        quickMixRecordingWithBeat(data.vocal_path);
      }
    } catch (e) {
      showToast("Lỗi lưu file thu âm lên server", "error");
    }
  }
}

// =========================================================================
// 3. AUTO-TUNE & VOICE EFFECTS CONTROLS
// =========================================================================
function setupAutoTuneControls() {
  const autoTuneKeySelect = document.getElementById("autoTuneKeySelect");
  const autoTuneScaleSelect = document.getElementById("autoTuneScaleSelect");
  const autoTuneSpeedSlider = document.getElementById("autoTuneSpeedSlider");
  const valAutoTuneSpeed = document.getElementById("valAutoTuneSpeed");
  const voiceEffectSelect = document.getElementById("voiceEffectSelect");
  const btnApplyAutoTune = document.getElementById("btnApplyAutoTune");
  const tunedRecordPlayer = document.getElementById("tunedRecordAudioPlayer");
  const btnPushRecToTimeline = document.getElementById("btnPushRecToTimeline");

  if (!btnApplyAutoTune) return;

  autoTuneSpeedSlider.addEventListener("input", (e) => {
    const val = parseInt(e.target.value);
    if (val < 30) valAutoTuneSpeed.innerText = `${val}% (Tự nhiên / Mộc)`;
    else if (val < 70) valAutoTuneSpeed.innerText = `${val}% (Chỉnh nhẹ Studio)`;
    else valAutoTuneSpeed.innerText = `${val}% (Trap / Hard Tune)`;
  });

  btnApplyAutoTune.addEventListener("click", async () => {
    const vocalPath = state.recording.rawVocalPath;
    if (!vocalPath) {
      showToast("⚠️ Hãy thu âm một đoạn giọng hát ở Bước 4 trước khi chỉnh Auto-Tune!", "warning");
      return;
    }

    const key = autoTuneKeySelect.value;
    const scale = autoTuneScaleSelect.value;
    const speed = parseFloat(autoTuneSpeedSlider.value) / 100.0;
    const fx = voiceEffectSelect.value;

    showToast("🪄 Đang xử lý Auto-Tune và áp dụng bộ hiệu ứng giọng...", "info");
    btnApplyAutoTune.disabled = true;

    try {
      const res = await fetch(`${API_BASE}/api/apply-autotune-fx`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vocal_path: vocalPath,
          target_key: key,
          scale_type: scale,
          tune_speed: speed,
          voice_effect: fx
        })
      });

      const data = await res.json();
      if (data.status === "success") {
        state.recording.tunedVocalPath = data.vocal_path;
        tunedRecordPlayer.src = `${API_BASE}${data.vocal_url}`;
        tunedRecordPlayer.load();
        tunedRecordPlayer.play();
        showToast("✅ Đã áp dụng Auto-Tune! Đang cập nhật bản ghép Beat...", "success");

        // Re-mix tuned vocal with beat
        const mixedPlayer = document.getElementById("mixedRecordAudioPlayer");
        const beatPath = state.beat.serverPath || "data/uploads/demo_beat_lofi_90bpm.wav";
        fetch(`${API_BASE}/api/mix-recording-with-beat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            vocal_path: data.vocal_path,
            beat_path: beatPath,
            vocal_volume: 1.25,
            beat_volume: 1.0
          })
        }).then(r => r.json()).then(res => {
          if (res.status === "success" && mixedPlayer) {
            mixedPlayer.src = `${API_BASE}${res.mixed_url}`;
            mixedPlayer.load();
          }
        }).catch(err => console.warn(err));
      } else {
        throw new Error(data.detail || "Lỗi xử lý Auto-Tune");
      }
    } catch (e) {
      showToast(`Lỗi: ${e.message}`, "error");
    } finally {
      btnApplyAutoTune.disabled = false;
    }
  });

  btnPushRecToTimeline.addEventListener("click", () => {
    const vocalPathToUse = state.recording.tunedVocalPath || state.recording.rawVocalPath;
    if (!vocalPathToUse) {
      showToast("⚠️ Chưa có bản thu âm nào để đưa vào Timeline!", "warning");
      return;
    }

    // Set Track 3 in Timeline
    state.timeline.tracks[2].filepath = vocalPathToUse;
    state.timeline.tracks[2].name = "Vocal Thu Âm (Auto-Tuned)";
    const t3Title = document.getElementById("blockTrack3Title");
    if (t3Title) t3Title.innerText = `Vocal Thu Âm (${formatSeconds(state.timeline.tracks[2].start_time_sec)}s)`;

    switchTab("tab-timeline");
    showToast("✅ Đã đẩy bản thu âm vào Track 3 của Multi-Track Timeline!", "success");
  });
}

// =========================================================================
// 4. MULTI-TRACK TIMELINE SEQUENCER (UNLIMITED TRACKS, RECORD AT PLAYHEAD, AUTO-TUNE)
// =========================================================================
function setupMultiTrackTimeline() {
  const btnPlayPauseTimeline = document.getElementById("btnPlayPauseTimeline");
  const btnStopTimeline = document.getElementById("btnStopTimeline");
  const btnRecordAtPlayhead = document.getElementById("btnRecordAtPlayhead");
  const recPlayheadDot = document.getElementById("recPlayheadDot");
  const recPlayheadLabel = document.getElementById("recPlayheadLabel");
  const timelinePlayIcon = document.getElementById("timelinePlayIcon");
  const timelinePlayText = document.getElementById("timelinePlayText");
  const timelineCurrentTime = document.getElementById("timelineCurrentTime");
  const timelineTotalTime = document.getElementById("timelineTotalTime");
  const timelinePlayhead = document.getElementById("timelinePlayhead");
  const timelineRuler = document.getElementById("timelineRuler");
  const timelineTracksList = document.getElementById("timelineTracksList");
  const btnAddAudio = document.getElementById("btnAddAudioFileToTimeline");
  const btnAddTrack = document.getElementById("btnAddTrack");
  const timelineAudioFileInput = document.getElementById("timelineAudioFileInput");
  const btnRenderMaster = document.getElementById("btnRenderTimelineMaster");
  const resultCard = document.getElementById("timelineMasterResultCard");
  const masterPlayer = document.getElementById("timelineMasterAudioPlayer");
  const btnDownload = document.getElementById("btnDownloadTimelineMaster");

  // Inline AutoTune Modal elements
  const autoTuneModal = document.getElementById("timelineAutoTuneModal");
  const btnCloseAutoTuneModal = document.getElementById("btnCloseAutoTuneModal");
  const btnCancelAutoTuneModal = document.getElementById("btnCancelAutoTuneModal");
  const btnApplyModalAutoTune = document.getElementById("btnApplyModalAutoTune");
  const modalKeySelect = document.getElementById("modalAutoTuneKeySelect");
  const modalScaleSelect = document.getElementById("modalAutoTuneScaleSelect");
  const modalSpeedSlider = document.getElementById("modalAutoTuneSpeedSlider");
  const valModalAutoTuneSpeed = document.getElementById("valModalAutoTuneSpeed");
  const modalVoiceEffectSelect = document.getElementById("modalVoiceEffectSelect");

  let currentTuningTrack = null;

  if (!btnPlayPauseTimeline) return;

  const trackColors = [
    "block-cyan", "block-amber", "block-pink", "block-violet",
    "block-emerald", "block-indigo", "block-teal", "block-crimson"
  ];

  const trackBadges = [
    "badge-cyan", "badge-amber", "badge-pink", "badge-violet",
    "badge-cyan", "badge-amber", "badge-pink", "badge-violet"
  ];

  // Initialize track audio elements in memory
  const trackAudioPool = {};
  const trackPlayPending = {};

  // Timeline recording state
  const timelineRecState = {
    isRecording: false,
    startSec: 0,
    recordedPCM: [],
    sampleRate: 44100,
    audioContext: null,
    processorNode: null,
    stream: null,
    targetTrack: null
  };

  function getTrackAudioUrl(filepath) {
    if (!filepath || typeof filepath !== "string") return null;
    filepath = filepath.trim();
    if (!filepath) return null;
    if (filepath.startsWith("http://") || filepath.startsWith("https://") || filepath.startsWith("blob:")) {
      return filepath;
    }
    const clean = filepath.replace(/\\/g, "/");
    if (clean.includes("/uploads/") || clean.includes("uploads/")) {
      const filename = clean.split(/uploads\//).pop();
      return `${API_BASE}/static/uploads/${filename}`;
    }
    if (clean.includes("/vocals/") || clean.includes("vocals/")) {
      const filename = clean.split(/vocals\//).pop();
      return `${API_BASE}/static/vocals/${filename}`;
    }
    if (clean.includes("/outputs/") || clean.includes("outputs/")) {
      const filename = clean.split(/outputs\//).pop();
      return `${API_BASE}/static/outputs/${filename}`;
    }
    if (clean.startsWith("/")) {
      return `${API_BASE}${clean}`;
    }
    return `${API_BASE}/${clean}`;
  }

  function recalculateTotalDuration() {
    let maxEnd = 60.0;
    state.timeline.tracks.forEach((t) => {
      if (t.filepath && t.filepath.trim() !== "") {
        const audio = trackAudioPool[t.id];
        const dur = (audio && audio.duration && !isNaN(audio.duration) && audio.duration > 0)
          ? audio.duration
          : (t.duration_sec || 30.0);
        const end = (t.start_time_sec || 0) + dur;
        if (end > maxEnd) maxEnd = end;
      }
    });

    // Auto-expand duration dynamically without 50s limit (e.g. 2:00, 3:30, 5:00, 10:00+)
    const total = Math.max(60.0, Math.ceil((maxEnd + 15.0) / 15.0) * 15.0);
    state.timeline.totalDurationSec = total;
    if (timelineTotalTime) {
      timelineTotalTime.innerText = formatSeconds(total);
    }
    updateRulerMarkers(total);
  }

  function updateRulerMarkers(totalSec) {
    if (!timelineRuler) return;
    timelineRuler.querySelectorAll(".ruler-marker").forEach((m) => m.remove());

    let stepSec = 10;
    if (totalSec > 600) stepSec = 60;
    else if (totalSec > 300) stepSec = 30;
    else if (totalSec > 120) stepSec = 20;
    else if (totalSec > 60) stepSec = 15;
    else stepSec = 10;

    for (let sec = 0; sec <= totalSec; sec += stepSec) {
      const percent = (sec / totalSec) * 100;
      if (percent > 99.5) continue;
      const marker = document.createElement("div");
      marker.className = "ruler-marker";
      marker.style.left = `${percent.toFixed(2)}%`;
      marker.innerText = formatSeconds(sec);
      timelineRuler.appendChild(marker);
    }

    if (timelinePlayhead && timelinePlayhead.parentElement === timelineRuler) {
      timelineRuler.appendChild(timelinePlayhead);
    }
  }

  function getOrCreateAudio(track) {
    if (!trackAudioPool[track.id]) {
      const audio = new Audio();
      audio.preload = "auto";
      trackAudioPool[track.id] = audio;
    }
    const audio = trackAudioPool[track.id];
    const url = getTrackAudioUrl(track.filepath);
    if (url && audio.src !== url) {
      audio.src = url;
      audio.load();
      audio.addEventListener("loadedmetadata", () => {
        if (audio.duration && !isNaN(audio.duration) && audio.duration > 0) {
          track.duration_sec = audio.duration;
          recalculateTotalDuration();
          const row = document.querySelector(`.track-row[data-track-id="${track.id}"]`);
          if (row) {
            const block = row.querySelector(".sound-block");
            if (block) {
              const total = state.timeline.totalDurationSec || 60.0;
              const leftP = Math.max(0, Math.min(98, ((track.start_time_sec || 0) / total) * 100));
              const widthP = Math.max(0.5, Math.min(100 - leftP, (audio.duration / total) * 100));
              block.style.left = `${leftP.toFixed(1)}%`;
              block.style.width = `${widthP.toFixed(1)}%`;
            }
          }
        }
      }, { once: true });
    }
    return audio;
  }

  function syncTrackAudio(track, currentSec, isPlaying) {
    if (!track.filepath || track.filepath.trim() === "") {
      if (trackAudioPool[track.id]) {
        trackAudioPool[track.id].pause();
      }
      return;
    }

    const audio = getOrCreateAudio(track);
    const vol = track.muted ? 0 : (typeof track.volume === "number" ? track.volume : 1.0);
    audio.volume = Math.max(0, Math.min(1.0, vol));

    const startSec = track.start_time_sec || 0;
    const dur = (audio.duration && !isNaN(audio.duration) && audio.duration > 0)
      ? audio.duration
      : (track.duration_sec || 3.0);
    const endSec = startSec + dur;

    if (currentSec >= startSec && currentSec < endSec) {
      const desiredOffset = currentSec - startSec;
      if (isPlaying) {
        if (audio.readyState < 2) {
          if (!audio.onloadedmetadata) {
            audio.onloadedmetadata = () => {
              if (state.timeline.isPlaying || timelineRecState.isRecording) {
                const off = Math.max(0, state.timeline.playheadSec - (track.start_time_sec || 0));
                audio.currentTime = off;
                trackPlayPending[track.id] = true;
                audio.play().catch((e) => console.warn(e)).finally(() => {
                  trackPlayPending[track.id] = false;
                });
              }
            };
          }
        } else {
          if (audio.paused && !trackPlayPending[track.id]) {
            if (Math.abs(audio.currentTime - desiredOffset) > 0.1 && !audio.seeking) {
              audio.currentTime = desiredOffset;
            }
            trackPlayPending[track.id] = true;
            audio.play().catch((e) => console.warn(e)).finally(() => {
              trackPlayPending[track.id] = false;
            });
          } else if (!audio.paused && !audio.seeking) {
            if (Math.abs(audio.currentTime - desiredOffset) > 0.6) {
              audio.currentTime = desiredOffset;
            }
          }
        }
      } else {
        audio.pause();
        trackPlayPending[track.id] = false;
        if (audio.readyState >= 1 && !audio.seeking) {
          audio.currentTime = desiredOffset;
        }
      }
    } else {
      audio.pause();
      trackPlayPending[track.id] = false;
      if (currentSec < startSec && audio.readyState >= 1 && !audio.seeking) {
        audio.currentTime = 0;
      }
    }
  }

  function syncAllTracks(currentSec, isPlaying) {
    state.timeline.tracks.forEach((track) => {
      // Don't play the track currently being recorded
      if (timelineRecState.isRecording && timelineRecState.targetTrack && timelineRecState.targetTrack.id === track.id) {
        return;
      }
      syncTrackAudio(track, currentSec, isPlaying);
    });
  }

  // --- Dynamic Track DOM Renderer ---
  function renderTimelineDOM() {
    if (!timelineTracksList) return;
    timelineTracksList.innerHTML = "";
    recalculateTotalDuration();

    state.timeline.tracks.forEach((track, index) => {
      const colorClass = track.colorClass || trackColors[index % trackColors.length];
      const badgeClass = trackBadges[index % trackBadges.length];
      const hasSound = Boolean(track.filepath && track.filepath.trim() !== "");
      const isVocal = Boolean(track.isVocal || track.name.toLowerCase().includes("vocal") || track.name.toLowerCase().includes("thu"));

      const totalDur = state.timeline.totalDurationSec || 60.0;
      const leftPercent = Math.max(0, Math.min(98, ((track.start_time_sec || 0) / totalDur) * 100));

      const audio = trackAudioPool[track.id];
      let dur = track.duration_sec;
      if (audio && audio.duration && !isNaN(audio.duration) && audio.duration > 0) {
        dur = audio.duration;
        track.duration_sec = dur;
      }
      if (!dur || isNaN(dur) || dur <= 0) {
        dur = 3.0;
      }

      const widthPercent = Math.max(0.5, Math.min(100 - leftPercent, (dur / totalDur) * 100));

      const row = document.createElement("div");
      row.className = "track-row";
      row.setAttribute("data-track-id", track.id);

      row.innerHTML = `
        <div class="track-header">
          <div class="track-header-top">
            <span class="track-badge ${badgeClass}">TRACK ${index + 1}</span>
            <button class="btn-delete-track" title="Xóa track này">🗑️</button>
          </div>
          <span class="track-title" title="${track.name}">${track.name || `Track ${index + 1}`}</span>
          <div class="track-mini-controls">
            <span class="vol-label">Vol:</span>
            <input type="range" class="custom-slider track-vol-slider" min="0" max="1.5" step="0.05" value="${track.volume || 1.0}">
            <button class="btn-mute ${track.muted ? 'active' : ''}" title="Mute Track">M</button>
          </div>
        </div>
        <div class="track-lane">
          <div class="sound-block ${colorClass}" style="left: ${leftPercent.toFixed(1)}%; width: ${widthPercent.toFixed(1)}%; display: ${hasSound ? 'flex' : 'none'};">
            <span class="sound-block-drag-handle">⠿</span>
            <span class="sound-block-title">${track.name} (${formatSeconds(track.start_time_sec || 0)}s)</span>
            ${isVocal ? '<button class="btn-block-tune" title="Mở bộ chỉnh Auto-Tune cho vocal này">🪄 Auto-Tune</button>' : ''}
            <button class="btn-remove-block" title="Xóa khối âm thanh này">✕</button>
          </div>
        </div>
      `;

      // Event: Track Volume Slider
      const volSlider = row.querySelector(".track-vol-slider");
      volSlider.addEventListener("input", (e) => {
        track.volume = parseFloat(e.target.value);
        if (trackAudioPool[track.id]) {
          const v = track.muted ? 0 : track.volume;
          trackAudioPool[track.id].volume = Math.max(0, Math.min(1.0, v));
        }
      });

      // Event: Mute Button
      const btnMute = row.querySelector(".btn-mute");
      btnMute.addEventListener("click", () => {
        track.muted = !track.muted;
        btnMute.classList.toggle("active", track.muted);
        if (trackAudioPool[track.id]) {
          const v = track.muted ? 0 : track.volume;
          trackAudioPool[track.id].volume = Math.max(0, Math.min(1.0, v));
        }
      });

      // Event: Delete Track
      const btnDelete = row.querySelector(".btn-delete-track");
      btnDelete.addEventListener("click", () => {
        if (state.timeline.tracks.length <= 1) {
          track.filepath = "";
          track.name = "(Trống)";
          renderTimelineDOM();
          return;
        }
        if (trackAudioPool[track.id]) {
          trackAudioPool[track.id].pause();
          delete trackAudioPool[track.id];
        }
        state.timeline.tracks = state.timeline.tracks.filter((t) => t.id !== track.id);
        renderTimelineDOM();
        showToast(`🗑️ Đã xóa Track ${index + 1}!`, "info");
      });

      // Event: Remove Sound Block
      const btnRemoveBlock = row.querySelector(".btn-remove-block");
      if (btnRemoveBlock) {
        btnRemoveBlock.addEventListener("click", (e) => {
          e.stopPropagation();
          track.filepath = "";
          track.name = "(Trống)";
          if (trackAudioPool[track.id]) {
            trackAudioPool[track.id].pause();
            trackAudioPool[track.id].src = "";
          }
          renderTimelineDOM();
          showToast(`🗑️ Đã xóa nội dung của Track ${index + 1}!`, "info");
        });
      }

      // Event: Auto-Tune Button on Vocal Block
      const btnTune = row.querySelector(".btn-block-tune");
      if (btnTune) {
        btnTune.addEventListener("click", (e) => {
          e.stopPropagation();
          openAutoTuneModal(track);
        });
      }

      // Event: Dragging Block along Lane
      const blockEl = row.querySelector(".sound-block");
      if (blockEl) {
        setupBlockDrag(blockEl, track);
      }

      timelineTracksList.appendChild(row);

      // Preload audio
      if (track.filepath) {
        getOrCreateAudio(track);
      }
    });
  }

  function setupBlockDrag(blockEl, track) {
    let isDragging = false;
    let startX = 0;
    let initialLeftPercent = 0;

    blockEl.addEventListener("mousedown", (e) => {
      if (e.target.closest(".btn-remove-block") || e.target.closest(".btn-block-tune")) return;
      isDragging = true;
      startX = e.clientX;
      const styleLeft = blockEl.style.left || "0%";
      initialLeftPercent = parseFloat(styleLeft) || 0;
      e.preventDefault();
    });

    window.addEventListener("mousemove", (e) => {
      if (!isDragging) return;
      const parentLane = blockEl.parentElement;
      if (!parentLane) return;

      const laneWidth = parentLane.getBoundingClientRect().width;
      const deltaX = e.clientX - startX;
      const deltaPercent = (deltaX / laneWidth) * 100;

      let newLeft = Math.max(0, Math.min(88, initialLeftPercent + deltaPercent));
      blockEl.style.left = `${newLeft.toFixed(1)}%`;

      const startSec = (newLeft / 100.0) * state.timeline.totalDurationSec;
      track.start_time_sec = parseFloat(startSec.toFixed(2));

      const titleEl = blockEl.querySelector(".sound-block-title");
      if (titleEl) {
        titleEl.innerText = `${track.name} (${formatSeconds(startSec)}s)`;
      }

      if (state.timeline.isPlaying) {
        syncTrackAudio(track, state.timeline.playheadSec, true);
      }
    });

    window.addEventListener("mouseup", () => {
      if (isDragging) {
        isDragging = false;
        recalculateTotalDuration();
      }
    });
  }

  // --- Add Unlimited New Tracks ---
  function addNewTrack(name = "(Trống)", filepath = "", startTime = 0.0, dur = 30.0, isVocal = false) {
    const nextIdx = state.timeline.tracks.length + 1;
    const newTrack = {
      id: `track_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      name: name || `Track ${nextIdx}`,
      filepath: filepath || "",
      start_time_sec: startTime,
      duration_sec: dur,
      volume: 1.0,
      muted: false,
      isVocal: isVocal,
      colorClass: trackColors[(nextIdx - 1) % trackColors.length]
    };
    state.timeline.tracks.push(newTrack);
    renderTimelineDOM();
    return newTrack;
  }

  if (btnAddTrack) {
    btnAddTrack.addEventListener("click", () => {
      const t = addNewTrack(`Track ${state.timeline.tracks.length + 1}`);
      showToast(`➕ Đã thêm ${t.name} thành công!`, "success");
    });
  }

  // --- WAV Encoder for Microphone Recording ---
  function encodeWAVFromPCM(samples, sampleRate) {
    let maxAmp = 0;
    for (let i = 0; i < samples.length; i++) {
      const abs = Math.abs(samples[i]);
      if (abs > maxAmp) maxAmp = abs;
    }
    let gainMultiplier = 1.0;
    if (maxAmp > 0.01 && maxAmp < 0.85) {
      gainMultiplier = Math.min(3.5, 0.88 / maxAmp);
    }

    const buffer = new ArrayBuffer(44 + samples.length * 2);
    const view = new DataView(buffer);

    function writeString(offset, string) {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    }

    writeString(0, "RIFF");
    view.setUint32(4, 36 + samples.length * 2, true);
    writeString(8, "WAVE");

    writeString(12, "fmt ");
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);

    writeString(36, "data");
    view.setUint32(40, samples.length * 2, true);

    let offset = 44;
    for (let i = 0; i < samples.length; i++, offset += 2) {
      let s = samples[i] * gainMultiplier;
      if (s > 0.98) s = 0.98;
      if (s < -0.98) s = -0.98;
      view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
    }

    return new Blob([view], { type: "audio/wav" });
  }

  // --- RECORD AT PLAYHEAD (VẠCH ĐỎ) ---
  if (btnRecordAtPlayhead) {
    btnRecordAtPlayhead.addEventListener("click", () => {
      if (timelineRecState.isRecording) {
        stopTimelineRecording();
      } else {
        startTimelineRecording();
      }
    });
  }

  async function startTimelineRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
          channelCount: 1,
          latency: 0
        }
      });
      timelineRecState.stream = stream;
      timelineRecState.recordedPCM = [];

      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      timelineRecState.audioContext = audioCtx;
      timelineRecState.sampleRate = audioCtx.sampleRate;

      const source = audioCtx.createMediaStreamSource(stream);
      const processor = audioCtx.createScriptProcessor(4096, 1, 1);
      timelineRecState.processorNode = processor;

      processor.onaudioprocess = (e) => {
        if (!timelineRecState.isRecording) return;
        const inputData = e.inputBuffer.getChannelData(0);
        const copy = new Float32Array(inputData.length);
        copy.set(inputData);
        timelineRecState.recordedPCM.push(copy);
      };

      source.connect(processor);
      const silentGain = audioCtx.createGain();
      silentGain.gain.value = 0;
      processor.connect(silentGain);
      silentGain.connect(audioCtx.destination);

      const recordStartSec = state.timeline.playheadSec || 0;
      timelineRecState.startSec = recordStartSec;
      timelineRecState.isRecording = true;

      // Find an empty track or create a new Vocal track
      let targetTrack = state.timeline.tracks.find((t) => !t.filepath || t.filepath.trim() === "");
      if (!targetTrack) {
        targetTrack = addNewTrack(`🎙️ Vocal Thu Âm (${formatSeconds(recordStartSec)})`, "", recordStartSec, 10.0, true);
      } else {
        targetTrack.name = `🎙️ Vocal Thu Âm (${formatSeconds(recordStartSec)})`;
        targetTrack.start_time_sec = recordStartSec;
        targetTrack.isVocal = true;
        renderTimelineDOM();
      }
      timelineRecState.targetTrack = targetTrack;

      // Update UI for recording state
      btnRecordAtPlayhead.classList.add("recording");
      recPlayheadDot.innerText = "⏹";
      recPlayheadLabel.innerText = "DỪNG THU (Đang thu âm...)";

      // Start playing backing tracks in sync
      syncAllTracks(recordStartSec, true);

      clearInterval(state.timeline.playInterval);
      const tickIntervalMs = 100;
      const tickSec = tickIntervalMs / 1000.0;

      state.timeline.playInterval = setInterval(() => {
        state.timeline.playheadSec += tickSec;
        timelineCurrentTime.innerText = formatSeconds(state.timeline.playheadSec);

        const totalDur = Math.max(state.timeline.totalDurationSec, state.timeline.playheadSec + 5.0);
        state.timeline.totalDurationSec = totalDur;
        timelineTotalTime.innerText = formatSeconds(totalDur);

        const percent = (state.timeline.playheadSec / totalDur) * 100;
        timelinePlayhead.style.left = `${Math.min(100, Math.max(0, percent))}%`;

        // Update live recording sound block width
        const trackRow = document.querySelector(`.track-row[data-track-id="${targetTrack.id}"]`);
        if (trackRow) {
          const block = trackRow.querySelector(".sound-block");
          if (block) {
            block.style.display = "flex";
            block.classList.add("recording-live");
            const leftP = (recordStartSec / totalDur) * 100;
            const widthP = Math.max(2, ((state.timeline.playheadSec - recordStartSec) / totalDur) * 100);
            block.style.left = `${leftP.toFixed(1)}%`;
            block.style.width = `${widthP.toFixed(1)}%`;
            const titleEl = block.querySelector(".sound-block-title");
            if (titleEl) {
              titleEl.innerText = `🔴 Đang thu âm (${formatSeconds(recordStartSec)}s - ${formatSeconds(state.timeline.playheadSec)}s)`;
            }
          }
        }

        // Keep other tracks synced
        syncAllTracks(state.timeline.playheadSec, true);
      }, tickIntervalMs);

      showToast(`🎙️ Đang thu âm trực tiếp từ ${formatSeconds(recordStartSec)}s! Hãy hát vào mic...`, "info");
    } catch (err) {
      showToast("Không thể mở Microphone: " + err.message, "error");
    }
  }

  async function stopTimelineRecording() {
    timelineRecState.isRecording = false;
    clearInterval(state.timeline.playInterval);

    btnRecordAtPlayhead.classList.remove("recording");
    recPlayheadDot.innerText = "🔴";
    recPlayheadLabel.innerText = "Thu Âm Tại Vạch Đỏ";

    // Pause all playback
    syncAllTracks(state.timeline.playheadSec, false);

    // Stop streams
    if (timelineRecState.processorNode) {
      timelineRecState.processorNode.disconnect();
      timelineRecState.processorNode = null;
    }
    if (timelineRecState.stream) {
      timelineRecState.stream.getTracks().forEach((track) => track.stop());
      timelineRecState.stream = null;
    }

    const chunks = timelineRecState.recordedPCM || [];
    let totalLength = 0;
    for (let i = 0; i < chunks.length; i++) {
      totalLength += chunks[i].length;
    }

    const mergedPCM = new Float32Array(totalLength);
    let offset = 0;
    for (let i = 0; i < chunks.length; i++) {
      mergedPCM.set(chunks[i], offset);
      offset += chunks[i].length;
    }

    if (totalLength > 0 && timelineRecState.targetTrack) {
      const sampleRate = timelineRecState.sampleRate || 44100;
      const wavBlob = encodeWAVFromPCM(mergedPCM, sampleRate);
      const recordedDur = totalLength / sampleRate;

      const targetTrack = timelineRecState.targetTrack;
      targetTrack.duration_sec = parseFloat(recordedDur.toFixed(2));
      targetTrack.start_time_sec = timelineRecState.startSec;

      // Upload to server
      showToast("💾 Đang lưu đoạn thu âm lên server...", "info");
      const formData = new FormData();
      formData.append("file", wavBlob, `timeline_vocal_${Date.now()}.wav`);

      try {
        const res = await fetch(`${API_BASE}/api/save-recording`, {
          method: "POST",
          body: formData
        });
        const json = await res.json();
        if (json.status === "success") {
          targetTrack.filepath = json.vocal_path;
          targetTrack.rawFilepath = json.vocal_path; // Store clean original raw recording
          targetTrack.name = `Vocal Mộc (${formatSeconds(timelineRecState.startSec)}s)`;
          renderTimelineDOM();
          showToast("✅ Đã lưu xong đoạn Vocal Giọng Mộc! Bấm nút 🪄 Auto-Tune trên khối nếu bạn muốn nắn tone.", "success");
        }
      } catch (e) {
        showToast("Lỗi lưu file thu âm", "error");
      }
    }

    if (timelineRecState.audioContext) {
      timelineRecState.audioContext.close().catch(() => {});
      timelineRecState.audioContext = null;
    }
  }

  // --- INLINE AUTOTUNE MODAL HANDLERS ---
  function openAutoTuneModal(track) {
    if (!track || !track.filepath) {
      showToast("⚠️ Track này chưa có file âm thanh để Auto-Tune!", "warning");
      return;
    }
    currentTuningTrack = track;

    // Pre-fill key & scale from detected Beat if available
    if (state.beat && state.beat.key) {
      const parts = state.beat.key.split(" ");
      if (parts[0] && modalKeySelect) modalKeySelect.value = parts[0];
      if (parts[1] && modalScaleSelect) modalScaleSelect.value = parts[1];
    }

    if (autoTuneModal) {
      autoTuneModal.style.display = "flex";
    }
  }

  if (btnCloseAutoTuneModal) {
    btnCloseAutoTuneModal.addEventListener("click", () => {
      if (autoTuneModal) autoTuneModal.style.display = "none";
    });
  }

  if (btnCancelAutoTuneModal) {
    btnCancelAutoTuneModal.addEventListener("click", () => {
      if (autoTuneModal) autoTuneModal.style.display = "none";
    });
  }

  // Reset to Pristine Raw Vocal (No Auto-Tune)
  const btnResetToRawVocal = document.getElementById("btnResetToRawVocal");
  if (btnResetToRawVocal) {
    btnResetToRawVocal.addEventListener("click", () => {
      if (!currentTuningTrack) return;
      if (currentTuningTrack.rawFilepath) {
        currentTuningTrack.filepath = currentTuningTrack.rawFilepath;
      }
      currentTuningTrack.name = currentTuningTrack.name.replace(/ \(Auto-Tuned\)/g, "");
      if (!currentTuningTrack.name.includes("(Giọng Mộc)")) {
        currentTuningTrack.name += " (Giọng Mộc)";
      }
      if (trackAudioPool[currentTuningTrack.id]) {
        trackAudioPool[currentTuningTrack.id].src = getTrackAudioUrl(currentTuningTrack.filepath);
        trackAudioPool[currentTuningTrack.id].load();
      }
      renderTimelineDOM();
      if (autoTuneModal) autoTuneModal.style.display = "none";
      showToast("🎙️ Đã chọn dùng Giọng Mộc tự nhiên 100% (Không Auto-Tune)!", "info");
    });
  }

  if (modalSpeedSlider && valModalAutoTuneSpeed) {
    modalSpeedSlider.addEventListener("input", (e) => {
      const v = parseInt(e.target.value);
      if (v < 35) valModalAutoTuneSpeed.innerText = `${v}% (Tự nhiên / Nhẹ nhàng)`;
      else if (v < 75) valModalAutoTuneSpeed.innerText = `${v}% (Studio Pitch Correction)`;
      else valModalAutoTuneSpeed.innerText = `${v}% (Trap / Hard Tune / Cyber)`;
    });
  }

  if (btnApplyModalAutoTune) {
    btnApplyModalAutoTune.addEventListener("click", async () => {
      if (!currentTuningTrack || !currentTuningTrack.filepath) return;

      const key = modalKeySelect ? modalKeySelect.value : "C";
      const scale = modalScaleSelect ? modalScaleSelect.value : "Major";
      const speed = modalSpeedSlider ? parseFloat(modalSpeedSlider.value) / 100.0 : 0.75;
      const fx = modalVoiceEffectSelect ? modalVoiceEffectSelect.value : "none";

      showToast("🪄 Đang nắn Auto-Tune và áp dụng hiệu ứng phòng thu...", "info");
      btnApplyModalAutoTune.disabled = true;

      try {
        const sourceVocal = currentTuningTrack.rawFilepath || currentTuningTrack.filepath;
        const res = await fetch(`${API_BASE}/api/apply-autotune-fx`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            vocal_path: sourceVocal,
            target_key: key,
            scale_type: scale,
            tune_speed: speed,
            voice_effect: fx
          })
        });

        const json = await res.json();
        if (json.status === "success") {
          currentTuningTrack.filepath = json.vocal_path;
          currentTuningTrack.name = currentTuningTrack.name.replace(/ \(Giọng Mộc\)/g, "").replace(/ \(Auto-Tuned\)/g, "") + " (Auto-Tuned)";

          // Invalidate audio cache and reload
          if (trackAudioPool[currentTuningTrack.id]) {
            trackAudioPool[currentTuningTrack.id].src = `${API_BASE}${json.vocal_url}`;
            trackAudioPool[currentTuningTrack.id].load();
          }

          renderTimelineDOM();
          if (autoTuneModal) autoTuneModal.style.display = "none";
          showToast(`🎉 Đã áp dụng Auto-Tune (${key} ${scale}) cho Vocal thành công!`, "success");
        } else {
          throw new Error(json.detail || "Lỗi xử lý");
        }
      } catch (err) {
        showToast(`Lỗi Auto-Tune: ${err.message}`, "error");
      } finally {
        btnApplyModalAutoTune.disabled = false;
      }
    });
  }

  // --- Transport: Play / Pause / Stop Timeline ---
  btnPlayPauseTimeline.addEventListener("click", () => {
    if (state.timeline.isPlaying) {
      pauseTimeline();
    } else {
      playTimeline();
    }
  });

  btnStopTimeline.addEventListener("click", () => {
    stopTimeline();
  });

  function playTimeline() {
    if (state.timeline.tracks.length > 0 && !state.timeline.tracks[0].filepath && state.beat.serverPath) {
      state.timeline.tracks[0].filepath = state.beat.serverPath;
    }

    const hasAnyTrack = state.timeline.tracks.some((t) => t.filepath && t.filepath.trim() !== "");
    if (!hasAnyTrack) {
      showToast("⚠️ Chưa có track nào có âm thanh trên Timeline!", "warning");
      return;
    }

    recalculateTotalDuration();

    if (state.timeline.playheadSec >= state.timeline.totalDurationSec - 0.5) {
      state.timeline.playheadSec = 0;
    }

    state.timeline.isPlaying = true;
    timelinePlayIcon.innerText = "⏸";
    timelinePlayText.innerText = "Tạm dừng";

    syncAllTracks(state.timeline.playheadSec, true);

    clearInterval(state.timeline.playInterval);
    const tickIntervalMs = 100;
    const tickSec = tickIntervalMs / 1000.0;

    state.timeline.playInterval = setInterval(() => {
      state.timeline.playheadSec += tickSec;
      if (state.timeline.playheadSec >= state.timeline.totalDurationSec) {
        stopTimeline();
        return;
      }

      timelineCurrentTime.innerText = formatSeconds(state.timeline.playheadSec);
      const percent = (state.timeline.playheadSec / state.timeline.totalDurationSec) * 100;
      timelinePlayhead.style.left = `${Math.min(100, Math.max(0, percent))}%`;

      syncAllTracks(state.timeline.playheadSec, true);
    }, tickIntervalMs);
  }

  function pauseTimeline() {
    state.timeline.isPlaying = false;
    timelinePlayIcon.innerText = "▶";
    timelinePlayText.innerText = "Phát Timeline";
    clearInterval(state.timeline.playInterval);

    syncAllTracks(state.timeline.playheadSec, false);
  }

  function stopTimeline() {
    pauseTimeline();
    state.timeline.playheadSec = 0;
    timelineCurrentTime.innerText = "00:00.0";
    timelinePlayhead.style.left = "0%";

    state.timeline.tracks.forEach((track) => {
      const audio = trackAudioPool[track.id];
      if (audio) {
        audio.pause();
        if (audio.readyState >= 1) audio.currentTime = 0;
      }
    });
  }

  // --- Seeking / Drag Scrubbing on Playhead Knob, Line & Ruler ---
  let isPlayheadDragging = false;

  function seekToX(clientX) {
    if (!timelineRuler) return;
    const rect = timelineRuler.getBoundingClientRect();
    const clickX = clientX - rect.left;
    const percent = Math.max(0, Math.min(1, clickX / rect.width));
    recalculateTotalDuration();
    const newSec = percent * state.timeline.totalDurationSec;
    state.timeline.playheadSec = newSec;
    timelineCurrentTime.innerText = formatSeconds(newSec);
    timelinePlayhead.style.left = `${(percent * 100).toFixed(2)}%`;
    syncAllTracks(newSec, state.timeline.isPlaying);
  }

  // 1. Drag on Playhead line or top knob
  if (timelinePlayhead) {
    timelinePlayhead.addEventListener("mousedown", (e) => {
      isPlayheadDragging = true;
      e.preventDefault();
      e.stopPropagation();
      seekToX(e.clientX);
    });
  }

  // 2. Click / Drag on Timeline Ruler
  if (timelineRuler) {
    timelineRuler.addEventListener("mousedown", (e) => {
      isPlayheadDragging = true;
      e.preventDefault();
      seekToX(e.clientX);
    });
  }

  // 3. Click / Drag on empty track lanes
  if (timelineTracksList) {
    timelineTracksList.addEventListener("mousedown", (e) => {
      if (e.target.closest(".sound-block") || e.target.closest(".track-header")) return;
      isPlayheadDragging = true;
      seekToX(e.clientX);
    });
  }

  // 4. Global window mousemove & mouseup for fluid drag scrubbing anywhere
  window.addEventListener("mousemove", (e) => {
    if (isPlayheadDragging) {
      seekToX(e.clientX);
    }
  });

  window.addEventListener("mouseup", () => {
    if (isPlayheadDragging) {
      isPlayheadDragging = false;
    }
  });

  // --- Upload Multiple Audio Files onto Timeline (Unlimited Tracks) ---
  if (btnAddAudio && timelineAudioFileInput) {
    btnAddAudio.addEventListener("click", () => timelineAudioFileInput.click());
    timelineAudioFileInput.addEventListener("change", async (e) => {
      if (!e.target.files || e.target.files.length === 0) return;
      const files = Array.from(e.target.files);
      showToast(`⚡ Đang nạp ${files.length} file âm thanh vào Timeline...`, "info");

      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        // Find next empty track or create a new one dynamically
        let targetTrack = state.timeline.tracks.find((t, idx) => idx > 0 && (!t.filepath || t.filepath.trim() === ""));
        if (!targetTrack) {
          targetTrack = addNewTrack(file.name, "", 0.0, 30.0, false);
        } else {
          targetTrack.name = file.name;
        }

        const formData = new FormData();
        formData.append("file", file);

        try {
          const res = await fetch(`${API_BASE}/api/upload-track-fast`, {
            method: "POST",
            body: formData
          });
          const json = await res.json();
          if (json.status === "success") {
            targetTrack.filepath = json.server_filepath;
            targetTrack.duration_sec = json.duration_seconds || 30.0;
            getOrCreateAudio(targetTrack);
          }
        } catch (err) {
          console.error("Lỗi upload file:", err);
        }
      }

      renderTimelineDOM();
      showToast(`✅ Đã nạp thành công ${files.length} file vào các Track Timeline!`, "success");
      timelineAudioFileInput.value = "";
    });
  }

  // --- Auto-Detect Beat Structure (Intro, Verse, Drop/Bassline, Outro) ---
  const btnDetectBeatStructure = document.getElementById("btnDetectBeatStructure");
  if (btnDetectBeatStructure) {
    btnDetectBeatStructure.addEventListener("click", async () => {
      let beatPath = state.beat.serverPath;
      if (!beatPath && state.timeline.tracks.length > 0 && state.timeline.tracks[0].filepath) {
        beatPath = state.timeline.tracks[0].filepath;
      }
      if (!beatPath) {
        beatPath = "data/uploads/demo_beat_lofi_90bpm.wav";
      }

      showToast("🔍 AI đang tự động phân tích nhịp beat, tìm đoạn Intro, Bassline & Outro...", "info");
      btnDetectBeatStructure.disabled = true;

      try {
        const res = await fetch(`${API_BASE}/api/detect-beat-structure`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ beat_path: beatPath })
        });

        const data = await res.json();
        if (data.status === "success" && data.sections) {
          const newTracks = [];
          newTracks.push({
            id: "track_1",
            name: "🎵 Beat Toàn Bài (Master)",
            filepath: beatPath,
            start_time_sec: 0.0,
            duration_sec: data.duration_seconds,
            volume: 1.0,
            muted: false,
            colorClass: "block-cyan"
          });

          data.sections.forEach((sec, idx) => {
            newTracks.push({
              id: `track_sec_${idx + 2}`,
              name: `${sec.name}`,
              filepath: beatPath,
              start_time_sec: sec.start_time_sec,
              duration_sec: sec.duration_sec,
              volume: 1.0,
              muted: false,
              colorClass: sec.color_class || trackColors[(idx + 1) % trackColors.length]
            });
          });

          newTracks.push({
            id: `track_vocal_${Date.now()}`,
            name: "🎙️ Vocal Thu Âm Mới",
            filepath: "",
            start_time_sec: 0.0,
            duration_sec: 0.0,
            volume: 1.25,
            muted: false,
            isVocal: true,
            colorClass: "block-pink"
          });

          state.timeline.tracks = newTracks;
          state.timeline.totalDurationSec = Math.max(60.0, data.duration_seconds + 15.0);
          renderTimelineDOM();

          showToast(`⚡ AI đã nhận diện BPM: ${data.bpm} & tách thành công các đoạn Intro, Verse, Drop/Bassline, Outro!`, "success");
        } else {
          throw new Error(data.detail || "Không thể phân tích beat");
        }
      } catch (err) {
        showToast(`Lỗi nhận diện cấu trúc: ${err.message}`, "error");
      } finally {
        btnDetectBeatStructure.disabled = false;
      }
    });
  }

  // --- 1-Click Master Multi-Track Render ---
  btnRenderMaster.addEventListener("click", async () => {
    if (state.beat.serverPath && state.timeline.tracks.length > 0) {
      state.timeline.tracks[0].filepath = state.beat.serverPath;
    }

    const activeTracks = state.timeline.tracks.filter((t) => t.filepath && t.filepath.trim() !== "");
    if (activeTracks.length === 0) {
      state.timeline.tracks[0].filepath = "data/uploads/demo_beat_lofi_90bpm.wav";
      activeTracks.push(state.timeline.tracks[0]);
    }

    showToast("🔥 Đang ghép & render toàn bộ các Track trên Timeline...", "info");
    btnRenderMaster.disabled = true;

    try {
      const res = await fetch(`${API_BASE}/api/render-multitrack`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tracks: activeTracks,
          song_title: state.lyrics.title || "MultiTrack_Master"
        })
      });

      const data = await res.json();
      if (data.status === "success") {
        const fullUrl = `${API_BASE}${data.master_url}`;
        masterPlayer.src = fullUrl;
        btnDownload.href = `${API_BASE}/api/download/${data.filename}`;
        resultCard.style.display = "block";
        masterPlayer.play();
        showToast("🎉 Ghép & Xuất Master Timeline hoàn tất! Đang phát thử bản master.", "success");
      } else {
        throw new Error(data.detail || "Lỗi render");
      }
    } catch (e) {
      showToast(`Lỗi: ${e.message}. Hãy đảm bảo Python Backend đang chạy!`, "error");
    } finally {
      btnRenderMaster.disabled = false;
    }
  });

  // Initial Render of Timeline DOM
  renderTimelineDOM();
}

