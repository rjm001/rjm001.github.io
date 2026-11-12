---
layout: home
---

<section class="hero">
  <img class="hero-photo" src="{{ '/assets/pictures/RyanMartinPhoto1.jpg' | relative_url }}" alt="Portrait of Ryan James Martin">
  <div class="hero-copy">
    <p class="eyebrow">San Francisco, CA</p>
    <h1>Ryan James Martin</h1>
    <p class="hero-role">Senior Applied AI/ML Scientist at Faire</p>
    <p class="lede">I build production machine learning and causal inference systems for customer growth, pricing, incrementality, and automated decisioning. PhD in Economics, UCLA.</p>
    <div class="hero-actions">
      <a class="btn btn-primary" href="{{ '/assets/pdfs/RyanMartinResume2026.pdf' | relative_url }}">Download resume</a>
      <a class="btn btn-ghost" href="{{ '/resume/' | relative_url }}">View experience</a>
    </div>
  </div>
</section>

<section class="section">
  <h2>About</h2>
  <p>I currently am a lead data scientist for brand growth, onboarding, acquisition, and success at Faire. My work covers end-to-end model building for both batch and real-time systems. My models score leads for their lifetime values, boost new brand exploration (via RL), resolve lead identities with language processing and LLMs, measure incrementality, estimate causal responses across different customer interventions, and more. Before Faire, I was a lead on pricing and experimentation work at GoPuff and Flexport, and I was a research scientist at the Bank of Canada. Across my roles, I have shipped models that move millions of dollars a year, designed experiments that leadership can trust, and translated econometrics into tools that product and finance teams rely on.</p>
</section>

<section class="section">
  <h2>Focus areas</h2>
  <ul class="chip-list">
    <li>Production ML</li>
    <li>Causal inference</li>
    <li>Incrementality</li>
    <li>Pricing &amp; elasticity</li>
    <li>Experimentation</li>
    <li>Forecasting</li>
    <li>Recommenders</li>
    <li>LLMs</li>
  </ul>
</section>

<section class="section">
  <h2>Selected experience</h2>
  <div class="card-grid">
    <article class="card">
      <p class="card-meta">Jul 2024–Present</p>
      <h3>Faire</h3>
      <p>Senior Applied AI/ML Scientist. Data science pod lead for brand growth, success, and onboarding. Own ML models and DAGs that deliver millions of dollars each year.</p>
    </article>
    <article class="card">
      <p class="card-meta">Dec 2023–May 2024</p>
      <h3>GoPuff</h3>
      <p>Senior Data Scientist, Experimentation and Pricing. Team lead for pricing DS. Multi-million dollar net revenue gains from automated pricing policy changes.</p>
    </article>
    <article class="card">
      <p class="card-meta">May 2021–Dec 2023</p>
      <h3>Flexport</h3>
      <p>Senior Data Scientist / Economist. Led pricing and causal inference. Lifetime value, churn, heterogeneous elasticities, and geo-clustered experiments.</p>
    </article>
  </div>
  <p class="section-link"><a href="{{ '/resume/' | relative_url }}">Full experience and education →</a></p>
</section>

<section class="section">
  <h2>Interactive tools</h2>
  <div class="card-grid card-grid-2">
    <article class="card">
      <p class="card-meta">Costly search</p>
      <h3>Search-ranking welfare</h3>
      <p>A stylized sequential-search toy: change how an OTA orders hotels and watch demand and consumer surplus move.</p>
      <p class="section-link"><a href="{{ '/demos/' | relative_url }}#ranking">Open the toy →</a></p>
    </article>
    <article class="card">
      <p class="card-meta">Marketplace causal inference</p>
      <h3>Incrementality vs. cannibalization</h3>
      <p>Promote a brand, then split naive lift into net-new orders and orders stolen from substitutes.</p>
      <p class="section-link"><a href="{{ '/demos/' | relative_url }}#incrementality">Open the toy →</a></p>
    </article>
  </div>
</section>
