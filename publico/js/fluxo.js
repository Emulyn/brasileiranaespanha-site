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
      if (!form.checkValidity()) {
        erro.textContent = "Preencha os campos obrigatórios (*) para continuar.";
        erro.hidden = false;
        form.reportValidity();
        return;
      }
      var dados = Object.fromEntries(new FormData(form));
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
        guardar("cliente", { nome: dados.nome, email: dados.email, whatsapp: dados.whatsapp });
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
    if (dados.expectativa === "juridico") {
      painel = $("#resultado-juridico");
    } else if (dados.expectativa === "fazer" || dados.expectativa === "garantia") {
      painel = $("#resultado-expectativa");
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
      var url = link + (link.indexOf("?") > -1 ? "&" : "?") + "hide_gdpr_banner=1" +
        (cli.nome ? "&name=" + encodeURIComponent(cli.nome) : "") +
        (cli.email ? "&email=" + encodeURIComponent(cli.email) : "");
      agenda.innerHTML = '<div class="calendly-inline-widget" data-url="' + url + '" style="min-width:300px;height:720px"></div>' +
        '<p class="suave" style="margin-top:1rem;font-size:.92rem">A agenda não carregou? <a href="' + url + '" target="_blank" rel="noopener">Abrir em uma nova aba ↗</a></p>';
      if (!window.Calendly) {
        var s = document.createElement("script");
        s.src = "https://assets.calendly.com/assets/external/widget.js";
        s.async = true;
        document.body.appendChild(s);
      } else {
        window.Calendly.initInlineWidgets();
      }
    }
    botoes.forEach(function (b) {
      b.addEventListener("click", function () { mostrarAgenda(b.getAttribute("data-escolher-agenda")); });
    });
    var nome = (ler("cliente") || {}).nome;
    if (nome) { var t = $("#titulo-principal"); if (t) t.firstChild.textContent = nome.split(" ")[0] + ", escolha "; }
    mostrarAgenda(ler("formato") || "essencial");
  }
})();
