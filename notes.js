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

function getAncestorChildren(startChildren) {
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

function openBranch(branch, children) {
  const ancestors = getAncestorChildren(children);

  ancestors.forEach(ancestor => {
    ancestor.style.height = `${ancestor.scrollHeight}px`;
  });

  branch.classList.add('is-open');

  children.style.height = '0px';
  children.style.opacity = '0';
  children.style.marginTop = '0';

  requestAnimationFrame(() => {
    const childTargetHeight = children.scrollHeight;
    children.style.height = `${childTargetHeight}px`;
    children.style.opacity = '1';
    children.style.marginTop = '0.5rem';

    ancestors.forEach(ancestor => {
      ancestor.style.height = 'auto';
      const targetHeight = ancestor.scrollHeight;
      ancestor.style.height = `${targetHeight}px`;
    });
  });

  const onChildEnd = (e) => {
    if (e.propertyName !== 'height') return;
    children.style.height = 'auto';
    children.removeEventListener('transitionend', onChildEnd);
  };

  children.addEventListener('transitionend', onChildEnd);

  ancestors.forEach(ancestor => {
    const onAncestorEnd = (e) => {
      if (e.propertyName !== 'height') return;
      ancestor.style.height = 'auto';
      ancestor.removeEventListener('transitionend', onAncestorEnd);
    };

    ancestor.addEventListener('transitionend', onAncestorEnd);
  });
}

function closeBranch(branch, children) {
  const ancestors = getAncestorChildren(children);

  children.style.height = `${children.scrollHeight}px`;
  ancestors.forEach(ancestor => {
    ancestor.style.height = `${ancestor.scrollHeight}px`;
  });

  requestAnimationFrame(() => {
    branch.classList.remove('is-open');
    children.style.height = '0px';
    children.style.opacity = '0';
    children.style.marginTop = '0';

    ancestors.forEach(ancestor => {
      ancestor.style.height = 'auto';
      const targetHeight = ancestor.scrollHeight;
      ancestor.style.height = `${targetHeight}px`;
    });
  });

  const onChildEnd = (e) => {
    if (e.propertyName !== 'height') return;
    children.removeEventListener('transitionend', onChildEnd);
  };

  children.addEventListener('transitionend', onChildEnd);

  ancestors.forEach(ancestor => {
    const onAncestorEnd = (e) => {
      if (e.propertyName !== 'height') return;
      ancestor.style.height = 'auto';
      ancestor.removeEventListener('transitionend', onAncestorEnd);
    };

    ancestor.addEventListener('transitionend', onAncestorEnd);
  });
}

function toggleBranch(branch, children) {
  const isOpen = branch.classList.contains('is-open');

  if (isOpen) {
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
