/* ==========================================================
   SkyLane Air Cargo - app logic
   1. Shipment data (sample)
   2. Shipment tracker (the interactive business feature)
   3. Dashboard (KPIs, charts, delay table)
   4. Enquiry form
   5. Navigation helpers
   ========================================================== */

(function () {
  'use strict';

  /* ---------------------------------------------------------
     1. SAMPLE DATA
     --------------------------------------------------------- */

  var STAGES = [
    'Booked',
    'Received at cargo terminal',
    'Security screened',
    'Departed',
    'Arrived at destination',
    'Customs cleared',
    'Delivered'
  ];

  var AIRPORTS = {
    AMD: 'Ahmedabad',
    DEL: 'Delhi',
    BOM: 'Mumbai',
    DXB: 'Dubai',
    SIN: 'Singapore',
    FRA: 'Frankfurt',
    LHR: 'London'
  };

  // done = number of completed stages (1 to 7); times[] holds one timestamp per completed stage
  var SHIPMENTS = {
    SLC1001: {
      status: 'Delivered', from: 'AMD', to: 'DXB', flight: 'SL 412',
      service: 'Pharma Cold Chain', customer: 'Meridian Pharma Pvt Ltd',
      pieces: 12, weight: 180, eta: 'Delivered 11 Oct, 16:40', done: 7,
      times: ['10 Oct, 11:20', '10 Oct, 15:05', '10 Oct, 17:30', '11 Oct, 02:15', '11 Oct, 05:40', '11 Oct, 12:10', '11 Oct, 16:40']
    },
    SLC1025: {
      status: 'In Transit', from: 'AMD', to: 'SIN', flight: 'SL 618',
      service: 'International Express', customer: 'Kalpana Textiles',
      pieces: 8, weight: 420, eta: '14 Oct, 21:30 local time', done: 4,
      times: ['12 Oct, 09:10', '13 Oct, 14:25', '13 Oct, 18:00', '14 Oct, 06:45']
    },
    SLC1042: {
      status: 'Delayed', from: 'AMD', to: 'LHR', flight: 'SL 902',
      service: 'International Express', customer: 'Bharat Precision Tools',
      pieces: 3, weight: 95, eta: 'Revised to 16 Oct, 10:00', done: 2,
      times: ['12 Oct, 17:40', '13 Oct, 20:10'],
      reason: 'Held at our terminal. The export shipping bill is still pending from the shipper, so the cargo could not be cleared for the flight.',
      reasonShort: 'Export customs documents pending', delay: '9 h'
    },
    SLC1050: {
      status: 'Booked', from: 'AMD', to: 'DEL', flight: 'SL 207',
      service: 'Domestic Express', customer: 'Aarav Electronics',
      pieces: 6, weight: 54, eta: '15 Oct, 18:00', done: 1,
      times: ['14 Oct, 08:15']
    },
    SLC1066: {
      status: 'Delayed', from: 'AMD', to: 'FRA', flight: 'SL 744',
      service: 'International Economy', customer: 'Gujarat Auto Components',
      pieces: 14, weight: 610, eta: 'Revised to 15 Oct, 23:00 local time', done: 3,
      times: ['12 Oct, 10:30', '13 Oct, 13:45', '13 Oct, 16:20'],
      reason: 'The aircraft arrived late for its rotation, so the flight was moved to the next departure.',
      reasonShort: 'Aircraft rotation late, moved to next flight', delay: '6 h'
    },
    SLC1073: {
      status: 'Delayed', from: 'AMD', to: 'BOM', flight: 'SL 131',
      service: 'Domestic Standard', customer: 'Sunrise Garments',
      pieces: 20, weight: 340, eta: 'Revised to 14 Oct, 22:00', done: 3,
      times: ['13 Oct, 09:00', '13 Oct, 17:15', '13 Oct, 19:40'],
      reason: 'Offloaded because there was not enough ULD (container) space. Rebooked on the next flight.',
      reasonShort: 'Offloaded for lack of ULD space', delay: '4 h'
    },
    SLC1088: {
      status: 'Delayed', from: 'AMD', to: 'DXB', flight: 'SL 412',
      service: 'Pharma Cold Chain', customer: 'Vita Life Sciences',
      pieces: 9, weight: 150, eta: 'Revised to 15 Oct, 09:00 local time', done: 5,
      times: ['12 Oct, 10:10', '12 Oct, 14:50', '12 Oct, 17:20', '13 Oct, 02:15', '13 Oct, 05:40'],
      reason: 'Selected for physical inspection by customs at the destination. Cold storage temperature is being monitored.',
      reasonShort: 'Held for customs inspection at Dubai', delay: '11 h'
    }
  };

  var DASH = {
    delivered: 1612,
    inTransit: 168,
    delayed: 60,
    deliveredOnTime: 1473,
    satisfaction: 4.5,
    feedbackCount: 612,
    avgTransitHours: 26.5,
    tonnageMonths: ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'],
    tonnage: [318.4, 336.9, 351.2, 372.8, 391.5, 412.6],
    onTimeTrend: [88.2, 89.1, 89.9, 90.4, 90.8, 91.4],
    onTimeTarget: 95,
    routes: [
      { name: 'AMD to DXB', tonnes: 96.2 },
      { name: 'AMD to DEL', tonnes: 84.5 },
      { name: 'AMD to BOM', tonnes: 71.9 },
      { name: 'AMD to SIN', tonnes: 58.3 },
      { name: 'AMD to LHR', tonnes: 54.1 },
      { name: 'AMD to FRA', tonnes: 47.6 }
    ]
  };

  /* ---------------------------------------------------------
     Small helpers
     --------------------------------------------------------- */

  function $(id) { return document.getElementById(id); }
  function fmt(n) { return n.toLocaleString('en-IN'); }
  function pct(part, whole) { return (part / whole * 100).toFixed(1); }

  /* ---------------------------------------------------------
     2. SHIPMENT TRACKER
     --------------------------------------------------------- */

  function normaliseAwb(raw) {
    var s = String(raw).toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (/^\d+$/.test(s)) { s = 'SLC' + s; }   // allow typing only the number
    return s;
  }

  function badgeClass(status) {
    if (status === 'Delivered') { return 'badge-delivered'; }
    if (status === 'In Transit') { return 'badge-transit'; }
    if (status === 'Delayed') { return 'badge-delayed'; }
    return 'badge-booked';
  }

  // Draws the route arc and moves the aircraft along it according to progress
  function routeSvg(s) {
    var P0 = { x: 44, y: 84 }, P1 = { x: 180, y: -6 }, P2 = { x: 316, y: 84 };
    var t = Math.min(s.done / STAGES.length, 1);
    var u = 1 - t;
    var cx = u * u * P0.x + 2 * u * t * P1.x + t * t * P2.x;
    var cy = u * u * P0.y + 2 * u * t * P1.y + t * t * P2.y;
    var qx = P0.x + t * (P1.x - P0.x);
    var qy = P0.y + t * (P1.y - P0.y);
    var dx = 2 * u * (P1.x - P0.x) + 2 * t * (P2.x - P1.x);
    var dy = 2 * u * (P1.y - P0.y) + 2 * t * (P2.y - P1.y);
    var angle = Math.atan2(dy, dx) * 180 / Math.PI;
    var done = Math.round(t * 100);

    return '' +
      '<svg class="route' + (s.status === 'Delayed' ? ' route-delayed' : '') + '" viewBox="0 0 360 120" role="img" ' +
      'aria-label="Route from ' + AIRPORTS[s.from] + ' to ' + AIRPORTS[s.to] + ', about ' + done + ' percent of the journey complete">' +
      '<path class="route-base" d="M44 84 Q180 -6 316 84"/>' +
      '<path class="route-done" d="M44 84 Q' + qx.toFixed(1) + ' ' + qy.toFixed(1) + ' ' + cx.toFixed(1) + ' ' + cy.toFixed(1) + '"/>' +
      '<circle class="route-dot" cx="44" cy="84" r="5"/>' +
      '<circle class="route-dot" cx="316" cy="84" r="5"/>' +
      '<text class="route-code" x="44" y="105">' + s.from + '</text>' +
      '<text class="route-city" x="44" y="117">' + AIRPORTS[s.from] + '</text>' +
      '<text class="route-code" x="316" y="105">' + s.to + '</text>' +
      '<text class="route-city" x="316" y="117">' + AIRPORTS[s.to] + '</text>' +
      '<g transform="translate(' + cx.toFixed(1) + ' ' + cy.toFixed(1) + ') rotate(' + angle.toFixed(1) + ')">' +
      '<path class="route-plane" d="M12 0 L-8 -8 L-4 0 L-8 8 Z"/></g>' +
      '</svg>';
  }

  function timelineHtml(s) {
    var html = '<ol class="timeline">';
    for (var i = 0; i < STAGES.length; i++) {
      var cls, time;
      if (i < s.done) {
        cls = 'is-done'; time = s.times[i];
      } else if (i === s.done) {
        cls = 'is-current' + (s.status === 'Delayed' ? ' is-problem' : '');
        time = s.status === 'Delayed' ? 'Delayed' : 'In progress';
      } else {
        cls = 'is-pending'; time = 'Pending';
      }
      html += '<li class="' + cls + '"><span>' + STAGES[i] + '</span><span class="stage-time">' + time + '</span></li>';
    }
    return html + '</ol>';
  }

  function renderShipment(awb, s) {
    var etaLabel = s.status === 'Delivered' ? 'Delivery' : 'Estimated arrival';
    var etaValue = s.status === 'Delivered' ? s.eta.replace('Delivered ', '') : s.eta;

    return '' +
      '<div class="result-head">' +
        '<div><p class="result-awb">' + awb + '</p><p class="result-service">' + s.service + '</p></div>' +
        '<span class="badge ' + badgeClass(s.status) + '">' + s.status + '</span>' +
      '</div>' +
      routeSvg(s) +
      '<dl class="result-facts">' +
        '<div><dt>Flight</dt><dd>' + s.flight + '</dd></div>' +
        '<div><dt>' + etaLabel + '</dt><dd>' + etaValue + '</dd></div>' +
        '<div><dt>Customer</dt><dd>' + s.customer + '</dd></div>' +
        '<div><dt>Pieces and weight</dt><dd>' + s.pieces + ' pcs, ' + s.weight + ' kg</dd></div>' +
      '</dl>' +
      (s.status === 'Delayed' ? '<p class="alert"><strong>Delayed by ' + s.delay + '.</strong> ' + s.reason + '</p>' : '') +
      timelineHtml(s);
  }

  function trackShipment(raw) {
    var box = $('track-result');
    var awb = normaliseAwb(raw);

    if (!awb) {
      box.innerHTML = '<p class="track-error">Enter a waybill number such as SLC1025.</p>';
      return;
    }
    if (!Object.prototype.hasOwnProperty.call(SHIPMENTS, awb)) {
      box.innerHTML = '';
      var p = document.createElement('p');
      p.className = 'track-error';
      p.textContent = 'No shipment found for ' + awb + '. Waybill numbers look like SLC1025. Try one of the sample numbers above.';
      box.appendChild(p);
      return;
    }
    box.innerHTML = renderShipment(awb, SHIPMENTS[awb]);
  }

  function initTracker() {
    var form = $('track-form');
    var input = $('awb');

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      trackShipment(input.value);
    });

    $('sample-chips').addEventListener('click', function (e) {
      var btn = e.target.closest('button[data-awb]');
      if (!btn) { return; }
      input.value = btn.getAttribute('data-awb');
      trackShipment(input.value);
    });
  }

  /* ---------------------------------------------------------
     3. DASHBOARD
     --------------------------------------------------------- */

  function renderKpis() {
    var total = DASH.delivered + DASH.inTransit + DASH.delayed;
    var kpis = [
      { label: 'Total shipments', value: fmt(total), note: 'This month' },
      { label: 'Delivered', value: fmt(DASH.delivered), note: pct(DASH.delivered, total) + '% of total' },
      { label: 'In transit', value: fmt(DASH.inTransit), note: pct(DASH.inTransit, total) + '% of total' },
      { label: 'Delayed', value: fmt(DASH.delayed), note: pct(DASH.delayed, total) + '% of total', tone: 'is-bad' },
      { label: 'On-time delivery', value: pct(DASH.deliveredOnTime, DASH.delivered) + '%', note: 'Target ' + DASH.onTimeTarget + '%', tone: 'is-good' },
      { label: 'Customer satisfaction', value: DASH.satisfaction.toFixed(1) + ' / 5', note: 'From ' + DASH.feedbackCount + ' feedback forms' },
      { label: 'Cargo uplifted', value: DASH.tonnage[5].toFixed(1) + ' t',
        note: '+' + ((DASH.tonnage[5] / DASH.tonnage[4] - 1) * 100).toFixed(1) + '% vs last month' },
      { label: 'Average transit time', value: DASH.avgTransitHours.toFixed(1) + ' h', note: 'Booking to delivery' }
    ];

    $('kpi-grid').innerHTML = kpis.map(function (k) {
      return '<div class="kpi ' + (k.tone || '') + '">' +
        '<p class="kpi-label">' + k.label + '</p>' +
        '<p class="kpi-value">' + k.value + '</p>' +
        '<p class="kpi-note">' + k.note + '</p></div>';
    }).join('');
  }

  /* ----- Chart helpers (plain SVG, no libraries needed) ----- */

  function svgOpen(w, h, label) {
    return '<svg viewBox="0 0 ' + w + ' ' + h + '" role="img" aria-label="' + label + '">';
  }

  function barChart(target, labels, values, label) {
    var W = 420, H = 230, L = 38, R = 8, T = 22, B = 28;
    var iw = W - L - R, ih = H - T - B;
    var max = Math.ceil(Math.max.apply(null, values) / 100) * 100;
    var slot = iw / values.length, bw = slot * 0.58;
    var s = svgOpen(W, H, label), i, y;

    for (i = 0; i <= 4; i++) {
      y = T + ih - ih * i / 4;
      s += '<line class="grid-line" x1="' + L + '" x2="' + (W - R) + '" y1="' + y + '" y2="' + y + '"/>';
      s += '<text x="' + (L - 6) + '" y="' + (y + 4) + '" text-anchor="end">' + (max * i / 4) + '</text>';
    }
    values.forEach(function (v, i) {
      var h = ih * v / max;
      var x = L + slot * i + (slot - bw) / 2;
      var last = i === values.length - 1;
      s += '<rect class="bar' + (last ? ' bar-now' : '') + '" x="' + x.toFixed(1) + '" y="' + (T + ih - h).toFixed(1) +
           '" width="' + bw.toFixed(1) + '" height="' + h.toFixed(1) + '"/>';
      s += '<text class="value-label" x="' + (x + bw / 2).toFixed(1) + '" y="' + (T + ih - h - 6).toFixed(1) + '" text-anchor="middle">' + Math.round(v) + '</text>';
      s += '<text x="' + (x + bw / 2).toFixed(1) + '" y="' + (H - 8) + '" text-anchor="middle">' + labels[i] + '</text>';
    });
    target.innerHTML = s + '</svg>';
  }

  function lineChart(target, labels, values, targetValue, label) {
    var W = 420, H = 230, L = 38, R = 14, T = 22, B = 28;
    var iw = W - L - R, ih = H - T - B;
    var min = 86, max = 96;
    var s = svgOpen(W, H, label), i, y, pts = [];

    function yOf(v) { return T + ih - ih * (v - min) / (max - min); }

    for (i = min; i <= max; i += 2) {
      y = yOf(i);
      s += '<line class="grid-line" x1="' + L + '" x2="' + (W - R) + '" y1="' + y + '" y2="' + y + '"/>';
      s += '<text x="' + (L - 6) + '" y="' + (y + 4) + '" text-anchor="end">' + i + '</text>';
    }
    y = yOf(targetValue);
    s += '<line class="target-line" x1="' + L + '" x2="' + (W - R) + '" y1="' + y + '" y2="' + y + '"/>';
    s += '<text class="target-label" x="' + (L + 4) + '" y="' + (y - 6) + '">Target ' + targetValue + '%</text>';

    values.forEach(function (v, i) {
      var x = L + iw * (i + 0.5) / values.length;
      pts.push(x.toFixed(1) + ',' + yOf(v).toFixed(1));
    });
    s += '<polyline class="line" points="' + pts.join(' ') + '"/>';
    values.forEach(function (v, i) {
      var x = L + iw * (i + 0.5) / values.length;
      var last = i === values.length - 1;
      s += '<circle class="dot' + (last ? ' dot-now' : '') + '" cx="' + x.toFixed(1) + '" cy="' + yOf(v).toFixed(1) + '" r="4.5"/>';
      s += '<text class="value-label" x="' + x.toFixed(1) + '" y="' + (yOf(v) + 20).toFixed(1) + '" text-anchor="middle">' + v.toFixed(1) + '</text>';
      s += '<text x="' + x.toFixed(1) + '" y="' + (H - 8) + '" text-anchor="middle">' + labels[i] + '</text>';
    });
    target.innerHTML = s + '</svg>';
  }

  function donutChart(target, segments, label) {
    var r = 66, circ = 2 * Math.PI * r;
    var total = segments.reduce(function (a, b) { return a + b.value; }, 0);
    var offset = 0;
    var s = svgOpen(180, 180, label);
    s += '<g transform="rotate(-90 90 90)">';
    segments.forEach(function (seg) {
      var len = circ * seg.value / total;
      s += '<circle cx="90" cy="90" r="' + r + '" fill="none" stroke="' + seg.color + '" stroke-width="26" ' +
           'stroke-dasharray="' + len.toFixed(2) + ' ' + (circ - len).toFixed(2) + '" stroke-dashoffset="' + (-offset).toFixed(2) + '"/>';
      offset += len;
    });
    s += '</g>';
    s += '<text class="donut-total" x="90" y="92">' + fmt(total) + '</text>';
    s += '<text class="donut-sub" x="90" y="110">shipments</text>';
    s += '</svg>';

    var legend = '<ul class="legend">' + segments.map(function (seg) {
      return '<li><span class="swatch" style="background:' + seg.color + '"></span>' +
             '<span>' + seg.name + ': <strong>' + fmt(seg.value) + '</strong> (' + pct(seg.value, total) + '%)</span></li>';
    }).join('') + '</ul>';

    target.innerHTML = s + legend;
  }

  function hBarChart(target, rows, label) {
    var W = 420, rowH = 34, T = 6, L = 92, R = 44;
    var H = T + rows.length * rowH + 4;
    var max = Math.max.apply(null, rows.map(function (r) { return r.tonnes; }));
    var s = svgOpen(W, H, label);
    rows.forEach(function (row, i) {
      var y = T + i * rowH;
      var w = (W - L - R) * row.tonnes / max;
      s += '<text x="0" y="' + (y + 19) + '">' + row.name + '</text>';
      s += '<rect class="bar' + (i === 0 ? ' bar-now' : '') + '" x="' + L + '" y="' + (y + 6) + '" width="' + w.toFixed(1) + '" height="18"/>';
      s += '<text class="value-label" x="' + (L + w + 6).toFixed(1) + '" y="' + (y + 20) + '">' + row.tonnes.toFixed(1) + '</text>';
    });
    target.innerHTML = s + '</svg>';
  }

  function renderCharts() {
    barChart($('chart-tonnage'), DASH.tonnageMonths, DASH.tonnage,
      'Bar chart of monthly cargo tonnage from April to September, rising from 318 to 413 tonnes');

    donutChart($('chart-status'), [
      { name: 'Delivered', value: DASH.delivered, color: '#5BBF86' },
      { name: 'In transit', value: DASH.inTransit, color: '#7FA8E8' },
      { name: 'Delayed', value: DASH.delayed, color: '#FF8C79' }
    ], 'Donut chart of shipment status: delivered, in transit and delayed');

    lineChart($('chart-ontime'), DASH.tonnageMonths, DASH.onTimeTrend, DASH.onTimeTarget,
      'Line chart of on-time delivery rate rising from 88.2 to 91.4 percent against a 95 percent target');

    hBarChart($('chart-routes'), DASH.routes,
      'Bar chart of tonnes uplifted by route, Dubai highest at 96.2 tonnes');
  }

  function renderDelayTable() {
    var rows = '';
    var shown = 0;
    Object.keys(SHIPMENTS).forEach(function (awb) {
      var s = SHIPMENTS[awb];
      if (s.status !== 'Delayed') { return; }
      shown++;
      rows += '<tr>' +
        '<td>' + awb + '</td>' +
        '<td>' + s.from + ' to ' + s.to + '</td>' +
        '<td>' + s.reasonShort + '</td>' +
        '<td class="delay-amount">+' + s.delay + '</td>' +
        '<td><a href="#track" class="track-link" data-awb="' + awb + '">Track</a></td>' +
        '</tr>';
    });
    $('delay-body').innerHTML = rows;
    $('delay-title').textContent = 'Delayed shipments to resolve first (' + shown + ' of ' + DASH.delayed + ' shown)';

    // Dashboard to Tracker link: fills in the waybill and shows its status
    $('delay-body').addEventListener('click', function (e) {
      var link = e.target.closest('a.track-link');
      if (!link) { return; }
      $('awb').value = link.getAttribute('data-awb');
      trackShipment(link.getAttribute('data-awb'));
    });
  }

  /* ---------------------------------------------------------
     4. ENQUIRY FORM
     --------------------------------------------------------- */

  function initEnquiry() {
    var form = $('enquiry-form');
    var status = $('enquiry-status');

    // "Get a quote" links in the services table preselect the service
    document.addEventListener('click', function (e) {
      var link = e.target.closest('a.quote-link');
      if (!link) { return; }
      $('enq-service').value = link.getAttribute('data-service');
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      status.innerHTML = '';

      if (!form.checkValidity()) {
        var bad = document.createElement('p');
        bad.className = 'bad';
        bad.textContent = 'Please fill in your name, email, phone, service, destination and weight.';
        status.appendChild(bad);
        form.reportValidity();
        return;
      }

      var d = {
        name: form.name.value.trim(),
        email: form.email.value.trim(),
        phone: form.phone.value.trim(),
        service: form.service.value,
        destination: form.destination.value.trim(),
        weight: form.weight.value,
        message: form.message.value.trim()
      };
      var ref = 'ENQ-' + String(Date.now()).slice(-6);

      var body = 'Enquiry ' + ref + '\n\n' +
        'Name: ' + d.name + '\nEmail: ' + d.email + '\nPhone: ' + d.phone + '\n' +
        'Service: ' + d.service + '\nDestination: ' + d.destination + '\nWeight: ' + d.weight + ' kg\n' +
        (d.message ? '\nShipment details: ' + d.message + '\n' : '');
      var mailto = 'mailto:cargo@skylanecargo.example?subject=' +
        encodeURIComponent('Air cargo enquiry ' + ref + ' - ' + d.service) +
        '&body=' + encodeURIComponent(body);

      var ok = document.createElement('div');
      ok.className = 'ok';
      var p1 = document.createElement('p');
      p1.innerHTML = '<strong>Enquiry ' + ref + ' recorded.</strong>';
      var p2 = document.createElement('p');
      p2.textContent = 'Thank you, ' + d.name + '. Our cargo desk will reply to ' + d.email + ' with a quote for ' +
                       d.weight + ' kg of ' + d.service + ' cargo to ' + d.destination + '.';
      var p3 = document.createElement('p');
      var a = document.createElement('a');
      a.href = mailto;
      a.textContent = 'Also send this enquiry by email';
      p3.appendChild(a);
      ok.appendChild(p1); ok.appendChild(p2); ok.appendChild(p3);
      status.appendChild(ok);

      form.reset();
    });
  }

  /* ---------------------------------------------------------
     5. NAVIGATION
     --------------------------------------------------------- */

  function initNav() {
    var toggle = $('nav-toggle');
    var nav = $('site-nav');

    toggle.addEventListener('click', function () {
      var open = nav.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    nav.addEventListener('click', function (e) {
      if (e.target.closest('a')) {
        nav.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
      }
    });

    // Highlight the nav link of the section currently on screen
    if ('IntersectionObserver' in window) {
      var links = {};
      nav.querySelectorAll('a').forEach(function (a) { links[a.getAttribute('href').slice(1)] = a; });
      var ids = ['home', 'about', 'services', 'dashboard', 'contact'];
      var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) { return; }
          Object.keys(links).forEach(function (k) { links[k].classList.remove('is-active'); });
          if (links[entry.target.id]) { links[entry.target.id].classList.add('is-active'); }
        });
      }, { rootMargin: '-45% 0px -50% 0px' });
      ids.forEach(function (id) {
        var el = $(id);
        if (el) { observer.observe(el); }
      });
    }
  }

  /* ---------------------------------------------------------
     START
     --------------------------------------------------------- */

  document.addEventListener('DOMContentLoaded', function () {
    initNav();
    initTracker();
    renderKpis();
    renderCharts();
    renderDelayTable();
    initEnquiry();
  });
})();
