try:
    from flask import Flask, jsonify, request, send_from_directory  # type: ignore[import-not-found]
except ModuleNotFoundError as exc:
    raise RuntimeError(
        "Flask não está instalado. Instale com: pip install flask"
    ) from exc

import sqlite3
import os

# O main.py está na pasta "py/", mas o index.html, script.js e a pasta
# "styles/" ficam um nível acima (na pasta "Site"). Por isso apontamos o
# static_folder para o diretório pai, usando caminho absoluto — assim
# funciona não importa de onde você rode "python main.py".
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
SITE_DIR = os.path.join(BASE_DIR, '..')
app = Flask(__name__, static_folder=SITE_DIR, static_url_path='')

# CORS simples, sem depender do pacote flask-cors.
@app.after_request
def add_cors_headers(response):
    response.headers['Access-Control-Allow-Origin'] = '*'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type'
    response.headers['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS'
    return response

DB_NAME = "database.db"

# --- Rota que serve a página principal ---
@app.route('/')
def index():
    return send_from_directory(app.static_folder, 'index.html')

def init_db():
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    # Tabela de Comentários
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS comentarios (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nome TEXT,
            texto TEXT,
            data TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    # Tabela de Votos
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS votos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            tipo TEXT, -- 'artista' ou 'musica'
            item_nome TEXT UNIQUE,
            total INTEGER DEFAULT 0
        )
    ''')
    conn.commit()
    conn.close()

init_db()

# --- Rotas de Comentários ---
@app.route('/api/comentarios', methods=['GET'])
def get_comentarios():
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    cursor.execute("SELECT id, nome, texto, data FROM comentarios ORDER BY id DESC")
    rows = cursor.fetchall()
    conn.close()

    comentarios = [{"id": r[0], "nome": r[1] or "Anônimo", "texto": r[2], "data": r[3]} for r in rows]
    return jsonify(comentarios)

@app.route('/api/comentarios', methods=['POST'])
def add_comentario():
    data = request.json
    nome = data.get('nome')
    texto = data.get('texto')

    if not texto:
        return jsonify({"error": "O texto é obrigatório"}), 400

    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    cursor.execute("INSERT INTO comentarios (nome, texto) VALUES (?, ?)", (nome, texto))
    conn.commit()
    conn.close()

    return jsonify({"success": True})

# --- Rotas de Votação ---
@app.route('/api/votos', methods=['GET'])
def get_votos():
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    cursor.execute("SELECT tipo, item_nome, total FROM votos")
    rows = cursor.fetchall()
    conn.close()

    votos = [{"tipo": r[0], "item_nome": r[1], "total": r[2]} for r in rows]
    return jsonify(votos)

@app.route('/api/votos', methods=['POST'])
def registrar_voto():
    data = request.json
    tipo = data.get('tipo')  # 'artista' ou 'musica'
    item_nome = data.get('item_nome')

    if not tipo or not item_nome:
        return jsonify({"error": "Dados incompletos"}), 400

    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()

    # Verifica se já existe voto computado para esse item
    cursor.execute("SELECT total FROM votos WHERE item_nome = ?", (item_nome,))
    row = cursor.fetchone()

    if row:
        cursor.execute("UPDATE votos SET total = total + 1 WHERE item_nome = ?", (item_nome,))
    else:
        cursor.execute("INSERT INTO votos (tipo, item_nome, total) VALUES (?, ?, 1)", (tipo, item_nome))

    conn.commit()
    conn.close()

    return jsonify({"success": True})

if __name__ == '__main__':
    app.run(debug=True, port=5000)