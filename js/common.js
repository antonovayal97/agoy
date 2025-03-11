document.addEventListener("DOMContentLoaded",(event) => {
    const body = document.querySelector("body");
    const header = document.querySelector("header");
    const mainEl = document.querySelector("main");
    
    const footer = document.querySelector("footer");
    footer.style.display = "none"

function initPageChanger() {
    // Конфигурация
    const PAGE_LINKS = [
        "/index.html",
        "/about.html",
        "/complex-objects.html"
    ].map(normalizePath);

    // Состояние
    let currentPageIndex = 0;
    let isTransitioning = false;
    let scrollTimeout = null;
    let touchStartY = 0;

    // Инициализация
    initCurrentPage();
    setupEventListeners();
    console.log('PageChanger initialized');

    // Нормализация URL
    function normalizePath(path) {
        return path === '/' ? '' : path.replace(/\/+$/, '').toLowerCase();
    }

    // Определение текущей страницы
    function initCurrentPage() {
        const currentPath = normalizePath(window.location.pathname);
        currentPageIndex = PAGE_LINKS.findIndex(link => link === currentPath);
        
        if (currentPageIndex === -1) {
            console.warn('Unknown URL, redirecting to home');
            window.history.replaceState({ index: 0 }, '', '/');
            currentPageIndex = 0;
        }
        
        console.log('Current page:', currentPageIndex, PAGE_LINKS[currentPageIndex]);
    }

    // Проверка границ скролла
    function checkScrollEdges() {
        const scrollY = window.scrollY;
        const documentHeight = document.documentElement.scrollHeight;
        const windowHeight = window.innerHeight;
        const maxScroll = Math.max(documentHeight - windowHeight, 0);

        return {
            isTop: scrollY <= 50,
            isBottom: scrollY >= maxScroll - 50 || documentHeight <= windowHeight
        };
    }

    // Навигация
    async function navigateToPage(newIndex) {
        if (newIndex === currentPageIndex || isTransitioning) return;
        
        console.log(`Navigating from ${currentPageIndex} to ${newIndex}`);
        isTransitioning = true;

        try {
            // Загрузка контента
            const content = await fetchPageContent(PAGE_LINKS[newIndex]);
            updatePageContent(content);

            // Обновление состояния
            currentPageIndex = newIndex;
            window.history.pushState({ index: newIndex }, '', PAGE_LINKS[newIndex]);

            // Плавный скролл
            window.scrollTo({
                top: 0,//newIndex > currentPageIndex ? 0 : document.body.scrollHeight,
                behavior: 'smooth'
            });
        } catch (error) {
            console.error('Navigation failed:', error);
        } finally {
            setTimeout(() => {
                isTransitioning = false;
                console.log('Navigation cooldown');
            }, 1000);
        }
    }

    // Загрузка страницы
    async function fetchPageContent(url) {
        console.log('Fetching:', url);
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return await response.text();
    }

    // Обновление DOM
    function updatePageContent(html) {
        const parser = new DOMParser();
        const newDoc = parser.parseFromString(html, 'text/html');
        const newMain = newDoc.querySelector('main');
        
        if (!newMain) throw new Error('Main content not found');
        
        document.querySelector('main').innerHTML = newMain.innerHTML;
        initPageComponents();
        console.log('Content updated');
    }

    // Инициализация компонентов
    function initPageComponents() {
        try {
            if (typeof initAdapt === 'function') initAdapt();
            if (typeof initAspectRatio === 'function') initAspectRatio();
            if (typeof initSlides === 'function') initSlides();
            console.log('Components initialized');
        } catch (e) {
            console.error('Component error:', e);
        }
    }

    // Обработчики событий
    function setupEventListeners() {
        // Десктоп
        window.addEventListener('wheel', handleDesktopScroll);
        
        // Мобильные устройства
        window.addEventListener('touchstart', handleTouchStart);
        window.addEventListener('touchmove', handleTouchMove);
        
        // История браузера
        window.addEventListener('popstate', handlePopState);
    }

    // Обработка скролла мышью
    function handleDesktopScroll(e) {
        if (isTransitioning) return;
        
        const { isTop, isBottom } = checkScrollEdges();
        console.log(`Scroll: deltaY=${e.deltaY}, top=${isTop}, bottom=${isBottom}`);

        if (scrollTimeout) clearTimeout(scrollTimeout);

        if ((e.deltaY > 0 && isBottom && canGoNext()) || 
            (e.deltaY < 0 && isTop && canGoPrev())) {
            scrollTimeout = setTimeout(() => {
                e.deltaY > 0 ? navigateToPage(currentPageIndex + 1) : 
                              navigateToPage(currentPageIndex - 1);
            }, 350);
        }
    }

    // Обработка тач-событий
    function handleTouchStart(e) {
        touchStartY = e.touches[0].clientY;
    }

    function handleTouchMove(e) {
        if (isTransitioning) return;
        
        const touchY = e.touches[0].clientY;
        const deltaY = touchY - touchStartY;
        const { isTop, isBottom } = checkScrollEdges();
        
        if (scrollTimeout) clearTimeout(scrollTimeout);

        if ((deltaY < -20 && isBottom && canGoNext()) || 
            (deltaY > 20 && isTop && canGoPrev())) {
            scrollTimeout = setTimeout(() => {
                deltaY < 0 ? navigateToPage(currentPageIndex + 1) : 
                            navigateToPage(currentPageIndex - 1);
            }, 350);
        }
    }

    // Обработка истории
    function handlePopState(e) {
        const newIndex = e.state?.index ?? 0;
        if (newIndex !== currentPageIndex) {
            navigateToPage(newIndex);
        }
    }

    // Вспомогательные проверки
    function canGoNext() {
        return currentPageIndex < PAGE_LINKS.length - 1;
    }

    function canGoPrev() {
        return currentPageIndex > 0;
    }
}

    function mainMarginTop()
    {
        mainEl.style.marginTop = header.clientHeight + "px";
    }

    function mobileMenu()
    {
        let isMenuOpened = false;
        let button = header.querySelector(".header__burger");
        //isMenuOpened = !isMenuOpened;
        //header.classList.toggle("header--active");
        //body.style.overflow = (isMenuOpened) ? "hidden" : null;
        button.addEventListener("click",() => {
            isMenuOpened = !isMenuOpened;
            header.classList.toggle("header--active");
            body.style.overflow = (isMenuOpened) ? "hidden" : null;
        })
    }
    function headerHide()
    {
        let lastScrollTop = 0;
        let scrollDelta = 10; // величина скролла для активации
        window.addEventListener('scroll', function() {
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            if (scrollTop > lastScrollTop && Math.abs(scrollTop - lastScrollTop) > scrollDelta) {
                // Прокрутка вниз, скрываем хедер с учетом дельты
                header.style.top = '-100px';
            } else if (scrollTop < lastScrollTop) {
                // Прокрутка вверх, показываем хедер сразу
                header.style.top = '0';
            }
            lastScrollTop = scrollTop;
        });
    }
    function initSlides()
    {
        let sposobOplaty = document.querySelector(".partners__cards");
        let partnersTags = document.querySelector(".partners__tags");
        let smi = document.querySelector(".smi__swiper");
        let news = document.querySelector(".news__swiper");
        let aboutProject = document.querySelector(".about-project__slides-swiper");
        let bigSlider = document.querySelector(".big-slider");
        let team = document.querySelector(".team__swiper");

        const remValue = parseFloat(getComputedStyle(document.documentElement).fontSize);

        if(sposobOplaty != undefined)
        {
            let sposobOplatySwiper = new Swiper('.partners__cards', {
                enabled: true,
                slidesPerView: "auto",
                spaceBetween: 1.5*remValue,
                centeredSlides: true,
                breakpoints: {
                    1024: {
                        centeredSlides: false,
                        enabled: false,
                        slidesPerView: "auto",
                        spaceBetween: 2*remValue
                    }
                }
              });
        }

        if(partnersTags != undefined)
        {
            let partnersTagsSwiper = new Swiper('.partners__tags', {
                enabled: true,
                slidesPerView: "auto",
                spaceBetween: 3*remValue,
                centeredSlides: true,
                breakpoints: {
                    1024: {
                        centeredSlides: false,
                        enabled: false,
                        slidesPerView: "auto",
                        spaceBetween: 3*remValue
                    }
                }
                });
        }

        if(smi != undefined)
        {
            let smiSwiper = new Swiper('.smi__swiper', {
                slidesPerView: "auto",
                spaceBetween: 1.25*remValue,
                grabCursor: true,
                breakpoints: {
                    1024: {
                        slidesPerView: "auto",
                        spaceBetween: 1.25*remValue
                    }
                }
                });
        }

        if(news != undefined)
        {
            let newsSwiper = new Swiper('.news__swiper', {
                slidesPerView: "auto",
                spaceBetween: 1.2*remValue,
                grabCursor: true,
                enabled: true,
                breakpoints: {
                    1024: {
                        slidesPerView: "auto",
                        spaceBetween: 1.2*remValue,
                        enabled: false
                    }
                }
                });
        }
        if(aboutProject != undefined)
        {
            let aboutProjectSwiper = new Swiper('.about-project__slides-swiper', {
                slidesPerView: 1,
                spaceBetween: 0,
                grabCursor: true,
                effect: 'fade',
                direction: "horizontal",
                fadeEffect: {
                    crossFade: true
                },
                speed: 500,
                pagination: {
                    el: '.swiper-pagination',
                    clickable: true
                },
                breakpoints: {
                    1024: {
                        direction: "vertical"
                    }
                }
                });
        }
        if(bigSlider != undefined)
        {
            let bigSliderSwiper = new Swiper('.big-slider', {
                slidesPerView: 1,
                spaceBetween: 0,
                grabCursor: true,
                effect: 'fade',
                fadeEffect: {
                    crossFade: true
                },
                speed: 500,
                direction: "horizontal",
                pagination: {
                    el: '.swiper-pagination',
                    clickable: true
                }
                });
        }
        if(team != undefined)
        {
            let teamSwiper = new Swiper('.team__swiper', {
                slidesPerView: 1,
                spaceBetween: 0,
                grabCursor: true,
                effect: 'fade',
                fadeEffect: {
                    crossFade: true
                },
                speed: 500
                });
        }
    }
    function initImages()
    {
        var images = document.querySelectorAll("img[data-src]");
        let window_width = window.innerWidth;
        images.forEach((image) => {
            if(window_width > 1024)
            {
                image.src = image.dataset.src;
            }
            else if(window_width <= 1024 && window_width > 766 && image.dataset.tabletSrc)
            {
                image.src = image.dataset.tabletSrc;
            }
            else if(window_width <= 766 && image.dataset.mobileSrc)
            {
                image.src = image.dataset.mobileSrc;
            }
            else
            {
                image.src = image.dataset.src;
            }
        })
    }
    function initModals()
    {
        const modals = new HystModal({
            linkAttributeName: "data-hystmodal",
            //settings (optional). see API
        });

        //modals.open("#modal-form")
    }
    function initMask()
    {
        var phones = document.querySelectorAll('input[name="phone"]');
        phones.forEach((phone) => {
            IMask(phone, {
                mask: [
                  {
                    mask: '+000 00 0000000',
                    startsWith: '998',
                    lazy: false,
                    country: 'Узбекистан'
                  },
                  {
                    mask: '+000-00-000-0000',
                    startsWith: '992',
                    lazy: false,
                    country: 'Таджикистан'
                  },
                  {
                    mask: '+000 (000) 000-000',
                    startsWith: '996',
                    lazy: false,
                    country: 'Кыргызстан'
                  },
                  {
                    mask: '+0 (000) 000-00-00',
                    startsWith: '7',
                    lazy: false,
                    country: 'Russia'
                  },
                  {
                    mask: '0000000000000',
                    startsWith: '',
                    country: 'Страна не определена'
                  }
                ],
                dispatch: (appended, dynamicMasked) => {
                  const number = (dynamicMasked.value + appended).replace(/\D/g,'');
              
                  return dynamicMasked.compiledMasks.find(m => number.indexOf(m.startsWith) === 0);
                }
              })
              //.on('accept', function() {
              //  document.getElementById('dispatch-value').innerHTML = dispatchMask.masked.currentMask.country;
              //});
        })
    }
    function initForms() {
        const allForms = document.querySelectorAll('form[data-form]');
        allForms.forEach((form) => {
            form.addEventListener('submit', function (event) {
                const inputs = form.querySelectorAll('input[required]'); // Все обязательные input
                let isValid = true;
                inputs.forEach((input) => {

                    const parent = input.closest('.input');


                    // Событие ввода
                    input.addEventListener('input', () => {
                        if (parent) {
                            if (input.checkValidity()) {
                                parent.classList.remove('error'); // Убираем класс ошибки
                            } else {
                                parent.classList.add('error'); // Добавляем класс ошибки
                            }
                        }
                    });


                    //const errorMessage = input.nextElementSibling;
    
                    // Сброс предыдущего состояния
                    parent.classList.remove('error');
    
                    // Проверяем валидность
                    if (input.type === 'file') {
                        // Проверка для файлового ввода
                        if (!input.files || input.files.length === 0) {
                            isValid = false;
                            parent.classList.add('error');
                        }
                    } else if (input.type === 'checkbox') {
                        if(!input.checked)
                        {
                            isValid = false;
                            parent.classList.add('error');
                        }
                    } else if (!input.checkValidity()) {
                        // Проверка для остальных типов
                        isValid = false;
                        parent.classList.add('error');
                    }
                });
    
                // Если форма невалидна, предотвращаем отправку
                if (!isValid) {
                    event.preventDefault();
                }
            });
        });
    }
    function initAdapt() {
        // Получаем все элементы с атрибутом data-adapt
        const elements = document.querySelectorAll('[data-adapt]');
    
        elements.forEach(element => {
            // Разбираем атрибут data-adapt
            const [target, breakpoint, order] = element.getAttribute('data-adapt').split(',').map(item => item.trim());
    
            // Получаем целевой контейнер
            const targetContainer = document.querySelector(target);
    
            // Проверяем, соответствует ли текущее разрешение условию
            if (window.innerWidth <= parseInt(breakpoint)) {
                // Перемещаем элемент в целевой контейнер
                if (order === 'first') {
                    targetContainer.prepend(element); // Добавляем первым
                } else {
                    targetContainer.appendChild(element); // Добавляем последним
                }
            } else {
                const originalContainerAttr = element.getAttribute('data-original-container');
                const originalContainer = document.querySelector(originalContainerAttr);
                // Возвращаем элемент обратно в исходный контейнер
                if (originalContainer) {
                    originalContainer.appendChild(element);
                }
            }
        });

        mainMarginTop();
    }
    function initChangePage(callback)
    {
        fetch('/about-project.html')
        .then(response => response.text()) // Преобразуем ответ в текст
        .then(html => {
            // Создаем временный элемент для парсинга HTML
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');

            // Получаем содержимое элемента <main> из запрошенной страницы
            const newMainContent = doc.querySelector('main').innerHTML;

            // Заменяем содержимое <main> на текущей странице
            document.querySelector('main').innerHTML = newMainContent;

            history.pushState(null, '', '/about-project.html');

            callback();
        })
        .catch(error => {
            console.error('Ошибка при загрузке страницы:', error);
        });
    }
    function init()
    {
        initPageChanger();
        initAdapt();
        mobileMenu();
        headerHide();
        initSlides();
        mainMarginTop();
        initModals();
    }

    function onWindowResize()
    {
        initAdapt();
    }

    init();

    window.addEventListener("resize", onWindowResize);

});

function initAspectRatio() {
    let items = document.querySelectorAll("[data-aspect-ratio]");

    function evaluateExpression(expression) {
        try {
            return new Function(`return ${expression}`)(); // Вычисляем выражение
        } catch (error) {
            console.error(`Invalid aspect ratio expression: "${expression}"`, error);
            return NaN; // Возвращаем NaN, если выражение некорректно
        }
    }

    function updateAspectRatio() {
        let window_width = window.innerWidth;
        items.forEach((item) => {
            let aspectRatio;
            if(item.dataset.tabletAspectRatio && window_width <= 1024 && window_width > 766)
            {
                aspectRatio = evaluateExpression(item.dataset.tabletAspectRatio);
            }
            else if(item.dataset.mobileAspectRatio && window_width <= 766)
            {
                aspectRatio = evaluateExpression(item.dataset.mobileAspectRatio);
            }
            else
            {
                aspectRatio = evaluateExpression(item.dataset.aspectRatio);
            }

            if (isNaN(aspectRatio) || aspectRatio <= 0) {
                console.error(`Invalid aspect ratio: ${item.dataset.aspectRatio}`);
                return; // Пропускаем элемент с некорректным значением
            }

            let currentWidth = item.offsetWidth;
            let newHeight = currentWidth / aspectRatio;
            item.style.height = newHeight + "px";
        });
    }

    // Обновляем размеры при изменении размера окна
    window.addEventListener("resize", updateAspectRatio);

    // Также вызываем функцию один раз при инициализации
    updateAspectRatio();
}

initAspectRatio();
