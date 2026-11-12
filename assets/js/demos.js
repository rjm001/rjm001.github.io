(function () {
  "use strict";

  const $ = (id) => document.getElementById(id);

  function mulberry32(seed) {
    let a = seed >>> 0;
    return function () {
      a |= 0;
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function gauss(rng) {
    const u = Math.max(rng(), 1e-12);
    const v = rng();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  }

  function erf(x) {
    const sign = x < 0 ? -1 : 1;
    x = Math.abs(x);
    const a1 = 0.254829592;
    const a2 = -0.284496736;
    const a3 = 1.421413741;
    const a4 = -1.453152027;
    const a5 = 1.061405429;
    const p = 0.3275911;
    const t = 1 / (1 + p * x);
    const y =
      1 -
      ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) *
        t *
        Math.exp(-x * x);
    return sign * y;
  }

  function normCdf(z) {
    return 0.5 * (1 + erf(z / Math.SQRT2));
  }

  function normPdf(z) {
    return Math.exp(-0.5 * z * z) / Math.sqrt(2 * Math.PI);
  }

  // E[max(X - t, 0)] for X ~ N(mu, sigma^2)
  function expectedGain(mu, sigma, t) {
    const z = (mu - t) / sigma;
    return sigma * (normPdf(z) + z * normCdf(z));
  }

  function money(x, digits) {
    const n = digits == null ? 2 : digits;
    const abs = Math.abs(x).toLocaleString("en-US", {
      minimumFractionDigits: n,
      maximumFractionDigits: n,
    });
    return (x < 0 ? "−" : "") + "$" + abs;
  }

  function pct(x) {
    return (100 * x).toFixed(0) + "%";
  }

  function el(html) {
    const wrap = document.createElement("div");
    wrap.innerHTML = html.trim();
    return wrap.firstElementChild;
  }

  function renderStats(node, items) {
    node.innerHTML = "";
    items.forEach((item) => {
      node.appendChild(
        el(
          `<div class="stat-card">
            <p class="stat-label">${item.label}</p>
            <p class="stat-value">${item.value}</p>
            <p class="stat-sub">${item.sub || ""}</p>
          </div>`
        )
      );
    });
  }

  function hbarChart(node, rows, opts) {
    const max = Math.max(opts.max || 0, ...rows.map((r) => r.value), 0.0001);
    node.innerHTML = "";
    rows.forEach((row) => {
      const width = Math.max(2, (100 * row.value) / max);
      const bar = el(
        `<div class="hbar">
          <div class="hbar-label">${row.label}</div>
          <div class="hbar-track">
            <div class="hbar-fill" style="width:${width}%;background:${row.color || "var(--accent)"}"></div>
          </div>
          <div class="hbar-num">${row.display}</div>
        </div>`
      );
      node.appendChild(bar);
    });
  }

  function stackedBar(node, segments) {
    const total = segments.reduce((s, x) => s + x.value, 0) || 1;
    node.innerHTML = "";
    const row = el(`<div class="sbar"></div>`);
    segments.forEach((seg) => {
      const w = (100 * seg.value) / total;
      if (seg.value <= 0) return;
      row.appendChild(
        el(
          `<div class="sbar-seg" style="width:${w}%;background:${seg.color}" title="${seg.label}"></div>`
        )
      );
    });
    node.appendChild(row);
    const legend = el(`<ul class="sbar-legend"></ul>`);
    segments.forEach((seg) => {
      legend.appendChild(
        el(
          `<li><span class="swatch" style="background:${seg.color}"></span>${seg.label}: <strong>${seg.display}</strong></li>`
        )
      );
    });
    node.appendChild(legend);
  }

  // --- Search ranking -------------------------------------------------
  const HOTELS = [
    { id: "harbor", name: "Harbor Inn", quality: 126, price: 98 },
    { id: "oak", name: "Oak & Main", quality: 154, price: 132 },
    { id: "drift", name: "Driftwood Suites", quality: 118, price: 86 },
    { id: "piazza", name: "Piazza Hotel", quality: 168, price: 155 },
    { id: "linen", name: "Linen House", quality: 141, price: 121 },
    { id: "cinder", name: "Cinder Station", quality: 109, price: 74 },
    { id: "vista", name: "Vista Loft", quality: 160, price: 148 },
    { id: "quay", name: "South Quay", quality: 133, price: 110 },
  ];
  const SIGMA = 18;
  const N_USERS = 4000;
  const COMMISSION = 0.14;
  const OUTSIDE = 16;

  function meanSurplus(h) {
    return h.quality - h.price;
  }

  function stars(h) {
    return (3.4 + (h.quality - 109) / 40).toFixed(1);
  }

  const USER_UTILS = (function () {
    const rng = mulberry32(20260311);
    return Array.from({ length: N_USERS }, () =>
      HOTELS.map((h) => meanSurplus(h) + SIGMA * gauss(rng))
    );
  })();

  function orderHotels(policy, dropTop) {
    let pool = HOTELS.slice();
    if (dropTop) {
      const topIds = HOTELS.slice()
        .sort((a, b) => meanSurplus(b) - meanSurplus(a))
        .slice(0, 5)
        .map((h) => h.id);
      pool = pool.filter((h) => !topIds.includes(h.id));
    }
    if (policy === "random") {
      const rng = mulberry32(77);
      return pool
        .map((h) => ({ h, z: rng() }))
        .sort((a, b) => a.z - b.z)
        .map((x) => x.h);
    }
    if (policy === "platform") {
      return pool.slice().sort((a, b) => {
        const score = (h) => meanSurplus(h) + COMMISSION * h.price * 0.85;
        return score(b) - score(a);
      });
    }
    return pool.slice().sort((a, b) => meanSurplus(b) - meanSurplus(a));
  }

  function simulateRanking(list, cost) {
    const idx = Object.fromEntries(HOTELS.map((h, i) => [h.id, i]));
    const buys = Object.fromEntries(HOTELS.map((h) => [h.id, 0]));
    let surplus = 0;
    let searches = 0;
    let purchases = 0;

    for (let u = 0; u < N_USERS; u++) {
      const utils = USER_UTILS[u];
      let bestU = OUTSIDE;
      let bestId = null;
      let nSearch = 0;
      for (let k = 0; k < list.length; k++) {
        const hotel = list[k];
        if (nSearch > 0) {
          const eGain = expectedGain(meanSurplus(hotel), SIGMA, bestU);
          if (eGain < cost) break;
        }
        nSearch += 1;
        const util = utils[idx[hotel.id]];
        if (util > bestU) {
          bestU = util;
          bestId = hotel.id;
        }
      }
      searches += nSearch;
      surplus += bestU - cost * nSearch;
      if (bestId) {
        purchases += 1;
        buys[bestId] += 1;
      }
    }

    return {
      surplus: surplus / N_USERS,
      searches: searches / N_USERS,
      purchaseRate: purchases / N_USERS,
      buys: HOTELS.map((h) => ({
        id: h.id,
        name: h.name,
        share: buys[h.id] / N_USERS,
      })),
    };
  }

  function renderRanking() {
    if (!$("rank-policy")) return;
    const policy = $("rank-policy").value;
    const cost = Number($("rank-cost").value);
    const dropTop = $("rank-drop-top").checked;
    $("rank-cost-label").textContent = money(cost, 0);

    const list = orderHotels(policy, dropTop);
    const result = simulateRanking(list, cost);
    const baseline = simulateRanking(orderHotels("random", false), cost);
    const delta = result.surplus - baseline.surplus;

    renderStats($("rank-stats"), [
      {
        label: "Consumer surplus / user",
        value: money(result.surplus),
        sub: `${delta >= 0 ? "+" : ""}${money(delta)} vs random list`,
      },
      {
        label: "Purchase rate",
        value: pct(result.purchaseRate),
        sub: `${result.searches.toFixed(1)} hotels inspected on average`,
      },
      {
        label: "Hotels on the list",
        value: String(list.length),
        sub: dropTop ? "Top 5 by surplus removed" : "Full catalog",
      },
    ]);

    hbarChart(
      $("rank-bars"),
      result.buys.map((row) => ({
        label: row.name,
        value: row.share,
        display: pct(row.share),
        color: list.some((h) => h.id === row.id)
          ? "var(--accent)"
          : "#c5c0b5",
      })),
      { max: Math.max(...result.buys.map((row) => row.share), 0.05) }
    );

    const listNode = $("rank-list");
    listNode.innerHTML = "";
    list.forEach((h, i) => {
      const share = result.buys.find((b) => b.id === h.id).share;
      listNode.appendChild(
        el(
          `<li>
            <span class="rank-n">${i + 1}</span>
            <span>
              <strong>${h.name}</strong>
              <span class="muted">${stars(h)} ★ · ${money(h.price, 0)}/night · mean surplus ${money(meanSurplus(h), 0)}</span>
            </span>
            <span class="rank-share">${pct(share)}</span>
          </li>`
        )
      );
    });
  }

  // --- Incrementality -------------------------------------------------
  const BRANDS = [
    { id: "linen", name: "Linen Co", cat: "Home", gmv: 82000 },
    { id: "cedar", name: "Cedar Home", cat: "Home", gmv: 61000 },
    { id: "marl", name: "Marl & Co", cat: "Home", gmv: 44000 },
    { id: "quilt", name: "Quilt Theory", cat: "Home", gmv: 28000 },
    { id: "atelier", name: "Atelier Nine", cat: "Fashion", gmv: 76000 },
    { id: "ridge", name: "Ridge Wear", cat: "Fashion", gmv: 53000 },
    { id: "silk", name: "Silk Route", cat: "Fashion", gmv: 39000 },
    { id: "helm", name: "Helm Supply", cat: "Fashion", gmv: 25000 },
  ];

  function fillBrandSelect() {
    const sel = $("inc-brand");
    if (!sel || sel.options.length) return;
    BRANDS.forEach((b, i) => {
      const opt = document.createElement("option");
      opt.value = b.id;
      opt.textContent = `${b.name} (${b.cat})`;
      if (i === 0) opt.selected = true;
      sel.appendChild(opt);
    });
  }

  function allocate(weights, total) {
    const s = weights.reduce((a, b) => a + b, 0) || 1;
    return weights.map((w) => (total * w) / s);
  }

  function renderIncrementality() {
    if (!$("inc-brand")) return;
    fillBrandSelect();
    const promoId = $("inc-brand").value;
    const boost = Number($("inc-boost").value) / 100;
    const sub = Number($("inc-sub").value) / 100;
    $("inc-boost-label").textContent = pct(boost);
    $("inc-sub-label").textContent = pct(sub);

    const promoted = BRANDS.find((b) => b.id === promoId);
    const same = BRANDS.filter((b) => b.cat === promoted.cat && b.id !== promoId);
    const other = BRANDS.filter((b) => b.cat !== promoted.cat);

    const grossLift = promoted.gmv * 0.9 * boost;
    const crossRate = 0.18 * sub;
    const sameRate = sub * (1 - 0.18);
    const incrementalRate = Math.max(0, 1 - sameRate - crossRate);
    const incremental = grossLift * incrementalRate;
    const cannibalSame = grossLift * sameRate;
    const cannibalCross = grossLift * crossRate;

    const sameTake = allocate(
      same.map((b) => b.gmv),
      cannibalSame
    );
    const otherTake = allocate(
      other.map((b) => b.gmv),
      cannibalCross
    );

    const after = Object.fromEntries(BRANDS.map((b) => [b.id, b.gmv]));
    after[promoId] += grossLift;
    same.forEach((b, i) => {
      after[b.id] -= sameTake[i];
    });
    other.forEach((b, i) => {
      after[b.id] -= otherTake[i];
    });

    const naive = grossLift;
    const trueInc = incremental;
    const overstate = naive - trueInc;

    renderStats($("inc-stats"), [
      {
        label: "Naive attributed lift",
        value: money(naive, 0),
        sub: "Extra GMV on the promoted brand",
      },
      {
        label: "True incrementality",
        value: money(trueInc, 0),
        sub: pct(trueInc / (naive || 1)) + " of attributed lift is net-new",
      },
      {
        label: "Cannibalized GMV",
        value: money(overstate, 0),
        sub:
          money(cannibalSame, 0) +
          " same category · " +
          money(cannibalCross, 0) +
          " cross category",
      },
    ]);

    if (naive < 1) {
      $("inc-stack").innerHTML =
        '<p class="demo-caption">Turn up promotion intensity to decompose lift.</p>';
    } else {
      stackedBar($("inc-stack"), [
        {
          label: "Net-new to the marketplace",
          value: incremental,
          display: money(incremental, 0),
          color: "#0b3d91",
        },
        {
          label: "Stolen from same category",
          value: cannibalSame,
          display: money(cannibalSame, 0),
          color: "#c45c26",
        },
        {
          label: "Stolen from other category",
          value: cannibalCross,
          display: money(cannibalCross, 0),
          color: "#d9a441",
        },
      ]);
    }

    const frac = naive ? trueInc / naive : 0;
    $("inc-verdict").textContent =
      frac >= 0.6
        ? "Most of this promotion looks incremental: substitutes are weakly overlapping, so a naive dashboard is not too far off."
        : frac >= 0.4
        ? "A large share of the lift is substitution. A brand-success dashboard would overstate marketplace value unless you net out cannibalization."
        : "This is mostly rearranging demand. Treating attributed lift as incrementality would badly over-invest in the boost.";

    hbarChart(
      $("inc-brands"),
      BRANDS.map((b) => {
        const delta = after[b.id] - b.gmv;
        return {
          label: `${b.name} · ${b.cat}`,
          value: after[b.id],
          display:
            money(after[b.id] / 1000, 0) +
            "k  (" +
            (delta >= 0 ? "+" : "−") +
            money(Math.abs(delta) / 1000, 1) +
            "k)",
          color: b.id === promoId ? "var(--accent)" : b.cat === promoted.cat ? "#7a93c2" : "#b7b1a6",
        };
      }),
      { max: Math.max(...BRANDS.map((b) => after[b.id])) }
    );
  }

  function bind() {
    ["rank-policy", "rank-cost", "rank-drop-top"].forEach((id) => {
      const node = $(id);
      if (node) node.addEventListener("input", renderRanking);
      if (node) node.addEventListener("change", renderRanking);
    });
    ["inc-brand", "inc-boost", "inc-sub"].forEach((id) => {
      const node = $(id);
      if (node) node.addEventListener("input", renderIncrementality);
      if (node) node.addEventListener("change", renderIncrementality);
    });
    renderRanking();
    renderIncrementality();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bind);
  } else {
    bind();
  }
})();
