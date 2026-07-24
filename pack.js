function initPackDropdown() {
    const select = document.getElementById('packDateSelect');
    const savedKeys = Object.keys(localStorage).filter(k => k.startsWith('upperracing_pack_'));
    let dates = savedKeys.map(k => k.replace('upperracing_pack_', ''));
    if (dates.length === 0) dates = [new Date().toISOString().split('T')[0]];
    dates = [...new Set(dates)].sort();

    const currentVal = select.value;
    select.innerHTML = '';
    dates.forEach(d => {
        const opt = document.createElement('option');
        opt.value = d;
        opt.innerText = d;
        select.appendChild(opt);
    });
    select.value = dates.includes(currentVal) ? currentVal : dates[0];
    loadPacking();
}

function onPackDateChange() {
    loadPacking();
}

function startNewPackSession() {
    const today = new Date().toISOString().split('T')[0];
    const name = prompt("Datum / Event-Name für neue Packliste:", today);
    if (!name) return;
    const select = document.getElementById('packDateSelect');
    let exists = false;
    for (let opt of select.options) {
        if (opt.value === name) exists = true;
    }
    if (!exists) {
        const opt = document.createElement('option');
        opt.value = name;
        opt.innerText = name;
        select.appendChild(opt);
    }
    select.value = name;
    loadPacking();
}

function savePacking(showMsg = false) {
    const dateKey = document.getElementById('packDateSelect').value || 'default';
    const items = [];
    document.querySelectorAll('#pagePack .pack-item').forEach(itemEl => {
        const cb = itemEl.querySelector('input[type="checkbox"]');
        const label = itemEl.querySelector('label');
        if (cb && label) {
            items.push({
                id: cb.id,
                text: label.innerText,
                checked: cb.checked
            });
        }
    });
    localStorage.setItem(`upperracing_pack_${dateKey}`, JSON.stringify(items));
    if (showMsg) showNotice('saveNoticePack', 'Packliste gespeichert!');
}

function loadPacking() {
    const dateKey = document.getElementById('packDateSelect').value || 'default';
    const saved = localStorage.getItem(`upperracing_pack_${dateKey}`);
    
    if (saved) {
        try {
            const items = JSON.parse(saved);
            // Optionaler Ladestatus für Checkboxen
        } catch(e) {}
    }
}

function deletePackItem(btn) {
    if (confirm("Diesen Eintrag wirklich aus der Packliste löschen?")) {
        btn.closest('.pack-item').remove();
        savePacking();
    }
}

function addCategoryItem(catNum) {
    const input = document.getElementById(`add_input_${catNum}`);
    const val = input.value.trim();
    if (!val) return;
    
    const container = document.getElementById(`cat_items_${catNum}`);
    const newId = 'custom_' + Date.now() + Math.random().toString(36).substr(2, 4);
    
    const div = document.createElement('div');
    div.className = 'pack-item';
    div.innerHTML = `
        <div class="pack-item-left">
            <input type="checkbox" id="${newId}" onchange="savePacking()">
            <label for="${newId}">${val}</label>
        </div>
        <button type="button" class="btn-small-danger" onclick="deletePackItem(this)">✕</button>
    `;
    container.appendChild(div);
    input.value = '';
    savePacking();
}
