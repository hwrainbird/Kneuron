//Unused. Causes Windows to see the script loading in popup.html as a virus.
document.addEventListener('DOMContentLoaded', function () {
    const version = chrome.runtime.getManifest().version;
    document.getElementById('version').textContent = `v${version}`;
});