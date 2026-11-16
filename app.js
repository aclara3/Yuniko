/* =========================================================
   app.js — código compartilhado pelas duas páginas:
   tema, cabeçalho, rodapé, modal de perfil, localStorage,
   carrinho (funções) e avisos.
   ========================================================= */
(function () {
  const D = window.YUNIKU_DATA;
  const K = { theme: 'yuniku:tema', profile: 'yuniku:perfil', cart: 'yuniku:carrinho', orders: 'yuniku:pedidos', coupon: 'yuniku:cupom' };

  /* ---------- localStorage (com proteção) ---------- */
  const store = {
    get(key, fallback) { try { const v = localStorage.getItem(key); return v === null ? fallback : JSON.parse(v); } catch (e) { return fallback; } },
    set(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* cota cheia / bloqueado */ } },
    del(key) { try { localStorage.removeItem(key); } catch (e) {} }
  };

  const brl = n => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }).replace(/\u00a0/g, ' ');
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const byId = id => D.products.find(p => p.id === id);

  /* ---------- tema ---------- */
  function getTheme() { return document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light'; }
  function setTheme(t) {
    if (t === 'dark') document.documentElement.setAttribute('data-theme', 'dark'); else document.documentElement.removeAttribute('data-theme');
    store.set(K.theme, t);
    const btn = document.getElementById('theme-toggle');
    if (btn) { btn.innerHTML = t === 'dark' ? ICON.moon : ICON.sun; btn.setAttribute('aria-label', t === 'dark' ? 'Ativar modo claro' : 'Ativar modo escuro'); }
  }

  /* ---------- ícones ---------- */
  const ICON = {
    sun: '<svg viewBox="0 0 32 32" aria-hidden="true"><circle cx="16" cy="16" r="6.2"/><g stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M16 2.8v3.4M16 25.8v3.4M2.8 16h3.4M25.8 16h3.4M6.7 6.7l2.4 2.4M22.9 22.9l2.4 2.4M25.3 6.7l-2.4 2.4M9.1 22.9l-2.4 2.4"/></g></svg>',
    moon: '<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M21.5 4.2A12.4 12.4 0 1 0 27.8 22 10.4 10.4 0 0 1 21.5 4.2z"/></svg>',
    search: '<svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="8.5" cy="8.5" r="5.8"/><path d="M13 13l5 5"/></svg>',
    pin: '<svg class="pin" viewBox="0 0 24 30" aria-hidden="true"><path d="M12 0C5.9 0 1 4.8 1 10.8 1 18.6 12 30 12 30s11-11.4 11-19.2C23 4.8 18.1 0 12 0zm0 15.2a4.4 4.4 0 1 1 0-8.8 4.4 4.4 0 0 1 0 8.8z"/></svg>',
    chev: '<svg class="chev" viewBox="0 0 20 20" aria-hidden="true"><path d="M3 7l7 7 7-7"/></svg>',
    cart: '<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M1.5 3.5h5l1.2 4.2H29a1 1 0 0 1 .96 1.28l-3 10.3a1.6 1.6 0 0 1-1.54 1.15H11.3a1.6 1.6 0 0 1-1.55-1.2L5.1 6.5H1.5z"/><circle cx="12" cy="26.2" r="2.6"/><circle cx="23" cy="26.2" r="2.6"/></svg>',
    user: '<svg viewBox="0 0 32 32" aria-hidden="true"><circle cx="16" cy="9.5" r="6.2"/><path d="M3.5 29c0-6.6 5.2-11 12.5-11s12.5 4.4 12.5 11z"/></svg>',
    cartPlus: '<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M2 8h7l1.8 6.4h27.5a1.4 1.4 0 0 1 1.34 1.8l-4.2 14.5a2.2 2.2 0 0 1-2.1 1.6H16.6a2.2 2.2 0 0 1-2.1-1.6L8 11.3H2z"/><circle cx="18" cy="40.5" r="3.5"/><circle cx="32" cy="40.5" r="3.5"/><circle cx="37" cy="9.5" r="8.6" fill="#fff"/><path d="M37 4.8v9.4M32.3 9.5h9.4" stroke="#c44937" stroke-width="2.6" stroke-linecap="round"/></svg>',
    chevrons: '<svg viewBox="0 0 78 72" aria-hidden="true"><path d="M6 8l33 28 33-28M6 34l33 28 33-28"/></svg>',
    filter: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2.5 4h19L14 12.6V20l-4-2v-5.4z"/></svg>',
    tag: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2.5 12.5L12 3h8.5v8.5L11 21z"/><circle cx="16.3" cy="7.7" r="1.4"/></svg>',
    clock: '<svg viewBox="0 0 34 34" aria-hidden="true"><circle cx="17" cy="17" r="14.5"/><path d="M17 8.5V17l5.5 3.5"/></svg>',
    pencil: '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M3 17l1-4L14.5 2.5a1.8 1.8 0 0 1 2.5 0l.5.5a1.8 1.8 0 0 1 0 2.5L7 16z M12.5 4.5l3 3"/></svg>',
    userBig: '<svg viewBox="0 0 32 32" aria-hidden="true"><circle cx="16" cy="11" r="7"/><path d="M2 32c0-8 6-13 14-13s14 5 14 13z"/></svg>',
    insta: '<svg viewBox="0 0 36 36" aria-hidden="true"><path fill-rule="evenodd" d="M10 3h16a7 7 0 0 1 7 7v16a7 7 0 0 1-7 7H10a7 7 0 0 1-7-7V10a7 7 0 0 1 7-7zm0 3a4 4 0 0 0-4 4v16a4 4 0 0 0 4 4h16a4 4 0 0 0 4-4V10a4 4 0 0 0-4-4zm8 5.5a6.5 6.5 0 1 1 0 13 6.5 6.5 0 0 1 0-13zm0 3a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7zm7.2-4.9a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3z"/></svg>',
    pinterest: '<svg viewBox="0 0 36 36" aria-hidden="true"><path fill-rule="evenodd" d="M18 0a18 18 0 0 0-6.6 34.7c-.2-1.5-.3-3.8 0-5.4l2.2-9.4s-.6-1.1-.6-2.8c0-2.6 1.5-4.5 3.4-4.5 1.6 0 2.4 1.2 2.4 2.6 0 1.6-1 4-1.6 6.2-.4 1.9.9 3.4 2.8 3.4 3.4 0 6-3.6 6-8.800 0-4.600-3.300-7.800-8-7.800a8.300 8.300 0 0 0-8.700 8.300c0 1.700.600 3.400 1.500 4.400.200.200.200.400.100.700l-.500 2.100c-.1.300-.3.400-.6.200-2.300-1.100-3.700-4.500-3.700-7.200 0-5.800 4.200-11.200 12.200-11.200 6.400 0 11.400 4.600 11.400 10.700 0 6.400-4 11.500-9.600 11.500-1.900 0-3.600-1-4.200-2.100l-1.200 4.400c-.4 1.600-1.500 3.600-2.300 4.800A18 18 0 1 0 18 0z"/></svg>',
    youtube: '<svg viewBox="0 0 36 36" aria-hidden="true"><path fill-rule="evenodd" d="M31.8 8.500C29.600 7.600 22.500 7.400 18 7.400s-11.600.2-13.800 1.100C2.200 9.300 2 13.600 2 18s.2 8.700 2.200 9.500c2.200.9 9.300 1.100 13.800 1.100s11.600-.2 13.800-1.100C33.800 26.700 34 22.400 34 18s-.2-8.700-2.200-9.500zM14.800 22.600v-9.200l8 4.600z"/></svg>'
  };

  /* ---------- aviso (toast) ---------- */
  let toastTimer;
  function toast(msg) {
    let t = document.getElementById('toast');
    if (!t) { t = document.createElement('div'); t.id = 'toast'; t.className = 'toast'; t.setAttribute('role', 'status'); document.body.appendChild(t); }
    t.textContent = msg; t.classList.add('show');
    clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('show'), 2200);
  }

  /* ---------- carrinho (API pública em window.Yuniku) ---------- */
  const cart = {
    items() { return store.get(K.cart, []).filter(i => byId(i.id)); },
    save(items) { store.set(K.cart, items); updateBadge(); },
    count() { return this.items().reduce((s, i) => s + i.qty, 0); },
    add(id, qty) {
      const items = this.items(); const it = items.find(i => i.id === id);
      if (it) it.qty += qty || 1; else items.push({ id, qty: qty || 1 });
      this.save(items);
    },
    setQty(id, qty) {
      let items = this.items();
      if (qty <= 0) items = items.filter(i => i.id !== id); else items.forEach(i => { if (i.id === id) i.qty = Math.min(qty, 99); });
      this.save(items);
    },
    clear() { this.save([]); },
    subtotal() { return this.items().reduce((s, i) => s + byId(i.id).preco * i.qty, 0); },
    coupon() { const c = store.get(K.coupon, null); return c && D.cupons[c] ? { code: c, rate: D.cupons[c] } : null; },
    setCoupon(code) { code = String(code || '').trim().toUpperCase(); if (D.cupons[code]) { store.set(K.coupon, code); return true; } return false; },
    clearCoupon() { store.del(K.coupon); },
    total() { const c = this.coupon(); const s = this.subtotal(); return c ? s * (1 - c.rate) : s; },
    orders() { return store.get(K.orders, []); },
    checkout() {
      const items = this.items(); if (!items.length) return null;
      const order = { id: Date.now(), loja: D.storeName, quando: new Date().toISOString(), total: this.total(), itens: items.map(i => ({ nome: byId(i.id).nome, qty: i.qty })) };
      const orders = this.orders(); orders.unshift(order); store.set(K.orders, orders.slice(0, 50));
      this.clear(); this.clearCoupon(); return order;
    }
  };

  function updateBadge() {
    const b = document.getElementById('cart-badge'); if (!b) return;
    const n = cart.count(); b.textContent = n > 99 ? '99+' : n; b.hidden = n === 0;
  }

  /* ---------- cabeçalho ---------- */
  function renderHeader() {
    const host = document.getElementById('site-header'); if (!host) return;
    const profile = store.get(K.profile, {});
    host.outerHTML = `
    <header class="site-header" id="site-header">
      <a href="index.html" class="logo-nav" aria-label="Yuniku — início"></a>
      <div class="nav-center">
        <button class="icon-btn" id="theme-toggle" type="button"></button>
        <span class="nav-divider"></span>
        <form class="search" id="search-form" role="search">
          <label class="sr-only" for="search-input">Buscar produtos</label>
          <input id="search-input" type="search" autocomplete="off" />
          <button type="submit" aria-label="Buscar">${ICON.search}</button>
        </form>
        <span class="nav-divider"></span>
        <div class="loc">
          <button class="loc-btn" id="loc-btn" type="button" aria-haspopup="true" aria-expanded="false" aria-label="Escolher local de entrega">${ICON.pin}${ICON.chev}</button>
          <form class="popover" id="loc-pop" hidden>
            <label for="loc-cep">Entregar em (CEP)</label>
            <input id="loc-cep" inputmode="numeric" maxlength="9" placeholder="00000-000" value="${esc(profile.cep || '')}" />
            <button class="btn" type="submit">Salvar CEP</button>
          </form>
        </div>
      </div>
      <div class="nav-right">
        <a class="icon-btn" href="carrinho.html" aria-label="Abrir carrinho">${ICON.cart}<span class="cart-badge" id="cart-badge" hidden>0</span></a>
        <span class="nav-divider"></span>
        <button class="icon-btn" id="profile-btn" type="button" aria-haspopup="dialog" aria-label="Abrir perfil">${ICON.user}</button>
      </div>
    </header>`;
    setTheme(getTheme());
    document.getElementById('theme-toggle').addEventListener('click', () => setTheme(getTheme() === 'dark' ? 'light' : 'dark'));

    // busca
    const form = document.getElementById('search-form'), input = document.getElementById('search-input');
    const onHome = !!document.getElementById('product-grid');
    const q0 = new URLSearchParams(location.search).get('q'); if (q0 && onHome) input.value = q0;
    form.addEventListener('submit', e => {
      e.preventDefault(); const q = input.value.trim();
      if (onHome) { window.dispatchEvent(new CustomEvent('yuniku:search', { detail: q })); document.getElementById('produtos').scrollIntoView(); }
      else location.href = 'index.html' + (q ? '?q=' + encodeURIComponent(q) : '') + '#produtos';
    });
    if (onHome) input.addEventListener('input', () => window.dispatchEvent(new CustomEvent('yuniku:search', { detail: input.value.trim() })));

    // local de entrega (CEP)
    const pop = document.getElementById('loc-pop'), lbtn = document.getElementById('loc-btn'), cepIn = document.getElementById('loc-cep');
    const togglePop = open => { pop.hidden = !open; lbtn.setAttribute('aria-expanded', String(open)); if (open) cepIn.focus(); };
    lbtn.addEventListener('click', e => { e.stopPropagation(); togglePop(pop.hidden); });
    document.addEventListener('click', e => { if (!pop.hidden && !pop.contains(e.target)) togglePop(false); });
    cepIn.addEventListener('input', () => cepIn.value = maskCep(cepIn.value));
    pop.addEventListener('submit', e => {
      e.preventDefault(); const p = store.get(K.profile, {}); p.cep = cepIn.value; store.set(K.profile, p);
      const m = document.getElementById('f-cep'); if (m) m.value = p.cep; togglePop(false); toast(p.cep ? 'CEP salvo' : 'CEP removido');
    });
    document.getElementById('profile-btn').addEventListener('click', openModal);
    updateBadge();
  }

  /* ---------- máscaras ---------- */
  function maskCep(v) { v = v.replace(/\D/g, '').slice(0, 8); return v.length > 5 ? v.slice(0, 5) + '-' + v.slice(5) : v; }
  function maskTel(v) {
    v = v.replace(/\D/g, '').slice(0, 11);
    if (v.length > 10) return `(${v.slice(0, 2)}) ${v.slice(2, 7)}-${v.slice(7)}`;
    if (v.length > 6) return `(${v.slice(0, 2)}) ${v.slice(2, 6)}-${v.slice(6)}`;
    if (v.length > 2) return `(${v.slice(0, 2)}) ${v.slice(2)}`;
    return v;
  }

  /* ---------- modal de perfil ---------- */
  let lastFocus = null;
  function renderModal() {
    const wrap = document.createElement('div');
    wrap.innerHTML = `
    <div class="modal-backdrop" id="modal-backdrop"></div>
    <aside class="modal" id="profile-modal" role="dialog" aria-modal="true" aria-labelledby="m-login" aria-hidden="true" inert>
      <div class="modal-head">
        <div class="who">
          <div class="avatar">
            <div class="pic" id="m-pic">${ICON.userBig}</div>
            <button class="edit" id="m-edit" type="button" aria-label="Alterar foto">${ICON.pencil}</button>
            <input type="file" id="m-file" accept="image/*" hidden />
          </div>
          <div class="who-text"><div class="login" id="m-login">login</div><div class="mail" id="m-mail">seu e-mail</div></div>
        </div>
        <button class="modal-close" id="m-close" type="button" aria-label="Fechar">×</button>
      </div>
      <form id="profile-form" novalidate>
        <div class="fields">
          <div class="field"><label for="f-nome">Nome</label><input id="f-nome" name="nome" placeholder="Nome" autocomplete="name" maxlength="60" /></div>
          <div class="field"><label for="f-email">E-mail</label><input id="f-email" name="email" type="email" placeholder="Add email" autocomplete="email" maxlength="80" /></div>
          <div class="field"><label for="f-tel">Telefone/Cel</label><input id="f-tel" name="tel" type="tel" inputmode="tel" placeholder="Add número" autocomplete="tel" /></div>
          <div class="field"><label for="f-cep">CEP</label><input id="f-cep" name="cep" inputmode="numeric" placeholder="Add CEP" autocomplete="postal-code" /></div>
        </div>
        <p class="form-msg" id="m-msg" role="alert"></p>
        <div class="modal-actions"><button type="button" id="m-back">Voltar</button><button type="submit">Salvar alterações</button></div>
      </form>
    </aside>`;
    document.body.append(...wrap.children);

    document.getElementById('m-close').addEventListener('click', closeModal);
    document.getElementById('m-back').addEventListener('click', closeModal);
    document.getElementById('modal-backdrop').addEventListener('click', closeModal);
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && document.body.classList.contains('modal-open')) closeModal(); });
    document.getElementById('f-tel').addEventListener('input', e => e.target.value = maskTel(e.target.value));
    document.getElementById('f-cep').addEventListener('input', e => e.target.value = maskCep(e.target.value));

    const file = document.getElementById('m-file');
    document.getElementById('m-edit').addEventListener('click', () => file.click());
    file.addEventListener('change', () => {
      const f = file.files[0]; if (!f) return;
      const img = new Image(), url = URL.createObjectURL(f);
      img.onload = () => {
        const s = 160, c = document.createElement('canvas'); c.width = c.height = s; const x = c.getContext('2d');
        const m = Math.min(img.width, img.height); x.drawImage(img, (img.width - m) / 2, (img.height - m) / 2, m, m, 0, 0, s, s);
        const p = store.get(K.profile, {}); p.foto = c.toDataURL('image/jpeg', .85); store.set(K.profile, p); URL.revokeObjectURL(url); fillModal();
      };
      img.src = url;
    });

    document.getElementById('profile-form').addEventListener('submit', e => {
      e.preventDefault();
      const f = e.target, msg = document.getElementById('m-msg');
      const email = f.email.value.trim(), tel = f.tel.value.trim(), cep = f.cep.value.trim();
      let err = '';
      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) err = 'Confira o e-mail: use o formato nome@exemplo.com.';
      else if (tel && tel.replace(/\D/g, '').length < 10) err = 'Confira o telefone: inclua o DDD.';
      else if (cep && cep.replace(/\D/g, '').length !== 8) err = 'Confira o CEP: são 8 números.';
      msg.textContent = err; if (err) return;
      const p = store.get(K.profile, {}); Object.assign(p, { nome: f.nome.value.trim(), email, tel, cep }); store.set(K.profile, p);
      const lc = document.getElementById('loc-cep'); if (lc) lc.value = cep;
      fillModal(); toast('Alterações salvas'); closeModal();
    });
    fillModal();
  }
  function fillModal() {
    const p = store.get(K.profile, {});
    document.getElementById('m-login').textContent = p.nome || 'login';
    document.getElementById('m-mail').textContent = p.email || 'seu e-mail';
    const pic = document.getElementById('m-pic');
    if (p.foto) { pic.style.backgroundImage = `url(${p.foto})`; pic.innerHTML = ''; } else { pic.style.backgroundImage = ''; pic.innerHTML = ICON.userBig; }
    const f = document.getElementById('profile-form');
    f.nome.value = p.nome || ''; f.email.value = p.email || ''; f.tel.value = p.tel || ''; f.cep.value = p.cep || '';
  }
  function openModal() {
    lastFocus = document.activeElement; fillModal(); document.getElementById('m-msg').textContent = '';
    const m = document.getElementById('profile-modal'); m.removeAttribute('inert'); m.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-open'); setTimeout(() => document.getElementById('f-nome').focus(), 120);
  }
  function closeModal() {
    const m = document.getElementById('profile-modal'); document.body.classList.remove('modal-open');
    m.setAttribute('inert', ''); m.setAttribute('aria-hidden', 'true'); if (lastFocus) lastFocus.focus();
  }

  /* ---------- rodapé ---------- */
  function renderFooter() {
    const host = document.getElementById('site-footer'); if (!host) return;
    host.outerHTML = `
    <footer class="site-footer" id="site-footer">
      <div class="foot-top"></div>
      <div class="foot-sea" aria-hidden="true"></div>
      <div class="foot-stage"><div class="foot-grid">
        <a class="foot-logo" href="index.html" aria-label="Yuniku — início"></a>
        <nav class="foot-col" style="left:calc(var(--p)*559)" aria-label="Início"><h3>Início</h3><a href="index.html">Home</a><a href="index.html#produtos">Produtos</a></nav>
        <nav class="foot-col" style="left:calc(var(--p)*841)" aria-label="Suporte"><h3>Suporte</h3><a href="#faq">FAQ</a><a href="tel:+999999999999">+99 99 99999-9999</a></nav>
        <div class="foot-social">
          <div class="icons"><a href="#" aria-label="Instagram">${ICON.insta}</a><a href="#" aria-label="Pinterest">${ICON.pinterest}</a><a href="#" aria-label="YouTube">${ICON.youtube}</a></div>
          <a class="foot-contact" href="mailto:contato@yuniku.com">Fale conosco</a>
        </div>
      </div></div>
      <div class="foot-copy">© Copyright • yuniku</div>
    </footer>`;
  }

  /* ---------- início ---------- */
  document.addEventListener('DOMContentLoaded', () => {
    renderHeader(); renderModal(); renderFooter();
    window.addEventListener('storage', updateBadge);
  });

  window.Yuniku = { store, K, brl, esc, byId, cart, ICON, toast, updateBadge, data: D };
})();
