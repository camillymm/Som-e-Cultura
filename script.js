/* ===================== CONFIGURAÇÃO DA API =====================
   Caminhos relativos (ex: "/api/comentarios") — funcionam porque o Flask
   agora serve este próprio arquivo HTML (mesma origem). Se um dia você for
   hospedar o HTML em outro servidor/porta separado do Flask, troque os
   caminhos abaixo para uma URL absoluta, ex: 'http://localhost:5000/api'. */
const API_BASE = '/api';

async function apiGet(path){
  try{
    const res = await fetch(`${API_BASE}${path}`);
    if(!res.ok) throw new Error('Resposta não OK: ' + res.status);
    return await res.json();
  }catch(e){
    console.error('Erro ao buscar dados da API:', e);
    return null;
  }
}
async function apiPost(path, body){
  try{
    const res = await fetch(`${API_BASE}${path}`, {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify(body)
    });
    if(!res.ok) throw new Error('Resposta não OK: ' + res.status);
    return await res.json();
  }catch(e){
    console.error('Erro ao enviar dados para a API:', e);
    return null;
  }
}

/* ===================== EDITÁVEL: dados da semana =====================
   Para colocar uma foto, cole a URL da imagem no campo "img" de cada item
   (ex: img:"https://meusite.com/froid.jpg"). Deixe img:"" para manter o
   ícone padrão (Font Awesome): microfone nos artistas, nota musical nas
   músicas e disco de vinil nos álbuns — veja ARTIST_ICON / SONG_ICON /
   ALBUM_ICON mais abaixo caso queira trocar algum desses ícones.
   O campo "bio" aparece quando o visitante clica no artista/música — troque
   o texto toda semana junto com o resto dos dados.

   PRÉVIA DE ÁUDIO (só nas músicas): preencha "spotify" com o link da música
   no Spotify (Compartilhar > Copiar link da música). O botão ▶ abre o player
   do Spotify: quem não está logado ouve um trecho de 30 segundos, e quem está
   logado no Spotify ouve a música inteira. Com "spotify" vazio, o botão abre
   a busca do Spotify com o título e o artista, em outra aba.

   ATENÇÃO com aspas: o texto da bio fica entre aspas duplas ("..."). Se
   você quiser usar aspas DENTRO do texto (ex: o nome de uma música), escreva
   \" no lugar de ", assim: bio:"A música \"Garota\" é ..." — sem isso o
   site inteiro para de funcionar. ======================== */
const TOP_ARTISTAS = [
  {name:"Froid", sub:"Hip-hop", bio:"Renato Alves Menezes Barreto, o Froid, nasceu em Belo Horizonte (MG) em 1993 e começou a carreira em Brasília no grupo Um Barril de Rap, ao lado de Sampa e Yank, ganhando notoriedade nas batalhas de rima da capital. Solo desde 2017, transita entre rap, trap e batidas mais melódicas, com letras que misturam crítica social e reflexão pessoal — traço marcante desde o hit \"Pseudosocial\". Tem certificações de ouro e platina com singles como \"SK8 do Matheus\" e \"Lamentável, pt. III\"."},
  {name:"Tyler, The Creator", sub:"Hip-hop", bio:"Tyler Gregory Okonma nasceu em Los Angeles em 1991 e fundou o coletivo Odd Future no fim dos anos 2000, que também revelou Frank Ocean e Earl Sweatshirt. Começou com um rap cru e provocador em discos como \"Goblin\" e evoluiu para produções mais sofisticadas, somando jazz, funk e soul em álbuns como \"Flower Boy\", \"IGOR\" e \"Call Me If You Get Lost\" — este último vencedor do Grammy de Melhor Álbum de Rap."},
  {name:"Fleetwood Mac", sub:"Rock/Pop Rock",bio:"Fleetwood Mac é uma das bandas de rock mais influentes e bem-sucedidas da história da música. Formada em Londres em 1967, o grupo passou por profundas transformações musicais e formações de integrantes, evoluindo do blues rock britânico até se tornar um fenômeno global do pop-rock."},
  {name:"Zé Ramalho", sub:"MPB / Nordestino", bio:"José Ramalho Neto nasceu em Brejo do Cruz (PB) em 1949 e começou escrevendo versos de cordel antes de fundir rock progressivo com ritmos nordestinos como baião e embolada. Seu disco de estreia, \"Paêbiru\" (1975), com Lula Côrtes, é hoje um clássico cult da MPB. Composições como \"Admirável Gado Novo\" e \"Avôhai\" o consolidaram como uma das vozes mais marcantes da música nordestina."},
  {name:"Rita Lee", sub:"Rock / MPB", bio:"Rita Lee Jones nasceu em São Paulo em 1947 e começou nos anos 1960 no grupo Os Mutantes, um dos pilares da Tropicália. Depois formou a banda Tutti Frutti e seguiu em carreira solo, misturando rock, pop e humor irreverente. Clássicos como \"Ovelha Negra\", \"Mania de Você\" e \"Lança Perfume\" a consagraram como a rainha do rock brasileiro."},
];
/* Links dos artistas no Spotify (no Spotify: artista > ... > Compartilhar >
   Copiar link do artista). Com o link preenchido, o site busca a foto do
   artista no Spotify sozinho. Vazio = continua o ícone de microfone. */
const ARTISTAS_SPOTIFY = {
  "Froid": "",
  "Tyler, The Creator": "",
  "Fleetwood Mac": "",
  "Zé Ramalho": "",
  "Rita Lee": "",
};
const TOP_MUSICAS = [
  {title:"Lamentável, Pt. III", sub:"Froid, Cynthia Luz", spotify:"https://open.spotify.com/intl-pt/track/46h2Z0b21xC1gzluNeCiVG", bio:"\"Lamentável, Pt. III\" é uma das faixas mais marcantes do rapper Froid em parceria com Cynthia Luz, lançada em 2017 e integrante do aclamado álbum solo de estreia do artista, O Pior Disco do Ano."},
  {title:"MASSA", sub:"Tyler, The Creator", spotify:"https://open.spotify.com/intl-pt/track/2goHCrsDJaflEwQ930ef0o", bio:"Faixa de Tyler, The Creator com produção densa e groove marcante, seguindo a linha mais experimental de seus últimos trabalhos."},
  {title:"The Chain", sub:"Fleetwood Mac", spotify:"https://open.spotify.com/intl-pt/track/5e9TFTbltYBg2xThimr0rU", bio:"\"The Chain\", lançada em 1977 no aclamado álbum Rumours, é uma das faixas mais icônicas, intensas e emblemáticas do Fleetwood Mac. A música tornou-se um símbolo da própria existência do grupo: uma promessa de união inquebrável mantida no meio do caos pessoal e afetivo."},
  {title:"Chão de giz", sub:"Zé Ramalho", spotify:"https://open.spotify.com/intl-pt/track/4XYdH6H7haUCeEm9YezQ9K", bio:"\"Chão de Giz\", lançada em 1978 no álbum de estreia de Zé Ramalho, é uma das obras-primas da música popular brasileira. Conhecida por sua melodia marcante e letra altamente poética e enigmática, a canção retrata o término doloroso de um amor proibido e idealizado."},
  {title:"Lança-perfume", sub:"Rita Lee", spotify:"https://open.spotify.com/intl-pt/track/3cijWAljXxxJDco4N2aLQl", bio:"\"Lança-perfume\" foi composta por Rita Lee e Roberto de Carvalho e lançada em 1980 no álbum homônimo da cantora. A canção é um marco da música pop brasileira e combina ritmos contagiantes da disco music e da pop new wave com o espírito festivo e eufórico do Carnaval."},
];
/* "genre" é usado nos filtros da seção Álbuns Importantes — use o mesmo nome de
   gênero em vários álbuns para que eles caiam no mesmo filtro.
   "spotify": link direto do álbum (no Spotify: ... > Compartilhar > Copiar link
   do álbum). Se deixar vazio (""), o clique abre a busca do Spotify com o
   nome do álbum e do artista. */
const ALBUNS = [
  {title:"Abbey Road", artist:"The Beatles", year:"1969", genre:"Rock", why:"Último álbum gravado pela banda; consagrou o medley do lado B.", grad:"linear-gradient(135deg,#1c2440,#0b0f1c)", img:"", spotify:"https://open.spotify.com/album/2Pqkn9Dq2DFtdfkKAeqgMd"},
  {title:"The Dark Side of the Moon", artist:"Pink Floyd", year:"1973", genre:"Rock", why:"741 semanas nas paradas americanas — um recorde.", grad:"linear-gradient(135deg,#232c47,#12141c)", img:"", spotify:"https://open.spotify.com/intl-pt/album/4LH4d3cOWNNsVw41Gqt2kv"},
  {title:"Clube da Esquina", artist:"Milton Nascimento & Lô Borges", year:"1972", genre:"MPB", why:"Marco da MPB mineira e da fusão entre pop e erudito.", grad:"linear-gradient(135deg,#141b30,#060910)", img:"", spotify:"https://open.spotify.com/intl-pt/album/5risYG7klZCSLMNxB9dZhf"},
  {title:"What's Going On", artist:"Marvin Gaye", year:"1971", genre:"Soul", why:"Soul engajado que redefiniu o que um álbum podia dizer.", grad:"linear-gradient(135deg,#1c2440,#232c47)", img:"", spotify:"https://open.spotify.com/intl-pt/album/2v6ANhWhZBUKkg6pJJBs3B"},
  {title:"Thriller", artist:"Michael Jackson", year:"1982", genre:"Pop", why:"O álbum mais vendido da história, com 7 hits no top 10.", grad:"linear-gradient(135deg,#0b0f1c,#1c2440)", img:"", spotify:"https://open.spotify.com/intl-pt/album/2ANVost0y2y52ema1E9xAZ"},
  {title:"Dois", artist:"Legião Urbana", year:"1986", genre:"Rock", why:"Retrato definitivo do rock brasileiro dos anos 80.", grad:"linear-gradient(135deg,#12141c,#232c47)", img:"", spotify:"https://open.spotify.com/intl-pt/album/4OCJTpOLqSgysGY4yBCGhn"},
  {title:"Sobrevivendo no Inferno", artist:"Racionais MC's", year:"1997", genre:"Rap", why:"Marco absoluto do rap nacional e da crítica social.", grad:"linear-gradient(135deg,#060910,#141b30)", img:"", spotify:"https://open.spotify.com/intl-pt/album/1UzrzuOmZfBgXyS3pgKD10"},
  {title:"To Pimp a Butterfly", artist:"Kendrick Lamar", year:"2015", genre:"Rap", why:"Fusão de jazz, funk e rap que redefiniu o hip-hop moderno.", grad:"linear-gradient(135deg,#232c47,#0b0f1c)", img:"", spotify:"https://open.spotify.com/intl-pt/album/7ycBtnsMtyVbbwTfJwRjSP"},
  {title:"Elis & Tom", artist:"Elis Regina & Tom Jobim", year:"1974", genre:"MPB", why:"Encontro histórico entre duas vozes centrais da MPB.", grad:"linear-gradient(135deg,#141b30,#1c2440)", img:"", spotify:"https://open.spotify.com/intl-pt/album/3SE9n6EaVOJ81KA1KPLUWS"},
  {title:"Nevermind", artist:"Nirvana", year:"1991", genre:"Rock", why:"Levou o grunge ao mainstream e mudou o rock dos anos 90.", grad:"linear-gradient(135deg,#0b0f1c,#232c47)", img:"", spotify:"https://open.spotify.com/intl-pt/album/2UJcKiJxNryhL050F5Z1Fk"},
];

/* Player da semana: abra a playlist no app do Spotify > Compartilhar >
   Incorporar playlist > copie a URL de dentro de src="..." e cole abaixo. */
const SPOTIFY_PLAYLIST_EMBED_URL = "https://open.spotify.com/embed/playlist/37i9dQZF1DXcBWIGoYBM5M?utm_source=generator&theme=0";

/* Efemérides: "dia" no formato MM-DD. Quando a data de hoje bate com alguma
   entrada, o selo "HOJE NA HISTÓRIA DA MÚSICA" aparece automaticamente.
   Quando não bate com nenhuma, a faixa fica oculta (sem curiosidade do dia
   genérica). Adicione quantas entradas quiser. */
const EFEMERIDES = [
  {dia:"02-09", titulo:"Beatlemania nos EUA (1964)", texto:"Em 9 de fevereiro de 1964, os Beatles se apresentaram pela primeira vez no Ed Sullivan Show, para mais de 70 milhões de telespectadores — o pontapé da invasão britânica nos EUA."},
  {dia:"08-01", titulo:"Nasce a MTV (1981)", texto:"O canal estreou em 1º de agosto de 1981 com o clipe \"Video Killed the Radio Star\", do The Buggles, mudando para sempre a forma de consumir música."},
  {dia:"08-15", titulo:"Começa o Woodstock (1969)", texto:"Em 15 de agosto de 1969, o festival Woodstock começou em Bethel, Nova York, reunindo cerca de 400 mil pessoas e se tornando símbolo de uma geração."},
  {dia:"08-16", titulo:"Morre Elvis Presley (1977)", texto:"Em 16 de agosto de 1977, morreu Elvis Presley, o \"Rei do Rock\", aos 42 anos, em Graceland."},
  {dia:"09-18", titulo:"Morre Jimi Hendrix (1970)", texto:"Em 18 de setembro de 1970, o mundo perdeu um de seus maiores guitarristas, Jimi Hendrix, aos 27 anos."},
  {dia:"09-24", titulo:"Nevermind é lançado (1991)", texto:"Em 24 de setembro de 1991, o Nirvana lançou \"Nevermind\", álbum que levou o grunge ao mainstream mundial."},
  {dia:"11-24", titulo:"Morre Freddie Mercury (1991)", texto:"Em 24 de novembro de 1991, morreu Freddie Mercury, vocalista do Queen, um dia depois de revelar publicamente que vivia com AIDS."},
  {dia:"05-11", titulo:"Morre Bob Marley (1981)", texto:"Em 11 de maio de 1981, morreu Bob Marley, o maior nome do reggae, aos 36 anos."},
  {dia:"07-13", titulo:"Acontece o Live Aid (1985)", texto:"Em 13 de julho de 1985, o megaconcerto Live Aid uniu Londres e Filadélfia para arrecadar fundos contra a fome na Etiópia."},
  {dia:"05-26", titulo:"Sgt. Pepper's é lançado (1967)", texto:"Em 26 de maio de 1967, os Beatles lançaram no Reino Unido \"Sgt. Pepper's Lonely Hearts Club Band\", um marco na produção e na arte de capas de discos."},
];

/* Glossário: edite, adicione ou remova termos livremente. */
const GLOSSARIO = [
  {termo:"Síncope", def:"Deslocamento do acento rítmico esperado, dando \"suingue\" à música — presente do samba ao funk."},
  {termo:"Sample", def:"Trecho de uma gravação existente reaproveitado em uma nova música, técnica central no hip-hop e na música eletrônica."},
  {termo:"Groove", def:"A sensação de balanço e fluidez rítmica que faz o corpo querer se mexer junto com a música."},
  {termo:"Riff", def:"Frase musical curta e repetida, geralmente tocada na guitarra ou no baixo, que se torna a marca de uma música."},
  {termo:"Hook", def:"O trecho mais marcante e \"grudento\" de uma canção, feito para ficar na cabeça do ouvinte."},
  {termo:"Breakdown", def:"Momento da música em que a instrumentação se reduz, geralmente antes de um clímax ou virada."},
  {termo:"Cover", def:"Regravação de uma música originalmente lançada por outro artista."},
  {termo:"Mixtape", def:"Coletânea informal de faixas, tradicionalmente usada por artistas de hip-hop para lançar material fora do ciclo dos álbuns oficiais."},
];

/* Linha do tempo: cada década traz o contexto social e os gêneros que
   nasceram ou explodiram no período. Edite, adicione ou remova décadas. */
const TIMELINE = [
  {decada:"Anos 1950", titulo:"O nascimento do rock e a rádio de massa", social:"Explosão do consumo de discos e rádios entre a juventude do pós-guerra; nos EUA, tensões raciais moldam quem toca o quê e onde.", genres:["Rock and roll","Blues elétrico","Bossa nova (final da década)"]},
  {decada:"Anos 1960", titulo:"Contracultura, direitos civis e psicodelia", social:"Movimento pelos direitos civis nos EUA, contracultura hippie e ditadura militar no Brasil empurram a música para o engajamento político.", genres:["MPB","Tropicália","Rock psicodélico","Soul"]},
  {decada:"Anos 1970", titulo:"Fragmentação de cenas e o nascimento do hip-hop", social:"Crise econômica e abandono urbano no Bronx geram o hip-hop; no Brasil, a censura da ditadura empurra letras para a metáfora.", genres:["Hip-hop","Disco","Rock progressivo","Punk"]},
  {decada:"Anos 1980", titulo:"MTV, sintetizadores e o rock nacional", social:"A MTV muda o consumo de música para o visual; redemocratização no Brasil dá voz a uma nova geração de bandas de rock.", genres:["Pop eletrônico","Rock brasileiro","Reggae","Heavy metal"]},
  {decada:"Anos 1990", titulo:"Grunge, rap nacional e a era do CD", social:"Desilusão da Geração X nos EUA e crescimento da periferia como voz política no Brasil marcam a década.", genres:["Grunge","Rap nacional","R&B contemporâneo","Britpop"]},
  {decada:"Anos 2000", titulo:"A internet muda tudo", social:"Napster e o compartilhamento digital abalam a indústria fonográfica; o funk carioca ganha as ruas.", genres:["Funk carioca","Indie rock","Reggaeton","Emo"]},
  {decada:"Anos 2010", titulo:"Streaming e a globalização instantânea", social:"Spotify e redes sociais tornam qualquer gênero acessível em qualquer lugar do mundo ao mesmo tempo.", genres:["Trap","K-pop","Sertanejo universitário","EDM"]},
  {decada:"Anos 2020", titulo:"Fragmentação de nichos e viralização", social:"TikTok redefine como uma música vira hit; microgêneros nascem e se espalham globalmente em semanas.", genres:["Piseiro","Hyperpop","Drill","Afrobeats"]},
];
/* ======================================================================= */

/* ===================== ARMAZENAMENTO LOCAL (preferências deste navegador)
   Usado apenas para o tema (claro/escuro) e para lembrar que este navegador
   já votou. Esses dados NÃO precisam ser compartilhados entre visitantes,
   então ficam no localStorage do próprio navegador. Comentários e votos
   (que são compartilhados) vêm da API do Flask, acima. */
async function storageGet(key){
  try{
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  }catch(e){ return null; }
}
async function storageSet(key, value){
  try{ localStorage.setItem(key, JSON.stringify(value)); }catch(e){}
}

/* ===================== TEMA (claro/escuro) ===================== */
const THEME_KEY = 'theme-preference';
const themeToggleBtn = document.getElementById('themeToggleBtn');
const themeIconSun = document.getElementById('themeIconSun');
const themeIconMoon = document.getElementById('themeIconMoon');

function applyTheme(theme){
  document.documentElement.setAttribute('data-theme', theme);
  themeIconSun.style.display = theme === 'dark' ? 'none' : 'block';
  themeIconMoon.style.display = theme === 'dark' ? 'block' : 'none';
}
(async function initTheme(){
  const saved = await storageGet(THEME_KEY);
  const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  applyTheme(saved || (prefersDark ? 'dark' : 'light'));
})();
themeToggleBtn.addEventListener('click', async ()=>{
  const current = document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
  const next = current === 'dark' ? 'light' : 'dark';
  applyTheme(next);
  await storageSet(THEME_KEY, next);
});

function slug(str){
  return str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'')
    .replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'');
}

function initials(name){
  return name.split(" ").filter(w=>w.length>1||w===w.toUpperCase()).slice(0,2).map(w=>w[0]).join("").toUpperCase().slice(0,2);
}

/* ===================== ÍCONES PADRÃO =====================
   Ícones fixos do Font Awesome (grátis): microfone para artistas, nota
   musical para músicas, disco de vinil para álbuns. Troque a classe abaixo
   se quiser usar outro ícone em cada caso. */
const ARTIST_ICON = 'fa-microphone';
const SONG_ICON = 'fa-music';
const ALBUM_ICON = 'fa-record-vinyl';

function avatarHtml(name, img, iconClass){
  const imgTag = img ? `<img class="avatar-img" src="${img}" alt="${name}" loading="lazy">` : '';
  const iconTag = img ? '' : `<i class="fa-solid ${iconClass} avatar-icon"></i>`;
  return `<span class="avatar">${imgTag}${iconTag}</span>`;
}
function albumCoverHtml(al){
  const imgTag = al.img ? `<img class="avatar-img" src="${al.img}" alt="Capa de ${al.title}" loading="lazy">` : '';
  const iconTag = al.img ? '' : `<i class="fa-solid ${ALBUM_ICON} album-icon"></i>`;
  return `<div class="album-cover" style="background:${al.grad}">${imgTag}${iconTag}${al.img ? '' : `<span class="mono">${al.title}</span>`}</div>`;
}

// Acordeão genérico para as listas de artistas/músicas da semana (clique = mostra bio)
function initRankAccordion(container){
  container.querySelectorAll('.rank-row').forEach(row=>{
    row.addEventListener('click', ()=>{
      const item = row.closest('.rank-item');
      const panel = item.querySelector('.rank-bio-panel');
      const isOpen = item.classList.contains('open');
      if(isOpen){
        item.classList.remove('open');
        panel.style.maxHeight = null;
      } else {
        item.classList.add('open');
        panel.style.maxHeight = panel.scrollHeight + 'px';
      }
    });
  });
}

// Render Top Artistas (com bio expansível)
const artistList = document.getElementById('artistList');
TOP_ARTISTAS.forEach((a,i)=>{
  artistList.insertAdjacentHTML('beforeend', `
    <div class="rank-item">
      <div class="rank-row">
        <span class="rank-num">${i+1}</span>
        ${avatarHtml(a.name, a.img, ARTIST_ICON)}
        <div><div class="rank-name">${a.name}</div><div class="rank-sub">${a.sub}</div></div>
        <span class="rank-chevron"></span>
      </div>
      <div class="rank-bio-panel"><div class="rank-bio-inner">${a.bio}</div></div>
    </div>`);
});
initRankAccordion(artistList);

/* ===================== PRÉVIAS DE ÁUDIO (Top músicas) =====================
   Cada música tem um botão ▶ que abre o player do Spotify logo embaixo dela
   (só um player aberto por vez). */
function spotifyTrackId(musica){
  // Extrai o ID da música a partir do link (open.spotify.com/track/ID?...)
  const achado = (musica.spotify || '').match(/track\/([A-Za-z0-9]+)/);
  return achado ? achado[1] : null;
}

function resetarBotaoPlay(btn){
  if(!btn) return;
  btn.classList.remove('playing');
  btn.querySelector('i').className = 'fa-solid fa-play';
}

let playerAberto = null;
function fecharPlayerSpotify(){
  if(!playerAberto) return;
  playerAberto.box.classList.remove('open');
  playerAberto.box.innerHTML = ''; // remove o iframe, o que também para a música
  resetarBotaoPlay(playerAberto.btn);
  playerAberto = null;
}

// Render Top Músicas (com bio expansível e player do Spotify)
const songList = document.getElementById('songList');
TOP_MUSICAS.forEach((m,i)=>{
  songList.insertAdjacentHTML('beforeend', `
    <div class="rank-item">
      <div class="rank-row">
        ${avatarHtml(m.sub, m.img, SONG_ICON)}
        <div><div class="rank-name">${m.title}</div><div class="rank-sub">${m.sub}</div></div>
        <button type="button" class="play-btn" id="play-${i}" aria-label="Ouvir ${m.title} no Spotify" title="Ouvir no Spotify">
          <i class="fa-solid fa-play"></i>
        </button>
        <span class="rank-chevron"></span>
      </div>
      <div class="spotify-player" id="sp-${i}"></div>
      <div class="rank-bio-panel"><div class="rank-bio-inner">${m.bio}</div></div>
    </div>`);
});
initRankAccordion(songList);

TOP_MUSICAS.forEach((m,i)=>{
  const btn = document.getElementById(`play-${i}`);
  const box = document.getElementById(`sp-${i}`);
  const idSpotify = spotifyTrackId(m);

  btn.addEventListener('click', e=>{
    e.stopPropagation(); // não abre/fecha a bio ao clicar no play

    // Sem link da música: abre a busca do Spotify em outra aba
    if(!idSpotify){
      const busca = encodeURIComponent(`${m.title} ${m.sub}`);
      window.open(`https://open.spotify.com/search/${busca}/tracks`, '_blank', 'noopener');
      return;
    }

    // Com link: abre/fecha o player do Spotify embaixo da música
    if(playerAberto && playerAberto.btn === btn){ fecharPlayerSpotify(); return; }
    fecharPlayerSpotify();
    box.innerHTML = `<iframe src="https://open.spotify.com/embed/track/${idSpotify}?utm_source=generator"
      width="100%" height="80" frameborder="0" title="Spotify: ${m.title}"
      allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe>`;
    box.classList.add('open');
    btn.classList.add('playing');
    btn.querySelector('i').className = 'fa-solid fa-xmark';
    playerAberto = {btn, box};
  });
});

// Render Álbuns (agora dentro da aba "Linha do Tempo")
// Cada álbum é um link que abre no Spotify (link direto, se preenchido em
// "spotify", ou a busca do Spotify com título + artista).
function spotifyAlbumUrl(al){
  if(al.spotify) return al.spotify;
  return `https://open.spotify.com/search/${encodeURIComponent(al.title + ' ' + al.artist)}/albums`;
}
const albumGrid = document.getElementById('albumGrid');
ALBUNS.forEach(al=>{
  albumGrid.insertAdjacentHTML('beforeend', `
    <a class="album-card" href="${spotifyAlbumUrl(al)}" target="_blank" rel="noopener" aria-label="Ouvir ${al.title}, de ${al.artist}, no Spotify">
      ${albumCoverHtml(al)}
      <h4>${al.title}</h4>
      <div class="artist">${al.artist}</div>
      <div class="yr">${al.year}</div>
      <div class="why">${al.why}</div>
      <span class="album-listen"><i class="fa-brands fa-spotify"></i> Ouvir no Spotify</span>
    </a>`);
});

// Render Glossário (dentro da aba "Sobre Música")
const glossAccordion = document.getElementById('glossAccordion');
GLOSSARIO.forEach((g,i)=>{
  glossAccordion.insertAdjacentHTML('beforeend', `
    <div class="acc-item" id="${i===0 ? 'gloss-1' : ''}">
      <button class="acc-trigger"><span class="num">${String(i+1).padStart(2,'0')}</span><span class="t">${g.termo}</span><span class="plus"></span></button>
      <div class="acc-panel"><div class="acc-panel-inner">${g.def}</div></div>
    </div>`);
});

// Render player do Spotify
document.getElementById('spotifyEmbed').innerHTML =
  `<iframe src="${SPOTIFY_PLAYLIST_EMBED_URL}" width="100%" height="352" frameborder="0"
    allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe>`;

// Render efeméride ("Hoje na história da música") — só aparece se houver
// uma entrada correspondente à data de hoje; caso contrário fica oculta.
(function renderEfemeride(){
  const now = new Date();
  const todayKey = String(now.getMonth()+1).padStart(2,'0') + '-' + String(now.getDate()).padStart(2,'0');
  const item = EFEMERIDES.find(e => e.dia === todayKey);
  const band = document.getElementById('efemerideBand');
  if(!item){
    band.style.display = 'none';
    return;
  }
  band.style.display = 'flex';
  band.innerHTML = `
    <svg class="ef-icon" viewBox="0 0 24 24" fill="none" stroke="#f6f3ec" stroke-width="1.6"><circle cx="12" cy="13" r="8"/><path d="M12 9v4l3 2M9 2h6M12 2v3"/></svg>
    <div>
      <span class="ef-label">HOJE NA HISTÓRIA DA MÚSICA</span>
      <h4>${item.titulo}</h4>
      <p>${item.texto}</p>
    </div>`;
})();

// Nav = abas exclusivas: apenas a seção clicada aparece (a tela inicial some das outras abas)
const navButtons = document.querySelectorAll('.main-nav button, .nav-link');
const tabSections = document.querySelectorAll('.tab-section');
const heroSection = document.getElementById('heroSection');
const navMap = {};
document.querySelectorAll('.main-nav button').forEach(b=>navMap[b.dataset.target]=b);

function setActiveTab(id){
  fecharPlayerSpotify(); // fecha o player do Spotify ao trocar de aba
  tabSections.forEach(s=>s.classList.toggle('tab-open', s.id===id));
  Object.values(navMap).forEach(b=>b.classList.toggle('active', b.dataset.target===id));
  if(heroSection) heroSection.style.display = (id==='sobre') ? '' : 'none';
}
function goToTab(id){
  setActiveTab(id);
  document.getElementById(id).scrollIntoView({behavior:'smooth', block:'start'});
}
navButtons.forEach(btn=>{
  btn.addEventListener('click', e=>{
    e.preventDefault();
    goToTab(btn.dataset.target);
  });
});

// Cards "Sobre Música": cada card abre o seu conteúdo (clicar de novo fecha).
// No celular o conteúdo aparece logo abaixo do card clicado; no computador,
// abaixo da grade de cards.
const aboutCards = document.querySelectorAll('.about-card');
const isMobileView = () => window.matchMedia('(max-width: 768px)').matches;

// Guarda a posição original de cada painel, para devolvê-lo ao fechar
const paneHome = new Map();
document.querySelectorAll('.pane').forEach(p=>{
  const marker = document.createComment('pane-home');
  p.before(marker);
  paneHome.set(p, marker);
});
function returnPaneHome(p){
  const marker = paneHome.get(p);
  if(marker && marker.nextSibling !== p) marker.after(p);
}

function closeAboutPanes(){
  document.querySelectorAll('.pane').forEach(p=>{
    p.classList.remove('active');
    returnPaneHome(p);
  });
  aboutCards.forEach(c=>c.classList.remove('active'));
}
function switchAboutTab(name){
  document.querySelectorAll('.pane').forEach(p=>p.classList.toggle('active', p.id==='pane-'+name));
}

aboutCards.forEach(card=>{
  card.addEventListener('click', ()=>{
    const targetId = card.dataset.open;
    const pane = targetId.startsWith('genero') ? 'genero' : targetId.startsWith('inst') ? 'inst' : targetId.startsWith('gloss') ? 'gloss' : 'cur';
    const paneEl = document.getElementById('pane-'+pane);

    // clicou no card que já está aberto: fecha
    if(paneEl.classList.contains('active')){
      closeAboutPanes();
      return;
    }

    closeAboutPanes();
    if(isMobileView()) card.after(paneEl);   // celular: logo abaixo do card
    switchAboutTab(pane);
    card.classList.add('active');

    // abre o primeiro item do painel
    const item = document.getElementById(targetId);
    if(item && !item.classList.contains('open')){
      item.querySelector('.acc-trigger').click();
    }
    requestAnimationFrame(()=>{
      (isMobileView() ? card : paneEl).scrollIntoView({behavior:'smooth', block:'start'});
    });
  });
});

// Accordion
document.querySelectorAll('.acc-trigger').forEach(trigger=>{
  trigger.addEventListener('click', ()=>{
    const item = trigger.closest('.acc-item');
    const panel = item.querySelector('.acc-panel');
    const isOpen = item.classList.contains('open');
    item.closest('.accordion').querySelectorAll('.acc-item.open').forEach(other=>{
      other.classList.remove('open');
      other.querySelector('.acc-panel').style.maxHeight = null;
    });
    if(!isOpen){
      item.classList.add('open');
      panel.style.maxHeight = panel.scrollHeight + 'px';
    }
  });
});

/* ===================== LINHA DO TEMPO ===================== */
const timelineTrack = document.getElementById('timelineTrack');
const timelineDetail = document.getElementById('timelineDetail');

function renderTimelineDetail(index){
  const t = TIMELINE[index];
  timelineDetail.innerHTML = `
    <span class="tl-decade">${t.decada.toUpperCase()}</span>
    <h3>${t.titulo}</h3>
    <div class="tl-block">
      <span class="tl-block-label">CONTEXTO SOCIAL</span>
      <p>${t.social}</p>
    </div>
    <div class="tl-block">
      <span class="tl-block-label">GÊNEROS DA ÉPOCA</span>
      <div class="timeline-genres">${t.genres.map(g=>`<span class="timeline-genre-chip">${g}</span>`).join('')}</div>
    </div>`;
}
TIMELINE.forEach((t,i)=>{
  const btn = document.createElement('button');
  btn.className = 'timeline-dot-btn' + (i===0 ? ' active' : '');
  btn.textContent = t.decada;
  btn.addEventListener('click', ()=>{
    timelineTrack.querySelectorAll('.timeline-dot-btn').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    renderTimelineDetail(i);
  });
  timelineTrack.appendChild(btn);
});
renderTimelineDetail(0);

/* ===================== VOTAÇÃO (dados vêm da API do Flask) =====================
   "tipo" precisa bater com o que é gravado no backend ('artista' ou 'musica').
   "id" é só um identificador interno usado no HTML/CSS deste front-end.
   "name" é o valor gravado como item_nome na tabela `votos` — como a coluna
   item_nome é UNIQUE em toda a tabela, não repita o mesmo nome entre artistas
   e músicas. */
const VOTE_CONFIGS = {
  artista: {
    key: 'votes-artista-semana',
    tipo: 'artista',
    title: 'VOTE NO ARTISTA DA SEMANA',
    options: [
      {id:'froid', name:'Froid', sub:'Hip-hop', img:''},
      {id:'tyler', name:'Tyler, The Creator', sub:'Hip-hop', img:''},
      {id:'mac', name:'Fleetwood Mac', sub:'Rock/ Pop rock', img:''},
      {id:'zeramalho', name:'Zé Ramalho', sub:'MPB / Nordestino', img:''},
      {id:'lee', name:'Rita Lee', sub:'Rock / MPB', img:''},
    ],
  },
  musica: {
    key: 'votes-musica-semana',
    tipo: 'musica',
    title: 'VOTE NA MÚSICA DA SEMANA',
    options: [
      {id:'garota', name:'Lamentável, Pt. III', sub:'Froid, Cynthia Luz', img:''},
      {id:'massa', name:'MASSA', sub:'Tyler, The Creator', img:''},
      {id:'chain', name:'The Chain', sub:'Fleetwood Mac', img:''},
      {id:'giz', name:'Chão de giz', sub:'Zé Ramalho', img:''},
      {id:'negra', name:'Lança-perfume', sub:'Rita Lee', img:''},
    ],
  }
};

// Busca as contagens de votos direto da API para um dado "tipo" ('artista'/'musica')
async function fetchVoteCounts(cfg){
  const counts = {};
  cfg.options.forEach(o=>{ counts[o.id] = 0; });
  const votosData = await apiGet('/votos');
  if(votosData){
    votosData.filter(v=>v.tipo===cfg.tipo).forEach(v=>{
      const opt = cfg.options.find(o=>o.name===v.item_nome);
      if(opt) counts[opt.id] = v.total;
    });
  }
  return counts;
}

async function renderVoteCard(containerId, cfg, votedKey){
  const container = document.getElementById(containerId);
  let counts = await fetchVoteCounts(cfg);
  let voted = await storageGet(votedKey);
  let pending = null;

  // cfg.tipo === 'artista' identifica o card de votação em ARTISTAS;
  // qualquer outro valor (ex: 'musica') identifica o card de votação em MÚSICAS.
  const cardIcon = cfg.tipo === 'artista' ? ARTIST_ICON : SONG_ICON;
  const optionsHtml = cfg.options.map(o=>`
    <label class="vote-option" data-id="${o.id}">
      <span class="vote-radio"></span>
      ${avatarHtml(o.name, o.img, cardIcon)}
      <span class="vo-text"><span class="vo-name">${o.name}</span><span class="vo-sub">${o.sub}</span></span>
      <span class="vo-track-wrap">
        <span class="vote-bar-track"><span class="vote-bar-fill" id="${containerId}-fill-${o.id}"></span></span>
        <span class="vote-pct" id="${containerId}-pct-${o.id}">0%</span>
      </span>
    </label>`).join('');

  container.innerHTML = `
    <h3>${cfg.title}</h3>
    <div class="vote-options">${optionsHtml}</div>
    <button class="vote-btn" id="${containerId}-submit">Votar</button>
  `;

  function updateBars(){
    const total = cfg.options.reduce((s,o)=>s+(counts[o.id]||0),0);
    const maior = Math.max(...cfg.options.map(o=>counts[o.id]||0));
    cfg.options.forEach(o=>{
      const pct = total ? Math.round((counts[o.id]/total)*100) : 0;
      const el = container.querySelector(`.vote-option[data-id="${o.id}"]`);
      if(el) el.classList.toggle('lider', total > 0 && (counts[o.id]||0) === maior);
      document.getElementById(`${containerId}-fill-${o.id}`).style.width = pct+'%';
      document.getElementById(`${containerId}-pct-${o.id}`).textContent = pct+'%';
    });
  }
  function setSelected(id){
    container.querySelectorAll('.vote-option').forEach(el=>{
      el.classList.toggle('selected', el.dataset.id===id);
    });
  }
  const submitBtn = document.getElementById(`${containerId}-submit`);

  function lockAsVoted(){
    container.querySelectorAll('.vote-option').forEach(el=>{
      el.classList.add('voted');
      el.style.cursor = 'default';
    });
    container.classList.remove('results-hidden');
    setSelected(voted);
    submitBtn.disabled = true;
    submitBtn.textContent = 'Seu voto foi registrado ✓';
  }

  updateBars();

  // Atualiza as porcentagens sozinho, para refletir votos de outras pessoas
  setInterval(async ()=>{
    if(document.hidden) return;
    counts = await fetchVoteCounts(cfg);
    updateBars();
  }, 10000);

  if(voted){
    lockAsVoted();
  } else {
    container.classList.add('results-hidden');
    submitBtn.textContent = 'Votar';
  }

  container.querySelectorAll('.vote-option').forEach(el=>{
    el.addEventListener('click', ()=>{
      if(voted) return;
      pending = el.dataset.id;
      setSelected(pending);
    });
  });

  submitBtn.addEventListener('click', async ()=>{
    if(voted || !pending) return;
    const opt = cfg.options.find(o=>o.id===pending);
    submitBtn.disabled = true;
    submitBtn.textContent = 'Enviando...';
    const result = await apiPost('/votos', {tipo: cfg.tipo, item_nome: opt.name});
    if(result && result.success){
      counts[pending] = (counts[pending] || 0) + 1;
      voted = pending;
      await storageSet(votedKey, voted);
      updateBars();
      lockAsVoted();
    } else {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Votar';
      alert('Não foi possível registrar seu voto agora. Verifique se o backend Flask está rodando e tente novamente.');
    }
  });
}

/* ===================== CAPAS E FOTOS VIA SPOTIFY (oEmbed) =====================
   Em vez de hospedar imagens copiadas, o site pede a imagem ao endpoint
   público oEmbed do Spotify, a partir do link (música, álbum ou artista).
   As imagens continuam hospedadas no Spotify e cada item já leva ao Spotify.
   Sem link, ou se a busca falhar, o ícone padrão continua aparecendo.
   Se você preencher "img" manualmente em algum item, ele tem prioridade. */
const thumbCache = {};
function spotifyThumb(url){
  if(!url) return Promise.resolve('');
  const limpo = url.split('?')[0];
  if(!thumbCache[limpo]){
    thumbCache[limpo] = fetch('https://open.spotify.com/oembed?url=' + encodeURIComponent(limpo))
      .then(r => r.ok ? r.json() : null)
      .then(d => (d && d.thumbnail_url) || '')
      .catch(() => '');
  }
  return thumbCache[limpo];
}
function trocarAvatar(avatarEl, src, alt){
  if(!avatarEl || !src) return;
  avatarEl.innerHTML = `<img class="avatar-img" src="${src}" alt="${alt}" loading="lazy">`;
}
function trocarCapaAlbum(coverEl, src, alt){
  if(!coverEl || !src) return;
  const icone = coverEl.querySelector('.album-icon');
  if(icone) icone.remove();
  const titulo = coverEl.querySelector('.mono'); // texto do título em volta da capa
  if(titulo) titulo.remove();
  // a capa passa a preencher o quadrado inteiro, sem margem
  coverEl.classList.add('tem-capa');
  coverEl.style.position = 'relative';
  coverEl.style.padding = '0';
  coverEl.style.overflow = 'hidden';
  coverEl.insertAdjacentHTML('afterbegin',
    `<img src="${src}" alt="${alt}" loading="lazy" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;border-radius:inherit;">`);
}

const imagensPorNome = {}; // "artista:Nome" / "musica:Título" -> URL da imagem

async function carregarImagensSpotify(){
  const tarefas = [];

  TOP_ARTISTAS.forEach((a,i)=>{
    if(a.img) return;
    tarefas.push(spotifyThumb(ARTISTAS_SPOTIFY[a.name]).then(src=>{
      if(!src) return;
      imagensPorNome['artista:' + a.name] = src;
      trocarAvatar(artistList.querySelectorAll('.rank-item')[i].querySelector('.avatar'), src, a.name);
    }));
  });

  TOP_MUSICAS.forEach((m,i)=>{
    if(m.img) return;
    tarefas.push(spotifyThumb(m.spotify).then(src=>{
      if(!src) return;
      imagensPorNome['musica:' + m.title] = src;
      trocarAvatar(songList.querySelectorAll('.rank-item')[i].querySelector('.avatar'), src, m.title);
    }));
  });

  ALBUNS.forEach((al,i)=>{
    if(al.img) return;
    tarefas.push(spotifyThumb(al.spotify).then(src=>{
      trocarCapaAlbum(albumGrid.querySelectorAll('.album-card')[i].querySelector('.album-cover'), src, 'Capa de ' + al.title);
    }));
  });

  await Promise.all(tarefas);
}

// Reaproveita as mesmas imagens nos cards de votação (os nomes são os mesmos das listas)
function aplicarImagensNaVotacao(){
  [['voteArtista', VOTE_CONFIGS.artista, 'artista:'], ['voteMusica', VOTE_CONFIGS.musica, 'musica:']].forEach(([id, cfg, prefixo])=>{
    cfg.options.forEach(o=>{
      const el = document.querySelector(`#${id} .vote-option[data-id="${o.id}"] .avatar`);
      trocarAvatar(el, imagensPorNome[prefixo + o.name], o.name);
    });
  });
}

Promise.all([
  renderVoteCard('voteArtista', VOTE_CONFIGS.artista, 'user-voted-artista'),
  renderVoteCard('voteMusica', VOTE_CONFIGS.musica, 'user-voted-musica'),
  carregarImagensSpotify(),
]).then(aplicarImagensNaVotacao);

/* ===================== COMENTÁRIOS (via API do Flask) ===================== */
const commentList = document.getElementById('commentList');

function formatCommentDate(sqlTimestamp){
  if(!sqlTimestamp) return '';
  // O SQLite grava algo como "2026-09-12 14:30:00"; convertemos para exibir
  // no formato brasileiro.
  const d = new Date(sqlTimestamp.replace(' ', 'T'));
  if(isNaN(d.getTime())) return sqlTimestamp;
  return d.toLocaleDateString('pt-BR', {day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit'});
}

async function loadComments(){
  const comentarios = await apiGet('/comentarios');
  commentList.innerHTML = '';
  if(!comentarios){
    commentList.innerHTML = '<li class="c-text">Não foi possível carregar os comentários. Verifique se o backend Flask está rodando.</li>';
    return;
  }
  // A API já retorna em ordem do mais recente para o mais antigo.
  comentarios.forEach(c=>{
    commentList.insertAdjacentHTML('beforeend', `
      <li>
        <div class="c-head"><span class="c-name">${escapeHtml(c.nome)}</span></div>
        <div class="c-text">${escapeHtml(c.texto)}</div>
      </li>`);
  });
}
function escapeHtml(str){
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
loadComments();

document.getElementById('commentForm').addEventListener('submit', async e=>{
  e.preventDefault();
  const textEl = document.getElementById('commentText');
  const nameEl = document.getElementById('commentName');
  const texto = textEl.value.trim();
  if(!texto) return;
  const nome = nameEl.value.trim() || 'Anônimo';

  const submitBtn = e.target.querySelector('button[type="submit"]');
  submitBtn.disabled = true;

  const result = await apiPost('/comentarios', {nome, texto});
  submitBtn.disabled = false;

  if(result && result.success){
    textEl.value = '';
    nameEl.value = '';
    loadComments();
  } else {
    alert('Não foi possível enviar seu comentário agora. Verifique se o backend Flask está rodando e tente novamente.');
  }
});