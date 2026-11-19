/* Весь интерактив сайта, без библиотек */
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  /* Шапка: фон при прокрутке */
  const hdr = $("#hdr");
  if (hdr && !hdr.classList.contains("hdr--solid")) {
    const onScroll = () => hdr.classList.toggle("is-solid", scrollY > 40);
    onScroll();
    addEventListener("scroll", onScroll, { passive: true });
  }

  /* Мобильное меню */
  const burger = $("#burger");
  if (burger) {
    const toggle = (open) => {
      document.body.classList.toggle("menu-open", open);
      burger.setAttribute("aria-expanded", open);
    };
    burger.addEventListener("click", () => toggle(!document.body.classList.contains("menu-open")));
    $$("#nav a").forEach((a) => a.addEventListener("click", () => toggle(false)));
    addEventListener("keydown", (e) => e.key === "Escape" && toggle(false));
  }

  /* Появление блоков при прокрутке */
  const rv = $$(".rv");
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver((es) => es.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
    }), { rootMargin: "0px 0px -8% 0px" });
    rv.forEach((el) => io.observe(el));
  } else rv.forEach((el) => el.classList.add("in"));

  /* Карусель флагманов */
  const show = $("#show");
  if (show) {
    const imgs = $$(".show__img img", show), infos = $$(".show__info", show), dots = $$(".show__dots button", show);
    let i = 0, timer;
    const go = (n) => {
      i = (n + imgs.length) % imgs.length;
      imgs.forEach((el, k) => el.classList.toggle("on", k === i));
      infos.forEach((el, k) => (el.hidden = k !== i));
      dots.forEach((el, k) => el.classList.toggle("on", k === i));
    };
    const auto = () => { clearInterval(timer); timer = setInterval(() => go(i + 1), 6000); };
    dots.forEach((d, k) => d.addEventListener("click", () => { go(k); auto(); }));
    $$(".arrow", show).forEach((a) => a.addEventListener("click", () => { go(i + +a.dataset.dir); auto(); }));
    let x0 = null;
    show.addEventListener("touchstart", (e) => (x0 = e.touches[0].clientX), { passive: true });
    show.addEventListener("touchend", (e) => {
      if (x0 === null) return;
      const dx = e.changedTouches[0].clientX - x0;
      if (Math.abs(dx) > 50) { go(i + (dx < 0 ? 1 : -1)); auto(); }
      x0 = null;
    });
    auto();
  }

  /* Обратный отсчёт */
  $$("[data-timer]").forEach((t) => {
    const end = new Date(t.dataset.timer).getTime();
    const set = (k, v) => ($(`[data-t="${k}"]`, t).textContent = String(v).padStart(2, "0"));
    const tick = () => {
      const d = Math.max(0, end - Date.now()) / 1000;
      set("d", Math.floor(d / 86400)); set("h", Math.floor(d / 3600) % 24);
      set("m", Math.floor(d / 60) % 60); set("s", Math.floor(d) % 60);
    };
    tick(); setInterval(tick, 1000);
  });

  /* Каталог: фильтр по серии и сортировка */
  const grid = $("#grid");
  if (grid) {
    const cards = $$(".mcard", grid), chips = $$(".chip"), sort = $("#sort"), notes = $$("[data-note]");
    const order = cards.slice();
    const apply = (f) => {
      chips.forEach((c) => c.classList.toggle("on", c.dataset.f === f));
      cards.forEach((c) => (c.hidden = f !== "all" && c.dataset.series !== f));
      notes.forEach((n) => (n.hidden = n.dataset.note !== f));
    };
    chips.forEach((c) => c.addEventListener("click", () => {
      apply(c.dataset.f);
      history.replaceState(null, "", c.dataset.f === "all" ? location.pathname : "#" + c.dataset.f);
    }));
    sort.addEventListener("change", () => {
      const k = sort.value;
      const num = (c) => +c.dataset[k.replace("-asc", "")] || (k === "price-asc" ? Infinity : 0);
      const list = k ? order.slice().sort((a, b) => (k === "weight" || k === "price-asc") ? num(a) - num(b) : num(b) - num(a)) : order;
      list.forEach((c) => grid.appendChild(c));
    });
    const h = location.hash.slice(1);
    apply(chips.some((c) => c.dataset.f === h) ? h : "all");
  }

  /* Кнопка «Тест-драйв» на странице модели выбирает цель в форме */
  $$("[data-topic]").forEach((a) => a.addEventListener("click", () => {
    const sel = $("#f-topic");
    if (sel) sel.value = a.dataset.topic;
  }));

  /* Маска телефона */
  $$('input[type="tel"]').forEach((inp) => inp.addEventListener("input", () => {
    let d = inp.value.replace(/\D/g, "");
    if (!d) return (inp.value = "");
    if (d[0] === "8") d = "7" + d.slice(1);
    if (d[0] !== "7") d = "7" + d;
    d = d.slice(0, 11);
    const p = [d.slice(1, 4), d.slice(4, 7), d.slice(7, 9), d.slice(9, 11)];
    inp.value = "+7" + (p[0] ? ` (${p[0]}` : "") + (p[0].length === 3 ? ")" : "") + (p[1] ? ` ${p[1]}` : "") + (p[2] ? `-${p[2]}` : "") + (p[3] ? `-${p[3]}` : "");
  }));

  /* Отправка заявки */
  $$("[data-lead]").forEach((form) => form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const msg = $(".form__msg", form), btn = $("button[type=submit]", form);
    const data = Object.fromEntries(new FormData(form));
    const show = (cls, text) => { msg.className = "form__msg " + cls; msg.textContent = text; };
    if (!data.name?.trim()) return show("err", "Укажите имя.");
    if (data.phone.replace(/\D/g, "").length < 11) return show("err", "Укажите телефон полностью.");
    if (!form.agree.checked) return show("err", "Нужно согласие на обработку данных.");
    if (location.hostname.endsWith("github.io")) {
      form.reset();
      return show("ok", "Это демо-версия сайта: заявка не отправляется. В рабочей версии она придёт менеджеру в Telegram.");
    }
    btn.disabled = true;
    try {
      const r = await fetch("/api/lead", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, agree: true, page: location.pathname, t: Math.round(performance.now()) }),
      });
      if (r.status === 400 || r.status === 429) {
        const j = await r.json().catch(() => ({}));
        return show("err", typeof j.detail === "string" ? j.detail : "Проверьте поля формы.");
      }
      if (!r.ok) throw new Error(r.status);
      form.reset();
      show("ok", "Спасибо! Заявка отправлена, мы скоро перезвоним.");
    } catch {
      const tel = $(".hdr__phone")?.lastChild?.textContent || "";
      show("err", `Не получилось отправить. Позвоните нам${tel ? ": " + tel.trim() : ""} или напишите в Telegram.`);
    } finally { btn.disabled = false; }
  }));
})();
