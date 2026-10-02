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

function setPanelHeight(panel, height) {
  panel.style.height = `${height}px`;
}

function resetPanelHeight(panel) {
  panel.style.height = 'auto';
}

function animateBranchToggle(branch) {
  const panel = getBranchPanel(branch);
  if (!panel) return;

  const ancestors = getOpenAncestorBranches(branch);
  const isOpening = !branch.classList.contains('is-open');

  const startHeight = panel.getBoundingClientRect().height;

  // Freeze open ancestor heights before changing anything
  ancestors.forEach(ancestor => {
    const ancestorPanel = getBranchPanel(ancestor);
    if (ancestorPanel) {
      setPanelHeight(ancestorPanel, ancestorPanel.scrollHeight);
    }
  });

  // Freeze the current panel height too
  setPanelHeight(panel, startHeight);

  // Force layout
  panel.offsetHeight;

  if (isOpening) {
    branch.classList.add('is-open');
    const targetHeight = panel.scrollHeight;

    let rafId = null;
    const tickAncestors = () => {
      ancestors.forEach(ancestor => {
        const ancestorPanel = getBranchPanel(ancestor);
        if (ancestorPanel) {
          setPanelHeight(ancestorPanel, ancestorPanel.scrollHeight);
        }
      });
      rafId = requestAnimationFrame(tickAncestors);
    };

    rafId = requestAnimationFrame(tickAncestors);

    requestAnimationFrame(() => {
      setPanelHeight(panel, targetHeight);
    });

    const onEnd = (e) => {
      if (e.propertyName !== 'height') return;
      panel.removeEventListener('transitionend', onEnd);
      if (rafId) cancelAnimationFrame(rafId);

      resetPanelHeight(panel);
      ancestors.forEach(ancestor => {
        const ancestorPanel = getBranchPanel(ancestor);
        if (ancestorPanel && ancestor.classList.contains('is-open')) {
          resetPanelHeight(ancestorPanel);
        }
      });
    };

    panel.addEventListener('transitionend', onEnd);
  } else {
    const openHeight = panel.scrollHeight;
    setPanelHeight(panel, openHeight);

    // Force layout before collapsing
    panel.offsetHeight;

    let rafId = null;
    const tickAncestors = () => {
      ancestors.forEach(ancestor => {
        const ancestorPanel = getBranchPanel(ancestor);
        if (ancestorPanel) {
          setPanelHeight(ancestorPanel, ancestorPanel.scrollHeight);
        }
      });
      rafId = requestAnimationFrame(tickAncestors);
    };

    rafId = requestAnimationFrame(tickAncestors);

    branch.classList.remove('is-open');

    requestAnimationFrame(() => {
      setPanelHeight(panel, 0);
    });

    const onEnd = (e) => {
      if (e.propertyName !== 'height') return;
      panel.removeEventListener('transitionend', onEnd);
      if (rafId) cancelAnimationFrame(rafId);

      panel.style.height = '0px';
      ancestors.forEach(ancestor => {
        const ancestorPanel = getBranchPanel(ancestor);
        if (ancestorPanel && ancestor.classList.contains('is-open')) {
          resetPanelHeight(ancestorPanel);
        }
      });
    };

    panel.addEventListener('transitionend', onEnd);
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
