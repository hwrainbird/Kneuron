// Kneuron extension by Cortex R&D Inc.

function injectCSS(css) {
    const style = document.createElement('style');
    style.textContent = css;
    document.head.appendChild(style);
}

const css = `
[data-tippy-root]:not(:has(.kn-help-tip)) {
    display: none !important;
}

@keyframes highlightElement {
    0% { box-shadow: 0 0 0 2px #ff00d6; }
    50% { box-shadow: 0 0 10px 2px #ff00d6; }
    100% { box-shadow: 0 0 0 2px #ff00d6; }
}

.highlight-before-click {
    animation: highlightElement 0.3s ease-in-out;
}
`;
injectCSS(css);

// Function to highlight and click
function highlightAndClick(element) {
    if (!element) return;

    element.classList.add('highlight-before-click');
    setTimeout(() => {
        element.classList.remove('highlight-before-click');
        element.click();
    }, 300);
}

// Handle keyboard events.
document.addEventListener('keydown', function (event) {
    let element;

    if (event.key === 'Enter') {
        element = document.querySelector('.kn-submit button') || document.querySelector('a.save');
    } else if (event.key === 'Escape') {
        element = document.querySelector('.modal_close') || document.querySelector('a.cancel');
    } else if (event.altKey) {
        if (event.key >= 1 && event.key <= 6) {
            let pageIndex = Number(event.key);
            if (pageIndex === 3 || pageIndex === 4) pageIndex = 7 - pageIndex; //Invert 3 and 4 since Pages is used much more often.
            element = document.querySelector(`#sidebar-nav li:nth-child(${pageIndex}) a`);
        } else if (event.key === '`') {
            element = document.querySelector('.toolbox-back') || document.querySelector('.ast-button');
        } else if ('qaz'.includes(event.key)) {
            let toolIndex = 'qaz'.indexOf(event.key) + 1;
            element = document.querySelector(`.toolboxLinks li:nth-child(${toolIndex}) a`);
        } else if (event.key === 's') {
            element = document.querySelector('.is-active a.settings');
        }
    }

    if (element) highlightAndClick(element);
});
