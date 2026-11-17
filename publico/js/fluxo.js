/* ==========================================================================
   Fluxo de contratação: cadastro → pagamento → seu caso → agendamento.
   As configurações (Formspree, Stripe, Calendly) ficam em js/config.js.
   Não precisa mexer neste arquivo.
   ========================================================================== */
(function () {
  var c = window.CONFIG_SITE || {};
  var NOMES = { essencial: "Essencial", completa: "Completa", acompanhamento: "Acompanhamento" };

  function guardar(k, v) { try { localStorage.setItem("bne_" + k, JSON.stringify(v)); } catch (e) {} }
  function ler(k) { try { return JSON.parse(localStorage.getItem("bne_" + k)); } catch (e) { return null; } }
  function $(sel, raiz) { return (raiz || document).querySelector(sel); }

  // Formato vindo do link (?formato=completa) ou escolhido antes
  var params = new URLSearchParams(location.search);
  var formatoUrl = params.get("formato");
  if (formatoUrl && NOMES[formatoUrl]) guardar("formato", formatoUrl);

  /* ---------- Cadastro: perguntas conforme "Onde você mora hoje?" ---------- */
  // Mora na Espanha  → esconde o "momento" e mostra as opções de quem mora aqui.
  // Brasil ou outro  → mostra o "momento" e as opções de quem ainda vai.
  var perguntaAjuda = $("#pergunta-ajuda");
  var perguntaMomento = $("#pergunta-momento");

  function mostrarPergunta(fieldset, mostrar) {
    fieldset.hidden = !mostrar;
    fieldset.querySelectorAll("input").forEach(function (input) {
      input.disabled = !mostrar;            // pergunta escondida não é obrigatória nem enviada
      if (!mostrar) input.checked = false;
    });
  }

  if (perguntaAjuda) {
    function atualizarAjuda() {
      var marcado = document.querySelector('input[name="mora"]:checked');
      if (!marcado) {
        if (perguntaMomento) mostrarPergunta(perguntaMomento, false);
        perguntaAjuda.hidden = true;
        return;
      }
      var moraNaEspanha = marcado.value === "espanha";
      if (perguntaMomento) mostrarPergunta(perguntaMomento, !moraNaEspanha);
      var grupo = moraNaEspanha ? "dentro" : "fora";
      perguntaAjuda.querySelectorAll("[data-para]").forEach(function (label) {
        var para = label.getAttribute("data-para");
        var mostrar = para === "todos" || para === grupo;
        var input = label.querySelector("input");
        label.hidden = !mostrar;
        input.disabled = !mostrar;          // opção escondida não é enviada
        if (!mostrar) input.checked = false; // limpa escolha que não vale mais
      });
      perguntaAjuda.hidden = false;
    }
    document.querySelectorAll('input[name="mora"]').forEach(function (r) {
      r.addEventListener("change", atualizarAjuda);
    });

    // A opção jurídica é sempre sozinha: marcar ela desmarca as outras, e vice-versa
    perguntaAjuda.addEventListener("change", function (ev) {
      var alvo = ev.target;
      if (alvo.name !== "expectativa" || !alvo.checked) return;
      perguntaAjuda.querySelectorAll('input[name="expectativa"]').forEach(function (outro) {
        if (outro === alvo) return;
        var umDelesEJuridico = alvo.value === "juridico" || outro.value === "juridico";
        if (umDelesEJuridico) outro.checked = false;
      });
    });
    atualizarAjuda();
  }

  /* ---------- Formulários ---------- */
  document.querySelectorAll("form[data-form]").forEach(function (form) {
    var tipo = form.getAttribute("data-form");
    var botao = $("button[type=submit]", form);
    var erro = $(".form-erro", form);
    var aviso = $(".form-nao-conectado", form);

    // Preenche o que já sabemos
    var cliente = ler("cliente") || {};
    ["nome", "email", "whatsapp"].forEach(function (k) {
      var el = form.elements[k];
      if (el && !el.value && cliente[k]) el.value = cliente[k];
    });
    var f = ler("formato");
    if (f && form.elements.formato) {
      var r = form.querySelector('input[name=formato][value="' + f + '"]');
      if (r) r.checked = true;
    }

    // Sem Formspree configurado: não deixa enviar
    if (!(c.formspree || "").trim()) {
      botao.disabled = true;
      if (aviso) aviso.hidden = false;
      return;
    }

    form.addEventListener("submit", function (ev) {
      ev.preventDefault();
      erro.hidden = true;
      // Checkboxes de ajuda: pelo menos uma marcada (entre as visíveis)
      var ajudas = form.querySelectorAll('input[name="expectativa"]:not(:disabled)');
      if (ajudas.length && !form.querySelector('input[name="expectativa"]:checked')) {
        erro.textContent = "Marque pelo menos uma opção em \"Em que você precisa de ajuda?\".";
        erro.hidden = false;
        ajudas[0].focus();
        return;
      }
      if (!form.checkValidity()) {
        erro.textContent = "Preencha os campos obrigatórios (*) para continuar.";
        erro.hidden = false;
        form.reportValidity();
        return;
      }
      var fd = new FormData(form);
      var dados = Object.fromEntries(fd);
      // Campos com várias escolhas (checkbox): junta todas, separadas por vírgula
      var escolhas = fd.getAll("expectativa");
      dados.expectativa = escolhas.join(", ");
      dados.formato = dados.formato || ler("formato") || "";
      dados.etapa = tipo === "cadastro" ? "1 - Cadastro" : "3 - Seu caso";
      dados._subject = (tipo === "cadastro" ? "Novo cadastro: " : "Seu caso (pagou): ") + (dados.nome || "") + (dados.formato ? " · " + (NOMES[dados.formato] || dados.formato) : "");
      if (dados.email) dados._replyto = dados.email;

      botao.disabled = true;
      var textoBotao = botao.innerHTML;
      botao.textContent = "Enviando…";

      fetch(c.formspree, {
        method: "POST",
        headers: { "Accept": "application/json", "Content-Type": "application/json" },
        body: JSON.stringify(dados)
      }).then(function (resp) {
        if (!resp.ok) throw new Error("falha");
        var antes = ler("cliente") || {};
        guardar("cliente", {
          nome: dados.nome, email: dados.email,
          whatsapp: dados.whatsapp || antes.whatsapp,
          mora: dados.mora || antes.mora      // guarda onde mora para a página "Seu caso"
        });
        if (dados.formato && NOMES[dados.formato]) guardar("formato", dados.formato);
        depoisDeEnviar(tipo, dados, form);
      }).catch(function () {
        botao.disabled = false;
        botao.innerHTML = textoBotao;
        erro.textContent = "Não foi possível enviar agora. Confira a sua conexão e tente de novo.";
        erro.hidden = false;
      });
    });
  });

  function depoisDeEnviar(tipo, dados, form) {
    if (tipo === "caso") {
      location.href = "../agendar/";
      return;
    }
    // Cadastro
    form.hidden = true;
    var painel;
    var escolhas = dados.expectativa ? dados.expectativa.split(", ") : [];
    if (escolhas.indexOf("juridico") > -1) {
      // Visto, documentação ou problema jurídico: sempre indica advogado
      painel = $("#resultado-juridico");
    } else if (!NOMES[dados.formato]) {
      painel = $("#resultado-nao-sei");
    } else {
      painel = $("#resultado-pagamento");
      $("[data-nome-formato]", painel).textContent = NOMES[dados.formato];
      var link = ((c.pagamento || {})[dados.formato] || "").trim();
      var btn = $("[data-pagar]", painel);
      if (link) {
        btn.href = link;
        btn.removeAttribute("aria-disabled");
      } else {
        $("[data-aviso-pagamento]", painel).hidden = false;
      }
    }
    var primeiro = (dados.nome || "").split(" ")[0];
    painel.querySelectorAll("[data-primeiro-nome]").forEach(function (el) { el.textContent = primeiro; });
    painel.hidden = false;
    painel.focus();
    window.scrollTo({ top: painel.getBoundingClientRect().top + window.scrollY - 120 });
  }

  /* ---------- Seu caso: formato travado e textos conforme onde mora ---------- */
  var formatoBox = $("#formato-contratado");
  if (formatoBox) {
    // O formato vem do link de pagamento do Stripe (?formato=...), que é mais confiável
    var pago = formatoUrl && NOMES[formatoUrl] ? formatoUrl : null;
    if (pago) {
      $("strong", formatoBox).textContent = NOMES[pago];
      formatoBox.hidden = false;
      var escolha = $("#escolha-formato");
      escolha.hidden = true;
      escolha.querySelectorAll("input").forEach(function (i) { i.checked = i.value === pago; });
    }
    // Número do pagamento no Stripe, para você conferir quem pagou o quê
    var sessao = params.get("session_id");
    if (sessao) {
      var campo = document.createElement("input");
      campo.type = "hidden"; campo.name = "pagamento_stripe"; campo.value = sessao;
      formatoBox.closest("form").appendChild(campo);
    }
    // Textos diferentes para quem mora na Espanha e para quem vai se mudar
    var mora = (ler("cliente") || {}).mora;
    if (mora) {
      var chave = mora === "espanha" ? "data-espanha" : "data-fora";
      document.querySelectorAll("[" + chave + "]").forEach(function (el) {
        el.textContent = el.getAttribute(chave);
      });
    }
  }

  /* ---------- Página final (confirmado): saudação com o nome ---------- */
  var saudacao = $("[data-saudacao]");
  if (saudacao) {
    var primeiro = ((ler("cliente") || {}).nome || "").split(" ")[0];
    if (primeiro) saudacao.textContent = "Tudo certo, " + primeiro + "!";
  }

  /* ---------- Agendamento ---------- */
  var agenda = $("#agenda");
  if (agenda) {
    var botoes = document.querySelectorAll("[data-escolher-agenda]");
    function mostrarAgenda(formato) {
      guardar("formato", formato);
      botoes.forEach(function (b) { b.setAttribute("aria-pressed", b.getAttribute("data-escolher-agenda") === formato ? "true" : "false"); });
      var link = ((c.agenda || {})[formato] || "").trim();
      if (!link) {
        agenda.innerHTML = '<div class="agenda-vazia"><p><strong>Agenda do formato ' + NOMES[formato] + '</strong></p><p class="suave">[LINK DA AGENDA] — ainda não configurado em js/config.js</p></div>';
        return;
      }
      var cli = ler("cliente") || {};
      // Nome e e-mail já preenchidos na agenda (Cal.com e Calendly entendem name e email)
      var url = link + (link.indexOf("?") > -1 ? "&" : "?") +
        "name=" + encodeURIComponent(cli.nome || "") +
        "&email=" + encodeURIComponent(cli.email || "");

      if (link.indexOf("calendly.com") > -1) {
        // Calendly: agenda dentro da página
        agenda.innerHTML = '<div class="calendly-inline-widget" data-url="' + url + '&hide_gdpr_banner=1" style="min-width:300px;height:720px"></div>' +
          '<p class="suave" style="margin-top:1rem;font-size:.92rem">A agenda não carregou? <a href="' + url + '" target="_blank" rel="noopener">Abrir em uma nova aba ↗</a></p>';
        if (!window.Calendly) {
          var s = document.createElement("script");
          s.src = "https://assets.calendly.com/assets/external/widget.js";
          s.async = true;
          document.body.appendChild(s);
        } else {
          window.Calendly.initInlineWidgets();
        }
        return;
      }

      // Cal.com: agenda dentro da página. Quando a pessoa termina de agendar,
      // o Cal.com avisa o site ("bookingSuccessful") e levamos ela para a página final.
      if (link.indexOf("cal.com") > -1) {
        var calLink = link.replace(/^https?:\/\/(www\.)?cal\.com\//, "").replace(/[?#].*$/, "");
        agenda.innerHTML =
          '<div class="agenda-cal">' +
            '<p class="rotulo">Formato ' + NOMES[formato] + '</p>' +
            '<div id="cal-inline" style="width:100%;min-height:640px;overflow:auto"></div>' +
            '<p class="suave" style="margin-top:1.2rem;font-size:.92rem">A agenda não carregou? <a href="' + url + '" target="_blank" rel="noopener">Abrir em uma nova aba ↗</a></p>' +
            '<div class="acoes" style="margin-top:1rem"><a class="botao botao--linha" href="../confirmado/">Já marquei o meu horário <span class="seta" aria-hidden="true">→</span></a></div>' +
          '</div>';
        carregarCal(calLink, cli);
        return;
      }

      // Outra agenda qualquer: botão que abre em uma nova aba
      agenda.innerHTML =
        '<div class="agenda-cal">' +
          '<p class="rotulo">Formato ' + NOMES[formato] + '</p>' +
          '<h2>Última etapa: <em>escolha o seu horário.</em></h2>' +
          '<div class="acoes"><a class="botao botao--cheio" href="' + url + '" target="_blank" rel="noopener">Escolher dia e horário <span class="seta" aria-hidden="true">↗</span></a></div>' +
          '<div class="acoes" style="margin-top:1rem"><a class="botao botao--linha" href="../confirmado/">Já marquei o meu horário <span class="seta" aria-hidden="true">→</span></a></div>' +
        '</div>';
    }

    // Código oficial de incorporação do Cal.com (embed), adaptado
    function carregarCal(calLink, cli) {
      (function (C, A, L) {
        var p = function (a, ar) { a.q.push(ar); };
        var d = C.document;
        C.Cal = C.Cal || function () {
          var cal = C.Cal; var ar = arguments;
          if (!cal.loaded) { cal.ns = {}; cal.q = cal.q || []; d.head.appendChild(d.createElement("script")).src = A; cal.loaded = true; }
          if (ar[0] === L) {
            var api = function () { p(api, arguments); };
            var namespace = ar[1]; api.q = api.q || [];
            if (typeof namespace === "string") { cal.ns[namespace] = cal.ns[namespace] || api; p(cal.ns[namespace], ar); p(cal, ["initNamespace", namespace]); }
            else p(cal, ar);
            return;
          }
          p(cal, ar);
        };
      })(window, "https://app.cal.com/embed/embed.js", "init");

      if (!window.__calIniciado) { Cal("init", { origin: "https://cal.com" }); window.__calIniciado = true; }
      Cal("inline", {
        elementOrSelector: "#cal-inline",
        calLink: calLink,
        config: { name: cli.nome || "", email: cli.email || "", layout: "month_view" }
      });
      var irParaFinal = function () { location.href = "../confirmado/"; };
      Cal("on", { action: "bookingSuccessful", callback: irParaFinal });
      Cal("on", { action: "bookingSuccessfulV2", callback: irParaFinal });
    }
    botoes.forEach(function (b) {
      b.addEventListener("click", function () { mostrarAgenda(b.getAttribute("data-escolher-agenda")); });
    });
    var nome = (ler("cliente") || {}).nome;
    if (nome) { var t = $("#titulo-principal"); if (t) t.firstChild.textContent = nome.split(" ")[0] + ", escolha "; }
    // Se já sabemos o formato (vem do pagamento), não deixa trocar de agenda
    var formatoSalvo = ler("formato");
    var seletor = $(".seletor-formato");
    if (formatoSalvo && NOMES[formatoSalvo] && seletor) seletor.hidden = true;
    mostrarAgenda(formatoSalvo && NOMES[formatoSalvo] ? formatoSalvo : "essencial");
  }
})();
