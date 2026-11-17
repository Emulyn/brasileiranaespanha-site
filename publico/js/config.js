/* ==========================================================================
   CONFIGURAÇÃO DO SITE — preencha aqui uma vez e vale para todas as páginas.
   Enquanto um link estiver vazio (""), o botão aparece tracejado com o aviso
   "ainda não configurado" e não leva a lugar nenhum. Nada é enviado.
   O passo a passo para criar cada conta está no LEIA-ME.md.
   ========================================================================== */

window.CONFIG_SITE = {
  // WhatsApp no formato https://wa.me/34XXXXXXXXX (só números, com código do país)
  whatsapp: "https://wa.me/34681688686?text=Ol%C3%A1%2C%20vim%20pelo%20site%20e%20tenho%20uma%20d%C3%BAvida%20sobre%20a%20consultoria",

  // E-mail de contato (só o endereço, ex.: contato@brasileiranaespanha.es)
  email: "brasileiranaespanha@hotmail.com",

  // Formspree: endereço do formulário (ex.: "https://formspree.io/f/abcdwxyz")
  // As respostas do cadastro e do "seu caso" chegam no seu e-mail.
  formspree: "https://formspree.io/f/xjywwary",,

  // Stripe: um Payment Link para cada formato (ex.: "https://buy.stripe.com/xxxx")
  // No Stripe, depois do pagamento, redirecione para:
  //   https://brasileiranaespanha.es/consultoria/seu-caso/
  pagamento: {
    essencial: "",
    completa: "",
    acompanhamento: ""
  },

  // Calendly: um evento para cada formato (ex.: "https://calendly.com/seu-usuario/essencial")
  agenda: {
    essencial: "",
    completa: "",
    acompanhamento: ""
  }
};

/* --------------------------------------------------------------------------
   Daqui para baixo não precisa mexer.
   -------------------------------------------------------------------------- */
(function () {
  var c = window.CONFIG_SITE;
  var nomes = { whatsapp: "[LINK DO WHATSAPP]", email: "[E-MAIL DE CONTATO]" };

  document.querySelectorAll("[data-link]").forEach(function (el) {
    var tipo = el.getAttribute("data-link");
    var valor = (c[tipo] || "").trim();
    if (valor) {
      el.setAttribute("href", tipo === "email" ? "mailto:" + valor : valor);
      if (tipo !== "email") { el.setAttribute("target", "_blank"); el.setAttribute("rel", "noopener"); }
      if (el.hasAttribute("data-mostrar")) el.textContent = valor;
      el.removeAttribute("aria-disabled");
    } else {
      el.removeAttribute("href");
      el.setAttribute("aria-disabled", "true");
      el.setAttribute("title", (nomes[tipo] || tipo) + " — ainda não configurado");
      if (el.hasAttribute("data-mostrar")) el.textContent = nomes[tipo] || tipo;
    }
  });

  document.querySelectorAll("[data-aviso-link]").forEach(function (el) {
    el.hidden = !!(c[el.getAttribute("data-aviso-link")] || "").trim();
  });
})();
