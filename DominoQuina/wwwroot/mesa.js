// Mesa de dominó em canvas: feltro, pedras de marfim, arrastar-e-soltar, animações e partículas.
// O estado autoritativo vem do C# (atualizar); as jogadas voltam via DotNetObjectReference (Jogar/Comprar).

const PIPS = [[], [4], [0, 8], [0, 4, 8], [0, 2, 6, 8], [0, 2, 4, 6, 8], [0, 2, 3, 5, 6, 8]];
const COR = ['', '#1f5fbf', '#1f8a55', '#c23b2e', '#7a3fa6', '#d2871a', '#16191d'];
const FONTE = '"Playfair Display", Georgia, serif';
const OURO = '#e6c25a';
const chave = p => `${Math.min(p.valorA, p.valorB)}-${Math.max(p.valorA, p.valorB)}`;

function rr(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); }

// Pedra centrada em (x,y); u = lado curto. rot 0 = horizontal (a à esquerda), PI/2 = vertical (a em cima).
export function desenharPedra(ctx, x, y, u, a, b, o = {}) {
    const { rot = 0, alpha = 1, verso = false, apagada = false, brilho = 0, elev = 1 } = o;
    const w = 2 * u, h = u, r = u * .18;
    ctx.save();
    ctx.translate(x, y); ctx.rotate(rot); ctx.globalAlpha = alpha;

    ctx.shadowColor = 'rgba(0,0,0,.55)'; ctx.shadowBlur = u * .35 * elev; ctx.shadowOffsetY = u * .12 * elev;
    rr(ctx, -w / 2, -h / 2, w, h, r);
    const g = ctx.createLinearGradient(-w / 2, -h / 2, w / 2, h / 2);
    if (verso) { g.addColorStop(0, '#2c3a33'); g.addColorStop(1, '#0c1411'); }
    else { g.addColorStop(0, '#fffdf6'); g.addColorStop(.55, '#f1ead8'); g.addColorStop(1, '#d6cbb0'); }
    ctx.fillStyle = g; ctx.fill();
    ctx.shadowColor = 'transparent';
    ctx.lineWidth = Math.max(1, u * .035);
    ctx.strokeStyle = verso ? 'rgba(230,194,90,.55)' : 'rgba(80,60,30,.35)';
    ctx.stroke();

    // reflexo superior
    rr(ctx, -w / 2 + u * .07, -h / 2 + u * .05, w - u * .14, h * .4, r * .7);
    const hl = ctx.createLinearGradient(0, -h / 2, 0, 0);
    hl.addColorStop(0, verso ? 'rgba(255,255,255,.12)' : 'rgba(255,255,255,.6)'); hl.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = hl; ctx.fill();

    if (verso) {
        ctx.strokeStyle = 'rgba(230,194,90,.7)'; ctx.lineWidth = Math.max(1, u * .05);
        for (const s of [.3, .17]) {
            ctx.beginPath(); ctx.moveTo(0, -h * s); ctx.lineTo(h * s * 1.6, 0); ctx.lineTo(0, h * s); ctx.lineTo(-h * s * 1.6, 0); ctx.closePath(); ctx.stroke();
        }
    } else {
        ctx.lineWidth = u * .05; ctx.strokeStyle = 'rgba(60,45,25,.45)';
        ctx.beginPath(); ctx.moveTo(0, -h / 2 + u * .14); ctx.lineTo(0, h / 2 - u * .14); ctx.stroke();
        ctx.lineWidth = u * .025; ctx.strokeStyle = 'rgba(255,255,255,.75)';
        ctx.beginPath(); ctx.moveTo(u * .035, -h / 2 + u * .14); ctx.lineTo(u * .035, h / 2 - u * .14); ctx.stroke();
        const pin = ctx.createRadialGradient(-u * .02, -u * .02, 0, 0, 0, u * .075);
        pin.addColorStop(0, '#fff2b8'); pin.addColorStop(1, '#a07a22');
        ctx.fillStyle = pin; ctx.beginPath(); ctx.arc(0, 0, u * .07, 0, 7); ctx.fill();
        metade(ctx, -u / 2, a, u); metade(ctx, u / 2, b, u);
    }

    if (apagada) { rr(ctx, -w / 2, -h / 2, w, h, r); ctx.fillStyle = 'rgba(8,22,15,.42)'; ctx.fill(); }
    if (brilho > 0) {
        rr(ctx, -w / 2, -h / 2, w, h, r);
        ctx.shadowColor = `rgba(255,205,90,${brilho})`; ctx.shadowBlur = u * .7;
        ctx.strokeStyle = `rgba(255,214,110,${brilho})`; ctx.lineWidth = u * .09; ctx.stroke();
    }
    ctx.restore();
}

function metade(ctx, cx, v, u) {
    const s = u * .25, pr = u * .085;
    for (const i of PIPS[v] ?? []) {
        const px = cx + (i % 3 - 1) * s, py = (Math.floor(i / 3) - 1) * s;
        ctx.fillStyle = COR[v]; ctx.beginPath(); ctx.arc(px, py, pr, 0, 7); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,.4)'; ctx.beginPath(); ctx.arc(px + pr * .3, py + pr * .35, pr * .35, 0, 7); ctx.fill();
    }
}

function criarFeltro(W, H, dpr) {
    const c = document.createElement('canvas'); c.width = W * dpr; c.height = H * dpr;
    const g = c.getContext('2d'); g.scale(dpr, dpr);
    const m = 14;

    // moldura de madeira
    rr(g, 0, 0, W, H, 22);
    const wg = g.createLinearGradient(0, 0, W, H);
    wg.addColorStop(0, '#5e3519'); wg.addColorStop(.5, '#7d4b24'); wg.addColorStop(1, '#3b200d');
    g.fillStyle = wg; g.fill();
    g.save(); g.clip();
    for (let i = 0; i < 140; i++) {
        g.strokeStyle = `rgba(0,0,0,${Math.random() * .14})`; g.lineWidth = Math.random() * 2;
        const y = Math.random() * H;
        g.beginPath(); g.moveTo(0, y);
        g.bezierCurveTo(W * .3, y + (Math.random() - .5) * 30, W * .7, y + (Math.random() - .5) * 30, W, y + (Math.random() - .5) * 20);
        g.stroke();
    }
    g.restore();

    // feltro
    rr(g, m, m, W - 2 * m, H - 2 * m, 14);
    const fg = g.createRadialGradient(W / 2, H * .45, 10, W / 2, H / 2, Math.max(W, H) * .7);
    fg.addColorStop(0, '#24895b'); fg.addColorStop(.6, '#145c3b'); fg.addColorStop(1, '#09331f');
    g.fillStyle = fg; g.fill();
    g.save(); g.clip();
    for (let i = 0, n = W * H / 16; i < n; i++) {
        g.fillStyle = Math.random() < .5 ? 'rgba(255,255,255,.035)' : 'rgba(0,0,0,.07)';
        g.fillRect(Math.random() * W, Math.random() * H, 1, 1);
    }
    g.shadowColor = 'rgba(0,0,0,.85)'; g.shadowBlur = 30; g.lineWidth = 20; g.strokeStyle = 'rgba(0,0,0,.6)';
    rr(g, m - 10, m - 10, W - 2 * m + 20, H - 2 * m + 20, 20); g.stroke();
    g.restore();

    g.strokeStyle = 'rgba(230,194,90,.45)'; g.lineWidth = 1.5;
    rr(g, m + 8, m + 8, W - 2 * m - 16, H - 2 * m - 16, 10); g.stroke();

    g.save(); g.globalAlpha = .06; g.fillStyle = '#fff';
    g.font = `700 ${Math.min(W, H) * .085}px ${FONTE}`; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText('PONTA DE QUINA', W / 2, H / 2);
    g.restore();
    return c;
}

export function criarMesa(canvas, dotnet) {
    const ctx = canvas.getContext('2d');
    let W = 1, H = 1, dpr = 1, feltro = null, vivo = true, t = 0, ultimo = performance.now();
    let est = { tabuleiro: [], mao: [], oponente: 0, minhaVez: false, situacao: 0, abertura: null, eu: 0, adv: 0, venci: null };
    let sel = null, hover = null, pilhaHover = false, drag = null, pendente = null, tremor = 0, tremorK = null, fimVisto = false;
    const anim = new Map(), impactos = new Set(), particulas = [], textos = [];
    let geo = null, cadeia = { lista: [], pos: new Map(), L: null, R: null };

    const ro = new ResizeObserver(() => {
        const r = canvas.parentElement.getBoundingClientRect();
        dpr = devicePixelRatio || 1; W = Math.max(1, r.width); H = Math.max(1, r.height);
        canvas.width = W * dpr; canvas.height = H * dpr;
        canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
        feltro = criarFeltro(W, H, dpr);
    });
    ro.observe(canvas.parentElement);

    // ---------- geometria ----------
    function calcular() {
        const m = 26, n = Math.max(est.mao.length, 7);
        const uH = Math.max(16, Math.min(40, (W - 2 * m - 170) / (n * 1.2), H * .075));
        const maoY = H - m - uH * 1.1;
        const u0 = Math.max(9, Math.min(17, (W - 2 * m - 40) / (Math.max(est.oponente, 7) * 1.35), H * .033));
        const opY = m + u0 + 6;
        const zonaW = Math.max(46, Math.min(86, W * .085));
        const topo = opY + u0 + 22, base = maoY - uH * 1.5 - 40;
        const area = { x: m + zonaW + 12, y: topo, w: W - 2 * (m + zonaW + 12), h: Math.max(40, base - topo) };
        const pilha = { x: W - m - 46, y: maoY, u: Math.min(18, uH * .55) };
        return {
            m, uH, maoY, u0, opY, area, pilha,
            esq: { x: m + 6, y: area.y, w: zonaW, h: area.h },
            dir: { x: W - m - 6 - zonaW, y: area.y, w: zonaW, h: area.h },
        };
    }

    // Orienta a cadeia para que as pontas vizinhas coincidam (a = esquerda, b = direita).
    function orientar(tab) {
        const r = tab.map(p => ({ a: p.valorA, b: p.valorB, k: chave(p) }));
        if (r.length > 1) {
            const s = [r[1].a, r[1].b];
            if (!s.includes(r[0].b) && s.includes(r[0].a)) [r[0].a, r[0].b] = [r[0].b, r[0].a];
        }
        for (let i = 1; i < r.length; i++) {
            const prev = r[i - 1].b;
            if (r[i].a !== prev && r[i].b === prev) [r[i].a, r[i].b] = [r[i].b, r[i].a];
        }
        return r;
    }

    // Layout em serpente: linhas alternam de direção, encolhe até caber.
    function serpente(r, area) {
        let u = Math.min(34, area.h / 2.4, area.w / 7), linhas;
        for (; ;) {
            const gap = u * .08; linhas = [[]]; let w = 0;
            for (const p of r) {
                const tw = (p.a === p.b ? u : 2 * u) + gap;
                if (w + tw > area.w && linhas.at(-1).length) { linhas.push([]); w = 0; }
                linhas.at(-1).push(p); w += tw;
            }
            if (linhas.length * u * 2.25 <= area.h || u < 9) break;
            u *= .92;
        }
        const gap = u * .08, rowH = u * 2.25, topo = area.y + (area.h - linhas.length * rowH) / 2;
        const pos = new Map();
        linhas.forEach((ln, i) => {
            const dir = linhas.length > 1 && i % 2 ? -1 : 1;
            const tot = ln.reduce((s, p) => s + (p.a === p.b ? u : 2 * u) + gap, 0) - gap;
            let x = linhas.length === 1 ? area.x + (area.w - tot) / 2 : dir === 1 ? area.x : area.x + area.w;
            const y = topo + rowH * (i + .5);
            for (const p of ln) {
                const dupla = p.a === p.b, tw = dupla ? u : 2 * u;
                pos.set(p.k, { x: x + dir * tw / 2, y, u, rot: dupla ? Math.PI / 2 : 0, a: dir === 1 ? p.a : p.b, b: dir === 1 ? p.b : p.a, alpha: 1 });
                x += dir * (tw + gap);
            }
        });
        return pos;
    }

    const pecaDe = k => est.mao.find(p => chave(p) === k);
    const interativo = () => est.situacao === 1 && est.minhaVez && !pendente;

    function lados(k) {
        const p = pecaDe(k); if (!p) return [];
        if (!est.tabuleiro.length) {
            const ab = est.abertura;
            return !ab || chave(ab) === k ? [0] : [];
        }
        const r = [];
        if (p.valorA === cadeia.L || p.valorB === cadeia.L) r.push(0);
        if (p.valorA === cadeia.R || p.valorB === cadeia.R) r.push(1);
        return r;
    }

    function posMao(i, n) {
        const sp = geo.uH * 1.2;
        return { x: W / 2 - (n - 1) * sp / 2 + i * sp, y: geo.maoY };
    }

    // ---------- animação ----------
    function mover(k, alvo, origem, f) {
        let a = anim.get(k);
        if (!a) { a = { ...alvo, ...origem }; anim.set(k, a); }
        a.x += (alvo.x - a.x) * f; a.y += (alvo.y - a.y) * f; a.u += (alvo.u - a.u) * f;
        let d = alvo.rot - a.rot; d = Math.atan2(Math.sin(d), Math.cos(d)); a.rot += d * f;
        a.alpha += ((alvo.alpha ?? 1) - a.alpha) * f;
        a.vivo = true;
        return a;
    }

    function explodir(x, y, n, cores, forca = 1) {
        for (let i = 0; i < n; i++) {
            const ang = Math.random() * Math.PI * 2, v = (60 + Math.random() * 220) * forca;
            particulas.push({ x, y, vx: Math.cos(ang) * v, vy: Math.sin(ang) * v - 60, vida: 1, dur: .6 + Math.random() * .8,
                r: 1.5 + Math.random() * 2.5, cor: cores[i % cores.length], g: 260 });
        }
    }

    function confete() {
        const cores = [OURO, '#ff5e5b', '#4ecdc4', '#ffffff', '#8e7dff', '#7bd389'];
        for (let i = 0; i < 260; i++)
            particulas.push({ x: Math.random() * W, y: -20 - Math.random() * H * .6, vx: (Math.random() - .5) * 60, vy: 40 + Math.random() * 90,
                vida: 1, dur: 4 + Math.random() * 3, r: 3 + Math.random() * 4, cor: cores[i % cores.length], g: 30, confete: true, giro: Math.random() * 6 });
    }

    function texto(s, x, y, tam, cor, alpha = 1, estilo = '700') {
        ctx.save(); ctx.globalAlpha = alpha; ctx.font = `${estilo} ${tam}px ${FONTE}`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.shadowColor = 'rgba(0,0,0,.6)'; ctx.shadowBlur = 8; ctx.fillStyle = cor; ctx.fillText(s, x, y);
        ctx.restore();
    }

    function zonaDe(p) {
        if (!geo || est.situacao !== 1) return null;
        const dentro = z => p.x >= z.x && p.x <= z.x + z.w && p.y >= z.y && p.y <= z.y + z.h;
        if (!est.tabuleiro.length) return dentro(geo.area) || dentro(geo.esq) || dentro(geo.dir) ? 0 : null;
        if (dentro(geo.esq)) return 0;
        if (dentro(geo.dir)) return 1;
        return null;
    }

    function zonaSolta(p, k) {
        const z = zonaDe(p); if (z !== null) return z;
        const a = geo.area;
        if (p.x < a.x || p.x > a.x + a.w || p.y < a.y || p.y > a.y + a.h) return null;
        const l = lados(k);
        return l.length === 1 ? l[0] : p.x < W / 2 ? 0 : 1; // solta em qualquer lugar da mesa
    }

    function acharMao(p) {
        for (let i = est.mao.length - 1; i >= 0; i--) {
            const k = chave(est.mao[i]), a = anim.get(k);
            if (a && Math.abs(p.x - a.x) <= a.u / 2 + 2 && Math.abs(p.y - a.y) <= a.u + 2) return k;
        }
        return null;
    }

    const naPilha = p => geo && Math.abs(p.x - geo.pilha.x) < geo.pilha.u * 1.3 && Math.abs(p.y - geo.pilha.y) < geo.pilha.u * 1.6;

    function jogar(k, lado) {
        const p = pecaDe(k); if (!p) return;
        pendente = { k, lado }; sel = null;
        dotnet.invokeMethodAsync('Jogar', p.valorA, p.valorB, lado);
    }

    // ---------- entrada ----------
    const pt = e => { const r = canvas.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };

    canvas.addEventListener('pointerdown', e => {
        const p = pt(e), k = acharMao(p);
        if (k && interativo()) {
            drag = { k, sx: p.x, sy: p.y, x: p.x, y: p.y, moved: false };
            canvas.setPointerCapture(e.pointerId);
            return;
        }
        if (sel && interativo()) {
            const z = zonaSolta(p, sel);
            if (z !== null && lados(sel).includes(z)) { jogar(sel, z); return; }
        }
        if (naPilha(p) && interativo()) { dotnet.invokeMethodAsync('Comprar'); return; }
        sel = null;
    });

    canvas.addEventListener('pointermove', e => {
        const p = pt(e);
        if (drag) {
            drag.x = p.x; drag.y = p.y;
            if (Math.hypot(p.x - drag.sx, p.y - drag.sy) > 6) drag.moved = true;
            return;
        }
        hover = interativo() ? acharMao(p) : null;
        pilhaHover = interativo() && naPilha(p);
        const zona = sel && interativo() && zonaSolta(p, sel) !== null;
        canvas.style.cursor = hover || pilhaHover || zona ? 'pointer' : 'default';
    });

    canvas.addEventListener('pointerup', e => {
        if (!drag) return;
        const d = drag; drag = null;
        if (!d.moved) {
            if (sel === d.k) {
                const l = lados(d.k);
                if (l.length === 1) jogar(d.k, l[0]); else sel = null;  // 2º clique joga se só cabe num lado
            } else sel = d.k;
            return;
        }
        const z = zonaSolta(pt(e), d.k);
        if (z !== null) jogar(d.k, z);
    });

    canvas.addEventListener('pointerleave', () => { hover = null; pilhaHover = false; });

    // ---------- quadro ----------
    function quadro(agora) {
        if (!vivo) return;
        const dt = Math.min(.05, (agora - ultimo) / 1000); ultimo = agora; t += dt;
        tremor = Math.max(0, tremor - dt * 2.2);
        desenhar(dt);
        requestAnimationFrame(quadro);
    }

    function desenhar(dt) {
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, W, H);
        if (feltro) ctx.drawImage(feltro, 0, 0, W, H);
        geo = calcular();
        const f = 1 - Math.pow(.0004, dt);
        for (const a of anim.values()) a.vivo = false;

        // brilho do turno
        if (est.situacao === 1) {
            const y = est.minhaVez ? geo.maoY : geo.opY, raio = W * .38;
            const gg = ctx.createRadialGradient(W / 2, y, 0, W / 2, y, raio);
            gg.addColorStop(0, `rgba(255,205,90,${.13 + .06 * Math.sin(t * 3)})`); gg.addColorStop(1, 'rgba(255,205,90,0)');
            ctx.fillStyle = gg; ctx.fillRect(0, y - raio, W, raio * 2);
        }

        // zonas de encaixe
        const ativa = interativo() ? (drag?.moved ? drag.k : sel) : null;
        if (ativa) {
            const l = lados(ativa), pulso = .5 + .5 * Math.sin(t * 5);
            const zonas = est.tabuleiro.length
                ? [[geo.esq, 0, `◀ ${cadeia.L}`], [geo.dir, 1, `${cadeia.R} ▶`]]
                : [[geo.area, 0, 'Solte aqui para abrir']];
            for (const [z, lado, rot] of zonas) {
                const ok = l.includes(lado);
                rr(ctx, z.x, z.y, z.w, z.h, 12);
                ctx.fillStyle = ok ? `rgba(255,210,100,${.07 + .07 * pulso})` : 'rgba(0,0,0,.18)'; ctx.fill();
                ctx.setLineDash([8, 6]); ctx.lineDashOffset = -t * 20;
                ctx.strokeStyle = ok ? `rgba(255,214,110,${.5 + .4 * pulso})` : 'rgba(255,255,255,.12)'; ctx.lineWidth = 2; ctx.stroke();
                ctx.setLineDash([]);
                texto(rot, z.x + z.w / 2, z.y + z.h / 2, est.tabuleiro.length ? 26 : 22, ok ? OURO : 'rgba(255,255,255,.3)', 1, est.tabuleiro.length ? '700' : 'italic 600');
            }
        }

        // mesa
        const pos = cadeia.pos = serpente(cadeia.lista, geo.area);
        cadeia.lista.forEach((c, i) => {
            const alvo = pos.get(c.k);
            const a = mover(c.k, alvo, { x: W / 2, y: geo.opY, u: geo.u0, rot: Math.PI / 2, alpha: 0 }, f);
            const ponta = ativa && ((i === 0 && lados(ativa).includes(0)) || (i === cadeia.lista.length - 1 && lados(ativa).includes(1)));
            desenharPedra(ctx, a.x, a.y, a.u, alvo.a, alvo.b, { rot: a.rot, alpha: a.alpha, brilho: ponta ? .5 + .4 * Math.sin(t * 5) : 0 });
            if (impactos.has(c.k) && Math.hypot(a.x - alvo.x, a.y - alvo.y) < 3) {
                impactos.delete(c.k);
                explodir(alvo.x, alvo.y, 18, ['#fff8e0', OURO], .5);
            }
        });

        // mão do adversário (viradas)
        for (let i = 0; i < est.oponente; i++) {
            const sp = geo.u0 * 1.3;
            const alvo = { x: W / 2 - (est.oponente - 1) * sp / 2 + i * sp, y: geo.opY, u: geo.u0, rot: Math.PI / 2, alpha: 1 };
            const a = mover('op' + i, alvo, { alpha: 0, y: geo.opY - 30 }, f);
            desenharPedra(ctx, a.x, a.y, a.u, 0, 0, { rot: a.rot, alpha: a.alpha, verso: true, elev: .6 });
        }

        // cava (comprar)
        if (est.situacao === 1) {
            const p = geo.pilha, semJogada = est.minhaVez && !est.mao.some(x => lados(chave(x)).length);
            for (let i = 2; i >= 0; i--)
                desenharPedra(ctx, p.x, p.y - i * 4, p.u, 0, 0, {
                    verso: true, elev: .5,
                    brilho: i === 0 && (pilhaHover || (semJogada && !pendente)) ? .5 + .4 * Math.sin(t * 5) : 0
                });
            texto('COMPRAR', p.x, p.y - p.u * 1.25, 11, est.minhaVez ? OURO : 'rgba(255,255,255,.35)', 1, '700');
        }

        // minha mão
        const n = est.mao.length;
        let arrastada = null;
        est.mao.forEach((p, i) => {
            const k = chave(p), base = posMao(i, n);
            let alvo = { x: base.x, y: base.y - (sel === k ? geo.uH * .5 : hover === k ? geo.uH * .22 : 0), u: geo.uH, rot: Math.PI / 2, alpha: 1 };
            if (drag?.moved && drag.k === k) alvo = { x: drag.x, y: drag.y, u: geo.uH * 1.15, rot: Math.PI / 2, alpha: 1 };
            if (pendente?.k === k) {
                const z = !est.tabuleiro.length ? geo.area : pendente.lado ? geo.dir : geo.esq;
                alvo = { x: z.x + z.w / 2, y: z.y + z.h / 2, u: geo.uH, rot: 0, alpha: .9 };
            }
            if (tremorK === k && tremor > 0) alvo.x += Math.sin(t * 55) * tremor * 10;
            const a = mover(k, alvo, { x: geo.pilha.x, y: geo.pilha.y, u: geo.pilha.u, rot: 0, alpha: 0 }, drag?.k === k && drag.moved ? 1 : f);
            const cabe = !est.minhaVez || lados(k).length > 0;
            const o = { rot: a.rot, alpha: a.alpha, apagada: est.situacao === 1 && !cabe, elev: sel === k || drag?.k === k ? 2.2 : 1,
                brilho: est.abertura && chave(est.abertura) === k ? .6 + .3 * Math.sin(t * 4) : sel === k ? .55 : 0 };
            if (drag?.k === k || pendente?.k === k) arrastada = [a, p, o];
            else desenharPedra(ctx, a.x, a.y, a.u, p.valorA, p.valorB, o);
        });
        if (arrastada) { const [a, p, o] = arrastada; desenharPedra(ctx, a.x, a.y, a.u, p.valorA, p.valorB, o); }

        for (const [k, a] of anim) if (!a.vivo) anim.delete(k);

        // legenda
        if (est.situacao === 1) {
            const msg = pendente ? 'Jogando…'
                : est.minhaVez ? (!est.tabuleiro.length && est.abertura ? `Sua vez — abra com ${est.abertura.valorA}|${est.abertura.valorB}`
                    : est.mao.some(x => lados(chave(x)).length) ? 'Sua vez — arraste uma pedra até uma ponta' : 'Nenhuma pedra encaixa — compre na cava')
                    : 'Aguardando o adversário…';
            texto(msg, W / 2, geo.maoY - geo.uH * 1.5 - 18, Math.max(13, Math.min(18, W / 45)), est.minhaVez ? '#fff4d0' : 'rgba(255,255,255,.55)', 1, 'italic 600');
        }

        // partículas e textos flutuantes
        for (let i = particulas.length - 1; i >= 0; i--) {
            const q = particulas[i];
            q.vida -= dt / q.dur; if (q.vida <= 0 || q.y > H + 20) { particulas.splice(i, 1); continue; }
            q.vy += q.g * dt; q.x += q.vx * dt; q.y += q.vy * dt;
            ctx.globalAlpha = Math.min(1, q.vida * 2); ctx.fillStyle = q.cor;
            if (q.confete) {
                q.giro += dt * 6;
                ctx.save(); ctx.translate(q.x, q.y); ctx.rotate(q.giro); ctx.fillRect(-q.r, -q.r / 2.5, q.r * 2, q.r * Math.abs(Math.cos(q.giro)) * .8 + 1); ctx.restore();
            } else { ctx.beginPath(); ctx.arc(q.x, q.y, q.r, 0, 7); ctx.fill(); }
        }
        ctx.globalAlpha = 1;
        for (let i = textos.length - 1; i >= 0; i--) {
            const s = textos[i];
            s.vida -= dt / 1.8; if (s.vida <= 0) { textos.splice(i, 1); continue; }
            const e = 1 - s.vida;
            texto(s.txt, s.x, s.y - e * 60, 34 + 16 * Math.min(1, e * 6), OURO, Math.min(1, s.vida * 2.5));
        }
    }

    requestAnimationFrame(quadro);

    return {
        atualizar(novo) {
            const antes = new Set(est.tabuleiro.map(chave));
            if (geo && novo.eu > est.eu) {
                textos.push({ txt: `+${novo.eu - est.eu}`, x: W / 2, y: geo.area.y + geo.area.h * .7, vida: 1 });
                explodir(W / 2, geo.area.y + geo.area.h / 2, 70, [OURO, '#fff3c4', '#ffb347']);
            }
            if (geo && novo.adv > est.adv) {
                textos.push({ txt: `+${novo.adv - est.adv}`, x: W / 2, y: geo.opY + 40, vida: 1 });
                explodir(W / 2, geo.opY + 20, 40, ['#ff8a80', '#ffffff']);
            }
            est = { ...novo, tabuleiro: novo.tabuleiro ?? [], mao: novo.mao ?? [] };
            cadeia.lista = orientar(est.tabuleiro);
            cadeia.L = cadeia.lista[0]?.a ?? null; cadeia.R = cadeia.lista.at(-1)?.b ?? null;
            for (const k of cadeia.lista.map(c => c.k)) if (!antes.has(k)) impactos.add(k);
            pendente = null;
            if (sel && !pecaDe(sel)) sel = null;
            if (est.situacao === 2 && !fimVisto) { fimVisto = true; if (est.venci) confete(); }
        },
        recusar() {
            if (pendente) { tremorK = pendente.k; tremor = 1; pendente = null; }
        },
        destruir() { vivo = false; ro.disconnect(); },
    };
}

// Fundo do site: pedras flutuando devagar.
export function criarFundo(canvas) {
    const ctx = canvas.getContext('2d');
    let W = 0, H = 0, dpr = 1, vivo = true, ultimo = performance.now();
    const tam = () => {
        dpr = devicePixelRatio || 1; W = innerWidth; H = innerHeight;
        canvas.width = W * dpr; canvas.height = H * dpr;
    };
    tam(); addEventListener('resize', tam);
    const nova = inicio => ({
        x: Math.random() * W, y: inicio ? Math.random() * H : H + 80, u: 12 + Math.random() * 24,
        a: Math.floor(Math.random() * 7), b: Math.floor(Math.random() * 7),
        rot: Math.random() * 6.28, vr: (Math.random() - .5) * .35, vy: 8 + Math.random() * 20, alpha: .08 + Math.random() * .16,
    });
    const pedras = Array.from({ length: Math.min(22, Math.round(W * H / 60000) + 8) }, () => nova(true));
    function quadro(agora) {
        if (!vivo) return;
        const dt = Math.min(.05, (agora - ultimo) / 1000); ultimo = agora;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H);
        pedras.forEach((p, i) => {
            p.y -= p.vy * dt; p.rot += p.vr * dt;
            if (p.y < -80) pedras[i] = nova(false);
            desenharPedra(ctx, p.x, p.y, p.u, p.a, p.b, { rot: p.rot, alpha: p.alpha, elev: .5 });
        });
        requestAnimationFrame(quadro);
    }
    requestAnimationFrame(quadro);
    return { destruir() { vivo = false; removeEventListener('resize', tam); } };
}

export const copiar = texto => navigator.clipboard.writeText(texto);
