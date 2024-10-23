//Kneuron extension by Cortex R&D Inc.

//Hide tooltip popup.
function injectCSS(css) {
    const style = document.createElement('style');
    style.textContent = css;
    document.head.appendChild(style);
}

const css = `
[data-tippy-root]:not(:has(.kn-help-tip)) {
    display: none !important;
}
`;

injectCSS(css);

//Handle keyboard events.
document.addEventListener('keydown', function (event) {
    if (event.key === 'Enter') {
        const saveOrSubmitButton = document.querySelector('.kn-submit button') || document.querySelector('a.save');
        saveOrSubmitButton && saveOrSubmitButton.click();
    } else if (event.key === 'Escape') {
        const closeOrCancelButton = document.querySelector('.modal_close') || document.querySelector('a.cancel');
        closeOrCancelButton && closeOrCancelButton.click();
    } else if (event.altKey) {
        if (event.key >= 1 && event.key <= 6) {
            let pageIndex = Number(event.key);
            if (pageIndex === 3) //Invert 3 and 4 since Pages is used so much more often.
                pageIndex = 4;
            else if (pageIndex === 4)
                pageIndex = 3;
            document.querySelector(`#sidebar-nav li:nth-child(${pageIndex}) a`).click();
        } else if (event.key === '`') {
            const backButton = document.querySelector(`.toolbox-back`) || document.querySelector(`.ast-button`);
            backButton && backButton.click();
        } else if (`qaz`.includes(event.key)) {
            let toolIndex = 'qaz'.indexOf(event.key) + 1;
            const toolElement = document.querySelector(`.toolboxLinks li:nth-child(${toolIndex}) a`);
            toolElement && toolElement.click();
        } else if (event.key === 's') {
            const viewSettings = document.querySelector(`.is-active a.settings`).click();
            viewSettings && viewSettings.click();
        }
    }
});

