try:
    from flask import Flask, jsonify, request, send_from_directory  # type: ignore[import-not-found]
except ModuleNotFoundError as exc:
    raise RuntimeError(
        "Flask não está instalado. Instale com: pip install flask"
    ) from exc

import hmac
import os
import sqlite3

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
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type, X-Admin-Token'
    response.headers['Access-Control-Allow-Methods'] = 'GET, POST, DELETE, OPTIONS'
    return response

# ===================== BANCO DE DADOS =====================
# Se existir a variável de ambiente DATABASE_URL (configurada no Render),
# usa Postgres — os dados ficam guardados fora do servidor e NÃO se perdem
# quando o site reinicia ou recebe um novo deploy.
# Se ela não existir (rodando no seu computador), usa o SQLite local.
DATABASE_URL = os.environ.get("DATABASE_URL")
USE_POSTGRES = bool(DATABASE_URL)
DB_NAME = os.path.join(BASE_DIR, "database.db")

if USE_POSTGRES:
    import psycopg2  # type: ignore[import-not-found]

# Senha de moderação (apagar comentários). Vem de uma variável de ambiente
# configurada no Render (Environment > ADMIN_TOKEN). NUNCA escreva a senha
# aqui no código: o repositório do GitHub pode ser público.
ADMIN_TOKEN = os.environ.get("ADMIN_TOKEN")

# Tipos aceitos nas respostas de favoritos (seções dentro de "Comentários &
# Indicações"). Têm que bater com as chaves de FAVORITOS no script.js.
TIPOS_FAVORITOS = {"musica", "artista", "album"}


def get_conn():
    if USE_POSTGRES:
        return psycopg2.connect(DATABASE_URL)
    return sqlite3.connect(DB_NAME)


def q(sql):
    """Troca o marcador de parâmetro: SQLite usa ?, Postgres usa %s."""
    return sql.replace("?", "%s") if USE_POSTGRES else sql


# --- Rota que serve a página principal ---
@app.route('/')
def index():
    return send_from_directory(app.static_folder, 'index.html')


def init_db():
    conn = get_conn()
    cursor = conn.cursor()
    pk = "SERIAL PRIMARY KEY" if USE_POSTGRES else "INTEGER PRIMARY KEY AUTOINCREMENT"
    # Tabela de Comentários
    cursor.execute(f'''
        CREATE TABLE IF NOT EXISTS comentarios (
            id {pk},
            nome TEXT,
            texto TEXT,
            data TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    # Tabela de Votos ('artista' ou 'musica')
    cursor.execute(f'''
        CREATE TABLE IF NOT EXISTS votos (
            id {pk},
            tipo TEXT,
            item_nome TEXT UNIQUE,
            total INTEGER DEFAULT 0
        )
    ''')
    # Tabela de Favoritos ('musica', 'artista' ou 'album')
    cursor.execute(f'''
        CREATE TABLE IF NOT EXISTS favoritos (
            id {pk},
            tipo TEXT NOT NULL,
            nome TEXT,
            texto TEXT NOT NULL,
            data TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    conn.commit()
    conn.close()


init_db()

# --- Rotas de Comentários ---
@app.route('/api/comentarios', methods=['GET'])
def get_comentarios():
    conn = get_conn()
    cursor = conn.cursor()
    cursor.execute("SELECT id, nome, texto, data FROM comentarios ORDER BY id DESC")
    rows = cursor.fetchall()
    conn.close()

    comentarios = [
        {"id": r[0], "nome": r[1] or "Anônimo", "texto": r[2], "data": str(r[3]) if r[3] else ""}
        for r in rows
    ]
    return jsonify(comentarios)

@app.route('/api/comentarios', methods=['POST'])
def add_comentario():
    data = request.get_json(silent=True) or {}
    nome = data.get('nome')
    texto = data.get('texto')

    if not texto:
        return jsonify({"error": "O texto é obrigatório"}), 400

    conn = get_conn()
    cursor = conn.cursor()
    cursor.execute(q("INSERT INTO comentarios (nome, texto) VALUES (?, ?)"), (nome, texto))
    conn.commit()
    conn.close()

    return jsonify({"success": True})

# Apagar um comentário (só com a senha de moderação no cabeçalho X-Admin-Token)
@app.route('/api/comentarios/<int:comentario_id>', methods=['DELETE'])
def apagar_comentario(comentario_id):
    if not ADMIN_TOKEN:
        return jsonify({"error": "Moderação desativada"}), 503

    enviado = request.headers.get('X-Admin-Token', '')
    if not hmac.compare_digest(enviado.encode('utf-8'), ADMIN_TOKEN.encode('utf-8')):
        return jsonify({"error": "Não autorizado"}), 401

    conn = get_conn()
    cursor = conn.cursor()
    cursor.execute(q("DELETE FROM comentarios WHERE id = ?"), (comentario_id,))
    apagados = cursor.rowcount
    conn.commit()
    conn.close()

    if apagados == 0:
        return jsonify({"error": "Comentário não encontrado"}), 404
    return jsonify({"success": True})

# --- Rotas de Favoritos (música, artista e álbum favoritos) ---
@app.route('/api/favoritos/<tipo>', methods=['GET'])
def get_favoritos(tipo):
    if tipo not in TIPOS_FAVORITOS:
        return jsonify({"error": "Tipo inválido"}), 400

    conn = get_conn()
    cursor = conn.cursor()
    cursor.execute(
        q("SELECT id, nome, texto, data FROM favoritos WHERE tipo = ? ORDER BY id DESC"),
        (tipo,),
    )
    rows = cursor.fetchall()
    conn.close()

    favoritos = [
        {"id": r[0], "nome": r[1] or "Anônimo", "texto": r[2], "data": str(r[3]) if r[3] else ""}
        for r in rows
    ]
    return jsonify(favoritos)

@app.route('/api/favoritos/<tipo>', methods=['POST'])
def add_favorito(tipo):
    if tipo not in TIPOS_FAVORITOS:
        return jsonify({"error": "Tipo inválido"}), 400

    data = request.get_json(silent=True) or {}
    nome = (data.get('nome') or '').strip()[:40] or 'Anônimo'
    texto = (data.get('texto') or '').strip()[:300]

    if not texto:
        return jsonify({"error": "O texto é obrigatório"}), 400

    conn = get_conn()
    cursor = conn.cursor()
    cursor.execute(
        q("INSERT INTO favoritos (tipo, nome, texto) VALUES (?, ?, ?)"),
        (tipo, nome, texto),
    )
    conn.commit()
    conn.close()

    return jsonify({"success": True})

# Apagar uma resposta de favoritos (mesma senha de moderação dos comentários)
@app.route('/api/favoritos/<tipo>/<int:favorito_id>', methods=['DELETE'])
def apagar_favorito(tipo, favorito_id):
    if tipo not in TIPOS_FAVORITOS:
        return jsonify({"error": "Tipo inválido"}), 400
    if not ADMIN_TOKEN:
        return jsonify({"error": "Moderação desativada"}), 503

    enviado = request.headers.get('X-Admin-Token', '')
    if not hmac.compare_digest(enviado.encode('utf-8'), ADMIN_TOKEN.encode('utf-8')):
        return jsonify({"error": "Não autorizado"}), 401

    conn = get_conn()
    cursor = conn.cursor()
    cursor.execute(
        q("DELETE FROM favoritos WHERE id = ? AND tipo = ?"),
        (favorito_id, tipo),
    )
    apagados = cursor.rowcount
    conn.commit()
    conn.close()

    if apagados == 0:
        return jsonify({"error": "Resposta não encontrada"}), 404
    return jsonify({"success": True})

# --- Rotas de Votação ---
@app.route('/api/votos', methods=['GET'])
def get_votos():
    conn = get_conn()
    cursor = conn.cursor()
    cursor.execute("SELECT tipo, item_nome, total FROM votos")
    rows = cursor.fetchall()
    conn.close()

    votos = [{"tipo": r[0], "item_nome": r[1], "total": r[2]} for r in rows]
    return jsonify(votos)

@app.route('/api/votos', methods=['POST'])
def registrar_voto():
    data = request.get_json(silent=True) or {}
    tipo = data.get('tipo')  # 'artista' ou 'musica'
    item_nome = data.get('item_nome')

    if not tipo or not item_nome:
        return jsonify({"error": "Dados incompletos"}), 400

    conn = get_conn()
    cursor = conn.cursor()

    # Soma 1 voto de forma atômica (cria o item se ainda não existir).
    cursor.execute(
        q('''
            INSERT INTO votos (tipo, item_nome, total) VALUES (?, ?, 1)
            ON CONFLICT (item_nome) DO UPDATE SET total = votos.total + 1
        '''),
        (tipo, item_nome),
    )

    conn.commit()
    conn.close()

    return jsonify({"success": True})

if __name__ == '__main__':
    app.run(debug=True, port=5000)