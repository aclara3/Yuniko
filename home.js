/* home.js — página inicial: favoritos, novidades, produtos, categorias e busca */
(function () {
  const Y = window.Yuniku, D = Y.data, { esc, brl, ICON } = Y;
  const norm = s => String(s).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const state = { cat: null, sub: null, top: false, q: '' };

  const imgTag = p => p.img ? `<img src="${esc(p.img)}" alt="${esc(p.nome)}" loading="lazy" />` : `<img class="is-placeholder" src="img/placeholder.png" alt="" loading="lazy" />`;

  function card(p, withText) {
    return `<article class="pcard">
      <div class="pimg">${imgTag(p)}</div>
      <div class="pinfo"><span>${esc(p.nome)}</span><b>${brl(p.preco)}</b></div>
      <button class="add" type="button" data-add="${p.id}" aria-label="Adicionar ${esc(p.nome)} ao carrinho">${withText ? '<span>adicionar ao carrinho</span>' : ICON.cartPlus}</button>
    </article>`;
  }

  /* favoritos */
  function renderFavoritos() {
    document.getElementById('fav-list').innerHTML = D.favoritos.map(f => `
      <li><button class="fav-item" type="button" data-add="${f.id}" aria-label="Adicionar ${esc(f.nome)} ao carrinho">
        <span class="row"><span class="name">${esc(f.nome)}</span><span class="dots"></span><span class="price">R$${f.preco}</span></span>
        <span class="desc">${esc(f.desc)}</span>
      </button></li>`).join('');
    document.getElementById('fav-cards').innerHTML = D.favoritosCards.map(id => card(Y.byId(id), true)).join('');
    document.getElementById('nov').innerHTML = D.novidades.map(id => {
      const p = Y.byId(id);
      return `<div class="nov-item"><img src="${esc(p.img)}" alt="${esc(p.nome)}" /><button class="buy" type="button" data-add="${p.id}" aria-label="Comprar ${esc(p.nome)}">COMPRE JÁ!</button></div>`;
    }).join('');
  }

  /* produtos + filtros */
  function visible() {
    return D.products.filter(p => {
      if (p.oculto) return false;
      if (state.top && !p.top) return false;
      if (state.cat && p.cat !== state.cat) return false;
      if (state.sub && p.sub !== state.sub) return false;
      if (state.q && !norm(p.nome + ' ' + p.cat + ' ' + (p.sub || '')).includes(norm(state.q))) return false;
      return true;
    });
  }
  function renderGrid() {
    const list = visible(), grid = document.getElementById('product-grid');
    grid.innerHTML = list.length ? list.map(p => card(p, false)).join('') : '<p class="empty-grid">Nenhum produto encontrado. Tente outra busca ou categoria.</p>';
    document.querySelectorAll('.cats [data-top]').forEach(b => b.setAttribute('aria-pressed', String(state.top)));
    document.querySelectorAll('.cats [data-cat]').forEach(b => {
      const sub = b.dataset.sub || null;
      b.setAttribute('aria-pressed', String(!state.top && state.cat === b.dataset.cat && (sub ? state.sub === sub : !state.sub)));
    });
  }
  function bindCats() {
    document.querySelector('.cats').addEventListener('click', e => {
      const b = e.target.closest('button'); if (!b) return;
      if (b.id === 'cats-reset') { Object.assign(state, { cat: null, sub: null, top: false }); }
      else if (b.hasAttribute('data-top')) { const on = !state.top; Object.assign(state, { top: on, cat: null, sub: null }); }
      else if (b.dataset.cat) {
        const same = state.cat === b.dataset.cat && (state.sub || null) === (b.dataset.sub || null);
        Object.assign(state, same ? { cat: null, sub: null, top: false } : { cat: b.dataset.cat, sub: b.dataset.sub || null, top: false });
      }
      renderGrid();
    });
  }

  /* adicionar ao carrinho (delegação) */
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-add]'); if (!b) return;
    const p = Y.byId(Number(b.dataset.add)); if (!p) return;
    Y.cart.add(p.id, 1); Y.toast(p.nome + ' foi para o carrinho');
  });

  window.addEventListener('yuniku:search', e => { state.q = e.detail || ''; renderGrid(); });

  document.addEventListener('DOMContentLoaded', () => {
    const q = new URLSearchParams(location.search).get('q'); if (q) state.q = q;
    renderFavoritos(); renderGrid(); bindCats();
    if (q) document.getElementById('produtos').scrollIntoView();
  });
})();
