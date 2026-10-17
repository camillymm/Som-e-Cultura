try:
    from flask import Flask, jsonify, request, send_from_directory, session  # type: ignore[import-not-found]
except ModuleNotFoundError as exc:
    raise RuntimeError(
        "Flask não está instalado. Instale com: pip install flask"
    ) from exc

import hmac
import os
import re
import sqlite3
import time
from datetime import timedelta

from werkzeug.security import check_password_hash, generate_password_hash

# O main.py está na pasta "py/", mas o index.html, script.js e a pasta
# "styles/" ficam um nível acima (na pasta "Site"). Por isso apontamos o
# static_folder para o diretório pai, usando caminho absoluto — assim
# funciona não importa de onde você rode "python main.py".
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
SITE_DIR = os.path.join(BASE_DIR, '..')
app = Flask(__name__, static_folder=SITE_DIR, static_url_path='')

# ===================== SESSÃO (LOGIN) =====================
# SECRET_KEY assina o cookie de sessão. No Render, crie a variável de ambiente
# SECRET_KEY (Environment > SECRET_KEY) com um texto longo e aleatório.
# NUNCA escreva a chave aqui no código.
# O Render define RENDER=true automaticamente; é assim que sabemos que é produção.
EM_PRODUCAO = bool(os.environ.get("RENDER"))
SECRET_KEY = os.environ.get("SECRET_KEY")
if not SECRET_KEY:
    if EM_PRODUCAO:
        raise RuntimeError("Defina a variável de ambiente SECRET_KEY no Render.")
    SECRET_KEY = "chave-somente-para-desenvolvimento"  # só no seu computador

app.config.update(
    SECRET_KEY=SECRET_KEY,
    SESSION_COOKIE_HTTPONLY=True,       # o JavaScript não consegue ler o cookie
    SESSION_COOKIE_SAMESITE="Lax",      # não é enviado em requisições de outros sites
    SESSION_COOKIE_SECURE=EM_PRODUCAO,  # só por HTTPS (no Render); no localhost é http
    PERMANENT_SESSION_LIFETIME=timedelta(days=30),
)

# CORS simples, sem depender do pacote flask-cors.
@app.after_request
def add_cors_headers(response):
    response.headers['Access-Control-Allow-Origin'] = '*'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type, X-Admin-Token'
    response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
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
    # Erros de "valor duplicado" (nome de usuário já existe, voto repetido...)
    ERROS_INTEGRIDADE = (sqlite3.IntegrityError, psycopg2.IntegrityError)
else:
    ERROS_INTEGRIDADE = (sqlite3.IntegrityError,)

# Senha de moderação (apagar comentários). Vem de uma variável de ambiente
# configurada no Render (Environment > ADMIN_TOKEN). NUNCA escreva a senha
# aqui no código: o repositório do GitHub pode ser público.
ADMIN_TOKEN = os.environ.get("ADMIN_TOKEN")

# Tipos aceitos nas respostas de favoritos (seções dentro de "Comentários &
# Indicações"). Têm que bater com as chaves de FAVORITOS no script.js.
TIPOS_FAVORITOS = {"musica", "artista", "album"}

# Categorias de voto (batem com VOTE_CONFIGS no script.js)
TIPOS_VOTO = {"artista", "musica"}

# Regras da conta
USERNAME_RE = re.compile(r"^[A-Za-z0-9_.]{3,20}$")
SENHA_MIN, SENHA_MAX = 6, 128
APELIDO_MIN, APELIDO_MAX = 2, 24
TEMAS = {"light", "dark"}
MODOS_COMENTARIO = {"user", "anon", "nick"}


def get_conn():
    if USE_POSTGRES:
        return psycopg2.connect(DATABASE_URL)
    conn = sqlite3.connect(DB_NAME)
    conn.execute("PRAGMA foreign_keys = ON")  # o SQLite só respeita chaves estrangeiras se pedirmos
    return conn


def q(sql):
    """Troca o marcador de parâmetro: SQLite usa ?, Postgres usa %s."""
    return sql.replace("?", "%s") if USE_POSTGRES else sql


# --- Rota que serve a página principal ---
@app.route('/')
def index():
    return send_from_directory(app.static_folder, 'index.html')


def garantir_coluna_usuario(cursor, tabela):
    """Adiciona a coluna usuario_id em uma tabela que já existia (sem apagar nada)."""
    if USE_POSTGRES:
        cursor.execute(f"ALTER TABLE {tabela} ADD COLUMN IF NOT EXISTS usuario_id INTEGER")
    else:
        cursor.execute(f"PRAGMA table_info({tabela})")
        if 'usuario_id' not in [coluna[1] for coluna in cursor.fetchall()]:
            cursor.execute(f"ALTER TABLE {tabela} ADD COLUMN usuario_id INTEGER")


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

    # ---- Contas de usuário ----
    # username_key é o nome em minúsculas e é UNIQUE: é ele que impede nomes
    # duplicados (Camilly e camilly contam como o mesmo nome).
    cursor.execute(f'''
        CREATE TABLE IF NOT EXISTS usuarios (
            id {pk},
            username TEXT NOT NULL,
            username_key TEXT NOT NULL UNIQUE,
            senha_hash TEXT NOT NULL,
            criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    # Preferências da conta (tema do site e como a pessoa prefere comentar)
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS preferencias (
            usuario_id INTEGER PRIMARY KEY REFERENCES usuarios(id) ON DELETE CASCADE,
            theme TEXT,
            comment_mode TEXT,
            comment_nick TEXT
        )
    ''')
    # Voto de cada conta por categoria (1 por categoria)
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS votos_usuario (
            usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
            tipo TEXT NOT NULL,
            item_nome TEXT NOT NULL,
            criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (usuario_id, tipo)
        )
    ''')
    # Comentários e favoritos passam a guardar de qual conta vieram (fica vazio
    # para visitantes). O nome exibido continua sendo o que a pessoa escolheu.
    garantir_coluna_usuario(cursor, 'comentarios')
    garantir_coluna_usuario(cursor, 'favoritos')

    conn.commit()
    conn.close()


init_db()

# ===================== CONTAS: CADASTRO, LOGIN E SESSÃO =====================
# Limite simples de tentativas de login erradas (por IP + usuário).
MAX_FALHAS = 5
JANELA_SEG = 600
_falhas = {}
_HASH_FALSO = generate_password_hash("senha-falsa-para-igualar-o-tempo")


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


def iniciar_sessao(usuario_id):
    session.clear()
    session["uid"] = usuario_id
    session.permanent = True


def usuario_atual():
    """Devolve (id, username, username_key) de quem está logado, ou None."""
    uid = session.get("uid")
    if not uid:
        return None
    conn = get_conn()
    cursor = conn.cursor()
    cursor.execute(q("SELECT id, username, username_key FROM usuarios WHERE id = ?"), (uid,))
    row = cursor.fetchone()
    conn.close()
    return row


def montar_usuario(usuario_id, username):
    """Tudo o que o site precisa saber da conta (nunca inclui a senha)."""
    conn = get_conn()
    cursor = conn.cursor()
    cursor.execute(
        q("SELECT theme, comment_mode, comment_nick FROM preferencias WHERE usuario_id = ?"),
        (usuario_id,),
    )
    prefs = cursor.fetchone() or (None, None, None)
    cursor.execute(
        q("SELECT tipo, item_nome FROM votos_usuario WHERE usuario_id = ?"),
        (usuario_id,),
    )
    votos = cursor.fetchall()
    conn.close()
    return {
        "username": username,
        "preferences": {"theme": prefs[0], "comment_mode": prefs[1], "comment_nick": prefs[2]},
        "votos": {tipo: item for tipo, item in votos},
    }


def chave_tentativa(username):
    ip = request.headers.get("X-Forwarded-For", "").split(",")[0].strip() or request.remote_addr or ""
    return f"{ip}|{username.lower()}"


def tentativas_bloqueadas(chave):
    agora = time.time()
    recentes = [t for t in _falhas.get(chave, []) if agora - t < JANELA_SEG]
    _falhas[chave] = recentes
    return len(recentes) >= MAX_FALHAS


def registrar_falha(chave):
    if len(_falhas) > 5000:  # evita crescer sem limite
        _falhas.clear()
    _falhas.setdefault(chave, []).append(time.time())


def nome_exibido_valido(nome, usuario):
    """O formato @nome é reservado: só vale se for o usuário que está logado."""
    if nome.startswith("@") and not (usuario and nome[1:].lower() == usuario[2]):
        return False
    return True


@app.route('/api/auth/register', methods=['POST'])
def registrar():
    data = request.get_json(silent=True) or {}
    username = str(data.get('username', '')).strip()
    senha = str(data.get('password', ''))

    erro = validar_username(username) or validar_senha(senha)
    if erro:
        return jsonify({"error": erro}), 400

    conn = get_conn()
    cursor = conn.cursor()
    try:
        insert = q("INSERT INTO usuarios (username, username_key, senha_hash) VALUES (?, ?, ?)")
        valores = (username, username.lower(), generate_password_hash(senha))
        if USE_POSTGRES:
            cursor.execute(insert + " RETURNING id", valores)
            novo_id = cursor.fetchone()[0]
        else:
            cursor.execute(insert, valores)
            novo_id = cursor.lastrowid
        cursor.execute(q("INSERT INTO preferencias (usuario_id) VALUES (?)"), (novo_id,))
        conn.commit()
    except ERROS_INTEGRIDADE:  # username_key UNIQUE: o nome já existe
        conn.rollback()
        conn.close()
        return jsonify({"error": "Esse nome de usuário já está em uso."}), 409
    conn.close()

    iniciar_sessao(novo_id)
    return jsonify({"user": montar_usuario(novo_id, username)}), 201


@app.route('/api/auth/login', methods=['POST'])
def entrar():
    data = request.get_json(silent=True) or {}
    username = str(data.get('username', '')).strip()
    senha = str(data.get('password', ''))
    if not username or not senha:
        return jsonify({"error": "Informe o nome de usuário e a senha."}), 400

    chave = chave_tentativa(username)
    if tentativas_bloqueadas(chave):
        return jsonify({"error": "Muitas tentativas. Aguarde alguns minutos e tente de novo."}), 429

    conn = get_conn()
    cursor = conn.cursor()
    cursor.execute(
        q("SELECT id, username, senha_hash FROM usuarios WHERE username_key = ?"),
        (username.lower(),),
    )
    row = cursor.fetchone()
    conn.close()

    # Confere o hash mesmo se o usuário não existir, para não revelar isso pelo tempo de resposta
    senha_ok = check_password_hash(row[2] if row else _HASH_FALSO, senha)
    if not (row and senha_ok):
        registrar_falha(chave)
        return jsonify({"error": "Nome de usuário ou senha incorretos."}), 401

    _falhas.pop(chave, None)
    iniciar_sessao(row[0])
    return jsonify({"user": montar_usuario(row[0], row[1])})


@app.route('/api/auth/logout', methods=['POST'])
def sair():
    session.clear()
    return jsonify({"success": True})


@app.route('/api/auth/me', methods=['GET'])
def eu():
    usuario = usuario_atual()
    if not usuario:
        session.clear()  # cookie de uma conta que não existe mais
        return jsonify({"user": None})
    return jsonify({"user": montar_usuario(usuario[0], usuario[1])})


@app.route('/api/auth/username-available', methods=['GET'])
def username_disponivel():
    username = request.args.get('u', '').strip()
    erro = validar_username(username)
    if erro:
        return jsonify({"available": False, "error": erro})

    conn = get_conn()
    cursor = conn.cursor()
    cursor.execute(q("SELECT 1 FROM usuarios WHERE username_key = ?"), (username.lower(),))
    existe = cursor.fetchone()
    conn.close()
    return jsonify({"available": not existe})


# --- Dados da conta: preferências e votos (sempre da conta logada) ---
@app.route('/api/me/preferences', methods=['PUT'])
def salvar_preferencias():
    usuario = usuario_atual()
    if not usuario:
        return jsonify({"error": "Faça login para continuar."}), 401

    data = request.get_json(silent=True) or {}
    campos = {}

    if 'theme' in data:
        if data['theme'] not in TEMAS:
            return jsonify({"error": "Tema inválido."}), 400
        campos['theme'] = data['theme']

    if 'comment_mode' in data:
        if data['comment_mode'] not in MODOS_COMENTARIO:
            return jsonify({"error": "Modo de comentário inválido."}), 400
        campos['comment_mode'] = data['comment_mode']

    if 'comment_nick' in data:
        apelido = " ".join(str(data['comment_nick'] or "").split())
        if apelido:
            erro = validar_apelido(apelido)
            if erro:
                return jsonify({"error": erro}), 400
        campos['comment_nick'] = apelido or None

    if not campos:
        return jsonify({"error": "Nada para salvar."}), 400

    # os nomes das colunas vêm das chaves fixas acima (nunca do usuário)
    sets = ", ".join(f"{coluna} = ?" for coluna in campos)
    conn = get_conn()
    cursor = conn.cursor()
    cursor.execute(
        q(f"UPDATE preferencias SET {sets} WHERE usuario_id = ?"),
        (*campos.values(), usuario[0]),
    )
    conn.commit()
    conn.close()
    return jsonify({"success": True})


@app.route('/api/me/votos', methods=['POST'])
def registrar_voto_da_conta():
    usuario = usuario_atual()
    if not usuario:
        return jsonify({"error": "Faça login para continuar."}), 401

    data = request.get_json(silent=True) or {}
    tipo = data.get('tipo')
    item_nome = str(data.get('item_nome', '')).strip()
    if tipo not in TIPOS_VOTO or not item_nome or len(item_nome) > 100:
        return jsonify({"error": "Voto inválido."}), 400

    conn = get_conn()
    cursor = conn.cursor()
    try:
        cursor.execute(
            q("INSERT INTO votos_usuario (usuario_id, tipo, item_nome) VALUES (?, ?, ?)"),
            (usuario[0], tipo, item_nome),
        )
        conn.commit()
    except ERROS_INTEGRIDADE:  # chave (usuario_id, tipo): a conta já votou aqui
        conn.rollback()
        conn.close()
        return jsonify({"error": "Você já votou nesta categoria."}), 409
    conn.close()
    return jsonify({"success": True}), 201


# Desfaz o registro do voto na conta (o site usa isso se a contagem geral falhar)
@app.route('/api/me/votos/<tipo>', methods=['DELETE'])
def desfazer_voto_da_conta(tipo):
    usuario = usuario_atual()
    if not usuario:
        return jsonify({"error": "Faça login para continuar."}), 401
    if tipo not in TIPOS_VOTO:
        return jsonify({"error": "Categoria inválida."}), 400

    conn = get_conn()
    cursor = conn.cursor()
    cursor.execute(
        q("DELETE FROM votos_usuario WHERE usuario_id = ? AND tipo = ?"),
        (usuario[0], tipo),
    )
    conn.commit()
    conn.close()
    return jsonify({"success": True})


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

    usuario = usuario_atual()
    if nome and not nome_exibido_valido(str(nome).strip(), usuario):
        return jsonify({"error": "O formato @nome é reservado ao usuário logado."}), 400

    conn = get_conn()
    cursor = conn.cursor()
    cursor.execute(
        q("INSERT INTO comentarios (nome, texto, usuario_id) VALUES (?, ?, ?)"),
        (nome, texto, usuario[0] if usuario else None),
    )
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

    # Quem está logado pode comentar como @usuario, como Anônimo ou com um apelido.
    # Só não pode usar o @ de outra pessoa.
    usuario = usuario_atual()
    if not nome_exibido_valido(nome, usuario):
        return jsonify({"error": "O formato @nome é reservado ao usuário logado."}), 400

    conn = get_conn()
    cursor = conn.cursor()
    cursor.execute(
        q("INSERT INTO favoritos (tipo, nome, texto, usuario_id) VALUES (?, ?, ?, ?)"),
        (tipo, nome, texto, usuario[0] if usuario else None),
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