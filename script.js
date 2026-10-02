async function fetchPosts() {
  const response = await fetch('posts.json');
  if (!response.ok) {
    throw new Error(`Failed to load posts.json (${response.status})`);
  }
  return await response.json();
}

function createListItem(post) {
  const item = document.createElement('a');
  item.className = 'thought-item';
  item.href = post.url || '#';

  item.innerHTML = `
    <div class="thought-row">
      <span class="thought-title">${post.title || 'Untitled'}</span>
      <span class="thought-dots"></span>
      <span class="thought-meta">${post.date || ''}</span>
    </div>
  `;

  return item;
}

function renderPosts(posts, containerId, options = {}) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const { type = null, limit = null } = options;

  let filtered = posts;
  if (type) filtered = posts.filter(post => post.type === type);
  if (limit) filtered = filtered.slice(0, limit);

  if (filtered.length === 0) {
    container.innerHTML = '<p class="thought-meta">Nothing here yet.</p>';
    return;
  }

  filtered.forEach(post => {
    container.appendChild(createListItem(post));
  });
}

function buildTreeNodes(nodes) {
  const wrapper = document.createElement('div');

  nodes.forEach(node => {
    if (node.children && node.children.length) {
      const nodeEl = document.createElement('div');
      nodeEl.className = 'tree-node';

      const toggle = document.createElement('button');
      toggle.className = 'tree-toggle';
      toggle.type = 'button';
      toggle.innerHTML = `<span class="tree-label">${node.label}</span>`;

      const group = document.createElement('div');
      group.className = 'tree-group';
      group.appendChild(buildTreeNodes(node.children));

      toggle.addEventListener('click', () => {
        nodeEl.classList.toggle('collapsed');
      });

      nodeEl.appendChild(toggle);
      nodeEl.appendChild(group);
      wrapper.appendChild(nodeEl);
    } else {
      const leaf = document.createElement(node.url ? 'a' : 'div');
      leaf.className = 'tree-leaf';
      leaf.textContent = node.label;
      if (node.url) leaf.href = node.url;
      wrapper.appendChild(leaf);
    }
  });

  return wrapper;
}

async function loadThoughtTree() {
  const container = document.getElementById('thought-tree');
  if (!container) return;

  try {
    const response = await fetch('thoughts-tree.json');
    if (!response.ok) throw new Error('Failed to load thoughts-tree.json');

    const data = await response.json();
    container.appendChild(buildTreeNodes(data));
  } catch (error) {
    console.error(error);
    container.innerHTML = '<p class="thought-meta">Could not load brief thoughts.</p>';
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

async function initPosts() {
  try {
    const posts = await fetchPosts();

    renderPosts(posts, 'posts', { type: 'writing', limit: 5 });
    renderPosts(posts, 'all-posts', { type: 'writing' });

    renderPosts(posts, 'all-photos', { type: 'photo' });
  } catch (error) {
    console.error(error);

    ['posts', 'all-posts', 'all-photos'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.innerHTML = '<p class="thought-meta">Could not load posts.</p>';
    });
  }
}

window.addEventListener('DOMContentLoaded', () => {
  initNav();
  initPosts();
  loadThoughtTree();
});
