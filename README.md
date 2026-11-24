# Som & Cultura

> **Música. História. Conexão.**
> Um site sobre música com linha do tempo, discos históricos, descobertas da semana, votação da comunidade e contas de usuário.

**🔗 Site no ar:** https://som-e-cultura.onrender.com

> ⏳ O site roda no plano gratuito do Render. Se ninguém acessou nas últimas horas, a **primeira abertura pode levar alguns segundos** enquanto o servidor "acorda". Depois fica rápido.

<p align="center">
  <img src="docs/modo_claro.png" alt="Página inicial no modo claro" width="49%">
  <img src="docs/modo_escuro.png" alt="Página inicial no modo escuro" width="49%">
</p>

<p align="center">
  <img src="docs/meus-votos-som-e-cultura.png" alt="Cartão &quot;Meus votos da semana&quot; gerado para os stories" width="260"><br>
  <sub>O cartão "Meus votos da semana", gerado no navegador para baixar ou compartilhar.</sub>
</p>

---

## O que o site faz

- **Sobre música:** gêneros, instrumentos, curiosidades e glossário em acordeões, além da "efeméride do dia" (um fato da história da música que aparece na data certa).
- **Linha do tempo:** décadas de 1950 a 2020 com contexto social e gêneros da época, mais uma vitrine de discos que mudaram a história, com capas e link para o Spotify.
- **Descoberta musical:** top artistas e músicas da semana, com biografia e **prévia de 30 segundos** pelo player do Spotify, sem sair da página.
- **Votação e comunidade:**
  - voto no artista e na música da semana, com resultados em tempo quase real (atualiza a cada 10 segundos);
  - confete e barras animadas ao votar;
  - histórico dos meus votos, semana a semana;
  - **cartão "Meus votos da semana"**, uma imagem 1080×1920 gerada no navegador (canvas) para baixar ou compartilhar nos stories;
  - comentários e indicações (música, artista e álbum favoritos), com a escolha de aparecer como `@usuário`, anônimo ou com apelido.
- **Contas de usuário:** cadastro só com nome de usuário e senha (sem e-mail). Com conta, o voto e as preferências (tema e forma de comentar) valem em qualquer aparelho.
- **Modo claro/escuro**, que respeita a preferência do sistema.
- **Link direto para cada aba** (`/#timeline`, `/#descoberta`, `/#votacao`), com o botão voltar do navegador funcionando.
- **Toca-discos animado** no topo: clique para pausar ou continuar o disco.

## Tecnologias

| Camada | O que usei |
|---|---|
| Front-end | HTML, CSS e JavaScript puro (sem frameworks) |
| Back-end | Python + Flask |
| Banco de dados | SQLite no computador, Postgres em produção (escolhido automaticamente pela variável `DATABASE_URL`) |
| Hospedagem | Render |
| Integrações | Spotify (player embutido e oEmbed para as imagens), Google Fonts, Font Awesome |

## Destaques técnicos

- **Senhas com hash** (`werkzeug.security`) e limite de tentativas de login por IP e usuário.
- **Sessão por cookie assinado**, `HttpOnly`, `SameSite=Lax` e `Secure` em produção.
- **SQL parametrizado** em todas as consultas; o mesmo código roda em SQLite e Postgres.
- **Um voto por categoria e por conta**, garantido pela chave primária do banco, não só pelo front-end.
- **O formato `@nome` é reservado:** ninguém consegue comentar como `@outra_pessoa`.
- **Servidor expõe só o necessário:** o Flask entrega apenas o `index.html`, a pasta `styles/` e uma lista fixa de arquivos, nunca o código do back-end ou o banco.
- **Acessibilidade:** foco preso nos modais, rótulos ARIA, navegação por teclado e respeito a `prefers-reduced-motion`.
- **Responsivo** para celular, tablet e desktop.

## Estrutura de pastas

```
Som-e-Cultura/
├── index.html
├── script.js
├── styles/
│   └── style.css
├── images/            # imagens do site
├── docs/              # prints usados neste README
└── py/
    └── main.py        # servidor Flask + API
```

## Como rodar no seu computador

Pré-requisito: Python 3.

```bash
git clone https://github.com/camillymm/Som-e-Cultura.git
cd Som-e-Cultura

pip install flask
python py/main.py
```

Abra http://localhost:5000. No computador o site usa um SQLite local (`py/database.db`, criado sozinho na primeira execução).

### Variáveis de ambiente (produção)

| Variável | Para que serve |
|---|---|
| `SECRET_KEY` | Assina o cookie de sessão. **Obrigatória em produção.** |
| `DATABASE_URL` | Endereço do Postgres. Sem ela, usa o SQLite local. (Em produção, instale também `psycopg2-binary`.) |
| `ADMIN_TOKEN` | Senha de moderação (apagar comentários e zerar a votação). Sem ela, a moderação fica desativada. |

## API

| Método | Rota | Descrição |
|---|---|---|
| POST | `/api/auth/register` | Cria conta e já inicia a sessão |
| POST | `/api/auth/login` | Entra (com limite de tentativas) |
| POST | `/api/auth/logout` | Sai |
| GET | `/api/auth/me` | Dados da conta logada |
| GET | `/api/auth/username-available?u=` | Confere se o nome de usuário está livre |
| PUT | `/api/me/preferences` | Salva tema e modo de comentário |
| POST / DELETE | `/api/me/votos` | Registra / desfaz o voto da conta |
| GET / POST | `/api/votos` | Contagem geral / soma um voto |
| GET / POST | `/api/favoritos/<tipo>` | Lista / envia comentários (`musica`, `artista`, `album`) |
| DELETE | `/api/favoritos/<tipo>/<id>` | Apaga uma resposta (moderação) |
| POST | `/api/votos/reset` | Zera a votação da semana (moderação) |

As rotas de moderação exigem o cabeçalho `X-Admin-Token`. Exemplo para zerar a semana:

```bash
curl -X POST https://som-e-cultura.onrender.com/api/votos/reset -H "X-Admin-Token: SUA_SENHA"
```

## Como atualizar os artistas e músicas da semana

Edite as listas `TOP_ARTISTAS`, `TOP_MUSICAS`, `ARTISTAS_SPOTIFY` e `VOTE_CONFIGS` no início do `script.js`, usando os links do Spotify de cada artista e faixa. As imagens são buscadas automaticamente. Para começar a semana do zero, use a rota de reset acima e troque as chaves `user-voted-artista` e `user-voted-musica` no `script.js`.

## Limitações conhecidas

- **Visitantes sem conta** têm o voto controlado só pelo navegador (`localStorage`), então é possível votar mais de uma vez limpando os dados. Com conta, o limite é garantido pelo servidor.
- O limite de tentativas de login fica na memória do processo; com vários processos no servidor, cada um conta separado.
- No plano gratuito do Render, a primeira requisição depois de um tempo parado é lenta.

## Próximos passos

- Limitar votos de visitantes por IP.
- Painel simples de moderação.
- Mais períodos na linha do tempo e mais discos.

## Créditos e avisos

Projeto pessoal e sem fins comerciais, feito por **camillymmoutinho** ([@camillymm](https://github.com/camillymm)).
As capas e imagens vêm do Spotify (oEmbed) e pertencem aos respectivos titulares. Nomes de artistas, álbuns e músicas são citados apenas para fins informativos e culturais.
