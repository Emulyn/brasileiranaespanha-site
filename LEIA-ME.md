# Site Brasileira na Espanha

## O que vai para o servidor

**Só o conteúdo da pasta `publico/`.** Envie o que está dentro dela para a raiz do seu domínio (brasileiranaespanha.es), no lugar dos arquivos atuais.

```
publico/
  index.html                           → /                (Início)
  sobre/index.html                     → /sobre/          (Minha história)
  consultoria/index.html               → /consultoria/    (Visão geral)
  consultoria/como-funciona/index.html → /consultoria/como-funciona/
  consultoria/perguntas/index.html     → /consultoria/perguntas/
  consultoria/formatos/index.html      → /consultoria/formatos/
  consultoria/cadastro/index.html      → etapa 1 do fluxo (fora do Google)
  consultoria/seu-caso/index.html      → etapa 3, depois do pagamento (fora do Google)
  consultoria/agendar/index.html       → etapa 4, agenda (fora do Google)
  conteudo/index.html                  → /conteudo/       (Vídeos e redes)
  contato/index.html                   → /contato/
  aviso-legal/index.html               → /aviso-legal/    (modelo para revisar)
  404.html, favicon.svg
  css/estilo.css           → cores, fontes e layout (variáveis no topo)
  js/config.js             → WhatsApp, e-mail, Formspree, Stripe e Calendly
  js/fluxo.js              → faz os formulários e a agenda funcionarem (não mexer)
  img/                     → suas fotos (veja img/LEIA-ME.txt)
  robots.txt, sitemap.xml  → para o Google (não citam o curso)
  .htaccess, _redirects    → bloqueio extra do curso no servidor

rascunhos/                 → NUNCA enviar para o servidor
  avios-na-pratica/index.html
```

**Atenção:** o menu e o rodapé se repetem em todas as páginas. Se mudar um link do menu, mude nas 8 páginas (no VS Code: Cmd+Shift+H, "substituir em todos os arquivos").

A página antiga `/cadastro` não faz parte do site novo. Se ela continuar no servidor, apague-a ou aponte o link do formulário (em `js/config.js`) para ela só depois que ela estiver enviando os dados de verdade.

## Ver no seu computador

Abra a pasta no VS Code e use a extensão **Live Server** (botão "Go Live") em `publico/index.html`.


## Como ligar o fluxo de contratação

O caminho da cliente é: **Formatos → Cadastro → Pagamento (Stripe) → Seu caso → Agendamento (Calendly)**. Tudo se configura em `publico/js/config.js`.

**1. Formulários (Formspree, grátis até 50 envios por mês)**
1. Crie uma conta em formspree.io com o seu e-mail.
2. Clique em "New form", dê o nome "Consultoria" e copie o endereço que aparece (https://formspree.io/f/...).
3. Cole em `formspree`. O cadastro e o "seu caso" passam a chegar no seu e-mail, com o assunto já dizendo a etapa e o formato.

**2. Pagamento (Stripe)**
1. Crie a conta em stripe.com (a Stripe pede seus dados fiscais).
2. Em Catálogo de produtos, crie os 3 produtos com os preços.
3. Em Links de pagamento, crie um link para cada produto. Na aba "Após o pagamento", escolha redirecionar para `https://brasileiranaespanha.es/consultoria/seu-caso/`.
4. Cole cada link em `pagamento.essencial`, `pagamento.completa` e `pagamento.acompanhamento`.

**3. Agenda (Calendly)**
1. Crie a conta em calendly.com e um tipo de evento para cada formato, com a duração certa.
2. Cole os links em `agenda.essencial`, `agenda.completa` e `agenda.acompanhamento`.

**Importante:** como o site é simples (sem servidor), ele não consegue conferir se a pessoa pagou antes de abrir a agenda. Antes de cada conversa, confira no Stripe se o pagamento entrou. Se um dia quiser automático, o Calendly pago consegue cobrar no próprio agendamento.

## Campos que você precisa preencher

Os campos aparecem no site com fundo amarelo e entre colchetes. Para achar todos, procure por `[` no VS Code (Cmd+Shift+F).

**Em `js/config.js` (vale para todas as páginas):**
- `whatsapp`: link no formato https://wa.me/34XXXXXXXXX
- `formspree`, `pagamento` e `agenda`: veja "Como ligar o fluxo de contratação"
- `email`: e-mail de contato

**Minha história (`publico/sobre/index.html`):** sua história em 4 campos.

**Vídeos (`publico/conteudo/index.html`):** títulos dos 3 vídeos em destaque.

**Aviso legal (`publico/aviso-legal/index.html`):** nome, NIF/NIE, endereço; revisar com um profissional.

**Início (`publico/index.html`):** legenda da foto e descrição da foto do dia a dia.

**Consultoria, Como funciona e Perguntas (`publico/consultoria/...`):**
- [PREÇO] (aparece 2 vezes)
- [FORMA DE PAGAMENTO] (2 vezes) e [COMO É FEITO O PAGAMENTO]
- [DIAS E HORÁRIOS DISPONÍVEIS]
- [OUTRO PERFIL QUE VOCÊ ATENDE], [OUTRO TEMA], [DESCRIÇÃO DO TEMA] (ou apague essas linhas)
- [COMO MARCAR: pelo WhatsApp ou pela agenda online]
- [FORMATO E PRAZO DE ENVIO DO RESUMO] e [O QUE O RESUMO TRAZ E QUANDO É ENVIADO]
- [PLATAFORMA: Google Meet, Zoom…]
- [SUA POLÍTICA DE REMARCAÇÃO E CANCELAMENTO]

**Fotos (`publico/img/`):**
- `emulyn.jpg`: foto sua vertical para o topo da página inicial
- `emulyn-sobre.jpg`: outra foto sua, mais próxima, para Minha história
- `dia-a-dia.jpg`: foto horizontal da sua rotina ou cidade
- `compartilhar.jpg`: imagem 1200 x 630 px para a prévia de links

## Curso "Avios na Prática": bloqueado

A página existe só em `rascunhos/avios-na-pratica/`, fora da pasta `publico`. Ela não está no menu, no rodapé nem no sitemap, tem `noindex`, e o servidor responde "página não encontrada" para `/avios-na-pratica` mesmo se a pasta for enviada por engano.

**Para lançar:** siga os 6 passos escritos no comentário do início de `rascunhos/avios-na-pratica/index.html`.
