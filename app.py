from flask import Flask, jsonify, request,render_template
from flask_cors import CORS
from bs4 import BeautifulSoup
import google.generativeai as genai

app = Flask(__name__)
CORS(app)

# Configure and initialize your AI model
genai.configure(api_key="AIzaSyCZVlIW9i4nCb7EDLdnfjhGGcMpELoCGSo")
model = genai.GenerativeModel('gemini-1.5-flash')

@app.route('/', methods=['GET', 'POST'])
def home():
    return render_template('popup.html')

def generate_ai_response(input_text):
    try:
        # Start a new chat session with the AI model
        chat = model.start_chat(history=[])
        response = chat.send_message(input_text + " \n Generate overview of text")
        print("AI Response:", response.text)
        return response.text
    except Exception as e:
        print("Error generating AI response:", str(e))
        return "Error generating AI response."

@app.route('/generate_summary', methods=['POST'])
def generate_summary():
    try:
        data = request.json
        
        html_content = data.get('html_content', '')
        js_content = data.get('js_content', '')

        # Remove HTML tags using BeautifulSoup
        soup_html = BeautifulSoup(html_content, 'html.parser')
        text_only_html = soup_html.get_text(separator=' ')

        # Combine processed HTML and JS content for AI input
        combined_text = f"{text_only_html} {js_content}"
        print(combined_text)
        # Generate AI response based on combined text
        ai_response = generate_ai_response(combined_text)

        return jsonify({"ai_response": ai_response})
    except Exception as e:
        return jsonify({"error": str(e)})


