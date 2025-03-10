document.addEventListener("DOMContentLoaded",(event) => {
    const body = document.querySelector("body");
    const header = document.querySelector("header");
    const mainEl = document.querySelector("main");

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
    
    function init()
    {
        initAdapt();
        mobileMenu();
        headerHide();
        initSlides();
        mainMarginTop();
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
