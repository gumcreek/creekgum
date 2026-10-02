async function fetchEssays() {
  const response = await fetch('essays.json');
  if (!response.ok) {
    throw new Error(`Failed to load essays.json (${response.status})`);
  }
  return await response.json();
}

function createEssayItem(essay) {
  const item = document.createElement('a');
  item.className = 'essay-item';
  item.href = essay.url || '#';

  item.innerHTML = `
    <div class="essay-row">
      <span class="essay-title">${essay.title || 'Untitled'}</span>
      <span class="essay-dots"></span>
      <span class="essay-meta">${essay.date || ''}</span>
    </div>
  `;

  return item;
}

function renderEssays(essays, containerId, limit = null) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const visibleEssays = limit ? essays.slice(0, limit) : essays;

  if (visibleEssays.length === 0) {
    container.innerHTML = '<p class="essay-meta">Nothing here yet.</p>';
    return;
  }

  visibleEssays.forEach(essay => {
    container.appendChild(createEssayItem(essay));
  });
}

function animateNotesBranch(details) {
  const summary = details.querySelector('summary');
  const content = details.querySelector('.notes-children');
  if (!summary || !content) return;

  let isClosing = false;
  let isExpanding = false;

  function shrink() {
    isClosing = true;

    const startHeight = `${details.offsetHeight}px`;
    const endHeight = `${summary.offsetHeight}px`;

    details.style.height = startHeight;

    requestAnimationFrame(() => {
      details.style.height = endHeight;
      content.style.opacity = '0';
      content.style.transform = 'translateY(-4px)';
    });
  }

  function expand() {
    isExpanding = true;

    const startHeight = `${details.offsetHeight}px`;
    details.style.height = startHeight;
    details.open = true;

    requestAnimationFrame(() => {
      const endHeight = `${summary.offsetHeight + content.offsetHeight}px`;
      details.style.height = endHeight;
      content.style.opacity = '1';
      content.style.transform = 'translateY(0)';
    });
  }

  function onAnimationEnd(e) {
    if (e.propertyName !== 'height') return;

    details.style.height = '';
    isClosing = false;
    isExpanding = false;

    if (!details.open) {
      content.style.opacity = '0';
      content.style.transform = 'translateY(-4px)';
    }

    details.removeEventListener('transitionend', onAnimationEnd);
  }

  summary.addEventListener('click', (event) => {
    event.preventDefault();

    if (isClosing || !details.open) {
      expand();
    } else if (isExpanding || details.open) {
      details.open = false;
      shrink();
    }

    details.addEventListener('transitionend', onAnimationEnd);
  });
}

function buildNotesNodes(nodes) {
  const wrapper = document.createElement('div');

  nodes.forEach(node => {
    if (node.children && node.children.length) {
      const branch = document.createElement('details');
      branch.className = 'notes-branch';

      const summary = document.createElement('summary');
      summary.textContent = node.label;

      const children = document.createElement('div');
      children.className = 'notes-children';
      children.appendChild(buildNotesNodes(node.children));

      branch.appendChild(summary);
      branch.appendChild(children);
      wrapper.appendChild(branch);
    } else {
      const leaf = document.createElement(node.url ? 'a' : 'div');
      leaf.className = 'notes-leaf';
      leaf.textContent = node.label;
      if (node.url) leaf.href = node.url;
      wrapper.appendChild(leaf);
    }
  });

  return wrapper;
}

async function loadNotesTree() {
  const container = document.getElementById('notes-tree');
  if (!container) return;

  try {
    const response = await fetch('notes-tree.json');
    if (!response.ok) throw new Error('Failed to load notes-tree.json');

    const data = await response.json();
    container.appendChild(buildNotesNodes(data));

    container.querySelectorAll('.notes-branch').forEach(animateNotesBranch);
  } catch (error) {
    console.error(error);
    container.innerHTML = '<p class="essay-meta">Could not load notes.</p>';
  }
}

function initNav() {
  const current = document.body.dataset.page;
  const links = document.querySelectorAll('[data-nav]');

  links.forEach(link => {
    if (link.dataset.nav === current) {
      link.classList.add('active');
    }
  });
}

async function initEssays() {
  try {
    const essays = await fetchEssays();
    renderEssays(essays, 'recent-essays', 5);
    renderEssays(essays, 'all-essays');
  } catch (error) {
    console.error(error);

    ['recent-essays', 'all-essays'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.innerHTML = '<p class="essay-meta">Could not load essays.</p>';
    });
  }
}

window.addEventListener('DOMContentLoaded', () => {
  initNav();
  initEssays();
  loadNotesTree();
});
