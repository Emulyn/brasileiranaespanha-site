# Site Brasileira na Espanha

Site da consultoria individual, publicado pelo **Netlify** a partir do repositório **github.com/Emulyn/brasileiranaespanha-site**.
Cada `git push` na branch `main` publica o site automaticamente.

## ✅ Lista para finalizar e lançar

### 1. Segurança das contas
- [ ] Verificação em duas etapas no **GitHub**
- [ ] Verificação em duas etapas no **Netlify**
- [ ] Verificação em duas etapas no **Stripe**
- [ ] Verificação em duas etapas no **Formspree**
- [ ] Verificação em duas etapas no **Cal.com**
- [ ] Verificação em duas etapas no **Hotmail**

### 2. Cal.com
- [ ] Apps → **Zoom** → Install; em cada evento, Location → **Zoom Video**
- [ ] Availability: **17:00 às 00:00**, fuso **Europe/Madrid**
- [ ] Conferir o limite de tempo do Zoom grátis (as consultorias têm 60 e 90 min)
- [ ] Se o plano permitir: exigir **24h de antecedência** para remarcar e cancelar

### 3. Conversa com a gestoría
- [ ] Alta de **autónoma**: preciso? Tenho direito à tarifa plana?
- [ ] **Stripe**: posso receber como autónoma? Qual NIF/NIE uso?
- [ ] **Aviso legal e política de privacidade**: o que precisa constar?
- [ ] **Cancelamento e devolução**: o que a lei exige para serviços online?

### 4. Depois da gestoría
- [ ] Preencher o **Aviso legal** (`publico/aviso-legal/index.html`), que é o último campo amarelo do site
- [ ] **Ativar o Stripe real** e criar os 3 links de pagamento de verdade
- [ ] Trocar os 3 links `test_` pelos reais em `publico/js/config.js`
- [ ] Atualizar a regra de cancelamento nas Perguntas frequentes, se a gestoría orientar

### 5. Lançamento
- [ ] Netlify: **Domain management → Add a domain** → `brasileiranaespanha.es` (DNS externo)
- [ ] IONOS: registro **A** do `@` → `75.2.60.5` (apagar o AAAA do `@`)
- [ ] IONOS: **CNAME** do `www` → endereço `.netlify.app` do projeto
- [ ] Não mexer nos registros **MX** e **TXT** da IONOS
- [ ] Stripe: trocar o endereço de retorno dos 3 links para
      `https://brasileiranaespanha.es/consultoria/seu-caso/?formato=FORMATO&session_id={CHECKOUT_SESSION_ID}`
      (FORMATO = essencial, completa ou acompanhamento)
- [ ] Netlify: **Make public** (tornar o projeto público)
- [ ] Teste final de ponta a ponta no domínio
- [ ] Divulgar! 🎉

## Como a contratação funciona

**Formatos → Cadastro → Pagamento (Stripe) → Seu caso → Agenda (Cal.com) → Página final**

| Etapa | Página | Serviço |
|---|---|---|
| Cadastro (filtro) | `consultoria/cadastro/` | Formspree, chega no e-mail |
| Pagamento | link do Stripe | Stripe, volta para "Seu caso" com `?formato=` e `session_id` |
| Seu caso | `consultoria/seu-caso/` | Formspree, chega no e-mail com `pagamento_stripe` |
| Agenda | `consultoria/agendar/` | Cal.com, agenda dentro da página |
| Página final | `consultoria/confirmado/` | contato: WhatsApp, e-mail e redes |

**Antes de cada consultoria:** procure no painel do Stripe o número `pagamento_stripe` (que chega no e-mail do "Seu caso") e confira se o pagamento existe e é do formato certo. O site não tem servidor, então não consegue conferir sozinho.

## Configuração (um lugar só)

Tudo fica em **`publico/js/config.js`**: WhatsApp, e-mail, Formspree, os 3 links do Stripe e as 3 agendas do Cal.com.
Cuidado com as vírgulas e com o `};` no final: um erro ali desliga o arquivo inteiro.

**Nunca coloque senhas nem a chave secreta do Stripe (`sk_...`) no site.** O repositório é público.

## Estrutura

```
publico/                      → vai para o ar (Netlify)
  index.html                  → Início
  sobre/                      → Minha história
  consultoria/                → Visão geral
  consultoria/formatos/       → Formatos e valores
  consultoria/como-funciona/  → Como funciona
  consultoria/perguntas/      → Perguntas frequentes
  consultoria/cadastro/       → etapa 1 (fora do Google)
  consultoria/seu-caso/       → etapa 3 (fora do Google)
  consultoria/agendar/        → etapa 4 (fora do Google)
  consultoria/confirmado/     → página final (fora do Google)
  conteudo/                   → Vídeos
  contato/                    → Contato
  aviso-legal/                → Aviso legal e privacidade
  css/estilo.css              → cores e fontes (variáveis no topo)
  js/config.js                → links e serviços
  js/fluxo.js                 → lógica dos formulários e da agenda
  img/                        → fotos
  _headers                    → cabeçalhos de segurança (Netlify)
  _redirects, .htaccess       → bloqueio do curso
  robots.txt, sitemap.xml     → Google

rascunhos/                    → NÃO vai para o GitHub nem para o ar (.gitignore)
  avios-na-pratica/           → curso bloqueado
```

O menu e o rodapé se repetem em todas as páginas. Para mudar um link em todas de uma vez: **Cmd + Shift + H** no VS Code.

## Ver no computador

No VS Code, clique com o botão direito em `publico/index.html` → **Open with Live Server**.

## Atualizar o site

```bash
git add .
git commit -m "o que você mudou"
git push
```

## Curso "Avios na Prática": bloqueado

A página existe só em `rascunhos/avios-na-pratica/`, que fica fora da pasta `publico` e fora do GitHub. Para lançar, siga os passos do comentário no início desse arquivo.

## Ideias para o futuro (Fase 3 do projeto)

- Um servidor próprio (por exemplo, em Java) com banco de dados para guardar os cadastros
- Conferir o pagamento no Stripe automaticamente antes de liberar a agenda
- Um painel com login para ver os clientes e a etapa de cada um
