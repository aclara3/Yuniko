-- Banco Yuniku
-- Estrutura baseada no arquivo SQL e no diagrama enviados.
-- Ajustes para armazenar todos os campos presentes no JSON do pedido.

CREATE DATABASE IF NOT EXISTS yuniku
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
USE yuniku;

CREATE TABLE IF NOT EXISTS usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    telefone VARCHAR(20),
    cep VARCHAR(10),
    tema VARCHAR(20) DEFAULT 'claro',
    idioma VARCHAR(10) DEFAULT 'PT-BR',
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS categorias (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    categoria_pai_id INT NULL,
    CONSTRAINT fk_categorias_pai
      FOREIGN KEY (categoria_pai_id) REFERENCES categorias(id)
      ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS produtos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(150) NOT NULL,
    descricao TEXT,
    preco DECIMAL(10,2) NOT NULL,
    categoria_id INT,
    eh_novidade BOOLEAN DEFAULT FALSE,
    imagem_url VARCHAR(255),
    CONSTRAINT fk_produtos_categoria
      FOREIGN KEY (categoria_id) REFERENCES categorias(id)
      ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS favoritos (
    usuario_id INT NOT NULL,
    produto_id INT NOT NULL,
    PRIMARY KEY (usuario_id, produto_id),
    CONSTRAINT fk_favoritos_usuario
      FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    CONSTRAINT fk_favoritos_produto
      FOREIGN KEY (produto_id) REFERENCES produtos(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS carrinhos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_carrinhos_usuario
      FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS itens_carrinho (
    id INT AUTO_INCREMENT PRIMARY KEY,
    carrinho_id INT NOT NULL,
    produto_id INT NOT NULL,
    quantidade INT NOT NULL DEFAULT 1,
    CONSTRAINT fk_itens_carrinho_carrinho
      FOREIGN KEY (carrinho_id) REFERENCES carrinhos(id) ON DELETE CASCADE,
    CONSTRAINT fk_itens_carrinho_produto
      FOREIGN KEY (produto_id) REFERENCES produtos(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS pedidos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    codigo_pedido VARCHAR(50) NOT NULL UNIQUE,
    usuario_id INT NULL,
    data_pedido TIMESTAMP(3) NOT NULL,
    nome_loja VARCHAR(100) NOT NULL,
    valor_total DECIMAL(10,2) NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    desconto DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    cupom VARCHAR(100) NULL,
    status VARCHAR(50) DEFAULT 'Pendente',
    CONSTRAINT fk_pedidos_usuario
      FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS itens_pedido (
    id INT AUTO_INCREMENT PRIMARY KEY,
    pedido_id INT NOT NULL,
    produto_id INT NOT NULL,
    quantidade INT NOT NULL,
    preco_unitario DECIMAL(10,2) NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    CONSTRAINT fk_itens_pedido_pedido
      FOREIGN KEY (pedido_id) REFERENCES pedidos(id) ON DELETE CASCADE,
    CONSTRAINT fk_itens_pedido_produto
      FOREIGN KEY (produto_id) REFERENCES produtos(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- O importador cria automaticamente produtos que ainda não existirem.
-- Para cadastrar manualmente os dois produtos do JSON de exemplo, descomente:
-- INSERT INTO produtos (id, nome, preco) VALUES
-- (2, 'Lamen shoyu', 32.00),
-- (3, 'Yopokki queijo', 18.90);
