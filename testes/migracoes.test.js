// Confere, no TEXTO das migrações (supabase/migrations/), as regras de
// segurança que o banco precisa ter. Não executa SQL: protege contra uma
// edição futura que tire o RLS, um revoke, o search_path fixo etc.
//
// A execução de verdade das migrações (permissões efetivas do service_role,
// RPC no formato do PostgREST, limpeza) foi conferida à parte num Postgres em
// memória; ver docs/seguranca.md.

const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const PASTA = path.join(__dirname, "..", "supabase", "migrations");
const ARQUIVOS = fs.readdirSync(PASTA).filter((f) => f.endsWith(".sql")).sort();

// SQL em minúsculas, sem comentários de linha e com espaços normalizados.
// Aceita quebras de linha LF e CRLF (cópias no Windows com core.autocrlf).
function lerSql(arquivo) {
  return fs
    .readFileSync(path.join(PASTA, arquivo), "utf8")
    .split(/\r?\n/)
    .map((linha) => linha.replace(/--.*$/, ""))
    .join("\n")
    .toLowerCase()
    .replace(/\s+/g, " ");
}

const SQL = Object.fromEntries(ARQUIVOS.map((arquivo) => [arquivo, lerSql(arquivo)]));
const TUDO = Object.values(SQL).join(" ");

test("as migrações têm nome versionado e rodam inteiras numa transação", () => {
  assert.ok(ARQUIVOS.length >= 2);
  for (const arquivo of ARQUIVOS) {
    assert.match(arquivo, /^\d{14}_[a-z0-9_]+\.sql$/, arquivo);
    const sql = SQL[arquivo].trim();
    assert.ok(sql.startsWith("begin;") && sql.endsWith("commit;"), `${arquivo}: begin … commit`);
  }
});

test("toda tabela criada tem RLS ligado e nada para anon/authenticated", () => {
  const tabelas = [...TUDO.matchAll(/create table public\.([a-z_]+)/g)].map((m) => m[1]);
  assert.deepEqual(tabelas.sort(), ["phase_completions", "player_sessions", "rate_limit_counters"]);
  for (const tabela of tabelas) {
    assert.ok(TUDO.includes(`alter table public.${tabela} enable row level security;`), `${tabela}: RLS`);
    assert.match(TUDO, new RegExp(`revoke all on table public\\.${tabela} from anon, authenticated(, service_role)?;`), `${tabela}: revoke`);
    assert.ok(!new RegExp(`grant [^;]* on table public\\.${tabela} to [^;]*(anon|authenticated)`).test(TUDO), `${tabela}: nenhum grant ao navegador`);
    assert.ok(!TUDO.includes("create policy"), "sem políticas: só o servidor acessa");
  }
});

test("o service_role recebe exatamente o que o servidor usa", () => {
  assert.ok(TUDO.includes("grant select, insert on table public.phase_completions to service_role;"));
  assert.ok(TUDO.includes("grant select, insert, delete on table public.player_sessions to service_role;"));
  assert.ok(TUDO.includes("grant update (revoked_at) on table public.player_sessions to service_role;"));
  assert.ok(TUDO.includes("grant select, insert, update, delete on table public.rate_limit_counters to service_role;"));
});

test("funções: SECURITY INVOKER, search_path fixo, VOLATILE e EXECUTE só para o service_role", () => {
  const funcoes = [...TUDO.matchAll(/create function public\.([a-z_]+)\(([^)]*)\)(.*?)as \$\$/g)];
  assert.deepEqual(funcoes.map((f) => f[1]).sort(), ["consumir_limite_requisicoes", "limpar_registros_temporarios"]);
  for (const [, nome, , atributos] of funcoes) {
    assert.ok(atributos.includes("security invoker"), `${nome}: security invoker`);
    assert.ok(atributos.includes("set search_path = ''"), `${nome}: search_path fixo`);
    // STABLE/IMMUTABLE faria o PostgREST usar transação só de leitura.
    assert.ok(!/\b(stable|immutable)\b/.test(atributos), `${nome}: precisa ser VOLATILE`);
    assert.match(TUDO, new RegExp(`revoke all on function public\\.${nome}\\([^)]*\\) from public, anon, authenticated;`), `${nome}: revoke`);
    assert.match(TUDO, new RegExp(`grant execute on function public\\.${nome}\\([^)]*\\) to service_role;`), `${nome}: grant`);
  }
  assert.ok(!TUDO.includes("security definer"));
});

test("a limpeza pula linhas em uso por outro pedido (sem esperar nem travar)", () => {
  const limpeza = /create function public\.limpar_registros_temporarios\(\).*?as \$\$(.*?)\$\$;/.exec(TUDO)[1];
  for (const tabela of ["rate_limit_counters", "player_sessions"]) {
    assert.match(limpeza, new RegExp(`delete from public\\.${tabela} where [a-z_]+ in \\( select [a-z_]+ from public\\.${tabela} where .*? for update skip locked \\)`), tabela);
  }
});
