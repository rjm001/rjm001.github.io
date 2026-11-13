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

  function lineChart(node, lines, opts) {
    const w = 640;
    const h = 240;
    const pad = { l: 44, r: 16, t: 14, b: 36 };
    const xs = lines.flatMap((ln) => ln.points.map((p) => p.x));
    const ys = lines.flatMap((ln) => ln.points.map((p) => p.y));
    const xmin = opts.xmin != null ? opts.xmin : Math.min(...xs);
    const xmax = opts.xmax != null ? opts.xmax : Math.max(...xs);
    const ymin = opts.ymin != null ? opts.ymin : Math.min(0, ...ys);
    const ymax = opts.ymax != null ? opts.ymax : Math.max(...ys);
    const sx = (x) => pad.l + ((w - pad.l - pad.r) * (x - xmin)) / (xmax - xmin || 1);
    const sy = (y) =>
      h - pad.b - ((h - pad.t - pad.b) * (y - ymin)) / (ymax - ymin || 1);
    const parts = [
      `<svg viewBox="0 0 ${w} ${h}" class="line-svg" role="img">`,
      `<line x1="${pad.l}" y1="${sy(0)}" x2="${w - pad.r}" y2="${sy(0)}" stroke="#ddd6c8"/>`,
      `<line x1="${pad.l}" y1="${pad.t}" x2="${pad.l}" y2="${h - pad.b}" stroke="#ddd6c8"/>`,
      `<text x="${pad.l}" y="${h - 10}" fill="#5c6570" font-size="11">${opts.xLabel || ""}</text>`,
    ];
    lines.forEach((ln) => {
      const d = ln.points
        .map((p, i) => (i ? "L" : "M") + sx(p.x).toFixed(1) + "," + sy(p.y).toFixed(1))
        .join(" ");
      parts.push(
        `<path d="${d}" fill="none" stroke="${ln.color}" stroke-width="${ln.dash ? 1.6 : 2.4}" stroke-dasharray="${ln.dash || "none"}"/>`
      );
    });
    parts.push("</svg>");
    node.innerHTML = parts.join("");
  }

  function sigmoid(z) {
    return 1 / (1 + Math.exp(-Math.max(-20, Math.min(20, z))));
  }

  function binSmooth(x, y, bins) {
    const n = bins.length - 1;
    const sum = Array(n).fill(0);
    const cnt = Array(n).fill(0);
    for (let i = 0; i < x.length; i++) {
      let b = n - 1;
      for (let j = 0; j < n; j++) {
        if (x[i] < bins[j + 1]) {
          b = j;
          break;
        }
      }
      sum[b] += y[i];
      cnt[b] += 1;
    }
    const pred = Array(x.length);
    for (let i = 0; i < x.length; i++) {
      let b = n - 1;
      for (let j = 0; j < n; j++) {
        if (x[i] < bins[j + 1]) {
          b = j;
          break;
        }
      }
      pred[i] = cnt[b] ? sum[b] / cnt[b] : 0;
    }
    return pred;
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

  // --- VCG vs GSP -----------------------------------------------------
  const SEARCHES = 1000;
  const POS_CTR = [1, 0.55, 0.32, 0.19, 0.12];
  const ADVERTISERS = [
    { name: "Northwind", pCTR: 0.08, pCTO: 0.12, pOV: 85, tROAS: 2.5 },
    { name: "Cedar Co", pCTR: 0.05, pCTO: 0.18, pOV: 120, tROAS: 3.0 },
    { name: "Atelier", pCTR: 0.11, pCTO: 0.06, pOV: 55, tROAS: 1.8 },
    { name: "Quilt", pCTR: 0.04, pCTO: 0.22, pOV: 95, tROAS: 4.0 },
    { name: "Ridge", pCTR: 0.07, pCTO: 0.09, pOV: 70, tROAS: 2.0 },
    { name: "Helm", pCTR: 0.03, pCTO: 0.15, pOV: 150, tROAS: 2.2 },
  ].map((a) => {
    const valueCpc = a.pCTO * a.pOV;
    const bidCpc = valueCpc / a.tROAS;
    return Object.assign({}, a, {
      valueCpc,
      bidCpc,
      score: a.pCTR * bidCpc,
    });
  });

  function runAuction(slots, equilibrium) {
    const ranked = ADVERTISERS.slice().sort((a, b) => b.score - a.score);
    const m = Math.min(slots, ranked.length);
    const alpha = POS_CTR.slice(0, m);
    const s = ranked.map((a) => a.score);
    s.push(0);

    function vcgPay(j) {
      let pay = 0;
      for (let k = j; k < m; k++) {
        const aNext = k + 1 < m ? alpha[k + 1] : 0;
        pay += SEARCHES * s[k + 1] * (alpha[k] - aNext);
      }
      return pay;
    }

    return ranked.map((a, j) => {
      const winner = j < m;
      const clicks = winner ? SEARCHES * a.pCTR * alpha[j] : 0;
      const value = clicks * a.valueCpc;
      const payVcg = winner ? vcgPay(j) : 0;
      const payGspNaive = winner ? SEARCHES * alpha[j] * s[j + 1] : 0;
      const payGsp = equilibrium ? payVcg : payGspNaive;
      return {
        a,
        slot: winner ? j + 1 : null,
        clicks,
        value,
        payGsp,
        payVcg,
        surplusGsp: value - payGsp,
        surplusVcg: value - payVcg,
      };
    });
  }

  function renderAuctions() {
    if (!$("auc-slots")) return;
    const slots = Number($("auc-slots").value);
    const equilibrium = $("auc-eq").checked;
    $("auc-slots-label").textContent = String(slots);

    const rows = runAuction(slots, equilibrium);
    const revGsp = rows.reduce((s, r) => s + r.payGsp, 0);
    const revVcg = rows.reduce((s, r) => s + r.payVcg, 0);
    const surGsp = rows.reduce((s, r) => s + r.surplusGsp, 0);
    const surVcg = rows.reduce((s, r) => s + r.surplusVcg, 0);
    const same = Math.abs(revGsp - revVcg) < 0.05;

    let verdict;
    if (slots === 1) {
      verdict =
        "One ad slot: GSP and VCG are the same second-price auction. The winner pays the second-highest score, regardless of the equilibrium toggle.";
    } else if (equilibrium) {
      verdict =
        "Several slots, but GSP bids are the locally envy-free Nash vector. Those bids are shaded so GSP prices equal VCG prices. Allocation and payments match.";
    } else {
      const extra = ((revGsp - revVcg) / (revVcg || 1)) * 100;
      verdict =
        "Several slots with the same tROAS CPCs in both mechanisms: GSP charges the next score on every click in the slot, VCG only on incremental clicks. Publisher revenue is " +
        extra.toFixed(0) +
        "% higher under GSP here. That is a mechanical gap, not an equilibrium prediction.";
    }
    $("auc-verdict").textContent = verdict;

    renderStats($("auc-stats"), [
      {
        label: "Total ad price (GSP)",
        value: money(revGsp, 0),
        sub: same ? "Equals VCG" : money(revGsp - revVcg, 0) + " vs VCG",
      },
      {
        label: "Total ad price (VCG)",
        value: money(revVcg, 0),
        sub: SEARCHES.toLocaleString() + " searches",
      },
      {
        label: "Advertiser surplus",
        value: money(surGsp, 0) + " / " + money(surVcg, 0),
        sub: "GSP / VCG",
      },
    ]);

    hbarChart(
      $("auc-bars"),
      [
        {
          label: "GSP revenue",
          value: revGsp,
          display: money(revGsp, 0),
          color: "#0b3d91",
        },
        {
          label: "VCG revenue",
          value: revVcg,
          display: money(revVcg, 0),
          color: "#7a93c2",
        },
        {
          label: "GSP surplus",
          value: surGsp,
          display: money(surGsp, 0),
          color: "#c45c26",
        },
        {
          label: "VCG surplus",
          value: surVcg,
          display: money(surVcg, 0),
          color: "#d9a441",
        },
      ],
      { max: Math.max(revGsp, revVcg, surGsp, surVcg, 1) }
    );

    hbarChart(
      $("auc-alloc"),
      rows.map((r) => ({
        label: r.a.name,
        value: r.clicks,
        display: r.slot ? "slot " + r.slot : "unallocated",
        color: r.slot ? "var(--accent)" : "#c5c0b5",
      })),
      { max: Math.max(...rows.map((r) => r.clicks), 1) }
    );

    const table = $("auc-table");
    const header =
      "<thead><tr>" +
      [
        "Advertiser",
        "pCTR",
        "pCTO",
        "pOV",
        "tROAS",
        "CPC bid",
        "Score",
        "Slot",
        "GSP price",
        "VCG price",
        "GSP surplus",
        "VCG surplus",
      ]
        .map((h) => "<th>" + h + "</th>")
        .join("") +
      "</tr></thead>";
    const body = rows
      .map((r) => {
        const cells = [
          r.a.name,
          r.a.pCTR.toFixed(2),
          r.a.pCTO.toFixed(2),
          money(r.a.pOV, 0),
          r.a.tROAS.toFixed(1) + "×",
          money(r.a.bidCpc, 2),
          money(r.a.score, 3),
          r.slot || "—",
          money(r.payGsp, 0),
          money(r.payVcg, 0),
          money(r.surplusGsp, 0),
          money(r.surplusVcg, 0),
        ];
        return (
          "<tr" +
          (r.slot ? "" : ' class="muted-row"') +
          ">" +
          cells.map((c) => "<td>" + c + "</td>").join("") +
          "</tr>"
        );
      })
      .join("");
    table.innerHTML = header + "<tbody>" + body + "</tbody>";
  }

  // --- Mixed media marketing ------------------------------------------
  const BASELINE_SALES = 380;
  const MEDIA = [
    { id: "tv", name: "TV", lambda: 0.72, k: 95, shape: 1.35, beta: 520, color: "#0b3d91" },
    { id: "search", name: "Paid search", lambda: 0.18, k: 42, shape: 1.05, beta: 240, color: "#c45c26" },
    { id: "social", name: "Social", lambda: 0.34, k: 58, shape: 1.55, beta: 175, color: "#d9a441" },
    { id: "email", name: "Email", lambda: 0.08, k: 16, shape: 2.1, beta: 85, color: "#7a93c2" },
  ];

  function hill(x, k, shape, beta) {
    if (x <= 0) return 0;
    const xs = Math.pow(x, shape);
    const ks = Math.pow(k, shape);
    return (beta * xs) / (ks + xs);
  }

  function mediaResponse(channel, spendK) {
    const effective = spendK / (1 - channel.lambda);
    const contrib = hill(effective, channel.k, channel.shape, channel.beta);
    const contribNext = hill(
      (spendK + 1) / (1 - channel.lambda),
      channel.k,
      channel.shape,
      channel.beta
    );
    return { contrib, mroi: contribNext - contrib, spendK };
  }

  function renderMmm() {
    if (!$("mmm-tv")) return;
    const spends = {
      tv: Number($("mmm-tv").value),
      search: Number($("mmm-search").value),
      social: Number($("mmm-social").value),
      email: Number($("mmm-email").value),
    };
    $("mmm-tv-label").textContent = "$" + spends.tv + "k";
    $("mmm-search-label").textContent = "$" + spends.search + "k";
    $("mmm-social-label").textContent = "$" + spends.social + "k";
    $("mmm-email-label").textContent = "$" + spends.email + "k";

    const rows = MEDIA.map((ch) =>
      Object.assign({ ch }, mediaResponse(ch, spends[ch.id]))
    );
    const mediaSales = rows.reduce((s, r) => s + r.contrib, 0);
    const totalSales = BASELINE_SALES + mediaSales;
    const totalSpend = rows.reduce((s, r) => s + r.spendK, 0);
    const avgRoi = totalSpend ? mediaSales / totalSpend : 0;
    const bestMarginal = rows.slice().sort((a, b) => b.mroi - a.mroi)[0];
    const worstMarginal = rows
      .filter((r) => r.spendK > 0)
      .sort((a, b) => a.mroi - b.mroi)[0];

    $("mmm-verdict").textContent = worstMarginal
      ? "At these budgets, the next $1k earns the most on " +
        bestMarginal.ch.name +
        " (marginal ROI " +
        bestMarginal.mroi.toFixed(2) +
        "×) and the least on " +
        worstMarginal.ch.name +
        " (" +
        worstMarginal.mroi.toFixed(2) +
        "×). Average ROI hides that gap."
      : "Turn on some spend to see saturation and carryover.";

    renderStats($("mmm-stats"), [
      {
        label: "Predicted weekly sales",
        value: "$" + Math.round(totalSales).toLocaleString("en-US") + "k",
        sub: "$" + BASELINE_SALES + "k baseline + $" + Math.round(mediaSales).toLocaleString("en-US") + "k media",
      },
      {
        label: "Total media spend",
        value: "$" + totalSpend + "k",
        sub: "Average ROI " + avgRoi.toFixed(2) + "×",
      },
      {
        label: "Best next dollar",
        value: bestMarginal.ch.name,
        sub: "Marginal ROI " + bestMarginal.mroi.toFixed(2) + "×",
      },
    ]);

    stackedBar(
      $("mmm-stack"),
      [
        {
          label: "Baseline",
          value: BASELINE_SALES,
          display: "$" + BASELINE_SALES + "k",
          color: "#c5c0b5",
        },
      ].concat(
        rows.map((r) => ({
          label: r.ch.name,
          value: r.contrib,
          display: "$" + r.contrib.toFixed(0) + "k",
          color: r.ch.color,
        }))
      )
    );

    hbarChart(
      $("mmm-mroi"),
      rows.map((r) => ({
        label: r.ch.name,
        value: Math.max(r.mroi, 0),
        display: r.mroi.toFixed(2) + "×",
        color: r.ch.color,
      })),
      { max: Math.max(...rows.map((r) => r.mroi), 0.5) }
    );
  }

  // --- Double ML heterogeneous effects --------------------------------
  function renderDml() {
    if (!$("dml-conf")) return;
    const conf = Number($("dml-conf").value);
    const het = Number($("dml-het").value);
    $("dml-conf-label").textContent = conf.toFixed(1);
    $("dml-het-label").textContent = het.toFixed(1);

    const n = 800;
    const rng = mulberry32(Math.round(1000 * conf + 17 * het + 9));
    const x = Array(n);
    const t = Array(n);
    const y = Array(n);
    const tau = Array(n);
    for (let i = 0; i < n; i++) {
      x[i] = rng();
      tau[i] = 12 + het * 32 * (x[i] - 0.5);
      const p = sigmoid(-0.35 + conf * (2.6 * x[i] - 0.9));
      t[i] = rng() < p ? 1 : 0;
      y[i] = 38 + 70 * x[i] + t[i] * tau[i] + 9 * gauss(rng);
    }

    const treated = y.filter((_, i) => t[i]);
    const control = y.filter((_, i) => !t[i]);
    const naive =
      treated.reduce((s, v) => s + v, 0) / treated.length -
      control.reduce((s, v) => s + v, 0) / control.length;
    const trueAte = tau.reduce((s, v) => s + v, 0) / n;

    const edges = [];
    for (let b = 0; b <= 10; b++) edges.push(b / 10);
    const yhat = binSmooth(x, y, edges);
    const ehat = binSmooth(x, t, edges);
    const yres = y.map((v, i) => v - yhat[i]);
    const tres = t.map((v, i) => v - ehat[i]);

    let z1z1 = 0;
    let z1z2 = 0;
    let z2z2 = 0;
    let z1y = 0;
    let z2y = 0;
    for (let i = 0; i < n; i++) {
      const xc = x[i] - 0.5;
      const z1 = tres[i];
      const z2 = tres[i] * xc;
      z1z1 += z1 * z1;
      z1z2 += z1 * z2;
      z2z2 += z2 * z2;
      z1y += z1 * yres[i];
      z2y += z2 * yres[i];
    }
    const det = z1z1 * z2z2 - z1z2 * z1z2;
    const a = det ? (z2z2 * z1y - z1z2 * z2y) / det : 0;
    const b = det ? (z1z1 * z2y - z1z2 * z1y) / det : 0;
    const dmlAte = a;

    const grid = [];
    for (let g = 0; g <= 20; g++) {
      const xv = g / 20;
      grid.push({
        x: xv,
        trueY: 12 + het * 32 * (xv - 0.5),
        dmlY: a + b * (xv - 0.5),
        naiveY: naive,
      });
    }

    const bias = naive - trueAte;
    $("dml-verdict").textContent =
      Math.abs(het) < 0.15
        ? "Heterogeneity is off, so the true CATE is almost flat. Double ML should still beat the naive gap if confounding is on, because it partials out prior spend."
        : conf < 0.25
        ? "Little confounding: even the naive gap is close to the ATE. Heterogeneity still shows up as a slope in τ(x)—high prior-spend customers gain more from the promo."
        : "High-spend customers are both more likely to be treated and have higher baseline sales. The naive ATE is off by about $" +
          Math.abs(bias).toFixed(1) +
          ". Double ML residualizes that selection and recovers a CATE that rises with prior spend.";

    renderStats($("dml-stats"), [
      {
        label: "True ATE",
        value: "$" + trueAte.toFixed(1),
        sub: "Known from the simulation",
      },
      {
        label: "Naive treated − control",
        value: "$" + naive.toFixed(1),
        sub: (bias >= 0 ? "+" : "−") + "$" + Math.abs(bias).toFixed(1) + " bias",
      },
      {
        label: "Double-ML ATE",
        value: "$" + dmlAte.toFixed(1),
        sub: "Partialled-out residual regression",
      },
    ]);

    const spend = (xv) => 20 + 200 * xv;
    lineChart(
      $("dml-chart"),
      [
        {
          color: "#d9a441",
          points: grid.map((p) => ({ x: spend(p.x), y: p.trueY })),
        },
        {
          color: "#0b3d91",
          points: grid.map((p) => ({ x: spend(p.x), y: p.dmlY })),
        },
        {
          color: "#888",
          dash: "5 4",
          points: grid.map((p) => ({ x: spend(p.x), y: p.naiveY })),
        },
      ],
      { xLabel: "Prior spend ($)", ymin: -20, ymax: 50 }
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
    ["auc-slots", "auc-eq"].forEach((id) => {
      const node = $(id);
      if (node) node.addEventListener("input", renderAuctions);
      if (node) node.addEventListener("change", renderAuctions);
    });
    ["mmm-tv", "mmm-search", "mmm-social", "mmm-email"].forEach((id) => {
      const node = $(id);
      if (node) node.addEventListener("input", renderMmm);
    });
    ["dml-conf", "dml-het"].forEach((id) => {
      const node = $(id);
      if (node) node.addEventListener("input", renderDml);
    });
    renderRanking();
    renderIncrementality();
    renderAuctions();
    renderMmm();
    renderDml();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bind);
  } else {
    bind();
  }
})();
