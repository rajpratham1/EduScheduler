import google.generativeai as genai
from app.core.config import settings

genai.configure(api_key=settings.GEMINI_API_KEY)

def generate_timetable_with_gemini(prompt: str):
    model = genai.GenerativeModel('gemini-pro')
    response = model.generate_content(prompt)
    return response.text
