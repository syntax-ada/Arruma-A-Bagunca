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

function desbloquearProximaFase(faseAtual) {
    const progresso = obterProgresso();
    
    // CORREÇÃO: Pega o texto (ex: "fase2"), extrai só o número usando RegEx e converte!
    const match = String(faseAtual).match(/\d+/);
    const faseConcluida = match ? parseInt(match[0], 10) : 1;
    
    if (faseConcluida < 3) {
        const proximaFase = faseConcluida + 1;
        if (progresso.faseMaximaPorMundo[1] < proximaFase) {
            progresso.faseMaximaPorMundo[1] = proximaFase;
        }
    } else if (faseConcluida === 3) {
        if (!progresso.mundosDesbloqueados.includes(2)) {
            progresso.mundosDesbloqueados.push(2);
            progresso.faseMaximaPorMundo[2] = 1;
        }
    }
    
    if (!progresso.fasesConcluidas.includes(faseConcluida)) {
        progresso.fasesConcluidas.push(faseConcluida);
    }

    localStorage.setItem(CHAVE_PROGRESSO, JSON.stringify(progresso));
}