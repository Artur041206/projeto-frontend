document.addEventListener('DOMContentLoaded', function () {
  const filterButtons = document.querySelectorAll('.filter-btn');
  const menuCols = document.querySelectorAll('.menu-col');
  const emptyState = document.getElementById('emptyState');

  filterButtons.forEach(function (btn) {
    btn.addEventListener('click', function () {
      const filter = btn.getAttribute('data-filter');

      filterButtons.forEach(function (b) {
        b.classList.remove('active');
      });
      btn.classList.add('active');

      let visibleCount = 0;
      menuCols.forEach(function (col) {
        const category = col.getAttribute('data-category');
        const matches = filter === 'todos' || category === filter;
        col.classList.toggle('d-none', !matches);
        if (matches) visibleCount++;
      });

      emptyState.classList.toggle('d-none', visibleCount !== 0);
    });
  });

  const nav = document.getElementById('mainNav');
  window.addEventListener('scroll', function () {
    if (window.scrollY > 40) {
      nav.style.background = 'rgba(23, 19, 15, 0.97)';
    } else {
      nav.style.background = 'rgba(23, 19, 15, 0.85)';
    }
  });
});
