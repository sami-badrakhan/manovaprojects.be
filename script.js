/* =========================================================
   MANOVA-PROJECTS — script.js
   Menu, slideshow, scroll-animaties en galerij met filters
   en vergrootglas. Het contactformulier werkt zonder JavaScript
   (Web3Forms, rechtstreeks in contact.html).
   ========================================================= */
(function () {
  "use strict";

  var root = document.documentElement;
  root.classList.add("js");

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Header wordt donker bij scrollen ---------- */
  var header = document.querySelector(".site-header");
  function onScroll() {
    if (!header) return;
    header.classList.toggle("is-solid", window.scrollY > 40);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- Mobiel menu ---------- */
  var toggle = document.querySelector(".menu-toggle");
  var nav = document.getElementById("hoofdmenu");

  function setMenu(open) {
    document.body.classList.toggle("menu-open", open);
    if (toggle) {
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      toggle.setAttribute("aria-label", open ? "Menu sluiten" : "Menu openen");
    }
  }
  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      setMenu(!document.body.classList.contains("menu-open"));
    });
    nav.addEventListener("click", function (e) {
      if (e.target.closest("a")) setMenu(false);
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && document.body.classList.contains("menu-open")) {
        setMenu(false);
        toggle.focus();
      }
    });
    window.addEventListener("resize", function () {
      if (window.innerWidth > 960) setMenu(false);
    });
  }

  /* ---------- Hero-slideshow ---------- */
  var hero = document.querySelector("[data-slideshow]");
  if (hero) {
    var slides = Array.prototype.slice.call(hero.querySelectorAll(".hero-slide"));
    var dotsWrap = hero.querySelector(".hero-dots");
    var caption = hero.querySelector(".hero-caption");
    var countNow = hero.querySelector(".hero-count b");
    var countTotal = hero.querySelector(".hero-count span");
    var delay = 6500;
    var index = 0;
    var timer = null;
    var dots = [];

    hero.style.setProperty("--slide-ms", delay + "ms");
    // Totaal aantal foto's telt zichzelf: een slide toevoegen in index.html volstaat
    if (countTotal) countTotal.textContent = String(slides.length).padStart(2, "0");

    slides.forEach(function (slide, i) {
      var dot = document.createElement("button");
      dot.type = "button";
      dot.className = "hero-dot";
      dot.setAttribute("aria-label", "Toon foto " + (i + 1));
      dot.addEventListener("click", function () { go(i, true); });
      dotsWrap.appendChild(dot);
      dots.push(dot);
    });

    function go(i, user) {
      index = (i + slides.length) % slides.length;
      slides.forEach(function (s, n) {
        s.classList.toggle("is-active", n === index);
        s.setAttribute("aria-hidden", n === index ? "false" : "true");
      });
      dots.forEach(function (d, n) {
        d.classList.remove("is-active", "is-done");
        void d.offsetWidth; // herstart de voortgangsbalk
        if (n < index) d.classList.add("is-done");
        if (n === index) d.classList.add("is-active");
        d.setAttribute("aria-current", n === index ? "true" : "false");
      });
      var s = slides[index];
      if (caption) {
        caption.innerHTML = "<strong>" + (s.dataset.type || "") + "</strong>" +
          (s.dataset.caption ? "&ensp;" + s.dataset.caption : "");
      }
      if (countNow) countNow.textContent = String(index + 1).padStart(2, "0");
      if (user) restart();
    }

    function restart() {
      clearInterval(timer);
      if (reduceMotion) return;
      timer = setInterval(function () { go(index + 1); }, delay);
    }

    document.addEventListener("visibilitychange", function () {
      if (document.hidden) clearInterval(timer); else restart();
    });

    // Vegen op iPhone/iPad
    var startX = null;
    hero.addEventListener("touchstart", function (e) { startX = e.touches[0].clientX; }, { passive: true });
    hero.addEventListener("touchend", function (e) {
      if (startX === null) return;
      var dx = e.changedTouches[0].clientX - startX;
      if (Math.abs(dx) > 50) go(index + (dx < 0 ? 1 : -1), true);
      startX = null;
    }, { passive: true });

    go(0);
    restart();
  }

  /* ---------- Rustig invloeien bij scrollen ---------- */
  var reveals = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && !reduceMotion) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    reveals.forEach(function (el) {
      var r = el.getBoundingClientRect();
      if (r.top < window.innerHeight) el.classList.add("is-visible");
      else io.observe(el);
    });
  } else {
    reveals.forEach(function (el) { el.classList.add("is-visible"); });
  }

  /* ---------- Galerij: filters ---------- */
  var gallery = document.querySelector(".gallery");
  var filterBtns = document.querySelectorAll(".filter");
  var tiles = gallery ? Array.prototype.slice.call(gallery.querySelectorAll(".tile")) : [];

  filterBtns.forEach(function (btn) {
    var cat = btn.dataset.filter;
    var n = cat === "alles" ? tiles.length : tiles.filter(function (t) { return t.dataset.cat === cat; }).length;
    var small = document.createElement("small");
    small.textContent = n;
    btn.appendChild(small);

    btn.addEventListener("click", function () {
      filterBtns.forEach(function (b) { b.setAttribute("aria-pressed", b === btn ? "true" : "false"); });
      tiles.forEach(function (t) {
        t.classList.toggle("is-hidden", !(cat === "alles" || t.dataset.cat === cat));
      });
    });
  });

  /* ---------- Galerij: vergrootglas ---------- */
  var lb = document.querySelector(".lightbox");
  if (lb && tiles.length) {
    var lbImg = lb.querySelector(".lb-stage img");
    var lbCap = lb.querySelector(".lb-caption");
    var lbCount = lb.querySelector(".lb-count");
    var current = 0;
    var visible = [];
    var lastFocus = null;

    function show(i) {
      current = (i + visible.length) % visible.length;
      var t = visible[current];
      var img = t.querySelector("img");
      lbImg.src = img.currentSrc || img.src;
      lbImg.alt = img.alt;
      lbCap.innerHTML = "<strong>" + (t.dataset.title || "") + "</strong>" +
        (t.dataset.desc ? "&ensp;" + t.dataset.desc : "");
      lbCount.textContent = String(current + 1).padStart(2, "0") + " / " + String(visible.length).padStart(2, "0");
    }
    function open(tile) {
      visible = tiles.filter(function (t) { return !t.classList.contains("is-hidden"); });
      lastFocus = tile;
      show(visible.indexOf(tile));
      lb.classList.add("is-open");
      lb.setAttribute("aria-hidden", "false");
      document.body.style.overflow = "hidden";
      lb.querySelector(".lb-close").focus();
    }
    function close() {
      lb.classList.remove("is-open");
      lb.setAttribute("aria-hidden", "true");
      document.body.style.overflow = "";
      if (lastFocus) lastFocus.focus();
    }

    tiles.forEach(function (t) { t.addEventListener("click", function () { open(t); }); });
    lb.querySelector(".lb-close").addEventListener("click", close);
    lb.querySelector(".lb-prev").addEventListener("click", function () { show(current - 1); });
    lb.querySelector(".lb-next").addEventListener("click", function () { show(current + 1); });
    lb.addEventListener("click", function (e) {
      if (e.target === lb || e.target.classList.contains("lb-stage")) close();
    });
    document.addEventListener("keydown", function (e) {
      if (!lb.classList.contains("is-open")) return;
      if (e.key === "Escape") close();
      if (e.key === "ArrowLeft") show(current - 1);
      if (e.key === "ArrowRight") show(current + 1);
      if (e.key === "Tab") {
        var f = lb.querySelectorAll("button");
        var first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });
    var sx = null;
    lb.addEventListener("touchstart", function (e) { sx = e.touches[0].clientX; }, { passive: true });
    lb.addEventListener("touchend", function (e) {
      if (sx === null) return;
      var dx = e.changedTouches[0].clientX - sx;
      if (Math.abs(dx) > 50) show(current + (dx < 0 ? 1 : -1));
      sx = null;
    }, { passive: true });
  }

  /* ---------- Jaartal in footer ---------- */
  document.querySelectorAll("[data-year]").forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });
})();
