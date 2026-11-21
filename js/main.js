/**
 * Clima Los Ángeles — Rank & Rent lead engine
 * Pre-arriendo: deja phoneE164 vacío → se ocultan tel/WhatsApp.
 * Al arrendar: completa phoneE164 + whatsappEnabled = true.
 */
const SITE_CONFIG = {
  brandName: "Aire Acondicionado Los Ángeles",
  phoneDisplay: "",
  phoneE164: "",
  whatsappEnabled: false,
  email: "eduardoers@outlook.cl",
  domain: "https://climatizacionlosangeles.cl/",
  city: "Los Ángeles",
  formEndpoint: "https://formsubmit.co/ajax/eduardoers@outlook.cl",
  gaMeasurementId: "G-R0V2LSK44J",
};

const BTU_SIZES = [9000, 12000, 18000, 24000];

const SUN_FACTOR = {
  baja: 550,
  media: 650,
  alta: 800,
};

const USE_FACTOR = {
  dormitorio: 1,
  living: 1.15,
  oficina: 1.25,
};

const USE_LABEL = {
  dormitorio: "Dormitorio",
  living: "Living-Comedor",
  oficina: "Oficina-Local",
};

const SUN_LABEL = {
  baja: "Baja",
  media: "Media",
  alta: "Alta",
};

const INSULATION_FACTOR = {
  buena: 0.9,
  media: 1,
  mala: 1.2,
};

const ROOF_FACTOR = {
  teja: 1,
  zinc: 1.15,
  losa: 0.95,
};

const FLOOR_FACTOR = {
  1: 1,
  2: 1.08,
};

const WINDOW_FACTOR = {
  termopanel: 0.92,
  simple: 1.12,
};

function hasPhone() {
  return Boolean(SITE_CONFIG.phoneE164 && String(SITE_CONFIG.phoneE164).replace(/\D/g, "").length >= 8);
}

function trackEvent(name, payload = {}) {
  const detail = { name, ...payload, ts: Date.now() };
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ event: name, ...payload, ts: detail.ts });
  document.dispatchEvent(new CustomEvent("site:track", { detail }));

  if (typeof window.gtag === "function") {
    window.gtag("event", name, payload);
  }
}

function loadGA4() {
  if (!SITE_CONFIG.gaMeasurementId || window.__gaLoaded) return;
  window.__gaLoaded = true;

  window.dataLayer = window.dataLayer || [];
  function gtag() {
    window.dataLayer.push(arguments);
  }
  window.gtag = gtag;
  gtag("js", new Date());
  gtag("config", SITE_CONFIG.gaMeasurementId, { anonymize_ip: true });

  const s = document.createElement("script");
  s.async = true;
  s.src = `https://www.googletagmanager.com/gtag/js?id=${SITE_CONFIG.gaMeasurementId}`;
  document.head.appendChild(s);
}

function deferGA4() {
  if (!SITE_CONFIG.gaMeasurementId) return;

  const trigger = () => {
    loadGA4();
    cleanup();
  };

  const cleanup = () => {
    ["scroll", "pointerdown", "keydown", "touchstart"].forEach((evt) => {
      window.removeEventListener(evt, trigger, { passive: true });
    });
  };

  ["scroll", "pointerdown", "keydown", "touchstart"].forEach((evt) => {
    window.addEventListener(evt, trigger, { once: true, passive: true });
  });

  if ("requestIdleCallback" in window) {
    requestIdleCallback(trigger, { timeout: 4500 });
  } else {
    setTimeout(trigger, 4500);
  }
}

function applyBrandConfig() {
  document.querySelectorAll("[data-brand-name]").forEach((el) => {
    el.textContent = SITE_CONFIG.brandName;
  });

  document.querySelectorAll("[data-email-text]").forEach((el) => {
    el.textContent = SITE_CONFIG.email;
  });

  document.querySelectorAll("[data-email-link]").forEach((el) => {
    el.setAttribute("href", `mailto:${SITE_CONFIG.email}`);
  });

  const phoneReady = hasPhone();
  document.body.classList.toggle("has-phone", phoneReady);
  document.body.classList.toggle("no-phone", !phoneReady);

  document.querySelectorAll("[data-phone-only]").forEach((el) => {
    el.hidden = !phoneReady;
  });

  if (phoneReady) {
    document.querySelectorAll("[data-phone-text]").forEach((el) => {
      el.textContent = SITE_CONFIG.phoneDisplay || `+${SITE_CONFIG.phoneE164}`;
    });
    document.querySelectorAll("[data-phone-link]").forEach((el) => {
      el.setAttribute("href", `tel:+${SITE_CONFIG.phoneE164}`);
    });
  }

  initWhatsAppButton();
}

function buildWhatsAppUrl(extra = "") {
  if (!hasPhone() || !SITE_CONFIG.whatsappEnabled) return null;
  const page = document.title || SITE_CONFIG.brandName;
  const base = `Hola, quiero cotizar climatización en ${SITE_CONFIG.city}. Vengo desde: ${page}.`;
  const text = encodeURIComponent(extra ? `${base} ${extra}` : base);
  return `https://wa.me/${SITE_CONFIG.phoneE164}?text=${text}`;
}

function initWhatsAppButton() {
  const existing = document.getElementById("wa-float");
  const url = buildWhatsAppUrl();

  if (!url) {
    if (existing) existing.remove();
    return;
  }

  if (existing) {
    existing.setAttribute("href", url);
    return;
  }

  const a = document.createElement("a");
  a.id = "wa-float";
  a.className = "wa-float";
  a.href = url;
  a.target = "_blank";
  a.rel = "noopener noreferrer";
  a.setAttribute("aria-label", "Escribir por WhatsApp");
  a.innerHTML = `<svg viewBox="0 0 24 24" width="28" height="28" aria-hidden="true"><path fill="currentColor" d="M20.5 3.5A11 11 0 0 0 3.4 17.7L2 22l4.4-1.4A11 11 0 1 0 20.5 3.5zM12 20.2a9.1 9.1 0 0 1-4.6-1.3l-.3-.2-2.7.9.9-2.6-.2-.3A9.1 9.1 0 1 1 12 20.2zm5-6.8c-.3-.1-1.6-.8-1.9-.9-.2-.1-.4-.1-.6.1-.2.3-.7.9-.8 1-.2.2-.3.2-.6.1a7.4 7.4 0 0 1-2.2-1.4 8.2 8.2 0 0 1-1.5-1.9c-.2-.3 0-.4.1-.6l.5-.6c.1-.2.1-.3 0-.5l-.9-2.1c-.2-.5-.5-.5-.6-.5h-.5c-.2 0-.5.1-.7.3-.2.3-.9.9-.9 2.1s.9 2.4 1 2.6c.1.2 1.8 2.8 4.4 3.9 2.6 1.1 2.6.7 3.1.7.5 0 1.5-.6 1.7-1.2.2-.6.2-1.1.1-1.2-.1-.1-.3-.2-.6-.3z"/></svg>`;
  a.addEventListener("click", () => trackEvent("whatsapp_click", { source: "float" }));
  document.body.appendChild(a);
}

function initMobileNav() {
  const toggle = document.querySelector(".nav-toggle");
  const nav = document.getElementById("nav-menu");
  if (!toggle || !nav) return;

  const closeNav = () => {
    nav.classList.remove("is-open");
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-label", "Abrir menú");
  };

  toggle.addEventListener("click", () => {
    const open = !nav.classList.contains("is-open");
    nav.classList.toggle("is-open", open);
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Cerrar menú" : "Abrir menú");
    trackEvent("menu_toggle", { open });
  });

  nav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", closeNav);
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeNav();
  });
}

function setFormStatus(form, type, message) {
  const status = form.querySelector("[data-form-status]");
  if (!status) return;
  status.hidden = false;
  status.dataset.state = type;
  status.textContent = message;
}

function fillQuoteFromBTU({ btu, m2, sol, uso, extras = "" }) {
  const form = document.getElementById("quote-form");
  if (!form) return;

  if (m2 && form.metros) form.metros.value = String(m2);
  if (form.servicio && !form.servicio.value) form.servicio.value = "Instalación";

  const notes = form.querySelector('[name="mensaje"]');
  if (notes) {
    notes.value = `Cotización desde calculadora BTU: ${btu.toLocaleString("es-CL")} BTU · ${m2} m² · Sol ${SUN_LABEL[sol]} · Uso ${USE_LABEL[uso]}${extras ? ` · ${extras}` : ""}`;
  }

  form.scrollIntoView({ behavior: "smooth", block: "center" });
  form.querySelector('[name="nombre"]')?.focus();
}

async function submitLead(form, payload, eventName) {
  const submitBtn = form.querySelector('[type="submit"]');
  const originalLabel = submitBtn?.innerHTML;
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.textContent = "Enviando…";
  }

  setFormStatus(form, "pending", "Enviando tu solicitud…");

  try {
    const res = await fetch(SITE_CONFIG.formEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        ...payload,
        _subject: `Lead web — ${SITE_CONFIG.brandName}`,
        _template: "table",
        _captcha: "false",
      }),
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    trackEvent(eventName, payload);
    form.reset();
    setFormStatus(
      form,
      "ok",
      "Listo. Recibimos tu solicitud y te contactamos a la brevedad."
    );
  } catch (err) {
    trackEvent("lead_form_error", { reason: String(err?.message || err) });
    const phoneHint = hasPhone()
      ? ` o llama al ${SITE_CONFIG.phoneDisplay}`
      : "";
    setFormStatus(
      form,
      "error",
      `No pudimos enviar el formulario. Escríbenos a ${SITE_CONFIG.email}${phoneHint}.`
    );
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalLabel || "Enviar cotización";
    }
  }
}

function initQuoteForm() {
  const form = document.getElementById("quote-form");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const data = new FormData(form);
    const nombre = String(data.get("nombre") || "").trim();
    const telefono = String(data.get("telefono") || "").trim();
    const email = String(data.get("email") || "").trim();
    const sector = String(data.get("sector") || "").trim();
    const servicio = String(data.get("servicio") || "").trim();
    const metros = String(data.get("metros") || "").trim();
    const mensaje = String(data.get("mensaje") || "").trim();

    // CRO: nombre, teléfono, sector y servicio son el mínimo; respeta required HTML extra
    if (!nombre || !telefono || !sector || !servicio || !form.checkValidity()) {
      trackEvent("quote_form_invalid");
      form.reportValidity();
      return;
    }

    await submitLead(
      form,
      {
        nombre,
        telefono,
        email: email || "(no informado)",
        sector,
        servicio,
        metros: metros ? `${metros} m²` : "(no informado)",
        mensaje: mensaje || "(sin mensaje)",
        ciudad: SITE_CONFIG.city,
        origen: form.dataset.origin || "quote_form",
        pagina: location.pathname,
      },
      "quote_form_submit"
    );
  });
}

function resolveSquareMeters(form) {
  const largo = parseFloat(form.largo?.value);
  const ancho = parseFloat(form.ancho?.value);
  const totales = parseFloat(form.metrosTotales?.value);

  if (!Number.isNaN(totales) && totales > 0) return totales;
  if (!Number.isNaN(largo) && !Number.isNaN(ancho) && largo > 0 && ancho > 0) {
    return Number((largo * ancho).toFixed(2));
  }
  return null;
}

function nearestBTU(raw) {
  let best = BTU_SIZES[BTU_SIZES.length - 1];
  for (const size of BTU_SIZES) {
    if (raw <= size * 1.05) {
      best = size;
      break;
    }
  }
  if (raw > 24000) best = 24000;
  if (raw <= 9000) best = 9000;
  return best;
}

function explainBTU({ btu, m2, sol, uso }) {
  const reasons = [];

  if (sol === "alta") {
    reasons.push("alta exposición solar típica de veranos sobre 33–35 °C en Los Ángeles");
  } else if (sol === "media") {
    reasons.push("exposición solar media y necesidad de margen térmico");
  } else {
    reasons.push("baja exposición solar, priorizando eficiencia sin sobredimensionar");
  }

  if (uso === "living") {
    reasons.push("uso en living-comedor con mayor carga térmica y circulación de personas");
  } else if (uso === "oficina") {
    reasons.push("uso en oficina/local con equipos electrónicos y ocupación continua");
  } else {
    reasons.push("uso en dormitorio, donde el confort nocturno y el silencio importan");
  }

  return `Para ~${m2} m² con exposición ${SUN_LABEL[sol].toLowerCase()} y uso de ${USE_LABEL[uso].toLowerCase()}, recomendamos ${btu.toLocaleString("es-CL")} BTU por ${reasons[0]} y ${reasons[1]}. En invierno, un Inverter de esta capacidad también cubre calefacción limpia frente a la leña.`;
}

function initBTUCalculator() {
  const form = document.getElementById("btu-form");
  const resultBtu = document.getElementById("result-btu");
  const resultCopy = document.getElementById("result-copy");
  const quoteBtn = document.getElementById("btu-quote");
  if (!form || !resultBtu || !resultCopy || !quoteBtn) return;

  let lastResult = null;

  const syncDimensionInputs = () => {
    const largo = parseFloat(form.largo?.value);
    const ancho = parseFloat(form.ancho?.value);
    if (!Number.isNaN(largo) && !Number.isNaN(ancho) && largo > 0 && ancho > 0 && form.metrosTotales) {
      form.metrosTotales.value = String(Number((largo * ancho).toFixed(1)));
    }
  };

  form.largo?.addEventListener("input", syncDimensionInputs);
  form.ancho?.addEventListener("input", syncDimensionInputs);

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const m2 = resolveSquareMeters(form);
    const sol = form.querySelector('input[name="sol"]:checked')?.value || "media";
    const uso = form.querySelector('input[name="uso"]:checked')?.value || "dormitorio";
    const aislacion = form.querySelector('input[name="aislacion"]:checked')?.value || "media";
    const techo = form.querySelector('input[name="techo"]:checked')?.value || "teja";
    const piso = form.querySelector('input[name="piso"]:checked')?.value || "1";
    const ventanas = form.querySelector('input[name="ventanas"]:checked')?.value || "simple";

    if (!m2) {
      if (form.metrosTotales) {
        form.metrosTotales.setCustomValidity("Ingresa m² totales o largo y ancho.");
        form.metrosTotales.reportValidity();
        form.metrosTotales.setCustomValidity("");
      }
      trackEvent("btu_calc_invalid");
      return;
    }

    const advanced =
      (INSULATION_FACTOR[aislacion] || 1) *
      (ROOF_FACTOR[techo] || 1) *
      (FLOOR_FACTOR[piso] || 1) *
      (WINDOW_FACTOR[ventanas] || 1);

    const raw = m2 * SUN_FACTOR[sol] * USE_FACTOR[uso] * advanced;
    const btu = nearestBTU(raw);
    let explanation = explainBTU({ btu, m2, sol, uso });

    const extrasParts = [];
    if (form.querySelector('input[name="aislacion"]')) extrasParts.push(`aislación ${aislacion}`);
    if (form.querySelector('input[name="techo"]')) extrasParts.push(`techo ${techo}`);
    if (form.querySelector('input[name="piso"]')) extrasParts.push(`piso ${piso}`);
    if (form.querySelector('input[name="ventanas"]')) extrasParts.push(`ventanas ${ventanas}`);
    const extras = extrasParts.join(", ");

    if (extras) {
      explanation += ` Ajuste local: ${extras}.`;
    }

    resultBtu.textContent = `${btu.toLocaleString("es-CL")} BTU`;
    resultCopy.textContent = explanation;
    lastResult = { btu, m2, sol, uso, extras };

    quoteBtn.classList.remove("is-disabled");
    quoteBtn.setAttribute("aria-disabled", "false");
    quoteBtn.textContent = `Cotizar equipo de ${btu.toLocaleString("es-CL")} BTU`;

    const waUrl = buildWhatsAppUrl(
      `Necesito ~${btu.toLocaleString("es-CL")} BTU para ${m2} m² (${USE_LABEL[uso]}).`
    );
    if (waUrl) {
      quoteBtn.dataset.wa = waUrl;
    }

    trackEvent("btu_calc_submit", {
      m2,
      sol,
      uso,
      btu,
      raw: Math.round(raw),
      aislacion,
      techo,
      piso,
      ventanas,
    });
  });

  quoteBtn.addEventListener("click", () => {
    if (quoteBtn.getAttribute("aria-disabled") === "true" || !lastResult) return;
    trackEvent("btu_quote_click", { btu: lastResult.btu });

    const contactForm = document.getElementById("quote-form");
    if (contactForm) {
      fillQuoteFromBTU(lastResult);
      return;
    }

    const params = new URLSearchParams({
      btu: String(lastResult.btu),
      m2: String(lastResult.m2),
      sol: lastResult.sol,
      uso: lastResult.uso,
    });
    window.location.href = `/?cotizar=1&${params.toString()}#contacto`;
  });
}

function initFAQTracking() {
  document.querySelectorAll(".faq-item").forEach((item) => {
    item.addEventListener("toggle", () => {
      if (item.open) {
        const q = item.querySelector("summary")?.textContent?.trim() || "";
        trackEvent("faq_open", { question: q });
      }
    });
  });
}

function initPhoneTracking() {
  document.querySelectorAll("[data-phone-link]").forEach((el) => {
    el.addEventListener("click", () => trackEvent("phone_click"));
  });
}

function initContactAnchors() {
  document.querySelectorAll("[data-scroll-contact]").forEach((el) => {
    el.addEventListener("click", () => {
      trackEvent("contact_cta_click", {
        source: el.getAttribute("data-scroll-contact") || "unknown",
      });
    });
  });
}

function initYear() {
  const year = document.getElementById("year");
  if (year) year.textContent = String(new Date().getFullYear());
}

function hydrateQuoteFromURL() {
  const params = new URLSearchParams(location.search);
  if (!params.has("cotizar") && !params.has("btu")) return;

  const form = document.getElementById("quote-form");
  if (!form) return;

  const btu = params.get("btu");
  const m2 = params.get("m2");
  const sol = params.get("sol");
  const uso = params.get("uso");

  if (m2 && form.metros) form.metros.value = m2;
  if (form.servicio) form.servicio.value = "Instalación";

  if (btu) {
    const notes = form.querySelector('[name="mensaje"]');
    if (notes) {
      notes.value = `Cotización desde calculadora BTU: ${Number(btu).toLocaleString("es-CL")} BTU${m2 ? ` · ${m2} m²` : ""}${sol ? ` · Sol ${SUN_LABEL[sol] || sol}` : ""}${uso ? ` · Uso ${USE_LABEL[uso] || uso}` : ""}`;
    }
  }

  if (location.hash === "#contacto" || params.has("cotizar")) {
    requestAnimationFrame(() => {
      form.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  }
}

document.addEventListener("DOMContentLoaded", () => {
  applyBrandConfig();
  initMobileNav();
  initQuoteForm();
  initBTUCalculator();
  initFAQTracking();
  initPhoneTracking();
  initContactAnchors();
  initYear();
  hydrateQuoteFromURL();
  deferGA4();
  trackEvent("page_view", { path: location.pathname });
});
