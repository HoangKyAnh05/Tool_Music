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

from audio_engine import (
    analyze_beat,
    detect_beat_structure,
    mix_beat_and_vocals,
    render_multitrack_timeline,
    auto_tune_vocal,
    apply_voice_effect_preset,
    extract_audio_from_video,
    separate_vocals_and_beat
)
from ai_music_generator import generate_ai_beat
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

# Mount static directories
app.mount("/static/uploads", StaticFiles(directory=str(UPLOADS_DIR)), name="uploads")
app.mount("/static/vocals", StaticFiles(directory=str(VOCALS_DIR)), name="vocals")
app.mount("/static/outputs", StaticFiles(directory=str(OUTPUTS_DIR)), name="outputs")


@app.get("/api/health")
async def health_check():
    return {"status": "ok", "message": "AI Music Studio Backend is running!"}



# Pydantic Request Models
class OptimizeLyricsRequest(BaseModel):
    prompt_idea: str
    genre: Optional[str] = "V-Pop Ballad"
    bpm: Optional[float] = 90.0
    key: Optional[str] = "C Major"
    mood: Optional[str] = "Sâu lắng, cảm xúc"
    api_key: Optional[str] = None


class SmartPasteRequest(BaseModel):
    clipboard_text: str


class VocalOnlyRequest(BaseModel):
    lyrics: Dict[str, str]
    voice_id: str = "vi-VN-HoaiMyNeural"
    speed_percent: int = 0
    pitch_hz: int = 0


class MixSongRequest(BaseModel):
    beat_path: str
    lyrics: Dict[str, str]
    voice_id: str = "vi-VN-HoaiMyNeural"
    speed_percent: int = 0
    pitch_hz: int = 0
    mix_settings: Dict[str, Any] = {
        "beat_volume": 1.0,
        "vocal_volume": 1.25,
        "reverb": 0.35,
        "delay": 0.15,
        "compressor": True,
        "eq_preset": "warm_vocal"
    }
    song_title: Optional[str] = "AI_Master_Song"


class AutoTuneRequest(BaseModel):
    vocal_path: str
    target_key: Optional[str] = "C"
    scale_type: Optional[str] = "Major"
    tune_speed: Optional[float] = 0.8
    voice_effect: Optional[str] = "none"


class MultiTrackRenderRequest(BaseModel):
    tracks: list
    song_title: Optional[str] = "MultiTrack_Master"


class QuickMixRecordingRequest(BaseModel):
    vocal_path: str
    beat_path: Optional[str] = None
    vocal_volume: Optional[float] = 1.25
    beat_volume: Optional[float] = 1.0


class SettingsRequest(BaseModel):
    gemini_api_key: Optional[str] = None
    default_voice: Optional[str] = "vi-VN-HoaiMyNeural"


class AIMusicGenerateRequest(BaseModel):
    prompt: Optional[str] = "Lofi Chill Beat"
    genre: Optional[str] = "lofi"
    bpm: Optional[float] = 90.0
    key: Optional[str] = "C"
    scale: Optional[str] = "Major"
    duration_sec: Optional[float] = 60.0


# API Endpoints
@app.get("/api/health")
async def health_check():
    return {"status": "ok", "message": "AI Music & Vocal Studio Backend Running!"}


@app.post("/api/generate-ai-music")
async def api_generate_ai_music(req: AIMusicGenerateRequest):
    """Generates AI music and backing beat based on prompt & musical parameters."""
    try:
        data = generate_ai_beat(
            prompt=req.prompt or "Lofi Chill Beat",
            genre=req.genre or "lofi",
            bpm=req.bpm or 90.0,
            key=req.key or "C",
            scale=req.scale or "Major",
            duration_sec=req.duration_sec or 60.0,
            output_dir=str(UPLOADS_DIR)
        )
        return {"status": "success", "data": data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lỗi tạo nhạc AI: {str(e)}")


class SeparateVocalsRequest(BaseModel):
    audio_path: Optional[str] = None


@app.post("/api/separate-vocals-karaoke")
async def api_separate_vocals_karaoke(req: Optional[SeparateVocalsRequest] = None):
    """
    Separates full songs with lyrics into:
    - Clean Karaoke Instrumental Beat (.wav)
    - Isolated Acapella Vocal Track (.wav)
    """
    try:
        audio_path = req.audio_path if req else None
        resolved_path = None
        if audio_path:
            resolved_path = resolve_audio_file_path(audio_path)
        
        if not resolved_path or not os.path.exists(resolved_path):
            demo_path = UPLOADS_DIR / "demo_beat_lofi_90bpm.wav"
            if demo_path.exists():
                resolved_path = str(demo_path)
            else:
                raise HTTPException(status_code=400, detail="Không tìm thấy file âm thanh để tách lời.")

        data = separate_vocals_and_beat(resolved_path, output_dir=str(UPLOADS_DIR))
        return {"status": "success", "data": data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lỗi tách lời karaoke: {str(e)}")


@app.post("/api/separate-vocals-upload")
async def api_separate_vocals_upload(file: UploadFile = File(...)):
    """Uploads a song and separates into Karaoke Beat + Acapella Vocals."""
    try:
        timestamp = int(time.time())
        clean_filename = f"song_to_separate_{timestamp}_{file.filename.replace(' ', '_')}"
        save_path = UPLOADS_DIR / clean_filename
        with open(save_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        data = separate_vocals_and_beat(str(save_path), output_dir=str(UPLOADS_DIR))
        return {"status": "success", "data": data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lỗi tách lời karaoke: {str(e)}")


@app.get("/api/voices")
async def list_voices():
    return {"status": "success", "voices": get_available_voices()}


@app.post("/api/upload-track-fast")
async def upload_track_fast(file: UploadFile = File(...)):
    """Fast track upload without heavy analysis, returns file path in <50ms."""
    try:
        timestamp = int(time.time())
        clean_filename = f"track_{timestamp}_{file.filename.replace(' ', '_')}"
        save_path = UPLOADS_DIR / clean_filename
        
        with open(save_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        return {
            "status": "success",
            "filename": file.filename,
            "server_filepath": str(save_path),
            "url": f"/static/uploads/{clean_filename}"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lỗi upload nhanh: {str(e)}")


@app.post("/api/analyze-beat")
async def upload_and_analyze_beat(file: UploadFile = File(...)):
    """Uploads beat and runs Librosa BPM / Key analysis."""
    try:
        timestamp = int(time.time())
        clean_filename = f"{timestamp}_{file.filename.replace(' ', '_')}"
        save_path = UPLOADS_DIR / clean_filename
        
        with open(save_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        analysis_data = analyze_beat(str(save_path))
        analysis_data["filename"] = file.filename
        analysis_data["server_filepath"] = str(save_path)
        analysis_data["url"] = f"/static/uploads/{clean_filename}"
        
        return {"status": "success", "data": analysis_data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lỗi phân tích beat: {str(e)}")


def resolve_audio_file_path(p: Optional[str]) -> Path:
    if p and str(p).strip():
        clean = str(p).replace("\\", "/")
        if "://" in clean:
            clean = "/" + clean.split("://", 1)[1].split("/", 1)[-1]

        if "uploads/" in clean:
            fname = clean.split("uploads/")[-1]
            target = UPLOADS_DIR / fname
            if target.exists():
                return target
        if "vocals/" in clean:
            fname = clean.split("vocals/")[-1]
            target = VOCALS_DIR / fname
            if target.exists():
                return target
        if "outputs/" in clean:
            fname = clean.split("outputs/")[-1]
            target = OUTPUTS_DIR / fname
            if target.exists():
                return target

        direct = Path(clean)
        if direct.is_absolute() and direct.exists():
            return direct

        rel = BASE_DIR / clean.lstrip("/")
        if rel.exists():
            return rel

    # Check for any audio in uploads
    uploads_files = sorted(list(UPLOADS_DIR.glob("*.wav")) + list(UPLOADS_DIR.glob("*.mp3")), key=os.path.getmtime, reverse=True)
    if uploads_files:
        return uploads_files[0]

    demo_beat = UPLOADS_DIR / "demo_beat_lofi_90bpm.wav"
    if not demo_beat.exists():
        try:
            sys.path.append(str(BASE_DIR))
            from data.generate_sample_beat import generate_demo_beat
            generate_demo_beat(str(demo_beat), duration_sec=60.0)
        except Exception:
            pass

    return demo_beat


@app.post("/api/detect-beat-structure")
async def api_detect_beat_structure(req: dict):
    """Detects Intro, Verse, Drop/Bassline, and Outro sections from a beat file."""
    try:
        raw_path = req.get("beat_path")
        bp = resolve_audio_file_path(raw_path)

        if not bp.exists():
            raise HTTPException(status_code=404, detail="Không tìm thấy file Beat để phân tích.")

        structure = detect_beat_structure(str(bp))
        structure["beat_filepath"] = str(bp)
        return structure
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lỗi phân tích cấu trúc beat: {str(e)}")


@app.post("/api/extract-video-audio")
async def extract_video_audio(file: UploadFile = File(...)):
    """Extracts audio track from video file and analyzes beat/BPM."""
    try:
        timestamp = int(time.time())
        clean_video_name = f"video_{timestamp}_{file.filename.replace(' ', '_')}"
        video_path = TEMP_DIR / clean_video_name
        
        with open(video_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        audio_filename = f"extracted_{timestamp}.mp3"
        audio_path = UPLOADS_DIR / audio_filename
        
        extract_audio_from_video(str(video_path), str(audio_path))
        
        # Analyze the extracted audio track
        analysis_data = analyze_beat(str(audio_path))
        analysis_data["filename"] = f"Audio from {file.filename}"
        analysis_data["server_filepath"] = str(audio_path)
        analysis_data["url"] = f"/static/uploads/{audio_filename}"
        
        return {"status": "success", "data": analysis_data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lỗi trích xuất âm thanh từ video: {str(e)}")


@app.post("/api/save-recording")
async def save_mic_recording(file: UploadFile = File(...)):
    """Saves live mic recording from frontend."""
    try:
        timestamp = int(time.time())
        vocal_filename = f"rec_{timestamp}.wav"
        vocal_path = VOCALS_DIR / vocal_filename
        
        with open(vocal_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        return {
            "status": "success",
            "message": "Đã lưu bản thu âm thành công!",
            "vocal_url": f"/static/vocals/{vocal_filename}",
            "vocal_path": str(vocal_path)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lỗi lưu file thu âm: {str(e)}")


@app.post("/api/apply-autotune-fx")
async def apply_autotune_and_fx(req: AutoTuneRequest):
    """Applies musical scale Auto-Tune and voice transformations."""
    try:
        vocal_path_obj = Path(req.vocal_path)
        if not vocal_path_obj.is_absolute():
            vocal_path_obj = BASE_DIR / req.vocal_path
            
        if not vocal_path_obj.exists():
            raise HTTPException(status_code=404, detail="File Vocal không tồn tại.")
            
        timestamp = int(time.time())
        tuned_filename = f"tuned_{timestamp}.wav"
        tuned_path = VOCALS_DIR / tuned_filename
        
        # 1. Apply Auto-Tune
        auto_tune_vocal(
            vocal_path=str(vocal_path_obj),
            target_key=req.target_key or "C",
            scale_type=req.scale_type or "Major",
            tune_speed=req.tune_speed or 0.8,
            output_path=str(tuned_path)
        )
        
        # 2. Apply Voice FX Preset if requested
        if req.voice_effect and req.voice_effect != "none":
            fx_filename = f"fx_{req.voice_effect}_{timestamp}.wav"
            fx_path = VOCALS_DIR / fx_filename
            apply_voice_effect_preset(str(tuned_path), req.voice_effect, str(fx_path))
            tuned_path = fx_path
            tuned_filename = fx_filename
            
        return {
            "status": "success",
            "vocal_url": f"/static/vocals/{tuned_filename}",
            "vocal_path": str(tuned_path)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lỗi xử lý Auto-Tune: {str(e)}")


@app.post("/api/mix-recording-with-beat")
async def mix_recording_with_beat(req: QuickMixRecordingRequest):
    """Quickly merges a recorded vocal with the current background beat."""
    try:
        vocal_p = Path(req.vocal_path)
        if not vocal_p.is_absolute():
            vocal_p = BASE_DIR / req.vocal_path
        if not vocal_p.exists():
            raise HTTPException(status_code=404, detail="File Vocal không tồn tại.")

        actual_beat_path = None
        if req.beat_path:
            bp = Path(req.beat_path)
            if not bp.is_absolute():
                bp = BASE_DIR / req.beat_path
            if bp.exists():
                actual_beat_path = str(bp)

        if not actual_beat_path:
            demo_beat = UPLOADS_DIR / "demo_beat_lofi_90bpm.wav"
            if demo_beat.exists():
                actual_beat_path = str(demo_beat)

        if not actual_beat_path:
            raise HTTPException(status_code=400, detail="Chưa có beat nền để ghép với bản thu.")

        timestamp = int(time.time())
        mixed_filename = f"rec_mixed_{timestamp}.mp3"
        output_path = OUTPUTS_DIR / mixed_filename

        mix_settings = {
            "beat_volume": req.beat_volume if req.beat_volume is not None else 1.0,
            "vocal_volume": req.vocal_volume if req.vocal_volume is not None else 1.25,
            "reverb": 0.25,
            "delay": 0.1,
            "compressor": True,
            "eq_preset": "warm_vocal"
        }

        mix_beat_and_vocals(
            beat_path=actual_beat_path,
            vocal_path=str(vocal_p),
            output_path=str(output_path),
            mix_settings=mix_settings
        )

        return {
            "status": "success",
            "message": "Đã ghép bản thu âm với Beat thành công!",
            "mixed_url": f"/static/outputs/{mixed_filename}",
            "filename": mixed_filename
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lỗi ghép bản thu với beat: {str(e)}")


@app.post("/api/render-multitrack")
async def render_multitrack(req: MultiTrackRenderRequest):
    """Renders multiple tracks from the interactive timeline into 1 master audio file."""
    try:
        timestamp = int(time.time())
        safe_title = "".join(c for c in (req.song_title or "MultiTrack_Master") if c.isalnum() or c in (' ', '_', '-')).rstrip()
        safe_title = safe_title.replace(" ", "_")
        
        master_filename = f"{safe_title}_{timestamp}.mp3"
        master_output_path = OUTPUTS_DIR / master_filename
        
        # Resolve track filepaths
        resolved_tracks = []
        for t in req.tracks:
            raw_path = t.get("filepath", "")
            p_obj = Path(raw_path)
            if not p_obj.is_absolute():
                p_obj = BASE_DIR / raw_path
            if p_obj.exists():
                t_copy = dict(t)
                t_copy["filepath"] = str(p_obj)
                resolved_tracks.append(t_copy)
                
        render_multitrack_timeline(resolved_tracks, str(master_output_path))
        
        return {
            "status": "success",
            "message": "Ghép & Render Timeline hoàn tất!",
            "master_url": f"/static/outputs/{master_filename}",
            "master_filepath": str(master_output_path),
            "filename": master_filename
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lỗi Render Timeline: {str(e)}")


@app.post("/api/optimize-lyrics")
async def optimize_lyrics(req: OptimizeLyricsRequest):
    try:
        lyrics_data = await generate_lyrics_ai(
            prompt_idea=req.prompt_idea,
            genre=req.genre,
            bpm=req.bpm,
            key=req.key,
            mood=req.mood,
            api_key=req.api_key
        )
        return {"status": "success", "data": lyrics_data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lỗi tạo lời AI: {str(e)}")


@app.post("/api/smart-paste")
async def smart_paste_endpoint(req: SmartPasteRequest):
    try:
        parsed = parse_smart_paste(req.clipboard_text)
        return {"status": "success", "data": parsed}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Không thể phân tích dữ liệu: {str(e)}")


@app.post("/api/mix-song")
async def mix_full_song(req: MixSongRequest):
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


@app.get("/api/settings")
async def get_settings():
    if CONFIG_FILE.exists():
        try:
            with open(CONFIG_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            pass
    return {"gemini_api_key": "", "default_voice": "vi-VN-HoaiMyNeural"}


@app.post("/api/settings")
async def save_settings(req: SettingsRequest):
    data = {
        "gemini_api_key": req.gemini_api_key or "",
        "default_voice": req.default_voice or "vi-VN-HoaiMyNeural"
    }
    with open(CONFIG_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)
    return {"status": "success", "message": "Đã lưu cài đặt!"}


@app.get("/api/download/{filename}")
async def download_file(filename: str):
    file_path = OUTPUTS_DIR / filename
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File không tồn tại.")
    return FileResponse(path=str(file_path), filename=filename, media_type="audio/mpeg")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8888)
