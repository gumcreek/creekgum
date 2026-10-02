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

      const panel = document.createElement('div');
      panel.className = 'notes-panel';

      const inner = document.createElement('div');
      inner.className = 'notes-panel-inner';
      inner.appendChild(buildNotesNodes(node.children));
      panel.appendChild(inner);

      toggle.addEventListener('click', () => {
        animateBranchToggle(branch);
      });

      branch.appendChild(toggle);
      branch.appendChild(panel);
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

function getBranchPanel(branch) {
  return branch.querySelector(':scope > .notes-panel');
}

function getOpenAncestorBranches(branch) {
  const ancestors = [];
  let current = branch.parentElement ? branch.parentElement.closest('.notes-branch') : null;

  while (current) {
    if (current.classList.contains('is-open')) {
      ancestors.push(current);
    }
    current = current.parentElement ? current.parentElement.closest('.notes-branch') : null;
  }

  return ancestors;
}

function freezePanelHeight(panel) {
  panel.style.height = `${panel.scrollHeight}px`;
}

function resetPanelHeight(panel) {
  panel.style.height = 'auto';
}

function animateBranchToggle(branch) {
  const panel = getBranchPanel(branch);
  if (!panel) return;

  const ancestors = getOpenAncestorBranches(branch);
  const affectedBranches = [branch, ...ancestors];
  const affectedPanels = affectedBranches.map(getBranchPanel);
  const startHeights = affectedPanels.map(p => p.getBoundingClientRect().height);
  const opening = !branch.classList.contains('is-open');

  // Freeze current rendered heights before state change
  affectedPanels.forEach((p, i) => {
    p.style.height = `${startHeights[i]}px`;
  });

  // Force layout
  panel.offsetHeight;

  // Toggle state
  if (opening) {
    branch.classList.add('is-open');
  } else {
    branch.classList.remove('is-open');
  }

  // Measure destination heights after state change
  const endHeights = affectedPanels.map(p => p.scrollHeight);

  requestAnimationFrame(() => {
    affectedPanels.forEach((p, i) => {
      p.style.height = `${endHeights[i]}px`;
    });
  });

  let remaining = affectedPanels.length;
  let finished = false;

  const finish = () => {
    if (finished) return;
    finished = true;

    affectedBranches.forEach((b) => {
      const p = getBranchPanel(b);
      if (!p) return;

      if (b.classList.contains('is-open')) {
        resetPanelHeight(p);
      } else {
        p.style.height = '0px';
      }
    });
  };

  affectedPanels.forEach((p) => {
    const onEnd = (e) => {
      if (e.propertyName !== 'height') return;
      p.removeEventListener('transitionend', onEnd);
      remaining -= 1;
      if (remaining === 0) finish();
    };

    p.addEventListener('transitionend', onEnd);
  });

  // Fallback in case a transition event is missed
  setTimeout(finish, 500);
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
    if (related && preview.contains(related)) return;
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
