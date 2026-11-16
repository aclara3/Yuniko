/* =========================================================
   Dados do site — edite aqui os produtos, favoritos e novidades.
   img: caminho da imagem (deixe null para usar o placeholder)
   cat: categoria principal  | sub: subcategoria (opcional)
   top: true = aparece em "Mais vendidos"
   ========================================================= */
window.YUNIKU_DATA = {
  storeName: 'Yuniku',

  products: [
    { id: 1,  nome: 'Yum-Yum Probiotic Drink', preco: 6.9,  img: 'yum-yum.png',        cat: 'bebidas', sub: 'nao-alcoolicos', top: true },
    { id: 2,  nome: 'Lámen shoyu',             preco: 32,   img: 'ramen.png',          cat: 'salgados', sub: 'lamen',     top: true },
    { id: 3,  nome: 'Yopokki queijo',          preco: 18.9, img: 'yopokki-queijo.png', cat: 'salgados', sub: null,        top: true },
    { id: 4,  nome: 'Yopokki doce e picante',  preco: 18.9, img: 'yopokki-picante.png',cat: 'salgados', sub: null,        top: false },
    { id: 5,  nome: 'Lámen missô',             preco: 34,   img: 'ramen.png',          cat: 'salgados', sub: 'lamen',     top: false },
    { id: 6,  nome: 'Gyoza (6 un.)',           preco: 22,   img: null,                     cat: 'salgados', sub: 'japonesa',  top: true },
    { id: 7,  nome: 'Yakisoba',                preco: 28,   img: null,                     cat: 'salgados', sub: 'japonesa',  top: false },
    { id: 8,  nome: 'Dim sum (4 un.)',         preco: 26,   img: null,                     cat: 'salgados', sub: 'chinesa',   top: false },
    { id: 9,  nome: 'Chow mein',               preco: 29,   img: null,                     cat: 'salgados', sub: 'chinesa',   top: false },
    { id: 10, nome: 'Pad thai',                preco: 33,   img: null,                     cat: 'salgados', sub: 'tailandesa',top: false },
    { id: 11, nome: 'Tom yum',                 preco: 35,   img: null,                     cat: 'salgados', sub: 'tailandesa',top: false },
    { id: 12, nome: 'Mochi (3 un.)',           preco: 14,   img: null,                     cat: 'doces',    sub: null,        top: true },
    { id: 13, nome: 'Dorayaki',                preco: 12,   img: null,                     cat: 'doces',    sub: null,        top: false },
    { id: 14, nome: 'Saquê junmai',            preco: 48,   img: null,                     cat: 'bebidas',  sub: 'alcoolicos',top: false },
    { id: 15, nome: 'Cerveja japonesa',        preco: 14,   img: null,                     cat: 'bebidas',  sub: 'alcoolicos',top: false },
    { id: 16, nome: 'Chá verde gelado',        preco: 8,    img: null,                     cat: 'bebidas',  sub: 'nao-alcoolicos', top: false }
  ],

  // Os 3 cartões abaixo da lista de favoritos (ids de products)
  favoritosCards: [1, 2, 3],

  // Lista do painel "favoritos"
  favoritos: [
    { id: 101, nome: 'X- Bacon',            preco: 15, desc: 'Pão, hambúrguer, queijo, bacon e picles.' },
    { id: 102, nome: 'Pizza de pepperoni',  preco: 25, desc: 'Pepperoni, queijo e orégano.' },
    { id: 103, nome: 'Hambúrguer vegetariano', preco: 35, desc: 'Pão, hambúrguer de jaca, queijo, molho especial e alface.' }
  ],

  // Cartão "NOVIDADES" (ids de products)
  novidades: [3, 4],

  cupons: { YUNIKU10: 0.10 }
};

// Itens do painel de favoritos também podem ser comprados: entram no catálogo interno.
window.YUNIKU_DATA.favoritos.forEach(f => window.YUNIKU_DATA.products.push({ id: f.id, nome: f.nome, preco: f.preco, img: null, cat: 'salgados', sub: null, top: false, oculto: true }));
