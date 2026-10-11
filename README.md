# 🎵 Som & Cultura

Site sobre música, história e identidade: explore gêneros, instrumentos, curiosidades, uma linha do tempo das décadas e álbuns importantes, ouça prévias no Spotify e vote nos artistas e músicas da semana.

🔗 **Site no ar: https://site-som-e-cultura.onrender.com

---

## 📖 Sobre o projeto

O **Som & Cultura** reúne conteúdo educativo sobre música e uma parte interativa com a comunidade. Os dados da semana (artistas, músicas, álbuns, glossário, efemérides) ficam em listas no `script.js`, fáceis de editar. Votos e comentários ficam salvos no servidor.

## ✨ Funcionalidades

- **Sobre Música:** cards com gêneros musicais, instrumentos, curiosidades e glossário.
- **Hoje na história da música:** selo automático que aparece quando a data de hoje bate com uma efeméride cadastrada.
- **Linha do Tempo:** décadas de 1950 a 2020 com contexto social e gêneros de cada época, além de álbuns importantes que levam ao Spotify.
- **Descoberta Musical:** playlist do Spotify, top 5 artistas e top 5 músicas da semana, com bio expansível e prévia de 30 segundos.
- **Votação da semana:** votação de artista e de música, com porcentagens atualizadas automaticamente.
- **Comentários e indicações:** formulário aberto para os visitantes.
- **Tema claro/escuro** e **layout responsivo** (celular, tablet e computador).
- **Capas e fotos via Spotify (oEmbed):** as imagens são buscadas a partir dos links, sem hospedar arquivos.

## 🛠️ Tecnologias e linguagens

| Camada | Tecnologia |
|---|---|
| Estrutura | **HTML5** |
| Estilo | **CSS3** (`style.css`, `mobile.css`, `profissional.css`) |
| Interatividade | **JavaScript** (puro, sem frameworks) |
| Backend | **Python** com **Flask** |
| Banco de dados | **SQL**: SQLite (local) e PostgreSQL (produção) |
| Hospedagem | **Render** |
| Versionamento | **Git** e **GitHub** |

**Bibliotecas e serviços externos:** Font Awesome (ícones), Google Fonts (Fraunces e Inter), Spotify (player embutido, iframe API e oEmbed), `psycopg2` (conexão com Postgres).

## 📁 Estrutura de pastas

```
Site/
├── index.html          # página principal
├── script.js           # lógica do front-end e dados da semana
├── styles/
│   ├── style.css
│   ├── mobile.css
│   └── profissional.css
├── py/
│   └── main.py         # servidor Flask + API + banco de dados
└── README.md
```

## 🔌 API

O backend em Flask expõe uma API REST em JSON. Todas as rotas começam com `/api`.

### Resumo

| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/api/comentarios` | Lista os comentários |
| `POST` | `/api/comentarios` | Cria um comentário |
| `GET` | `/api/votos` | Lista o total de votos por item |
| `POST` | `/api/votos` | Registra um voto |

### 💬 Comentários

#### `GET /api/comentarios`

Retorna os comentários do mais recente para o mais antigo.

**Resposta `200`**
```json
[
  {
    "id": 1,
    "nome": "Maria",
    "texto": "Indico a música Girassol!",
    "data": "2026-10-11 14:30:00"
  }
]
```

#### `POST /api/comentarios`

Cria um novo comentário.

**Corpo da requisição**

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `nome` | string | Não | Nome de quem comenta (se vazio, aparece como "Anônimo") |
| `texto` | string | Sim | Conteúdo do comentário |

```json
{ "nome": "Maria", "texto": "Indico a música Girassol!" }
```

**Respostas**

| Status | Corpo |
|---|---|
| `200` | `{ "success": true }` |
| `400` | `{ "error": "O texto é obrigatório" }` |

### 🗳️ Votos

#### `GET /api/votos`

Retorna o total de votos de cada item já votado.

**Resposta `200`**
```json
[
  { "tipo": "artista", "item_nome": "Rita Lee", "total": 12 },
  { "tipo": "musica", "item_nome": "The Chain", "total": 7 }
]
```

#### `POST /api/votos`

Soma 1 voto ao item. Se o item ainda não existir, ele é criado.

**Corpo da requisição**

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `tipo` | string | Sim | `artista` ou `musica` |
| `item_nome` | string | Sim | Nome do artista ou da música (deve ser único) |

```json
{ "tipo": "artista", "item_nome": "Rita Lee" }
```

**Respostas**

| Status | Corpo |
|---|---|
| `200` | `{ "success": true }` |
| `400` | `{ "error": "Dados incompletos" }` |

### 🧪 Exemplo de uso

```bash
# Listar comentários
curl http://localhost:5000/api/comentarios

# Registrar um voto
curl -X POST http://localhost:5000/api/votos \
  -H "Content-Type: application/json" \
  -d '{"tipo": "artista", "item_nome": "Rita Lee"}'
```

## 🚀 Como rodar localmente

1. Clone o repositório:
   ```bash
   git clone https://github.com/camillymm/site-som-e-cultura.git
   cd site-som-e-cultura
   ```
2. Instale as dependências:
   ```bash
   pip install flask
   ```
   *(para usar Postgres, instale também `psycopg2-binary`)*
3. Inicie o servidor:
   ```bash
   python py/main.py
   ```
4. Abra [http://localhost:5000](http://localhost:5000) no navegador.

Localmente o projeto usa **SQLite** (`database.db`, criado automaticamente). Em produção, defina a variável de ambiente `DATABASE_URL` para usar **PostgreSQL**, e os dados não se perdem a cada deploy.

## ☁️ Deploy no Render

O site é publicado como **Web Service** a partir deste repositório. Configure a variável `DATABASE_URL` com a URL do banco Postgres para manter votos e comentários entre os deploys.

## ✏️ Como atualizar o conteúdo da semana

Edite no `script.js` as listas `TOP_ARTISTAS`, `TOP_MUSICAS`, `ALBUNS`, `EFEMERIDES`, `GLOSSARIO` e `TIMELINE`. Para as músicas, basta colar o link do Spotify no campo `spotify`.

## 👩‍💻 Autora

Feito por **camillymmoutinho**.

© 2026 camillymmoutinho. Todos os direitos reservados.
