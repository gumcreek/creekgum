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

function openNotesGroup(nodeEl, group) {
  nodeEl.classList.add('is-open');

  group.style.display = 'block';
  const endHeight = group.scrollHeight;

  group.style.height = '0px';
  group.style.opacity = '0';
  group.style.marginTop = '0';

  requestAnimationFrame(() => {
    group.style.height = `${endHeight}px`;
    group.style.opacity = '1';
    group.style.marginTop = '0.5rem';
  });

  const onEnd = (e) => {
    if (e.propertyName !== 'height') return;
    group.style.height = 'auto';
    group.removeEventListener('transitionend', onEnd);
  };

  group.addEventListener('transitionend', onEnd);
}

function closeNotesGroup(nodeEl, group) {
  const startHeight = group.scrollHeight;

  group.style.height = `${startHeight}px`;
  group.style.opacity = '1';
  group.style.marginTop = '0.5rem';

  requestAnimationFrame(() => {
    group.style.height = '0px';
    group.style.opacity = '0';
    group.style.marginTop = '0';
  });

  const onEnd = (e) => {
    if (e.propertyName !== 'height') return;
    nodeEl.classList.remove('is-open');
    group.removeEventListener('transitionend', onEnd);
  };

  group.addEventListener('transitionend', onEnd);
}

function toggleNotesGroup(nodeEl, group) {
  const isOpen = nodeEl.classList.contains('is-open');

  if (isOpen) {
    closeNotesGroup(nodeEl, group);
  } else {
    openNotesGroup(nodeEl, group);
  }
}

function buildNotesNodes(nodes) {
  const wrapper = document.createElement('div');

  nodes.forEach(node => {
    if (node.children && node.children.length) {
      const nodeEl = document.createElement('div');
      nodeEl.className = 'notes-node is-open';

      const toggle = document.createElement('button');
      toggle.className = 'notes-toggle';
      toggle.type = 'button';
      toggle.innerHTML = `<span class="notes-label">${node.label}</span>`;

      const group = document.createElement('div');
      group.className = 'notes-group';
      group.appendChild(buildNotesNodes(node.children));

      toggle.addEventListener('click', () => {
        toggleNotesGroup(nodeEl, group);
      });

      nodeEl.appendChild(toggle);
      nodeEl.appendChild(group);
      wrapper.appendChild(nodeEl);
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
