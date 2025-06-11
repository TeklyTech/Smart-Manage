document.addEventListener('DOMContentLoaded', () => {
    // --- Global UI Elements & Logic ---
    const body = document.body;
    const sidebar = document.querySelector('.sidebar');
    const sidebarToggle = document.querySelector('.sidebar-toggle');
    const mainContent = document.querySelector('.main-content');
    const mobileOverlay = document.querySelector('.mobile-overlay');
    const currentPath = window.location.pathname.split("/").pop();
    
    const closeMobileSidebar = () => {
        body.classList.remove('sidebar-open');
        sidebar.classList.remove('collapsed');
        if (sidebarToggle) sidebarToggle.innerHTML = '☰';
    };

    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', () => {
            // Screen is tablet or smaller
            if (window.innerWidth <= 992) {
                body.classList.toggle('sidebar-open');
                sidebar.classList.toggle('collapsed'); // 'collapsed' now means "open as an overlay"
                sidebarToggle.innerHTML = body.classList.contains('sidebar-open') ? '×' : '☰';
            } else {
                // Screen is desktop
                sidebar.classList.toggle('collapsed');
                mainContent.classList.toggle('full-width');
                sidebarToggle.innerHTML = sidebar.classList.contains('collapsed') ? '→' : '←';
            }
        });
    }

    if (mobileOverlay) {
        mobileOverlay.addEventListener('click', closeMobileSidebar);
    }
    
    document.querySelectorAll('.sidebar-nav a').forEach(link => {
        if (link.getAttribute('href') === currentPath) { link.classList.add('active'); }
        // Close overlay menu when a link is clicked
        link.addEventListener('click', () => { if (window.innerWidth <= 992) { closeMobileSidebar(); } });
    });

    function initializeCustomSelects() {
        document.querySelectorAll('.custom-select-wrapper').forEach(wrapper => {
            if (wrapper.querySelector('.select-selected')) return;
            const selectElement = wrapper.querySelector('select');
            const selectSelected = document.createElement('div');
            selectSelected.classList.add('select-selected');
            selectSelected.innerHTML = selectElement.options[selectElement.selectedIndex].innerHTML;
            wrapper.appendChild(selectSelected);

            const selectItems = document.createElement('div');
            selectItems.classList.add('select-items', 'select-hide');
            
            Array.from(selectElement.options).forEach((option) => {
                const item = document.createElement('div');
                item.innerHTML = option.innerHTML;
                item.addEventListener('click', function() {
                    selectElement.value = option.value;
                    selectSelected.innerHTML = this.innerHTML;
                    selectElement.dispatchEvent(new Event('change', { 'bubbles': true }));
                    closeAllSelects();
                });
                selectItems.appendChild(item);
            });
            wrapper.appendChild(selectItems);

            selectSelected.addEventListener('click', function(e) {
                e.stopPropagation();
                const isAlreadyOpen = this.classList.contains('select-arrow-active');
                closeAllSelects();
                if (!isAlreadyOpen) {
                    this.nextSibling.classList.toggle('select-show');
                    this.classList.toggle('select-arrow-active');
                }
            });
        });

        function closeAllSelects() {
            document.querySelectorAll('.select-items').forEach(items => items.classList.remove('select-show'));
            document.querySelectorAll('.select-selected').forEach(selected => selected.classList.remove('select-arrow-active'));
        }
        document.addEventListener('click', closeAllSelects);
    }
    initializeCustomSelects();

    function handleResize(){
        if(window.innerWidth > 992) {
            closeMobileSidebar();
        }
        if(sidebarToggle){
            if(window.innerWidth <= 992) {
                sidebarToggle.innerHTML = '☰';
            } else {
                sidebarToggle.innerHTML = sidebar.classList.contains('collapsed') ? '→' : '←';
            }
        }
    }
    window.addEventListener('resize', handleResize);
    handleResize();

    const getProjects = () => JSON.parse(localStorage.getItem('smartMaanageProjects')) || [];
    const saveProjects = projects => localStorage.setItem('smartMaanageProjects', JSON.stringify(projects));

    // Page-specific logic remains the same
    if (body.id === 'page-projects') {
        const projectGrid = document.getElementById('project-grid');
        const deleteModal = document.getElementById('delete-modal');
        const confirmDeleteBtn = document.getElementById('confirm-delete');
        const cancelDeleteBtn = document.getElementById('cancel-delete');
        let projectIdToDelete = null;

        const renderProjects = () => {
            const projects = getProjects();
            projectGrid.innerHTML = '';
            if (projects.length === 0) {
                projectGrid.innerHTML = `<p class="card" style="grid-column: 1 / -1; text-align: center;">No projects found. <a href="create.html">Create one now!</a></p>`;
                return;
            }
            projects.sort((a, b) => b.id - a.id).forEach(project => {
                const tagsHTML = (project.tags || []).map(tag => `<span class="tag">${tag}</span>`).join('');
                let customStyles = '';
                if (project.styles) {
                    const s = project.styles;
                    customStyles += `color: ${s.textColor}; font-family: ${s.fontFamily};`;
                    customStyles += s.useGradient ? `background: linear-gradient(45deg, ${s.gradientStart}, ${s.gradientEnd});` : `background-color: ${s.bgColor};`;
                }
                const projectCard = `
                    <div class="card project-card" style="${customStyles}">
                        <div>
                            <h3 style="${project.styles ? `color: ${project.styles.textColor}` : ''}">${project.title}</h3>
                            <div class="project-meta"><span>${project.category || 'N/A'}</span> | <span>${new Date(project.createdDate).toLocaleDateString()}</span></div>
                            <p class="project-content">${project.content}</p>
                            <div class="project-tags">${tagsHTML}</div>
                        </div>
                        <div class="project-actions">
                            <a href="edit.html?id=${project.id}" class="btn btn-secondary">Edit</a>
                            <button class="btn btn-danger delete-btn" data-id="${project.id}">Delete</button>
                        </div>
                    </div>`;
                projectGrid.insertAdjacentHTML('beforeend', projectCard);
            });
        };
        projectGrid.addEventListener('click', e => { if (e.target.classList.contains('delete-btn')) { projectIdToDelete = e.target.dataset.id; deleteModal.classList.add('active'); } });
        const closeModal = () => deleteModal.classList.remove('active');
        confirmDeleteBtn.addEventListener('click', () => { let p = getProjects().filter(p => p.id != projectIdToDelete); saveProjects(p); renderProjects(); closeModal(); });
        cancelDeleteBtn.addEventListener('click', closeModal);
        deleteModal.querySelector('.modal-close').addEventListener('click', closeModal);
        renderProjects();
    } else if (body.id === 'page-create') {
        document.getElementById('project-form').addEventListener('submit', e => {
            e.preventDefault();
            const projects = getProjects();
            projects.push({ id: Date.now(), title: document.getElementById('project-title').value, category: document.getElementById('project-category').value, tags: document.getElementById('project-tags').value.split(',').map(t => t.trim()).filter(Boolean), content: document.getElementById('project-content').value, createdDate: new Date().toISOString(), styles: null });
            saveProjects(projects);
            window.location.href = 'projects.html';
        });
    } else if (body.id === 'page-edit') {
        const form = document.getElementById('edit-project-form'), previewCard = document.getElementById('live-preview-card'), titleInput = document.getElementById('project-title'), contentInput = document.getElementById('project-content'), downloadBtn = document.getElementById('download-btn'), propBgColor = document.getElementById('prop-bg-color'), propTextColor = document.getElementById('prop-text-color'), propFontFamily = document.getElementById('prop-font-family'), propEnableGradient = document.getElementById('prop-enable-gradient'), propGradientStart = document.getElementById('prop-gradient-start'), propGradientEnd = document.getElementById('prop-gradient-end');
        const projectId = new URLSearchParams(window.location.search).get('id'), projects = getProjects(), projectToEdit = projects.find(p => p.id == projectId);

        if (!projectToEdit) { alert('Project not found!'); return window.location.href = 'projects.html'; }

        function loadProjectData() {
            titleInput.value = projectToEdit.title; contentInput.value = projectToEdit.content;
            const s = projectToEdit.styles || {};
            propBgColor.value = s.bgColor || '#1d1d2b'; propTextColor.value = s.textColor || '#e4e4e4'; propFontFamily.value = s.fontFamily || "'Poppins', sans-serif"; propEnableGradient.checked = s.useGradient !== false; propGradientStart.value = s.gradientStart || '#8e44ad'; propGradientEnd.value = s.gradientEnd || '#00c6ff';
            const fontSelectWrapper = propFontFamily.closest('.custom-select-wrapper');
            if (fontSelectWrapper) { fontSelectWrapper.querySelector('.select-selected').innerHTML = propFontFamily.options[propFontFamily.selectedIndex].innerHTML; }
            updatePreview();
        }

        function updatePreview() {
            previewCard.style.background = propEnableGradient.checked ? `linear-gradient(45deg, ${propGradientStart.value}, ${propGradientEnd.value})` : propBgColor.value;
            previewCard.style.fontFamily = propFontFamily.value; previewCard.style.color = propTextColor.value;
            titleInput.style.color = propTextColor.value; contentInput.style.color = propTextColor.value;
        }

        [propBgColor, propTextColor, propFontFamily, propEnableGradient, propGradientStart, propGradientEnd].forEach(el => el.addEventListener(el.type === 'checkbox' ? 'change' : 'input', updatePreview));

        form.addEventListener('submit', e => {
            e.preventDefault();
            const projectIndex = projects.findIndex(p => p.id == projectId);
            projects[projectIndex] = { ...projectToEdit, title: titleInput.value, content: contentInput.value, styles: { bgColor: propBgColor.value, textColor: propTextColor.value, fontFamily: propFontFamily.value, useGradient: propEnableGradient.checked, gradientStart: propGradientStart.value, gradientEnd: propGradientEnd.value } };
            saveProjects(projects);
            alert('Project updated successfully!');
            window.location.href = 'projects.html';
        });

        downloadBtn.addEventListener('click', () => {
            const title = titleInput.value, content = contentInput.value, styles = { fontFamily: propFontFamily.value, textColor: propTextColor.value, background: propEnableGradient.checked ? `linear-gradient(45deg, ${propGradientStart.value}, ${propGradientEnd.value})` : propBgColor.value };
            const html = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>${title}</title><style>@import url('https://fonts.googleapis.com/css2?family=Poppins&family=Georgia&family=Courier+New&family=Arial&display=swap');body{font-family:${styles.fontFamily};background:${styles.background};color:${styles.textColor};margin:0;padding:clamp(1rem,5vw,3rem);min-height:100vh;box-sizing:border-box;line-height:1.7;}.container{max-width:800px;margin:0 auto;background:rgba(0,0,0,0.2);padding:clamp(1rem,5vw,3rem);border-radius:16px;backdrop-filter:blur(5px);}h1{margin-top:0;border-bottom:1px solid ${styles.textColor};padding-bottom:1rem;}pre{white-space:pre-wrap;word-wrap:break-word;font-family:inherit;}</style></head><body><div class="container"><h1>${title}</h1><pre>${content}</pre></div></body></html>`;
            const blob = new Blob([html], { type: 'text/html' }), url = URL.createObjectURL(blob), a = document.createElement('a');
            a.href = url; a.download = `${title.replace(/[^a-z0-9_.-]/gi, '_') || 'project'}.html`;
            a.click(); URL.revokeObjectURL(url);
        });

        loadProjectData();
    }
});