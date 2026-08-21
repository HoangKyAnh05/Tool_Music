"""
Synthesizes a clean 90 BPM Demo Beat with drums, bass, and chords
for instant offline testing in AI Music & Vocal Studio.
"""

import os
import math
import numpy as np
import soundfile as sf

def generate_demo_beat(output_path: str, duration_sec: float = 32.0, sr: int = 44100, bpm: float = 90.0):
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    num_samples = int(duration_sec * sr)
    t = np.linspace(0, duration_sec, num_samples, endpoint=False)
    
    # 90 BPM timing
    beat_sec = 60.0 / bpm
    samples_per_beat = int(beat_sec * sr)
    
    left = np.zeros(num_samples, dtype=np.float32)
    right = np.zeros(num_samples, dtype=np.float32)
    
    # 1. Chords progression (C maj - G maj - A min - F maj)
    chord_duration = beat_sec * 4
    chords = [
        [261.63, 329.63, 392.00],  # C major (C4, E4, G4)
        [196.00, 246.94, 293.66],  # G major (G3, B3, D4)
        [220.00, 261.63, 329.63],  # A minor (A3, C4, E4)
        [174.61, 220.00, 261.63],  # F major (F3, A3, C4)
    ]
    
    for i, chord in enumerate(chords):
        chord_start_time = i * chord_duration
        while chord_start_time < duration_sec:
            start_idx = int(chord_start_time * sr)
            end_idx = min(int((chord_start_time + chord_duration) * sr), num_samples)
            dur = (end_idx - start_idx) / sr
            if dur <= 0:
                break
            t_chunk = np.linspace(0, dur, end_idx - start_idx, endpoint=False)
            
            # Envelope (soft attack, sustained, soft release)
            env = np.ones_like(t_chunk)
            attack_len = int(0.08 * sr)
            if len(env) > attack_len:
                env[:attack_len] = np.linspace(0, 1, attack_len)
            release_len = int(0.3 * sr)
            if len(env) > release_len:
                env[-release_len:] = np.linspace(1, 0, release_len)
                
            chord_sound = np.zeros_like(t_chunk)
            for freq in chord:
                # Electric Piano / Rhodes harmonic timbre
                chord_sound += 0.08 * np.sin(2 * np.pi * freq * t_chunk)
                chord_sound += 0.04 * np.sin(2 * np.pi * freq * 2 * t_chunk)
                chord_sound += 0.02 * np.sin(2 * np.pi * freq * 3 * t_chunk)
                
            chord_sound *= env
            left[start_idx:end_idx] += chord_sound * 0.9
            right[start_idx:end_idx] += chord_sound * 1.1
            
            chord_start_time += chord_duration * len(chords)
            
    # 2. Drums (Kick on 1 & 3, Snare on 2 & 4, Hi-hats on 8ths)
    total_beats = int(duration_sec / beat_sec)
    for b in range(total_beats):
        beat_start_idx = int(b * samples_per_beat)
        
        # Kick (beat 0 and 2 of 4/4)
        if b % 2 == 0:
            kick_len = int(0.25 * sr)
            if beat_start_idx + kick_len < num_samples:
                t_k = np.linspace(0, 0.25, kick_len, endpoint=False)
                freq_k = 120 * np.exp(-15 * t_k) + 45
                kick_env = np.exp(-10 * t_k)
                kick = 0.35 * np.sin(2 * np.pi * freq_k * t_k) * kick_env
                left[beat_start_idx : beat_start_idx + kick_len] += kick
                right[beat_start_idx : beat_start_idx + kick_len] += kick

        # Snare / Rimshot (beat 1 and 3 of 4/4)
        if b % 2 == 1:
            snare_len = int(0.2 * sr)
            if beat_start_idx + snare_len < num_samples:
                t_s = np.linspace(0, 0.2, snare_len, endpoint=False)
                noise = np.random.uniform(-1, 1, snare_len)
                snare_env = np.exp(-18 * t_s)
                tone = np.sin(2 * np.pi * 180 * t_s) * np.exp(-25 * t_s)
                snare = (0.18 * noise + 0.12 * tone) * snare_env
                left[beat_start_idx : beat_start_idx + snare_len] += snare * 0.95
                right[beat_start_idx : beat_start_idx + snare_len] += snare * 1.05

        # Hi-hat (every 8th note)
        for sub in [0, 0.5]:
            hat_idx = int((b + sub) * samples_per_beat)
            hat_len = int(0.06 * sr)
            if hat_idx + hat_len < num_samples:
                t_h = np.linspace(0, 0.06, hat_len, endpoint=False)
                hat_noise = np.random.uniform(-1, 1, hat_len)
                hat_env = np.exp(-45 * t_h)
                hat = 0.07 * hat_noise * hat_env
                left[hat_idx : hat_idx + hat_len] += hat * 0.8
                right[hat_idx : hat_idx + hat_len] += hat * 1.2

    # 3. Normalize & Master
    stereo = np.vstack([left, right])
    max_val = np.max(np.abs(stereo))
    if max_val > 0:
        stereo = (stereo / max_val) * 0.85
        
    sf.write(output_path, stereo.T, sr)
    print(f"Generated Demo Beat at: {output_path}")
    return output_path

if __name__ == "__main__":
    generate_demo_beat("data/uploads/demo_beat_lofi_90bpm.wav", duration_sec=32.0, bpm=90.0)
