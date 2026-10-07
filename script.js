/* ==========================================================================
   LINKHUB — logik aplikasi (vanilla JS, tanpa framework)
   Data disimpan dalam localStorage browser.
   ========================================================================== */

(function () {
  'use strict';

  var STORAGE_KEY = 'linkhub.projects.v1';
  var TONES = ['1', '2', '3', '4', '5'];
  var MONTHS_MS = ['Jan', 'Feb', 'Mac', 'Apr', 'Mei', 'Jun', 'Jul', 'Ogo', 'Sep', 'Okt', 'Nov', 'Dis'];

  var els = {
    grid: document.getElementById('grid'),
    empty: document.getElementById('emptyState'),
    emptyTitle: document.getElementById('emptyTitle'),
    emptyText: document.getElementById('emptyText'),
    emptyAddBtn: document.getElementById('emptyAddBtn'),
    count: document.getElementById('projectCount'),
    search: document.getElementById('searchInput'),
    sort: document.getElementById('sortSelect'),
    addBtn: document.getElementById('addBtn'),

    overlay: document.getElementById('modalOverlay'),
    modalTitle: document.getElementById('modalTitle'),
    modalClose: document.getElementById('modalClose'),
    form: document.getElementById('projectForm'),
    projectId: document.getElementById('projectId'),
    nameInput: document.getElementById('nameInput'),
    urlInput: document.getElementById('urlInput'),
    imgUrlInput: document.getElementById('imgUrlInput'),
    imgFileInput: document.getElementById('imgFileInput'),
    previewWrap: document.getElementById('previewWrap'),
    imgPreview: document.getElementById('imgPreview'),
    removeImgBtn: document.getElementById('removeImgBtn'),
    dateInput: document.getElementById('dateInput'),
    formError: document.getElementById('formError'),
    cancelBtn: document.getElementById('cancelBtn'),
    submitBtn: document.getElementById('submitBtn'),

    confirmOverlay: document.getElementById('confirmOverlay'),
    confirmName: document.getElementById('confirmName'),
    confirmYes: document.getElementById('confirmYes'),
    confirmNo: document.getElementById('confirmNo'),

    toast: document.getElementById('toast'),
    year: document.getElementById('year')
  };

  var projects = load();
  var editingId = null;
  var currentImage = '';
  var deleteTargetId = null;
  var toastTimer = null;

  /* ---------- Utiliti ---------- */

  function $(id) { return document.getElementById(id); }

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function uid() {
    if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
    return 'id-' + Date.now() + '-' + Math.random().toString(36).slice(2, 10);
  }

  function todayISO() {
    var d = new Date();
    return d.getFullYear() + '-' +
      String(d.getMonth() + 1).padStart(2, '0') + '-' +
      String(d.getDate()).padStart(2, '0');
  }

  function formatDate(iso) {
    if (!iso) return '—';
    var p = iso.split('-');
    if (p.length !== 3) return iso;
    var m = parseInt(p[1], 10) - 1;
    return p[2] + ' ' + (MONTHS_MS[m] || p[1]) + ' ' + p[0];
  }

  function normalizeUrl(raw) {
    var v = (raw || '').trim();
    if (!v) return '';
    if (!/^https?:\/\//i.test(v)) v = 'https://' + v;
    try { return new URL(v).href; } catch (e) { return ''; }
  }

  function hostOf(url) {
    try { return new URL(url).hostname; } catch (e) { return ''; }
  }

  function shortUrl(url) {
    var s = url.replace(/^https?:\/\//i, '').replace(/\/$/, '');
    return s.length > 42 ? s.slice(0, 40) + '…' : s;
  }

  function faviconFor(url) {
    return 'https://www.google.com/s2/favicons?domain=' + encodeURIComponent(hostOf(url)) + '&sz=128';
  }

  function getById(id) {
    for (var i = 0; i < projects.length; i++) {
      if (projects[i].id === id) return projects[i];
    }
    return null;
  }

  /* ---------- Storage ---------- */

  function load() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      var data = raw ? JSON.parse(raw) : [];
      return Array.isArray(data) ? data : [];
    } catch (e) {
      return [];
    }
  }

  function persist() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
      return true;
    } catch (e) {
      toast('Gagal simpan — storan penuh. Cuba gambar yang lebih kecil.');
      return false;
    }
  }

  /* ---------- Gambar ---------- */

  function fileToDataUrl(file) {
    return new Promise(function (resolve, reject) {
      var reader = new FileReader();
      reader.onload = function () { resolve(reader.result); };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    }).then(function (dataUrl) {
      return resizeDataUrl(dataUrl).catch(function () { return dataUrl; });
    });
  }

  function resizeDataUrl(dataUrl) {
    return new Promise(function (resolve, reject) {
      var img = new Image();
      img.onload = function () {
        var MAX = 720;
        var scale = Math.min(1, MAX / img.width, MAX / img.height);
        var w = Math.max(1, Math.round(img.width * scale));
        var h = Math.max(1, Math.round(img.height * scale));
        var canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        var ctx = canvas.getContext('2d');
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, w, h);
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', 0.82));
      };
      img.onerror = reject;
      img.src = dataUrl;
    });
  }

  function updatePreview() {
    if (currentImage) {
      els.imgPreview.src = currentImage;
      els.previewWrap.hidden = false;
    } else {
      els.imgPreview.removeAttribute('src');
      els.previewWrap.hidden = true;
    }
  }

  /* ---------- Render ---------- */

  function visibleProjects() {
    var q = els.search.value.trim().toLowerCase();
    var list = projects.filter(function (p) {
      if (!q) return true;
      return (p.name + ' ' + p.url).toLowerCase().indexOf(q) !== -1;
    });

    var mode = els.sort.value;
    list = list.slice().sort(function (a, b) {
      if (mode === 'name') return a.name.localeCompare(b.name, 'ms');
      var cmp = (a.date || '').localeCompare(b.date || '');
      if (cmp !== 0) return mode === 'oldest' ? cmp : -cmp;
      return a.name.localeCompare(b.name, 'ms');
    });
    return list;
  }

  function mediaHtml(p, tone) {
    if (p.image) {
      return '<div class="card-media" data-tone="' + tone + '">' +
        '<img class="card-img" data-stage="custom" src="' + escapeHtml(p.image) + '" ' +
        'alt="Gambar ' + escapeHtml(p.name) + '" loading="lazy">' +
        '</div>';
    }
    return '<div class="card-media" data-tone="' + tone + '">' +
      '<img class="card-favicon" data-stage="favicon" src="' + escapeHtml(faviconFor(p.url)) + '" ' +
      'alt="Ikon ' + escapeHtml(p.name) + '" loading="lazy">' +
      '</div>';
  }

  function cardHtml(p, tone) {
    return '<article class="card" tabindex="0" data-id="' + escapeHtml(p.id) + '" ' +
      'aria-label="' + escapeHtml(p.name) + '">' +
      mediaHtml(p, tone) +
      '<div class="card-body">' +
      '<span class="chip" data-tone="' + tone + '">' + escapeHtml(formatDate(p.date)) + '</span>' +
      '<h3 class="card-name">' + escapeHtml(p.name) + '</h3>' +
      '<p class="card-url" title="' + escapeHtml(p.url) + '">' + escapeHtml(shortUrl(p.url)) + '</p>' +
      '<div class="card-actions">' +
      '<a class="btn btn-primary btn-small btn-open" data-action="open" href="' + escapeHtml(p.url) + '" ' +
      'target="_blank" rel="noopener noreferrer">Buka ↗</a>' +
      '<button class="btn btn-small btn-icon" data-action="edit" type="button" title="Edit" aria-label="Edit ' + escapeHtml(p.name) + '">✎</button>' +
      '<button class="btn btn-small btn-icon btn-danger" data-action="delete" type="button" title="Buang" aria-label="Buang ' + escapeHtml(p.name) + '">✕</button>' +
      '</div>' +
      '</div>' +
      '</article>';
  }

  function render() {
    var list = visibleProjects();
    var html = '';
    for (var i = 0; i < list.length; i++) {
      html += cardHtml(list[i], TONES[i % TONES.length]);
    }
    els.grid.innerHTML = html;

    els.count.textContent = projects.length;

    var hasProjects = projects.length > 0;
    var hasResults = list.length > 0;
    els.empty.hidden = hasResults;
    els.emptyAddBtn.hidden = hasProjects;
    if (!hasResults) {
      if (hasProjects) {
        els.emptyTitle.textContent = 'TIADA PADANAN';
        els.emptyText.textContent = 'Tak jumpa untuk “' + els.search.value.trim() + '”. Cuba kata kunci lain.';
      } else {
        els.emptyTitle.textContent = 'TIADA PROJECT LAGI';
        els.emptyText.textContent = 'Tambah project pertama anda — masukkan nama, link & gambar.';
      }
    }

    attachImageFallbacks();
  }

  function attachImageFallbacks() {
    var imgs = els.grid.querySelectorAll('img[data-stage]');
    Array.prototype.forEach.call(imgs, function (img) {
      img.addEventListener('error', function () {
        var card = img.closest('.card');
        var p = card ? getById(card.getAttribute('data-id')) : null;
        var media = img.parentElement;
        if (!p || !media) return;

        if (img.dataset.stage === 'custom') {
          img.dataset.stage = 'favicon';
          img.className = 'card-favicon';
          img.src = faviconFor(p.url);
        } else {
          var letter = document.createElement('div');
          letter.className = 'card-letter';
          var first = (p.name || '?').trim().charAt(0).toUpperCase();
          letter.textContent = first || '?';
          media.textContent = '';
          media.appendChild(letter);
        }
      });
    });
  }

  /* ---------- Modal tambah / edit ---------- */

  function openModal(p) {
    editingId = p ? p.id : null;
    els.modalTitle.textContent = p ? 'EDIT PROJECT' : 'TAMBAH PROJECT';
    els.submitBtn.textContent = p ? 'Kemaskini' : 'Simpan';
    els.projectId.value = editingId || '';
    els.nameInput.value = p ? p.name : '';
    els.urlInput.value = p ? p.url : '';
    els.dateInput.value = p && p.date ? p.date : todayISO();

    currentImage = p && p.image ? p.image : '';
    els.imgUrlInput.value = currentImage && currentImage.indexOf('data:') !== 0 ? currentImage : '';
    els.imgFileInput.value = '';
    els.formError.hidden = true;
    updatePreview();

    els.overlay.hidden = false;
    document.body.style.overflow = 'hidden';
    els.nameInput.focus();
  }

  function closeModal() {
    els.overlay.hidden = true;
    document.body.style.overflow = '';
    editingId = null;
    currentImage = '';
  }

  function showFormError(msg) {
    els.formError.textContent = msg;
    els.formError.hidden = false;
  }

  function submitForm(e) {
    e.preventDefault();

    var name = els.nameInput.value.trim();
    var url = normalizeUrl(els.urlInput.value);
    var date = els.dateInput.value;

    if (!name) { showFormError('Nama project wajib diisi.'); els.nameInput.focus(); return; }
    if (!url) { showFormError('Link tak sah. Contoh: https://example.com'); els.urlInput.focus(); return; }
    if (!date) { showFormError('Tarikh dibuat wajib diisi.'); els.dateInput.focus(); return; }

    var project = { id: editingId || uid(), name: name, url: url, image: currentImage, date: date };

    if (editingId) {
      for (var i = 0; i < projects.length; i++) {
        if (projects[i].id === editingId) { projects[i] = project; break; }
      }
      if (!persist()) return;
      toast('Project dikemaskini!');
    } else {
      projects.unshift(project);
      if (!persist()) { projects.shift(); return; }
      toast('Project ditambah!');
    }

    closeModal();
    render();
  }

  /* ---------- Buang ---------- */

  function openConfirm(p) {
    deleteTargetId = p.id;
    els.confirmName.textContent = p.name;
    els.confirmOverlay.hidden = false;
    document.body.style.overflow = 'hidden';
    els.confirmYes.focus();
  }

  function closeConfirm() {
    els.confirmOverlay.hidden = true;
    document.body.style.overflow = '';
    deleteTargetId = null;
  }

  function confirmDelete() {
    var p = getById(deleteTargetId);
    projects = projects.filter(function (x) { return x.id !== deleteTargetId; });
    persist();
    closeConfirm();
    render();
    toast(p ? '“' + p.name + '” dibuang.' : 'Project dibuang.');
  }

  /* ---------- Toast ---------- */

  function toast(msg) {
    els.toast.textContent = msg;
    els.toast.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { els.toast.hidden = true; }, 2600);
  }

  /* ---------- Event ---------- */

  els.grid.addEventListener('click', function (e) {
    var cardEl = e.target.closest('.card');
    if (!cardEl) return;
    var p = getById(cardEl.getAttribute('data-id'));
    if (!p) return;

    var actionEl = e.target.closest('[data-action]');
    if (actionEl) {
      e.preventDefault();
      e.stopPropagation();
      var action = actionEl.getAttribute('data-action');
      if (action === 'open') window.open(p.url, '_blank', 'noopener');
      else if (action === 'edit') openModal(p);
      else if (action === 'delete') openConfirm(p);
      return;
    }

    if (e.target.closest('a')) return;
    window.open(p.url, '_blank', 'noopener');
  });

  els.grid.addEventListener('keydown', function (e) {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    if (!e.target.classList.contains('card')) return;
    e.preventDefault();
    var p = getById(e.target.getAttribute('data-id'));
    if (p) window.open(p.url, '_blank', 'noopener');
  });

  els.addBtn.addEventListener('click', function () { openModal(null); });
  els.emptyAddBtn.addEventListener('click', function () { openModal(null); });

  els.form.addEventListener('submit', submitForm);
  els.cancelBtn.addEventListener('click', closeModal);
  els.modalClose.addEventListener('click', closeModal);

  els.imgUrlInput.addEventListener('input', function () {
    currentImage = els.imgUrlInput.value.trim();
    els.imgFileInput.value = '';
    updatePreview();
  });

  els.imgFileInput.addEventListener('change', function () {
    var file = els.imgFileInput.files && els.imgFileInput.files[0];
    if (!file) return;
    fileToDataUrl(file).then(function (dataUrl) {
      currentImage = dataUrl;
      els.imgUrlInput.value = '';
      updatePreview();
    }).catch(function () {
      toast('Tak dapat baca fail gambar itu.');
    });
  });

  els.removeImgBtn.addEventListener('click', function () {
    currentImage = '';
    els.imgUrlInput.value = '';
    els.imgFileInput.value = '';
    updatePreview();
  });

  els.imgPreview.addEventListener('error', function () {
    if (currentImage) showFormError('Gambar tak dapat dimuatkan — semak URL gambar.');
  });

  els.search.addEventListener('input', render);
  els.sort.addEventListener('change', render);

  els.confirmYes.addEventListener('click', confirmDelete);
  els.confirmNo.addEventListener('click', closeConfirm);

  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    if (!els.confirmOverlay.hidden) closeConfirm();
    else if (!els.overlay.hidden) closeModal();
  });

  /* ---------- Init ---------- */

  els.year.textContent = new Date().getFullYear();
  els.dateInput.value = todayISO();
  render();
})();
