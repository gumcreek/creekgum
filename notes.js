function buildNotesNodes(nodes) {
  const wrapper = document.createElement('div');

  nodes.forEach(node => {
    if (node.children && node.children.length) {
      const branch = document.createElement('div');
      branch.className = 'notes-branch';

      const toggle = document.createElement('button');
      toggle.className = 'notes-toggle';
      toggle.type = 'button';
      toggle.innerHTML = `<span class="notes-label">${node.label}</span>`;

      const children = document.createElement('div');
      children.className = 'notes-children';

      const inner = document.createElement('div');
      inner.className = 'notes-children-inner';
      inner.appendChild(buildNotesNodes(node.children));
      children.appendChild(inner);

      toggle.addEventListener('click', () => {
        toggleBranch(branch, children);
      });

      branch.appendChild(toggle);
      branch.appendChild(children);
      wrapper.appendChild(branch);
    } else {
      const leaf = document.createElement(node.url ? 'a' : 'div');
      leaf.className = 'notes-leaf';
      leaf.textContent = node.label;

      if (node.url) leaf.href = node.url;
      if (node.note) leaf.dataset.note = node.note;
      if (node.date) leaf.dataset.date = node.date;
      leaf.dataset.title = node.label;

      wrapper.appendChild(leaf);
    }
  });

  return wrapper;
}

function getOpenAncestorChildren(startChildren) {
  const ancestors = [];
  let parentBranch = startChildren.parentElement.closest('.notes-branch');

  while (parentBranch) {
    const parentChildren = parentBranch.querySelector(':scope > .notes-children');
    if (parentBranch.classList.contains('is-open') && parentChildren) {
      ancestors.push(parentChildren);
    }
    parentBranch = parentBranch.parentElement.closest('.notes-branch');
  }

  return ancestors;
}

function animatePanels(panels, endHeights, onComplete) {
  panels.forEach((panel, i) => {
    panel.style.height = `${panel.scrollHeight}px`;
  });

  requestAnimationFrame(() => {
    panels.forEach((panel, i) => {
      panel.style.height = `${endHeights[i]}px`;
    });
  });

  let remaining = panels.length;

  panels.forEach((panel) => {
    const handler = (e) => {
      if (e.propertyName !== 'height') return;
      panel.removeEventListener('transitionend', handler);
      remaining -= 1;

      if (remaining === 0 && onComplete) {
        onComplete();
      }
    };

    panel.addEventListener('transitionend', handler);
  });
}

function openBranch(branch, children) {
  const ancestors = getOpenAncestorChildren(children);
  const panels = [children, ...ancestors];

  branch.classList.add('is-open');

  children.style.height = '0px';
  children.style.opacity = '0';
  children.style.marginTop = '0';

  const endHeights = [
    children.scrollHeight,
    ...ancestors.map(panel => {
      panel.style.height = 'auto';
      return panel.scrollHeight;
    })
  ];

  // restore explicit starting heights before animating
  ancestors.forEach(panel => {
    panel.style.height = `${panel.scrollHeight}px`;
  });

  requestAnimationFrame(() => {
    children.style.opacity = '1';
    children.style.marginTop = '0.5rem';

    animatePanels(panels, endHeights, () => {
      children.style.height = 'auto';
      ancestors.forEach(panel => {
        panel.style.height = 'auto';
      });
    });
  });
}

function closeBranch(branch, children) {
  const ancestors = getOpenAncestorChildren(children);
  const panels = [children, ...ancestors];

  const endHeights = [
    0,
    ...ancestors.map(panel => {
      panel.style.height = 'auto';
      return panel.scrollHeight - children.scrollHeight;
    })
  ];

  panels.forEach(panel => {
    panel.style.height = `${panel.scrollHeight}px`;
  });

  requestAnimationFrame(() => {
    branch.classList.remove('is-open');
    children.style.opacity = '0';
    children.style.marginTop = '0';

    animatePanels(panels, endHeights, () => {
      ancestors.forEach(panel => {
        panel.style.height = 'auto';
      });
    });
  });
}

function toggleBranch(branch, children) {
  if (branch.classList.contains('is-open')) {
    closeBranch(branch, children);
  } else {
    openBranch(branch, children);
  }
}

function initNotePreview(container) {
  const preview = document.getElementById('note-preview');
  const previewDate = document.getElementById('note-preview-date');
  const previewTitle = document.getElementById('note-preview-title');
  const previewBody = document.getElementById('note-preview-body');

  if (!preview) return;

  let hideTimeout = null;
  let locked = false;

  function showPreview(target) {
    if (!target.dataset.note) return;

    clearTimeout(hideTimeout);

    previewDate.textContent = target.dataset.date || '';
    previewTitle.textContent = target.dataset.title || '';
    previewBody.textContent = target.dataset.note || '';

    preview.classList.add('visible');
  }

  function scheduleHide() {
    clearTimeout(hideTimeout);
    hideTimeout = setTimeout(() => {
      if (!locked) {
        preview.classList.remove('visible');
      }
    }, 180);
  }

  container.addEventListener('mouseover', (e) => {
    const leaf = e.target.closest('.notes-leaf');
    if (!leaf || !container.contains(leaf)) return;
    showPreview(leaf);
  });

  container.addEventListener('mouseout', (e) => {
    const leaf = e.target.closest('.notes-leaf');
    if (!leaf) return;

    const related = e.relatedTarget;
    if (preview.contains(related)) return;

    scheduleHide();
  });

  preview.addEventListener('mouseenter', () => {
    locked = true;
    clearTimeout(hideTimeout);
  });

  preview.addEventListener('mouseleave', () => {
    locked = false;
    scheduleHide();
  });
}

async function loadNotesTree() {
  const container = document.getElementById('notes-tree');
  if (!container) return;

  try {
    const response = await fetch('notes-tree.json');
    if (!response.ok) throw new Error('Failed to load notes-tree.json');

    const data = await response.json();
    container.appendChild(buildNotesNodes(data));
    initNotePreview(container);
  } catch (error) {
    console.error(error);
    container.innerHTML = '<p class="essay-meta">Could not load notes.</p>';
  }
}

window.addEventListener('DOMContentLoaded', loadNotesTree);
