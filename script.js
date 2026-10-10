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
   o texto toda semana junto com o resto dos dados. ======================== */
const TOP_ARTISTAS = [
  {name:"Froid", sub:"Hip-hop", img:"", bio:"Renato Alves Menezes Barreto, o Froid, nasceu em Belo Horizonte (MG) em 1993 e começou a carreira em Brasília no grupo Um Barril de Rap, ao lado de Sampa e Yank, ganhando notoriedade nas batalhas de rima da capital. Solo desde 2017, transita entre rap, trap e batidas mais melódicas, com letras que misturam crítica social e reflexão pessoal — traço marcante desde o hit \"Pseudosocial\". Tem certificações de ouro e platina com singles como \"SK8 do Matheus\" e \"Lamentável, pt. III\"."},
  {name:"Dominic Fike", sub:"Pop/Alternativo", img:"", bio:"Nascido em Naples, na Flórida, em 1995, Dominic Fike começou postando músicas no SoundCloud antes de assinar com a Columbia Records em 2018. Seu som mistura pop, rock alternativo, hip-hop e R&B, com letras confessionais sobre identidade e relacionamentos. Ficou conhecido mundialmente com \"3 Nights\" e também construiu carreira como ator, estrelando a série \"Euphoria\"."},
  {name:"Tyler, The Creator", sub:"Hip-hop", img:"", bio:"Tyler Gregory Okonma nasceu em Los Angeles em 1991 e fundou o coletivo Odd Future no fim dos anos 2000, que também revelou Frank Ocean e Earl Sweatshirt. Começou com um rap cru e provocador em discos como \"Goblin\" e evoluiu para produções mais sofisticadas, somando jazz, funk e soul em álbuns como \"Flower Boy\", \"IGOR\" e \"Call Me If You Get Lost\" — este último vencedor do Grammy de Melhor Álbum de Rap."},
  {name:"Zé Ramalho", sub:"MPB / Nordestino", img:"", bio:"José Ramalho Neto nasceu em Brejo do Cruz (PB) em 1949 e começou escrevendo versos de cordel antes de fundir rock progressivo com ritmos nordestinos como baião e embolada. Seu disco de estreia, \"Paêbiru\" (1975), com Lula Côrtes, é hoje um clássico cult da MPB. Composições como \"Admirável Gado Novo\" e \"Avôhai\" o consolidaram como uma das vozes mais marcantes da música nordestina."},
  {name:"Alceu Valença", sub:"MPB / Frevo", img:"", bio:"Nascido em São Bento do Una (PE) em 1946, Alceu Valença cresceu cercado de violeiros e poetas de cordel e subiu aos palcos ainda criança cantando frevo. Sua carreira funde rock com frevo, coco, maracatu e forró, antecipando em décadas a estética que o manguebeat popularizaria em Pernambuco. Hits como \"Anunciação\" e \"La Belle de Jour\" o tornaram um dos maiores nomes da música nordestina."},
];
const TOP_MUSICAS = [
  {title:"Inverno Cigano", sub:"Froid", img:"", bio:"Faixa que mostra a fase mais introspectiva de Froid, equilibrando rap e melodia em versos sobre amadurecimento e passagem do tempo."},
  {title:"How Much Is Weed", sub:"Dominic Fike", img:"", bio:"Single que mistura groove pop-rock com letra bem-humorada e confessional, típica do estilo despojado de Dominic Fike."},
  {title:"MASSA", sub:"Tyler, The Creator", img:"", bio:"Faixa de Tyler, The Creator com produção densa e groove marcante, seguindo a linha mais experimental de seus últimos trabalhos."},
  {title:"Vila do Sossego", sub:"Zé Ramalho", img:"", bio:"Composição que carrega a poesia nordestina característica de Zé Ramalho, com imagens do sertão e da vida simples do interior."},
  {title:"Girassol", sub:"Alceu Valença", img:"", bio:"Uma das canções que reforça a fusão de forró e pop romântico que marca a fase mais popular da carreira de Alceu Valença."},
];
const RECOMENDACOES = [
  {lead:"Se você curte ", strong:"Outkast", rest:", que tal JID?"},
  {lead:"Se você curte ", strong:"rap consciente", rest:", que tal Sabotage?"},
  {lead:"Se você curte ", strong:"MPB clássica", rest:", que tal Chico Buarque?"},
];
/* "genre" é usado nos filtros da seção Álbuns Importantes — use o mesmo nome de
   gênero em vários álbuns para que eles caiam no mesmo filtro. */
const ALBUNS = [
  {title:"Abbey Road", artist:"The Beatles", year:"1969", genre:"Rock", why:"Último álbum gravado pela banda; consagrou o medley do lado B.", grad:"linear-gradient(135deg,#1c2440,#0b0f1c)", img:""},
  {title:"The Dark Side of the Moon", artist:"Pink Floyd", year:"1973", genre:"Rock", why:"741 semanas nas paradas americanas — um recorde.", grad:"linear-gradient(135deg,#232c47,#12141c)", img:""},
  {title:"Clube da Esquina", artist:"Milton Nascimento & Lô Borges", year:"1972", genre:"MPB", why:"Marco da MPB mineira e da fusão entre pop e erudito.", grad:"linear-gradient(135deg,#141b30,#060910)", img:""},
  {title:"What's Going On", artist:"Marvin Gaye", year:"1971", genre:"Soul", why:"Soul engajado que redefiniu o que um álbum podia dizer.", grad:"linear-gradient(135deg,#1c2440,#232c47)", img:""},
  {title:"Thriller", artist:"Michael Jackson", year:"1982", genre:"Pop", why:"O álbum mais vendido da história, com 7 hits no top 10.", grad:"linear-gradient(135deg,#0b0f1c,#1c2440)", img:""},
  {title:"Dois", artist:"Legião Urbana", year:"1986", genre:"Rock", why:"Retrato definitivo do rock brasileiro dos anos 80.", grad:"linear-gradient(135deg,#12141c,#232c47)", img:""},
  {title:"Sobrevivendo no Inferno", artist:"Racionais MC's", year:"1997", genre:"Rap", why:"Marco absoluto do rap nacional e da crítica social.", grad:"linear-gradient(135deg,#060910,#141b30)", img:""},
  {title:"To Pimp a Butterfly", artist:"Kendrick Lamar", year:"2015", genre:"Rap", why:"Fusão de jazz, funk e rap que redefiniu o hip-hop moderno.", grad:"linear-gradient(135deg,#232c47,#0b0f1c)", img:""},
  {title:"Elis & Tom", artist:"Elis Regina & Tom Jobim", year:"1974", genre:"MPB", why:"Encontro histórico entre duas vozes centrais da MPB.", grad:"linear-gradient(135deg,#141b30,#1c2440)", img:""},
  {title:"Nevermind", artist:"Nirvana", year:"1991", genre:"Rock", why:"Levou o grunge ao mainstream e mudou o rock dos anos 90.", grad:"linear-gradient(135deg,#0b0f1c,#232c47)", img:""},
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

/* Onde nasceu esse som: cada entrada é uma cidade onde um gênero nasceu ou
   ganhou forma. "lat" e "lon" são a latitude e longitude reais da cidade —
   é o que posiciona o pino no mapa automaticamente. Para adicionar uma nova
   cidade, basta buscar as coordenadas dela (ex: "latitude longitude Recife")
   e criar uma nova entrada no mesmo formato. */
const ORIGENS = [
  {cidade:"Nova Orleans, EUA", genero:"Jazz", ano:"Início do séc. XX", texto:"Na mistura de blues, ragtime e bandas militares das ruas e bordéis da cidade, nasceu a improvisação e a síncope que definem o jazz até hoje.", lat:29.95, lon:-90.07},
  {cidade:"Bronx, Nova York, EUA", genero:"Hip-hop", ano:"Anos 1970", texto:"Em festas de rua e prédios comunitários do Bronx, DJs e MCs criaram um novo jeito de fazer música em cima dos breaks de discos de funk e soul.", lat:40.85, lon:-73.87},
  {cidade:"Rio de Janeiro, Brasil", genero:"Samba", ano:"Início do séc. XX", texto:"Com raízes africanas trazidas por migrantes baianos, o samba nasceu nos morros cariocas e se tornou um dos símbolos da identidade musical brasileira.", lat:-22.91, lon:-43.17},
  {cidade:"Rio de Janeiro, Brasil", genero:"Bossa Nova", ano:"Final dos anos 1950", texto:"Nascida na Zona Sul carioca, principalmente em Copacabana e Ipanema, a Bossa Nova trouxe um canto mais intimista, quase falado, e harmonias sofisticadas inspiradas no jazz, unidas à leveza do violão do samba.", lat:-22.97, lon:-43.19},
  {cidade:"Recife, Brasil", genero:"Manguebeat", ano:"Anos 1990", texto:"Chico Science e a Nação Zumbi fundiram o maracatu de terreiro com rock e hip-hop, criando um movimento que colocou Pernambuco no mapa musical mundial.", lat:-8.05, lon:-34.90},
  {cidade:"Kingston, Jamaica", genero:"Reggae", ano:"Anos 1960", texto:"Do ska e do rocksteady jamaicanos surgiu o reggae, ritmo mais lento e pesado que virou voz de resistência e espiritualidade rastafári.", lat:17.97, lon:-76.79},
  {cidade:"Kingston, Jamaica", genero:"Dub", ano:"Final dos anos 1960 / início dos 1970", texto:"Nos estúdios de gravação de Kingston, engenheiros de som começaram a retirar as vozes das faixas originais e aplicar eco, reverb e cortes repentinos, criando uma atmosfera psicodélica que deu origem aos remixes modernos.", lat:18.02, lon:-76.83},
  {cidade:"Detroit, EUA", genero:"Techno", ano:"Anos 1980", texto:"Em meio ao declínio industrial da cidade, jovens produtores negros criaram batidas eletrônicas futuristas que deram origem ao techno.", lat:42.33, lon:-83.05},
  {cidade:"Chicago, EUA", genero:"House", ano:"Anos 1980", texto:"Em clubes underground como o Warehouse, DJs criaram o house: batidas eletrônicas repetitivas feitas para dançar a noite inteira.", lat:41.88, lon:-87.63},
  {cidade:"Salvador, Brasil", genero:"Axé", ano:"Anos 1980", texto:"A fusão de ritmos afro-baianos com pop, reggae e frevo nos trios elétricos do Carnaval deu origem ao axé music.", lat:-12.97, lon:-38.50},
  {cidade:"Seattle, EUA", genero:"Grunge", ano:"Final dos anos 1980 / início dos 1990", texto:"Combinando a crueza do punk rock com o peso do heavy metal, o grunge nasceu em Seattle com guitarras distorcidas e letras melancólicas, revelando bandas como Nirvana, Pearl Jam e Soundgarden.", lat:47.61, lon:-122.33},
  {cidade:"Sevilha (Andaluzia), Espanha", genero:"Flamenco", ano:"Séc. XVIII–XIX", texto:"No sul da Espanha, tradições ciganas, mouriscas, judaico-sefarditas e andaluzas se fundiram para criar o flamenco, com seu canto intenso, o violão complexo e a dança cheia de expressão.", lat:37.39, lon:-5.99},
  {cidade:"Nashville, EUA", genero:"Country", ano:"Séc. XX", texto:"Com raízes na música folclórica dos Apalaches, Nashville se consolidou como a capital comercial do country, transformando violão, banjo e narrativas cotidianas em uma indústria cultural mundial.", lat:36.16, lon:-86.78},
  {cidade:"Seul, Coreia do Sul", genero:"K-pop", ano:"Anos 1990–2000", texto:"Nos estúdios e agências de entretenimento de Seul, o K-pop combinou pop ocidental, hip-hop, R&B e música eletrônica com superprodução visual, coreografias complexas e forte conexão com os fãs.", lat:37.57, lon:126.98},
  {cidade:"Lagos, Nigéria", genero:"Afrobeats", ano:"Anos 1960–1970", texto:"Lendas como Fela Kuti misturaram o highlife ganês e o fuji nigeriano com jazz americano, funk e cantos em iorubá e pidgin, criando batidas contagiantes que deram origem ao Afrobeats.", lat:6.52, lon:3.38},
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
  return `<div class="album-cover" style="background:${al.grad}">${imgTag}${iconTag}<span class="mono">${al.title}</span></div>`;
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

// Render Top Músicas (com bio expansível)
const songList = document.getElementById('songList');
TOP_MUSICAS.forEach(m=>{
  songList.insertAdjacentHTML('beforeend', `
    <div class="rank-item">
      <div class="rank-row">
        ${avatarHtml(m.sub, m.img, SONG_ICON)}
        <div><div class="rank-name">${m.title}</div><div class="rank-sub">${m.sub}</div></div>
        <span class="rank-chevron"></span>
      </div>
      <div class="rank-bio-panel"><div class="rank-bio-inner">${m.bio}</div></div>
    </div>`);
});
initRankAccordion(songList);

// Render Recomendações
const recList = document.getElementById('recList');
RECOMENDACOES.forEach(r=>{
  recList.insertAdjacentHTML('beforeend', `
    <div class="rec-row">
      <div class="rec-thumb"></div>
      <p>${r.lead}<b>${r.strong}</b>${r.rest}</p>
    </div>`);
});

// Render Álbuns
const albumGrid = document.getElementById('albumGrid');
ALBUNS.forEach(al=>{
  albumGrid.insertAdjacentHTML('beforeend', `
    <div class="album-card">
      ${albumCoverHtml(al)}
      <h4>${al.title}</h4>
      <div class="artist">${al.artist}</div>
      <div class="yr">${al.year}</div>
      <div class="why">${al.why}</div>
    </div>`);
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

// About hero cards -> open accordion + switch tab + land right on the content
document.querySelectorAll('.about-card').forEach(card=>{
  card.addEventListener('click', ()=>{
    const targetId = card.dataset.open;
    const pane = targetId.startsWith('genero') ? 'genero' : targetId.startsWith('inst') ? 'inst' : targetId.startsWith('gloss') ? 'gloss' : 'cur';
    switchAboutTab(pane);
    const item = document.getElementById(targetId);
    if(item && !item.classList.contains('open')){
      item.querySelector('.acc-trigger').click();
    }
    requestAnimationFrame(()=>{
      item.scrollIntoView({behavior:'smooth', block:'start'});
    });
  });
});

// About tabs
function switchAboutTab(name){
  document.querySelectorAll('#aboutTabs button').forEach(b=>b.classList.toggle('active', b.dataset.pane===name));
  document.querySelectorAll('.pane').forEach(p=>p.classList.toggle('active', p.id==='pane-'+name));
}
document.querySelectorAll('#aboutTabs button').forEach(b=>{
  b.addEventListener('click', ()=>switchAboutTab(b.dataset.pane));
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

/* ===================== ONDE NASCEU ESSE SOM ===================== */
const originPins = document.getElementById('originPins');
const originDetail = document.getElementById('originDetail');

// Converte latitude/longitude em posição percentual sobre o mapa
// (projeção equirretangular, igual à usada pela imagem do mapa).
function latLonToPercent(lat, lon){
  return {
    left: ((lon + 180) / 360 * 100).toFixed(2) + '%',
    top: ((90 - lat) / 180 * 100).toFixed(2) + '%',
  };
}

function renderOriginDetail(index){
  const o = ORIGENS[index];
  originDetail.innerHTML = `
    <span class="origin-pin-ic"><i class="fa-solid fa-location-dot"></i></span>
    <div>
      <div class="origin-item-head">
        <span class="origin-city">${o.cidade}</span>
        <span class="origin-genre-chip">${o.genero}</span>
        <span class="origin-year">${o.ano}</span>
      </div>
      <p class="origin-text">${o.texto}</p>
    </div>`;
}

function highlightOrigin(index){
  originPins.querySelectorAll('.origin-pin').forEach((el,i)=>{
    el.classList.toggle('active', i===index);
  });
  renderOriginDetail(index);
}

ORIGENS.forEach((o,i)=>{
  const pos = latLonToPercent(o.lat, o.lon);

  // Pino no mapa
  const pin = document.createElement('button');
  pin.type = 'button';
  pin.className = 'origin-pin';
  pin.style.left = pos.left;
  pin.style.top = pos.top;
  pin.setAttribute('aria-label', `${o.cidade} — ${o.genero}`);
  pin.innerHTML = `<span class="origin-pin-dot"></span><span class="origin-pin-tip">${o.genero}</span>`;
  pin.addEventListener('click', ()=>highlightOrigin(i));
  originPins.appendChild(pin);
});

highlightOrigin(0);

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
      {id:'mac', name:'Fleetwood Mac', sub:'Rock/ Pop rock', img:''}
      {id:'zeramalho', name:'Zé Ramalho', sub:'MPB / Nordestino', img:''},
      {id:'lee', name:'Rita Lee', sub:'Rock / MPB', img:''},
    ],
  },
  musica: {
    key: 'votes-musica-semana',
    tipo: 'musica',
    title: 'VOTE NA MÚSICA DA SEMANA',
    options: [
      {id:'garota', name:'Garota', sub:'Froid', img:''},
      {id:'massa', name:'MASSA', sub:'Tyler, The Creator', img:''},
      {id:'chain', name:'The Chain', sub:'Fleetwood Mac', img:''},
      {id:'giz', name:'Chão de giz', sub:'Zé Ramalho', img:''},
      {id:'negra', name:'Ovelha Negra', sub:'Rita Lee', img:''},
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
    cfg.options.forEach(o=>{
      const pct = total ? Math.round((counts[o.id]/total)*100) : 0;
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
    setSelected(voted);
    submitBtn.disabled = true;
    submitBtn.textContent = 'Seu voto foi registrado ✓';
  }

  updateBars();
  if(voted){
    lockAsVoted();
  } else {
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

renderVoteCard('voteArtista', VOTE_CONFIGS.artista, 'user-voted-artista');
renderVoteCard('voteMusica', VOTE_CONFIGS.musica, 'user-voted-musica');

/* ===================== HALL DA FAMA =====================
   Observação: o backend Flask atual não tem uma tabela própria para o Hall
   da Fama nem uma rota para "zerar" os votos. Por isso este histórico fica
   salvo no localStorage deste navegador (não é compartilhado entre
   visitantes) e o botão "Encerrar semana" registra o topo atual da API,
   mas não reseta a contagem de votos no servidor. Se quiser que o Hall da
   Fama e o reset de votos fiquem no servidor, será preciso criar novas
   rotas no Flask (ex: uma tabela `hall_da_fama` e um endpoint de reset). */
const HOF_KEY = 'hall-of-fame-log';

async function renderHallOfFame(){
  const hofList = document.getElementById('hofList');
  let log = await storageGet(HOF_KEY);
  if(!log) log = [];
  if(!log.length){
    hofList.innerHTML = '<p class="hof-empty">Nenhuma semana arquivada ainda. Quando a votação da semana terminar, clique em "Encerrar semana" para guardar os vencedores aqui.</p>';
    return;
  }
  hofList.innerHTML = log.slice().reverse().map(w => `
    <li>
      <span class="hof-week">${w.week}</span>
      <span class="hof-names"><b>${w.artist}</b> &middot; ${w.song}</span>
    </li>`).join('');
}

function topVoteOption(cfg, counts){
  let best = null, bestVotes = -1;
  cfg.options.forEach(o=>{
    const v = counts[o.id] || 0;
    if(v > bestVotes){ bestVotes = v; best = o; }
  });
  return best;
}

async function archiveWeek(){
  const artistCounts = await fetchVoteCounts(VOTE_CONFIGS.artista);
  const songCounts = await fetchVoteCounts(VOTE_CONFIGS.musica);
  const topArtist = topVoteOption(VOTE_CONFIGS.artista, artistCounts);
  const topSong = topVoteOption(VOTE_CONFIGS.musica, songCounts);
  if(!topArtist || !topSong) return;

  let log = await storageGet(HOF_KEY);
  if(!log) log = [];
  const week = new Date().toLocaleDateString('pt-BR', {day:'2-digit', month:'short', year:'numeric'});
  log.push({week, artist: topArtist.name, song: topSong.name});
  await storageSet(HOF_KEY, log);

  // Libera o voto deste navegador para a nova semana (a contagem no
  // servidor continua acumulada — veja a observação acima).
  await storageSet('user-voted-artista', null);
  await storageSet('user-voted-musica', null);
}

document.getElementById('archiveWeekBtn').addEventListener('click', async ()=>{
  const ok = confirm('Isso vai arquivar os vencedores atuais no Hall da Fama (salvo neste navegador) e liberar seu voto para a próxima semana. Os votos no servidor não serão zerados. Confirmar?');
  if(!ok) return;
  await archiveWeek();
  await renderHallOfFame();
  await renderVoteCard('voteArtista', VOTE_CONFIGS.artista, 'user-voted-artista');
  await renderVoteCard('voteMusica', VOTE_CONFIGS.musica, 'user-voted-musica');
});

renderHallOfFame();

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
        <div class="c-head"><span class="c-name">${escapeHtml(c.nome)}</span><span class="c-time">${formatCommentDate(c.data)}</span></div>
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