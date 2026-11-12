---
layout: page
title: Demos
permalink: /demos/
wide: true
---

<p class="lede">Two browser toys for the problems I work on: how ranking changes consumer surplus under costly search, and how a brand promotion’s “lift” splits into incrementality versus cannibalization. Both are stylized teaching models, not production estimates.</p>

<section id="ranking" class="demo">
  <h2>Search-ranking welfare</h2>
  <p>Shoppers search an online travel agency from the top of the list downward. Inspecting a hotel reveals a match value; each inspection costs time. They buy at most one room, with perfect recall, and stop when the expected gain from another click is below the search cost. Because people follow the list, the platform’s ranking changes who gets found—and therefore surplus.</p>
  <p class="demo-note">This is a pedagogical sequential-search model in the spirit of my <a href="{{ '/research/' | relative_url }}">OTA ranking paper</a>. The paper’s empirical estimates ($8.11 from random → proprietary; −$23.87 from dropping the top five) are not reproduced here.</p>

  <div class="demo-controls">
    <label class="demo-field">
      <span>Ranking</span>
      <select id="rank-policy">
        <option value="random">Random</option>
        <option value="quality" selected>Quality (mean surplus)</option>
        <option value="platform">Proprietary (surplus + commission)</option>
      </select>
    </label>
    <label class="demo-field">
      <span>Search cost <em id="rank-cost-label">$8</em></span>
      <input id="rank-cost" type="range" min="2" max="18" step="1" value="8">
    </label>
    <label class="demo-check">
      <input id="rank-drop-top" type="checkbox">
      Remove the top 5 hotels from every list
    </label>
  </div>

  <div class="stat-grid" id="rank-stats"></div>
  <div class="demo-split">
    <div>
      <h3>Purchase share by hotel</h3>
      <div id="rank-bars" class="chart"></div>
    </div>
    <div>
      <h3>Current list</h3>
      <ol id="rank-list" class="rank-list"></ol>
    </div>
  </div>
</section>

<section id="incrementality" class="demo">
  <h2>Incrementality vs. cannibalization</h2>
  <p>A marketplace boosts one brand on a new-brand surface. Dashboards often treat every extra order as incremental. In reality, some of those orders would have gone to substitute brands anyway. This toy maps promotion intensity into <strong>gross attributed lift</strong>, then splits it into net-new GMV versus cannibalized GMV—within category and across category.</p>

  <div class="demo-controls">
    <label class="demo-field">
      <span>Brand to promote</span>
      <select id="inc-brand"></select>
    </label>
    <label class="demo-field">
      <span>Promotion intensity <em id="inc-boost-label">40%</em></span>
      <input id="inc-boost" type="range" min="0" max="100" step="5" value="40">
    </label>
    <label class="demo-field">
      <span>Within-category substitution <em id="inc-sub-label">55%</em></span>
      <input id="inc-sub" type="range" min="10" max="90" step="5" value="55">
    </label>
  </div>

  <div class="stat-grid" id="inc-stats"></div>
  <div class="demo-split">
    <div>
      <h3>Where the attributed lift came from</h3>
      <div id="inc-stack" class="chart"></div>
      <p class="demo-caption" id="inc-verdict"></p>
    </div>
    <div>
      <h3>GMV by brand</h3>
      <div id="inc-brands" class="chart"></div>
    </div>
  </div>
</section>

<script src="{{ '/assets/js/demos.js' | relative_url }}"></script>
