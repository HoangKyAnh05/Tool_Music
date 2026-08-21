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
  audioPlayer: new Audio(),
  masterAudioUrl: null
};

// --- DOM Elements ---
const navTabs = document.querySelectorAll(".nav-tab");
const tabContents = document.querySelectorAll(".tab-content");
const toastContainer = document.getElementById("toastContainer");

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
  setupBeatUpload();
  setupAudioPlayer();
  setupLyricsActions();
  setupSmartPasteModal();
  setupMixerControls();
  setupSettings();
  loadBackendSettings();
  initSampleData();
});

// Refresh Application Button Handler
function setupRefreshButton() {
  const btnRefresh = document.getElementById("btnRefreshApp");
  const refreshIcon = document.getElementById("refreshIcon");
  const backendStatus = document.getElementById("backendStatus");

  if (!btnRefresh) return;

  btnRefresh.addEventListener("click", async () => {
    if (refreshIcon) refreshIcon.classList.add("refresh-spinning");
    showToast("Đang làm mới dữ liệu và kết nối backend...", "info");

    try {
      const res = await fetch(`${API_BASE}/api/health`, { cache: "no-store" });
      if (res.ok) {
        if (backendStatus) {
          backendStatus.innerHTML = '<span class="status-dot online"></span><span class="status-text">Backend Online</span>';
        }
        await loadBackendSettings();
        setTimeout(() => {
          if (refreshIcon) refreshIcon.classList.remove("refresh-spinning");
          showToast("Đã làm mới ứng dụng thành công!", "success");
        }, 500);
      } else {
        throw new Error("Backend response not ok");
      }
    } catch (e) {
      if (backendStatus) {
        backendStatus.innerHTML = '<span class="status-dot offline" style="background: #ef4444; box-shadow: 0 0 8px #ef4444;"></span><span class="status-text">Backend Mất Kết Nối</span>';
      }
      if (refreshIcon) refreshIcon.classList.remove("refresh-spinning");
      showToast("Không thể kết nối Python Backend!", "error");
    }
  });

  // Double click for hard UI reload
  btnRefresh.addEventListener("dblclick", () => {
    showToast("Đang nạp lại toàn bộ giao diện...", "info");
    setTimeout(() => {
      if (window.electronAPI && window.electronAPI.reloadApp) {
        window.electronAPI.reloadApp();
      } else {
        window.location.reload();
      }
    }, 300);
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
  // Populate sample lyrics template
  document.getElementById("sec_intro").value = "(Nhạc dạo acoustic guitar êm dịu, nhịp trống nhẹ nhàng)";
  document.getElementById("sec_verse_1").value = "Từng giọt mưa rơi nhẹ bên góc hiên xưa\nNhớ lại ngày tháng ta cùng đón cơn mưa\nÁnh mắt trao nhau bao điều chưa kịp nói\nĐể lại nỗi nhớ theo năm tháng không vơi.";
  document.getElementById("sec_pre_chorus").value = "Dù thời gian trôi qua muôn trùng xa cách\nTrái tim anh vẫn hướng về em mãi thôi.";
  document.getElementById("sec_chorus").value = "Và anh sẽ hát khúc ca này gửi trao em\nGiữ trọn bao thương nhớ trong từng đêm đen\nNguyện cùng nhau đi qua muôn trùng giông bão\nĐến nơi chân trời lung linh ngàn ánh sao.";
  document.getElementById("sec_verse_2").value = "Bầu trời đêm rạng ngời muôn ánh trăng thanh\nNhư gửi gắm yêu thương về phía em nhanh\nNụ cười rạng rỡ xóa tan mọi âu lo\nCho tình yêu này mãi không hề đắn đo.";
  document.getElementById("sec_bridge").value = "Dẫu ngày mai đường đời chia đôi ngả\nLời hẹn ước xưa vẫn luôn vẹn nguyên.";
  document.getElementById("sec_outro").value = "(Giai điệu dịu dần, tiếng ngân nga lắng đọng vào không gian...)";
}
