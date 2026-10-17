// Runs INSIDE the browser page (passed to page.evaluate). No imports, no outer variables.
export function collect() {
  const bump = (map, key, extra) => {
    const e = map.get(key) ?? { count: 0, ...extra };
    e.count++;
    map.set(key, e);
  };
  const text = new Map(), bg = new Map(), fg = new Map(), border = new Map(),
        radius = new Map(), shadow = new Map(), transition = new Map(), gap = new Map();

  for (const el of document.querySelectorAll('body *')) {
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden') continue;
    const hasText = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim().length > 0);
    if (hasText) {
      const key = [cs.fontFamily, cs.fontSize, cs.fontWeight, cs.lineHeight, cs.letterSpacing, cs.textTransform].join(' | ');
      const layerEl = el.closest('[data-framer-name]');
      bump(text, key, {
        color: cs.color,
        sample: el.textContent.trim().slice(0, 48),
        layer: layerEl ? layerEl.getAttribute('data-framer-name') : null,
      });
      bump(fg, cs.color, {});
    }
    if (cs.backgroundColor && cs.backgroundColor !== 'rgba(0, 0, 0, 0)') {
      bump(bg, cs.backgroundColor, { layer: el.getAttribute('data-framer-name') });
    }
    if (cs.borderTopStyle !== 'none' && cs.borderTopWidth !== '0px') {
      bump(border, `${cs.borderTopWidth} ${cs.borderTopStyle} ${cs.borderTopColor}`, {});
    }
    if (cs.borderRadius && cs.borderRadius !== '0px') bump(radius, cs.borderRadius, {});
    if (cs.boxShadow && cs.boxShadow !== 'none') bump(shadow, cs.boxShadow, {});
    if (cs.transitionDuration && cs.transitionDuration !== '0s') {
      bump(transition, `${cs.transitionProperty} ${cs.transitionDuration} ${cs.transitionTimingFunction}`, {});
    }
    if ((cs.display.includes('flex') || cs.display.includes('grid')) && cs.gap && cs.gap !== 'normal') {
      bump(gap, cs.gap, {});
    }
  }
  const toList = (m) => [...m.entries()].map(([value, v]) => ({ value, ...v })).sort((a, b) => b.count - a.count);

  const cssVariables = {};
  const fontFaces = [];
  for (const sheet of [...document.styleSheets]) {
    let rules;
    try { rules = sheet.cssRules; } catch { continue; } // cross-origin sheets are unreadable
    for (const r of rules) {
      if (r.style && /^(:root|body|html)\b/.test(r.selectorText || '')) {
        for (const p of r.style) if (p.startsWith('--')) cssVariables[p] = r.style.getPropertyValue(p).trim();
      }
      if (r.type === 5 || (r.constructor && r.constructor.name === 'CSSFontFaceRule')) {
        fontFaces.push({
          family: r.style.getPropertyValue('font-family'),
          weight: r.style.getPropertyValue('font-weight'),
          style: r.style.getPropertyValue('font-style'),
          src: r.style.getPropertyValue('src').slice(0, 300),
        });
      }
    }
  }

  const layers = [...document.querySelectorAll('[data-framer-name]')]
    .map((e) => ({ e, r: e.getBoundingClientRect() }))
    .filter(({ r }) => r.height > 40)
    .slice(0, 400)
    .map(({ e, r }) => {
      const cs = getComputedStyle(e);
      return {
        name: e.getAttribute('data-framer-name'),
        tag: e.tagName.toLowerCase(),
        top: Math.round(r.top + window.scrollY),
        width: Math.round(r.width),
        height: Math.round(r.height),
        background: cs.backgroundColor,
        padding: cs.padding,
        display: cs.display,
      };
    });

  const links = [...document.querySelectorAll('a[href]')].map((a) => ({
    text: a.textContent.trim().slice(0, 60),
    href: a.getAttribute('href'),
  }));
  const media = [
    ...[...document.querySelectorAll('img')].map((i) => ({ type: 'img', src: i.currentSrc || i.src, alt: i.alt, w: i.naturalWidth, h: i.naturalHeight })),
    ...[...document.querySelectorAll('video')].map((v) => ({ type: 'video', src: v.currentSrc || v.src, autoplay: v.autoplay, loop: v.loop, muted: v.muted })),
  ];

  return {
    page: {
      title: document.title,
      lang: document.documentElement.lang,
      scrollHeight: document.documentElement.scrollHeight,
      bodyBackground: getComputedStyle(document.body).backgroundColor,
    },
    cssVariables,
    fontFaces,
    textStyles: toList(text).slice(0, 60),
    textColors: toList(fg).slice(0, 20),
    backgrounds: toList(bg).slice(0, 30),
    borders: toList(border).slice(0, 15),
    radii: toList(radius).slice(0, 15),
    shadows: toList(shadow).slice(0, 10),
    transitions: toList(transition).slice(0, 20),
    gaps: toList(gap).slice(0, 20),
    layers,
    links,
    media,
    animationsRunning: typeof document.getAnimations === 'function' ? document.getAnimations().length : null,
  };
}
