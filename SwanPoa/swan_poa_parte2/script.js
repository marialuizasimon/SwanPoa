const API = "https://makeup-api.herokuapp.com/api/v1/products.json";
const API_DETALHE = "https://makeup-api.herokuapp.com/api/v1/products";

// API de logs fornecida na avaliação.
const ALUNO_ID = "468392";
const API_LOGS = `https://www.piway.com.br/unoesc/api/logs/${ALUNO_ID}`;
const API_INSERIR_LOG = `https://www.piway.com.br/unoesc/api/inserir/log/${ALUNO_ID}`;
const API_EXCLUIR_LOG = `https://www.piway.com.br/unoesc/api/excluir/log`;

const produtosContainer = document.getElementById("produtos");
const mensagem = document.getElementById("mensagem");
const busca = document.getElementById("busca");
const categoria = document.getElementById("categoria");
const botaoPesquisar = document.getElementById("pesquisar");
const botaoLogs = document.getElementById("ver-logs");
const logsContainer = document.getElementById("lista-logs");
const mensagemLogs = document.getElementById("mensagem-logs");

let produtosCarregados = [];

// Registra uma operação somente depois de a requisição principal retornar com sucesso.
async function registrarLog(metodo, resultado) {
  const api = "Makeup API";
  const url = `${API_INSERIR_LOG}/${encodeURIComponent(api)}/${encodeURIComponent(metodo)}/${encodeURIComponent(resultado)}`;

  try {
    const resposta = await fetch(url);
    if (!resposta.ok) throw new Error(`Falha ao registrar log (${resposta.status}).`);
    console.info("Log registrado com sucesso.");
  } catch (erro) {
    // Um problema na API de logs não deve impedir o uso do catálogo.
    console.error("Não foi possível registrar o log:", erro);
  }
}

// Busca os logs registrados para este aluno e monta a lista na página.
async function carregarLogs() {
  mensagemLogs.textContent = "Carregando logs...";
  logsContainer.innerHTML = "";

  try {
    const resposta = await fetch(API_LOGS);
    if (!resposta.ok) throw new Error(`Falha ao consultar logs (${resposta.status}).`);
    const dados = await resposta.json();
    const logs = Array.isArray(dados) ? dados : (dados.logs || dados.data || []);

    if (!Array.isArray(logs) || logs.length === 0) {
      mensagemLogs.textContent = "Nenhum log registrado ainda.";
      return;
    }

    mensagemLogs.textContent = `${logs.length} log(s) encontrado(s).`;
    logs.forEach(log => {
      const item = document.createElement("article");
      item.className = "log-item";

      const texto = document.createElement("div");
      texto.className = "log-texto";
      const id = log.id ?? log.idlog ?? log.id_log ?? log.IDLOG ?? log.codigo;
      const api = log.api ?? log.API ?? "API não informada";
      const metodo = log.metodo ?? log.METODO ?? log.method ?? "Método não informado";
      const resultado = log.resultado ?? log.RESULTADO ?? log.retorno ?? "Resultado não informado";
      const data = log.data ?? log.data_hora ?? log.created_at ?? log.dataHora;

      const titulo = document.createElement("strong");
      titulo.textContent = `Log ${id !== undefined ? `#${id}` : ""}`;
      const detalhes = document.createElement("p");
      detalhes.textContent = `API: ${api} | Método: ${metodo} | Resultado: ${resultado}${data ? ` | Data: ${data}` : ""}`;
      texto.append(titulo, detalhes);
      item.appendChild(texto);

      const excluir = document.createElement("button");
      excluir.className = "excluir-log";
      excluir.textContent = "Excluir";
      excluir.disabled = id === undefined || id === null;
      excluir.title = excluir.disabled ? "Não foi possível identificar o ID deste log" : "Excluir este log";
      excluir.addEventListener("click", () => excluirLog(id));
      item.appendChild(excluir);
      logsContainer.appendChild(item);
    });
  } catch (erro) {
    mensagemLogs.textContent = "Não foi possível carregar os logs. Verifique a conexão e tente novamente.";
    console.error(erro);
  }
}

async function excluirLog(id) {
  if (!confirm(`Deseja excluir o log #${id}?`)) return;
  try {
    const url = `${API_EXCLUIR_LOG}/${encodeURIComponent(id)}/aluno/${ALUNO_ID}`;
    const resposta = await fetch(url);
    if (!resposta.ok) throw new Error(`Falha ao excluir log (${resposta.status}).`);
    await carregarLogs();
  } catch (erro) {
    alert("Não foi possível excluir esse log. Confira a documentação da API e tente novamente.");
    console.error(erro);
  }
}

// Busca produtos, com ou sem filtro de categoria.
async function buscarProdutos(tipo = "") {
  mensagem.textContent = "Carregando maquiagens... ♡";
  produtosContainer.innerHTML = "";

  try {
    const url = tipo ? `${API}?product_type=${encodeURIComponent(tipo)}` : API;
    const resposta = await fetch(url);
    if (!resposta.ok) throw new Error("Não foi possível consultar os produtos.");

    const dados = await resposta.json();
    produtosCarregados = Array.isArray(dados) ? dados : [];
    mostrarProdutos(produtosCarregados);
    await registrarLog("buscarProdutos", `Sucesso: ${produtosCarregados.length} produtos retornados; categoria=${tipo || "todas"}`);
  } catch (erro) {
    mensagem.textContent = "Não foi possível carregar os produtos. Tente novamente.";
    console.error(erro);
  }
}

// Mostra os produtos recebidos.
function mostrarProdutos(lista) {
  produtosContainer.innerHTML = "";
  if (!lista.length) {
    mensagem.textContent = "Nenhuma maquiagem encontrada.";
    return;
  }
  mensagem.textContent = `${lista.length} produto(s) encontrado(s) ♡`;

  lista.slice(0, 40).forEach(produto => {
    const card = document.createElement("article");
    card.className = "card";
    const imagem = document.createElement("img");
    imagem.src = produto.image_link || "";
    imagem.alt = produto.name || "Maquiagem";
    imagem.loading = "lazy";
    imagem.onerror = () => { imagem.style.display = "none"; };

    const titulo = document.createElement("h2");
    titulo.textContent = produto.name || "Produto sem nome";
    const marca = document.createElement("p");
    marca.textContent = `Marca: ${produto.brand || "Não informada"}`;
    const preco = document.createElement("p");
    preco.className = "preco";
    preco.textContent = produto.price ? `${produto.price_sign || ""}${produto.price} ${produto.currency || ""}` : "Preço não informado";

    const detalhe = document.createElement("button");
    detalhe.className = "detalhes";
    detalhe.textContent = "Ver detalhes";
    detalhe.addEventListener("click", () => verDetalhes(produto.id));
    card.append(imagem, titulo, marca, preco, detalhe);
    produtosContainer.appendChild(card);
  });
}

// Consulta os detalhes de um produto pelo ID.
async function verDetalhes(id) {
  mensagem.textContent = "Consultando produto... ♡";
  try {
    const resposta = await fetch(`${API_DETALHE}/${id}.json`);
    if (!resposta.ok) throw new Error("Não foi possível consultar este produto.");
    const produto = await resposta.json();
    const descricao = produto.description ? produto.description.replace(/<[^>]*>/g, " ").trim() : "Sem descrição disponível.";
    alert(`${produto.name}\n\nMarca: ${produto.brand || "Não informada"}\nCategoria: ${produto.product_type || "Não informada"}\n\n${descricao.slice(0, 500)}`);
    mensagem.textContent = "Detalhes consultados com sucesso ♡";
    await registrarLog("verDetalhes", `Sucesso: produto ID ${id} (${produto.name || "sem nome"})`);
  } catch (erro) {
    mensagem.textContent = "Erro ao consultar os detalhes.";
    console.error(erro);
  }
}

// Filtra pelo nome os produtos carregados; se escolher categoria, consulta a API com filtro.
async function pesquisar() {
  const termo = busca.value.trim().toLowerCase();
  const tipo = categoria.value;
  if (tipo) await buscarProdutos(tipo);
  const filtrados = produtosCarregados.filter(produto => (produto.name || "").toLowerCase().includes(termo));
  mostrarProdutos(filtrados);
}

botaoPesquisar.addEventListener("click", pesquisar);
busca.addEventListener("keydown", evento => { if (evento.key === "Enter") pesquisar(); });
categoria.addEventListener("change", () => buscarProdutos(categoria.value));
botaoLogs.addEventListener("click", () => {
  const area = document.getElementById("area-logs");
  area.hidden = !area.hidden;
  if (!area.hidden) carregarLogs();
  botaoLogs.textContent = area.hidden ? "Ver logs de utilização" : "Ocultar logs";
});
document.getElementById("atualizar-logs").addEventListener("click", carregarLogs);

// Carrega o catálogo ao abrir a página.
buscarProdutos();
