"""
TTS Engine for AI Vocal Generation
Uses 100% free edge-tts with pitch, rate, and rhythm customization.
"""

import os
import asyncio
import edge_tts
from pydub import AudioSegment

# List of high-quality neural voices
AVAILABLE_VOICES = [
    {"id": "vi-VN-HoaiMyNeural", "name": "Hoài My (Nữ - Truyền cảm, ngọt ngào)", "lang": "vi-VN", "gender": "Female"},
    {"id": "vi-VN-NamMinhNeural", "name": "Nam Minh (Nam - Trầm ấm, mạnh mẽ)", "lang": "vi-VN", "gender": "Male"},
    {"id": "en-US-JennyNeural", "name": "Jenny (Nữ - Pop / RnB Style)", "lang": "en-US", "gender": "Female"},
    {"id": "en-US-GuyNeural", "name": "Guy (Nam - Baritone / Deep)", "lang": "en-US", "gender": "Male"},
    {"id": "en-US-AriaNeural", "name": "Aria (Nữ - Bright Vocal)", "lang": "en-US", "gender": "Female"},
    {"id": "en-US-ChristopherNeural", "name": "Christopher (Nam - Flow Rap / Crisp)", "lang": "en-US", "gender": "Male"},
    {"id": "ja-JP-NanamiNeural", "name": "Nanami (Nữ - J-Pop / Anime style)", "lang": "ja-JP", "gender": "Female"},
    {"id": "ko-KR-SunHiNeural", "name": "Sun-Hi (Nữ - K-Pop style)", "lang": "ko-KR", "gender": "Female"}
]


def get_available_voices():
    """Returns the list of curated studio voices."""
    return AVAILABLE_VOICES


async def generate_audio_clip(text: str, voice: str, rate: str, pitch: str, output_path: str):
    """Generates a single audio segment using edge-tts."""
    communicate = edge_tts.Communicate(text=text, voice=voice, rate=rate, pitch=pitch)
    await communicate.save(output_path)
    return output_path


def format_rate(rate_percent: int) -> str:
    """Formats rate integer to edge-tts rate string, e.g. +10% or -5%."""
    if rate_percent >= 0:
        return f"+{rate_percent}%"
    return f"{rate_percent}%"


def format_pitch(pitch_hz: int) -> str:
    """Formats pitch integer to edge-tts pitch string, e.g. +20Hz or -15Hz."""
    if pitch_hz >= 0:
        return f"+{pitch_hz}Hz"
    return f"{pitch_hz}Hz"


async def generate_vocal_track(
    lyrics_sections: dict,
    voice_id: str = "vi-VN-HoaiMyNeural",
    speed_percent: int = 0,
    pitch_hz: int = 0,
    output_vocal_path: str = "vocal_master.wav",
    temp_dir: str = "temp_vocals"
) -> str:
    """
    Generates vocals for all structured lyrics sections,
    applies rhythmic spacing, and concatenates into a single master vocal track.
    """
    os.makedirs(temp_dir, exist_ok=True)
    rate_str = format_rate(speed_percent)
    pitch_str = format_pitch(pitch_hz)

    # Standard section ordering
    section_order = ["intro", "verse_1", "pre_chorus", "chorus", "verse_2", "bridge", "outro"]
    
    # Pause durations between sections in milliseconds
    pause_mapping = {
        "intro": 1200,
        "verse_1": 800,
        "pre_chorus": 600,
        "chorus": 1000,
        "verse_2": 800,
        "bridge": 1000,
        "outro": 1500
    }

    generated_segments = []
    
    for section_key in section_order:
        text = lyrics_sections.get(section_key, "").strip()
        if not text:
            continue
            
        # Ignore comments or purely instrumental placeholders like "(Nhạc dạo...)"
        clean_text_lines = []
        for line in text.splitlines():
            line_str = line.strip()
            if line_str and not (line_str.startswith("(") and line_str.endswith(")")):
                clean_text_lines.append(line_str)
                
        if not clean_text_lines:
            continue
            
        section_text = " . ".join(clean_text_lines)
        temp_seg_file = os.path.join(temp_dir, f"seg_{section_key}_{os.getpid()}.mp3")
        
        try:
            await generate_audio_clip(
                text=section_text,
                voice=voice_id,
                rate=rate_str,
                pitch=pitch_str,
                output_path=temp_seg_file
            )
            
            if os.path.exists(temp_seg_file) and os.path.getsize(temp_seg_file) > 0:
                seg_audio = AudioSegment.from_file(temp_seg_file)
                # Append segment
                generated_segments.append(seg_audio)
                
                # Append rhythmic pause
                pause_len = pause_mapping.get(section_key, 800)
                generated_segments.append(AudioSegment.silent(duration=pause_len))
        except Exception as e:
            print(f"Error generating vocal for {section_key}: {e}")
        finally:
            if os.path.exists(temp_seg_file):
                try:
                    os.remove(temp_seg_file)
                except Exception:
                    pass

    if not generated_segments:
        # Generate 2 seconds of silence if empty
        master_audio = AudioSegment.silent(duration=2000)
    else:
        master_audio = generated_segments[0]
        for seg in generated_segments[1:]:
            master_audio = master_audio + seg

    # Export to target format
    master_audio.export(output_vocal_path, format="wav")
    return output_vocal_path
