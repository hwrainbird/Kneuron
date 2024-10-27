//Kneuron extension by Cortex R&D Inc.

function injectCSS(css) {
    const style = document.createElement('style');
    style.textContent = css;
    document.head.appendChild(style);
}

const ERROR_COLOR = '#e7c8e2';

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

/* Remove the previous CSS and use this instead */
.nav-item {
    position: relative;
    transition: all 0.2s ease-in-out;
}

/* Parent container styles to ensure proper stacking */
#objects-nav .vue-recycle-scroller {
    min-height: 0 !important;
}

#objects-nav .vue-recycle-scroller__item-wrapper {
    transform: none !important;
}

#objects-nav .vue-recycle-scroller__item-view {
    transform: none !important;
    position: relative !important;
}
`;
injectCSS(css);

// Generic MutationObserver to watch for HTML changes and take action.
const genericObserver = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
        if (mutation.addedNodes.length) {
            if (mutation.target.querySelector('.toggle-content:not(.auto-open-processed)')) {
                autoExpandHiddenTogglers();
            }

            if (mutation.target.querySelector('.kn-table-element:not(.reduce-processed)')) {
                reduceGrids();
            }

            if (mutation.target.querySelector('.kn-list-items:not(.reduce-processed)')) {
                reduceLists('.kn-list-items');
            }

            if (mutation.target.querySelector('.kn-list-items:not(.reduce-processed)')) {
                reduceLists('.kn-search-list-wrapper');
            }

            if (mutation.target.querySelector('#objects-nav h3.text-emphasis')) {
                addTablesFilter();
            }

            if (mutation.target.querySelector('select[data-cy="movecopy-select"]:not(.filter-processed)')) {
                addMoveCopyViewFilter();
                mutation.target.querySelector('select[data-cy="movecopy-select"]').classList.add('filter-processed');
            }

            if (mutation.target.querySelector('h3[data-cy="page-filter-menu"]:not(.filter-processed)')) {
                addPagesFilter();
                mutation.target.querySelector('h3[data-cy="page-filter-menu"]').classList.add('filter-processed');
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
    element.focus();
    setTimeout(() => {
        element.classList.remove('highlight-before-click');
        element.click();
    }, 300);
}

document.addEventListener('keydown', async function (event) {
    // First check if we're in an input field
    if (event.altKey &&
        event.code.startsWith('Digit') &&
        event.code.replace('Digit', '') >= 1 &&
        event.code.replace('Digit', '') <= 6) {
        // Check if we're in an input field or contenteditable element
        const activeElement = document.activeElement;
        if ((activeElement.tagName === 'INPUT' && !activeElement.id.startsWith('incremental-filter')) ||
            activeElement.tagName === 'TEXTAREA' ||
            activeElement.isContentEditable) {
            return; // Exit early, allowing default Alt+number behavior
        }
    }

    let element;
    let keyPressed = event.code;
    const isMultiLineInput = event.target.tagName === 'TEXTAREA';

    //if ((!isMultiLineInput && (keyPressed === 'Enter') || (event.shiftKey && keyPressed === 'Enter'))) {
    if ((!isMultiLineInput && keyPressed === 'Enter') || (isMultiLineInput && event.ctrlKey && keyPressed === 'Enter')) {
        element = document.querySelector('[data-cy=confirm]') || document.querySelector('a.save') || document.querySelector('.kn-submit button');

        if (element && (element.closest('#settings-js') || element.closest('#settings-css')))
            return; //Ignore Enter in the Javascript and CSS editors.  Use Alt-S to save, see below KeyS.

        event.preventDefault();
    } else if (keyPressed === 'Escape') {
        element = document.querySelector('[data-cy=cancel]') || document.querySelector('.modal_close') || document.querySelector('a.cancel');
    } else if (event.altKey) {
        if (keyPressed.includes('Digit')) {
            keyPressed = keyPressed.replace('Digit', '');
        }

        if (keyPressed >= 1 && keyPressed <= 6) {
            let pageIndex = Number(keyPressed);
            if (pageIndex === 3 || pageIndex === 4) pageIndex = 7 - pageIndex; //Invert 3 and 4 since Pages is used much more often than Tasks.
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

        } else if (keyPressed === 'Backquote') {
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
            //Does three things, depending on context: 
            // 1- Activate the Settings toolbox, when a view is selected
            // 2- Puts cursor on the Filter box when it is visible
            // 3- Click on Save, when Javascript or CSS editor is active
            element = document.querySelector('[id^=incremental-filter]') || document.querySelector('.is-active a.settings') || document.querySelector('a.save');
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

// Reduce long grids
async function reduceGrids() {
    try {
        await waitForElement('.kn-table-element:not(.reduce-processed)');

        document.querySelectorAll('#pages .kn-table-element:not(.reduce-processed)').forEach(table => {
            table.classList.add('reduce-processed');

            let groupCount = 0; // To limit to the first 3 groups
            let rowsPerGroupCount = 0; // To count records under each group

            table.querySelectorAll('tbody tr').forEach(row => {
                // Check if the row is a group header
                if (row.classList.contains('kn-table-group')) {
                    groupCount++;
                    rowsPerGroupCount = 0; // Reset record count for the new group

                    // Apply fade-out effects for group headers
                    if (groupCount === 2) {
                        row.style.opacity = '75%';
                    } else if (groupCount === 3) {
                        row.style.opacity = '50%';
                    } else if (groupCount >= 4) {
                        // Hide group headers beyond the 3rd group
                        row.style.display = 'none';
                    }
                } else if (!row.classList.contains('kn-table-totals')) {
                    if (groupCount > 3) {
                        // Hide all records beyond the 3rd group
                        row.style.display = 'none';
                    } else {
                        // Increment count for each record row within the first 3 groups
                        rowsPerGroupCount++;

                        // Apply fade-out effects for rows 2 and 3 within the group
                        if (rowsPerGroupCount === 2) {
                            row.style.opacity = '50%';
                        } else if (rowsPerGroupCount === 3) {
                            row.style.opacity = '25%';
                        } else if (rowsPerGroupCount >= 4) {
                            // Hide rows beyond the 3rd record in each group
                            row.style.display = 'none';
                        }
                    }
                }
            });
        });
    } catch (error) {
        console.error('Error in reduceGrids:', error);
    }
}

async function reduceLists(selector) {
    try {
        await waitForElement(`#pages ${selector}:not(.reduce-processed)`);

        document.querySelectorAll(`#pages ${selector}:not(.reduce-processed)`).forEach(list => {
            list.classList.add('reduce-processed');
            let listCount = 0;
            list.querySelectorAll('#pages .list-item-wrapper').forEach(listRecord => {
                listCount++;
                if (listCount === 1) {
                    listRecord.style.opacity = '50%';
                } else if (listCount === 2) {
                    listRecord.style.opacity = '25%';
                } else if (listCount >= 3) {
                    listRecord.style.display = 'none';
                }
            });
        });
    } catch (error) {
        console.error('Error in reduceLists:', error);
    }
}

function addTablesFilter() {
    const tablesTitle = document.querySelector('#objects-nav h3.text-emphasis');
    if (tablesTitle && !document.querySelector('#incremental-filter-tables')) {
        const searchInput = document.createElement('input');
        searchInput.type = 'text';
        searchInput.placeholder = 'Filter tables...';
        searchInput.style.marginLeft = '30px';
        searchInput.style.padding = '2px 5px';
        searchInput.style.fontSize = '14px';
        searchInput.style.borderRadius = '4px';
        searchInput.style.border = '1px solid #ccc';
        searchInput.style.height = '35px';
        searchInput.id = 'incremental-filter-tables';
        searchInput.addEventListener('input', (e) => {
            document.querySelector('.left-toolbox').scrollTop = 0;
            const hasMatches = filterListItems(e.target.value);
            searchInput.style.backgroundColor = hasMatches ? 'white' : ERROR_COLOR;
        });
        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                searchInput.value = '';
                filterListItems('');
                searchInput.blur();
                searchInput.style.backgroundColor = 'white';
            }
        });
        tablesTitle.appendChild(searchInput);
    }

    function filterListItems(searchText) {
        const listItems = document.querySelectorAll('[id^=object-li-object_].nav-item');
        const searchLower = searchText.toLowerCase();
        let matchFound = false;

        listItems.forEach(item => {
            const spanContent = item.querySelector('span[content]')?.textContent || '';
            const isMatch = spanContent.toLowerCase().includes(searchLower);
            item.style.display = isMatch ? 'block' : 'none';
            item.style.position = isMatch ? 'relative' : 'absolute';
            item.style.height = isMatch ? '' : '0';
            item.style.margin = isMatch ? '' : '0';
            item.style.padding = isMatch ? '' : '0';
            if (isMatch) matchFound = true;
        });

        return matchFound;
    }
}

function addMoveCopyViewFilter() {
    const selectElement = document.querySelector('select[data-cy="movecopy-select"]');
    if (selectElement && !document.querySelector('#incremental-filter-movecopy')) {
        // Create filter input
        const searchInput = document.createElement('input');
        searchInput.type = 'text';
        searchInput.placeholder = 'Filter pages...';
        searchInput.style.marginBottom = '10px';
        searchInput.style.padding = '2px 5px';
        searchInput.style.fontSize = '14px';
        searchInput.style.borderRadius = '4px';
        searchInput.style.border = '1px solid #ccc';
        searchInput.style.height = '35px';
        searchInput.style.width = '100%';
        searchInput.id = 'incremental-filter-movecopy';

        // Create popup for results
        const resultsPopup = document.createElement('div');
        resultsPopup.id = 'filter-results-popup';
        resultsPopup.style.position = 'absolute';
        resultsPopup.style.maxHeight = '200px';
        resultsPopup.style.top = '84px';
        resultsPopup.style.overflowY = 'auto';
        resultsPopup.style.backgroundColor = 'white';
        resultsPopup.style.border = '1px solid #ccc';
        resultsPopup.style.borderRadius = '4px';
        resultsPopup.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
        resultsPopup.style.zIndex = '1000';
        resultsPopup.style.display = 'none';
        resultsPopup.style.width = 'max-content';

        searchInput.addEventListener('input', (e) => {
            const hasMatches = filterOptions(e.target.value);
            searchInput.style.backgroundColor = hasMatches ? 'white' : ERROR_COLOR;

            // Show/hide popup based on whether there's input
            resultsPopup.style.display = e.target.value ? 'block' : 'none';
        });

        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                searchInput.value = '';
                filterOptions('');
                searchInput.blur();
                searchInput.style.backgroundColor = 'white';
                resultsPopup.style.display = 'none';
            }
        });

        // Add input and popup to the page
        const container = document.createElement('div');
        container.style.position = 'relative';
        container.appendChild(searchInput);
        container.appendChild(resultsPopup);
        selectElement.parentNode.insertBefore(container, selectElement);
    }

    function filterOptions(searchText) {
        const options = document.querySelectorAll('select[data-cy="movecopy-select"] option');
        const searchLower = searchText.toLowerCase();
        let matchFound = false;
        let matchingResults = [];

        options.forEach(option => {
            const optionText = option.textContent || '';
            const isMatch = optionText.toLowerCase().includes(searchLower);
            option.style.display = isMatch ? '' : 'none';
            if (isMatch) {
                matchFound = true;
                matchingResults.push(optionText);
            }
        });

        // Update popup content
        const resultsPopup = document.querySelector('#filter-results-popup');
        if (resultsPopup) {
            resultsPopup.innerHTML = matchingResults.map(text =>
                `<div style="font-size: medium; padding: 5px 10px; cursor: pointer; hover:background-color: #f5f5f5;">${text}</div>`
            ).join('');

            // Add click handlers for results
            resultsPopup.querySelectorAll('div').forEach((div, index) => {
                div.addEventListener('mouseover', () => {
                    div.style.backgroundColor = '#f5f5f5';
                });
                div.addEventListener('mouseout', () => {
                    div.style.backgroundColor = 'white';
                });
                div.addEventListener('click', () => {
                    // Find and select the corresponding option in the select element
                    const options = Array.from(document.querySelectorAll('select[data-cy="movecopy-select"] option'));
                    const matchingOption = options.find(opt => opt.textContent === div.textContent);
                    if (matchingOption) {
                        matchingOption.selected = true;
                        resultsPopup.style.display = 'none';
                    }
                });
            });
        }

        return matchFound;
    }
}

function addPagesFilter() {
    const filterTitle = document.querySelector('h3[data-cy="page-filter-menu"]');
    if (filterTitle && !document.querySelector('#incremental-filter-pages')) {
        const searchInput = document.createElement('input');
        searchInput.type = 'text';
        searchInput.placeholder = 'Filter pages...';
        searchInput.style.marginLeft = '30px';
        searchInput.style.padding = '2px 5px';
        searchInput.style.fontSize = '14px';
        searchInput.style.borderRadius = '4px';
        searchInput.style.border = '1px solid #ccc';
        searchInput.style.height = '35px';
        searchInput.id = 'incremental-filter-pages';

        searchInput.addEventListener('mousedown', (e) => e.stopPropagation());
        searchInput.addEventListener('click', (e) => e.stopPropagation());

        searchInput.addEventListener('input', (e) => {
            const hasMatches = filterPages(e.target.value);
            searchInput.style.backgroundColor = hasMatches ? 'white' : ERROR_COLOR;
        });

        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                searchInput.value = '';
                filterPages('');
                searchInput.blur();
                searchInput.style.backgroundColor = 'white';
            }
        });

        filterTitle.appendChild(searchInput);
    }

    function filterPages(searchText) {
        const pageItems = document.querySelectorAll('li[data-cy="page-link-item"]');
        const searchLower = searchText.toLowerCase();
        let matchFound = false;

        pageItems.forEach(item => {
            const nameElement = item.querySelector('.name');
            const pageText = nameElement ? nameElement.textContent || '' : '';
            const isMatch = pageText.toLowerCase().includes(searchLower);

            item.style.display = isMatch ? '' : 'none';
            if (isMatch) matchFound = true;
        });

        return matchFound;
    }
}
