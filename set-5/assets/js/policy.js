/* FixPapa · Set 5 · Policy pages (anti-discrimination-policy.html). Highlights the "On this page" link of the section being read
   and keeps it in view in the phone tab row. */
(() => {
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const toc = $('#plToc'); if (!toc || !('IntersectionObserver' in window)) return;
  const links = $$('a[href^="#"]', toc), secs = links.map((a) => $(a.getAttribute('href'))).filter(Boolean);
  const set = (id) => links.forEach((a) => {
    const on = a.getAttribute('href') === '#' + id;
    a.setAttribute('aria-current', on ? 'true' : 'false');
    if (on && toc.scrollWidth > toc.clientWidth) toc.scrollTo({ left: toc.scrollLeft + a.getBoundingClientRect().left - toc.getBoundingClientRect().left - 12, behavior: 'smooth' });
  });
  const io = new IntersectionObserver((es) => {
    const vis = es.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
    if (vis.length) set(vis[0].target.id);
  }, { rootMargin: '-30% 0px -60% 0px' });
  secs.forEach((s) => io.observe(s));
})();
