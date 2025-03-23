document.addEventListener("DOMContentLoaded",(event) => {
    const body = document.querySelector("body");
    const header = document.querySelector("header");
    const mainEl = document.querySelector("main");
    
    let phoneValid = [false,false,false,false,false,false];
    let canSendForm = true;
    let isMenuOpened = false;

    var modals;

    const footer = document.querySelector("footer");
    const mainForm = document.querySelector(".main-form");
    
    let isSliderCanVertical = {
        up: true,
        down: true
    };

    let canChangeScrollIfSlide = true;


    footer.style.display = "none"
    mainForm.style.display = "none"

    async function initPageChanger() {
        // Конфигурация

        // Добавляем флаг для 404 состояния
        let is404Page = false;

        const host = window.location.hostname;
        const isLocalhost = ['localhost', '127.0.0.1'].includes(host);
        const isGitHubPages = host === 'antonovayal97.github.io';

        var pageNames = await fetchLinks();

        pageNames.unshift("");

        const PAGE_LINKS = pageNames.map(name => {
        // Локальная разработка
        if (isLocalhost) {
            return name === '' 
            ? '/index.html' 
            : `/${name}.html`;
        }
        
        // GitHub Pages
        if (isGitHubPages) {
            return name === ''
            ? '/agoy/index.html'
            : `/agoy/${name}.html`;
        }

        // Продакшен (другие домены)
        return name === ''
            ? '/'
            : `/${name}/`;
            
        }).map(normalizePath);

        /*Главная - / ..
        окружение - /about ..
        Объекты комплекса /сomplex-objects ..
        Сми о нас /media ..
        Новости /news ..
        Команда /team ..
        комплектация номеров /complect
        ген план /gen-plan ..
        локация /location-and-infrastructure ..
        планировочные решения /plan-solutions
        наши партнеры /partners ..
        местоположение /location ..
        */

        let loaderRunner = document.querySelector(".loader-runner");
        // Состояние
        let currentPageIndex = 0;
        let isTransitioning = false;
        let scrollTimeout = null;
        let touchStartY = 0;
        let scrollerTime = 100;
        // Инициализация
        initCurrentPage();
        setupEventListeners();
        console.log('PageChanger initialized');


        // Функция для получения данных из API
        async function fetchLinks() {
            try {
                // Выполняем запрос к API
                const response = await fetch('https://test2.dankom.ru/api/get_menu.php');

                // Проверяем, успешен ли запрос
                if (!response.ok) {
                    throw new Error('Ошибка при загрузке данных');
                }

                // Парсим JSON-ответ
                let links = await response.json();
                return links;
            } catch (error) {
                console.error('Ошибка:', error);
                return [""];
            }
        }

        // Нормализация URL
        function normalizePath(path) {
            // Убираем дублирующиеся слеши внутри пути
            let normalized = path.replace(/\/+/g, '/');
            
            // Удаляем trailing slash только для путей с .html
            if (normalized.endsWith('.html/')) {
                normalized = normalized.slice(0, -1);
            }
            
            // Сохраняем корневой путь как '/'
            if (normalized === '') return '/';
            
            return normalized;
        }

        // Определение текущей страницы
        function initCurrentPage() {
            const currentPath = normalizePath(window.location.pathname);
            currentPageIndex = PAGE_LINKS.findIndex(link => link === currentPath);
            
            if (currentPageIndex === -1) {
                console.warn('Unknown URL, working in 404 mode');
                is404Page = true;
                 // Показываем элементы для 404
                if (footer) footer.style.display = "block";
                if (mainForm) mainForm.style.display = "flex";
                return;
            }
            
            is404Page = false;
            
            console.log("currentPageIndex: ",currentPageIndex);
            console.log("PAGE_LINKS.length - 1: ",PAGE_LINKS.length - 1);

            if(currentPageIndex == PAGE_LINKS.length - 1)
            {
                footer.style.display = "block";
                mainForm.style.display = "flex";
            }
            else
            {
                footer.style.display = "none";
                mainForm.style.display = "none";
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
            if (isTransitioning) return;
            
            console.log(`Navigating from ${currentPageIndex} to ${newIndex}`);
            isTransitioning = true;
        
            try {
                // Всегда проверяем валидность нового индекса
                if (newIndex < 0 || newIndex >= PAGE_LINKS.length) {
                    throw new Error('Invalid page index');
                }
        
                const content = await fetchPageContent(PAGE_LINKS[newIndex]);
                updatePageContent(content, newIndex);
        
                // Обновляем состояние после успешной загрузки
                currentPageIndex = newIndex;
                window.history.pushState({ index: newIndex }, '', PAGE_LINKS[newIndex]);
                
                // Сбрасываем флаг 404 при успешной навигации
                is404Page = false;
                
                canChangeScrollIfSlide = true;
                isSliderCanVertical.up = true;
                isSliderCanVertical.down = true;
            } catch (error) {
                console.error('Navigation failed:', error);
                // При ошибке переходим в 404 режим
                is404Page = true;
                if (footer) footer.style.display = "block";
                if (mainForm) mainForm.style.display = "flex";
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
        function updatePageContent(html, newIndex) {
            const parser = new DOMParser();
            const newDoc = parser.parseFromString(html, 'text/html');
            const newMain = newDoc.querySelector('main');
            const newTitle = newDoc.querySelector('title');
            
            if (!newMain) throw new Error('Main content not found');
        
            document.title = newTitle.textContent;
            
            if(newIndex > currentPageIndex)
            {
                loaderRunner.classList.remove("loader-runner-bottom-to-top");
                loaderRunner.classList.remove("loader-runner--active-bottom-to-top");
                loaderRunner.classList.remove("loader-runner-top-to-bottom");
                loaderRunner.classList.remove("loader-runner--active-top-to-bottom");
                loaderRunner.classList.add("loader-runner-top-to-bottom");
                setTimeout(() => {
                    loaderRunner.classList.add("loader-runner--active-top-to-bottom");
                }, 100)
            }
            else
            {
                loaderRunner.classList.remove("loader-runner-bottom-to-top");
                loaderRunner.classList.remove("loader-runner--active-bottom-to-top");
                loaderRunner.classList.remove("loader-runner-top-to-bottom");
                loaderRunner.classList.remove("loader-runner--active-top-to-bottom");
                loaderRunner.classList.add("loader-runner-bottom-to-top");
                setTimeout(() => {
                    loaderRunner.classList.add("loader-runner--active-bottom-to-top");
                }, 100)
            }
            setTimeout(() => {
                document.querySelector('main').innerHTML = newMain.innerHTML;
                initPageComponents();

                console.log("newIndex: ",newIndex);
                console.log("PAGE_LINKS.length - 1: ",PAGE_LINKS.length - 1);

                // Для 404 и неизвестных страниц показываем элементы
                if (is404Page || newIndex === -1) {
                    if (footer) footer.style.display = "block";
                    if (mainForm) mainForm.style.display = "flex";
                } 
                
                if(newIndex == PAGE_LINKS.length - 1)
                {
                    footer.style.display = "block";
                    mainForm.style.display = "flex";
                }
                else
                {
                    footer.style.display = "none";
                    mainForm.style.display = "none";
                }

                // Плавный скролл
                window.scrollTo({
                    top: 0,//newIndex > currentPageIndex ? 0 : document.body.scrollHeight,
                    //behavior: 'smooth'
                });
                console.log('Content updated');
            }, 500)
        }

        function handleLinkClick(e) {
            const href = this.getAttribute('href');
            if (!href) return;
        
            isMenuOpened = false;
            header.classList.remove("header--active");
            body.style.overflow = null;
        
            try {
                const a = document.createElement('a');
                a.href = href;
                const targetUrl = new URL(a.href);
                
                // Для внутренних ссылок всегда пытаемся найти в PAGE_LINKS
                if (targetUrl.hostname === window.location.hostname) {
                    const path = normalizePath(targetUrl.pathname);
                    const targetIndex = PAGE_LINKS.indexOf(path);
                    
                    if (targetIndex !== -1) {
                        e.preventDefault();
                        navigateToPage(targetIndex);
                        return;
                    }
                }
                
                // Для внешних ссылок и не найденных внутренних разрешаем стандартное поведение
                console.log('Allowing default navigation');
            } catch (error) {
                console.error('Error processing link:', error);
            }
        }
    
        function initLinkHandlers() {
            document.querySelectorAll('a').forEach(link => {
                link.removeEventListener('click', handleLinkClick); // Удаляем старый обработчик
                link.addEventListener('click', handleLinkClick);   // Добавляем новый
            });
        }
    
        // Модифицируем инициализацию компонентов
        function initPageComponents() {
            try {
                if (typeof initAdapt === 'function') initAdapt();
                if (typeof initAspectRatio === 'function') initAspectRatio();
                if (typeof initSlides === 'function') initSlides();
                if (typeof initMap === 'function') initMap();
                if (typeof initForms === 'function') initForms();
                if (typeof initTableTabs === 'function') initTableTabs();
                initLinkHandlers(); // Инициализируем обработчики ссылок
                console.log('Components initialized');
            } catch (e) {
                console.error('Component error:', e);
            }
        }

        // Обработчики событий
        function setupEventListeners() {
            // <a> links
            initLinkHandlers();

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
            if (isTransitioning || isMenuOpened || is404Page) return;

            const { isTop, isBottom } = checkScrollEdges();
            console.log(`Scroll: deltaY=${e.deltaY}, top=${isTop}, bottom=${isBottom}`);

            if (scrollTimeout) clearTimeout(scrollTimeout);


            if ((e.deltaY > 0 && isBottom && canGoNext()) || 
                (e.deltaY < 0 && isTop && canGoPrev())) {
                scrollTimeout = setTimeout(() => {
                    e.deltaY > 0 ? navigateToPage(currentPageIndex + 1) : 
                                navigateToPage(currentPageIndex - 1);
                }, scrollerTime);
            }
        }

        // Обработка тач-событий
        function handleTouchStart(e) {
            touchStartY = e.touches[0].clientY;
        }

        function handleTouchMove(e) {
            if (!canChangeScrollIfSlide) return;

            if (isTransitioning || isMenuOpened || is404Page) return;
            
            const touchY = e.touches[0].clientY;
            const deltaY = touchY - touchStartY;
            const { isTop, isBottom } = checkScrollEdges();
            
            if (scrollTimeout) clearTimeout(scrollTimeout);

            if(deltaY < -20 && isBottom && canGoNext() && !isSliderCanVertical.down) return;

            if(deltaY > 20 && isTop && canGoPrev() && !isSliderCanVertical.up) return;
            


            if ((deltaY < -20 && isBottom && canGoNext()) || 
                (deltaY > 20 && isTop && canGoPrev())) {
                scrollTimeout = setTimeout(() => {
                    deltaY < 0 ? navigateToPage(currentPageIndex + 1) : 
                                navigateToPage(currentPageIndex - 1);
                }, scrollerTime);
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
    function fixScroller()
    {
        let lastTouchY = 0;

        document.addEventListener('touchstart', e => {
        lastTouchY = e.touches[0].clientY;
        }, { passive: false });

        document.addEventListener('touchmove', e => {
        const touchY = e.touches[0].clientY;
        const isScrollingUp = touchY > lastTouchY;
        lastTouchY = touchY;

        if (window.scrollY === 0 && isScrollingUp) {
            e.preventDefault();
        }
        }, { passive: false });
    }
    function mainMarginTop()
    {
        //mainEl.style.marginTop = header.querySelector(".header").clientHeight + "px";
    }
    function mobileMenu()
    {
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
                        direction: "horizontal"
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
                direction: "vertical",
                pagination: {
                    el: '.swiper-pagination',
                    clickable: true
                },
                navigation: {
                    nextEl: '.big-slider__arrow--right',
                    prevEl: '.big-slider__arrow--left',
                },
                breakpoints: {
                    1024: {
                        direction: "horizontal"
                    }
                },
                on: {
                    slideChange: function () {
                        const totalSlides = bigSliderSwiper.slides.length;
                        const isEnd = bigSliderSwiper.activeIndex === totalSlides - 1;

                        if (isEnd) {
                            console.log('isEnd');
                            isSliderCanVertical.up = false;
                            isSliderCanVertical.down = true;
                        }
                        else if(bigSliderSwiper.activeIndex == 0)
                        {
                            console.log('bigSliderSwiper.activeIndex == 0');
                            isSliderCanVertical.up = true;
                            isSliderCanVertical.down = false;
                        }
                        else
                        {
                            console.log('else');
                            isSliderCanVertical.up = false;
                            isSliderCanVertical.down = false;
                        }

                        console.log("isSliderCanVertical.down swiper: ",isSliderCanVertical.down);
                        console.log("isSliderCanVertical.up swiper: ",isSliderCanVertical.up);

                        canChangeScrollIfSlide = true;
                      },
                }
            });


                // Функция для перехода к слайду по якорю
                function goToSlideByHash() {
                    const hash = window.location.hash;
                    if (hash) {
                    const slide = document.querySelector(hash.replace(/\//g, ''));
                    if (slide) {
                        const slideIndex = Array.from(slide.parentElement.children).indexOf(slide);
                        bigSliderSwiper.slideTo(slideIndex);
                    }
                    }
                }

                // Переход к слайду при загрузке страницы
                goToSlideByHash();

                // Переход к слайду при изменении хэша
                window.addEventListener('hashchange', goToSlideByHash);

                console.log('document.querySelectorAll(".big-slider .swiper-slide").length', document.querySelectorAll(".big-slider .swiper-slide").length)
                if(window.innerWidth <= 1024 && document.querySelectorAll(".big-slider .swiper-slide").length > 1)
                {
                    isSliderCanVertical.up = true;
                    isSliderCanVertical.down = false;
                }
                else
                {
                    canChangeScrollIfSlide = true;
                    isSliderCanVertical.up = true;
                    isSliderCanVertical.down = true;
                }

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
                speed: 500,
                navigation: {
                    nextEl: '.big-slider__arrow--right',
                    prevEl: '.big-slider__arrow--left',
                }
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
        modals = new HystModal({
            linkAttributeName: "data-hystmodal",
            //settings (optional). see API
        });

        //modals.open("#modal-form")
        //modals.open("#modal-form-success")
       
    }
    // Сохраняем ссылки на обработчики
    let formSubmitHandlers = new WeakMap();
    let popupClickHandlers = new WeakMap();

    function initForms() {
        // Удаляем старые обработчики событий
        document.querySelectorAll('[data-hystmodal="#modal-form"]').forEach(caller => {
            const handler = popupClickHandlers.get(caller);
            if (handler) {
            caller.removeEventListener('click', handler);
            }
        });

        document.querySelectorAll('form').forEach(form => {
            const handler = formSubmitHandlers.get(form);
            if (handler) {
            form.removeEventListener('submit', handler);
            }
        });

        // Новая инициализация
        const popupFormCallers = document.querySelectorAll('[data-hystmodal="#modal-form"]');
        const popupForm = document.querySelector("#modal-form");
        const footerForm = document.querySelector(".main-form");

        if (footerForm)
        {
            footerForm.querySelector("form").action = "/api/send_form.php";
            if (footerForm.querySelector('[data-form-name]'))
            {
                footerForm.querySelector('[data-form-name]').value = "Форма в подвале";
            }
        }

        if (popupForm)
        {
            popupForm.querySelector("form").action = "/api/send_form.php"
            popupFormCallers.forEach(caller => {
            const clickHandler = () => {
                popupForm.querySelector(".modal-form__title h2").innerText = caller.dataset.formTitle || "Обратная связь";
                popupForm.querySelector(".modal-form__desc p").innerText = caller.dataset.formDesc || "";
                
                if (popupForm.querySelector('[data-form-name]')) {
                popupForm.querySelector('[data-form-name]').value = caller.dataset.formName || "Обратная связь";
                }
            };
            
            // Сохраняем ссылку на обработчик
            popupClickHandlers.set(caller, clickHandler);
            caller.addEventListener('click', clickHandler);
            });
        }

        // Инициализация обработчиков форм
        document.querySelectorAll('form').forEach((form, index) => {
            const submitHandler = async (e) => {
                console.log("phoneValid",phoneValid);
                console.log("index",index);
                
                if(phoneValid[index])
                {
                    e.preventDefault();

                    console.log("submitHandler")
                    if(!canSendForm) return
                    console.log("canSendForm: true")
                    canSendForm = false;

                    const form = e.target;
                    const formData = new FormData(form); // Собираем данные формы
                  
                    try {
                        const response = await fetch(form.action, {
                            method: 'POST',
                            body: formData, // FormData автоматически установит Content-Type: multipart/form-data
                        });
                    
                        if (!response.ok) {
                            throw new Error(`Ошибка HTTP: ${response.status}`);
                        }
                    
                        const result = await response.json();

                        form.reset();

                        modals.close();
                        modals.open("#modal-form-success");
                        console.log("FORM SENDED");
                    
                    } catch (error) {
                        modals.close();
                        modals.open("#modal-form-fail");
                        console.log("FORM ERROR");
                    }

                    canSendForm = true;
                    
                }
                else
                {
                    console.log("else")
                    e.preventDefault();
                    
                    form.querySelector("[data-phone]").reportValidity();
                }
            };
            
            // Сохраняем ссылку на обработчик
            formSubmitHandlers.set(form, submitHandler);
            form.addEventListener('submit', submitHandler);
        });
    }

    function initMask()
    {
        var phones = document.querySelectorAll('[data-phone]');
        phones.forEach((phone, index) => {
            var phoneMask = IMask(phone, {
                    mask: '+{7}(000)000-00-00',
                    lazy: false
              })

              phone.setCustomValidity('Заполните поле полностью');
              phoneMask.on('accept', () => {
                if (phoneMask.masked.isComplete) {
                    phoneValid[index] = true;
                    phone.setCustomValidity('');
                } else {
                    phoneValid[index] = false;
                    phone.setCustomValidity('Заполните поле полностью');
                }
              });
        })
    }
    /*function initForms() {
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
    }*/
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
    async function initMap() {

        if (typeof ymaps3 === 'undefined') {
            console.error('Yandex Maps API not loaded!');
            return;
          }
        if (!document.getElementById('map')) {
        return; // Выходим из функции, если элемента нет
        }

        var mapContainer = document.querySelector("#map");

        mapContainer.style.opacity = 0;

        // Промис `ymaps3.ready` будет зарезолвлен, когда загрузятся все компоненты основного модуля API
        await ymaps3.ready;
        
        const {YMap, YMapDefaultSchemeLayer, YMapDefaultFeaturesLayer} = ymaps3;

        // Иницилиазируем карту
        const map = new YMap(
            // Передаём ссылку на HTMLElement контейнера
            document.getElementById('map'),

            // Передаём параметры инициализации карты
            {
                location: {
                    center: [39.021786, 44.141949], // Координаты центра карты.
                    zoom: 15, // Масштаб карты.
                    controls: ['zoomControl']
                }
            }
        );

        map.addChild(new YMapDefaultFeaturesLayer()); 

        map.addChild(new YMapDefaultSchemeLayer({
            customization: 
            [
    {
        "tags": "country",
        "elements": "geometry.fill",
        "stylers": [
            {
                "color": "#ad9a85"
            },
            {
                "zoom": 0,
                "opacity": 0.8
            },
            {
                "zoom": 1,
                "opacity": 0.8
            },
            {
                "zoom": 2,
                "opacity": 0.8
            },
            {
                "zoom": 3,
                "opacity": 0.8
            },
            {
                "zoom": 4,
                "opacity": 0.8
            },
            {
                "zoom": 5,
                "opacity": 1
            },
            {
                "zoom": 6,
                "opacity": 1
            },
            {
                "zoom": 7,
                "opacity": 1
            },
            {
                "zoom": 8,
                "opacity": 1
            },
            {
                "zoom": 9,
                "opacity": 1
            },
            {
                "zoom": 10,
                "opacity": 1
            },
            {
                "zoom": 11,
                "opacity": 1
            },
            {
                "zoom": 12,
                "opacity": 1
            },
            {
                "zoom": 13,
                "opacity": 1
            },
            {
                "zoom": 14,
                "opacity": 1
            },
            {
                "zoom": 15,
                "opacity": 1
            },
            {
                "zoom": 16,
                "opacity": 1
            },
            {
                "zoom": 17,
                "opacity": 1
            },
            {
                "zoom": 18,
                "opacity": 1
            },
            {
                "zoom": 19,
                "opacity": 1
            },
            {
                "zoom": 20,
                "opacity": 1
            },
            {
                "zoom": 21,
                "opacity": 1
            }
        ]
    },
    {
        "tags": "country",
        "elements": "geometry.outline",
        "stylers": [
            {
                "color": "#e3ceb5"
            },
            {
                "zoom": 0,
                "opacity": 0.15
            },
            {
                "zoom": 1,
                "opacity": 0.15
            },
            {
                "zoom": 2,
                "opacity": 0.15
            },
            {
                "zoom": 3,
                "opacity": 0.15
            },
            {
                "zoom": 4,
                "opacity": 0.15
            },
            {
                "zoom": 5,
                "opacity": 0.15
            },
            {
                "zoom": 6,
                "opacity": 0.25
            },
            {
                "zoom": 7,
                "opacity": 0.5
            },
            {
                "zoom": 8,
                "opacity": 0.47
            },
            {
                "zoom": 9,
                "opacity": 0.44
            },
            {
                "zoom": 10,
                "opacity": 0.41
            },
            {
                "zoom": 11,
                "opacity": 0.38
            },
            {
                "zoom": 12,
                "opacity": 0.35
            },
            {
                "zoom": 13,
                "opacity": 0.33
            },
            {
                "zoom": 14,
                "opacity": 0.3
            },
            {
                "zoom": 15,
                "opacity": 0.28
            },
            {
                "zoom": 16,
                "opacity": 0.25
            },
            {
                "zoom": 17,
                "opacity": 0.25
            },
            {
                "zoom": 18,
                "opacity": 0.25
            },
            {
                "zoom": 19,
                "opacity": 0.25
            },
            {
                "zoom": 20,
                "opacity": 0.25
            },
            {
                "zoom": 21,
                "opacity": 0.25
            }
        ]
    },
    {
        "tags": "region",
        "elements": "geometry.fill",
        "stylers": [
            {
                "zoom": 0,
                "color": "#c2b3a3",
                "opacity": 0.5
            },
            {
                "zoom": 1,
                "color": "#c2b3a3",
                "opacity": 0.5
            },
            {
                "zoom": 2,
                "color": "#c2b3a3",
                "opacity": 0.5
            },
            {
                "zoom": 3,
                "color": "#c2b3a3",
                "opacity": 0.5
            },
            {
                "zoom": 4,
                "color": "#c2b3a3",
                "opacity": 0.5
            },
            {
                "zoom": 5,
                "color": "#c2b3a3",
                "opacity": 0.5
            },
            {
                "zoom": 6,
                "color": "#c2b3a3",
                "opacity": 1
            },
            {
                "zoom": 7,
                "color": "#c2b3a3",
                "opacity": 1
            },
            {
                "zoom": 8,
                "color": "#ad9a85",
                "opacity": 1
            },
            {
                "zoom": 9,
                "color": "#ad9a85",
                "opacity": 1
            },
            {
                "zoom": 10,
                "color": "#ad9a85",
                "opacity": 1
            },
            {
                "zoom": 11,
                "color": "#ad9a85",
                "opacity": 1
            },
            {
                "zoom": 12,
                "color": "#ad9a85",
                "opacity": 1
            },
            {
                "zoom": 13,
                "color": "#ad9a85",
                "opacity": 1
            },
            {
                "zoom": 14,
                "color": "#ad9a85",
                "opacity": 1
            },
            {
                "zoom": 15,
                "color": "#ad9a85",
                "opacity": 1
            },
            {
                "zoom": 16,
                "color": "#ad9a85",
                "opacity": 1
            },
            {
                "zoom": 17,
                "color": "#ad9a85",
                "opacity": 1
            },
            {
                "zoom": 18,
                "color": "#ad9a85",
                "opacity": 1
            },
            {
                "zoom": 19,
                "color": "#ad9a85",
                "opacity": 1
            },
            {
                "zoom": 20,
                "color": "#ad9a85",
                "opacity": 1
            },
            {
                "zoom": 21,
                "color": "#ad9a85",
                "opacity": 1
            }
        ]
    },
    {
        "tags": "region",
        "elements": "geometry.outline",
        "stylers": [
            {
                "color": "#e3ceb5"
            },
            {
                "zoom": 0,
                "opacity": 0.15
            },
            {
                "zoom": 1,
                "opacity": 0.15
            },
            {
                "zoom": 2,
                "opacity": 0.15
            },
            {
                "zoom": 3,
                "opacity": 0.15
            },
            {
                "zoom": 4,
                "opacity": 0.15
            },
            {
                "zoom": 5,
                "opacity": 0.15
            },
            {
                "zoom": 6,
                "opacity": 0.25
            },
            {
                "zoom": 7,
                "opacity": 0.5
            },
            {
                "zoom": 8,
                "opacity": 0.47
            },
            {
                "zoom": 9,
                "opacity": 0.44
            },
            {
                "zoom": 10,
                "opacity": 0.41
            },
            {
                "zoom": 11,
                "opacity": 0.38
            },
            {
                "zoom": 12,
                "opacity": 0.35
            },
            {
                "zoom": 13,
                "opacity": 0.33
            },
            {
                "zoom": 14,
                "opacity": 0.3
            },
            {
                "zoom": 15,
                "opacity": 0.28
            },
            {
                "zoom": 16,
                "opacity": 0.25
            },
            {
                "zoom": 17,
                "opacity": 0.25
            },
            {
                "zoom": 18,
                "opacity": 0.25
            },
            {
                "zoom": 19,
                "opacity": 0.25
            },
            {
                "zoom": 20,
                "opacity": 0.25
            },
            {
                "zoom": 21,
                "opacity": 0.25
            }
        ]
    },
    {
        "tags": {
            "any": "admin",
            "none": [
                "country",
                "region",
                "locality",
                "district",
                "address"
            ]
        },
        "elements": "geometry.fill",
        "stylers": [
            {
                "color": "#ad9a85"
            },
            {
                "zoom": 0,
                "opacity": 0.5
            },
            {
                "zoom": 1,
                "opacity": 0.5
            },
            {
                "zoom": 2,
                "opacity": 0.5
            },
            {
                "zoom": 3,
                "opacity": 0.5
            },
            {
                "zoom": 4,
                "opacity": 0.5
            },
            {
                "zoom": 5,
                "opacity": 0.5
            },
            {
                "zoom": 6,
                "opacity": 1
            },
            {
                "zoom": 7,
                "opacity": 1
            },
            {
                "zoom": 8,
                "opacity": 1
            },
            {
                "zoom": 9,
                "opacity": 1
            },
            {
                "zoom": 10,
                "opacity": 1
            },
            {
                "zoom": 11,
                "opacity": 1
            },
            {
                "zoom": 12,
                "opacity": 1
            },
            {
                "zoom": 13,
                "opacity": 1
            },
            {
                "zoom": 14,
                "opacity": 1
            },
            {
                "zoom": 15,
                "opacity": 1
            },
            {
                "zoom": 16,
                "opacity": 1
            },
            {
                "zoom": 17,
                "opacity": 1
            },
            {
                "zoom": 18,
                "opacity": 1
            },
            {
                "zoom": 19,
                "opacity": 1
            },
            {
                "zoom": 20,
                "opacity": 1
            },
            {
                "zoom": 21,
                "opacity": 1
            }
        ]
    },
    {
        "tags": {
            "any": "admin",
            "none": [
                "country",
                "region",
                "locality",
                "district",
                "address"
            ]
        },
        "elements": "geometry.outline",
        "stylers": [
            {
                "color": "#e3ceb5"
            },
            {
                "zoom": 0,
                "opacity": 0.15
            },
            {
                "zoom": 1,
                "opacity": 0.15
            },
            {
                "zoom": 2,
                "opacity": 0.15
            },
            {
                "zoom": 3,
                "opacity": 0.15
            },
            {
                "zoom": 4,
                "opacity": 0.15
            },
            {
                "zoom": 5,
                "opacity": 0.15
            },
            {
                "zoom": 6,
                "opacity": 0.25
            },
            {
                "zoom": 7,
                "opacity": 0.5
            },
            {
                "zoom": 8,
                "opacity": 0.47
            },
            {
                "zoom": 9,
                "opacity": 0.44
            },
            {
                "zoom": 10,
                "opacity": 0.41
            },
            {
                "zoom": 11,
                "opacity": 0.38
            },
            {
                "zoom": 12,
                "opacity": 0.35
            },
            {
                "zoom": 13,
                "opacity": 0.33
            },
            {
                "zoom": 14,
                "opacity": 0.3
            },
            {
                "zoom": 15,
                "opacity": 0.28
            },
            {
                "zoom": 16,
                "opacity": 0.25
            },
            {
                "zoom": 17,
                "opacity": 0.25
            },
            {
                "zoom": 18,
                "opacity": 0.25
            },
            {
                "zoom": 19,
                "opacity": 0.25
            },
            {
                "zoom": 20,
                "opacity": 0.25
            },
            {
                "zoom": 21,
                "opacity": 0.25
            }
        ]
    },
    {
        "tags": {
            "any": "landcover",
            "none": "vegetation"
        },
        "stylers": [
            {
                "hue": "#e4ceb4"
            }
        ]
    },
    {
        "tags": "vegetation",
        "elements": "geometry",
        "stylers": [
            {
                "zoom": 0,
                "color": "#d6b58f",
                "opacity": 0.1
            },
            {
                "zoom": 1,
                "color": "#d6b58f",
                "opacity": 0.1
            },
            {
                "zoom": 2,
                "color": "#d6b58f",
                "opacity": 0.1
            },
            {
                "zoom": 3,
                "color": "#d6b58f",
                "opacity": 0.1
            },
            {
                "zoom": 4,
                "color": "#d6b58f",
                "opacity": 0.1
            },
            {
                "zoom": 5,
                "color": "#d6b58f",
                "opacity": 0.1
            },
            {
                "zoom": 6,
                "color": "#d6b58f",
                "opacity": 0.2
            },
            {
                "zoom": 7,
                "color": "#e4ceb4",
                "opacity": 0.3
            },
            {
                "zoom": 8,
                "color": "#e4ceb4",
                "opacity": 0.4
            },
            {
                "zoom": 9,
                "color": "#e4ceb4",
                "opacity": 0.6
            },
            {
                "zoom": 10,
                "color": "#e4ceb4",
                "opacity": 0.8
            },
            {
                "zoom": 11,
                "color": "#e4ceb4",
                "opacity": 1
            },
            {
                "zoom": 12,
                "color": "#e4ceb4",
                "opacity": 1
            },
            {
                "zoom": 13,
                "color": "#e4ceb4",
                "opacity": 1
            },
            {
                "zoom": 14,
                "color": "#e6d2bb",
                "opacity": 1
            },
            {
                "zoom": 15,
                "color": "#e9d7c3",
                "opacity": 1
            },
            {
                "zoom": 16,
                "color": "#e9d7c3",
                "opacity": 1
            },
            {
                "zoom": 17,
                "color": "#e9d7c3",
                "opacity": 1
            },
            {
                "zoom": 18,
                "color": "#e9d7c3",
                "opacity": 1
            },
            {
                "zoom": 19,
                "color": "#e9d7c3",
                "opacity": 1
            },
            {
                "zoom": 20,
                "color": "#e9d7c3",
                "opacity": 1
            },
            {
                "zoom": 21,
                "color": "#e9d7c3",
                "opacity": 1
            }
        ]
    },
    {
        "tags": "park",
        "elements": "geometry",
        "stylers": [
            {
                "zoom": 0,
                "color": "#e4ceb4",
                "opacity": 0.1
            },
            {
                "zoom": 1,
                "color": "#e4ceb4",
                "opacity": 0.1
            },
            {
                "zoom": 2,
                "color": "#e4ceb4",
                "opacity": 0.1
            },
            {
                "zoom": 3,
                "color": "#e4ceb4",
                "opacity": 0.1
            },
            {
                "zoom": 4,
                "color": "#e4ceb4",
                "opacity": 0.1
            },
            {
                "zoom": 5,
                "color": "#e4ceb4",
                "opacity": 0.1
            },
            {
                "zoom": 6,
                "color": "#e4ceb4",
                "opacity": 0.2
            },
            {
                "zoom": 7,
                "color": "#e4ceb4",
                "opacity": 0.3
            },
            {
                "zoom": 8,
                "color": "#e4ceb4",
                "opacity": 0.4
            },
            {
                "zoom": 9,
                "color": "#e4ceb4",
                "opacity": 0.6
            },
            {
                "zoom": 10,
                "color": "#e4ceb4",
                "opacity": 0.8
            },
            {
                "zoom": 11,
                "color": "#e4ceb4",
                "opacity": 1
            },
            {
                "zoom": 12,
                "color": "#e4ceb4",
                "opacity": 1
            },
            {
                "zoom": 13,
                "color": "#e4ceb4",
                "opacity": 1
            },
            {
                "zoom": 14,
                "color": "#e6d2bb",
                "opacity": 1
            },
            {
                "zoom": 15,
                "color": "#e9d7c3",
                "opacity": 1
            },
            {
                "zoom": 16,
                "color": "#e9d7c3",
                "opacity": 0.9
            },
            {
                "zoom": 17,
                "color": "#e9d7c3",
                "opacity": 0.8
            },
            {
                "zoom": 18,
                "color": "#e9d7c3",
                "opacity": 0.7
            },
            {
                "zoom": 19,
                "color": "#e9d7c3",
                "opacity": 0.7
            },
            {
                "zoom": 20,
                "color": "#e9d7c3",
                "opacity": 0.7
            },
            {
                "zoom": 21,
                "color": "#e9d7c3",
                "opacity": 0.7
            }
        ]
    },
    {
        "tags": "national_park",
        "elements": "geometry",
        "stylers": [
            {
                "zoom": 0,
                "color": "#e4ceb4",
                "opacity": 0.1
            },
            {
                "zoom": 1,
                "color": "#e4ceb4",
                "opacity": 0.1
            },
            {
                "zoom": 2,
                "color": "#e4ceb4",
                "opacity": 0.1
            },
            {
                "zoom": 3,
                "color": "#e4ceb4",
                "opacity": 0.1
            },
            {
                "zoom": 4,
                "color": "#e4ceb4",
                "opacity": 0.1
            },
            {
                "zoom": 5,
                "color": "#e4ceb4",
                "opacity": 0.1
            },
            {
                "zoom": 6,
                "color": "#e4ceb4",
                "opacity": 0.2
            },
            {
                "zoom": 7,
                "color": "#e4ceb4",
                "opacity": 0.3
            },
            {
                "zoom": 8,
                "color": "#e4ceb4",
                "opacity": 0.4
            },
            {
                "zoom": 9,
                "color": "#e4ceb4",
                "opacity": 0.6
            },
            {
                "zoom": 10,
                "color": "#e4ceb4",
                "opacity": 0.8
            },
            {
                "zoom": 11,
                "color": "#e4ceb4",
                "opacity": 1
            },
            {
                "zoom": 12,
                "color": "#e4ceb4",
                "opacity": 1
            },
            {
                "zoom": 13,
                "color": "#e4ceb4",
                "opacity": 1
            },
            {
                "zoom": 14,
                "color": "#e6d2bb",
                "opacity": 1
            },
            {
                "zoom": 15,
                "color": "#e9d7c3",
                "opacity": 1
            },
            {
                "zoom": 16,
                "color": "#e9d7c3",
                "opacity": 0.7
            },
            {
                "zoom": 17,
                "color": "#e9d7c3",
                "opacity": 0.7
            },
            {
                "zoom": 18,
                "color": "#e9d7c3",
                "opacity": 0.7
            },
            {
                "zoom": 19,
                "color": "#e9d7c3",
                "opacity": 0.7
            },
            {
                "zoom": 20,
                "color": "#e9d7c3",
                "opacity": 0.7
            },
            {
                "zoom": 21,
                "color": "#e9d7c3",
                "opacity": 0.7
            }
        ]
    },
    {
        "tags": "cemetery",
        "elements": "geometry",
        "stylers": [
            {
                "zoom": 0,
                "color": "#e4ceb4"
            },
            {
                "zoom": 1,
                "color": "#e4ceb4"
            },
            {
                "zoom": 2,
                "color": "#e4ceb4"
            },
            {
                "zoom": 3,
                "color": "#e4ceb4"
            },
            {
                "zoom": 4,
                "color": "#e4ceb4"
            },
            {
                "zoom": 5,
                "color": "#e4ceb4"
            },
            {
                "zoom": 6,
                "color": "#e4ceb4"
            },
            {
                "zoom": 7,
                "color": "#e4ceb4"
            },
            {
                "zoom": 8,
                "color": "#e4ceb4"
            },
            {
                "zoom": 9,
                "color": "#e4ceb4"
            },
            {
                "zoom": 10,
                "color": "#e4ceb4"
            },
            {
                "zoom": 11,
                "color": "#e4ceb4"
            },
            {
                "zoom": 12,
                "color": "#e4ceb4"
            },
            {
                "zoom": 13,
                "color": "#e4ceb4"
            },
            {
                "zoom": 14,
                "color": "#e6d2bb"
            },
            {
                "zoom": 15,
                "color": "#e9d7c3"
            },
            {
                "zoom": 16,
                "color": "#e9d7c3"
            },
            {
                "zoom": 17,
                "color": "#e9d7c3"
            },
            {
                "zoom": 18,
                "color": "#e9d7c3"
            },
            {
                "zoom": 19,
                "color": "#e9d7c3"
            },
            {
                "zoom": 20,
                "color": "#e9d7c3"
            },
            {
                "zoom": 21,
                "color": "#e9d7c3"
            }
        ]
    },
    {
        "tags": "sports_ground",
        "elements": "geometry",
        "stylers": [
            {
                "zoom": 0,
                "color": "#ddc1a1",
                "opacity": 0
            },
            {
                "zoom": 1,
                "color": "#ddc1a1",
                "opacity": 0
            },
            {
                "zoom": 2,
                "color": "#ddc1a1",
                "opacity": 0
            },
            {
                "zoom": 3,
                "color": "#ddc1a1",
                "opacity": 0
            },
            {
                "zoom": 4,
                "color": "#ddc1a1",
                "opacity": 0
            },
            {
                "zoom": 5,
                "color": "#ddc1a1",
                "opacity": 0
            },
            {
                "zoom": 6,
                "color": "#ddc1a1",
                "opacity": 0
            },
            {
                "zoom": 7,
                "color": "#ddc1a1",
                "opacity": 0
            },
            {
                "zoom": 8,
                "color": "#ddc1a1",
                "opacity": 0
            },
            {
                "zoom": 9,
                "color": "#ddc1a1",
                "opacity": 0
            },
            {
                "zoom": 10,
                "color": "#ddc1a1",
                "opacity": 0
            },
            {
                "zoom": 11,
                "color": "#ddc1a1",
                "opacity": 0
            },
            {
                "zoom": 12,
                "color": "#ddc1a1",
                "opacity": 0
            },
            {
                "zoom": 13,
                "color": "#ddc1a1",
                "opacity": 0
            },
            {
                "zoom": 14,
                "color": "#e0c6a8",
                "opacity": 0
            },
            {
                "zoom": 15,
                "color": "#e3cbb0",
                "opacity": 0.5
            },
            {
                "zoom": 16,
                "color": "#e3ccb1",
                "opacity": 1
            },
            {
                "zoom": 17,
                "color": "#e4cdb3",
                "opacity": 1
            },
            {
                "zoom": 18,
                "color": "#e4cdb4",
                "opacity": 1
            },
            {
                "zoom": 19,
                "color": "#e4ceb5",
                "opacity": 1
            },
            {
                "zoom": 20,
                "color": "#e5cfb7",
                "opacity": 1
            },
            {
                "zoom": 21,
                "color": "#e5d0b8",
                "opacity": 1
            }
        ]
    },
    {
        "tags": "terrain",
        "elements": "geometry",
        "stylers": [
            {
                "hue": "#efe4d7"
            },
            {
                "zoom": 0,
                "opacity": 0.3
            },
            {
                "zoom": 1,
                "opacity": 0.3
            },
            {
                "zoom": 2,
                "opacity": 0.3
            },
            {
                "zoom": 3,
                "opacity": 0.3
            },
            {
                "zoom": 4,
                "opacity": 0.3
            },
            {
                "zoom": 5,
                "opacity": 0.35
            },
            {
                "zoom": 6,
                "opacity": 0.4
            },
            {
                "zoom": 7,
                "opacity": 0.6
            },
            {
                "zoom": 8,
                "opacity": 0.8
            },
            {
                "zoom": 9,
                "opacity": 0.9
            },
            {
                "zoom": 10,
                "opacity": 1
            },
            {
                "zoom": 11,
                "opacity": 1
            },
            {
                "zoom": 12,
                "opacity": 1
            },
            {
                "zoom": 13,
                "opacity": 1
            },
            {
                "zoom": 14,
                "opacity": 1
            },
            {
                "zoom": 15,
                "opacity": 1
            },
            {
                "zoom": 16,
                "opacity": 1
            },
            {
                "zoom": 17,
                "opacity": 1
            },
            {
                "zoom": 18,
                "opacity": 1
            },
            {
                "zoom": 19,
                "opacity": 1
            },
            {
                "zoom": 20,
                "opacity": 1
            },
            {
                "zoom": 21,
                "opacity": 1
            }
        ]
    },
    {
        "tags": "geographic_line",
        "elements": "geometry",
        "stylers": [
            {
                "color": "#b48246"
            }
        ]
    },
    {
        "tags": "land",
        "elements": "geometry",
        "stylers": [
            {
                "zoom": 0,
                "color": "#efe5d7"
            },
            {
                "zoom": 1,
                "color": "#efe5d7"
            },
            {
                "zoom": 2,
                "color": "#efe5d7"
            },
            {
                "zoom": 3,
                "color": "#efe5d7"
            },
            {
                "zoom": 4,
                "color": "#efe5d7"
            },
            {
                "zoom": 5,
                "color": "#f0e7da"
            },
            {
                "zoom": 6,
                "color": "#f2e9de"
            },
            {
                "zoom": 7,
                "color": "#f3ece1"
            },
            {
                "zoom": 8,
                "color": "#f5eee5"
            },
            {
                "zoom": 9,
                "color": "#f5eee5"
            },
            {
                "zoom": 10,
                "color": "#f5eee5"
            },
            {
                "zoom": 11,
                "color": "#f5eee5"
            },
            {
                "zoom": 12,
                "color": "#f5eee5"
            },
            {
                "zoom": 13,
                "color": "#f5eee5"
            },
            {
                "zoom": 14,
                "color": "#f6f0e9"
            },
            {
                "zoom": 15,
                "color": "#f8f3ed"
            },
            {
                "zoom": 16,
                "color": "#f8f3ed"
            },
            {
                "zoom": 17,
                "color": "#f8f4ee"
            },
            {
                "zoom": 18,
                "color": "#f8f4ee"
            },
            {
                "zoom": 19,
                "color": "#f9f4ef"
            },
            {
                "zoom": 20,
                "color": "#f9f5ef"
            },
            {
                "zoom": 21,
                "color": "#f9f5f0"
            }
        ]
    },
    {
        "tags": "residential",
        "elements": "geometry",
        "stylers": [
            {
                "zoom": 0,
                "color": "#efe4d7",
                "opacity": 0.5
            },
            {
                "zoom": 1,
                "color": "#efe4d7",
                "opacity": 0.5
            },
            {
                "zoom": 2,
                "color": "#efe4d7",
                "opacity": 0.5
            },
            {
                "zoom": 3,
                "color": "#efe4d7",
                "opacity": 0.5
            },
            {
                "zoom": 4,
                "color": "#efe4d7",
                "opacity": 0.5
            },
            {
                "zoom": 5,
                "color": "#efe4d7",
                "opacity": 0.5
            },
            {
                "zoom": 6,
                "color": "#efe4d7",
                "opacity": 0.5
            },
            {
                "zoom": 7,
                "color": "#efe4d7",
                "opacity": 0.5
            },
            {
                "zoom": 8,
                "color": "#efe4d7",
                "opacity": 0.5
            },
            {
                "zoom": 9,
                "color": "#efe4d7",
                "opacity": 0.5
            },
            {
                "zoom": 10,
                "color": "#efe4d7",
                "opacity": 0.5
            },
            {
                "zoom": 11,
                "color": "#efe4d7",
                "opacity": 0.5
            },
            {
                "zoom": 12,
                "color": "#efe4d7",
                "opacity": 0.5
            },
            {
                "zoom": 13,
                "color": "#efe4d7",
                "opacity": 1
            },
            {
                "zoom": 14,
                "color": "#f2e9de",
                "opacity": 1
            },
            {
                "zoom": 15,
                "color": "#f5eee5",
                "opacity": 1
            },
            {
                "zoom": 16,
                "color": "#f5efe6",
                "opacity": 1
            },
            {
                "zoom": 17,
                "color": "#f6f0e8",
                "opacity": 1
            },
            {
                "zoom": 18,
                "color": "#f6f0e9",
                "opacity": 1
            },
            {
                "zoom": 19,
                "color": "#f7f1ea",
                "opacity": 1
            },
            {
                "zoom": 20,
                "color": "#f7f2ec",
                "opacity": 1
            },
            {
                "zoom": 21,
                "color": "#f8f3ed",
                "opacity": 1
            }
        ]
    },
    {
        "tags": "locality",
        "elements": "geometry",
        "stylers": [
            {
                "zoom": 0,
                "color": "#efe4d7"
            },
            {
                "zoom": 1,
                "color": "#efe4d7"
            },
            {
                "zoom": 2,
                "color": "#efe4d7"
            },
            {
                "zoom": 3,
                "color": "#efe4d7"
            },
            {
                "zoom": 4,
                "color": "#efe4d7"
            },
            {
                "zoom": 5,
                "color": "#efe4d7"
            },
            {
                "zoom": 6,
                "color": "#efe4d7"
            },
            {
                "zoom": 7,
                "color": "#efe4d7"
            },
            {
                "zoom": 8,
                "color": "#efe4d7"
            },
            {
                "zoom": 9,
                "color": "#efe4d7"
            },
            {
                "zoom": 10,
                "color": "#efe4d7"
            },
            {
                "zoom": 11,
                "color": "#efe4d7"
            },
            {
                "zoom": 12,
                "color": "#efe4d7"
            },
            {
                "zoom": 13,
                "color": "#efe4d7"
            },
            {
                "zoom": 14,
                "color": "#f2e9de"
            },
            {
                "zoom": 15,
                "color": "#f5eee5"
            },
            {
                "zoom": 16,
                "color": "#f5efe6"
            },
            {
                "zoom": 17,
                "color": "#f6f0e8"
            },
            {
                "zoom": 18,
                "color": "#f6f0e9"
            },
            {
                "zoom": 19,
                "color": "#f7f1ea"
            },
            {
                "zoom": 20,
                "color": "#f7f2ec"
            },
            {
                "zoom": 21,
                "color": "#f8f3ed"
            }
        ]
    },
    {
        "tags": {
            "any": "structure",
            "none": [
                "building",
                "fence"
            ]
        },
        "elements": "geometry",
        "stylers": [
            {
                "opacity": 0.9
            },
            {
                "zoom": 0,
                "color": "#efe4d7"
            },
            {
                "zoom": 1,
                "color": "#efe4d7"
            },
            {
                "zoom": 2,
                "color": "#efe4d7"
            },
            {
                "zoom": 3,
                "color": "#efe4d7"
            },
            {
                "zoom": 4,
                "color": "#efe4d7"
            },
            {
                "zoom": 5,
                "color": "#efe4d7"
            },
            {
                "zoom": 6,
                "color": "#efe4d7"
            },
            {
                "zoom": 7,
                "color": "#efe4d7"
            },
            {
                "zoom": 8,
                "color": "#efe4d7"
            },
            {
                "zoom": 9,
                "color": "#efe4d7"
            },
            {
                "zoom": 10,
                "color": "#efe4d7"
            },
            {
                "zoom": 11,
                "color": "#efe4d7"
            },
            {
                "zoom": 12,
                "color": "#efe4d7"
            },
            {
                "zoom": 13,
                "color": "#efe4d7"
            },
            {
                "zoom": 14,
                "color": "#f2e9de"
            },
            {
                "zoom": 15,
                "color": "#f5eee5"
            },
            {
                "zoom": 16,
                "color": "#f5efe6"
            },
            {
                "zoom": 17,
                "color": "#f6f0e8"
            },
            {
                "zoom": 18,
                "color": "#f6f0e9"
            },
            {
                "zoom": 19,
                "color": "#f7f1ea"
            },
            {
                "zoom": 20,
                "color": "#f7f2ec"
            },
            {
                "zoom": 21,
                "color": "#f8f3ed"
            }
        ]
    },
    {
        "tags": "building",
        "elements": "geometry.fill",
        "stylers": [
            {
                "color": "#e9d7c4"
            },
            {
                "zoom": 0,
                "opacity": 0.7
            },
            {
                "zoom": 1,
                "opacity": 0.7
            },
            {
                "zoom": 2,
                "opacity": 0.7
            },
            {
                "zoom": 3,
                "opacity": 0.7
            },
            {
                "zoom": 4,
                "opacity": 0.7
            },
            {
                "zoom": 5,
                "opacity": 0.7
            },
            {
                "zoom": 6,
                "opacity": 0.7
            },
            {
                "zoom": 7,
                "opacity": 0.7
            },
            {
                "zoom": 8,
                "opacity": 0.7
            },
            {
                "zoom": 9,
                "opacity": 0.7
            },
            {
                "zoom": 10,
                "opacity": 0.7
            },
            {
                "zoom": 11,
                "opacity": 0.7
            },
            {
                "zoom": 12,
                "opacity": 0.7
            },
            {
                "zoom": 13,
                "opacity": 0.7
            },
            {
                "zoom": 14,
                "opacity": 0.7
            },
            {
                "zoom": 15,
                "opacity": 0.7
            },
            {
                "zoom": 16,
                "opacity": 0.9
            },
            {
                "zoom": 17,
                "opacity": 0.6
            },
            {
                "zoom": 18,
                "opacity": 0.6
            },
            {
                "zoom": 19,
                "opacity": 0.6
            },
            {
                "zoom": 20,
                "opacity": 0.6
            },
            {
                "zoom": 21,
                "opacity": 0.6
            }
        ]
    },
    {
        "tags": "building",
        "elements": "geometry.outline",
        "stylers": [
            {
                "color": "#ddc5a6"
            },
            {
                "zoom": 0,
                "opacity": 0.5
            },
            {
                "zoom": 1,
                "opacity": 0.5
            },
            {
                "zoom": 2,
                "opacity": 0.5
            },
            {
                "zoom": 3,
                "opacity": 0.5
            },
            {
                "zoom": 4,
                "opacity": 0.5
            },
            {
                "zoom": 5,
                "opacity": 0.5
            },
            {
                "zoom": 6,
                "opacity": 0.5
            },
            {
                "zoom": 7,
                "opacity": 0.5
            },
            {
                "zoom": 8,
                "opacity": 0.5
            },
            {
                "zoom": 9,
                "opacity": 0.5
            },
            {
                "zoom": 10,
                "opacity": 0.5
            },
            {
                "zoom": 11,
                "opacity": 0.5
            },
            {
                "zoom": 12,
                "opacity": 0.5
            },
            {
                "zoom": 13,
                "opacity": 0.5
            },
            {
                "zoom": 14,
                "opacity": 0.5
            },
            {
                "zoom": 15,
                "opacity": 0.5
            },
            {
                "zoom": 16,
                "opacity": 0.5
            },
            {
                "zoom": 17,
                "opacity": 1
            },
            {
                "zoom": 18,
                "opacity": 1
            },
            {
                "zoom": 19,
                "opacity": 1
            },
            {
                "zoom": 20,
                "opacity": 1
            },
            {
                "zoom": 21,
                "opacity": 1
            }
        ]
    },
    {
        "tags": {
            "any": "urban_area",
            "none": [
                "residential",
                "industrial",
                "cemetery",
                "park",
                "medical",
                "sports_ground",
                "beach",
                "construction_site"
            ]
        },
        "elements": "geometry",
        "stylers": [
            {
                "zoom": 0,
                "color": "#eadac8",
                "opacity": 1
            },
            {
                "zoom": 1,
                "color": "#eadac8",
                "opacity": 1
            },
            {
                "zoom": 2,
                "color": "#eadac8",
                "opacity": 1
            },
            {
                "zoom": 3,
                "color": "#eadac8",
                "opacity": 1
            },
            {
                "zoom": 4,
                "color": "#eadac8",
                "opacity": 1
            },
            {
                "zoom": 5,
                "color": "#eadac8",
                "opacity": 1
            },
            {
                "zoom": 6,
                "color": "#eadac8",
                "opacity": 1
            },
            {
                "zoom": 7,
                "color": "#eadac8",
                "opacity": 1
            },
            {
                "zoom": 8,
                "color": "#eadac8",
                "opacity": 1
            },
            {
                "zoom": 9,
                "color": "#eadac8",
                "opacity": 1
            },
            {
                "zoom": 10,
                "color": "#eadac8",
                "opacity": 1
            },
            {
                "zoom": 11,
                "color": "#eadac8",
                "opacity": 1
            },
            {
                "zoom": 12,
                "color": "#eadac8",
                "opacity": 1
            },
            {
                "zoom": 13,
                "color": "#eadac8",
                "opacity": 1
            },
            {
                "zoom": 14,
                "color": "#ede0d1",
                "opacity": 1
            },
            {
                "zoom": 15,
                "color": "#f1e6da",
                "opacity": 1
            },
            {
                "zoom": 16,
                "color": "#f4ece3",
                "opacity": 0.67
            },
            {
                "zoom": 17,
                "color": "#f8f3ed",
                "opacity": 0.33
            },
            {
                "zoom": 18,
                "color": "#f8f3ed",
                "opacity": 0
            },
            {
                "zoom": 19,
                "color": "#f8f3ed",
                "opacity": 0
            },
            {
                "zoom": 20,
                "color": "#f8f3ed",
                "opacity": 0
            },
            {
                "zoom": 21,
                "color": "#f8f3ed",
                "opacity": 0
            }
        ]
    },
    {
        "tags": "poi",
        "elements": "label.icon",
        "stylers": [
            {
                "color": "#cda679"
            },
            {
                "secondary-color": "#ffffff"
            },
            {
                "tertiary-color": "#ffffff"
            }
        ]
    },
    {
        "tags": "poi",
        "elements": "label.text.fill",
        "stylers": [
            {
                "color": "#704f29"
            }
        ]
    },
    {
        "tags": "poi",
        "elements": "label.text.outline",
        "stylers": [
            {
                "color": "#ffffff"
            },
            {
                "opacity": 0.5
            }
        ]
    },
    {
        "tags": "outdoor",
        "elements": "label.icon",
        "stylers": [
            {
                "color": "#cda679"
            },
            {
                "secondary-color": "#ffffff"
            },
            {
                "tertiary-color": "#ffffff"
            }
        ]
    },
    {
        "tags": "outdoor",
        "elements": "label.text.fill",
        "stylers": [
            {
                "color": "#704f29"
            }
        ]
    },
    {
        "tags": "outdoor",
        "elements": "label.text.outline",
        "stylers": [
            {
                "color": "#ffffff"
            },
            {
                "opacity": 0.5
            }
        ]
    },
    {
        "tags": "park",
        "elements": "label.icon",
        "stylers": [
            {
                "color": "#cda679"
            },
            {
                "secondary-color": "#ffffff"
            },
            {
                "tertiary-color": "#ffffff"
            }
        ]
    },
    {
        "tags": "park",
        "elements": "label.text.fill",
        "stylers": [
            {
                "color": "#704f29"
            }
        ]
    },
    {
        "tags": "park",
        "elements": "label.text.outline",
        "stylers": [
            {
                "color": "#ffffff"
            },
            {
                "opacity": 0.5
            }
        ]
    },
    {
        "tags": "cemetery",
        "elements": "label.icon",
        "stylers": [
            {
                "color": "#cda679"
            },
            {
                "secondary-color": "#ffffff"
            },
            {
                "tertiary-color": "#ffffff"
            }
        ]
    },
    {
        "tags": "cemetery",
        "elements": "label.text.fill",
        "stylers": [
            {
                "color": "#704f29"
            }
        ]
    },
    {
        "tags": "cemetery",
        "elements": "label.text.outline",
        "stylers": [
            {
                "color": "#ffffff"
            },
            {
                "opacity": 0.5
            }
        ]
    },
    {
        "tags": "beach",
        "elements": "label.icon",
        "stylers": [
            {
                "color": "#cda679"
            },
            {
                "secondary-color": "#ffffff"
            },
            {
                "tertiary-color": "#ffffff"
            }
        ]
    },
    {
        "tags": "beach",
        "elements": "label.text.fill",
        "stylers": [
            {
                "color": "#704f29"
            }
        ]
    },
    {
        "tags": "beach",
        "elements": "label.text.outline",
        "stylers": [
            {
                "color": "#ffffff"
            },
            {
                "opacity": 0.5
            }
        ]
    },
    {
        "tags": "medical",
        "elements": "label.icon",
        "stylers": [
            {
                "color": "#cda679"
            },
            {
                "secondary-color": "#ffffff"
            },
            {
                "tertiary-color": "#ffffff"
            }
        ]
    },
    {
        "tags": "medical",
        "elements": "label.text.fill",
        "stylers": [
            {
                "color": "#704f29"
            }
        ]
    },
    {
        "tags": "medical",
        "elements": "label.text.outline",
        "stylers": [
            {
                "color": "#ffffff"
            },
            {
                "opacity": 0.5
            }
        ]
    },
    {
        "tags": "shopping",
        "elements": "label.icon",
        "stylers": [
            {
                "color": "#cda679"
            },
            {
                "secondary-color": "#ffffff"
            },
            {
                "tertiary-color": "#ffffff"
            }
        ]
    },
    {
        "tags": "shopping",
        "elements": "label.text.fill",
        "stylers": [
            {
                "color": "#704f29"
            }
        ]
    },
    {
        "tags": "shopping",
        "elements": "label.text.outline",
        "stylers": [
            {
                "color": "#ffffff"
            },
            {
                "opacity": 0.5
            }
        ]
    },
    {
        "tags": "commercial_services",
        "elements": "label.icon",
        "stylers": [
            {
                "color": "#cda679"
            },
            {
                "secondary-color": "#ffffff"
            },
            {
                "tertiary-color": "#ffffff"
            }
        ]
    },
    {
        "tags": "commercial_services",
        "elements": "label.text.fill",
        "stylers": [
            {
                "color": "#704f29"
            }
        ]
    },
    {
        "tags": "commercial_services",
        "elements": "label.text.outline",
        "stylers": [
            {
                "color": "#ffffff"
            },
            {
                "opacity": 0.5
            }
        ]
    },
    {
        "tags": "food_and_drink",
        "elements": "label.icon",
        "stylers": [
            {
                "color": "#cda679"
            },
            {
                "secondary-color": "#ffffff"
            },
            {
                "tertiary-color": "#ffffff"
            }
        ]
    },
    {
        "tags": "food_and_drink",
        "elements": "label.text.fill",
        "stylers": [
            {
                "color": "#704f29"
            }
        ]
    },
    {
        "tags": "food_and_drink",
        "elements": "label.text.outline",
        "stylers": [
            {
                "color": "#ffffff"
            },
            {
                "opacity": 0.5
            }
        ]
    },
    {
        "tags": "road",
        "elements": "label.icon",
        "types": "point",
        "stylers": [
            {
                "color": "#cda679"
            },
            {
                "secondary-color": "#ffffff"
            },
            {
                "tertiary-color": "#ffffff"
            }
        ]
    },
    {
        "tags": "road",
        "elements": "label.text.fill",
        "types": "point",
        "stylers": [
            {
                "color": "#ffffff"
            }
        ]
    },
    {
        "tags": "entrance",
        "elements": "label.icon",
        "stylers": [
            {
                "color": "#cda679"
            },
            {
                "secondary-color": "#ffffff"
            },
            {
                "hue": "#cda679"
            }
        ]
    },
    {
        "tags": "locality",
        "elements": "label.icon",
        "stylers": [
            {
                "color": "#cda679"
            },
            {
                "secondary-color": "#ffffff"
            }
        ]
    },
    {
        "tags": "country",
        "elements": "label.text.fill",
        "stylers": [
            {
                "opacity": 0.8
            },
            {
                "color": "#a8763e"
            }
        ]
    },
    {
        "tags": "country",
        "elements": "label.text.outline",
        "stylers": [
            {
                "color": "#ffffff"
            },
            {
                "opacity": 0.5
            }
        ]
    },
    {
        "tags": "region",
        "elements": "label.text.fill",
        "stylers": [
            {
                "color": "#a8763e"
            },
            {
                "opacity": 0.8
            }
        ]
    },
    {
        "tags": "region",
        "elements": "label.text.outline",
        "stylers": [
            {
                "color": "#ffffff"
            },
            {
                "opacity": 0.5
            }
        ]
    },
    {
        "tags": "district",
        "elements": "label.text.fill",
        "stylers": [
            {
                "color": "#a8763e"
            },
            {
                "opacity": 0.8
            }
        ]
    },
    {
        "tags": "district",
        "elements": "label.text.outline",
        "stylers": [
            {
                "color": "#ffffff"
            },
            {
                "opacity": 0.5
            }
        ]
    },
    {
        "tags": {
            "any": "admin",
            "none": [
                "country",
                "region",
                "locality",
                "district",
                "address"
            ]
        },
        "elements": "label.text.fill",
        "stylers": [
            {
                "color": "#a8763e"
            }
        ]
    },
    {
        "tags": {
            "any": "admin",
            "none": [
                "country",
                "region",
                "locality",
                "district",
                "address"
            ]
        },
        "elements": "label.text.outline",
        "stylers": [
            {
                "color": "#ffffff"
            },
            {
                "opacity": 0.5
            }
        ]
    },
    {
        "tags": "locality",
        "elements": "label.text.fill",
        "stylers": [
            {
                "zoom": 0,
                "color": "#704f29"
            },
            {
                "zoom": 1,
                "color": "#704f29"
            },
            {
                "zoom": 2,
                "color": "#704f29"
            },
            {
                "zoom": 3,
                "color": "#704f29"
            },
            {
                "zoom": 4,
                "color": "#704f29"
            },
            {
                "zoom": 5,
                "color": "#6d4d28"
            },
            {
                "zoom": 6,
                "color": "#6a4b27"
            },
            {
                "zoom": 7,
                "color": "#674926"
            },
            {
                "zoom": 8,
                "color": "#634624"
            },
            {
                "zoom": 9,
                "color": "#604423"
            },
            {
                "zoom": 10,
                "color": "#5d4222"
            },
            {
                "zoom": 11,
                "color": "#5d4222"
            },
            {
                "zoom": 12,
                "color": "#5d4222"
            },
            {
                "zoom": 13,
                "color": "#5d4222"
            },
            {
                "zoom": 14,
                "color": "#5d4222"
            },
            {
                "zoom": 15,
                "color": "#5d4222"
            },
            {
                "zoom": 16,
                "color": "#5d4222"
            },
            {
                "zoom": 17,
                "color": "#5d4222"
            },
            {
                "zoom": 18,
                "color": "#5d4222"
            },
            {
                "zoom": 19,
                "color": "#5d4222"
            },
            {
                "zoom": 20,
                "color": "#5d4222"
            },
            {
                "zoom": 21,
                "color": "#5d4222"
            }
        ]
    },
    {
        "tags": "locality",
        "elements": "label.text.outline",
        "stylers": [
            {
                "color": "#ffffff"
            },
            {
                "opacity": 0.5
            }
        ]
    },
    {
        "tags": "road",
        "elements": "label.text.fill",
        "types": "polyline",
        "stylers": [
            {
                "color": "#825c30"
            }
        ]
    },
    {
        "tags": "road",
        "elements": "label.text.outline",
        "types": "polyline",
        "stylers": [
            {
                "color": "#ffffff"
            },
            {
                "opacity": 0.5
            }
        ]
    },
    {
        "tags": "road",
        "elements": "geometry.fill.pattern",
        "types": "polyline",
        "stylers": [
            {
                "scale": 1
            },
            {
                "color": "#c19057"
            }
        ]
    },
    {
        "tags": "road",
        "elements": "label.text.fill",
        "types": "point",
        "stylers": [
            {
                "color": "#ffffff"
            }
        ]
    },
    {
        "tags": "structure",
        "elements": "label.text.fill",
        "stylers": [
            {
                "color": "#936a39"
            },
            {
                "opacity": 0.5
            }
        ]
    },
    {
        "tags": "structure",
        "elements": "label.text.outline",
        "stylers": [
            {
                "color": "#ffffff"
            },
            {
                "opacity": 0.5
            }
        ]
    },
    {
        "tags": "address",
        "elements": "label.text.fill",
        "stylers": [
            {
                "color": "#936a39"
            },
            {
                "zoom": 0,
                "opacity": 0.9
            },
            {
                "zoom": 1,
                "opacity": 0.9
            },
            {
                "zoom": 2,
                "opacity": 0.9
            },
            {
                "zoom": 3,
                "opacity": 0.9
            },
            {
                "zoom": 4,
                "opacity": 0.9
            },
            {
                "zoom": 5,
                "opacity": 0.9
            },
            {
                "zoom": 6,
                "opacity": 0.9
            },
            {
                "zoom": 7,
                "opacity": 0.9
            },
            {
                "zoom": 8,
                "opacity": 0.9
            },
            {
                "zoom": 9,
                "opacity": 0.9
            },
            {
                "zoom": 10,
                "opacity": 0.9
            },
            {
                "zoom": 11,
                "opacity": 0.9
            },
            {
                "zoom": 12,
                "opacity": 0.9
            },
            {
                "zoom": 13,
                "opacity": 0.9
            },
            {
                "zoom": 14,
                "opacity": 0.9
            },
            {
                "zoom": 15,
                "opacity": 0.9
            },
            {
                "zoom": 16,
                "opacity": 0.9
            },
            {
                "zoom": 17,
                "opacity": 1
            },
            {
                "zoom": 18,
                "opacity": 1
            },
            {
                "zoom": 19,
                "opacity": 1
            },
            {
                "zoom": 20,
                "opacity": 1
            },
            {
                "zoom": 21,
                "opacity": 1
            }
        ]
    },
    {
        "tags": "address",
        "elements": "label.text.outline",
        "stylers": [
            {
                "color": "#ffffff"
            },
            {
                "opacity": 0.5
            }
        ]
    },
    {
        "tags": "landscape",
        "elements": "label.text.fill",
        "stylers": [
            {
                "zoom": 0,
                "color": "#a8763e",
                "opacity": 1
            },
            {
                "zoom": 1,
                "color": "#a8763e",
                "opacity": 1
            },
            {
                "zoom": 2,
                "color": "#a8763e",
                "opacity": 1
            },
            {
                "zoom": 3,
                "color": "#a8763e",
                "opacity": 1
            },
            {
                "zoom": 4,
                "color": "#936a39",
                "opacity": 0.5
            },
            {
                "zoom": 5,
                "color": "#936a39",
                "opacity": 0.5
            },
            {
                "zoom": 6,
                "color": "#936a39",
                "opacity": 0.5
            },
            {
                "zoom": 7,
                "color": "#936a39",
                "opacity": 0.5
            },
            {
                "zoom": 8,
                "color": "#936a39",
                "opacity": 0.5
            },
            {
                "zoom": 9,
                "color": "#936a39",
                "opacity": 0.5
            },
            {
                "zoom": 10,
                "color": "#936a39",
                "opacity": 0.5
            },
            {
                "zoom": 11,
                "color": "#936a39",
                "opacity": 0.5
            },
            {
                "zoom": 12,
                "color": "#936a39",
                "opacity": 0.5
            },
            {
                "zoom": 13,
                "color": "#936a39",
                "opacity": 0.5
            },
            {
                "zoom": 14,
                "color": "#936a39",
                "opacity": 0.5
            },
            {
                "zoom": 15,
                "color": "#936a39",
                "opacity": 0.5
            },
            {
                "zoom": 16,
                "color": "#936a39",
                "opacity": 0.5
            },
            {
                "zoom": 17,
                "color": "#936a39",
                "opacity": 0.5
            },
            {
                "zoom": 18,
                "color": "#936a39",
                "opacity": 0.5
            },
            {
                "zoom": 19,
                "color": "#936a39",
                "opacity": 0.5
            },
            {
                "zoom": 20,
                "color": "#936a39",
                "opacity": 0.5
            },
            {
                "zoom": 21,
                "color": "#936a39",
                "opacity": 0.5
            }
        ]
    },
    {
        "tags": "landscape",
        "elements": "label.text.outline",
        "stylers": [
            {
                "color": "#ffffff"
            },
            {
                "zoom": 0,
                "opacity": 0.5
            },
            {
                "zoom": 1,
                "opacity": 0.5
            },
            {
                "zoom": 2,
                "opacity": 0.5
            },
            {
                "zoom": 3,
                "opacity": 0.5
            },
            {
                "zoom": 4,
                "opacity": 0
            },
            {
                "zoom": 5,
                "opacity": 0
            },
            {
                "zoom": 6,
                "opacity": 0
            },
            {
                "zoom": 7,
                "opacity": 0
            },
            {
                "zoom": 8,
                "opacity": 0
            },
            {
                "zoom": 9,
                "opacity": 0
            },
            {
                "zoom": 10,
                "opacity": 0
            },
            {
                "zoom": 11,
                "opacity": 0
            },
            {
                "zoom": 12,
                "opacity": 0
            },
            {
                "zoom": 13,
                "opacity": 0
            },
            {
                "zoom": 14,
                "opacity": 0
            },
            {
                "zoom": 15,
                "opacity": 0
            },
            {
                "zoom": 16,
                "opacity": 0
            },
            {
                "zoom": 17,
                "opacity": 0
            },
            {
                "zoom": 18,
                "opacity": 0
            },
            {
                "zoom": 19,
                "opacity": 0
            },
            {
                "zoom": 20,
                "opacity": 0
            },
            {
                "zoom": 21,
                "opacity": 0
            }
        ]
    },
    {
        "tags": "water",
        "elements": "label.text.fill",
        "stylers": [
            {
                "color": "#8d6434"
            },
            {
                "opacity": 0.8
            }
        ]
    },
    {
        "tags": "water",
        "elements": "label.text.outline",
        "types": "polyline",
        "stylers": [
            {
                "color": "#ffffff"
            },
            {
                "opacity": 0.2
            }
        ]
    },
    {
        "tags": {
            "any": "road_1",
            "none": "is_tunnel"
        },
        "elements": "geometry.fill",
        "stylers": [
            {
                "color": "#ffffff"
            },
            {
                "zoom": 0,
                "scale": 0
            },
            {
                "zoom": 1,
                "scale": 0
            },
            {
                "zoom": 2,
                "scale": 0
            },
            {
                "zoom": 3,
                "scale": 0
            },
            {
                "zoom": 4,
                "scale": 0
            },
            {
                "zoom": 5,
                "scale": 0
            },
            {
                "zoom": 6,
                "scale": 2.97
            },
            {
                "zoom": 7,
                "scale": 3.19
            },
            {
                "zoom": 8,
                "scale": 3.53
            },
            {
                "zoom": 9,
                "scale": 4
            },
            {
                "zoom": 10,
                "scale": 3.61
            },
            {
                "zoom": 11,
                "scale": 3.06
            },
            {
                "zoom": 12,
                "scale": 2.64
            },
            {
                "zoom": 13,
                "scale": 2.27
            },
            {
                "zoom": 14,
                "scale": 2.03
            },
            {
                "zoom": 15,
                "scale": 1.9
            },
            {
                "zoom": 16,
                "scale": 1.86
            },
            {
                "zoom": 17,
                "scale": 1.48
            },
            {
                "zoom": 18,
                "scale": 1.21
            },
            {
                "zoom": 19,
                "scale": 1.04
            },
            {
                "zoom": 20,
                "scale": 0.94
            },
            {
                "zoom": 21,
                "scale": 0.9
            }
        ]
    },
    {
        "tags": {
            "any": "road_1"
        },
        "elements": "geometry.outline",
        "stylers": [
            {
                "zoom": 0,
                "color": "#00000000",
                "scale": 1.4
            },
            {
                "zoom": 1,
                "color": "#00000000",
                "scale": 1.4
            },
            {
                "zoom": 2,
                "color": "#00000000",
                "scale": 1.4
            },
            {
                "zoom": 3,
                "color": "#00000000",
                "scale": 1.4
            },
            {
                "zoom": 4,
                "color": "#00000000",
                "scale": 1.4
            },
            {
                "zoom": 5,
                "color": "#00000000",
                "scale": 1.4
            },
            {
                "zoom": 6,
                "color": "#00000000",
                "scale": 3.05
            },
            {
                "zoom": 7,
                "color": "#00000000",
                "scale": 3.05
            },
            {
                "zoom": 8,
                "color": "#ecdfd0",
                "scale": 3.15
            },
            {
                "zoom": 9,
                "color": "#efe4d7",
                "scale": 3.37
            },
            {
                "zoom": 10,
                "color": "#efe4d7",
                "scale": 3.36
            },
            {
                "zoom": 11,
                "color": "#efe4d7",
                "scale": 3.17
            },
            {
                "zoom": 12,
                "color": "#efe4d7",
                "scale": 3
            },
            {
                "zoom": 13,
                "color": "#efe4d7",
                "scale": 2.8
            },
            {
                "zoom": 14,
                "color": "#f2e9de",
                "scale": 2.66
            },
            {
                "zoom": 15,
                "color": "#f2e9de",
                "scale": 2.61
            },
            {
                "zoom": 16,
                "color": "#f3ebe1",
                "scale": 2.64
            },
            {
                "zoom": 17,
                "color": "#f4ece3",
                "scale": 2.14
            },
            {
                "zoom": 18,
                "color": "#f5eee6",
                "scale": 1.79
            },
            {
                "zoom": 19,
                "color": "#f6f0e9",
                "scale": 1.55
            },
            {
                "zoom": 20,
                "color": "#f7f1eb",
                "scale": 1.41
            },
            {
                "zoom": 21,
                "color": "#f8f3ed",
                "scale": 1.35
            }
        ]
    },
    {
        "tags": {
            "any": "road_2",
            "none": "is_tunnel"
        },
        "elements": "geometry.fill",
        "stylers": [
            {
                "color": "#ffffff"
            },
            {
                "zoom": 0,
                "scale": 0
            },
            {
                "zoom": 1,
                "scale": 0
            },
            {
                "zoom": 2,
                "scale": 0
            },
            {
                "zoom": 3,
                "scale": 0
            },
            {
                "zoom": 4,
                "scale": 0
            },
            {
                "zoom": 5,
                "scale": 0
            },
            {
                "zoom": 6,
                "scale": 2.97
            },
            {
                "zoom": 7,
                "scale": 3.19
            },
            {
                "zoom": 8,
                "scale": 3.53
            },
            {
                "zoom": 9,
                "scale": 4
            },
            {
                "zoom": 10,
                "scale": 3.61
            },
            {
                "zoom": 11,
                "scale": 3.06
            },
            {
                "zoom": 12,
                "scale": 2.64
            },
            {
                "zoom": 13,
                "scale": 2.27
            },
            {
                "zoom": 14,
                "scale": 2.03
            },
            {
                "zoom": 15,
                "scale": 1.9
            },
            {
                "zoom": 16,
                "scale": 1.86
            },
            {
                "zoom": 17,
                "scale": 1.48
            },
            {
                "zoom": 18,
                "scale": 1.21
            },
            {
                "zoom": 19,
                "scale": 1.04
            },
            {
                "zoom": 20,
                "scale": 0.94
            },
            {
                "zoom": 21,
                "scale": 0.9
            }
        ]
    },
    {
        "tags": {
            "any": "road_2"
        },
        "elements": "geometry.outline",
        "stylers": [
            {
                "zoom": 0,
                "color": "#00000000",
                "scale": 1.4
            },
            {
                "zoom": 1,
                "color": "#00000000",
                "scale": 1.4
            },
            {
                "zoom": 2,
                "color": "#00000000",
                "scale": 1.4
            },
            {
                "zoom": 3,
                "color": "#00000000",
                "scale": 1.4
            },
            {
                "zoom": 4,
                "color": "#00000000",
                "scale": 1.4
            },
            {
                "zoom": 5,
                "color": "#00000000",
                "scale": 1.4
            },
            {
                "zoom": 6,
                "color": "#00000000",
                "scale": 3.05
            },
            {
                "zoom": 7,
                "color": "#00000000",
                "scale": 3.05
            },
            {
                "zoom": 8,
                "color": "#ecdfd0",
                "scale": 3.15
            },
            {
                "zoom": 9,
                "color": "#efe4d7",
                "scale": 3.37
            },
            {
                "zoom": 10,
                "color": "#efe4d7",
                "scale": 3.36
            },
            {
                "zoom": 11,
                "color": "#efe4d7",
                "scale": 3.17
            },
            {
                "zoom": 12,
                "color": "#efe4d7",
                "scale": 3
            },
            {
                "zoom": 13,
                "color": "#efe4d7",
                "scale": 2.8
            },
            {
                "zoom": 14,
                "color": "#f2e9de",
                "scale": 2.66
            },
            {
                "zoom": 15,
                "color": "#f2e9de",
                "scale": 2.61
            },
            {
                "zoom": 16,
                "color": "#f3ebe1",
                "scale": 2.64
            },
            {
                "zoom": 17,
                "color": "#f4ece3",
                "scale": 2.14
            },
            {
                "zoom": 18,
                "color": "#f5eee6",
                "scale": 1.79
            },
            {
                "zoom": 19,
                "color": "#f6f0e9",
                "scale": 1.55
            },
            {
                "zoom": 20,
                "color": "#f7f1eb",
                "scale": 1.41
            },
            {
                "zoom": 21,
                "color": "#f8f3ed",
                "scale": 1.35
            }
        ]
    },
    {
        "tags": {
            "any": "road_3",
            "none": "is_tunnel"
        },
        "elements": "geometry.fill",
        "stylers": [
            {
                "color": "#ffffff"
            },
            {
                "zoom": 0,
                "scale": 0
            },
            {
                "zoom": 1,
                "scale": 0
            },
            {
                "zoom": 2,
                "scale": 0
            },
            {
                "zoom": 3,
                "scale": 0
            },
            {
                "zoom": 4,
                "scale": 0
            },
            {
                "zoom": 5,
                "scale": 0
            },
            {
                "zoom": 6,
                "scale": 0
            },
            {
                "zoom": 7,
                "scale": 0
            },
            {
                "zoom": 8,
                "scale": 0
            },
            {
                "zoom": 9,
                "scale": 2.51
            },
            {
                "zoom": 10,
                "scale": 2.62
            },
            {
                "zoom": 11,
                "scale": 1.68
            },
            {
                "zoom": 12,
                "scale": 1.67
            },
            {
                "zoom": 13,
                "scale": 1.38
            },
            {
                "zoom": 14,
                "scale": 1.19
            },
            {
                "zoom": 15,
                "scale": 1.08
            },
            {
                "zoom": 16,
                "scale": 1.04
            },
            {
                "zoom": 17,
                "scale": 0.91
            },
            {
                "zoom": 18,
                "scale": 0.84
            },
            {
                "zoom": 19,
                "scale": 0.82
            },
            {
                "zoom": 20,
                "scale": 0.84
            },
            {
                "zoom": 21,
                "scale": 0.9
            }
        ]
    },
    {
        "tags": {
            "any": "road_3"
        },
        "elements": "geometry.outline",
        "stylers": [
            {
                "zoom": 0,
                "color": "#ffffff",
                "scale": 1.6
            },
            {
                "zoom": 1,
                "color": "#ffffff",
                "scale": 1.6
            },
            {
                "zoom": 2,
                "color": "#ffffff",
                "scale": 1.6
            },
            {
                "zoom": 3,
                "color": "#ffffff",
                "scale": 1.6
            },
            {
                "zoom": 4,
                "color": "#ffffff",
                "scale": 1.6
            },
            {
                "zoom": 5,
                "color": "#ffffff",
                "scale": 1.6
            },
            {
                "zoom": 6,
                "color": "#ffffff",
                "scale": 1.6
            },
            {
                "zoom": 7,
                "color": "#ffffff",
                "scale": 1.6
            },
            {
                "zoom": 8,
                "color": "#ffffff",
                "scale": 1.29
            },
            {
                "zoom": 9,
                "color": "#efe4d7",
                "scale": 4.21
            },
            {
                "zoom": 10,
                "color": "#efe4d7",
                "scale": 2.74
            },
            {
                "zoom": 11,
                "color": "#efe4d7",
                "scale": 2.04
            },
            {
                "zoom": 12,
                "color": "#efe4d7",
                "scale": 2.13
            },
            {
                "zoom": 13,
                "color": "#efe4d7",
                "scale": 1.88
            },
            {
                "zoom": 14,
                "color": "#f2e9de",
                "scale": 1.7
            },
            {
                "zoom": 15,
                "color": "#f2e9de",
                "scale": 1.59
            },
            {
                "zoom": 16,
                "color": "#f3ebe1",
                "scale": 1.55
            },
            {
                "zoom": 17,
                "color": "#f4ece3",
                "scale": 1.37
            },
            {
                "zoom": 18,
                "color": "#f5eee6",
                "scale": 1.27
            },
            {
                "zoom": 19,
                "color": "#f6f0e9",
                "scale": 1.23
            },
            {
                "zoom": 20,
                "color": "#f7f1eb",
                "scale": 1.26
            },
            {
                "zoom": 21,
                "color": "#f8f3ed",
                "scale": 1.35
            }
        ]
    },
    {
        "tags": {
            "any": "road_4",
            "none": "is_tunnel"
        },
        "elements": "geometry.fill",
        "stylers": [
            {
                "color": "#ffffff"
            },
            {
                "zoom": 0,
                "scale": 0
            },
            {
                "zoom": 1,
                "scale": 0
            },
            {
                "zoom": 2,
                "scale": 0
            },
            {
                "zoom": 3,
                "scale": 0
            },
            {
                "zoom": 4,
                "scale": 0
            },
            {
                "zoom": 5,
                "scale": 0
            },
            {
                "zoom": 6,
                "scale": 0
            },
            {
                "zoom": 7,
                "scale": 0
            },
            {
                "zoom": 8,
                "scale": 0
            },
            {
                "zoom": 9,
                "scale": 0
            },
            {
                "zoom": 10,
                "scale": 1.69
            },
            {
                "zoom": 11,
                "scale": 1.26
            },
            {
                "zoom": 12,
                "scale": 1.41
            },
            {
                "zoom": 13,
                "scale": 1.19
            },
            {
                "zoom": 14,
                "scale": 1.04
            },
            {
                "zoom": 15,
                "scale": 0.97
            },
            {
                "zoom": 16,
                "scale": 1.15
            },
            {
                "zoom": 17,
                "scale": 0.99
            },
            {
                "zoom": 18,
                "scale": 0.89
            },
            {
                "zoom": 19,
                "scale": 0.85
            },
            {
                "zoom": 20,
                "scale": 0.85
            },
            {
                "zoom": 21,
                "scale": 0.9
            }
        ]
    },
    {
        "tags": {
            "any": "road_4"
        },
        "elements": "geometry.outline",
        "stylers": [
            {
                "zoom": 0,
                "color": "#ffffff",
                "scale": 1.4
            },
            {
                "zoom": 1,
                "color": "#ffffff",
                "scale": 1.4
            },
            {
                "zoom": 2,
                "color": "#ffffff",
                "scale": 1.4
            },
            {
                "zoom": 3,
                "color": "#ffffff",
                "scale": 1.4
            },
            {
                "zoom": 4,
                "color": "#ffffff",
                "scale": 1.4
            },
            {
                "zoom": 5,
                "color": "#ffffff",
                "scale": 1.4
            },
            {
                "zoom": 6,
                "color": "#ffffff",
                "scale": 1.4
            },
            {
                "zoom": 7,
                "color": "#ffffff",
                "scale": 1.4
            },
            {
                "zoom": 8,
                "color": "#ffffff",
                "scale": 1.4
            },
            {
                "zoom": 9,
                "color": "#ffffff",
                "scale": 1.12
            },
            {
                "zoom": 10,
                "color": "#efe4d7",
                "scale": 1.9
            },
            {
                "zoom": 11,
                "color": "#efe4d7",
                "scale": 1.62
            },
            {
                "zoom": 12,
                "color": "#efe4d7",
                "scale": 1.83
            },
            {
                "zoom": 13,
                "color": "#efe4d7",
                "scale": 1.64
            },
            {
                "zoom": 14,
                "color": "#f2e9de",
                "scale": 1.51
            },
            {
                "zoom": 15,
                "color": "#f2e9de",
                "scale": 1.44
            },
            {
                "zoom": 16,
                "color": "#f3ebe1",
                "scale": 1.69
            },
            {
                "zoom": 17,
                "color": "#f4ece3",
                "scale": 1.47
            },
            {
                "zoom": 18,
                "color": "#f5eee6",
                "scale": 1.34
            },
            {
                "zoom": 19,
                "color": "#f6f0e9",
                "scale": 1.28
            },
            {
                "zoom": 20,
                "color": "#f7f1eb",
                "scale": 1.28
            },
            {
                "zoom": 21,
                "color": "#f8f3ed",
                "scale": 1.34
            }
        ]
    },
    {
        "tags": {
            "any": "road_5",
            "none": "is_tunnel"
        },
        "elements": "geometry.fill",
        "stylers": [
            {
                "color": "#ffffff"
            },
            {
                "zoom": 0,
                "scale": 0
            },
            {
                "zoom": 1,
                "scale": 0
            },
            {
                "zoom": 2,
                "scale": 0
            },
            {
                "zoom": 3,
                "scale": 0
            },
            {
                "zoom": 4,
                "scale": 0
            },
            {
                "zoom": 5,
                "scale": 0
            },
            {
                "zoom": 6,
                "scale": 0
            },
            {
                "zoom": 7,
                "scale": 0
            },
            {
                "zoom": 8,
                "scale": 0
            },
            {
                "zoom": 9,
                "scale": 0
            },
            {
                "zoom": 10,
                "scale": 0
            },
            {
                "zoom": 11,
                "scale": 0
            },
            {
                "zoom": 12,
                "scale": 1.25
            },
            {
                "zoom": 13,
                "scale": 0.95
            },
            {
                "zoom": 14,
                "scale": 0.81
            },
            {
                "zoom": 15,
                "scale": 0.95
            },
            {
                "zoom": 16,
                "scale": 1.1
            },
            {
                "zoom": 17,
                "scale": 0.93
            },
            {
                "zoom": 18,
                "scale": 0.85
            },
            {
                "zoom": 19,
                "scale": 0.82
            },
            {
                "zoom": 20,
                "scale": 0.84
            },
            {
                "zoom": 21,
                "scale": 0.9
            }
        ]
    },
    {
        "tags": {
            "any": "road_5"
        },
        "elements": "geometry.outline",
        "stylers": [
            {
                "zoom": 0,
                "color": "#ffffff",
                "scale": 1.4
            },
            {
                "zoom": 1,
                "color": "#ffffff",
                "scale": 1.4
            },
            {
                "zoom": 2,
                "color": "#ffffff",
                "scale": 1.4
            },
            {
                "zoom": 3,
                "color": "#ffffff",
                "scale": 1.4
            },
            {
                "zoom": 4,
                "color": "#ffffff",
                "scale": 1.4
            },
            {
                "zoom": 5,
                "color": "#ffffff",
                "scale": 1.4
            },
            {
                "zoom": 6,
                "color": "#ffffff",
                "scale": 1.4
            },
            {
                "zoom": 7,
                "color": "#ffffff",
                "scale": 1.4
            },
            {
                "zoom": 8,
                "color": "#ffffff",
                "scale": 1.4
            },
            {
                "zoom": 9,
                "color": "#ffffff",
                "scale": 1.4
            },
            {
                "zoom": 10,
                "color": "#ffffff",
                "scale": 1.4
            },
            {
                "zoom": 11,
                "color": "#ffffff",
                "scale": 0.62
            },
            {
                "zoom": 12,
                "color": "#efe4d7",
                "scale": 1.61
            },
            {
                "zoom": 13,
                "color": "#efe4d7",
                "scale": 1.36
            },
            {
                "zoom": 14,
                "color": "#f2e9de",
                "scale": 1.22
            },
            {
                "zoom": 15,
                "color": "#f2e9de",
                "scale": 1.41
            },
            {
                "zoom": 16,
                "color": "#f3ebe1",
                "scale": 1.63
            },
            {
                "zoom": 17,
                "color": "#f4ece3",
                "scale": 1.4
            },
            {
                "zoom": 18,
                "color": "#f5eee6",
                "scale": 1.27
            },
            {
                "zoom": 19,
                "color": "#f6f0e9",
                "scale": 1.23
            },
            {
                "zoom": 20,
                "color": "#f7f1eb",
                "scale": 1.25
            },
            {
                "zoom": 21,
                "color": "#f8f3ed",
                "scale": 1.34
            }
        ]
    },
    {
        "tags": {
            "any": "road_6",
            "none": "is_tunnel"
        },
        "elements": "geometry.fill",
        "stylers": [
            {
                "color": "#ffffff"
            },
            {
                "zoom": 0,
                "scale": 0
            },
            {
                "zoom": 1,
                "scale": 0
            },
            {
                "zoom": 2,
                "scale": 0
            },
            {
                "zoom": 3,
                "scale": 0
            },
            {
                "zoom": 4,
                "scale": 0
            },
            {
                "zoom": 5,
                "scale": 0
            },
            {
                "zoom": 6,
                "scale": 0
            },
            {
                "zoom": 7,
                "scale": 0
            },
            {
                "zoom": 8,
                "scale": 0
            },
            {
                "zoom": 9,
                "scale": 0
            },
            {
                "zoom": 10,
                "scale": 0
            },
            {
                "zoom": 11,
                "scale": 0
            },
            {
                "zoom": 12,
                "scale": 0
            },
            {
                "zoom": 13,
                "scale": 2.25
            },
            {
                "zoom": 14,
                "scale": 1.27
            },
            {
                "zoom": 15,
                "scale": 1.25
            },
            {
                "zoom": 16,
                "scale": 1.31
            },
            {
                "zoom": 17,
                "scale": 1.04
            },
            {
                "zoom": 18,
                "scale": 0.9
            },
            {
                "zoom": 19,
                "scale": 0.85
            },
            {
                "zoom": 20,
                "scale": 0.85
            },
            {
                "zoom": 21,
                "scale": 0.9
            }
        ]
    },
    {
        "tags": {
            "any": "road_6"
        },
        "elements": "geometry.outline",
        "stylers": [
            {
                "zoom": 0,
                "color": "#ffffff",
                "scale": 1.4
            },
            {
                "zoom": 1,
                "color": "#ffffff",
                "scale": 1.4
            },
            {
                "zoom": 2,
                "color": "#ffffff",
                "scale": 1.4
            },
            {
                "zoom": 3,
                "color": "#ffffff",
                "scale": 1.4
            },
            {
                "zoom": 4,
                "color": "#ffffff",
                "scale": 1.4
            },
            {
                "zoom": 5,
                "color": "#ffffff",
                "scale": 1.4
            },
            {
                "zoom": 6,
                "color": "#ffffff",
                "scale": 1.4
            },
            {
                "zoom": 7,
                "color": "#ffffff",
                "scale": 1.4
            },
            {
                "zoom": 8,
                "color": "#ffffff",
                "scale": 1.4
            },
            {
                "zoom": 9,
                "color": "#ffffff",
                "scale": 1.4
            },
            {
                "zoom": 10,
                "color": "#ffffff",
                "scale": 1.4
            },
            {
                "zoom": 11,
                "color": "#ffffff",
                "scale": 1.4
            },
            {
                "zoom": 12,
                "color": "#ffffff",
                "scale": 1.4
            },
            {
                "zoom": 13,
                "color": "#efe4d7",
                "scale": 2.31
            },
            {
                "zoom": 14,
                "color": "#f2e9de",
                "scale": 1.7
            },
            {
                "zoom": 15,
                "color": "#f2e9de",
                "scale": 1.76
            },
            {
                "zoom": 16,
                "color": "#f3ebe1",
                "scale": 1.89
            },
            {
                "zoom": 17,
                "color": "#f4ece3",
                "scale": 1.55
            },
            {
                "zoom": 18,
                "color": "#f5eee6",
                "scale": 1.36
            },
            {
                "zoom": 19,
                "color": "#f6f0e9",
                "scale": 1.27
            },
            {
                "zoom": 20,
                "color": "#f7f1eb",
                "scale": 1.27
            },
            {
                "zoom": 21,
                "color": "#f8f3ed",
                "scale": 1.34
            }
        ]
    },
    {
        "tags": {
            "any": "road_7",
            "none": "is_tunnel"
        },
        "elements": "geometry.fill",
        "stylers": [
            {
                "color": "#ffffff"
            },
            {
                "zoom": 0,
                "scale": 0
            },
            {
                "zoom": 1,
                "scale": 0
            },
            {
                "zoom": 2,
                "scale": 0
            },
            {
                "zoom": 3,
                "scale": 0
            },
            {
                "zoom": 4,
                "scale": 0
            },
            {
                "zoom": 5,
                "scale": 0
            },
            {
                "zoom": 6,
                "scale": 0
            },
            {
                "zoom": 7,
                "scale": 0
            },
            {
                "zoom": 8,
                "scale": 0
            },
            {
                "zoom": 9,
                "scale": 0
            },
            {
                "zoom": 10,
                "scale": 0
            },
            {
                "zoom": 11,
                "scale": 0
            },
            {
                "zoom": 12,
                "scale": 0
            },
            {
                "zoom": 13,
                "scale": 0
            },
            {
                "zoom": 14,
                "scale": 0.9
            },
            {
                "zoom": 15,
                "scale": 0.78
            },
            {
                "zoom": 16,
                "scale": 0.88
            },
            {
                "zoom": 17,
                "scale": 0.8
            },
            {
                "zoom": 18,
                "scale": 0.78
            },
            {
                "zoom": 19,
                "scale": 0.79
            },
            {
                "zoom": 20,
                "scale": 0.83
            },
            {
                "zoom": 21,
                "scale": 0.9
            }
        ]
    },
    {
        "tags": {
            "any": "road_7"
        },
        "elements": "geometry.outline",
        "stylers": [
            {
                "zoom": 0,
                "color": "#ffffff",
                "scale": 1.4
            },
            {
                "zoom": 1,
                "color": "#ffffff",
                "scale": 1.4
            },
            {
                "zoom": 2,
                "color": "#ffffff",
                "scale": 1.4
            },
            {
                "zoom": 3,
                "color": "#ffffff",
                "scale": 1.4
            },
            {
                "zoom": 4,
                "color": "#ffffff",
                "scale": 1.4
            },
            {
                "zoom": 5,
                "color": "#ffffff",
                "scale": 1.4
            },
            {
                "zoom": 6,
                "color": "#ffffff",
                "scale": 1.4
            },
            {
                "zoom": 7,
                "color": "#ffffff",
                "scale": 1.4
            },
            {
                "zoom": 8,
                "color": "#ffffff",
                "scale": 1.4
            },
            {
                "zoom": 9,
                "color": "#ffffff",
                "scale": 1.4
            },
            {
                "zoom": 10,
                "color": "#ffffff",
                "scale": 1.4
            },
            {
                "zoom": 11,
                "color": "#ffffff",
                "scale": 1.4
            },
            {
                "zoom": 12,
                "color": "#ffffff",
                "scale": 1.4
            },
            {
                "zoom": 13,
                "color": "#ffffff",
                "scale": 1.4
            },
            {
                "zoom": 14,
                "color": "#f2e9de",
                "scale": 1.31
            },
            {
                "zoom": 15,
                "color": "#f2e9de",
                "scale": 1.19
            },
            {
                "zoom": 16,
                "color": "#f3ebe1",
                "scale": 1.31
            },
            {
                "zoom": 17,
                "color": "#f4ece3",
                "scale": 1.21
            },
            {
                "zoom": 18,
                "color": "#f5eee6",
                "scale": 1.17
            },
            {
                "zoom": 19,
                "color": "#f6f0e9",
                "scale": 1.18
            },
            {
                "zoom": 20,
                "color": "#f7f1eb",
                "scale": 1.23
            },
            {
                "zoom": 21,
                "color": "#f8f3ed",
                "scale": 1.33
            }
        ]
    },
    {
        "tags": {
            "any": "road_minor",
            "none": "is_tunnel"
        },
        "elements": "geometry.fill",
        "stylers": [
            {
                "color": "#ffffff"
            },
            {
                "zoom": 0,
                "scale": 0
            },
            {
                "zoom": 1,
                "scale": 0
            },
            {
                "zoom": 2,
                "scale": 0
            },
            {
                "zoom": 3,
                "scale": 0
            },
            {
                "zoom": 4,
                "scale": 0
            },
            {
                "zoom": 5,
                "scale": 0
            },
            {
                "zoom": 6,
                "scale": 0
            },
            {
                "zoom": 7,
                "scale": 0
            },
            {
                "zoom": 8,
                "scale": 0
            },
            {
                "zoom": 9,
                "scale": 0
            },
            {
                "zoom": 10,
                "scale": 0
            },
            {
                "zoom": 11,
                "scale": 0
            },
            {
                "zoom": 12,
                "scale": 0
            },
            {
                "zoom": 13,
                "scale": 0
            },
            {
                "zoom": 14,
                "scale": 0
            },
            {
                "zoom": 15,
                "scale": 0
            },
            {
                "zoom": 16,
                "scale": 0.9
            },
            {
                "zoom": 17,
                "scale": 0.9
            },
            {
                "zoom": 18,
                "scale": 0.9
            },
            {
                "zoom": 19,
                "scale": 0.9
            },
            {
                "zoom": 20,
                "scale": 0.9
            },
            {
                "zoom": 21,
                "scale": 0.9
            }
        ]
    },
    {
        "tags": {
            "any": "road_minor"
        },
        "elements": "geometry.outline",
        "stylers": [
            {
                "zoom": 0,
                "color": "#ffffff",
                "scale": 0.4
            },
            {
                "zoom": 1,
                "color": "#ffffff",
                "scale": 0.4
            },
            {
                "zoom": 2,
                "color": "#ffffff",
                "scale": 0.4
            },
            {
                "zoom": 3,
                "color": "#ffffff",
                "scale": 0.4
            },
            {
                "zoom": 4,
                "color": "#ffffff",
                "scale": 0.4
            },
            {
                "zoom": 5,
                "color": "#ffffff",
                "scale": 0.4
            },
            {
                "zoom": 6,
                "color": "#ffffff",
                "scale": 0.4
            },
            {
                "zoom": 7,
                "color": "#ffffff",
                "scale": 0.4
            },
            {
                "zoom": 8,
                "color": "#ffffff",
                "scale": 0.4
            },
            {
                "zoom": 9,
                "color": "#ffffff",
                "scale": 0.4
            },
            {
                "zoom": 10,
                "color": "#ffffff",
                "scale": 0.4
            },
            {
                "zoom": 11,
                "color": "#ffffff",
                "scale": 0.4
            },
            {
                "zoom": 12,
                "color": "#ffffff",
                "scale": 0.4
            },
            {
                "zoom": 13,
                "color": "#ffffff",
                "scale": 0.4
            },
            {
                "zoom": 14,
                "color": "#f2e9de",
                "scale": 0.4
            },
            {
                "zoom": 15,
                "color": "#f2e9de",
                "scale": 0.4
            },
            {
                "zoom": 16,
                "color": "#f3ebe1",
                "scale": 1.4
            },
            {
                "zoom": 17,
                "color": "#f4ece3",
                "scale": 1.27
            },
            {
                "zoom": 18,
                "color": "#f5eee6",
                "scale": 1.27
            },
            {
                "zoom": 19,
                "color": "#f6f0e9",
                "scale": 1.29
            },
            {
                "zoom": 20,
                "color": "#f7f1eb",
                "scale": 1.31
            },
            {
                "zoom": 21,
                "color": "#f8f3ed",
                "scale": 1.32
            }
        ]
    },
    {
        "tags": {
            "any": "road_unclassified",
            "none": "is_tunnel"
        },
        "elements": "geometry.fill",
        "stylers": [
            {
                "color": "#ffffff"
            },
            {
                "zoom": 0,
                "scale": 0
            },
            {
                "zoom": 1,
                "scale": 0
            },
            {
                "zoom": 2,
                "scale": 0
            },
            {
                "zoom": 3,
                "scale": 0
            },
            {
                "zoom": 4,
                "scale": 0
            },
            {
                "zoom": 5,
                "scale": 0
            },
            {
                "zoom": 6,
                "scale": 0
            },
            {
                "zoom": 7,
                "scale": 0
            },
            {
                "zoom": 8,
                "scale": 0
            },
            {
                "zoom": 9,
                "scale": 0
            },
            {
                "zoom": 10,
                "scale": 0
            },
            {
                "zoom": 11,
                "scale": 0
            },
            {
                "zoom": 12,
                "scale": 0
            },
            {
                "zoom": 13,
                "scale": 0
            },
            {
                "zoom": 14,
                "scale": 0
            },
            {
                "zoom": 15,
                "scale": 0
            },
            {
                "zoom": 16,
                "scale": 0.9
            },
            {
                "zoom": 17,
                "scale": 0.9
            },
            {
                "zoom": 18,
                "scale": 0.9
            },
            {
                "zoom": 19,
                "scale": 0.9
            },
            {
                "zoom": 20,
                "scale": 0.9
            },
            {
                "zoom": 21,
                "scale": 0.9
            }
        ]
    },
    {
        "tags": {
            "any": "road_unclassified"
        },
        "elements": "geometry.outline",
        "stylers": [
            {
                "zoom": 0,
                "color": "#ffffff",
                "scale": 0.4
            },
            {
                "zoom": 1,
                "color": "#ffffff",
                "scale": 0.4
            },
            {
                "zoom": 2,
                "color": "#ffffff",
                "scale": 0.4
            },
            {
                "zoom": 3,
                "color": "#ffffff",
                "scale": 0.4
            },
            {
                "zoom": 4,
                "color": "#ffffff",
                "scale": 0.4
            },
            {
                "zoom": 5,
                "color": "#ffffff",
                "scale": 0.4
            },
            {
                "zoom": 6,
                "color": "#ffffff",
                "scale": 0.4
            },
            {
                "zoom": 7,
                "color": "#ffffff",
                "scale": 0.4
            },
            {
                "zoom": 8,
                "color": "#ffffff",
                "scale": 0.4
            },
            {
                "zoom": 9,
                "color": "#ffffff",
                "scale": 0.4
            },
            {
                "zoom": 10,
                "color": "#ffffff",
                "scale": 0.4
            },
            {
                "zoom": 11,
                "color": "#ffffff",
                "scale": 0.4
            },
            {
                "zoom": 12,
                "color": "#ffffff",
                "scale": 0.4
            },
            {
                "zoom": 13,
                "color": "#ffffff",
                "scale": 0.4
            },
            {
                "zoom": 14,
                "color": "#f2e9de",
                "scale": 0.4
            },
            {
                "zoom": 15,
                "color": "#f2e9de",
                "scale": 0.4
            },
            {
                "zoom": 16,
                "color": "#f3ebe1",
                "scale": 1.4
            },
            {
                "zoom": 17,
                "color": "#f4ece3",
                "scale": 1.27
            },
            {
                "zoom": 18,
                "color": "#f5eee6",
                "scale": 1.27
            },
            {
                "zoom": 19,
                "color": "#f6f0e9",
                "scale": 1.29
            },
            {
                "zoom": 20,
                "color": "#f7f1eb",
                "scale": 1.31
            },
            {
                "zoom": 21,
                "color": "#f8f3ed",
                "scale": 1.32
            }
        ]
    },
    {
        "tags": {
            "all": "is_tunnel",
            "none": "path"
        },
        "elements": "geometry.fill",
        "stylers": [
            {
                "zoom": 0,
                "color": "#ecdfd0"
            },
            {
                "zoom": 1,
                "color": "#ecdfd0"
            },
            {
                "zoom": 2,
                "color": "#ecdfd0"
            },
            {
                "zoom": 3,
                "color": "#ecdfd0"
            },
            {
                "zoom": 4,
                "color": "#ecdfd0"
            },
            {
                "zoom": 5,
                "color": "#ecdfd0"
            },
            {
                "zoom": 6,
                "color": "#ecdfd0"
            },
            {
                "zoom": 7,
                "color": "#ecdfd0"
            },
            {
                "zoom": 8,
                "color": "#ecdfd0"
            },
            {
                "zoom": 9,
                "color": "#ecdfd0"
            },
            {
                "zoom": 10,
                "color": "#ecdfd0"
            },
            {
                "zoom": 11,
                "color": "#ecdfd0"
            },
            {
                "zoom": 12,
                "color": "#ecdfd0"
            },
            {
                "zoom": 13,
                "color": "#ecdfd0"
            },
            {
                "zoom": 14,
                "color": "#efe4d7"
            },
            {
                "zoom": 15,
                "color": "#f2e9de"
            },
            {
                "zoom": 16,
                "color": "#f2eadf"
            },
            {
                "zoom": 17,
                "color": "#f3ebe0"
            },
            {
                "zoom": 18,
                "color": "#f3ebe1"
            },
            {
                "zoom": 19,
                "color": "#f4ece3"
            },
            {
                "zoom": 20,
                "color": "#f4ede4"
            },
            {
                "zoom": 21,
                "color": "#f5eee5"
            }
        ]
    },
    {
        "tags": {
            "all": "path",
            "none": "is_tunnel"
        },
        "elements": "geometry.fill",
        "stylers": [
            {
                "color": "#cda679"
            }
        ]
    },
    {
        "tags": {
            "all": "path",
            "none": "is_tunnel"
        },
        "elements": "geometry.outline",
        "stylers": [
            {
                "opacity": 0.7
            },
            {
                "zoom": 0,
                "color": "#efe4d7"
            },
            {
                "zoom": 1,
                "color": "#efe4d7"
            },
            {
                "zoom": 2,
                "color": "#efe4d7"
            },
            {
                "zoom": 3,
                "color": "#efe4d7"
            },
            {
                "zoom": 4,
                "color": "#efe4d7"
            },
            {
                "zoom": 5,
                "color": "#efe4d7"
            },
            {
                "zoom": 6,
                "color": "#efe4d7"
            },
            {
                "zoom": 7,
                "color": "#efe4d7"
            },
            {
                "zoom": 8,
                "color": "#efe4d7"
            },
            {
                "zoom": 9,
                "color": "#efe4d7"
            },
            {
                "zoom": 10,
                "color": "#efe4d7"
            },
            {
                "zoom": 11,
                "color": "#efe4d7"
            },
            {
                "zoom": 12,
                "color": "#efe4d7"
            },
            {
                "zoom": 13,
                "color": "#efe4d7"
            },
            {
                "zoom": 14,
                "color": "#f2e9de"
            },
            {
                "zoom": 15,
                "color": "#f5eee5"
            },
            {
                "zoom": 16,
                "color": "#f5efe6"
            },
            {
                "zoom": 17,
                "color": "#f6f0e8"
            },
            {
                "zoom": 18,
                "color": "#f6f0e9"
            },
            {
                "zoom": 19,
                "color": "#f7f1ea"
            },
            {
                "zoom": 20,
                "color": "#f7f2ec"
            },
            {
                "zoom": 21,
                "color": "#f8f3ed"
            }
        ]
    },
    {
        "tags": "road_construction",
        "elements": "geometry.fill",
        "stylers": [
            {
                "color": "#ffffff"
            }
        ]
    },
    {
        "tags": "road_construction",
        "elements": "geometry.outline",
        "stylers": [
            {
                "zoom": 0,
                "color": "#dbbf9e"
            },
            {
                "zoom": 1,
                "color": "#dbbf9e"
            },
            {
                "zoom": 2,
                "color": "#dbbf9e"
            },
            {
                "zoom": 3,
                "color": "#dbbf9e"
            },
            {
                "zoom": 4,
                "color": "#dbbf9e"
            },
            {
                "zoom": 5,
                "color": "#dbbf9e"
            },
            {
                "zoom": 6,
                "color": "#dbbf9e"
            },
            {
                "zoom": 7,
                "color": "#dbbf9e"
            },
            {
                "zoom": 8,
                "color": "#dbbf9e"
            },
            {
                "zoom": 9,
                "color": "#dbbf9e"
            },
            {
                "zoom": 10,
                "color": "#dbbf9e"
            },
            {
                "zoom": 11,
                "color": "#dbbf9e"
            },
            {
                "zoom": 12,
                "color": "#dbbf9e"
            },
            {
                "zoom": 13,
                "color": "#dbbf9e"
            },
            {
                "zoom": 14,
                "color": "#cda679"
            },
            {
                "zoom": 15,
                "color": "#dbbf9e"
            },
            {
                "zoom": 16,
                "color": "#ddc3a4"
            },
            {
                "zoom": 17,
                "color": "#e0c7aa"
            },
            {
                "zoom": 18,
                "color": "#e2cbb0"
            },
            {
                "zoom": 19,
                "color": "#e4cfb7"
            },
            {
                "zoom": 20,
                "color": "#e7d3bd"
            },
            {
                "zoom": 21,
                "color": "#e9d7c3"
            }
        ]
    },
    {
        "tags": {
            "any": "ferry"
        },
        "stylers": [
            {
                "color": "#c59763"
            }
        ]
    },
    {
        "tags": "transit_location",
        "elements": "label.icon",
        "stylers": [
            {
                "hue": "#cda679"
            },
            {
                "saturation": -0.54
            }
        ]
    },
    {
        "tags": "transit_location",
        "elements": "label.text.fill",
        "stylers": [
            {
                "color": "#b89b7a"
            }
        ]
    },
    {
        "tags": "transit_location",
        "elements": "label.text.outline",
        "stylers": [
            {
                "color": "#ffffff"
            }
        ]
    },
    {
        "tags": "transit_schema",
        "elements": "geometry.fill",
        "stylers": [
            {
                "color": "#b89b7a"
            },
            {
                "scale": 0.7
            },
            {
                "zoom": 0,
                "opacity": 0.6
            },
            {
                "zoom": 1,
                "opacity": 0.6
            },
            {
                "zoom": 2,
                "opacity": 0.6
            },
            {
                "zoom": 3,
                "opacity": 0.6
            },
            {
                "zoom": 4,
                "opacity": 0.6
            },
            {
                "zoom": 5,
                "opacity": 0.6
            },
            {
                "zoom": 6,
                "opacity": 0.6
            },
            {
                "zoom": 7,
                "opacity": 0.6
            },
            {
                "zoom": 8,
                "opacity": 0.6
            },
            {
                "zoom": 9,
                "opacity": 0.6
            },
            {
                "zoom": 10,
                "opacity": 0.6
            },
            {
                "zoom": 11,
                "opacity": 0.6
            },
            {
                "zoom": 12,
                "opacity": 0.6
            },
            {
                "zoom": 13,
                "opacity": 0.6
            },
            {
                "zoom": 14,
                "opacity": 0.6
            },
            {
                "zoom": 15,
                "opacity": 0.5
            },
            {
                "zoom": 16,
                "opacity": 0.4
            },
            {
                "zoom": 17,
                "opacity": 0.4
            },
            {
                "zoom": 18,
                "opacity": 0.4
            },
            {
                "zoom": 19,
                "opacity": 0.4
            },
            {
                "zoom": 20,
                "opacity": 0.4
            },
            {
                "zoom": 21,
                "opacity": 0.4
            }
        ]
    },
    {
        "tags": "transit_schema",
        "elements": "geometry.outline",
        "stylers": [
            {
                "opacity": 0
            }
        ]
    },
    {
        "tags": "transit_line",
        "elements": "geometry.fill.pattern",
        "stylers": [
            {
                "color": "#c2b4a3"
            },
            {
                "zoom": 0,
                "opacity": 0
            },
            {
                "zoom": 1,
                "opacity": 0
            },
            {
                "zoom": 2,
                "opacity": 0
            },
            {
                "zoom": 3,
                "opacity": 0
            },
            {
                "zoom": 4,
                "opacity": 0
            },
            {
                "zoom": 5,
                "opacity": 0
            },
            {
                "zoom": 6,
                "opacity": 0
            },
            {
                "zoom": 7,
                "opacity": 0
            },
            {
                "zoom": 8,
                "opacity": 0
            },
            {
                "zoom": 9,
                "opacity": 0
            },
            {
                "zoom": 10,
                "opacity": 0
            },
            {
                "zoom": 11,
                "opacity": 0
            },
            {
                "zoom": 12,
                "opacity": 0
            },
            {
                "zoom": 13,
                "opacity": 1
            },
            {
                "zoom": 14,
                "opacity": 1
            },
            {
                "zoom": 15,
                "opacity": 1
            },
            {
                "zoom": 16,
                "opacity": 1
            },
            {
                "zoom": 17,
                "opacity": 1
            },
            {
                "zoom": 18,
                "opacity": 1
            },
            {
                "zoom": 19,
                "opacity": 1
            },
            {
                "zoom": 20,
                "opacity": 1
            },
            {
                "zoom": 21,
                "opacity": 1
            }
        ]
    },
    {
        "tags": "transit_line",
        "elements": "geometry.fill",
        "stylers": [
            {
                "color": "#c2b4a3"
            },
            {
                "scale": 0.4
            },
            {
                "zoom": 0,
                "opacity": 0
            },
            {
                "zoom": 1,
                "opacity": 0
            },
            {
                "zoom": 2,
                "opacity": 0
            },
            {
                "zoom": 3,
                "opacity": 0
            },
            {
                "zoom": 4,
                "opacity": 0
            },
            {
                "zoom": 5,
                "opacity": 0
            },
            {
                "zoom": 6,
                "opacity": 0
            },
            {
                "zoom": 7,
                "opacity": 0
            },
            {
                "zoom": 8,
                "opacity": 0
            },
            {
                "zoom": 9,
                "opacity": 0
            },
            {
                "zoom": 10,
                "opacity": 0
            },
            {
                "zoom": 11,
                "opacity": 0
            },
            {
                "zoom": 12,
                "opacity": 0
            },
            {
                "zoom": 13,
                "opacity": 1
            },
            {
                "zoom": 14,
                "opacity": 1
            },
            {
                "zoom": 15,
                "opacity": 1
            },
            {
                "zoom": 16,
                "opacity": 1
            },
            {
                "zoom": 17,
                "opacity": 1
            },
            {
                "zoom": 18,
                "opacity": 1
            },
            {
                "zoom": 19,
                "opacity": 1
            },
            {
                "zoom": 20,
                "opacity": 1
            },
            {
                "zoom": 21,
                "opacity": 1
            }
        ]
    },
    {
        "tags": "water",
        "elements": "geometry",
        "stylers": [
            {
                "zoom": 0,
                "color": "#d3b088"
            },
            {
                "zoom": 1,
                "color": "#d3b088"
            },
            {
                "zoom": 2,
                "color": "#d3b088"
            },
            {
                "zoom": 3,
                "color": "#d3b088"
            },
            {
                "zoom": 4,
                "color": "#d3b088"
            },
            {
                "zoom": 5,
                "color": "#d3b088"
            },
            {
                "zoom": 6,
                "color": "#d3b088"
            },
            {
                "zoom": 7,
                "color": "#d3b088"
            },
            {
                "zoom": 8,
                "color": "#d4b28a"
            },
            {
                "zoom": 9,
                "color": "#d5b38d"
            },
            {
                "zoom": 10,
                "color": "#d6b58f"
            },
            {
                "zoom": 11,
                "color": "#d6b690"
            },
            {
                "zoom": 12,
                "color": "#d7b692"
            },
            {
                "zoom": 13,
                "color": "#d7b793"
            },
            {
                "zoom": 14,
                "color": "#d8b895"
            },
            {
                "zoom": 15,
                "color": "#d8b997"
            },
            {
                "zoom": 16,
                "color": "#d9bb99"
            },
            {
                "zoom": 17,
                "color": "#dabc9a"
            },
            {
                "zoom": 18,
                "color": "#dbbd9c"
            },
            {
                "zoom": 19,
                "color": "#dbbe9e"
            },
            {
                "zoom": 20,
                "color": "#dcc0a0"
            },
            {
                "zoom": 21,
                "color": "#ddc1a2"
            }
        ]
    },
    {
        "tags": "water",
        "elements": "geometry",
        "types": "polyline",
        "stylers": [
            {
                "zoom": 0,
                "opacity": 0.4
            },
            {
                "zoom": 1,
                "opacity": 0.4
            },
            {
                "zoom": 2,
                "opacity": 0.4
            },
            {
                "zoom": 3,
                "opacity": 0.4
            },
            {
                "zoom": 4,
                "opacity": 0.6
            },
            {
                "zoom": 5,
                "opacity": 0.8
            },
            {
                "zoom": 6,
                "opacity": 1
            },
            {
                "zoom": 7,
                "opacity": 1
            },
            {
                "zoom": 8,
                "opacity": 1
            },
            {
                "zoom": 9,
                "opacity": 1
            },
            {
                "zoom": 10,
                "opacity": 1
            },
            {
                "zoom": 11,
                "opacity": 1
            },
            {
                "zoom": 12,
                "opacity": 1
            },
            {
                "zoom": 13,
                "opacity": 1
            },
            {
                "zoom": 14,
                "opacity": 1
            },
            {
                "zoom": 15,
                "opacity": 1
            },
            {
                "zoom": 16,
                "opacity": 1
            },
            {
                "zoom": 17,
                "opacity": 1
            },
            {
                "zoom": 18,
                "opacity": 1
            },
            {
                "zoom": 19,
                "opacity": 1
            },
            {
                "zoom": 20,
                "opacity": 1
            },
            {
                "zoom": 21,
                "opacity": 1
            }
        ]
    },
    {
        "tags": "bathymetry",
        "elements": "geometry",
        "stylers": [
            {
                "hue": "#d3b088"
            }
        ]
    },
    {
        "tags": {
            "any": [
                "industrial",
                "construction_site"
            ]
        },
        "elements": "geometry",
        "stylers": [
            {
                "zoom": 0,
                "color": "#eddfce"
            },
            {
                "zoom": 1,
                "color": "#eddfce"
            },
            {
                "zoom": 2,
                "color": "#eddfce"
            },
            {
                "zoom": 3,
                "color": "#eddfce"
            },
            {
                "zoom": 4,
                "color": "#eddfce"
            },
            {
                "zoom": 5,
                "color": "#eddfce"
            },
            {
                "zoom": 6,
                "color": "#eddfce"
            },
            {
                "zoom": 7,
                "color": "#eddfce"
            },
            {
                "zoom": 8,
                "color": "#eddfce"
            },
            {
                "zoom": 9,
                "color": "#eddfce"
            },
            {
                "zoom": 10,
                "color": "#eddfce"
            },
            {
                "zoom": 11,
                "color": "#eddfce"
            },
            {
                "zoom": 12,
                "color": "#eddfce"
            },
            {
                "zoom": 13,
                "color": "#eddfce"
            },
            {
                "zoom": 14,
                "color": "#f0e4d5"
            },
            {
                "zoom": 15,
                "color": "#f3e9dd"
            },
            {
                "zoom": 16,
                "color": "#f3eade"
            },
            {
                "zoom": 17,
                "color": "#f4ebe0"
            },
            {
                "zoom": 18,
                "color": "#f4ebe1"
            },
            {
                "zoom": 19,
                "color": "#f5ece2"
            },
            {
                "zoom": 20,
                "color": "#f5ede4"
            },
            {
                "zoom": 21,
                "color": "#f6eee5"
            }
        ]
    },
    {
        "tags": {
            "any": "transit",
            "none": [
                "transit_location",
                "transit_line",
                "transit_schema",
                "is_unclassified_transit"
            ]
        },
        "elements": "geometry",
        "stylers": [
            {
                "zoom": 0,
                "color": "#eddfcf"
            },
            {
                "zoom": 1,
                "color": "#eddfcf"
            },
            {
                "zoom": 2,
                "color": "#eddfcf"
            },
            {
                "zoom": 3,
                "color": "#eddfcf"
            },
            {
                "zoom": 4,
                "color": "#eddfcf"
            },
            {
                "zoom": 5,
                "color": "#eddfcf"
            },
            {
                "zoom": 6,
                "color": "#eddfcf"
            },
            {
                "zoom": 7,
                "color": "#eddfcf"
            },
            {
                "zoom": 8,
                "color": "#eddfcf"
            },
            {
                "zoom": 9,
                "color": "#eddfcf"
            },
            {
                "zoom": 10,
                "color": "#eddfcf"
            },
            {
                "zoom": 11,
                "color": "#eddfcf"
            },
            {
                "zoom": 12,
                "color": "#eddfcf"
            },
            {
                "zoom": 13,
                "color": "#eddfcf"
            },
            {
                "zoom": 14,
                "color": "#f0e4d6"
            },
            {
                "zoom": 15,
                "color": "#f3e9dd"
            },
            {
                "zoom": 16,
                "color": "#f3eade"
            },
            {
                "zoom": 17,
                "color": "#f4ebe0"
            },
            {
                "zoom": 18,
                "color": "#f4ebe1"
            },
            {
                "zoom": 19,
                "color": "#f4ece2"
            },
            {
                "zoom": 20,
                "color": "#f5ede4"
            },
            {
                "zoom": 21,
                "color": "#f5eee5"
            }
        ]
    },
    {
        "tags": "fence",
        "elements": "geometry.fill",
        "stylers": [
            {
                "color": "#e8d5bf"
            },
            {
                "zoom": 0,
                "opacity": 0.75
            },
            {
                "zoom": 1,
                "opacity": 0.75
            },
            {
                "zoom": 2,
                "opacity": 0.75
            },
            {
                "zoom": 3,
                "opacity": 0.75
            },
            {
                "zoom": 4,
                "opacity": 0.75
            },
            {
                "zoom": 5,
                "opacity": 0.75
            },
            {
                "zoom": 6,
                "opacity": 0.75
            },
            {
                "zoom": 7,
                "opacity": 0.75
            },
            {
                "zoom": 8,
                "opacity": 0.75
            },
            {
                "zoom": 9,
                "opacity": 0.75
            },
            {
                "zoom": 10,
                "opacity": 0.75
            },
            {
                "zoom": 11,
                "opacity": 0.75
            },
            {
                "zoom": 12,
                "opacity": 0.75
            },
            {
                "zoom": 13,
                "opacity": 0.75
            },
            {
                "zoom": 14,
                "opacity": 0.75
            },
            {
                "zoom": 15,
                "opacity": 0.75
            },
            {
                "zoom": 16,
                "opacity": 0.75
            },
            {
                "zoom": 17,
                "opacity": 0.45
            },
            {
                "zoom": 18,
                "opacity": 0.45
            },
            {
                "zoom": 19,
                "opacity": 0.45
            },
            {
                "zoom": 20,
                "opacity": 0.45
            },
            {
                "zoom": 21,
                "opacity": 0.45
            }
        ]
    },
    {
        "tags": "medical",
        "elements": "geometry",
        "stylers": [
            {
                "zoom": 0,
                "color": "#eddfce"
            },
            {
                "zoom": 1,
                "color": "#eddfce"
            },
            {
                "zoom": 2,
                "color": "#eddfce"
            },
            {
                "zoom": 3,
                "color": "#eddfce"
            },
            {
                "zoom": 4,
                "color": "#eddfce"
            },
            {
                "zoom": 5,
                "color": "#eddfce"
            },
            {
                "zoom": 6,
                "color": "#eddfce"
            },
            {
                "zoom": 7,
                "color": "#eddfce"
            },
            {
                "zoom": 8,
                "color": "#eddfce"
            },
            {
                "zoom": 9,
                "color": "#eddfce"
            },
            {
                "zoom": 10,
                "color": "#eddfce"
            },
            {
                "zoom": 11,
                "color": "#eddfce"
            },
            {
                "zoom": 12,
                "color": "#eddfce"
            },
            {
                "zoom": 13,
                "color": "#eddfce"
            },
            {
                "zoom": 14,
                "color": "#f0e4d5"
            },
            {
                "zoom": 15,
                "color": "#f3e9dd"
            },
            {
                "zoom": 16,
                "color": "#f3eade"
            },
            {
                "zoom": 17,
                "color": "#f4ebe0"
            },
            {
                "zoom": 18,
                "color": "#f4ebe1"
            },
            {
                "zoom": 19,
                "color": "#f5ece2"
            },
            {
                "zoom": 20,
                "color": "#f5ede4"
            },
            {
                "zoom": 21,
                "color": "#f6eee5"
            }
        ]
    },
    {
        "tags": "beach",
        "elements": "geometry",
        "stylers": [
            {
                "zoom": 0,
                "color": "#eddfce",
                "opacity": 0.3
            },
            {
                "zoom": 1,
                "color": "#eddfce",
                "opacity": 0.3
            },
            {
                "zoom": 2,
                "color": "#eddfce",
                "opacity": 0.3
            },
            {
                "zoom": 3,
                "color": "#eddfce",
                "opacity": 0.3
            },
            {
                "zoom": 4,
                "color": "#eddfce",
                "opacity": 0.3
            },
            {
                "zoom": 5,
                "color": "#eddfce",
                "opacity": 0.3
            },
            {
                "zoom": 6,
                "color": "#eddfce",
                "opacity": 0.3
            },
            {
                "zoom": 7,
                "color": "#eddfce",
                "opacity": 0.3
            },
            {
                "zoom": 8,
                "color": "#eddfce",
                "opacity": 0.3
            },
            {
                "zoom": 9,
                "color": "#eddfce",
                "opacity": 0.3
            },
            {
                "zoom": 10,
                "color": "#eddfce",
                "opacity": 0.3
            },
            {
                "zoom": 11,
                "color": "#eddfce",
                "opacity": 0.3
            },
            {
                "zoom": 12,
                "color": "#eddfce",
                "opacity": 0.3
            },
            {
                "zoom": 13,
                "color": "#eddfce",
                "opacity": 0.65
            },
            {
                "zoom": 14,
                "color": "#f0e4d5",
                "opacity": 1
            },
            {
                "zoom": 15,
                "color": "#f3e9dd",
                "opacity": 1
            },
            {
                "zoom": 16,
                "color": "#f3eade",
                "opacity": 1
            },
            {
                "zoom": 17,
                "color": "#f4ebe0",
                "opacity": 1
            },
            {
                "zoom": 18,
                "color": "#f4ebe1",
                "opacity": 1
            },
            {
                "zoom": 19,
                "color": "#f5ece2",
                "opacity": 1
            },
            {
                "zoom": 20,
                "color": "#f5ede4",
                "opacity": 1
            },
            {
                "zoom": 21,
                "color": "#f6eee5",
                "opacity": 1
            }
        ]
    },
    {
        "tags": {
            "all": [
                "is_tunnel",
                "path"
            ]
        },
        "elements": "geometry.fill",
        "stylers": [
            {
                "color": "#cba172"
            },
            {
                "opacity": 0.3
            }
        ]
    },
    {
        "tags": {
            "all": [
                "is_tunnel",
                "path"
            ]
        },
        "elements": "geometry.outline",
        "stylers": [
            {
                "opacity": 0
            }
        ]
    },
    {
        "tags": "road_limited",
        "elements": "geometry.fill",
        "stylers": [
            {
                "color": "#d4b28c"
            },
            {
                "zoom": 0,
                "scale": 0
            },
            {
                "zoom": 1,
                "scale": 0
            },
            {
                "zoom": 2,
                "scale": 0
            },
            {
                "zoom": 3,
                "scale": 0
            },
            {
                "zoom": 4,
                "scale": 0
            },
            {
                "zoom": 5,
                "scale": 0
            },
            {
                "zoom": 6,
                "scale": 0
            },
            {
                "zoom": 7,
                "scale": 0
            },
            {
                "zoom": 8,
                "scale": 0
            },
            {
                "zoom": 9,
                "scale": 0
            },
            {
                "zoom": 10,
                "scale": 0
            },
            {
                "zoom": 11,
                "scale": 0
            },
            {
                "zoom": 12,
                "scale": 0
            },
            {
                "zoom": 13,
                "scale": 0.1
            },
            {
                "zoom": 14,
                "scale": 0.2
            },
            {
                "zoom": 15,
                "scale": 0.3
            },
            {
                "zoom": 16,
                "scale": 0.5
            },
            {
                "zoom": 17,
                "scale": 0.6
            },
            {
                "zoom": 18,
                "scale": 0.7
            },
            {
                "zoom": 19,
                "scale": 0.79
            },
            {
                "zoom": 20,
                "scale": 0.83
            },
            {
                "zoom": 21,
                "scale": 0.9
            }
        ]
    },
    {
        "tags": "road_limited",
        "elements": "geometry.outline",
        "stylers": [
            {
                "zoom": 0,
                "color": "#ffffff",
                "scale": 1.4
            },
            {
                "zoom": 1,
                "color": "#ffffff",
                "scale": 1.4
            },
            {
                "zoom": 2,
                "color": "#ffffff",
                "scale": 1.4
            },
            {
                "zoom": 3,
                "color": "#ffffff",
                "scale": 1.4
            },
            {
                "zoom": 4,
                "color": "#ffffff",
                "scale": 1.4
            },
            {
                "zoom": 5,
                "color": "#ffffff",
                "scale": 1.4
            },
            {
                "zoom": 6,
                "color": "#ffffff",
                "scale": 1.4
            },
            {
                "zoom": 7,
                "color": "#ffffff",
                "scale": 1.4
            },
            {
                "zoom": 8,
                "color": "#ffffff",
                "scale": 1.4
            },
            {
                "zoom": 9,
                "color": "#ffffff",
                "scale": 1.4
            },
            {
                "zoom": 10,
                "color": "#ffffff",
                "scale": 1.4
            },
            {
                "zoom": 11,
                "color": "#ffffff",
                "scale": 1.4
            },
            {
                "zoom": 12,
                "color": "#ffffff",
                "scale": 1.4
            },
            {
                "zoom": 13,
                "color": "#ffffff",
                "scale": 0.1
            },
            {
                "zoom": 14,
                "color": "#f2e9de",
                "scale": 0.2
            },
            {
                "zoom": 15,
                "color": "#f2e9de",
                "scale": 0.3
            },
            {
                "zoom": 16,
                "color": "#f3ebe1",
                "scale": 0.5
            },
            {
                "zoom": 17,
                "color": "#f4ece3",
                "scale": 0.6
            },
            {
                "zoom": 18,
                "color": "#f5eee6",
                "scale": 0.7
            },
            {
                "zoom": 19,
                "color": "#f6f0e9",
                "scale": 1.18
            },
            {
                "zoom": 20,
                "color": "#f7f1eb",
                "scale": 1.23
            },
            {
                "zoom": 21,
                "color": "#f8f3ed",
                "scale": 1.33
            }
        ]
    },
    {
        "tags": {
            "any": "landcover",
            "none": "vegetation"
        },
        "stylers": {
            "visibility": "off"
        }
    }
]
        }));

        ymaps3.import.registerCdn('https://cdn.jsdelivr.net/npm/{package}', [
            '@yandex/ymaps3-default-ui-theme@0.0.19'
          ]);

        const {YMapDefaultMarker} = await ymaps3.import('@yandex/ymaps3-default-ui-theme');

        map.addChild(new YMapDefaultMarker({
            coordinates: [39.021786, 44.141949],
            title: 'Агой',
            subtitle: 'Гранд - отель',
            size: 'normal',
            iconName: 'fallback',
            color: {
                day: '#CDA679',
                night: '#CDA679'
            }
        }));



         setTimeout(() => {
            mapContainer.style.opacity = 1;
         },1500)

    }

    function initAOS()
    {
        AOS.init({
            delay: 350,
            once: true
        });
    }
    
    function initTableTabs()
    {
        document.querySelectorAll('.invest__tab').forEach(tab => {
            tab.addEventListener('click', function (e) {
                e.preventDefault();
              // Убираем активный класс у всех табов
              document.querySelectorAll('.invest__tab').forEach(t => t.classList.remove('invest__tab--active'));
              // Добавляем активный класс текущему табу
              this.classList.add('invest__tab--active');
          
              // Скрываем все таблицы
              document.querySelectorAll('.invest__table table').forEach(table => table.classList.remove('invest__table--active'));
              // Показываем таблицу с соответствующим data-table-id
              const tableId = this.getAttribute('data-table');
              document.querySelector(`.invest__table table[data-table-id="${tableId}"]`).classList.add('invest__table--active');
            });
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
        fixScroller();
        initAOS();
        initMap();
        initForms();
        initMask();
        initTableTabs();
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
