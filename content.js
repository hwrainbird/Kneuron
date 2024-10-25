//Kneuron extension by Cortex R&D Inc.

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
    0% { box-shadow: inset 0 0 0 2px #45003a; }
    50% { box-shadow: inset 0 0 10px 2px #45003a; }
    100% { box-shadow: inset 0 0 0 2px #45003a; }
}

.highlight-before-click {
    animation: highlightElement 0.3s ease-in-out;
}

#pages-toolbox form > div textarea {
   height: 300px;
}
`;
injectCSS(css);

// Generic MutationObserver to watch for HTML changes and take action.
const genericObserver = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
        if (mutation.addedNodes.length) {
            if (mutation.target.querySelector('.toggle-content')) {
                autoExpandHiddenTogglers();
            }
        }
    });
});

// Start observing the document body for changes
genericObserver.observe(document.body, {
    childList: true,
    subtree: true
});

async function waitForElement(selector, timeout = 10000) {
    return new Promise((resolve, reject) => {
        if (document.querySelector(selector)) {
            return resolve(document.querySelector(selector));
        }

        const timeoutId = setTimeout(() => {
            observer.disconnect();
            reject(`Timeout waiting for element: ${selector}`);
        }, timeout);

        const observer = new MutationObserver(() => {
            if (document.querySelector(selector)) {
                clearTimeout(timeoutId);
                observer.disconnect();
                resolve(document.querySelector(selector));
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    });
}

function highlightAndClick(element) {
    if (!element) return;

    element.classList.add('highlight-before-click');
    setTimeout(() => {
        element.classList.remove('highlight-before-click');
        element.click();
    }, 300);
}

document.addEventListener('keydown', async function (event) {
    let element;
    let keyPressed = event.code;

    if (keyPressed === 'Enter') {
        element = document.querySelector('a.save') || document.querySelector('.kn-submit button');

        if (element && (element.closest('#settings-js') || element.closest('#settings-css'))) return;
        event.preventDefault();
    } else if (keyPressed === 'Escape') {
        element = document.querySelector('.modal_close') || document.querySelector('a.cancel');
    } else if (event.altKey) {
        if (keyPressed.includes('Digit')) {
            keyPressed = keyPressed.replace('Digit', '');
        }

        if (keyPressed >= 1 && keyPressed <= 6) {
            let pageIndex = Number(keyPressed);
            if (pageIndex === 3 || pageIndex === 4) pageIndex = 7 - pageIndex; //Invert 3 and 4 since Pages is used much more often.
            element = document.querySelector(`#sidebar-nav li:nth-child(${pageIndex}) a`);

            //This is to prevent the annoying message "You have unsaved changes" that keeps popping up for no reason.
            if (pageIndex === 4) {
                setTimeout(async () => {
                    try {
                        const cancelButton = await waitForElement('a.cancel');
                        cancelButton && cancelButton.click();
                    } catch (error) { }
                }, 0);
            }

        } else if (keyPressed === 'BackQuote') {
            element = document.querySelector('.toolbox-back') || document.querySelector('.ast-button');

        } else if (['KeyQ', 'KeyA', 'KeyZ', 'KeyX'].includes(keyPressed)) { //For Pages only, when a view is selected.
            //Go back to Settings if necessary.
            const toolboxSelector = `[data-cy=toolbox-links]`;
            if (!document.querySelector(toolboxSelector)) {
                element = document.querySelector('.is-active a.settings');
                if (element) highlightAndClick(element);

                try {
                    await waitForElement(toolboxSelector);
                    processSecondColumnKeys();
                } catch (error) { }
            } else
                processSecondColumnKeys();

            function processSecondColumnKeys() {
                let toolIndex = ['KeyQ', 'KeyA', 'KeyZ', 'KeyX'].indexOf(keyPressed) + 1;
                element = document.querySelector(`[data-cy=toolbox-links] li:nth-child(${toolIndex}) a`);
            }

        } else if (keyPressed === 'KeyS') {
            element = document.querySelector('.is-active a.settings') || document.querySelector('a.save');
        }
    }

    if (element) highlightAndClick(element);
});

//Auto-detect closed "togglers" and open them.  We have them in list views' settings.
async function autoExpandHiddenTogglers() {
    try {
        await waitForElement('.toggle-content:not(.auto-open-processed)');

        const hiddenToggles = Array.from(document.querySelectorAll('.toggle-content:not(.auto-open-processed)')).filter(el => {
            const style = window.getComputedStyle(el);
            return style.visibility === 'hidden' || style.maxHeight === '0px';
        });

        hiddenToggles.forEach(toggle => {
            const wrapper = toggle.closest('.toggle-wrapper');
            const trigger = wrapper.querySelector('.toggle-trigger');
            trigger.click();
            toggle.classList.add('auto-open-processed');
        });
    } catch (error) { }
}