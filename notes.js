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
      if (node.note) leaf.dataset.note = node.note;
      if (node.date) leaf.dataset.date = node.date;
      leaf.dataset.title = node.label;

      wrapper.appendChild(leaf);
    }
  });

  return wrapper;
}

function initNotesAnimations(container) {
  const branches = container.querySelectorAll('.notes-branch');

  branches.forEach((branch) => {
    const summary = branch.querySelector(':scope > summary');
    const content = branch.querySelector(':scope > .notes-children');
    if (!summary || !content) return;

    let isClosing = false;
    let isOpening = false;

    summary.addEventListener('click', (event) => {
      event.preventDefault();

      branch.style.overflow = 'hidden';

      if (isClosing || !branch.open) {
        openBranch(branch, content);
      } else if (isOpening || branch.open) {
        closeBranch(branch, content);
      }
    });

    content.addEventListener('transitionend', (e) => {
      if (e.propertyName !== 'height') return;
    });
  });

  function closeBranch(branch, content) {
    const startHeight = `${branch.offsetHeight}px`;
    branch.style.height = startHeight;

    requestAnimationFrame(() => {
      content.style.opacity = '0';
      content.style.transform = 'translateY(-4px)';
      branch.style.height = `${branch.querySelector(':scope > summary').offsetHeight}px`;
    });

    const onEnd = (e) => {
      if (e.propertyName !== 'height') return;
      branch.open = false;
      branch.style.height = '';
      branch.removeEventListener('transitionend', onEnd);
    };

    branch.addEventListener('transitionend', onEnd);
  }

  function openBranch(branch, content) {
    branch.open = true;

    const startHeight = `${branch.querySelector(':scope > summary').offsetHeight}px`;
    const endHeight = `${branch.offsetHeight}px`;

    branch.style.height = startHeight;
    content.style.opacity = '0';
    content.style.transform = 'translateY(-4px)';

    requestAnimationFrame(() => {
      branch.style.height = endHeight;
      content.style.opacity = '1';
      content.style.transform = 'translateY(0)';
    });

    const onEnd = (e) => {
      if (e.propertyName !== 'height') return;
      branch.style.height = '';
      branch.removeEventListener('transitionend', onEnd);
    };

    branch.addEventListener('transitionend', onEnd);
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
    initNotesAnimations(container);
    initNotePreview(container);
  } catch (error) {
    console.error(error);
    container.innerHTML = '<p class="essay-meta">Could not load notes.</p>';
  }
}

window.addEventListener('DOMContentLoaded', loadNotesTree);
