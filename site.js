(function () {
  'use strict';

  var frame = document.getElementById('content-frame');
  var mobileMenu = document.getElementById('mobile-menu');

  document.querySelectorAll('[data-page]').forEach(function (link) {
    link.addEventListener('click', function (event) {
      event.preventDefault();
      frame.src = link.getAttribute('href');
      if (mobileMenu) mobileMenu.removeAttribute('open');
    });
  });

  frame.addEventListener('load', function () {
    try {
      var page = frame.contentDocument;
      if (!page) return;
      if (!page.querySelector('meta[name="viewport"]')) {
        var viewport = page.createElement('meta');
        viewport.name = 'viewport';
        viewport.content = 'width=device-width, initial-scale=1';
        page.head.appendChild(viewport);
      }
      if (!page.getElementById('legacy-modern-css')) {
        var stylesheet = page.createElement('link');
        stylesheet.id = 'legacy-modern-css';
        stylesheet.rel = 'stylesheet';
        stylesheet.href = '/legacy/legacy-modern.css';
        page.head.appendChild(stylesheet);
      }

      if (frame.contentWindow.location.pathname !== '/legacy/right.htm') {
        var homeLinks = Array.from(page.querySelectorAll('a')).filter(function (link) {
          return /トップページ(?:へ|に)?(?:もどる|戻る)/.test((link.textContent || '').replace(/\s/g, ''));
        });
        if (homeLinks.length) {
          homeLinks.forEach(function (link) {
            link.href = '/legacy/right.htm';
            link.removeAttribute('target');
            link.classList.add('legacy-home-return');
          });
        } else {
          var area = page.createElement('p');
          area.className = 'legacy-home-return-area';
          var home = page.createElement('a');
          home.className = 'legacy-home-return';
          home.href = '/legacy/right.htm';
          home.textContent = 'トップページに戻る';
          area.appendChild(home);
          page.body.appendChild(area);
        }
      }
    } catch {
      // Keep navigation usable even if an external page blocks iframe access.
    }
  });
})();
