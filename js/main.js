/**
 * Clima Los Ángeles — Rank & Rent lead engine
 * Cambia SOLO SITE_CONFIG para rebrandear sin tocar el HTML/CSS/SEO estructural.
 */
const SITE_CONFIG = {
  brandName: "Clima Los Ángeles",
  phoneDisplay: "+56 9 0000 0000",
  phoneE164: "56900000000",
  email: "contacto@climatizacionlosangeles.cl",
  domain: "https://climatizacionlosangeles.cl/",
  city: "Los Ángeles",
  // FormSubmit: primera vez pide confirmación al correo. Luego entrega leads por email.
  formEndpoint: "https://formsubmit.co/ajax/contacto@climatizacionlosangeles.cl",
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

function trackEvent(name, payload = {}) {
  const detail = { name, ...payload, ts: Date.now() };
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push(detail);
  document.dispatchEvent(new CustomEvent("site:track", { detail }));

  if (typeof window.gtag === "function") {
    window.gtag("event", name, payload);
  }
}

function applyBrandConfig() {
  document.querySelectorAll("[data-brand-name]").forEach((el) => {
    el.textContent = SITE_CONFIG.brandName;
  });

  document.querySelectorAll("[data-phone-text]").forEach((el) => {
    el.textContent = SITE_CONFIG.phoneDisplay;
  });

  document.querySelectorAll("[data-phone-link]").forEach((el) => {
    el.setAttribute("href", `tel:+${SITE_CONFIG.phoneE164}`);
  });

  document.querySelectorAll("[data-email-text]").forEach((el) => {
    el.textContent = SITE_CONFIG.email;
  });

  document.querySelectorAll("[data-email-link]").forEach((el) => {
    el.setAttribute("href", `mailto:${SITE_CONFIG.email}`);
  });
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

function fillQuoteFromBTU({ btu, m2, sol, uso }) {
  const form = document.getElementById("quote-form");
  if (!form) return;

  if (m2 && form.metros) form.metros.value = String(m2);
  if (form.servicio && !form.servicio.value) form.servicio.value = "Instalación";

  const notes = form.querySelector('[name="mensaje"]');
  if (notes) {
    notes.value = `Cotización desde calculadora BTU: ${btu.toLocaleString("es-CL")} BTU · ${m2} m² · Sol ${SUN_LABEL[sol]} · Uso ${USE_LABEL[uso]}`;
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
    setFormStatus(
      form,
      "error",
      `No pudimos enviar el formulario. Escríbenos a ${SITE_CONFIG.email} o llama al ${SITE_CONFIG.phoneDisplay}.`
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

    if (!nombre || !telefono || !sector || !servicio || !metros) {
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
        metros: `${metros} m²`,
        mensaje: mensaje || "(sin mensaje)",
        ciudad: SITE_CONFIG.city,
        origen: "hero_quote_form",
      },
      "quote_form_submit"
    );
  });
}

function resolveSquareMeters(form) {
  const largo = parseFloat(form.largo.value);
  const ancho = parseFloat(form.ancho.value);
  const totales = parseFloat(form.metrosTotales.value);

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
    const largo = parseFloat(form.largo.value);
    const ancho = parseFloat(form.ancho.value);
    if (!Number.isNaN(largo) && !Number.isNaN(ancho) && largo > 0 && ancho > 0) {
      form.metrosTotales.value = String(Number((largo * ancho).toFixed(1)));
    }
  };

  form.largo.addEventListener("input", syncDimensionInputs);
  form.ancho.addEventListener("input", syncDimensionInputs);

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const m2 = resolveSquareMeters(form);
    const sol = form.querySelector('input[name="sol"]:checked')?.value || "media";
    const uso = form.querySelector('input[name="uso"]:checked')?.value || "dormitorio";

    if (!m2) {
      form.metrosTotales.setCustomValidity("Ingresa m² totales o largo y ancho.");
      form.metrosTotales.reportValidity();
      form.metrosTotales.setCustomValidity("");
      trackEvent("btu_calc_invalid");
      return;
    }

    const raw = m2 * SUN_FACTOR[sol] * USE_FACTOR[uso];
    const btu = nearestBTU(raw);
    const explanation = explainBTU({ btu, m2, sol, uso });

    resultBtu.textContent = `${btu.toLocaleString("es-CL")} BTU`;
    resultCopy.textContent = explanation;
    lastResult = { btu, m2, sol, uso };

    quoteBtn.classList.remove("is-disabled");
    quoteBtn.setAttribute("aria-disabled", "false");
    quoteBtn.textContent = `Cotizar equipo de ${btu.toLocaleString("es-CL")} BTU`;

    trackEvent("btu_calc_submit", { m2, sol, uso, btu, raw: Math.round(raw) });
  });

  quoteBtn.addEventListener("click", () => {
    if (quoteBtn.getAttribute("aria-disabled") === "true" || !lastResult) return;
    trackEvent("btu_quote_click", { btu: lastResult.btu });
    fillQuoteFromBTU(lastResult);
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

document.addEventListener("DOMContentLoaded", () => {
  applyBrandConfig();
  initMobileNav();
  initQuoteForm();
  initBTUCalculator();
  initFAQTracking();
  initPhoneTracking();
  initContactAnchors();
  initYear();
  trackEvent("page_view", { path: location.pathname });
});
