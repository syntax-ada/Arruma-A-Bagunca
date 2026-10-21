/**
 * @file progresso.js
 * @description Serviço de progresso do jogador: guarda as fases concluídas no
 * navegador e as sincroniza com o servidor (api/progresso), separadas por
 * jogador. O navegador nunca fala direto com o banco.
 *
 * ============================================================================
 * CONTRATO PÚBLICO (NÃO ALTERE AS ASSINATURAS)
 * ============================================================================
 *   obterProgresso()
 *     → { mundosDesbloqueados, faseMaximaPorMundo, fasesConcluidas }
 *     Síncrono, como sempre foi: menu.js lê e desenha na hora.
 *
 *   desbloquearProximaFase(faseAtual, mundoAtual = 1, totalFases = 3)
 *     Registra a conclusão da fase. "totalFases" continua aceito por
 *     compatibilidade, mas o catálogo oficial vem de js/regras-progresso.js
 *     (carregado antes deste arquivo).
 *
 * ============================================================================
 * DE QUEM É O PROGRESSO (contexto)
 * ============================================================================
 * 1. Modo DEV ligado (window.modoDevLiberado, decidido por js/dev.js):
 *    "progresso de teste", na chave arruma_bagunca_progresso_dev. NUNCA é
 *    enviado ao servidor nem se mistura com o de um jogador.
 * 2. Jogador identificado nesta aba: progresso do jogador, na chave
 *    arruma_bagunca_progresso_jogador:<id>. Cada jogador tem a sua chave.
 * 3. Ninguém identificado (ex.: fase1.html aberta direto): o progresso vale
 *    só enquanto a página estiver aberta.
 *
 * ============================================================================
 * SINCRONIZAÇÃO (aditiva: só soma, nunca apaga)
 * ============================================================================
 * - Ao concluir uma fase, ela é gravada primeiro no navegador e depois enviada
 *   ao servidor (POST /api/progresso/registrar). Sem rede, fica pendente e é
 *   reenviada depois (próxima fase, próxima identificação, volta da conexão).
 * - Ao identificar o jogador (js/jogador.js), o progresso do banco é somado ao
 *   do navegador (união, sem duplicar). Nada do banco é apagado ou trocado
 *   pelo que está no navegador, e vice-versa.
 * - A prova de identidade enviada ao servidor é o token assinado recebido em
 *   POST /api/jogadores (Authorization: Bearer). O servidor nunca confia num
 *   id de jogador vindo do navegador.
 * - Dentro do iframe da fase (fase1.html dentro de index.html), as chamadas
 *   são entregues ao serviço do menu (mesma origem): um só estado e uma só
 *   fila de envio, mesmo que o navegador bloqueie o armazenamento.
 *
 * Dados locais inválidos (JSON quebrado, fases inexistentes como "1-99") são
 * ignorados sem travar o jogo. Depois da fase bônus (5-1) não existe "Mundo 6".
 * ============================================================================
 */

(function configurarServicoDeProgresso() {
  const Regras = window.RegrasProgresso;

  const CHAVE_PROGRESSO_DEV = "arruma_bagunca_progresso_dev";
  const PREFIXO_PROGRESSO_JOGADOR = "arruma_bagunca_progresso_jogador:";
  const CHAVE_SESSAO = "arruma_bagunca_sessao_jogador";
  // Jogador exibido no menu (gravado por js/jogador.js). Aqui só serve para
  // escolher a chave local se a aba ainda não tiver sessão; nunca vai ao servidor.
  const CHAVE_JOGADOR_EXIBIDO = "arruma_bagunca_jogador";
  const EVENTO_PROGRESSO_ATUALIZADO = "arruma-bagunca:progresso-atualizado";
  const TEMPO_LIMITE_MS = 8000;
  const FORMATO_ID_JOGADOR = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const VERSAO_SERVICO = 1;

  if (!Regras) {
    console.error("[progresso.js] js/regras-progresso.js precisa ser carregado antes de progresso.js.");
    return;
  }

  // ==========================================================================
  // Armazenamento tolerante a falhas
  // ==========================================================================
  // localStorage/sessionStorage podem lançar erro (modo privado, iframe de
  // outro site com armazenamento bloqueado, cota cheia). Tudo o que é gravado
  // também fica em memória, para o jogo seguir funcionando nesta página.
  const memoria = new Map();
  // Chaves cuja última gravação no navegador falhou: a memória é mais nova.
  const gravacaoFalhou = new Set();

  function lerTexto(tipo, chave) {
    const id = `${tipo}:${chave}`;
    if (!gravacaoFalhou.has(id)) {
      try {
        const valor = window[tipo].getItem(chave);
        if (valor !== null) {
          return valor;
        }
      } catch (erro) {
        // Armazenamento indisponível: usa a memória.
      }
    }
    return memoria.has(id) ? memoria.get(id) : null;
  }

  function gravarTexto(tipo, chave, valor) {
    const id = `${tipo}:${chave}`;
    memoria.set(id, valor);
    try {
      window[tipo].setItem(chave, valor);
      gravacaoFalhou.delete(id);
    } catch (erro) {
      // Fica só na memória desta página.
      gravacaoFalhou.add(id);
    }
  }

  function lerObjeto(tipo, chave, texto) {
    const conteudo = texto === undefined ? lerTexto(tipo, chave) : texto;
    if (!conteudo) {
      return null;
    }
    try {
      const objeto = JSON.parse(conteudo);
      return objeto && typeof objeto === "object" ? objeto : null;
    } catch (erro) {
      return null;
    }
  }

  // ==========================================================================
  // Sessão do jogador nesta aba
  // ==========================================================================
  function lerSessao() {
    const sessao = lerObjeto("sessionStorage", CHAVE_SESSAO);
    if (sessao && FORMATO_ID_JOGADOR.test(String(sessao.jogadorId))) {
      return {
        jogadorId: sessao.jogadorId,
        token: typeof sessao.token === "string" && sessao.token ? sessao.token : null,
        expiraEm: Number(sessao.expiraEm) || 0,
      };
    }

    const exibido = lerObjeto("sessionStorage", CHAVE_JOGADOR_EXIBIDO);
    if (exibido && FORMATO_ID_JOGADOR.test(String(exibido.id))) {
      return { jogadorId: exibido.id, token: null, expiraEm: 0 };
    }
    return null;
  }

  function gravarSessao(sessao) {
    gravarTexto("sessionStorage", CHAVE_SESSAO, JSON.stringify(sessao));
  }

  function sessaoPodeSincronizar(sessao) {
    return !!(sessao && sessao.token && (!sessao.expiraEm || Date.now() < sessao.expiraEm));
  }

  /** O servidor recusou o token (401): deixa de usá-lo, mas mantém o progresso. */
  function descartarToken(sessaoRecusada) {
    const atual = lerSessao();
    if (atual && atual.jogadorId === sessaoRecusada.jogadorId && atual.token === sessaoRecusada.token) {
      gravarSessao({ jogadorId: atual.jogadorId, token: null, expiraEm: 0 });
    }
  }

  // ==========================================================================
  // Progresso guardado no navegador
  // ==========================================================================
  // Progresso do jogador: { fasesConcluidas: [...], sincronizadas: [...] }
  // "sincronizadas" são as fases que o servidor já confirmou. Leitura e
  // gravação sempre SOMAM (navegador + memória + novo), nunca substituem: assim
  // duas abas do mesmo jogador não apagam o progresso uma da outra.
  function chaveDoJogador(jogadorId) {
    return PREFIXO_PROGRESSO_JOGADOR + jogadorId;
  }

  function lerProgressoDoJogador(jogadorId) {
    const chave = chaveDoJogador(jogadorId);
    let doNavegador = null;
    try {
      doNavegador = lerObjeto("localStorage", chave, window.localStorage.getItem(chave));
    } catch (erro) {
      doNavegador = null;
    }
    const daMemoria = lerObjeto("localStorage", chave, memoria.get(`localStorage:${chave}`) || null);

    return {
      fasesConcluidas: Regras.normalizarLista([
        ...(Array.isArray(doNavegador?.fasesConcluidas) ? doNavegador.fasesConcluidas : []),
        ...(Array.isArray(daMemoria?.fasesConcluidas) ? daMemoria.fasesConcluidas : []),
      ]),
      sincronizadas: Regras.normalizarLista([
        ...(Array.isArray(doNavegador?.sincronizadas) ? doNavegador.sincronizadas : []),
        ...(Array.isArray(daMemoria?.sincronizadas) ? daMemoria.sincronizadas : []),
      ]),
    };
  }

  function somarAoProgressoDoJogador(jogadorId, { fasesConcluidas = [], sincronizadas = [] }) {
    const atual = lerProgressoDoJogador(jogadorId);
    const novo = {
      fasesConcluidas: Regras.normalizarLista([...atual.fasesConcluidas, ...fasesConcluidas, ...sincronizadas]),
      sincronizadas: Regras.normalizarLista([...atual.sincronizadas, ...sincronizadas]),
    };
    gravarTexto("localStorage", chaveDoJogador(jogadorId), JSON.stringify(novo));
    return novo;
  }

  // Progresso de teste do modo DEV: { fasesConcluidas: [...] }. Pode ser
  // reiniciado pelo painel DEV; nunca sai do navegador.
  function lerProgressoDev() {
    const dados = lerObjeto("localStorage", CHAVE_PROGRESSO_DEV);
    return Regras.normalizarLista(dados?.fasesConcluidas);
  }

  function gravarProgressoDev(lista) {
    gravarTexto("localStorage", CHAVE_PROGRESSO_DEV, JSON.stringify({ fasesConcluidas: Regras.normalizarLista(lista) }));
  }

  // Sem jogador identificado: vale só enquanto a página estiver aberta.
  let progressoSemJogador = [];

  function contextoAtual() {
    if (window.modoDevLiberado === true) {
      return { tipo: "dev" };
    }
    const sessao = lerSessao();
    if (sessao) {
      return { tipo: "jogador", sessao };
    }
    return { tipo: "sem-jogador" };
  }

  function avisarAtualizacao() {
    try {
      window.dispatchEvent(new CustomEvent(EVENTO_PROGRESSO_ATUALIZADO));
    } catch (erro) {
      // Sem CustomEvent (navegador muito antigo): o menu atualiza ao reabrir.
    }
  }

  // ==========================================================================
  // Comunicação com o servidor
  // ==========================================================================
  async function chamarApi(metodo, url, token, corpo) {
    const controle = typeof AbortController === "function" ? new AbortController() : null;
    const prazo = controle ? setTimeout(() => controle.abort(), TEMPO_LIMITE_MS) : null;
    const opcoes = {
      method: metodo,
      cache: "no-store",
      headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
      signal: controle ? controle.signal : undefined,
    };
    if (corpo !== undefined) {
      opcoes.headers["Content-Type"] = "application/json";
      opcoes.body = JSON.stringify(corpo);
      // Deixa o envio terminar mesmo se a página da fase for trocada.
      opcoes.keepalive = true;
    }

    try {
      const resposta = await fetch(url, opcoes);
      let dados = null;
      try {
        dados = await resposta.json();
      } catch (erro) {
        dados = null;
      }
      return { status: resposta.status, ok: resposta.ok, dados };
    } catch (erro) {
      return { status: 0, ok: false, dados: null };
    } finally {
      if (prazo) {
        clearTimeout(prazo);
      }
    }
  }

  /**
   * Soma a resposta do servidor ao progresso DO JOGADOR DA SESSÃO USADA no
   * pedido (não o da sessão atual: se outra criança entrou nesse meio-tempo,
   * os dados não se misturam).
   */
  function aplicarResposta(sessao, resposta) {
    if (resposta.ok && Array.isArray(resposta.dados?.fasesConcluidas)) {
      const confirmadas = Regras.normalizarLista(resposta.dados.fasesConcluidas);
      somarAoProgressoDoJogador(sessao.jogadorId, { sincronizadas: confirmadas });
      avisarAtualizacao();
      return { estado: "sincronizado" };
    }
    if (resposta.status === 401) {
      descartarToken(sessao);
      return { estado: "sessao-expirada" };
    }
    return { estado: "falha" };
  }

  function fasesPendentes(jogadorId) {
    const progresso = lerProgressoDoJogador(jogadorId);
    // Só a sequência desde a primeira fase é enviada: é o que o servidor aceita.
    const sequencia = Regras.fasesEmSequencia(progresso.fasesConcluidas);
    const pendentes = sequencia.filter((id) => !progresso.sincronizadas.includes(id));
    return { sequencia, pendentes };
  }

  async function enviarPendentes(sessao, { buscarSeNadaPendente = false } = {}) {
    const { sequencia, pendentes } = fasesPendentes(sessao.jogadorId);

    if (pendentes.length === 0) {
      if (!buscarSeNadaPendente) {
        return { estado: "sincronizado" };
      }
      return aplicarResposta(sessao, await chamarApi("GET", "/api/progresso", sessao.token));
    }

    // Envia a sequência inteira (no máximo 13 fases): o servidor ignora as
    // repetidas e devolve tudo o que o jogador tem no banco.
    return aplicarResposta(
      sessao,
      await chamarApi("POST", "/api/progresso/registrar", sessao.token, { fasesConcluidas: sequencia })
    );
  }

  // Um envio por jogador de cada vez. Se algo mudar durante o envio, envia de
  // novo ao terminar.
  const enviosEmAndamento = new Map();
  const enviarDeNovo = new Set();

  function sincronizarSessao(sessao, opcoes) {
    if (!sessaoPodeSincronizar(sessao)) {
      return Promise.resolve({ estado: sessao && sessao.token ? "sessao-expirada" : "sem-sessao" });
    }

    const jogadorId = sessao.jogadorId;
    if (enviosEmAndamento.has(jogadorId)) {
      enviarDeNovo.add(jogadorId);
      return enviosEmAndamento.get(jogadorId);
    }

    const envio = (async () => {
      let resultado;
      let sessaoDoEnvio = sessao;
      try {
        do {
          enviarDeNovo.delete(jogadorId);
          resultado = await enviarPendentes(sessaoDoEnvio, opcoes);
          opcoes = undefined;
          // Se a mesma criança entrou de novo nesse meio-tempo, usa o token novo.
          const atual = lerSessao();
          if (atual && atual.jogadorId === jogadorId && sessaoPodeSincronizar(atual)) {
            sessaoDoEnvio = atual;
          }
        } while (enviarDeNovo.has(jogadorId) && resultado.estado === "sincronizado");
        return resultado;
      } finally {
        enviosEmAndamento.delete(jogadorId);
        enviarDeNovo.delete(jogadorId);
      }
    })();
    enviosEmAndamento.set(jogadorId, envio);
    return envio;
  }

  // ==========================================================================
  // API do serviço
  // ==========================================================================
  function obterProgressoDoContexto() {
    const contexto = contextoAtual();
    if (contexto.tipo === "dev") {
      return Regras.derivarProgresso(lerProgressoDev());
    }
    if (contexto.tipo === "jogador") {
      return Regras.derivarProgresso(lerProgressoDoJogador(contexto.sessao.jogadorId).fasesConcluidas);
    }
    return Regras.derivarProgresso(progressoSemJogador);
  }

  /**
   * Registra a conclusão de uma fase no contexto atual.
   * Devolve { registrada, contexto, motivo? }.
   */
  function registrarConclusao(mundo, fase) {
    const id = Regras.idDaFase(Number(mundo), Number(fase));
    const contexto = contextoAtual();

    if (!Regras.faseExiste(id)) {
      console.warn("[progresso.js] Conclusão ignorada: essa fase não existe no jogo.");
      return { registrada: false, contexto: contexto.tipo, motivo: "FASE_INEXISTENTE" };
    }

    // Modo DEV: o testador pode pular fases, então não se exige a sequência.
    if (contexto.tipo === "dev") {
      const lista = lerProgressoDev();
      if (!lista.includes(id)) {
        gravarProgressoDev([...lista, id]);
        avisarAtualizacao();
      }
      return { registrada: true, contexto: "dev" };
    }

    const registradas = contexto.tipo === "jogador"
      ? lerProgressoDoJogador(contexto.sessao.jogadorId).fasesConcluidas
      : progressoSemJogador;
    const { aceitas, recusadas } = Regras.avaliarNovasConclusoes(registradas, [id]);

    if (aceitas.length > 0) {
      if (contexto.tipo === "jogador") {
        somarAoProgressoDoJogador(contexto.sessao.jogadorId, { fasesConcluidas: aceitas });
      } else {
        progressoSemJogador = Regras.normalizarLista([...progressoSemJogador, ...aceitas]);
      }
      avisarAtualizacao();
    }

    if (contexto.tipo === "jogador") {
      // Também reenvia o que tiver ficado pendente de antes.
      sincronizarSessao(contexto.sessao);
    }

    if (recusadas.length > 0) {
      // Ex.: fase aberta pela URL sem concluir as anteriores. Não libera nada.
      return { registrada: false, contexto: contexto.tipo, motivo: recusadas[0].motivo };
    }
    return { registrada: aceitas.length > 0, contexto: contexto.tipo, motivo: aceitas.length > 0 ? undefined : "REPETIDA" };
  }

  /**
   * Chamado por js/jogador.js logo depois da identificação. Troca a sessão da
   * aba para este jogador, soma o progresso do banco ao do navegador e envia
   * o que estiver pendente. Nunca apaga nada. A promessa nunca é rejeitada.
   */
  function iniciarProgressoDoJogador(jogador, sessaoRecebida) {
    if (!jogador || !FORMATO_ID_JOGADOR.test(String(jogador.id))) {
      return Promise.resolve({ estado: "ignorado" });
    }

    const sessao = {
      jogadorId: jogador.id,
      token: typeof sessaoRecebida?.token === "string" && sessaoRecebida.token ? sessaoRecebida.token : null,
      expiraEm: Number(sessaoRecebida?.expiraEm) || 0,
    };
    gravarSessao(sessao);
    avisarAtualizacao();

    return sincronizarSessao(sessao, { buscarSeNadaPendente: true }).catch(() => ({ estado: "falha" }));
  }

  /** Envia as conclusões pendentes do jogador desta aba, se houver. */
  function sincronizarProgresso() {
    const contexto = contextoAtual();
    if (contexto.tipo !== "jogador") {
      return Promise.resolve({ estado: "ignorado" });
    }
    return sincronizarSessao(contexto.sessao).catch(() => ({ estado: "falha" }));
  }

  /**
   * Só para o painel DEV (Desbloquear Tudo / Resetar Progresso): troca o
   * progresso DE TESTE. Não toca no progresso de nenhum jogador nem no banco.
   */
  function definirProgressoDeTeste(fasesConcluidas) {
    gravarProgressoDev(fasesConcluidas);
    avisarAtualizacao();
  }

  const servicoDestaPagina = Object.freeze({
    versao: VERSAO_SERVICO,
    contexto: () => contextoAtual().tipo,
    definirProgressoDeTeste,
    iniciarProgressoDoJogador,
    obterProgresso: obterProgressoDoContexto,
    registrarConclusao,
    sincronizarProgresso,
  });

  /**
   * Dentro do iframe da fase, usa o serviço do menu (mesma origem). Se o menu
   * estiver em outro site (ex.: jogo dentro do Cruzeiro HUB), o acesso lança
   * erro e esta página usa o próprio serviço.
   */
  function obterServicoDoMenu() {
    try {
      if (window.parent && window.parent !== window) {
        const servico = window.parent.ServicoProgresso;
        if (servico && servico.versao === VERSAO_SERVICO && typeof servico.registrarConclusao === "function") {
          return servico;
        }
      }
    } catch (erro) {
      // Outro site: sem acesso.
    }
    return null;
  }

  function servicoResponsavel() {
    // Com o modo DEV ligado nesta página, o progresso de teste fica aqui mesmo.
    if (window.modoDevLiberado === true) {
      return servicoDestaPagina;
    }
    return obterServicoDoMenu() || servicoDestaPagina;
  }

  function copiar(valor) {
    return valor === undefined ? undefined : JSON.parse(JSON.stringify(valor));
  }

  window.ServicoProgresso = servicoDestaPagina;
  window.obterServicoDeProgresso = servicoResponsavel;
  window.copiarDadosDeProgresso = copiar;

  // Sem conexão na última tentativa? Reenvia quando a internet voltar e ao
  // abrir a página (só quem não entrega o trabalho ao menu).
  if (!obterServicoDoMenu()) {
    window.addEventListener("online", () => {
      sincronizarProgresso();
    });
    setTimeout(() => {
      sincronizarProgresso();
    }, 0);
  }
})();

/**
 * Obtém o progresso atual do jogador.
 * NÃO ALTERE A ASSINATURA DESTA FUNÇÃO.
 */
function obterProgresso() {
  const padrao = { mundosDesbloqueados: [1], faseMaximaPorMundo: { 1: 1 }, fasesConcluidas: [] };
  if (typeof window.obterServicoDeProgresso !== "function") {
    return padrao;
  }
  try {
    return window.copiarDadosDeProgresso(window.obterServicoDeProgresso().obterProgresso());
  } catch (erro) {
    console.error("[progresso.js] Não foi possível ler o progresso.");
    return padrao;
  }
}

/**
 * Registra a conclusão de uma fase e desbloqueia o que vier a seguir.
 *
 * "faseAtual" aceita número ou texto com o número (ex.: 2 ou "fase2").
 * "mundoAtual" e "totalFases" são opcionais; "totalFases" é mantido só por
 * compatibilidade (as fases de cada mundo vêm de js/regras-progresso.js).
 *
 * NÃO ALTERE A ASSINATURA DESTA FUNÇÃO DE FORMA INCOMPATÍVEL.
 */
function desbloquearProximaFase(faseAtual, mundoAtual = 1, totalFases = 3) {
  const numeroDaFase = String(faseAtual).match(/\d+/);
  if (!numeroDaFase || typeof window.obterServicoDeProgresso !== "function") {
    return;
  }
  const fase = parseInt(numeroDaFase[0], 10);
  const mundo = Number(mundoAtual) || 1;

  try {
    window.obterServicoDeProgresso().registrarConclusao(mundo, fase);
  } catch (erro) {
    console.error("[progresso.js] Não foi possível registrar a conclusão da fase.");
  }
}
