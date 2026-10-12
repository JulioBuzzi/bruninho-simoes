// Gera a imagem (PNG 1080x1920, formato padrão de Story do Instagram, 9:16) com as notas de um jogo.
// O Instagram cobre ~250px no topo (nome/barra) e ~250px embaixo (campo de resposta): deixamos essas faixas livres.
// Tudo é desenhado num <canvas>, sem bibliotecas extras.

const W = 1080;
const H = 1920;
const SAFE_TOP = 250;    // área livre no topo do story
const SAFE_BOTTOM = 250; // área livre embaixo do story

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
  const n = parseFloat(value);
  const color = ratingColor(value);
  roundRect(ctx, x, y, w, h, 10);
  ctx.fillStyle = isNaN(n) ? 'rgba(90,90,114,0.12)' : hexA(color, big ? 0.16 : 0.1);
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = isNaN(n) ? C.border : hexA(color, 0.35);
  ctx.stroke();
  ctx.fillStyle = color;
  ctx.font = `${big ? 36 : 30}px "Bebas Neue"`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(isNaN(n) ? '—' : n.toFixed(1), x + w / 2, y + h / 2 + 2);
}

function hexA(hex, a) {
  const v = parseInt(hex.slice(1), 16);
  return `rgba(${(v >> 16) & 255},${(v >> 8) & 255},${v & 255},${a})`;
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
  const { match, players, highlights } = data;

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

  // ── Cabeçalho centralizado: marca em cima, campeonato/data embaixo ──
  ctx.textBaseline = 'alphabetic';
  ctx.font = '52px "Bebas Neue"';
  const part1 = 'BRUNINHO ', part2 = '&', part3 = ' SIMÕES';
  const textW = ctx.measureText(part1 + part2 + part3).width;
  const logoW = brand ? 76 + 18 : 0;
  let hx = (W - (logoW + textW)) / 2;
  if (brand) drawCover(ctx, brand, hx, T, 76, 18);
  hx += logoW;
  ctx.textAlign = 'left';
  ctx.fillStyle = C.text;
  ctx.fillText(part1, hx, T + 48);
  ctx.fillStyle = C.red;
  ctx.fillText(part2, hx + ctx.measureText(part1).width, T + 48);
  ctx.fillStyle = C.text;
  ctx.fillText(part3, hx + ctx.measureText(part1 + part2).width, T + 48);
  ctx.font = '700 18px "Barlow Condensed"';
  ctx.fillStyle = C.muted;
  ctx.fillText('NOTAS DO TENGO', hx, T + 72);

  ctx.textAlign = 'center';
  ctx.font = '700 28px "Barlow Condensed"';
  ctx.fillStyle = C.text2;
  const champLine = `${(match.championship || '').toUpperCase()}${match.round ? ' · ' + match.round.toUpperCase() : ''}`;
  ctx.fillText(`${champLine}   •   ${formatDate(match.match_date)} · ${match.is_home ? 'CASA' : 'FORA'}`, W / 2, T + 128);

  // ── Placar ──
  const fla = match.flamengo_goals, opp = match.opponent_goals;
  const resColor = fla > opp ? C.green : fla < opp ? C.red : C.gold;
  const scoreY = T + 170;
  const logoSize = 150;
  const drawTeam = (img, name, short, cx) => {
    roundRect(ctx, cx - logoSize / 2 - 14, scoreY, logoSize + 28, logoSize + 28, 24);
    ctx.fillStyle = C.card;
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = C.border;
    ctx.stroke();
    if (img) drawContain(ctx, img, cx - logoSize / 2, scoreY + 14, logoSize);
    else {
      ctx.font = '48px "Bebas Neue"';
      ctx.fillStyle = C.text2;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(short, cx, scoreY + 14 + logoSize / 2);
    }
    ctx.font = '36px "Bebas Neue"';
    ctx.fillStyle = C.text;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(fitText(ctx, name.toUpperCase(), 280), cx, scoreY + logoSize + 76);
  };
  drawTeam(flaLogo, 'Flamengo', 'FLA', 250);
  drawTeam(oppLogo, match.opponent_name || '', (match.opponent_short || match.opponent_name || '?').slice(0, 3).toUpperCase(), W - 250);

  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.font = '180px "Bebas Neue"';
  ctx.fillStyle = resColor;
  ctx.fillText(`${fla}`, W / 2 - 84, scoreY + 160);
  ctx.fillText(`${opp}`, W / 2 + 84, scoreY + 160);
  ctx.font = '80px "Bebas Neue"';
  ctx.fillStyle = C.muted;
  ctx.fillText('×', W / 2, scoreY + 140);
  if (match.had_penalties) {
    ctx.font = '700 26px "Barlow Condensed"';
    ctx.fillStyle = C.text2;
    ctx.fillText(`PÊNALTIS ${match.flamengo_penalties} × ${match.opponent_penalties}`, W / 2, scoreY + 216);
  }

  // ── Destaques: craque, média, Simões, Bruninho ──
  const hlY = T + 440, hlH = 120, gap = 16;
  const hlW = (W - PAD * 2 - gap * 3) / 4;
  const boxes = [
    { label: craqueNames.length > 1 ? 'CRAQUES' : 'CRAQUE', value: craqueNames.length ? craqueNames.join(', ') : '—', sub: best !== null ? best.toFixed(1) : '', color: C.gold, small: true },
    { label: 'MÉDIA DO TIME', value: highlights?.team_avg > 0 ? Number(highlights.team_avg).toFixed(2) : '—', color: ratingColor(highlights?.team_avg) },
    { label: 'SIMÕES', value: highlights?.simoes_avg > 0 ? Number(highlights.simoes_avg).toFixed(2) : '—', color: C.red },
    { label: 'BRUNINHO', value: highlights?.bruninho_avg > 0 ? Number(highlights.bruninho_avg).toFixed(2) : '—', color: C.blue },
  ];
  boxes.forEach((b, i) => {
    const x = PAD + i * (hlW + gap);
    roundRect(ctx, x, hlY, hlW, hlH, 16);
    ctx.fillStyle = i === 0 ? 'rgba(245,200,66,0.08)' : C.card;
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = i === 0 ? 'rgba(245,200,66,0.3)' : C.border;
    ctx.stroke();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.font = '700 18px "Barlow Condensed"';
    ctx.fillStyle = i === 0 ? C.gold : C.text2;
    // Com mais de um craque, a nota vai junto do título pra sobrar espaço pros nomes
    const multi = b.small && craqueNames.length > 1;
    ctx.fillText(multi ? `${b.label} · ${b.sub}` : b.label, x + hlW / 2, hlY + 32);
    if (b.small) {
      // Nome(s) do craque: diminui a fonte até caber; com empate, um nome por linha (até 2 linhas)
      const names = craqueNames.length ? craqueNames.map(n => n.toUpperCase()) : ['—'];
      const lines = names.length <= 2 ? names : [names[0], `+${names.length - 1} JOGADORES`];
      const maxW = hlW - 20;
      let size = lines.length > 1 ? 24 : 30;
      const widest = () => Math.max(...lines.map(l => { ctx.font = `${size}px "Bebas Neue"`; return ctx.measureText(l).width; }));
      while (size > 16 && widest() > maxW) size -= 1;
      ctx.font = `${size}px "Bebas Neue"`;
      ctx.fillStyle = C.text;
      const lineH = size + 4;
      const firstY = lines.length > 1 ? hlY + 66 : hlY + 70;
      lines.forEach((l, li) => ctx.fillText(fitText(ctx, l, maxW), x + hlW / 2, firstY + li * lineH));
      if (!multi) {
        ctx.font = '24px "Bebas Neue"';
        ctx.fillStyle = C.gold;
        ctx.fillText(b.sub, x + hlW / 2, hlY + 100);
      }
    } else {
      ctx.font = '50px "Bebas Neue"';
      ctx.fillStyle = b.color;
      ctx.fillText(b.value, x + hlW / 2, hlY + 92);
    }
  });

  // ── Tabela de notas ──
  const tableTop = hlY + hlH + 54;
  const footerTop = H - SAFE_BOTTOM - 70;
  const colS = W - PAD - 330, colB = W - PAD - 210, colM = W - PAD - 96;
  ctx.font = '700 18px "Barlow Condensed"';
  ctx.fillStyle = C.muted;
  ctx.textAlign = 'left';
  ctx.fillText('JOGADOR', PAD + 12, tableTop);
  ctx.textAlign = 'center';
  ctx.fillText('SIMÕES', colS + 48, tableTop);
  ctx.fillText('BRUNINHO', colB + 48, tableTop);
  ctx.fillText('MÉDIA', colM + 48, tableTop);

  const listTop = tableTop + 16;
  const rowGap = 8;
  const rowH = Math.min(76, Math.floor((footerTop - 14 - listTop) / Math.max(players.length, 1)) - rowGap);
  const photoSize = rowH - 14;
  const pillH = rowH - 16;

  players.forEach((p, i) => {
    const y = listTop + i * (rowH + rowGap);
    const avg = p.average_rating !== null ? parseFloat(p.average_rating) : null;
    const isCraque = avg !== null && avg === best;
    const isBagre  = avg !== null && avg === worst && !isCraque;

    roundRect(ctx, PAD, y, W - PAD * 2, rowH, 12);
    ctx.fillStyle = isCraque ? 'rgba(245,200,66,0.07)' : isBagre ? 'rgba(232,0,28,0.07)' : C.card;
    ctx.fill();
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = isCraque ? 'rgba(245,200,66,0.35)' : isBagre ? 'rgba(232,0,28,0.35)' : C.border;
    ctx.stroke();

    // Foto ou número
    const px = PAD + 10, py = y + 7;
    if (photos[i]) drawCover(ctx, photos[i], px, py, photoSize, 10);
    else {
      roundRect(ctx, px, py, photoSize, photoSize, 10);
      ctx.fillStyle = C.card2;
      ctx.fill();
      ctx.font = `${Math.round(photoSize * 0.45)}px "Bebas Neue"`;
      ctx.fillStyle = C.text2;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(p.number || '#'), px + photoSize / 2, py + photoSize / 2 + 2);
    }

    // Nome + posição + selo
    const nx = px + photoSize + 16;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.font = `600 ${rowH >= 56 ? 28 : 24}px "Barlow"`;
    ctx.fillStyle = C.text;
    const tag = isCraque ? 'CRAQUE' : isBagre ? 'BAGRE' : '';
    const nameMax = colS - nx - (tag ? 120 : 20);
    const name = fitText(ctx, p.player_name, nameMax);
    ctx.fillText(name, nx, y + rowH / 2 + 2);
    ctx.font = '600 16px "Barlow Condensed"';
    ctx.fillStyle = C.muted;
    ctx.fillText((p.position_in_match || p.position || '').toUpperCase(), nx, y + rowH / 2 + 22);
    if (tag) {
      ctx.font = `600 ${rowH >= 56 ? 28 : 24}px "Barlow"`;
      const tx = nx + ctx.measureText(name).width + 14;
      ctx.font = '700 16px "Barlow Condensed"';
      const tw = ctx.measureText(tag).width + 20;
      roundRect(ctx, tx, y + rowH / 2 - 20, tw, 26, 13);
      ctx.fillStyle = isCraque ? 'rgba(245,200,66,0.18)' : 'rgba(232,0,28,0.18)';
      ctx.fill();
      ctx.fillStyle = isCraque ? C.gold : '#ff3d4f';
      ctx.textAlign = 'center';
      ctx.fillText(tag, tx + tw / 2, y + rowH / 2 - 1);
    }

    // Notas
    const py2 = y + (rowH - pillH) / 2;
    pill(ctx, colS, py2, 96, pillH, p.simoes_rating);
    pill(ctx, colB, py2, 96, pillH, p.bruninho_rating);
    pill(ctx, colM, py2, 96, pillH, p.average_rating, { big: true });
  });

  // ── Rodapé ──
  ctx.fillStyle = C.border;
  ctx.fillRect(PAD, footerTop, W - PAD * 2, 2);
  ctx.textBaseline = 'alphabetic';
  ctx.font = '700 22px "Barlow Condensed"';
  ctx.textAlign = 'left';
  ctx.fillStyle = C.text2;
  ctx.fillText('bruninho-simoes.vercel.app', PAD, footerTop + 46);
  ctx.textAlign = 'right';
  ctx.fillStyle = '#ff3d3d';
  ctx.fillText('▶ youtube.com/@BruninhoeSimoes', W - PAD, footerTop + 46);

  return new Promise((resolve, reject) => {
    try {
      canvas.toBlob(b => (b ? resolve(b) : reject(new Error('Falha ao gerar a imagem'))), 'image/png');
    } catch (e) {
      reject(e); // canvas "contaminado" por imagem externa sem CORS
    }
  });
}