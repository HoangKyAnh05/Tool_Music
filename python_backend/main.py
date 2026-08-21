import os
import sys
import json
import time
import shutil
from pathlib import Path
from typing import Dict, Any, Optional

# Ensure python_backend directory is in sys.path
BASE_DIR = Path(__file__).resolve().parent.parent
BACKEND_DIR = Path(__file__).resolve().parent
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from fastapi import FastAPI, UploadFile, File, Form, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel

from audio_engine import analyze_beat, mix_beat_and_vocals
from ai_lyricist import generate_lyrics_ai, parse_smart_paste, normalize_song_data
from tts_engine import get_available_voices, generate_vocal_track

# Base directory setup
BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
UPLOADS_DIR = DATA_DIR / "uploads"
VOCALS_DIR = DATA_DIR / "vocals"
OUTPUTS_DIR = DATA_DIR / "outputs"
PROJECTS_DIR = DATA_DIR / "projects"
TEMP_DIR = DATA_DIR / "temp"
CONFIG_FILE = BASE_DIR / "config.json"

for folder in [DATA_DIR, UPLOADS_DIR, VOCALS_DIR, OUTPUTS_DIR, PROJECTS_DIR, TEMP_DIR]:
    folder.mkdir(parents=True, exist_ok=True)

app = FastAPI(title="AI Music & Vocal Studio Backend", version="1.0.0")

# Enable CORS for Electron / web clients
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static folders for audio streaming
app.mount("/static/uploads", StaticFiles(directory=str(UPLOADS_DIR)), name="uploads")
app.mount("/static/vocals", StaticFiles(directory=str(VOCALS_DIR)), name="vocals")
app.mount("/static/outputs", StaticFiles(directory=str(OUTPUTS_DIR)), name="outputs")


def load_config() -> dict:
    if CONFIG_FILE.exists():
        try:
            with open(CONFIG_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            pass
    return {"gemini_api_key": "", "default_voice": "vi-VN-HoaiMyNeural", "theme": "dark_studio"}


def save_config(config_data: dict):
    with open(CONFIG_FILE, "w", encoding="utf-8") as f:
        json.dump(config_data, f, ensure_ascii=False, indent=2)


# --- Request Models ---

class LyricsRequest(BaseModel):
    prompt_idea: str
    genre: str = "V-Pop Ballad"
    bpm: float = 90.0
    key: str = "C Major"
    mood: str = "Sâu lắng, cảm xúc"
    voice_style: str = "Nam trầm ấm"
    gemini_api_key: Optional[str] = None


class SmartPasteRequest(BaseModel):
    clipboard_text: str


class MixSongRequest(BaseModel):
    beat_path: str
    lyrics: Dict[str, str]
    voice_id: str = "vi-VN-HoaiMyNeural"
    speed_percent: int = 0
    pitch_hz: int = 0
    mix_settings: Dict[str, Any] = {
        "beat_volume": 1.0,
        "vocal_volume": 1.2,
        "reverb": 0.35,
        "delay": 0.15,
        "compressor": True,
        "eq_preset": "warm_vocal",
        "vocal_offset_ms": 0
    }
    song_title: Optional[str] = "My_AI_Song"


class VocalOnlyRequest(BaseModel):
    lyrics: Dict[str, str]
    voice_id: str = "vi-VN-HoaiMyNeural"
    speed_percent: int = 0
    pitch_hz: int = 0


# --- Endpoints ---

@app.get("/api/health")
async def health_check():
    return {"status": "ok", "app": "AI Music & Vocal Studio Engine", "version": "1.0.0"}


@app.get("/api/voices")
async def list_voices():
    return {"voices": get_available_voices()}


@app.get("/api/settings")
async def get_settings():
    return load_config()


@app.post("/api/settings")
async def update_settings(settings: dict):
    current = load_config()
    current.update(settings)
    save_config(current)
    return {"status": "success", "settings": current}


@app.post("/api/analyze-beat")
async def analyze_beat_file(file: UploadFile = File(...)):
    """Uploads and analyzes audio file for BPM, key, duration and waveform."""
    try:
        timestamp = int(time.time())
        filename = f"{timestamp}_{file.filename}"
        save_path = UPLOADS_DIR / filename
        
        with open(save_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        analysis = analyze_beat(str(save_path))
        analysis["url"] = f"/static/uploads/{filename}"
        analysis["server_filepath"] = str(save_path)
        return {"status": "success", "data": analysis}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lỗi phân tích beat: {str(e)}")


@app.post("/api/optimize-lyrics")
async def optimize_lyrics_endpoint(req: LyricsRequest):
    """Uses Gemini 1.5 Flash to generate or optimize lyrics according to BPM and musical style."""
    config = load_config()
    api_key = req.gemini_api_key or config.get("gemini_api_key") or os.environ.get("GEMINI_API_KEY", "")
    
    try:
        result = generate_lyrics_ai(
            prompt_idea=req.prompt_idea,
            genre=req.genre,
            bpm=req.bpm,
            key=req.key,
            mood=req.mood,
            voice_style=req.voice_style,
            api_key=api_key
        )
        return {"status": "success", "data": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lỗi tạo lời AI: {str(e)}")


@app.post("/api/smart-paste")
async def smart_paste_endpoint(req: SmartPasteRequest):
    """Parses raw text or JSON from clipboard into structured song schema."""
    try:
        parsed = parse_smart_paste(req.clipboard_text)
        return {"status": "success", "data": parsed}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Không thể phân tích dữ liệu: {str(e)}")


@app.post("/api/generate-vocals-only")
async def generate_vocals_only(req: VocalOnlyRequest):
    """Generates vocal track only."""
    try:
        timestamp = int(time.time())
        vocal_filename = f"vocal_{timestamp}.wav"
        vocal_path = VOCALS_DIR / vocal_filename
        
        await generate_vocal_track(
            lyrics_sections=req.lyrics,
            voice_id=req.voice_id,
            speed_percent=req.speed_percent,
            pitch_hz=req.pitch_hz,
            output_vocal_path=str(vocal_path),
            temp_dir=str(TEMP_DIR)
        )
        
        return {
            "status": "success",
            "vocal_url": f"/static/vocals/{vocal_filename}",
            "vocal_path": str(vocal_path)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lỗi tạo giọng hát: {str(e)}")


@app.post("/api/mix-song")
async def mix_full_song(req: MixSongRequest):
    """
    1-Click Master Workflow:
    1. Generates neural vocals with rhythm spacing in parallel.
    2. Applies studio DSP effects (EQ, Reverb, Compressor, Delay).
    3. Mixes vocals over beat and exports master MP3.
    """
    try:
        beat_path_obj = Path(req.beat_path)
        if not beat_path_obj.is_absolute():
            beat_path_obj = BASE_DIR / req.beat_path
            
        if not beat_path_obj.exists():
            raise HTTPException(status_code=404, detail=f"File Beat không tồn tại trên server: {req.beat_path}")
            
        actual_beat_path = str(beat_path_obj)
        timestamp = int(time.time())
        safe_title = "".join(c for c in (req.song_title or "AI_Master_Song") if c.isalnum() or c in (' ', '_', '-')).rstrip()
        safe_title = safe_title.replace(" ", "_")
        
        # 1. Generate vocal track in parallel
        vocal_filename = f"vocal_{timestamp}.wav"
        vocal_path = VOCALS_DIR / vocal_filename
        
        await generate_vocal_track(
            lyrics_sections=req.lyrics,
            voice_id=req.voice_id,
            speed_percent=req.speed_percent,
            pitch_hz=req.pitch_hz,
            output_vocal_path=str(vocal_path),
            temp_dir=str(TEMP_DIR)
        )
        
        # 2. Mix Beat and Vocal
        master_mp3_filename = f"{safe_title}_{timestamp}.mp3"
        master_output_path = OUTPUTS_DIR / master_mp3_filename
        
        mix_beat_and_vocals(
            beat_path=actual_beat_path,
            vocal_path=str(vocal_path),
            output_path=str(master_output_path),
            mix_settings=req.mix_settings
        )
        
        return {
            "status": "success",
            "message": "Mix nhạc thành công!",
            "master_url": f"/static/outputs/{master_mp3_filename}",
            "master_filepath": str(master_output_path),
            "vocal_url": f"/static/vocals/{vocal_filename}",
            "filename": master_mp3_filename
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lỗi trong quá trình mix nhạc: {str(e)}")


@app.get("/api/download/{filename}")
async def download_file(filename: str):
    file_path = OUTPUTS_DIR / filename
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File không tồn tại.")
    return FileResponse(path=str(file_path), filename=filename, media_type="audio/mpeg")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8888)
