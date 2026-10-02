function buildNotesNodes(nodes) {
  const wrapper = document.createElement('div');

  nodes.forEach(node => {
    if (node.children && node.children.length) {
      const nodeEl = document.createElement('div');
      nodeEl.className = 'notes-node';

      const button = document.createElement('button');
      button.className = 'notes-toggle';
      button.type = 'button';
      button.innerHTML = `<span class="notes-label">${node.label}</span>`;

      const children = document.createElement('div');
      children.className = 'notes-children';
      children.appendChild(buildNotesNodes(node.children));

      // start closed
      children.style.height = '0px';
      children.style.opacity = '0';
      children.style.marginTop = '0';

      button.addEventListener('click', () => {
        const isOpen = nodeEl.classList.contains('is-open');

        if (isOpen) {
          const startHeight = children.scrollHeight;
          children.style.height = `${startHeight}px`;

          requestAnimationFrame(() => {
            nodeEl.classList.remove('is-open');
            children.style.height = '0px';
            children.style.opacity = '0';
            children.style.marginTop = '0';
          });
        } else {
          nodeEl.classList.add('is-open');
          children.style.height = '0px';
          children.style.opacity = '0';
          children.style.marginTop = '0';

          requestAnimationFrame(() => {
            const endHeight = children.scrollHeight;
            children.style.height = `${endHeight}px`;
            children.style.opacity = '1';
            children.style.marginTop = '0.5rem';
          });
        }
      });

      children.addEventListener('transitionend', (e) => {
        if (e.propertyName !== 'height') return;

        if (nodeEl.classList.contains('is-open')) {
          children.style.height = 'auto';
        }
      });

      nodeEl.appendChild(button);
      nodeEl.appendChild(children);
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

window.addEventListener('DOMContentLoaded', loadNotesTree);
