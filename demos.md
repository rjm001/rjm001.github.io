---
layout: page
title: Demos
permalink: /demos/
wide: true
---

<p class="lede">Browser toys for problems I work on: costly-search ranking, incrementality versus cannibalization, VCG vs. GSP, mixed-media response, and heterogeneous effects with double ML. These are stylized teaching models, not production estimates.</p>

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

<section id="auctions" class="demo">
  <h2>VCG vs. GSP ad auctions</h2>
  <p>Advertisers rank by score = <strong>pCTR × bid</strong>, where bid is a max CPC implied by <strong>tROAS</strong>: bid = pCTO × pOV / tROAS. Value per click is expected order value, pCTO × pOV. Slots have decaying position CTRs, so the top ad is worth more clicks.</p>
  <p><strong>GSP</strong> charges the winner of slot <em>i</em> the next advertiser’s score on every click in that slot. <strong>VCG</strong> charges the externality: only the extra clicks you take from people below you. With <strong>one slot</strong> those rules are the same second-price auction. With <strong>several slots</strong> they differ if everyone bids the same tROAS CPC. In a locally envy-free Nash equilibrium of GSP, bids are shaded until GSP prices equal VCG—so the mechanisms agree again.</p>

  <div class="demo-controls">
    <label class="demo-field">
      <span>Ad slots <em id="auc-slots-label">1</em></span>
      <input id="auc-slots" type="range" min="1" max="5" step="1" value="1">
    </label>
    <label class="demo-check">
      <input id="auc-eq" type="checkbox">
      GSP envy-free equilibrium (prices match VCG)
    </label>
  </div>

  <p class="demo-caption" id="auc-verdict"></p>
  <div class="stat-grid" id="auc-stats"></div>
  <div class="demo-split">
    <div>
      <h3>Total price and advertiser surplus</h3>
      <div id="auc-bars" class="chart"></div>
    </div>
    <div>
      <h3>Who wins which slot</h3>
      <div id="auc-alloc" class="chart"></div>
    </div>
  </div>
  <div class="table-wrap">
    <table class="demo-table" id="auc-table"></table>
  </div>
</section>

<section id="mmm" class="demo">
  <h2>Mixed-media marketing</h2>
  <p>A marketing-mix model maps spend by channel into sales. Two frictions matter: <strong>adstock</strong> (today’s spend still works next week) and <strong>saturation</strong> (the next dollar buys less than the last). This toy is a steady-state Hill/adstock response: move weekly budgets and compare contribution, total sales, and <strong>marginal ROI</strong>. Saturated channels look good on average ROI and bad on the margin.</p>

  <div class="demo-controls demo-controls-4">
    <label class="demo-field">
      <span>TV <em id="mmm-tv-label">$80k</em></span>
      <input id="mmm-tv" type="range" min="0" max="200" step="5" value="80">
    </label>
    <label class="demo-field">
      <span>Paid search <em id="mmm-search-label">$50k</em></span>
      <input id="mmm-search" type="range" min="0" max="200" step="5" value="50">
    </label>
    <label class="demo-field">
      <span>Social <em id="mmm-social-label">$35k</em></span>
      <input id="mmm-social" type="range" min="0" max="200" step="5" value="35">
    </label>
    <label class="demo-field">
      <span>Email <em id="mmm-email-label">$15k</em></span>
      <input id="mmm-email" type="range" min="0" max="200" step="5" value="15">
    </label>
  </div>

  <p class="demo-caption" id="mmm-verdict"></p>
  <div class="stat-grid" id="mmm-stats"></div>
  <div class="demo-split">
    <div>
      <h3>Sales contribution by channel</h3>
      <div id="mmm-stack" class="chart"></div>
    </div>
    <div>
      <h3>Marginal ROI (next $1k)</h3>
      <div id="mmm-mroi" class="chart"></div>
    </div>
  </div>
</section>

<section id="dml" class="demo">
  <h2>Heterogeneous effects with double ML</h2>
  <p>Treatment <em>T</em> (a promo) is not random: people with higher prior spend are more likely to get it, and they also buy more anyway. A naive treated-minus-control gap therefore mixes <strong>selection</strong> with the true effect. <strong>Double / debiased ML</strong> residualizes outcome and treatment on covariates with flexible models, then regresses residuals on residuals. That estimates the ATE, and interacting the residual treatment with a feature estimates a CATE: who benefits more.</p>
  <p class="demo-note">The toy draws a fresh sample of 800 customers. “Prior spend” is the covariate. Ground truth is known because we simulated it.</p>

  <div class="demo-controls">
    <label class="demo-field">
      <span>Confounding <em id="dml-conf-label">1.2</em></span>
      <input id="dml-conf" type="range" min="0" max="2.4" step="0.1" value="1.2">
    </label>
    <label class="demo-field">
      <span>Heterogeneity <em id="dml-het-label">1.0</em></span>
      <input id="dml-het" type="range" min="0" max="2.5" step="0.1" value="1.0">
    </label>
  </div>

  <p class="demo-caption" id="dml-verdict"></p>
  <div class="stat-grid" id="dml-stats"></div>
  <div>
    <h3>CATE vs. prior spend</h3>
    <div id="dml-chart" class="chart"></div>
    <p class="demo-caption">Gold = true τ(x). Navy = double-ML CATE. Dashed = naive ATE (constant, and usually wrong).</p>
  </div>
</section>

<section id="glossary" class="demo glossary">
  <h2>Glossary</h2>
  <dl>
    <div>
      <dt>CPC</dt>
      <dd>Cost per click. What the advertiser pays when someone clicks the ad. In this toy the max CPC bid is pCTO × pOV / tROAS.</dd>
    </div>
    <div>
      <dt>CTR</dt>
      <dd>Click-through rate. Clicks divided by impressions. Position CTRs here are relative click rates by slot (top ads get more clicks).</dd>
    </div>
    <div>
      <dt>GMV</dt>
      <dd>Gross merchandise value. Dollar volume of orders, before taking out ads cost or take rate.</dd>
    </div>
    <div>
      <dt>GSP</dt>
      <dd>Generalized second-price auction. Rank ads by score; the winner of a slot pays a price tied to the next advertiser’s score on every click in that slot.</dd>
    </div>
    <div>
      <dt>OTA</dt>
      <dd>Online travel agency. The setting of the ranking-and-welfare paper and the hotel-search toy.</dd>
    </div>
    <div>
      <dt>pCTO</dt>
      <dd>Predicted click-to-order. Probability that a click becomes an order.</dd>
    </div>
    <div>
      <dt>pCTR</dt>
      <dd>Predicted click-through rate. Probability that an impression (in a given slot) becomes a click, before applying the slot’s position multiplier.</dd>
    </div>
    <div>
      <dt>pOV</dt>
      <dd>Predicted order value. Expected dollars of GMV if the click converts.</dd>
    </div>
    <div>
      <dt>tROAS</dt>
      <dd>Target return on ad spend. The advertiser’s required GMV per dollar of spend. A tROAS of 2× means they will not pay more than half of expected order value for the click.</dd>
    </div>
    <div>
      <dt>ATE</dt>
      <dd>Average treatment effect. The mean of Y(1) − Y(0) in the population. One number, not who benefits.</dd>
    </div>
    <div>
      <dt>CATE</dt>
      <dd>Conditional average treatment effect, τ(x) = E[Y(1) − Y(0) | X = x]. How the effect varies with covariates.</dd>
    </div>
    <div>
      <dt>DML</dt>
      <dd>Double / debiased machine learning (Chernozhukov et al.). Residualize Y and T on X with ML, then regress residuals on residuals so regularization bias does not infect the causal estimate.</dd>
    </div>
    <div>
      <dt>HTE</dt>
      <dd>Heterogeneous treatment effects. The treatment is not constant across people; CATE is one way to write that.</dd>
    </div>
    <div>
      <dt>MMM</dt>
      <dd>Marketing mix / mixed-media model. A time-series (often Bayesian) model of sales as a function of channel spend, typically with adstock and saturation.</dd>
    </div>
    <div>
      <dt>VCG</dt>
      <dd>Vickrey–Clarke–Groves auction. Each winner pays the externality they impose on others: the extra clicks taken from advertisers who would have ranked below them.</dd>
    </div>
    <div>
      <dt>Adstock</dt>
      <dd>Carryover of media: spend this week still affects sales in later weeks. Higher adstock means a more persistent channel (often TV).</dd>
    </div>
  </dl>
</section>

<script src="{{ '/assets/js/demos.js' | relative_url }}"></script>
