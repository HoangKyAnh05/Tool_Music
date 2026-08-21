"""
Audio Engine for AI Music & Vocal Studio
Handles Beat Analysis (BPM, Key, Duration, Waveform) and Studio Audio Mixing with Effects.
"""

import os
import math
import numpy as np
import soundfile as sf
import librosa
from pydub import AudioSegment

# Try importing pedalboard for professional studio DSP effects
try:
    from pedalboard import Pedalboard, Chorus, Reverb, Delay, Compressor, HighpassFilter, LowShelfFilter, HighShelfFilter, Gain
    from pedalboard.io import AudioFile
    PEDALBOARD_AVAILABLE = True
except ImportError:
    PEDALBOARD_AVAILABLE = False


# Krumhansl-Schmuckler Key Profile constants for Key Detection
MAJOR_PROFILE = np.array([6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88])
MINOR_PROFILE = np.array([6.33, 2.68, 3.52, 5.38, 2.60, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17])
PITCH_CLASSES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']


def detect_key_and_scale(y: np.ndarray, sr: int) -> dict:
    """Estimates the musical key and scale (Major/Minor) of the audio."""
    try:
        # Chroma feature extraction
        chroma = librosa.feature.chroma_cqt(y=y, sr=sr)
        chroma_sum = np.sum(chroma, axis=1)
        if np.sum(chroma_sum) == 0:
            return {"key": "C", "scale": "Major", "full_key": "C Major"}
            
        chroma_norm = chroma_sum / np.linalg.norm(chroma_sum)
        
        major_corrs = []
        minor_corrs = []
        for i in range(12):
            maj_shifted = np.roll(MAJOR_PROFILE, i)
            min_shifted = np.roll(MINOR_PROFILE, i)
            maj_corr = np.corrcoef(chroma_norm, maj_shifted / np.linalg.norm(maj_shifted))[0, 1]
            min_corr = np.corrcoef(chroma_norm, min_shifted / np.linalg.norm(min_shifted))[0, 1]
            major_corrs.append(maj_corr)
            minor_corrs.append(min_corr)
            
        best_maj_idx = int(np.argmax(major_corrs))
        best_min_idx = int(np.argmax(minor_corrs))
        
        if major_corrs[best_maj_idx] >= minor_corrs[best_min_idx]:
            key_name = PITCH_CLASSES[best_maj_idx]
            scale_name = "Major"
        else:
            key_name = PITCH_CLASSES[best_min_idx]
            scale_name = "Minor"
            
        return {
            "key": key_name,
            "scale": scale_name,
            "full_key": f"{key_name} {scale_name}"
        }
    except Exception as e:
        print(f"Error detecting key: {e}")
        return {"key": "C", "scale": "Major", "full_key": "C Major"}


def generate_waveform_peaks(y: np.ndarray, num_points: int = 120) -> list:
    """Downsamples audio into a normalized array of peaks for visualizer."""
    try:
        abs_y = np.abs(y)
        chunk_size = len(abs_y) // num_points
        if chunk_size < 1:
            return [float(x) for x in abs_y[:num_points]]
        
        peaks = []
        for i in range(num_points):
            chunk = abs_y[i * chunk_size : (i + 1) * chunk_size]
            val = float(np.max(chunk)) if len(chunk) > 0 else 0.0
            peaks.append(round(val, 4))
            
        max_val = max(peaks) if peaks and max(peaks) > 0 else 1.0
        normalized = [round(p / max_val, 4) for p in peaks]
        return normalized
    except Exception as e:
        print(f"Error generating waveform peaks: {e}")
        return [0.5] * num_points


def analyze_beat(file_path: str) -> dict:
    """
    Analyzes an audio file for BPM, Musical Key, Duration, and Waveform.
    """
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"File not found: {file_path}")

    # Load audio using librosa (22050 Hz mono for fast processing)
    y, sr = librosa.load(file_path, sr=22050, mono=True)
    duration_sec = float(librosa.get_duration(y=y, sr=sr))
    
    # Estimate BPM
    tempo, _ = librosa.beat.beat_track(y=y, sr=sr)
    if isinstance(tempo, np.ndarray):
        bpm = float(tempo[0]) if len(tempo) > 0 else 120.0
    else:
        bpm = float(tempo)
    bpm = round(bpm, 1)
    
    # Estimate Key
    key_info = detect_key_and_scale(y, sr)
    
    # Generate waveform preview data
    waveform = generate_waveform_peaks(y, num_points=128)
    
    filename = os.path.basename(file_path)
    
    # Format duration to mm:ss
    minutes = int(duration_sec // 60)
    seconds = int(duration_sec % 60)
    duration_formatted = f"{minutes:02d}:{seconds:02d}"

    return {
        "filename": filename,
        "filepath": file_path,
        "duration_seconds": round(duration_sec, 2),
        "duration_formatted": duration_formatted,
        "bpm": bpm,
        "key": key_info["key"],
        "scale": key_info["scale"],
        "full_key": key_info["full_key"],
        "waveform": waveform,
        "sample_rate": sr
    }


def apply_vocal_effects(vocal_audio_path: str, output_path: str, effects_config: dict) -> str:
    """
    Applies studio DSP effects (EQ, Reverb, Compressor, Delay, Gain) to vocal track.
    """
    reverb_amount = float(effects_config.get("reverb", 0.35))
    delay_amount = float(effects_config.get("delay", 0.15))
    vocal_gain_db = float(effects_config.get("vocal_gain_db", 2.0))
    eq_preset = effects_config.get("eq_preset", "warm_vocal")
    use_compressor = effects_config.get("compressor", True)
    
    if PEDALBOARD_AVAILABLE:
        try:
            with AudioFile(vocal_audio_path) as f:
                vocal_audio = f.read(f.frames)
                sr = f.samplerate

            board = Pedalboard()
            
            # High-pass filter to remove low rumble
            board.append(HighpassFilter(cutoff_frequency_hz=100.0))
            
            # EQ Presets
            if eq_preset == "warm_vocal":
                board.append(LowShelfFilter(cutoff_frequency_hz=300.0, gain_db=2.5))
                board.append(HighShelfFilter(cutoff_frequency_hz=8000.0, gain_db=1.5))
            elif eq_preset == "bright_pop":
                board.append(LowShelfFilter(cutoff_frequency_hz=250.0, gain_db=-1.5))
                board.append(HighShelfFilter(cutoff_frequency_hz=6000.0, gain_db=4.5))
            elif eq_preset == "radio":
                board.append(HighpassFilter(cutoff_frequency_hz=400.0))
                board.append(HighShelfFilter(cutoff_frequency_hz=4000.0, gain_db=-6.0))
            
            # Vocal Compressor
            if use_compressor:
                board.append(Compressor(threshold_db=-18.0, ratio=3.0, attack_ms=10.0, release_ms=100.0))
            
            # Delay
            if delay_amount > 0.05:
                board.append(Delay(delay_seconds=0.25, feedback=delay_amount * 0.4, mix=delay_amount * 0.3))
                
            # Studio Reverb
            if reverb_amount > 0.05:
                board.append(Reverb(room_size=0.6, damping=0.5, wet_level=reverb_amount * 0.5, dry_level=1.0 - (reverb_amount * 0.2)))
                
            # Gain booster
            if vocal_gain_db != 0:
                board.append(Gain(gain_db=vocal_gain_db))

            effected = board(vocal_audio, sr)
            
            with AudioFile(output_path, 'w', sr, effected.shape[0]) as f:
                f.write(effected)
                
            return output_path
        except Exception as e:
            print(f"Pedalboard processing error, falling back to pydub: {e}")

    # Fallback to Pydub
    sound = AudioSegment.from_file(vocal_audio_path)
    # Apply gain
    sound = sound + vocal_gain_db
    
    # Simple simulated echo/delay if delay_amount > 0
    if delay_amount > 0.1:
        echo = sound - 6
        sound = sound.overlay(echo, position=250)
        
    sound.export(output_path, format="wav")
    return output_path


def mix_beat_and_vocals(beat_path: str, vocal_path: str, output_path: str, mix_settings: dict) -> str:
    """
    Mixes beat and vocals together with volume level matching, alignment, and mastering.
    Uses Pedalboard/NumPy/SoundFile for native high-fidelity rendering.
    """
    beat_vol = float(mix_settings.get("beat_volume", 1.0))
    vocal_vol = float(mix_settings.get("vocal_volume", 1.2))
    vocal_offset_ms = int(mix_settings.get("vocal_offset_ms", 0))
    
    # 1. Apply effects to vocal track
    temp_effected_vocal = output_path.replace(".mp3", "_vocal_fx.wav").replace(".wav", "_vocal_fx.wav")
    apply_vocal_effects(vocal_path, temp_effected_vocal, mix_settings)
    
    if PEDALBOARD_AVAILABLE:
        try:
            # Read beat audio
            with AudioFile(beat_path) as f_beat:
                beat_data = f_beat.read(f_beat.frames)
                sr = f_beat.samplerate
                num_channels = f_beat.num_channels
                
            # Read vocal audio
            with AudioFile(temp_effected_vocal) as f_voc:
                voc_data = f_voc.read(f_voc.frames)
                voc_sr = f_voc.samplerate
                voc_channels = f_voc.num_channels

            # Resample vocal if sample rates don't match
            if voc_sr != sr:
                voc_data = librosa.resample(voc_data, orig_sr=voc_sr, target_sr=sr)
                
            # Match channels (e.g. mono vocal to stereo beat)
            if num_channels == 2 and voc_data.shape[0] == 1:
                voc_data = np.repeat(voc_data, 2, axis=0)
            elif num_channels == 1 and voc_data.shape[0] == 2:
                voc_data = np.mean(voc_data, axis=0, keepdims=True)

            # Apply volume gains
            beat_data = beat_data * beat_vol
            voc_data = voc_data * vocal_vol

            # Handle vocal offset
            offset_samples = int((vocal_offset_ms / 1000.0) * sr)
            if offset_samples > 0:
                silence = np.zeros((voc_data.shape[0], offset_samples), dtype=np.float32)
                voc_data = np.concatenate([silence, voc_data], axis=1)

            # Pad arrays to the maximum length
            max_len = max(beat_data.shape[1], voc_data.shape[1])
            if beat_data.shape[1] < max_len:
                pad_beat = np.zeros((beat_data.shape[0], max_len - beat_data.shape[1]), dtype=np.float32)
                beat_data = np.concatenate([beat_data, pad_beat], axis=1)
                
            if voc_data.shape[1] < max_len:
                pad_voc = np.zeros((voc_data.shape[0], max_len - voc_data.shape[1]), dtype=np.float32)
                voc_data = np.concatenate([voc_data, pad_voc], axis=1)

            # Mix tracks
            mixed_data = beat_data + voc_data

            # Master Limiter / Normalizer (prevent clipping)
            max_peak = np.max(np.abs(mixed_data))
            if max_peak > 0.95:
                mixed_data = (mixed_data / max_peak) * 0.95

            # Write master audio file
            with AudioFile(output_path, 'w', sr, mixed_data.shape[0]) as f_out:
                f_out.write(mixed_data)

            if os.path.exists(temp_effected_vocal):
                try:
                    os.remove(temp_effected_vocal)
                except Exception:
                    pass

            return output_path
        except Exception as e:
            print(f"Pedalboard mixer error, falling back to pydub: {e}")

    # Fallback to Pydub
    try:
        beat_audio = AudioSegment.from_file(beat_path)
        vocal_audio = AudioSegment.from_file(temp_effected_vocal)
        
        beat_db = 20 * math.log10(max(beat_vol, 0.01))
        vocal_db = 20 * math.log10(max(vocal_vol, 0.01))
        
        beat_audio = beat_audio + beat_db
        vocal_audio = vocal_audio + vocal_db
        
        if vocal_offset_ms > 0:
            vocal_audio = AudioSegment.silent(duration=vocal_offset_ms) + vocal_audio
            
        final_len = max(len(beat_audio), len(vocal_audio))
        if len(beat_audio) < final_len:
            beat_audio = beat_audio + AudioSegment.silent(duration=final_len - len(beat_audio))
            
        mixed = beat_audio.overlay(vocal_audio, position=0)
        ext = os.path.splitext(output_path)[1].lower().replace(".", "") or "mp3"
        mixed.export(output_path, format=ext)
    finally:
        if os.path.exists(temp_effected_vocal):
            try:
                os.remove(temp_effected_vocal)
            except Exception:
                pass
                
    return output_path

