document.addEventListener('DOMContentLoaded', () => {
    // Select all navigation links within the main-nav, including those that only trigger dropdowns
    const navLinks = document.querySelectorAll('.main-nav a');
    const pageContentDiv = document.getElementById('page-content');
    const homeLink = document.getElementById('home-link');

    // Mobile menu elements
    const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
    const mobileMenuClose = document.getElementById('mobile-menu-close');
    const mainNavMenu = document.getElementById('main-nav-menu');
    const body = document.body;

    /**
     * Sets up a carousel with auto-sliding and navigation controls.
     * @param {string} containerSelector - CSS selector for the carousel's main container.
     * @param {number} slideInterval - Time in milliseconds between auto slides.
     */
    function setupCarousel(containerSelector, slideInterval = 4000) {
        const container = document.querySelector(containerSelector);
        if (!container) {
            // console.warn(`Carousel container not found for selector: ${containerSelector}`);
            return;
        }

        const images = container.querySelectorAll('.carousel-img');
        if (images.length === 0) {
            // console.warn(`No images found in carousel for selector: ${containerSelector}`);
            return;
        }

        const prevBtn = container.querySelector('.prev-btn');
        const nextBtn = container.querySelector('.next-btn');
        const dotsContainer = container.querySelector('.carousel-dots');
        const dots = dotsContainer ? dotsContainer.querySelectorAll('.dot') : [];

        let currentIndex = 0;
        let autoSlideInterval;

        function showSlide(index) {
            if (index >= images.length) {
                index = 0;
            } else if (index < 0) {
                index = images.length - 1;
            }
            currentIndex = index;

            images.forEach((img, i) => {
                img.classList.remove('active');
                if (i === currentIndex) {
                    img.classList.add('active');
                }
            });
            dots.forEach((dot, i) => {
                dot.classList.remove('active');
                if (i === currentIndex) {
                    dot.classList.add('active');
                }
            });
        }

        function nextSlide() {
            showSlide(currentIndex + 1);
        }

        function prevSlide() {
            showSlide(currentIndex - 1);
        }

        function startAutoSlide() {
            clearInterval(autoSlideInterval);
            autoSlideInterval = setInterval(nextSlide, slideInterval);
        }

        if (prevBtn) prevBtn.addEventListener('click', () => { prevSlide(); startAutoSlide(); });
        if (nextBtn) nextBtn.addEventListener('click', () => { nextSlide(); startAutoSlide(); });
        dots.forEach(dot => {
            dot.addEventListener('click', (event) => {
                const slideIndex = parseInt(event.target.getAttribute('data-slide'));
                showSlide(slideIndex);
                startAutoSlide();
            });
        });

        showSlide(currentIndex); // Initialize first slide
        startAutoSlide(); // Start auto-sliding
    }

    /**
     * Loads dynamic content into the main content area.
     * @param {string} pageId - The ID of the page to load (e.g., 'historia', 'inicio').
     */
    async function loadPage(pageId) {
        try {
            const response = await fetch(`pages/${pageId}.html`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const htmlContent = await response.text();
            pageContentDiv.innerHTML = htmlContent;

            // Re-initialize any page-specific JavaScript components after content load
            if (pageId === 'inicio') {
                setupCarousel('#inicio-carousel', 4000);
            } else if (pageId === 'historia') {
                setupCarousel('#historia-carousel', 4000);
            }
            // Add more conditions here for other pages if they have specific JS
        } catch (error) {
            console.error(`Failed to load page ${pageId}:`, error);
            pageContentDiv.innerHTML = `<p>Error al cargar la página. Por favor, intente de nuevo más tarde.</p>`;
        }
    }

    // Mobile menu toggle logic
    if (mobileMenuToggle && mobileMenuClose && mainNavMenu) {
        mobileMenuToggle.addEventListener('click', () => {
            mainNavMenu.classList.add('mobile-active');
            body.classList.add('menu-open');
        });

        mobileMenuClose.addEventListener('click', () => {
            mainNavMenu.classList.remove('mobile-active');
            body.classList.remove('menu-open');
            // Close any open sub-menus when the main menu closes
            document.querySelectorAll('#main-nav-menu ul li.has-dropdown.open').forEach(li => {
                li.classList.remove('open');
                const subMenu = li.querySelector('ul');
                if (subMenu) subMenu.style.display = 'none';
            });
        });
    }

    // Event listeners for navigation links
    navLinks.forEach(link => {
        link.addEventListener('click', (event) => {
            const pageId = link.getAttribute('data-page');
            const isExternalLink = link.getAttribute('target') === '_blank';

            const parentLi = link.closest('li');
            // Check if the link's parent LI has a submenu AND it's a top-level conceptual link (e.g., 'NUESTRA INSTITUCIÓN')
            // or a sub-level conceptual link (e.g., '¿QUIÉNES SOMOS?').
            // This is primarily for mobile accordion behavior.
            const hasSubMenu = parentLi && parentLi.classList.contains('has-dropdown');

            // Handle dropdowns for mobile (accordion behavior)
            // This condition should trigger ONLY for the parent links that *toggle* submenus.
            // If the link has a data-page, it's a leaf node (or a node that also navigates),
            // and should not just toggle the dropdown, but also navigate and close the menu.
            if (window.innerWidth <= 768 && hasSubMenu && !pageId && !isExternalLink) {
                event.preventDefault(); // Prevent default navigation for dropdown parent
                parentLi.classList.toggle('open');
                const subMenu = parentLi.querySelector('ul');
                if (subMenu) {
                    subMenu.style.display = subMenu.style.display === 'flex' ? 'none' : 'flex';
                }
                // Stop further processing if it's a mobile dropdown toggle
                return;
            }

            // If it's a regular navigation link (with data-page) or an external link
            if (pageId) {
                event.preventDefault(); // Prevent default for internal navigation handled by JS
                loadPage(pageId);
                // Close mobile menu after navigating to a page
                if (mainNavMenu && mainNavMenu.classList.contains('mobile-active')) {
                    mobileMenuClose.click(); // Simulate click on close button
                }
            } else if (isExternalLink) {
                // For external links, let default behavior happen, but close menu
                if (mainNavMenu && mainNavMenu.classList.contains('mobile-active')) {
                    mobileMenuClose.click(); // Simulate click on close button
                }
                // No event.preventDefault() for external links, so it opens the new tab
            } else if (link.getAttribute('href') === '#') {
                // For top-level conceptual links like #nuestra-institucion that don't have data-page,
                // prevent default navigation if it's not handled as a mobile dropdown toggle already.
                // This covers cases where `hasSubMenu` is false (e.g., an empty # link without children)
                // or on desktop where `hasSubMenu` is true but `window.innerWidth <= 768` is false.
                event.preventDefault();
            }
        });
    });

    // Event listener for the home link (logo and text)
    if (homeLink) {
        homeLink.addEventListener('click', (event) => {
            event.preventDefault();
            loadPage('inicio');
            // Close mobile menu if open
            if (mainNavMenu && mainNavMenu.classList.contains('mobile-active')) {
                mobileMenuClose.click();
            }
        });
    }

    // Load the home page by default on initial page load
    loadPage('inicio');
});