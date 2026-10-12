// Gera a imagem (PNG 1080x1920, formato padrão de Story do Instagram, 9:16) com as notas de um jogo.
// O Instagram cobre o topo (nome/barra) e a parte de baixo (campo de resposta): deixamos 150px livres em cada ponta.
// Tudo é desenhado num <canvas>, sem bibliotecas extras.

const W = 1080;
const H = 1920;
const SAFE_TOP = 150;    // área livre no topo do story (barra de progresso e nome do perfil)
const SAFE_BOTTOM = 150; // área livre embaixo do story (campo de resposta)

const C = {
  bg: '#0a0a0f',
  card: '#16161f',
  card2: '#111118',
  border: '#2a2a3a',
  text: '#f0f0f5',
  text2: '#9090a8',
  muted: '#5a5a72',
  red: '#e8001c',
  gold: '#f5c842',
  green: '#00c853',
  blue: '#448aff',
};

// Mesmas faixas de cor do RatingBadge
function ratingColor(v) {
  const n = parseFloat(v);
  if (isNaN(n)) return C.muted;
  if (n >= 8) return '#00e564';
  if (n >= 6.5) return C.green;
  if (n >= 5) return C.gold;
  if (n >= 3) return '#ff6d00';
  return C.red;
}

function loadImage(src) {
  return new Promise(resolve => {
    if (!src) return resolve(null);
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

// Desenha a imagem "contida" no quadrado (sem distorcer)
function drawContain(ctx, img, x, y, size) {
  const s = Math.min(size / img.width, size / img.height);
  const w = img.width * s, h = img.height * s;
  ctx.drawImage(img, x + (size - w) / 2, y + (size - h) / 2, w, h);
}

// Desenha a imagem "cobrindo" o quadrado (corta o excesso), com cantos arredondados
function drawCover(ctx, img, x, y, size, r) {
  ctx.save();
  roundRect(ctx, x, y, size, size, r);
  ctx.clip();
  const s = Math.max(size / img.width, size / img.height);
  const w = img.width * s, h = img.height * s;
  ctx.drawImage(img, x + (size - w) / 2, y + (size - h) / 2, w, h);
  ctx.restore();
}

function fitText(ctx, text, maxW) {
  if (ctx.measureText(text).width <= maxW) return text;
  let t = text;
  while (t.length > 1 && ctx.measureText(t + '…').width > maxW) t = t.slice(0, -1);
  return t + '…';
}

function pill(ctx, x, y, w, h, value, { big = false } = {}) {
  const fontSize = Math.round(Math.min(big ? 44 : 38, h * (big ? 0.78 : 0.68)));
  const n = parseFloat(value);
  const color = ratingColor(value);
  roundRect(ctx, x, y, w, h, 12);
  ctx.fillStyle = isNaN(n) ? 'rgba(90,90,114,0.12)' : hexA(color, big ? 0.16 : 0.1);
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = isNaN(n) ? C.border : hexA(color, 0.35);
  ctx.stroke();
  ctx.fillStyle = color;
  ctx.font = `${fontSize}px "Bebas Neue"`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(isNaN(n) ? '—' : n.toFixed(1), x + w / 2, y + h / 2 + 2);
}

function hexA(hex, a) {
  const v = parseInt(hex.slice(1), 16);
  return `rgba(${(v >> 16) & 255},${(v >> 8) & 255},${v & 255},${a})`;
}

// Ordem das posições na imagem: goleiro, lateral direito, zagueiros, lateral esquerdo, volantes, meias, atacantes
const POSITION_ORDER = {
  'Goleiro': 1, 'Lateral Direito': 2, 'Zagueiro': 3, 'Lateral Esquerdo': 4,
  'Volante': 5, 'Meia': 6, 'Atacante': 7,
};
function sortByPosition(list) {
  // sort estável: dentro da mesma posição mantém a ordem que veio da API
  return [...list].sort((a, b) =>
    (POSITION_ORDER[a.position_in_match || a.position] ?? 99) - (POSITION_ORDER[b.position_in_match || b.position] ?? 99));
}

function formatDate(raw) {
  const s = String(raw || '').slice(0, 10).split('-');
  return s.length === 3 ? `${s[2]}/${s[1]}/${s[0]}` : '';
}

/**
 * data = resposta de GET /matches/:id  ({ match, players, highlights })
 * Retorna Promise<Blob> (image/png)
 */
export async function generateMatchCard(data) {
  const { match, highlights } = data;
  const players = sortByPosition(data.players);

  // Garante que as fontes do site estão carregadas antes de desenhar
  if (typeof document !== 'undefined' && document.fonts) {
    await Promise.all([
      document.fonts.load('40px "Bebas Neue"'),
      document.fonts.load('600 28px "Barlow"'),
      document.fonts.load('700 24px "Barlow Condensed"'),
    ]).catch(() => {});
  }

  const rated = players.filter(p => p.average_rating !== null);
  const best  = rated.length ? Math.max(...rated.map(p => parseFloat(p.average_rating))) : null;
  const worst = rated.length ? Math.min(...rated.map(p => parseFloat(p.average_rating))) : null;
  const craqueNames = rated.filter(p => parseFloat(p.average_rating) === best).map(p => p.player_name);

  const [brand, flaLogo, oppLogo, ...photos] = await Promise.all([
    loadImage('/bruninhoesimoes.png'),
    loadImage('/logos/flamengo.png'),
    loadImage(match.opponent_logo),
    ...players.map(p => loadImage(p.photo_url)),
  ]);

  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');

  // ── Fundo ──
  ctx.fillStyle = C.bg;
  ctx.fillRect(0, 0, W, H);
  const glow = ctx.createRadialGradient(W / 2, SAFE_TOP, 0, W / 2, SAFE_TOP, 800);
  glow.addColorStop(0, 'rgba(232,0,28,0.22)');
  glow.addColorStop(1, 'rgba(232,0,28,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, SAFE_TOP + 800);
  ctx.fillStyle = C.red;
  ctx.fillRect(0, 0, W, 8);

  const PAD = 56;
  const T = SAFE_TOP; // tudo começa abaixo da faixa livre do topo

  // ── Cabeçalho centralizado (grande): marca em cima, campeonato/data embaixo ──
  ctx.textBaseline = 'alphabetic';
  const part1 = 'BRUNINHO ', part2 = '&', part3 = ' SIMÕES';
  const brandSize = 122;
  const logoW = brand ? brandSize + 24 : 0;
  // Diminui a fonte até a marca caber na largura (nunca encosta nas bordas)
  let brandFont = 90;
  ctx.font = `${brandFont}px "Bebas Neue"`;
  while (brandFont > 50 && logoW + ctx.measureText(part1 + part2 + part3).width > W - PAD * 2) {
    brandFont -= 2;
    ctx.font = `${brandFont}px "Bebas Neue"`;
  }
  const textW = ctx.measureText(part1 + part2 + part3).width;
  let hx = (W - (logoW + textW)) / 2;
  if (brand) drawCover(ctx, brand, hx, T, brandSize, 26);
  hx += logoW;
  ctx.textAlign = 'left';
  ctx.fillStyle = C.text;
  ctx.fillText(part1, hx, T + 82);
  ctx.fillStyle = C.red;
  ctx.fillText(part2, hx + ctx.measureText(part1).width, T + 82);
  ctx.fillStyle = C.text;
  ctx.fillText(part3, hx + ctx.measureText(part1 + part2).width, T + 82);
  ctx.font = '700 28px "Barlow Condensed"';
  ctx.fillStyle = C.muted;
  ctx.fillText('NOTAS DO TENGO', hx + 2, T + 116);

  ctx.textAlign = 'center';
  ctx.fillStyle = C.text2;
  const champLine = `${(match.championship || '').toUpperCase()}${match.round ? ' · ' + match.round.toUpperCase() : ''}`;
  const infoLine = `${champLine}   •   ${formatDate(match.match_date)} · ${match.is_home ? 'CASA' : 'FORA'}`;
  let infoFont = 42;
  ctx.font = `700 ${infoFont}px "Barlow Condensed"`;
  while (infoFont > 24 && ctx.measureText(infoLine).width > W - PAD * 2) {
    infoFont -= 1;
    ctx.font = `700 ${infoFont}px "Barlow Condensed"`;
  }
  ctx.fillText(fitText(ctx, infoLine, W - PAD * 2), W / 2, T + 196);

  // ── Placar ──
  const fla = match.flamengo_goals, opp = match.opponent_goals;
  const resColor = fla > opp ? C.green : fla < opp ? C.red : C.gold;
  const scoreY = T + 228;
  const logoSize = 152;
  const drawTeam = (img, name, short, cx) => {
    roundRect(ctx, cx - logoSize / 2 - 16, scoreY, logoSize + 32, logoSize + 32, 28);
    ctx.fillStyle = C.card;
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = C.border;
    ctx.stroke();
    if (img) drawContain(ctx, img, cx - logoSize / 2, scoreY + 16, logoSize);
    else {
      ctx.font = '56px "Bebas Neue"';
      ctx.fillStyle = C.text2;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(short, cx, scoreY + 16 + logoSize / 2);
    }
    ctx.font = '44px "Bebas Neue"';
    ctx.fillStyle = C.text;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(fitText(ctx, name.toUpperCase(), 300), cx, scoreY + logoSize + 82);
  };
  drawTeam(flaLogo, 'Flamengo', 'FLA', 240);
  drawTeam(oppLogo, match.opponent_name || '', (match.opponent_short || match.opponent_name || '?').slice(0, 3).toUpperCase(), W - 240);

  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.font = '200px "Bebas Neue"';
  ctx.fillStyle = resColor;
  ctx.fillText(`${fla}`, W / 2 - 90, scoreY + 170);
  ctx.fillText(`${opp}`, W / 2 + 90, scoreY + 170);
  ctx.font = '96px "Bebas Neue"';
  ctx.fillStyle = C.muted;
  ctx.fillText('×', W / 2, scoreY + 150);
  if (match.had_penalties) {
    ctx.font = '700 32px "Barlow Condensed"';
    ctx.fillStyle = C.text2;
    ctx.fillText(`PÊNALTIS ${match.flamengo_penalties} × ${match.opponent_penalties}`, W / 2, scoreY + 228);
  }

  // ── Destaques: craque, média, Simões, Bruninho ──
  const hlY = T + 496, hlH = 134, gap = 18;
  const hlW = (W - PAD * 2 - gap * 3) / 4;
  const boxes = [
    { label: craqueNames.length > 1 ? 'CRAQUES' : 'CRAQUE', value: craqueNames.length ? craqueNames.join(', ') : '—', sub: best !== null ? best.toFixed(1) : '', color: C.gold, small: true },
    { label: 'MÉDIA DO TIME', value: highlights?.team_avg > 0 ? Number(highlights.team_avg).toFixed(2) : '—', color: ratingColor(highlights?.team_avg) },
    { label: 'SIMÕES', value: highlights?.simoes_avg > 0 ? Number(highlights.simoes_avg).toFixed(2) : '—', color: C.red },
    { label: 'BRUNINHO', value: highlights?.bruninho_avg > 0 ? Number(highlights.bruninho_avg).toFixed(2) : '—', color: C.blue },
  ];
  boxes.forEach((b, i) => {
    const x = PAD + i * (hlW + gap);
    roundRect(ctx, x, hlY, hlW, hlH, 20);
    ctx.fillStyle = i === 0 ? 'rgba(245,200,66,0.08)' : C.card;
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = i === 0 ? 'rgba(245,200,66,0.3)' : C.border;
    ctx.stroke();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.font = '700 23px "Barlow Condensed"';
    ctx.fillStyle = i === 0 ? C.gold : C.text2;
    // Com mais de um craque, a nota vai junto do título pra sobrar espaço pros nomes
    const multi = b.small && craqueNames.length > 1;
    ctx.fillText(multi ? `${b.label} · ${b.sub}` : b.label, x + hlW / 2, hlY + 36);
    if (b.small) {
      // Nome(s) do craque: diminui a fonte até caber; com empate, um nome por linha (até 2 linhas)
      const names = craqueNames.length ? craqueNames.map(n => n.toUpperCase()) : ['—'];
      const lines = names.length <= 2 ? names : [names[0], `+${names.length - 1} JOGADORES`];
      const maxW = hlW - 20;
      let size = lines.length > 1 ? 32 : 40;
      const widest = () => Math.max(...lines.map(l => { ctx.font = `${size}px "Bebas Neue"`; return ctx.measureText(l).width; }));
      while (size > 16 && widest() > maxW) size -= 1;
      ctx.font = `${size}px "Bebas Neue"`;
      ctx.fillStyle = C.text;
      const lineH = size + 4;
      const firstY = lines.length > 1 ? hlY + 76 : hlY + 82;
      lines.forEach((l, li) => ctx.fillText(fitText(ctx, l, maxW), x + hlW / 2, firstY + li * lineH));
      if (!multi) {
        ctx.font = '32px "Bebas Neue"';
        ctx.fillStyle = C.gold;
        ctx.fillText(b.sub, x + hlW / 2, hlY + 116);
      }
    } else {
      ctx.font = '62px "Bebas Neue"';
      ctx.fillStyle = b.color;
      ctx.fillText(b.value, x + hlW / 2, hlY + 106);
    }
  });

  // ── Tabela de notas ──
  const tableTop = hlY + hlH + 50;
  const footerTop = H - SAFE_BOTTOM - 98;
  const pillW = 118, colGap = 14;
  const colM = W - PAD - pillW - 8, colB = colM - pillW - colGap, colS = colB - pillW - colGap;
  ctx.font = '700 23px "Barlow Condensed"';
  ctx.fillStyle = C.muted;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText('JOGADOR', PAD + 14, tableTop);
  ctx.textAlign = 'center';
  ctx.fillText('SIMÕES', colS + pillW / 2, tableTop);
  ctx.fillText('BRUNINHO', colB + pillW / 2, tableTop);
  ctx.fillText('MÉDIA', colM + pillW / 2, tableTop);

  const listTop = tableTop + 18;
  const rowGap = 6;
  const rowH = Math.min(96, Math.floor((footerTop - 18 - listTop) / Math.max(players.length, 1)) - rowGap);
  const photoSize = rowH - 14;
  const pillH = Math.round(rowH * 0.72);
  const nameFont = Math.round(Math.min(38, rowH * 0.5));

  players.forEach((p, i) => {
    const y = listTop + i * (rowH + rowGap);
    const avg = p.average_rating !== null ? parseFloat(p.average_rating) : null;
    const isCraque = avg !== null && avg === best;
    const isBagre  = avg !== null && avg === worst && !isCraque;

    roundRect(ctx, PAD, y, W - PAD * 2, rowH, 14);
    ctx.fillStyle = isCraque ? 'rgba(245,200,66,0.08)' : isBagre ? 'rgba(232,0,28,0.08)' : C.card;
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = isCraque ? 'rgba(245,200,66,0.4)' : isBagre ? 'rgba(232,0,28,0.4)' : C.border;
    ctx.stroke();

    // Foto ou número
    const px = PAD + 8, py = y + 7;
    if (photos[i]) drawCover(ctx, photos[i], px, py, photoSize, 12);
    else {
      roundRect(ctx, px, py, photoSize, photoSize, 12);
      ctx.fillStyle = C.card2;
      ctx.fill();
      ctx.font = `${Math.round(photoSize * 0.45)}px "Bebas Neue"`;
      ctx.fillStyle = C.text2;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(p.number || '#'), px + photoSize / 2, py + photoSize / 2 + 2);
    }

    // Nome (centralizado na altura da linha) + selo CRAQUE/BAGRE
    const nx = px + photoSize + 18;
    const midY = y + rowH / 2;
    const tag = isCraque ? 'CRAQUE' : isBagre ? 'BAGRE' : '';
    const tagFont = Math.round(nameFont * 0.56);
    ctx.font = `700 ${tagFont}px "Barlow Condensed"`;
    const tw = tag ? ctx.measureText(tag).width + 24 : 0;
    ctx.font = `600 ${nameFont}px "Barlow"`;
    const name = fitText(ctx, p.player_name, colS - nx - (tag ? tw + 26 : 16));
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = C.text;
    ctx.fillText(name, nx, midY + 1);
    if (tag) {
      const tx = nx + ctx.measureText(name).width + 14;
      const th = Math.round(tagFont * 1.6);
      roundRect(ctx, tx, midY - th / 2, tw, th, th / 2);
      ctx.fillStyle = isCraque ? 'rgba(245,200,66,0.2)' : 'rgba(232,0,28,0.2)';
      ctx.fill();
      ctx.font = `700 ${tagFont}px "Barlow Condensed"`;
      ctx.fillStyle = isCraque ? C.gold : '#ff3d4f';
      ctx.textAlign = 'center';
      ctx.fillText(tag, tx + tw / 2, midY + 1);
    }

    // Notas
    const py2 = y + (rowH - pillH) / 2;
    pill(ctx, colS, py2, pillW, pillH, p.simoes_rating);
    pill(ctx, colB, py2, pillW, pillH, p.bruninho_rating);
    pill(ctx, colM, py2, pillW, pillH, p.average_rating, { big: true });
  });

  // ── Rodapé: canal do YouTube (grande, centralizado) ──
  ctx.fillStyle = C.border;
  ctx.fillRect(PAD, footerTop, W - PAD * 2, 2);
  ctx.textBaseline = 'middle';
  ctx.font = '700 48px "Barlow Condensed"';
  const ytText = 'youtube.com/@BruninhoeSimoes';
  const iconW = 78, iconH = 56, gapIcon = 20;
  const ytW = iconW + gapIcon + ctx.measureText(ytText).width;
  const ytX = (W - ytW) / 2;
  const ytY = footerTop + 56;
  // ícone do YouTube (retângulo vermelho + triângulo branco)
  roundRect(ctx, ytX, ytY - iconH / 2, iconW, iconH, 14);
  ctx.fillStyle = '#ff0000';
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(ytX + iconW * 0.40, ytY - iconH * 0.24);
  ctx.lineTo(ytX + iconW * 0.40, ytY + iconH * 0.24);
  ctx.lineTo(ytX + iconW * 0.68, ytY);
  ctx.closePath();
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.textAlign = 'left';
  ctx.fillStyle = C.text;
  ctx.fillText(ytText, ytX + iconW + gapIcon, ytY + 2);

  return new Promise((resolve, reject) => {
    try {
      canvas.toBlob(b => (b ? resolve(b) : reject(new Error('Falha ao gerar a imagem'))), 'image/png');
    } catch (e) {
      reject(e); // canvas "contaminado" por imagem externa sem CORS
    }
  });
}