/*!***************************************************
 * yatranslate.js v1.0.0
 * https://Get-Web.Site/
 * author: Vitalii P.
 *****************************************************/

var yatranslate = {
    /* Original language */
    lang: "ru",
    /* The language we translate into on the first visit */
    /* Язык, на который переводим при первом посещении */
    // langFirstVisit: 'en',
};

document.addEventListener('DOMContentLoaded', function () {
    // Start
    yaTranslateInit();
})

function yaTranslateInit() {

    //if (localStorage.getItem('yt-widget')) {
        /* Если установлен язык перевода для первого посещения и в localStorage нет yt-widget */
        /* If the translation language is installed for the first visit and in localStorage no yt-widget */
        //yaTranslateSetLang(localStorage.getItem('yt-widget').lang);
        //yatranslate.lang = JSON.parse(localStorage["yt-widget"]).lang;
    //}

    // Подключаем виджет yandex translate
    // Connecting the yandex translate widget
    let script = document.createElement('script');
    script.src = `https://translate.yandex.net/website-widget/v1/widget.js?widgetId=ytWidget&pageLang=ru&widgetTheme=light&autoMode=false`;
    document.getElementsByTagName('head')[0].appendChild(script);

    // Получаем и записываем язык на который переводим
    // We get and write down the language into which we translate
    let code = yaTranslateGetCode();

    // Показываем текущий язык в меню
    // Show the current language in the menu
    yaTranslateHtmlHandler(code);

    // Вешаем событие клик на флаги
    // We hang the event click on the flags
    yaTranslateEventHandler('click', '[data-ya-lang]', function (el) {
        let parent = el.closest(".lang");
        let outside = parent.querySelector("[data-lang-active]");
        yaTranslateSetLang(outside.getAttribute('data-ya-lang'));
        // Перезагружаем страницу
        // Reloading the page
        window.location.reload();
    })
}

function yaTranslateSetLang(lang) {
    // Записываем выбранный язык в localStorage объект yt-widget 
    // Writing the selected language to localStorage 
    localStorage.setItem('yt-widget', JSON.stringify({
        "lang": lang,
        "active": true
    }));
}

function yaTranslateGetCode() {
    // Возвращаем язык на который переводим
    // Returning the language to which we are translating
    return (localStorage["yt-widget"] != undefined && JSON.parse(localStorage["yt-widget"]).lang != undefined) ? JSON.parse(localStorage["yt-widget"]).lang : yatranslate.lang;
}

function yaTranslateHtmlHandler(code) {
    // Получаем язык на который переводим и производим необходимые манипуляции с DOM
    // We get the language to which we translate and produce the necessary manipulations with DOM 

    let langs = document.querySelectorAll(".lang");
    langs.forEach((lang) => {
        let countries = lang.querySelector(".lang__inside-countries");

        let targetCountry = countries.querySelector('[data-ya-lang="' + code + '"]');

        lang.querySelector('[data-lang-active]').innerHTML = targetCountry.innerHTML;
    
        lang.querySelector('[data-lang-active]').setAttribute("data-ya-lang", code);
    
        targetCountry.remove();
    })



}

function yaTranslateEventHandler(event, selector, handler) {
    document.addEventListener(event, function (e) {
        let el = e.target.closest(selector);
        if (el) handler(el);
    });
}