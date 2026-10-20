/**
 * @file palavras-bloqueadas.js
 * @description Lista INICIAL de apelidos não permitidos. O conteúdo deve ser
 * revisado e mantido pela equipe — esta é só a primeira versão.
 *
 * ============================================================================
 * COMO PREENCHER
 * ============================================================================
 * Escreva cada termo já NORMALIZADO: minúsculas, sem acentos e sem espaços
 * (ex.: "cuzão" → "cuzao"). A comparação é feita em apelido.js.
 *
 * - CONTEM: bloqueia se o termo aparecer em QUALQUER parte do apelido.
 *   Use só para termos longos e sem ambiguidade.
 *
 * - IGUAL: bloqueia só se o apelido INTEIRO for o termo (números são
 *   ignorados, então "cu123" também é bloqueado). Use para termos curtos que
 *   aparecem dentro de palavras inocentes, por exemplo:
 *     "puta"  está dentro de "computador"
 *     "viado" está dentro de "enviado"
 *     "bicha" está dentro de "bichano"
 *     "shit"  está dentro de "shitzu" (raça de cachorro)
 *
 * - RESERVADOS: nomes que poderiam se passar pela equipe ou pelo sistema.
 *   Mesma regra de IGUAL ("adm01" também é bloqueado).
 *
 * ============================================================================
 * ⚠️ LIMITAÇÕES — O FILTRO NÃO GARANTE MODERAÇÃO PERFEITA
 * ============================================================================
 * - Nenhuma lista cobre todas as grafias, gírias e combinações possíveis.
 * - Termos em CONTEM podem bloquear palavras inocentes (falso positivo); por
 *   isso termos curtos ficam em IGUAL — o que, por outro lado, deixa passar
 *   combinações como "putalegal" (falso negativo).
 * - Este arquivo fica no repositório e pode ser lido por qualquer pessoa com
 *   acesso a ele. Não é segredo; só não é enviado ao navegador.
 */

const CONTEM = [
  "arrombado",
  "arrombada",
  "babaca",
  "bitch",
  "boceta",
  "bosta",
  "buceta",
  "cacete",
  "caralho",
  "corno",
  "cuzao",
  "estuprador",
  "estupro",
  "foda",
  "foder",
  "fodido",
  "fuck",
  "fudido",
  "hitler",
  "idiota",
  "imbecil",
  "merda",
  "nazista",
  "otaria",
  "otario",
  "pedofilo",
  "piroca",
  "porno",
  "porra",
  "punheta",
  "putaria",
  "puteiro",
  "retardada",
  "retardado",
  "sapatao",
  "sexo",
  "vadia",
  "vagabunda",
  "vagabundo",
];

const IGUAL = [
  "bicha",
  "bunda",
  "cu",
  "dick",
  "pica",
  "puta",
  "puto",
  "shit",
  "viado",
  "xereca",
  "xoxota",
];

const RESERVADOS = [
  "adm",
  "admin",
  "administrador",
  "administradora",
  "moderador",
  "moderadora",
  "professor",
  "professora",
  "suporte",
];

module.exports = { CONTEM, IGUAL, RESERVADOS };
