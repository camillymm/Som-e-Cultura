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
    """
auth.py — cadastro, login e sessão (somente nome de usuário + senha) do Som & Cultura.

Como ligar ao seu app Flask (veja também o README no final da resposta):

    from auth import auth_bp, init_auth

    app = Flask(__name__)
    init_auth(app)                 # chave secreta, cookies de sessão e criação das tabelas
    app.register_blueprint(auth_bp)

Rotas (todas em JSON, prefixo /api):
    POST   /api/auth/register            {username, password}  -> cria a conta e já entra
    POST   /api/auth/login               {username, password}
    POST   /api/auth/logout
    GET    /api/auth/me                  -> {user: {...}} ou {user: null}
    GET    /api/auth/username-available?u=nome
    PUT    /api/me/preferences           {theme?, comment_mode?, comment_nick?}
    POST   /api/me/votos                 {tipo, item_nome}     (1 voto por categoria por conta)
    DELETE /api/me/votos/<tipo>          (desfaz o registro caso a contagem geral falhe)
"""
import os
import re
import sqlite3
import time
from datetime import timedelta
from functools import wraps

from flask import Blueprint, g, jsonify, request, session
from werkzeug.security import check_password_hash, generate_password_hash

auth_bp = Blueprint("auth", __name__, url_prefix="/api")

# No Render, aponte AUTH_DB_PATH para um Disco Persistente (ex.: /data/usuarios.db),
# senão o arquivo é apagado a cada novo deploy.
DB_PATH = os.environ.get("AUTH_DB_PATH") or os.path.join(
    os.path.dirname(os.path.abspath(__file__)), "usuarios.db"
)

USERNAME_RE = re.compile(r"^[A-Za-z0-9_.]{3,20}$")
SENHA_MIN, SENHA_MAX = 6, 128
APELIDO_MIN, APELIDO_MAX = 2, 24
TIPOS_VOTO = ("artista", "musica")
TEMAS = ("light", "dark")
MODOS_COMENTARIO = ("user", "anon", "nick")

# Limite simples de tentativas de login (por IP + usuário)
MAX_FALHAS = 5
JANELA_SEG = 600
_falhas = {}
_HASH_FALSO = generate_password_hash("senha-falsa-para-igualar-o-tempo")

SCHEMA = """
CREATE TABLE IF NOT EXISTS usuarios (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    username     TEXT NOT NULL,                 -- como a pessoa digitou (exibição)
    username_key TEXT NOT NULL UNIQUE,          -- minúsculo: garante nome único sem diferenciar maiúsculas
    senha_hash   TEXT NOT NULL,
    criado_em    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS preferencias (
    usuario_id   INTEGER PRIMARY KEY REFERENCES usuarios(id) ON DELETE CASCADE,
    theme        TEXT,
    comment_mode TEXT,
    comment_nick TEXT
);

CREATE TABLE IF NOT EXISTS votos_usuario (
    usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    tipo       TEXT NOT NULL,
    item_nome  TEXT NOT NULL,
    criado_em  TEXT NOT NULL DEFAULT (datetime('now')),
    PRIMARY KEY (usuario_id, tipo)
);
"""


# ----------------------------------------------------------------------------
# Inicialização
# ----------------------------------------------------------------------------
def init_auth(app):
    chave = app.config.get("SECRET_KEY") or os.environ.get("SECRET_KEY")
    if not chave:
        if os.environ.get("RENDER"):
            raise RuntimeError("Defina a variável de ambiente SECRET_KEY no Render.")
        chave = "chave-somente-para-desenvolvimento"
    app.config["SECRET_KEY"] = chave
    app.config.update(
        SESSION_COOKIE_HTTPONLY=True,
        SESSION_COOKIE_SAMESITE="Lax",
        SESSION_COOKIE_SECURE=bool(os.environ.get("RENDER")),  # HTTPS no Render
        PERMANENT_SESSION_LIFETIME=timedelta(days=30),
    )

    pasta = os.path.dirname(DB_PATH)
    if pasta:
        os.makedirs(pasta, exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.executescript(SCHEMA)
    conn.commit()
    conn.close()


def get_db():
    if "auth_db" not in g:
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        conn.execute("PRAGMA foreign_keys = ON")
        g.auth_db = conn
    return g.auth_db


@auth_bp.teardown_app_request
def _fechar_db(_erro):
    conn = g.pop("auth_db", None)
    if conn is not None:
        conn.close()


# ----------------------------------------------------------------------------
# Validações
# ----------------------------------------------------------------------------
def validar_username(username):
    if not USERNAME_RE.match(username):
        return "Use de 3 a 20 caracteres: letras, números, _ ou ."
    return None


def validar_senha(senha):
    if len(senha) < SENHA_MIN:
        return f"A senha precisa ter pelo menos {SENHA_MIN} caracteres."
    if len(senha) > SENHA_MAX:
        return f"A senha pode ter no máximo {SENHA_MAX} caracteres."
    return None


def validar_apelido(apelido):
    if len(apelido) < APELIDO_MIN or len(apelido) > APELIDO_MAX:
        return f"O apelido precisa ter de {APELIDO_MIN} a {APELIDO_MAX} caracteres."
    if apelido.startswith("@"):
        return "O apelido não pode começar com @ (formato reservado para usuários)."
    return None


# ----------------------------------------------------------------------------
# Sessão e utilitários
# ----------------------------------------------------------------------------
def _iniciar_sessao(usuario_id):
    session.clear()
    session["uid"] = usuario_id
    session.permanent = True


def _usuario_atual():
    uid = session.get("uid")
    if not uid:
        return None
    return get_db().execute("SELECT * FROM usuarios WHERE id = ?", (uid,)).fetchone()


def _payload(user):
    """Tudo o que o front precisa saber sobre a conta (sem a senha)."""
    db = get_db()
    prefs = db.execute(
        "SELECT theme, comment_mode, comment_nick FROM preferencias WHERE usuario_id = ?",
        (user["id"],),
    ).fetchone()
    votos = db.execute(
        "SELECT tipo, item_nome FROM votos_usuario WHERE usuario_id = ?", (user["id"],)
    ).fetchall()
    return {
        "username": user["username"],
        "preferences": {
            "theme": prefs["theme"] if prefs else None,
            "comment_mode": prefs["comment_mode"] if prefs else None,
            "comment_nick": prefs["comment_nick"] if prefs else None,
        },
        "votos": {v["tipo"]: v["item_nome"] for v in votos},
    }


def login_required(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        user = _usuario_atual()
        if not user:
            return jsonify(error="Faça login para continuar."), 401
        g.user = user
        return fn(*args, **kwargs)

    return wrapper


def _chave_tentativa(username):
    ip = request.headers.get("X-Forwarded-For", "").split(",")[0].strip() or request.remote_addr or ""
    return f"{ip}|{username.lower()}"


def _bloqueado(chave):
    agora = time.time()
    recentes = [t for t in _falhas.get(chave, []) if agora - t < JANELA_SEG]
    _falhas[chave] = recentes
    return len(recentes) >= MAX_FALHAS


def _registrar_falha(chave):
    if len(_falhas) > 5000:  # evita crescer sem limite
        _falhas.clear()
    _falhas.setdefault(chave, []).append(time.time())


# ----------------------------------------------------------------------------
# Rotas de autenticação
# ----------------------------------------------------------------------------
@auth_bp.post("/auth/register")
def registrar():
    data = request.get_json(silent=True) or {}
    username = str(data.get("username", "")).strip()
    senha = str(data.get("password", ""))

    erro = validar_username(username) or validar_senha(senha)
    if erro:
        return jsonify(error=erro), 400

    db = get_db()
    try:
        cur = db.execute(
            "INSERT INTO usuarios (username, username_key, senha_hash) VALUES (?, ?, ?)",
            (username, username.lower(), generate_password_hash(senha)),
        )
        db.execute("INSERT INTO preferencias (usuario_id) VALUES (?)", (cur.lastrowid,))
        db.commit()
    except sqlite3.IntegrityError:  # UNIQUE(username_key): nome já existe
        db.rollback()
        return jsonify(error="Esse nome de usuário já está em uso."), 409

    _iniciar_sessao(cur.lastrowid)
    return jsonify(user=_payload(_usuario_atual())), 201


@auth_bp.post("/auth/login")
def entrar():
    data = request.get_json(silent=True) or {}
    username = str(data.get("username", "")).strip()
    senha = str(data.get("password", ""))
    if not username or not senha:
        return jsonify(error="Informe o nome de usuário e a senha."), 400

    chave = _chave_tentativa(username)
    if _bloqueado(chave):
        return jsonify(error="Muitas tentativas. Aguarde alguns minutos e tente de novo."), 429

    user = get_db().execute(
        "SELECT * FROM usuarios WHERE username_key = ?", (username.lower(),)
    ).fetchone()
    # Confere o hash mesmo quando o usuário não existe, para não revelar isso pelo tempo de resposta
    senha_ok = check_password_hash(user["senha_hash"] if user else _HASH_FALSO, senha)
    if not (user and senha_ok):
        _registrar_falha(chave)
        return jsonify(error="Nome de usuário ou senha incorretos."), 401

    _falhas.pop(chave, None)
    _iniciar_sessao(user["id"])
    return jsonify(user=_payload(user))


@auth_bp.post("/auth/logout")
def sair():
    session.clear()
    return jsonify(success=True)


@auth_bp.get("/auth/me")
def eu():
    user = _usuario_atual()
    if not user:
        session.clear()  # cookie de uma conta que não existe mais
        return jsonify(user=None)
    return jsonify(user=_payload(user))


@auth_bp.get("/auth/username-available")
def username_disponivel():
    username = request.args.get("u", "").strip()
    erro = validar_username(username)
    if erro:
        return jsonify(available=False, error=erro)
    existe = get_db().execute(
        "SELECT 1 FROM usuarios WHERE username_key = ?", (username.lower(),)
    ).fetchone()
    return jsonify(available=not existe)


# ----------------------------------------------------------------------------
# Dados da conta: preferências e votos (sempre ligados ao usuário da sessão)
# ----------------------------------------------------------------------------
@auth_bp.put("/me/preferences")
@login_required
def salvar_preferencias():
    data = request.get_json(silent=True) or {}
    campos = {}

    if "theme" in data:
        if data["theme"] not in TEMAS:
            return jsonify(error="Tema inválido."), 400
        campos["theme"] = data["theme"]

    if "comment_mode" in data:
        if data["comment_mode"] not in MODOS_COMENTARIO:
            return jsonify(error="Modo de comentário inválido."), 400
        campos["comment_mode"] = data["comment_mode"]

    if "comment_nick" in data:
        apelido = " ".join(str(data["comment_nick"] or "").split())
        if apelido:
            erro = validar_apelido(apelido)
            if erro:
                return jsonify(error=erro), 400
        campos["comment_nick"] = apelido or None

    if not campos:
        return jsonify(error="Nada para salvar."), 400

    # os nomes das colunas vêm das chaves fixas acima (nunca do usuário)
    sets = ", ".join(f"{coluna} = ?" for coluna in campos)
    db = get_db()
    db.execute(
        f"UPDATE preferencias SET {sets} WHERE usuario_id = ?",
        (*campos.values(), g.user["id"]),
    )
    db.commit()
    return jsonify(success=True)


@auth_bp.post("/me/votos")
@login_required
def registrar_voto():
    data = request.get_json(silent=True) or {}
    tipo = data.get("tipo")
    item_nome = str(data.get("item_nome", "")).strip()
    if tipo not in TIPOS_VOTO or not item_nome or len(item_nome) > 100:
        return jsonify(error="Voto inválido."), 400

    db = get_db()
    try:
        db.execute(
            "INSERT INTO votos_usuario (usuario_id, tipo, item_nome) VALUES (?, ?, ?)",
            (g.user["id"], tipo, item_nome),
        )
        db.commit()
    except sqlite3.IntegrityError:
        db.rollback()
        return jsonify(error="Você já votou nesta categoria."), 409
    return jsonify(success=True), 201


@auth_bp.delete("/me/votos/<tipo>")
@login_required
def desfazer_voto(tipo):
    if tipo not in TIPOS_VOTO:
        return jsonify(error="Categoria inválida."), 400
    db = get_db()
    db.execute(
        "DELETE FROM votos_usuario WHERE usuario_id = ? AND tipo = ?", (g.user["id"], tipo)
    )
    db.commit()
    return jsonify(success=True)