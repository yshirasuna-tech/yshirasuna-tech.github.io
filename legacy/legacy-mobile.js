(function () {
  'use strict';

  try {
    if (window.top !== window && window.top.location.pathname === '/original') return;
  } catch {
    // Continue when the top page cannot be inspected.
  }

  var shortEdge = Math.min(window.screen.width || window.innerWidth, window.screen.height || window.innerHeight);
  var isPhone = /Android|iPhone|iPod|Mobile/i.test(navigator.userAgent);
  var useMobileLayout =
    window.innerWidth <= 900 ||
    shortEdge <= 600 ||
    isPhone ||
    (navigator.maxTouchPoints > 0 && window.innerWidth <= 1180);

  if (!useMobileLayout || document.documentElement.dataset.mobileGalleryReady) return;

  if (!document.querySelector('meta[name="viewport"]')) {
    var viewport = document.createElement('meta');
    viewport.name = 'viewport';
    viewport.content = 'width=device-width, initial-scale=1';
    document.head.appendChild(viewport);
  }

  if (!document.getElementById('legacy-modern-css')) {
    var stylesheet = document.createElement('link');
    stylesheet.id = 'legacy-modern-css';
    stylesheet.rel = 'stylesheet';
    stylesheet.href = '/legacy/legacy-modern.css';
    document.head.appendChild(stylesheet);
  }

  document.documentElement.classList.add('mobile-legacy');
  document.documentElement.dataset.mobileGalleryReady = 'true';

  Array.from(document.querySelectorAll('table')).forEach(function (table) {
    if (!table.isConnected) return;
    var directCells = Array.from(table.rows).reduce(function (cells, row) {
      return cells.concat(Array.from(row.cells));
    }, []);
    var nestedCards = directCells.map(function (cell) {
      var nestedTable = Array.from(cell.children).find(function (child) {
        return child.tagName === 'TABLE';
      });
      if (!nestedTable || nestedTable.querySelectorAll('img').length !== 1) return null;
      return { cell: cell, table: nestedTable, image: nestedTable.querySelector('img') };
    }).filter(Boolean);

    if (nestedCards.length < 2) return;

    var grid = document.createElement('div');
    grid.className = 'mobile-photo-grid';
    grid.setAttribute('aria-label', '写真一覧');

    nestedCards.forEach(function (entry) {
      var card = document.createElement('article');
      card.className = 'mobile-photo-card';
      var media = document.createElement('div');
      media.className = 'mobile-photo-media';
      var caption = document.createElement('div');
      caption.className = 'mobile-photo-caption';
      var linkedImage = entry.image.closest('a') || entry.image;
      media.appendChild(linkedImage);

      var captionRow = Array.from(entry.table.rows).find(function (row) {
        return !row.querySelector('img');
      });
      if (captionRow) {
        Array.from(captionRow.cells).forEach(function (cell) {
          while (cell.firstChild) caption.appendChild(cell.firstChild);
        });
      }

      card.appendChild(media);
      card.appendChild(caption);
      grid.appendChild(card);
    });

    table.parentNode.insertBefore(grid, table);
    table.remove();
  });

  Array.from(document.querySelectorAll('table')).reverse().forEach(function (table) {
    if (!table.isConnected) return;
    var rowPairs = [];
    var rows = Array.from(table.rows);

    for (var index = 0; index < rows.length - 1; index += 1) {
      var allPhotoCells = Array.from(rows[index].cells);
      var captionCells = Array.from(rows[index + 1].cells);
      var photoCells = allPhotoCells.filter(function (cell) { return cell.querySelector('img'); });
      var isPhotoRow = photoCells.length >= 2;
      var isCaptionRow = captionCells.length >= 1 && captionCells.every(function (cell) {
        return !cell.querySelector('img');
      });

      if (!isPhotoRow || !isCaptionRow) continue;

      var logicalColumn = 0;
      var photoColumns = allPhotoCells.map(function (cell) {
        var start = logicalColumn;
        logicalColumn += cell.colSpan || 1;
        return { cell: cell, start: start };
      });
      logicalColumn = 0;
      var captionColumns = captionCells.map(function (cell) {
        var start = logicalColumn;
        logicalColumn += cell.colSpan || 1;
        return { cell: cell, start: start, end: logicalColumn };
      });

      rowPairs.push({
        photoRow: rows[index],
        captionRow: rows[index + 1],
        entries: photoColumns
          .filter(function (entry) { return entry.cell.querySelector('img'); })
          .map(function (entry) {
            var matchingCaption = captionColumns.find(function (caption) {
              return entry.start >= caption.start && entry.start < caption.end;
            });
            return { photoCell: entry.cell, captionCell: matchingCaption && matchingCaption.cell };
          })
      });
      index += 1;
    }

    if (!rowPairs.length || !table.parentNode) return;

    var grid = document.createElement('div');
    grid.className = 'mobile-photo-grid';
    grid.setAttribute('aria-label', '写真一覧');

    rowPairs.forEach(function (pair) {
      pair.entries.forEach(function (entry) {
        var card = document.createElement('article');
        card.className = 'mobile-photo-card';
        var media = document.createElement('div');
        media.className = 'mobile-photo-media';
        var caption = document.createElement('div');
        caption.className = 'mobile-photo-caption';

        while (entry.photoCell.firstChild) media.appendChild(entry.photoCell.firstChild);
        if (entry.captionCell) {
          caption.innerHTML = entry.captionCell.innerHTML;
        }

        card.appendChild(media);
        card.appendChild(caption);
        grid.appendChild(card);
      });
      pair.photoRow.remove();
      pair.captionRow.remove();
    });

    table.parentNode.insertBefore(grid, table);
    if (!table.querySelector('img')) table.remove();
  });
})();
