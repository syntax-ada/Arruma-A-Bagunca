/**
 * @file regras-progresso.js
 * @description Regras da progressão, compartilhadas pelo navegador e pelo
 * servidor: quais fases existem, em que ordem são liberadas e como o progresso
 * exibido no menu é calculado a partir das fases concluídas.
 *
 * O mesmo arquivo é carregado:
 *   - no navegador, como script clássico (antes de js/progresso.js), e fica
 *     disponível em window.RegrasProgresso;
 *   - no servidor (api/progresso/*), com require(), e é a fonte que decide o
 *     que pode ser gravado no banco.
 * Assim a regra não é duplicada. Não há segredos aqui.
 *
 * Uma fase concluída é identificada por "mundo-fase" (ex.: "1-1", "4-3", "5-1").
 * São 13 fases: Mundos 1 a 4 com 3 fases cada e o Mundo 5 (bônus) com 1.
 * A ordem é linear: só é possível concluir a próxima fase depois de concluir
 * todas as anteriores. Por isso o progresso legítimo é sempre um "começo"
 * (prefixo) da ordem abaixo.
 *
 * ⚠️ Se um mundo ganhar ou perder fases em js/mundos/, atualize
 * TOTAL_FASES_POR_MUNDO e a restrição CHECK da tabela phase_completions (em
 * uma nova migração do banco). O teste testes/regras-progresso.test.js confere se
 * este catálogo bate com os arquivos de js/mundos/.
 */

(function (raiz, criarRegras) {
  const regras = criarRegras();
  if (typeof module === "object" && module.exports) {
    module.exports = regras;
  } else {
    raiz.RegrasProgresso = regras;
  }
})(typeof self !== "undefined" ? self : this, function criarRegras() {
  const TOTAL_FASES_POR_MUNDO = Object.freeze({ 1: 3, 2: 3, 3: 3, 4: 3, 5: 1 });

  const ORDEM_DAS_FASES = Object.freeze(
    Object.keys(TOTAL_FASES_POR_MUNDO).flatMap((mundo) => {
      const ids = [];
      for (let fase = 1; fase <= TOTAL_FASES_POR_MUNDO[mundo]; fase++) {
        ids.push(`${mundo}-${fase}`);
      }
      return ids;
    })
  );

  const FORMATO_ID = /^([1-9])-([1-9])$/;

  function idDaFase(mundo, fase) {
    return `${mundo}-${fase}`;
  }

  /**
   * "2-3" → { mundo: 2, fase: 3 }. Devolve null para qualquer id que não
   * esteja no catálogo (ex.: "1-99", "6-1", "abc", 12).
   */
  function lerIdDaFase(id) {
    if (typeof id !== "string") {
      return null;
    }
    const partes = FORMATO_ID.exec(id);
    if (!partes || !ORDEM_DAS_FASES.includes(id)) {
      return null;
    }
    return { mundo: Number(partes[1]), fase: Number(partes[2]) };
  }

  function faseExiste(id) {
    return lerIdDaFase(id) !== null;
  }

  /**
   * Só os ids válidos, sem repetição, na ordem oficial.
   * Valores estranhos (números, textos, fases inexistentes) são descartados.
   */
  function normalizarLista(lista) {
    if (!Array.isArray(lista)) {
      return [];
    }
    const presentes = new Set(lista.filter(faseExiste));
    return ORDEM_DAS_FASES.filter((id) => presentes.has(id));
  }

  /**
   * Quantas fases, desde a primeira, foram concluídas sem buraco.
   * Ex.: ["1-1", "1-2", "2-1"] → 2 (falta a "1-3").
   */
  function tamanhoDaSequencia(lista) {
    const presentes = lista instanceof Set ? lista : new Set(Array.isArray(lista) ? lista : []);
    let tamanho = 0;
    while (tamanho < ORDEM_DAS_FASES.length && presentes.has(ORDEM_DAS_FASES[tamanho])) {
      tamanho++;
    }
    return tamanho;
  }

  /** As fases concluídas em sequência, desde a primeira. */
  function fasesEmSequencia(lista) {
    return ORDEM_DAS_FASES.slice(0, tamanhoDaSequencia(lista));
  }

  /** A próxima fase a ser liberada, ou null se todas foram concluídas. */
  function proximaFase(lista) {
    return ORDEM_DAS_FASES[tamanhoDaSequencia(lista)] || null;
  }

  /**
   * Calcula o objeto que o menu sempre usou, a partir das fases concluídas:
   *   { mundosDesbloqueados, faseMaximaPorMundo, fasesConcluidas }
   *
   * Uma fase está liberada se todas as anteriores foram concluídas. Depois da
   * fase bônus (5-1) não existe "Mundo 6".
   */
  function derivarProgresso(lista) {
    const fasesConcluidas = normalizarLista(lista);
    const liberadas = ORDEM_DAS_FASES.slice(
      0,
      Math.min(tamanhoDaSequencia(fasesConcluidas) + 1, ORDEM_DAS_FASES.length)
    );

    const mundosDesbloqueados = [];
    const faseMaximaPorMundo = {};
    for (const id of liberadas) {
      const { mundo, fase } = lerIdDaFase(id);
      if (!mundosDesbloqueados.includes(mundo)) {
        mundosDesbloqueados.push(mundo);
      }
      faseMaximaPorMundo[mundo] = Math.max(faseMaximaPorMundo[mundo] || 0, fase);
    }

    return { mundosDesbloqueados, faseMaximaPorMundo, fasesConcluidas };
  }

  /**
   * Decide quais conclusões pedidas podem ser registradas, sem gravar nada.
   *
   *   registradas: fases já concluídas (no banco ou no navegador)
   *   pedidas:     fases que se quer registrar agora
   *
   * Devolve:
   *   aceitas:   fases novas, na ordem oficial, que seguem a sequência
   *   repetidas: fases que já estavam registradas (ou vieram duplicadas)
   *   recusadas: [{ fase, motivo }] com motivo
   *              "FASE_INEXISTENTE" (fora das 13 fases) ou
   *              "FORA_DE_ORDEM"    (alguma fase anterior não foi concluída)
   *
   * As pedidas são avaliadas na ordem oficial: ["1-2", "1-1"] em um progresso
   * vazio aceita as duas.
   */
  function avaliarNovasConclusoes(registradas, pedidas) {
    const conjunto = new Set(normalizarLista(registradas));
    const aceitas = [];
    const repetidas = [];
    const recusadas = [];

    const validas = new Set();
    for (const item of Array.isArray(pedidas) ? pedidas : []) {
      if (!faseExiste(item)) {
        recusadas.push({ fase: typeof item === "string" ? item.slice(0, 20) : String(item).slice(0, 20), motivo: "FASE_INEXISTENTE" });
      } else if (validas.has(item)) {
        repetidas.push(item);
      } else {
        validas.add(item);
      }
    }

    let tamanho = tamanhoDaSequencia(conjunto);
    for (const id of ORDEM_DAS_FASES) {
      if (!validas.has(id)) {
        continue;
      }
      if (conjunto.has(id)) {
        repetidas.push(id);
        continue;
      }
      if (ORDEM_DAS_FASES.indexOf(id) !== tamanho) {
        recusadas.push({ fase: id, motivo: "FORA_DE_ORDEM" });
        continue;
      }
      aceitas.push(id);
      conjunto.add(id);
      tamanho = tamanhoDaSequencia(conjunto);
    }

    return { aceitas, repetidas, recusadas };
  }

  return Object.freeze({
    ORDEM_DAS_FASES,
    TOTAL_FASES_POR_MUNDO,
    avaliarNovasConclusoes,
    derivarProgresso,
    faseExiste,
    fasesEmSequencia,
    idDaFase,
    lerIdDaFase,
    normalizarLista,
    proximaFase,
    tamanhoDaSequencia,
  });
});
