/* carrinho.js — página do carrinho, histórico e exportação do pedido em JSON */
(function () {
  const Y = window.Yuniku, { esc, brl, ICON, cart } = Y;
  let couponOpen = false;

  const pad = n => String(n).padStart(2, '0');
  const plural = n => n === 1 ? '1 item' : n + ' itens';

  function renderCart() {
    const items = cart.items(), n = cart.count();
    document.getElementById('cart-title').textContent = 'Seu carrinho contém ' + plural(n);

    document.getElementById('cart-items').innerHTML = items.length ? items.map(i => {
      const p = Y.byId(i.id);
      const img = p.img ? `<img src="${esc(p.img)}" alt="" />` : `<img src="img/placeholder.png" alt="" />`;
      return `<div class="cart-row">
        <div class="cart-thumb">${img}</div>
        <div class="cart-info"><span class="nm">${esc(p.nome)}</span><span class="pr">${brl(p.preco * i.qty)}</span></div>
        <div class="qty" role="group" aria-label="Quantidade de ${esc(p.nome)}">
          <button type="button" data-dec="${p.id}" aria-label="Diminuir">−</button>
          <span aria-live="polite">${i.qty}</span>
          <button type="button" data-inc="${p.id}" aria-label="Aumentar">+</button>
        </div>
      </div>`;
    }).join('') : `<p class="cart-empty">Seu carrinho está vazio.<br><a href="index.html#produtos">Ver produtos</a></p>`;

    document.getElementById('total-value').textContent = brl(cart.total());

    const c = cart.coupon(), row = document.getElementById('coupon-row');
    if (c) {
      row.innerHTML = `<span class="coupon-msg">Cupom ${esc(c.code)}: −${Math.round(c.rate * 100)}% (−${brl(cart.subtotal() * c.rate)})</span><button type="button" id="coupon-remove">Remover</button>`;
    } else if (couponOpen) {
      row.innerHTML = `<input id="coupon-input" placeholder="Código do cupom" aria-label="Código do cupom" maxlength="20" /><button type="button" id="coupon-apply">Aplicar</button><span class="coupon-msg" id="coupon-msg" role="alert"></span>`;
      document.getElementById('coupon-input').focus();
    } else {
      row.innerHTML = `<button type="button" id="coupon-open">${ICON.tag}Adicionar cupom</button>`;
    }
    document.getElementById('checkout').disabled = items.length === 0;
  }

  function renderOrders() {
    const orders = cart.orders(), box = document.getElementById('orders-body');
    if (!orders.length) {
      box.innerHTML = '<p class="orders-empty">você não tem<br>histórico de pedidos</p>';
      return;
    }
    box.innerHTML = '<ul class="orders-list">' + orders.map(o => {
      const d = new Date(o.quando);
      const resumo = o.itens.map(i => i.qty + '× ' + i.nome).join(', ');
      return `<li class="order">${ICON.clock}
        <div class="info"><div class="store">${esc(o.loja)}</div><div class="prod" title="${esc(resumo)}">${esc(resumo)}</div></div>
        <div class="when">${pad(d.getDate())}/${pad(d.getMonth() + 1)}<br>${pad(d.getHours())}:${pad(d.getMinutes())}</div></li>`;
    }).join('') + '</ul>';
  }

  // Cria o arquivo usando os mesmos produtos, quantidades e preços do carrinho.
  function baixarPedidoJSON() {
    const itens = cart.items();
    const agora = new Date();
    const codigo = 'YUN-' + agora.getTime();
    const cupom = cart.coupon();
    const subtotal = cart.subtotal();
    const desconto = cupom ? subtotal * cupom.rate : 0;

    // O projeto ainda não possui login conectado ao banco; por isso usuario_id fica null.
    const pedido = {
      codigo_pedido: codigo,
      usuario_id: null,
      nome_loja: Y.data.storeName,
      data_pedido: agora.toISOString(),
      valor_total: Number(cart.total().toFixed(2)),
      status: 'Pendente',
      subtotal: Number(subtotal.toFixed(2)),
      desconto: Number(desconto.toFixed(2)),
      cupom: cupom ? cupom.code : null,
      itens: itens.map(item => {
        const produto = Y.byId(item.id);
        return {
          produto_id: produto.id,
          nome: produto.nome,
          quantidade: item.qty,
          preco_unitario: Number(produto.preco.toFixed(2)),
          subtotal: Number((produto.preco * item.qty).toFixed(2))
        };
      })
    };

    const arquivo = new Blob(
      [JSON.stringify(pedido, null, 2)],
      { type: 'application/json;charset=utf-8' }
    );
    const url = URL.createObjectURL(arquivo);
    const link = document.createElement('a');
    link.href = url;
    link.download = codigo + '.json';
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  document.addEventListener('click', e => {
    const t = e.target.closest('button');
    if (!t) return;

    if (t.dataset.inc) {
      const it = cart.items().find(i => i.id === +t.dataset.inc);
      if (it) cart.setQty(+t.dataset.inc, it.qty + 1);
      renderCart();
    } else if (t.dataset.dec) {
      const it = cart.items().find(i => i.id === +t.dataset.dec);
      if (it) cart.setQty(+t.dataset.dec, it.qty - 1);
      renderCart();
    } else if (t.id === 'coupon-open') {
      couponOpen = true;
      renderCart();
    } else if (t.id === 'coupon-remove') {
      cart.clearCoupon();
      couponOpen = false;
      renderCart();
    } else if (t.id === 'coupon-apply') {
      applyCoupon();
    } else if (t.id === 'checkout') {
      if (!cart.items().length) return;

      // Primeiro exporta os dados; depois registra o histórico e esvazia o carrinho.
      baixarPedidoJSON();
      const pedidoSalvo = cart.checkout();
      if (!pedidoSalvo) return;

      couponOpen = false;
      renderCart();
      renderOrders();
      Y.toast('Pedido concluído! O arquivo JSON foi baixado.');
    }
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Enter' && e.target.id === 'coupon-input') {
      e.preventDefault();
      applyCoupon();
    }
  });

  function applyCoupon() {
    const input = document.getElementById('coupon-input');
    const v = input ? input.value : '';
    if (cart.setCoupon(v)) {
      couponOpen = false;
      renderCart();
      Y.toast('Cupom aplicado');
    } else {
      document.getElementById('coupon-msg').textContent = 'Cupom inválido. Confira o código.';
    }
  }

  window.addEventListener('storage', () => {
    renderCart();
    renderOrders();
  });

  document.addEventListener('DOMContentLoaded', () => {
    renderCart();
    renderOrders();
  });
})();
