[README.md](https://github.com/user-attachments/files/34893652/README.md)
# Yuniku - Importador de pedidos em C#

Aplicação de console em C#/.NET 8 que lê um pedido JSON e grava os dados no MySQL.
Não utiliza ASP.NET nem Node.js.

## 1. Pré-requisitos

- Windows, Linux ou macOS
- .NET 8 SDK
- MySQL Server 8.x (ou compatível)
- Visual Studio 2022 ou terminal

## 2. Criar o banco

1. Abra o MySQL Workbench.
2. Abra e execute o arquivo `banco_yuniku.sql` que acompanha este projeto.
3. O script cria o banco `yuniku` e as tabelas do diagrama, com colunas adicionais para armazenar todos os campos do JSON.

## 3. Configurar a conexão

Abra `YunikuImportador/appsettings.json` e altere:
- `Server`: endereço do MySQL (normalmente `localhost`)
- `Port`: porta (normalmente `3306`)
- `User ID`: usuário do MySQL
- `Password`: sua senha

Não compartilhe o arquivo com sua senha em repositórios públicos.

## 4. Executar

Abra o terminal na pasta `YunikuImportador` e execute:

```bash
dotnet restore
dotnet run -- pedido.json
```

Para importar outro arquivo:

```bash
dotnet run -- "C:\caminho\para\outro-pedido.json"
```

No Visual Studio, abra `YunikuImportador.csproj`, restaure os pacotes NuGet e execute o projeto. O arquivo `pedido.json` pode ficar na pasta de execução; alternativamente, informe o caminho completo como argumento de execução.

## 5. Como os dados são gravados

- `pedidos`: código externo, usuário (pode ser nulo), loja, data, total, subtotal, desconto, cupom e status.
- `produtos`: se o ID do produto do JSON ainda não existir, ele é criado com o ID e nome informados. Se o ID existir com outro nome, a importação é interrompida para evitar associar o pedido ao produto errado.
- `itens_pedido`: produto, quantidade, preço unitário e subtotal de cada item.

A importação inteira ocorre em uma transação. Se qualquer etapa falhar, as alterações da importação são desfeitas. O código do pedido é único, então executar o importador novamente para o mesmo pedido não cria uma duplicata.

## 6. Observação sobre usuário

No JSON enviado, `usuario_id` está como `null`. O banco aceita esse valor. Se futuramente o JSON trouxer um ID, esse usuário deverá existir na tabela `usuarios` para respeitar a chave estrangeira.
