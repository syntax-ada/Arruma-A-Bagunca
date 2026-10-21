# Tutorial: acesso administrativo e painel DEV

Este guia explica como configurar e usar o acesso administrativo do **Arruma a Bagunça** e o **painel DEV**, a ferramenta da equipe para testar o jogo (pular etapas, liberar mundos, zerar o progresso de teste etc.). O painel **não** é para as crianças.

> **Nunca coloque PIN, hash ou segredo neste documento, em mensagens, em issues ou em commits.** Os exemplos abaixo usam marcadores como `<hash gerado>`.

---

## Como funciona, em uma frase

- **No computador de quem desenvolve** (endereços `localhost`, `127.0.0.1` ou arquivo aberto direto): o painel abre com `?dev=true` no endereço, sem login.
- **No site publicado**: `?dev=true` sozinho não faz nada. O painel só abre depois de um login em `/admin.html` com o **código `ADM01`** e o **PIN**, e o navegador confere a sessão no servidor antes de mostrar o painel.

A sessão administrativa dura **60 minutos** e fica num cookie que o JavaScript da página não consegue ler (`HttpOnly`).

---

## 1. Configuração

### 1.1 Regras de ouro

- Os valores reais ficam **só** no arquivo `.env.local` (no seu computador; o git ignora esse arquivo) e nas variáveis de ambiente da Vercel.
- O arquivo `.env.example` é versionado e fica **sempre sem valores**: ele só mostra os nomes das variáveis.
- Guarde o PIN em um gerenciador de senhas. O hash do PIN e o segredo de sessão **não são o PIN**, mas também devem ser tratados como segredos.

### 1.2 As três variáveis

| Variável | O que é |
|---|---|
| `ADMIN_PIN_HASH` | Hash do PIN (o PIN em si nunca é guardado). |
| `ADMIN_SESSION_SECRET` | Texto aleatório com 32 ou mais caracteres que "assina" a sessão. Trocá-lo encerra todas as sessões abertas. |
| `ADMIN_ALLOWED_ORIGINS` | Endereços de onde o login é aceito, separados por vírgula, **sem barra no final**. Ex.: `http://localhost:3000` no computador; o endereço `https://…` do site na Vercel. |

Sem elas, o login responde *"Acesso administrativo indisponível no momento (configuração do servidor)."* e o painel não abre no site publicado. No computador, `?dev=true` funciona mesmo sem elas.

O login também precisa do **banco**: o limite de tentativas de PIN guarda os contadores no Supabase (`SUPABASE_URL`, `SUPABASE_SECRET_KEY` e a migração `supabase/migrations/20261021190000_sessoes_e_limites.sql` aplicada; ver [`seguranca.md`](seguranca.md)). Se o banco não responder, o login é **recusado** de propósito: sem o limite, ele ficaria aberto a tentativas sem fim.

### 1.3 Gerar o hash do PIN

1. Escolha um PIN só com números, de **10 a 12 dígitos**. O sistema aceita de 6 a 12, mas um PIN longo continua sendo a principal proteção, junto com o limite de tentativas (seção 5).
2. Na pasta do projeto, num terminal **PowerShell, cmd ou Windows Terminal**, rode:

   ```text
   node scripts/gerar-hash-pin.js
   ```

3. Digite o PIN e, depois, repita. A digitação aparece como `*`.
   - O PIN **não** vai no comando, então não fica no histórico do terminal.
   - No **Git Bash** a digitação não fica escondida, e o script avisa isso antes. Prefira os terminais acima.
4. O script imprime **uma linha** começando com `scrypt$16384$8$1$…`. Esse é o hash: copie essa linha.
   - Se os dois PINs forem diferentes ou tiverem letras, nada é gerado e o script explica o motivo.
   - Se o PIN tiver menos de 10 dígitos, aparece um aviso.

### 1.4 Gerar o segredo de sessão

No mesmo terminal:

```text
node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"
```

Copie o texto que aparecer. Cada execução gera um valor diferente.

### 1.5 Preencher o `.env.local` (no seu computador)

Se você já tem um `.env.local` (por exemplo, com as chaves do Supabase), **não apague nada**: só acrescente as três linhas. Se não tiver, copie o `.env.example` com o nome `.env.local` e preencha.

```text
ADMIN_PIN_HASH=<hash gerado no passo 1.3>
ADMIN_SESSION_SECRET=<segredo gerado no passo 1.4>
ADMIN_ALLOWED_ORIGINS=http://localhost:3000
```

- Não precisa de aspas: o hash com vários `$` é lido corretamente (verificado com Node 24).
- Se você abre o jogo por `http://127.0.0.1:3000`, inclua também esse endereço: `http://localhost:3000,http://127.0.0.1:3000`.
- Se usar outra porta (variável `PORTA`), ajuste o endereço.

Depois, inicie o servidor local **com o arquivo de variáveis**:

```text
node --env-file=.env.local scripts/servidor-local.js
```

### 1.6 Configurar na Vercel

> ⚠️ Estes passos **ainda não foram validados** no projeto publicado. Ver seção 5.

1. No projeto da Vercel, abra **Settings → Environment Variables**.
2. Crie as três variáveis em **Production** e em **Preview**, com os mesmos valores gerados acima. Se aparecer a opção de marcar como sensível, marque.
3. Em `ADMIN_ALLOWED_ORIGINS`, coloque o endereço `https://…` do site, sem barra no final. Um *Preview* com endereço próprio só aceita login se o endereço dele também estiver na lista (separado por vírgula).
4. Faça um novo deploy, porque variáveis novas só valem a partir do deploy seguinte.

### 1.7 Trocar o PIN ou encerrar todas as sessões

- **Trocar o PIN:** gere um novo hash (passo 1.3) e substitua `ADMIN_PIN_HASH` no `.env.local` e na Vercel. Na Vercel, faça um novo deploy.
- **Encerrar todas as sessões de uma vez:** gere um novo segredo (passo 1.4) e substitua `ADMIN_SESSION_SECRET`.

---

## 2. Usar o painel DEV

### 2.1 No computador (sem login)

Com o servidor local rodando:

- `http://localhost:3000/?dev=true` liga o painel. Aparece o botão **🛠️ [MODO DEV]** no canto inferior direito.
- O modo fica lembrado **nesta aba** enquanto ela estiver aberta.
- `http://localhost:3000/?dev=false` desliga.

Atalhos de teclado do painel:

| Atalho | Ação |
|---|---|
| Shift + C | Completar a etapa atual (ou responder a conta) |
| Shift + N | Ir para a próxima fase |
| Shift + R | Resetar o progresso **de teste** |
| Shift + D | Desbloquear todas as fases e mundos (no progresso **de teste**) |

No console do navegador (F12) também existem `dev.irPara(mundo, fase)`, `dev.completarFase()`, `dev.desbloquearTudo()`, `dev.resetarProgresso()`, `dev.desativar()` e outras; `dev.ajuda()` lista todas.

> **Progresso de teste:** com o painel ligado, o jogo usa um progresso separado, só deste navegador. Desbloquear Tudo, Resetar e as fases jogadas no modo DEV mexem **só nele**: o progresso do jogador identificado (no navegador e no banco) não muda e nada do modo DEV é enviado ao servidor. Ao desligar o painel, o menu volta a mostrar o progresso real do jogador. Detalhes em [`progresso-supabase.md`](progresso-supabase.md).

### 2.2 No site publicado (com login)

1. Abra `https://<endereço do site>/admin.html`. Essa página não tem link dentro do jogo.
2. Faça o login (seção 3).
3. Clique em **"Abrir o jogo com o painel DEV"**.
4. O jogo abre e, depois de uma rápida conferência no servidor, aparece o botão **🛠️ [MODO DEV]**.

O painel vale **na aba em que você fez o login**. Em outra aba, abra `/admin.html` de novo: se a sessão ainda estiver ativa, a página mostra *"Sessão ativa até HH:MM"* e o botão para abrir o jogo.

---

## 3. Login e logout

### Login (`/admin.html`)

1. **Código:** `ADM01` (é o único administrador nesta versão).
2. **PIN:** o PIN escolhido no passo 1.3.
3. Clique em **Entrar**. O campo do PIN é sempre limpo depois da tentativa.

| Mensagem na tela | O que significa |
|---|---|
| *Sessão iniciada.* / *Sessão ativa até HH:MM.* | Deu certo. A sessão dura 60 minutos. |
| *Código ou PIN inválidos.* | Código ou PIN errado. A mensagem é a mesma nos dois casos, de propósito. |
| *Abra esta página pelo endereço oficial do jogo.* | O endereço usado não está em `ADMIN_ALLOWED_ORIGINS`. |
| *Acesso administrativo indisponível no momento (configuração do servidor).* | Falta alguma das três variáveis, alguma está inválida, ou o banco que guarda o limite de tentativas não respondeu (migração não aplicada, Supabase fora do ar). |
| *Muitas tentativas. Espere alguns minutos e tente de novo.* | Passou do limite: 5 tentativas a cada 15 minutos na mesma rede, ou 30 por hora no total. Espere a janela acabar. |
| *Não foi possível falar com o servidor. Tente de novo.* | O servidor não respondeu. |

### Encerrar as sessões de um jogador

Com a sessão administrativa ativa, `/admin.html` mostra o campo **"Encerrar as sessões de um jogador"**. Digite o apelido e clique em **Encerrar sessões**: todas as sessões abertas daquela criança deixam de valer na hora (em qualquer aparelho), sem afetar os outros jogadores e **sem apagar o progresso**. O jogo continua guardando as fases no navegador; quando a criança entrar de novo pelo JOGAR, o que ficou pendente é enviado. Para encerrar uma sessão específica pelo id, veja [`seguranca.md`](seguranca.md).

### Logout

- Em `/admin.html`, clique em **Sair**. Aparece *"Sessão encerrada."*.
- Ou, com o painel aberto no site publicado, rode `dev.desativar()` no console. Isso também encerra a sessão.
- **Fechar a aba não encerra a sessão.** Ela continua valendo até completar 60 minutos. Use **Sair** ao terminar, principalmente em computador compartilhado.

---

## 4. Como testar se a proteção funciona

### 4.1 Testes automáticos

Na pasta do projeto:

```text
node --test
```

Todos devem passar. Eles usam valores de mentira (não precisam de PIN, segredo nem internet) e verificam, entre outras coisas:

- login certo e errado, código errado e PIN errado (mesma resposta);
- sessão ausente, adulterada ou expirada;
- logout;
- login vindo de um endereço não autorizado;
- tentativas repetidas de PIN (429), inclusive com o PIN certo, e o login recusado se o limite estiver indisponível;
- variáveis faltando;
- o próprio `js/dev.js`, simulando o site publicado: `?dev=true` sozinho e o `sessionStorage` editado à mão **não** abrem o painel.

### 4.2 Teste manual no site publicado

Faça depois de configurar a Vercel (seção 1.6). Use uma aba anônima, sem login:

| # | Faça | Resultado esperado |
|---|---|---|
| 1 | Abra `https://<site>/?dev=true` | **Não** aparece o botão [MODO DEV] e os mundos continuam bloqueados. |
| 2 | Aperte F12 → *Application* → *Session Storage* → crie `arruma_bagunca_dev` com valor `true` → recarregue | **Não** aparece o painel e a chave some. |
| 3 | Abra `/admin.html` e entre com um PIN errado | *"Código ou PIN inválidos."* |
| 4 | Entre com o PIN certo e clique em "Abrir o jogo com o painel DEV" | O painel aparece e os mundos ficam liberados. |
| 5 | F12 → *Application* → *Cookies*: veja o cookie `ab_admin` | Marcado como `HttpOnly` e `Secure`, com `SameSite` igual a `Strict` e caminho `/api`. |
| 6 | Volte a `/admin.html`, clique em **Sair** e recarregue o jogo | O painel não aparece mais. |

### 4.3 (Opcional, avançado) Simular o site publicado no computador

O painel trata como "publicado" qualquer endereço que não seja `localhost`, `127.0.0.1` ou arquivo local. Dá para simular isso no Chrome, criando um nome falso que aponta para o seu computador:

1. Acrescente `http://jogo.teste:3000` a `ADMIN_ALLOWED_ORIGINS` no `.env.local` e reinicie o servidor local.
2. Abra um Chrome separado (perfil temporário) no PowerShell:

   ```text
   & "C:\Program Files\Google\Chrome\Application\chrome.exe" --user-data-dir="$env:TEMP\chrome-teste-admin" --host-resolver-rules="MAP jogo.teste 127.0.0.1"
   ```

3. Nesse Chrome, use `http://jogo.teste:3000` e repita os passos da tabela 4.2. Neste caso o cookie **não** terá `Secure`, porque o endereço é `http`; isso é esperado.

---

## 5. Limitações e o que falta validar

### 5.1 Limitações de segurança (existem hoje)

- **Limite de tentativas de PIN:** 5 por rede a cada 15 minutos e 30 por hora no total. O teto geral protege contra tentativas espalhadas por muitos endereços, mas também permite que alguém **bloqueie o login da equipe por até 1 hora** errando o PIN de propósito. Nesse caso, no computador o painel continua abrindo com `?dev=true`.
- **A sessão administrativa não pode ser cancelada no servidor.** O "Sair" apaga o cookie do navegador, mas uma cópia do cookie feita antes continua válida até completar os 60 minutos. Para derrubar todas as sessões, troque o `ADMIN_SESSION_SECRET` (passo 1.7). (As sessões dos **jogadores** podem ser encerradas uma a uma; ver seção 3.)
- **O painel DEV roda no navegador.** Ele só mexe em dados guardados no próprio navegador. A restrição tira o painel do alcance das crianças, mas quem souber usar as ferramentas do desenvolvedor (F12) ainda consegue mexer nos próprios dados locais. Operações importantes no servidor devem sempre exigir a sessão administrativa.
- **O endereço `/admin.html` e o código `ADM01` não são segredo** (estão no código, que é público). A segurança depende só do PIN.
- **Login administrativo dentro de um iframe** (por exemplo, na futura integração com o Cruzeiro HUB) não deve funcionar, porque o cookie é `SameSite=Strict`. Faça o login sempre no endereço do próprio jogo.

### 5.2 O que já foi testado e o que falta

| Verificação | Situação |
|---|---|
| Testes automáticos (`node --test`), com valores de mentira | ✅ Feitos e passando |
| Navegador Chrome no computador, simulando o site publicado (passos da seção 4.3), com PIN e segredo de teste | ✅ Feito: `?dev=true` direto e o `sessionStorage` editado não abrem o painel; PIN errado é recusado; PIN certo abre o painel, inclusive dentro das fases; o "Sair" remove o cookie; no computador, `?dev=true` continua funcionando |
| Script do hash com a digitação escondida (`*`) num terminal interativo | ⏳ Não testado (só foi testado recebendo o PIN por entrada redirecionada) |
| Navegadores Safari e Firefox | ⏳ Não testados |
| **Vercel:** variáveis configuradas em Production e Preview | ⏳ Pendente |
| **Vercel:** login, painel e logout funcionando no site publicado (tabela 4.2) | ⏳ Pendente |
| **Vercel:** cookie com `Secure` em HTTPS num navegador real | ⏳ Pendente (só foi conferido no cabeçalho, em teste automático) |
| **Vercel:** leitura dos dados do login pelo servidor da Vercel | ⏳ Pendente (testado só no servidor local) |
| **Vercel:** endereços de *Preview* em `ADMIN_ALLOWED_ORIGINS` | ⏳ Pendente |
| Limite de tentativas de PIN (contadores no banco) | ✅ Testes automáticos com banco simulado e navegador Chrome no computador. ⏳ Pendente no Supabase real e na Vercel (roteiro em [`seguranca.md`](seguranca.md)) |

---

## 6. Problemas comuns

| Sintoma | Causa provável | O que fazer |
|---|---|---|
| *"Acesso administrativo indisponível no momento…"* | Variável faltando ou inválida, ou o servidor foi iniciado sem `--env-file=.env.local` | Confira a seção 1.5 e reinicie o servidor. O terminal do servidor mostra o **nome** da variável com problema (nunca o valor). |
| *"Abra esta página pelo endereço oficial do jogo."* | O endereço aberto não está em `ADMIN_ALLOWED_ORIGINS` (outra porta, `127.0.0.1` em vez de `localhost`, endereço de *Preview*) | Acrescente o endereço exato, sem barra no final. |
| Login funcionou, mas o painel não aparece no jogo | O jogo foi aberto em outra aba, ou a sessão passou de 60 minutos | Abra `/admin.html` na mesma aba e use o botão "Abrir o jogo com o painel DEV". |
| No console aparece *"[DEV] No site publicado, o painel exige login administrativo (admin.html)."* | Alguém tentou `?dev=true` no site publicado | É o comportamento esperado. |
| *"Os dois PINs não são iguais. Nada foi gerado."* | Erro de digitação | Rode o script de novo. |
| *"A porta 3000 já está em uso…"* | Outro programa usa a porta | Use outra porta (variável `PORTA`) e ajuste `ADMIN_ALLOWED_ORIGINS`. |

---

## Referências no código

- Tela de login: `admin.html` e `js/admin.js`.
- Servidor: `api/admin/login.js`, `api/admin/logout.js`, `api/admin/sessao.js`, `api/admin/revogar-sessao-jogador.js` e as regras em `api/_lib/admin.js`. Hash do PIN em `api/_lib/pin.js`; sessão e cookie em `api/_lib/sessao-admin.js`; limite de tentativas em `api/_lib/limite.js`.
- Painel DEV e regra local/publicado: `js/dev.js`.
- Script do hash: `scripts/gerar-hash-pin.js`.
- Testes: `testes/admin.test.js`, `testes/dev-acesso.test.js`, `testes/limite.test.js` e `testes/progresso-api.test.js` (revogação).
- Visão geral do projeto: [`README.md`](../README.md).
