/**
 * @file progresso.js
 * @description Módulo de Serviço de Gerenciamento de Progresso do Jogador.
 * 
 * ============================================================================
 * ARQUITETURA: PADRÃO DE SERVIÇO (SERVICE PATTERN) & LOCALSTORAGE MOCK
 * ============================================================================
 * Este arquivo implementa a camada de serviço responsável por toda a leitura
 * e gravação de progresso (mundos e fases desbloqueadas).
 * 
 * Atualmente, utiliza a API 'localStorage' do navegador como um mock (banco de
 * dados local temporário).
 * 
 * ⚠️ AVISO CRÍTICO PARA FUTUROS DESENVOLVEDORES (HUMANOS OU IA):
 * As assinaturas públicas das funções 'obterProgresso()' e
 * 'desbloquearProximaFase(faseAtual)' NUNCA DEVEM SER ALTERADAS.
 * 
 * Essa padronização garante desacoplamento arquitetural: quando o backend
 * oficial for integrado (Cruzeiro HUB via API REST / fetch / Axios), bastará
 * substituir as chamadas internas do localStorage por chamadas de rede assíncronas
 * sem quebrar nenhuma tela (menu.js, game.js, math.js) do jogo.
 * ============================================================================
 */

/**
 * Módulo de Serviço: Gerenciamento de Progresso
 * Utiliza sessionStorage como um mock (banco de dados temporário).
 * O progresso será resetado ao fechar o navegador/aba.
 */
/**
 * Obtém o progresso atual do jogador.
 * NÃO ALTERE A ASSINATURA DESTA FUNÇÃO.
 */

const CHAVE_PROGRESSO = 'arruma_bagunca_progresso';

function obterProgresso() {
    const dados = localStorage.getItem(CHAVE_PROGRESSO);
    if (dados) {
        return JSON.parse(dados);
    }
    
    return {
        mundosDesbloqueados: [1],
        faseMaximaPorMundo: { 1: 1 },
        fasesConcluidas: []
    };
}

/**
 * Registra a conclusão de uma fase e desbloqueia o que vier a seguir.
 *
 * Os parâmetros 'mundoAtual' e 'totalFases' são OPCIONAIS e seus valores
 * padrão reproduzem exatamente o comportamento anterior (Mundo 1, 3 fases).
 * Chamadas antigas de um único argumento continuam válidas e com o mesmo
 * resultado — a assinatura foi estendida, não alterada.
 *
 * NÃO ALTERE A ASSINATURA DESTA FUNÇÃO DE FORMA INCOMPATÍVEL.
 */
function desbloquearProximaFase(faseAtual, mundoAtual = 1, totalFases = 3) {
    const progresso = obterProgresso();

    // CORREÇÃO: Pega o texto (ex: "fase2"), extrai só o número usando RegEx e converte!
    const match = String(faseAtual).match(/\d+/);
    const faseConcluida = match ? parseInt(match[0], 10) : 1;

    const mundo = Number(mundoAtual) || 1;
    const total = Number(totalFases) || 3;

    // Garante que o mundo exista no mapa antes de comparar.
    // Sem isso, faseMaximaPorMundo[mundo] seria undefined e a comparação
    // "undefined < proximaFase" resultaria em false, ignorando a gravação.
    if (!progresso.faseMaximaPorMundo[mundo]) {
        progresso.faseMaximaPorMundo[mundo] = 1;
    }

    if (faseConcluida < total) {
        const proximaFase = faseConcluida + 1;
        if (progresso.faseMaximaPorMundo[mundo] < proximaFase) {
            progresso.faseMaximaPorMundo[mundo] = proximaFase;
        }
    } else if (faseConcluida === total) {
        const proximoMundo = mundo + 1;
        if (!progresso.mundosDesbloqueados.includes(proximoMundo)) {
            progresso.mundosDesbloqueados.push(proximoMundo);
            progresso.faseMaximaPorMundo[proximoMundo] = 1;
        }
    }

    // Identificação composta "mundo-fase" (ex: "1-1", "1-2", "2-1"),
    // para que a Fase 1 do Mundo 1 não colida com a Fase 1 do Mundo 2.
    const idFaseConcluida = `${mundo}-${faseConcluida}`;
    if (!progresso.fasesConcluidas.includes(idFaseConcluida)) {
        progresso.fasesConcluidas.push(idFaseConcluida);
    }

    localStorage.setItem(CHAVE_PROGRESSO, JSON.stringify(progresso));
}
