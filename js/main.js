(() => {
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
  const nf = (decimals) =>
    new Intl.NumberFormat("es-PE", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });

  /* Navegación: lista en popover cuando no cabe en una fila, inline cuando cabe. */
  const header = document.querySelector(".site-header");
  const inner = header.querySelector(".header-inner");
  const menu = header.querySelector(".site-menu");
  let lastWidth = 0;

  function updateLayout() {
    const width = header.clientWidth;
    if (!header.classList.contains("is-wide") && width <= lastWidth) {
      lastWidth = width;
      return;
    }
    lastWidth = width;

    const wasOpen = menu.matches(":popover-open");
    header.classList.add("is-measuring", "is-wide");
    const fits = inner.scrollWidth <= inner.clientWidth;
    header.classList.toggle("is-wide", fits);

    if (fits) menu.removeAttribute("popover");
    else if (!menu.hasAttribute("popover")) menu.setAttribute("popover", "auto");
    if (!fits && wasOpen) menu.showPopover();

    requestAnimationFrame(() => header.classList.remove("is-measuring"));
  }

  const layoutObserver = new ResizeObserver(updateLayout);
  layoutObserver.observe(header);
  layoutObserver.observe(menu);

  menu.addEventListener("click", (event) => {
    if (event.target.closest("a") && menu.matches(":popover-open")) menu.hidePopover();
  });

  /* Enlace activo según la sección visible. */
  const links = new Map(
    [...menu.querySelectorAll('a[href^="#"]')].map((a) => [a.getAttribute("href").slice(1), a])
  );
  const spy = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        const link = links.get(entry.target.id);
        if (!link) continue;
        if (entry.isIntersecting) {
          links.forEach((a) => a.removeAttribute("aria-current"));
          link.setAttribute("aria-current", "location");
        } else if (link.getAttribute("aria-current")) {
          link.removeAttribute("aria-current");
        }
      }
    },
    { rootMargin: "-40% 0px -55% 0px" }
  );
  links.forEach((_, id) => {
    const section = document.getElementById(id);
    if (section) spy.observe(section);
  });

  /* Contadores animados: el valor final ya está en el HTML. */
  const counters = document.querySelectorAll(".count");
  if (!reducedMotion.matches) {
    const countObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          countObserver.unobserve(entry.target);
          animateCount(entry.target);
        }
      },
      { threshold: 0.6 }
    );
    counters.forEach((el) => countObserver.observe(el));
  }

  function animateCount(el) {
    const target = Number(el.dataset.count);
    const format = nf(Number(el.dataset.decimals));
    const duration = 1200;
    const start = performance.now();
    const final = el.textContent;

    function frame(now) {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - (1 - t) ** 3;
      el.textContent = t < 1 ? format.format(target * eased) : final;
      if (t < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  /* Formulario "Únete": solo front-end, no envía datos. */
  const form = document.getElementById("form-unete");
  const status = document.getElementById("form-status");

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const name = form.elements.nombre.value.trim().split(/\s+/)[0];
    form.reset();
    status.textContent = `¡Gracias, ${name}! Este formulario es una demostración y tus datos no se enviaron.`;
  });

  form.addEventListener("input", () => {
    status.textContent = "";
  });
})();
