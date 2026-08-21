import json
import re
import os

try:
    from google import genai
    from google.genai import types
    GENAI_NEW_SDK = True
except ImportError:
    import google.generativeai as legacy_genai
    GENAI_NEW_SDK = False

# Default system prompt for Gemini Songwriter
SONGWRITER_SYSTEM_PROMPT = """
Bạn là một Nhạc sĩ kiêm Chuyên gia Sáng tác & Căn nhịp Beat chuyên nghiệp.
Nhiệm vụ của bạn là sáng tác hoặc biên tập lại lời bài hát dựa theo chủ đề, thể loại, tâm trạng và nhịp độ BPM được cung cấp.

Yêu cầu chất lượng bài hát:
1. Gieo vần điệu mượt mà (AABB, ABAB, hoặc vần lưng vần chân chuẩn tiếng Việt).
2. Số lượng âm tiết từng câu phải đều đặn, nhịp nhàng, khớp hoàn hảo với nhịp độ BPM.
3. Chia rõ các đoạn cấu trúc bài hát chuẩn studio:
   - [Intro]
   - [Verse 1]
   - [Pre-Chorus]
   - [Chorus]
   - [Verse 2]
   - [Bridge]
   - [Outro]
4. Trả về định dạng JSON thuần túy (không bọc code markdown ngoài JSON).

Định dạng JSON yêu cầu:
{
  "title": "Tên bài hát",
  "genre": "Thể loại nhạc",
  "bpm": 90,
  "key": "C Minor",
  "mood": "Tâm trạng",
  "voice_style": "Nam trầm ấm / Nữ ngọt ngào",
  "lyrics": {
    "intro": "...",
    "verse_1": "...",
    "pre_chorus": "...",
    "chorus": "...",
    "verse_2": "...",
    "bridge": "...",
    "outro": "..."
  },
  "prompt_suno_style": "Gợi ý phong cách âm nhạc tóm tắt (tiếng Anh và tiếng Việt)"
}
"""


def clean_json_response(raw_text: str) -> dict:
    """Cleans markdown formatting and parses raw LLM output to valid JSON dictionary."""
    text = raw_text.strip()
    if text.startswith("```json"):
        text = text[7:]
    elif text.startswith("```"):
        text = text[3:]
    if text.endswith("```"):
        text = text[:-3]
    text = text.strip()
    
    # Try finding the first '{' and last '}'
    start_idx = text.find("{")
    end_idx = text.rfind("}")
    if start_idx != -1 and end_idx != -1:
        text = text[start_idx : end_idx + 1]
        
    return json.loads(text)


def generate_lyrics_ai(
    prompt_idea: str,
    genre: str = "V-Pop Ballad",
    bpm: float = 90.0,
    key: str = "C Major",
    mood: str = "Sâu lắng, cảm xúc",
    voice_style: str = "Nam trầm ấm",
    api_key: str = None
) -> dict:
    """Generates structured lyrics using Gemini 1.5 Flash API or falls back to template."""
    key_to_use = api_key or os.environ.get("GEMINI_API_KEY", "")
    if not key_to_use:
        return generate_offline_template(prompt_idea, genre, bpm, key, mood, voice_style)

    user_prompt = f"""
Hãy sáng tác một bài hát hoàn chỉnh với các thông số sau:
- Ý tưởng / Lời thô: "{prompt_idea}"
- Thể loại nhạc: {genre}
- Nhịp độ (BPM): {bpm}
- Tone nhạc (Key): {key}
- Tâm trạng (Mood): {mood}
- Phong cách giọng hát đề xuất: {voice_style}

Lưu ý: Tối ưu số âm tiết từng câu sao cho nhịp nhàng khi hát trên beat {bpm} BPM.
Hãy trả về DUY NHẤT một chuỗi JSON hợp lệ theo đúng cấu trúc đã định nghĩa.
"""
    try:
        if GENAI_NEW_SDK:
            client = genai.Client(api_key=key_to_use)
            response = client.models.generate_content(
                model="gemini-1.5-flash",
                contents=user_prompt,
                config=types.GenerateContentConfig(
                    system_instruction=SONGWRITER_SYSTEM_PROMPT
                )
            )
            parsed_json = clean_json_response(response.text)
            return parsed_json
        else:
            legacy_genai.configure(api_key=key_to_use)
            model = legacy_genai.GenerativeModel(
                model_name="gemini-1.5-flash",
                system_instruction=SONGWRITER_SYSTEM_PROMPT
            )
            response = model.generate_content(user_prompt)
            parsed_json = clean_json_response(response.text)
            return parsed_json
    except Exception as e:
        print(f"Gemini generation error: {e}, using offline template")
        return generate_offline_template(prompt_idea, genre, bpm, key, mood, voice_style)



def parse_smart_paste(clipboard_text: str) -> dict:
    """
    Parses pasted text from clipboard (JSON or plain text) into a structured song object.
    """
    clipboard_text = clipboard_text.strip()
    
    # Check if it's already valid JSON
    try:
        data = clean_json_response(clipboard_text)
        # Normalize fields
        return normalize_song_data(data)
    except Exception:
        pass
        
    # If plain text with section markers like [Verse 1], [Chorus]
    sections = {}
    current_tag = "verse_1"
    lines = clipboard_text.splitlines()
    
    tag_mapping = {
        "intro": "intro",
        "verse 1": "verse_1",
        "verse1": "verse_1",
        "verse 2": "verse_2",
        "verse2": "verse_2",
        "pre-chorus": "pre_chorus",
        "pre chorus": "pre_chorus",
        "prechorus": "pre_chorus",
        "chorus": "chorus",
        "điệp khúc": "chorus",
        "bridge": "bridge",
        "outro": "outro"
    }
    
    for line in lines:
        stripped = line.strip()
        if not stripped:
            continue
            
        header_match = re.match(r"^\[([a-zA-Z0-9\s\-]+)\]", stripped, re.IGNORECASE)
        if header_match:
            header_name = header_match.group(1).lower().strip()
            current_tag = tag_mapping.get(header_name, header_name.replace(" ", "_"))
            if current_tag not in sections:
                sections[current_tag] = []
        else:
            if current_tag not in sections:
                sections[current_tag] = []
            sections[current_tag].append(stripped)
            
    formatted_lyrics = {k: "\n".join(v) for k, v in sections.items()}
    if not formatted_lyrics:
        formatted_lyrics = {"verse_1": clipboard_text}

    return {
        "title": "Bài hát mới",
        "genre": "V-Pop Ballad",
        "bpm": 90,
        "key": "C Major",
        "mood": "Cảm xúc",
        "voice_style": "Nam trầm ấm",
        "lyrics": formatted_lyrics,
        "prompt_suno_style": "V-Pop Ballad, emotional, acoustic guitar, piano"
    }


def normalize_song_data(data: dict) -> dict:
    """Ensures all standard keys exist in song data."""
    lyrics = data.get("lyrics", {})
    if isinstance(lyrics, str):
        lyrics = {"verse_1": lyrics}
        
    return {
        "title": data.get("title", "Bài hát không tên"),
        "genre": data.get("genre", "V-Pop Ballad"),
        "bpm": data.get("bpm", 90),
        "key": data.get("key", "C Major"),
        "mood": data.get("mood", "Cảm xúc"),
        "voice_style": data.get("voice_style", "Nam trầm ấm"),
        "lyrics": {
            "intro": lyrics.get("intro", ""),
            "verse_1": lyrics.get("verse_1", lyrics.get("verse1", "")),
            "pre_chorus": lyrics.get("pre_chorus", lyrics.get("prechorus", "")),
            "chorus": lyrics.get("chorus", ""),
            "verse_2": lyrics.get("verse_2", lyrics.get("verse2", "")),
            "bridge": lyrics.get("bridge", ""),
            "outro": lyrics.get("outro", "")
        },
        "prompt_suno_style": data.get("prompt_suno_style", "Pop, emotional melody, studio vocals")
    }


def generate_offline_template(idea: str, genre: str, bpm: float, key: str, mood: str, voice_style: str) -> dict:
    """Creates a high quality default template when API key is not yet set."""
    clean_idea = idea if idea.strip() else "Ký ức ngọt ngào và những giấc mơ xưa"
    return {
        "title": f"Bản Tình Ca ({genre})",
        "genre": genre,
        "bpm": bpm,
        "key": key,
        "mood": mood,
        "voice_style": voice_style,
        "lyrics": {
            "intro": "(Nhạc dạo du dương, tiếng đàn êm ái)",
            "verse_1": f"Từng giọt mưa rơi nhẹ bên góc hiên\nNhớ lại tháng năm ta từng bình yên\n{clean_idea}\nLời hẹn ước xưa vẫn còn vẹn nguyên.",
            "pre_chorus": "Dù thời gian trôi qua muôn trùng xa\nTình yêu ấy sẽ mãi không phai nhòa.",
            "chorus": "Và ta sẽ hát khúc ca này cho em\nGiữ trọn bao thương nhớ trong màn đêm\nNguyện cùng nhau đi qua ngàn giông bão\nĐến nơi chân trời rực rỡ ngàn ánh sao.",
            "verse_2": "Bầu trời đêm lung linh ngàn vì tinh tú\nNhư gửi gắm yêu thương về nơi cũ\nNụ cười em luôn là điều quý giá\nSưởi ấm con tim những ngày lạnh giá.",
            "bridge": "Dẫu ngày mai đường đời chia lối\nLời hứa năm xưa không hề thay đổi.",
            "outro": "(Giai điệu dịu dần, tiếng ngân nga lắng sâu...)"
        },
        "prompt_suno_style": f"{genre}, {mood}, melodic vocals, studio acoustic master"
    }
