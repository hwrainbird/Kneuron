//Hide tooltip popup.
function injectCSS(css) {
    const style = document.createElement('style');
    style.textContent = css;
    document.head.appendChild(style);
}

const css = `
[data-tippy-root] {
    display: none !important;
}
`;

injectCSS(css);

//Handle keyboard events.
document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') {
        const closeButton = document.querySelector('.modal_close');
        closeButton && closeButton.click();

        const cancelButton = document.querySelector('a.cancel');
        cancelButton && cancelButton.click();
    }
});

