using System.Text.Json;
using System.Text.Json.Serialization;
using MySqlConnector;

internal class Program
{
    private static async Task<int> Main(string[] args)
    {
        string jsonPath = args.Length > 0 ? args[0] : "pedido.json";

        try
        {
            if (!File.Exists(jsonPath))
                throw new FileNotFoundException($"Arquivo JSON não encontrado: {jsonPath}");

            string configPath = Path.Combine(AppContext.BaseDirectory, "appsettings.json");
            if (!File.Exists(configPath))
                throw new FileNotFoundException("appsettings.json não encontrado na pasta da aplicação.");

            using JsonDocument config = JsonDocument.Parse(await File.ReadAllTextAsync(configPath));
            string? connectionString = config.RootElement
                .GetProperty("ConnectionStrings")
                .GetProperty("MySql")
                .GetString();

            if (string.IsNullOrWhiteSpace(connectionString) ||
                connectionString.Contains("SENHA_DO_MYSQL"))
                throw new InvalidOperationException(
                    "Configure a senha do MySQL em appsettings.json antes de executar.");

            var options = new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            };

            Pedido pedido = JsonSerializer.Deserialize<Pedido>(
                await File.ReadAllTextAsync(jsonPath), options)
                ?? throw new InvalidOperationException("O JSON está vazio ou inválido.");

            ValidarPedido(pedido);

            await using var connection = new MySqlConnection(connectionString);
            await connection.OpenAsync();

            // O JSON contém uma data UTC (termina em Z). Mantemos a sessão MySQL em UTC.
            await using (var timezone = new MySqlCommand("SET time_zone = '+00:00';", connection))
                await timezone.ExecuteNonQueryAsync();

            await using var transaction = await connection.BeginTransactionAsync();

            try
            {
                // Evita importar novamente um pedido que já foi cadastrado.
                await using (var verificar = new MySqlCommand(
                    "SELECT id FROM pedidos WHERE codigo_pedido = @codigo LIMIT 1;",
                    connection, transaction))
                {
                    verificar.Parameters.AddWithValue("@codigo", pedido.CodigoPedido);
                    object? existente = await verificar.ExecuteScalarAsync();

                    if (existente is not null)
                        throw new InvalidOperationException(
                            $"O pedido {pedido.CodigoPedido} já existe no banco (ID {existente}).");
                }

                // Garante que os produtos referenciados pelos itens existam.
                foreach (ItemPedido item in pedido.Itens)
                    await GarantirProdutoAsync(connection, transaction, item);

                const string inserirPedido = """
                    INSERT INTO pedidos
                        (codigo_pedido, usuario_id, data_pedido, nome_loja,
                         valor_total, subtotal, desconto, cupom, status)
                    VALUES
                        (@codigo, @usuario, @data, @loja,
                         @total, @subtotal, @desconto, @cupom, @status);
                    """;

                int pedidoId;
                await using (var comando = new MySqlCommand(inserirPedido, connection, transaction))
                {
                    comando.Parameters.AddWithValue("@codigo", pedido.CodigoPedido);
                    comando.Parameters.AddWithValue("@usuario",
                        pedido.UsuarioId.HasValue ? pedido.UsuarioId.Value : DBNull.Value);
                    comando.Parameters.AddWithValue("@data", pedido.DataPedido.UtcDateTime);
                    comando.Parameters.AddWithValue("@loja", pedido.NomeLoja);
                    comando.Parameters.AddWithValue("@total", pedido.ValorTotal);
                    comando.Parameters.AddWithValue("@subtotal", pedido.Subtotal);
                    comando.Parameters.AddWithValue("@desconto", pedido.Desconto);
                    comando.Parameters.AddWithValue("@cupom",
                        pedido.Cupom is null ? DBNull.Value : pedido.Cupom);
                    comando.Parameters.AddWithValue("@status", pedido.Status);

                    await comando.ExecuteNonQueryAsync();
                }

                await using (var idCommand = new MySqlCommand(
                    "SELECT LAST_INSERT_ID();", connection, transaction))
                {
                    pedidoId = Convert.ToInt32(await idCommand.ExecuteScalarAsync());
                }

                const string inserirItem = """
                    INSERT INTO itens_pedido
                        (pedido_id, produto_id, quantidade, preco_unitario, subtotal)
                    VALUES
                        (@pedido, @produto, @quantidade, @preco, @subtotal);
                    """;

                foreach (ItemPedido item in pedido.Itens)
                {
                    await using var comando = new MySqlCommand(inserirItem, connection, transaction);
                    comando.Parameters.AddWithValue("@pedido", pedidoId);
                    comando.Parameters.AddWithValue("@produto", item.ProdutoId);
                    comando.Parameters.AddWithValue("@quantidade", item.Quantidade);
                    comando.Parameters.AddWithValue("@preco", item.PrecoUnitario);
                    comando.Parameters.AddWithValue("@subtotal", item.Subtotal);
                    await comando.ExecuteNonQueryAsync();
                }

                await transaction.CommitAsync();

                Console.WriteLine();
                Console.WriteLine("Pedido importado com sucesso!");
                Console.WriteLine($"Código: {pedido.CodigoPedido}");
                Console.WriteLine($"ID no MySQL: {pedidoId}");
                Console.WriteLine($"Loja: {pedido.NomeLoja}");
                Console.WriteLine($"Itens: {pedido.Itens.Count}");
                Console.WriteLine($"Total: R$ {pedido.ValorTotal:N2}");
                Console.WriteLine($"Status: {pedido.Status}");
                return 0;
            }
            catch
            {
                await transaction.RollbackAsync();
                throw;
            }
        }
        catch (Exception ex)
        {
            Console.ForegroundColor = ConsoleColor.Red;
            Console.WriteLine($"Erro: {ex.Message}");
            Console.ResetColor();
            return 1;
        }
    }

    private static void ValidarPedido(Pedido pedido)
    {
        if (string.IsNullOrWhiteSpace(pedido.CodigoPedido))
            throw new InvalidOperationException("O campo codigo_pedido é obrigatório.");

        if (string.IsNullOrWhiteSpace(pedido.NomeLoja))
            throw new InvalidOperationException("O campo nome_loja é obrigatório.");

        if (pedido.Itens is null || pedido.Itens.Count == 0)
            throw new InvalidOperationException("O pedido precisa ter pelo menos um item.");

        foreach (ItemPedido item in pedido.Itens)
        {
            if (item.ProdutoId <= 0 || item.Quantidade <= 0)
                throw new InvalidOperationException("Produto e quantidade precisam ser maiores que zero.");

            if (item.PrecoUnitario < 0 || item.Subtotal < 0)
                throw new InvalidOperationException("Os valores dos itens não podem ser negativos.");
        }
    }

    private static async Task GarantirProdutoAsync(
        MySqlConnection connection, MySqlTransaction transaction, ItemPedido item)
    {
        const string consultar = "SELECT nome FROM produtos WHERE id = @id LIMIT 1;";
        await using var consulta = new MySqlCommand(consultar, connection, transaction);
        consulta.Parameters.AddWithValue("@id", item.ProdutoId);
        object? nomeExistente = await consulta.ExecuteScalarAsync();

        if (nomeExistente is not null)
        {
            string nomeBanco = Convert.ToString(nomeExistente) ?? "";
            if (!string.Equals(nomeBanco.Trim(), item.Nome.Trim(),
                    StringComparison.OrdinalIgnoreCase))
            {
                throw new InvalidOperationException(
                    $"O produto de ID {item.ProdutoId} já existe como '{nomeBanco}', " +
                    $"mas o JSON informa '{item.Nome}'. Confira o cadastro antes de importar.");
            }
            return;
        }

        const string inserir = """
            INSERT INTO produtos (id, nome, descricao, preco, categoria_id, eh_novidade, imagem_url)
            VALUES (@id, @nome, NULL, @preco, NULL, FALSE, NULL);
            """;

        await using var comando = new MySqlCommand(inserir, connection, transaction);
        comando.Parameters.AddWithValue("@id", item.ProdutoId);
        comando.Parameters.AddWithValue("@nome", item.Nome);
        comando.Parameters.AddWithValue("@preco", item.PrecoUnitario);
        await comando.ExecuteNonQueryAsync();

        Console.WriteLine($"Produto criado automaticamente: {item.Nome} (ID {item.ProdutoId})");
    }
}

internal sealed class Pedido
{
    [JsonPropertyName("codigo_pedido")]
    public string CodigoPedido { get; set; } = "";

    [JsonPropertyName("usuario_id")]
    public int? UsuarioId { get; set; }

    [JsonPropertyName("nome_loja")]
    public string NomeLoja { get; set; } = "";

    [JsonPropertyName("data_pedido")]
    public DateTimeOffset DataPedido { get; set; }

    [JsonPropertyName("valor_total")]
    public decimal ValorTotal { get; set; }

    [JsonPropertyName("status")]
    public string Status { get; set; } = "Pendente";

    [JsonPropertyName("subtotal")]
    public decimal Subtotal { get; set; }

    [JsonPropertyName("desconto")]
    public decimal Desconto { get; set; }

    [JsonPropertyName("cupom")]
    public string? Cupom { get; set; }

    [JsonPropertyName("itens")]
    public List<ItemPedido> Itens { get; set; } = new();
}

internal sealed class ItemPedido
{
    [JsonPropertyName("produto_id")]
    public int ProdutoId { get; set; }

    [JsonPropertyName("nome")]
    public string Nome { get; set; } = "";

    [JsonPropertyName("quantidade")]
    public int Quantidade { get; set; }

    [JsonPropertyName("preco_unitario")]
    public decimal PrecoUnitario { get; set; }

    [JsonPropertyName("subtotal")]
    public decimal Subtotal { get; set; }
}
