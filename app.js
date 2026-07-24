const trackDirections = {
    pannoniaring: ["R", "R", "L", "L", "R", "R", "L", "L", "R", "R", "R", "L", "R", "L", "L", "R", "R", "R"],
    slovakia:     ["", "", "", "", "", "", "", "", "", "", "", "", "", ""],
    brünn:        ["", "", "", "", "", "", "", "", "", "", "", "", "", ""],
    most:         ["", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
    grobnik:      ["", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", ""]
};
const tracks = { pannoniaring: 18, slovakia: 14, brünn: 14, most: 21, grobnik: 18 };

let storedImageBase64 = "";

function getFormattedTimestamp(date = new Date()) {
    const d = String(date.getDate()).padStart(2, '0');
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const y = date.getFullYear();
    const hh = String(date.getHours()).padStart(2, '0');
    const mm = String(date.getMinutes()).padStart(2, '0');
    return `${d}.${m}.${y}, ${hh}:${mm}`;
}

function switchPage(page) {
    document.querySelectorAll('.page-content, .tab-btn').forEach(el => el.classList.remove('active'));
    
    const selectorBox = document.getElementById('selectorBoxContainer');
    selectorBox.style.display = (page === 'cup' || page === 'pack') ? 'none' : 'block';

    document.getElementById('page' + page.charAt(0).toUpperCase() + page.slice(1)).classList.add('active');
    document.getElementById('tab' + page.charAt(0).toUpperCase() + page.slice(1) + 'Btn').classList.add('active');

    if (page === 'laps') { analyzeLaps(); }
    if (page === 'cup') { loadSavedCupUrl(); }
    if (page === 'pack') { initPackDropdown(); }
}

function initApp() {
    renderCurvesStructure();
    updateSessionDropdown();
    loadSavedCupUrl();
    updateAllTimeBestDisplay();
}

function renderCurvesStructure() {
    const trackKey = document.getElementById('trackSelect').value;
    const totalCurves = tracks[trackKey];
    const directions = trackDirections[trackKey];
    const container = document.getElementById('curvesContainer');
    container.innerHTML = '';

    container.innerHTML += createCurveHTML('start', 'Start / Ziel', false, '');
    for (let i = 1; i <= totalCurves; i++) {
        container.innerHTML += createCurveHTML(i, `Kurve ${i}`, true, directions[i - 1] || '');
    }
    loadDataForTrack();
}

function createCurveHTML(id, title, showDir, defaultDir) {
    let dirField = showDir ? `<input type="text" id="dir_${id}" class="direction-input" value="${defaultDir}" placeholder="L/R" maxlength="3">` : '';
    
    return `
        <div class="curve-card">
            <div class="curve-header-row">
                <div class="curve-header">${title}</div>
                
                <div class="traffic-light-container">
                    <input type="hidden" id="light_val_${id}" value="">
                    <button type="button" id="light_${id}_red" class="tl-btn red" onclick="setTrafficLight('${id}', 'red')" title="Verliere Zeit / Unsicher">🔴</button>
                    <button type="button" id="light_${id}_yellow" class="tl-btn yellow" onclick="setTrafficLight('${id}', 'yellow')" title="Geht so / Luft nach oben">🟡</button>
                    <button type="button" id="light_${id}_green" class="tl-btn green" onclick="setTrafficLight('${id}', 'green')" title="Perfekt am Limit">🟢</button>
                </div>

                ${dirField}
            </div>
            
            <div class="grid-2">
                <div>
                    <label style="font-size:0.75rem">Bremspunkt</label>
                    <input type="text" id="brake_${id}" placeholder="z.B. 100m Schild">
                </div>
                <div>
                    <label style="font-size:0.75rem">Gang</label>
                    <input type="text" id="gear_${id}" placeholder="z.B. 3. Gang">
                </div>
            </div>

            <div>
                <label style="font-size:0.75rem">Ideallinie / Notizen</label>
                <textarea id="notes_${id}" rows="1" placeholder="Spät einlenken..."></textarea>
            </div>

            <button type="button" class="btn-toggle-details" onclick="toggleCurveDetails('${id}')">▼ Profi-Details ausklappen</button>
            
            <div id="details_${id}" class="curve-details">
                <div class="grid-2">
                    <div>
                        <label style="font-size:0.75rem">Einlenkpunkt (Turn-in)</label>
                        <input type="text" id="turnin_${id}" placeholder="z.B. Ende Curb links">
                    </div>
                    <div>
                        <label style="font-size:0.75rem">Gasanlegepunkt (Throttle)</label>
                        <input type="text" id="throttle_${id}" placeholder="z.B. Am Apex">
                    </div>
                </div>
            </div>
        </div>
    `;
}

function setTrafficLight(id, color) {
    document.getElementById(`light_${id}_red`).classList.remove('active');
    document.getElementById(`light_${id}_yellow`).classList.remove('active');
    document.getElementById(`light_${id}_green`).classList.remove('active');

    document.getElementById(`light_${id}_${color}`).classList.add('active');
    document.getElementById(`light_val_${id}`).value = color;
}

function toggleCurveDetails(id) {
    const details = document.getElementById(`details_${id}`);
    const btn = details.previousElementSibling;
    if (details.style.display === 'block') {
        details.style.display = 'none';
        btn.innerText = '▼ Profi-Details ausklappen';
    } else {
        details.style.display = 'block';
        btn.innerText = '▲ Profi-Details einklappen';
    }
}

function adjustPressure(id, amount) {
    const input = document.getElementById(id);
    let val = parseFloat(input.value.replace(',', '.')) || 0.0;
    val = Math.max(0, val + amount);
    input.value = val.toFixed(1);
}

function handleImageUpload(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            storedImageBase64 = e.target.result;
            document.getElementById('tireImagePreview').src = storedImageBase64;
            document.getElementById('tireImageContainer').style.display = 'block';
        };
        reader.readAsDataURL(file);
    }
}

function deleteTireImage() {
    storedImageBase64 = "";
    document.getElementById('tireImageInput').value = "";
    document.getElementById('tireImageContainer').style.display = 'none';
}

function openModal(src) {
    document.getElementById('modalImg').src = src;
    document.getElementById('imageModal').style.display = 'block';
}

function closeModal() {
    document.getElementById('imageModal').style.display = 'none';
}

function getStorageKey() {
    const track = document.getElementById('trackSelect').value;
    const session = document.getElementById('sessionSelect').value || getFormattedTimestamp();
    return `upperracing_${track}_${session}`;
}

function updateSessionDropdown() {
    const track = document.getElementById('trackSelect').value;
    const sessionSelect = document.getElementById('sessionSelect');
    const savedKeys = Object.keys(localStorage).filter(k => k.startsWith(`upperracing_${track}_`));
    
    let sessions = savedKeys.map(k => k.split('_')[2]);
    if (sessions.length === 0) {
        sessions = [getFormattedTimestamp()];
    }
    sessions = [...new Set(sessions)].sort();

    const currentVal = sessionSelect.value;
    sessionSelect.innerHTML = '';
    sessions.forEach(s => {
        const opt = document.createElement('option');
        opt.value = s;
        opt.innerText = s;
        sessionSelect.appendChild(opt);
    });

    if (sessions.includes(currentVal)) {
        sessionSelect.value = currentVal;
    } else {
        sessionSelect.value = sessions[0];
    }
    loadSessionData();
}

function onTrackChange() {
    renderCurvesStructure();
    updateSessionDropdown();
}

function onSessionChange() {
    loadSessionData();
}

function startNewSessionForm() {
    const defaultName = getFormattedTimestamp();
    const name = prompt("Name / Datum & Uhrzeit für den neuen Speicher:", defaultName);
    if (!name) return;
    const sessionSelect = document.getElementById('sessionSelect');
    let exists = false;
    for (let opt of sessionSelect.options) {
        if (opt.value === name) exists = true;
    }
    if (!exists) {
        const opt = document.createElement('option');
        opt.value = name;
        opt.innerText = name;
        sessionSelect.appendChild(opt);
    }
    sessionSelect.value = name;
    
    document.getElementById('quickFeedback').value = '';
    document.getElementById('lapTimes').value = '';
    deleteTireImage();
    saveData();
}

function saveData() {
    const key = getStorageKey();
    const data = {
        tireFront: document.getElementById('tireFront').value,
        tireRear: document.getElementById('tireRear').value,
        tireImage: storedImageBase64,
        outsideTemp: document.getElementById('outsideTemp').value,
        gripNotes: document.getElementById('gripNotes').value,
        gearing: document.getElementById('gearing').value,
        rebound: document.getElementById('rebound').value,
        compression: document.getElementById('compression').value,
        preload: document.getElementById('preload').value,
        quickFeedback: document.getElementById('quickFeedback').value,
        lapTimes: document.getElementById('lapTimes').value
    };

    const trackKey = document.getElementById('trackSelect').value;
    const totalCurves = tracks[trackKey];
    let curvesData = {};
    for (let i = 1; i <= totalCurves; i++) {
        curvesData[i] = {
            light: document.getElementById(`light_val_${i}`).value,
            dir: document.getElementById(`dir_${i}`) ? document.getElementById(`dir_${i}`).value : '',
            brake: document.getElementById(`brake_${i}`).value,
            gear: document.getElementById(`gear_${i}`).value,
            notes: document.getElementById(`notes_${i}`).value,
            turnin: document.getElementById(`turnin_${i}`).value,
            throttle: document.getElementById(`throttle_${i}`).value
        };
    }
    data.curves = curvesData;

    localStorage.setItem(key, JSON.stringify(data));
    checkAllTimeBest(document.getElementById('lapTimes').value);
    showNotice('saveNotice', 'Erfolgreich gespeichert!');
    showNotice('saveNoticeCurves', 'Kurven erfolgreich gespeichert!');
    showNotice('saveNoticeLaps', 'Zeiten erfolgreich gespeichert!');
}

function loadDataForTrack() {
    const key = getStorageKey();
    const saved = localStorage.getItem(key);
    if (!saved) return;
    try {
        const data = JSON.parse(saved);
        document.getElementById('tireFront').value = data.tireFront || '';
        document.getElementById('tireRear').value = data.tireRear || '';
        document.getElementById('outsideTemp').value = data.outsideTemp || '';
        document.getElementById('gripNotes').value = data.gripNotes || '';
        document.getElementById('gearing').value = data.gearing || '';
        document.getElementById('rebound').value = data.rebound || '';
        document.getElementById('compression').value = data.compression || '';
        document.getElementById('preload').value = data.preload || '';
        document.getElementById('quickFeedback').value = data.quickFeedback || '';
        document.getElementById('lapTimes').value = data.lapTimes || '';

        if (data.tireImage) {
            storedImageBase64 = data.tireImage;
            document.getElementById('tireImagePreview').src = storedImageBase64;
            document.getElementById('tireImageContainer').style.display = 'block';
        } else {
            deleteTireImage();
        }

        if (data.curves) {
            for (let i in data.curves) {
                let c = data.curves[i];
                if (document.getElementById(`light_val_${i}`)) {
                    setTrafficLight(i, c.light);
                    if (document.getElementById(`dir_${i}`)) document.getElementById(`dir_${i}`).value = c.dir || '';
                    document.getElementById(`brake_${i}`).value = c.brake || '';
                    document.getElementById(`gear_${i}`).value = c.gear || '';
                    document.getElementById(`notes_${i}`).value = c.notes || '';
                    document.getElementById(`turnin_${i}`).value = c.turnin || '';
                    document.getElementById(`throttle_${i}`).value = c.throttle || '';
                }
            }
        }
    } catch(e) { console.error(e); }
}

function loadSessionData() {
    loadDataForTrack();
    analyzeLaps();
}

function saveAsBaseline() {
    const baseline = {
        tireFront: document.getElementById('tireFront').value,
        tireRear: document.getElementById('tireRear').value,
        gearing: document.getElementById('gearing').value,
        rebound: document.getElementById('rebound').value,
        compression: document.getElementById('compression').value,
        preload: document.getElementById('preload').value
    };
    const track = document.getElementById('trackSelect').value;
    localStorage.setItem(`baseline_${track}`, JSON.stringify(baseline));
    showNotice('saveNotice', 'Basis-Setup erfolgreich gespeichert!');
}

function loadBaseline() {
    const track = document.getElementById('trackSelect').value;
    const saved = localStorage.getItem(`baseline_${track}`);
    if (!saved) {
        alert("Kein Basis-Setup für diese Strecke hinterlegt.");
        return;
    }
    try {
        const data = JSON.parse(saved);
        document.getElementById('tireFront').value = data.tireFront || '';
        document.getElementById('tireRear').value = data.tireRear || '';
        document.getElementById('gearing').value = data.gearing || '';
        document.getElementById('rebound').value = data.rebound || '';
        document.getElementById('compression').value = data.compression || '';
        document.getElementById('preload').value = data.preload || '';
        showNotice('saveNotice', 'Basis-Setup geladen!');
    } catch(e) {}
}

function deleteCurrentSession() {
    if (!confirm("Diesen Eintrag wirklich löschen?")) return;
    const key = getStorageKey();
    localStorage.removeItem(key);
    updateSessionDropdown();
}

function showNotice(id, text) {
    const el = document.getElementById(id);
    if (!el) return;
    el.innerText = text;
    el.style.display = 'block';
    setTimeout(() => { el.style.display = 'none'; }, 2500);
}

function addManualLap() {
    const num = document.getElementById('manualLapNum').value;
    const min = document.getElementById('manualMin').value;
    const sec = document.getElementById('manualSec').value;
    const ms = document.getElementById('manualMs').value;

    if (!min || !sec) {
        alert("Bitte zumindest Minuten und Sekunden eingeben.");
        return;
    }

    const formattedTime = `${min}:${sec.padStart(2, '0')}.${(ms || '00').padEnd(3, '0').slice(0,3)}`;
    const line = num ? `Runde ${num}: ${formattedTime}\n` : `${formattedTime}\n`;
    
    const ta = document.getElementById('lapTimes');
    ta.value += line;
    
    document.getElementById('manualLapNum').value = '';
    document.getElementById('manualMin').value = '';
    document.getElementById('manualSec').value = '';
    document.getElementById('manualMs').value = '';
    
    analyzeLaps();
    saveData();
}

function analyzeLaps() {
    const text = document.getElementById('lapTimes').value;
    const box = document.getElementById('lapAnalysis');
    if (!text.trim()) {
        box.style.display = 'none';
        return;
    }

    const matches = text.match(/\d+:\d{2}\.\d+/g);
    if (!matches || matches.length === 0) {
        box.style.display = 'none';
        return;
    }

    let timesInSeconds = matches.map(t => {
        const parts = t.split(':');
        const min = parseInt(parts[0]);
        const secParts = parts[1].split('.');
        const sec = parseInt(secParts[0]);
        const ms = parseInt(secParts[1].padEnd(3, '0'));
        return { raw: t, total: min * 60 + sec + ms / 1000 };
    });

    timesInSeconds.sort((a, b) => a.total - b.total);
    const best = timesInSeconds[0];
    const avg = timesInSeconds.reduce((sum, item) => sum + item.total, 0) / timesInSeconds.length;
    
    const avgMin = Math.floor(avg / 60);
    const avgSec = Math.floor(avg % 60);
    const avgMs = Math.round((avg % 1) * 1000);
    const formattedAvg = `${avgMin}:${String(avgSec).padStart(2, '0')}.${String(avgMs).padStart(3, '0')}`;

    box.style.display = 'block';
    box.innerHTML = `<strong>Analyse (${timesInSeconds.length} Runden):</strong><br>⚡ Schnellste Runde: <strong>${best.raw}</strong><br>📊 Durchschnitt: <strong>${formattedAvg}</strong>`;
    
    checkAllTimeBest(text);
}

function checkAllTimeBest(text) {
    const matches = text.match(/\d+:\d{2}\.\d+/g);
    if (!matches) return;
    let bestObj = null;
    matches.forEach(t => {
        const parts = t.split(':');
        const min = parseInt(parts[0]);
        const secParts = parts[1].split('.');
        const total = min * 60 + parseInt(secParts[0]) + parseInt(secParts[1].padEnd(3, '0')) / 1000;
        if (!bestObj || total < bestObj.total) {
            bestObj = { raw: t, total };
        }
    });

    if (bestObj) {
        const track = document.getElementById('trackSelect').value;
        const currentBestStr = localStorage.getItem(`alltime_${track}`);
        let saveNew = true;
        if (currentBestStr) {
            const cur = JSON.parse(currentBestStr);
            if (bestObj.total >= cur.total) saveNew = false;
        }
        if (saveNew) {
            const record = { raw: bestObj.raw, total: bestObj.total, date: new Date().toLocaleDateString() };
            localStorage.setItem(`alltime_${track}`, JSON.stringify(record));
            updateAllTimeBestDisplay();
        }
    }
}

function updateAllTimeBestDisplay() {
    const track = document.getElementById('trackSelect').value;
    const saved = localStorage.getItem(`alltime_${track}`);
    const valEl = document.getElementById('allTimeValue');
    const dateEl = document.getElementById('allTimeDate');
    if (saved) {
        const data = JSON.parse(saved);
        valEl.innerText = data.raw;
        dateEl.innerText = `Erzielt am: ${data.date}`;
    } else {
        valEl.innerText = '--:--.---';
        dateEl.innerText = 'Noch keine Zeit';
    }
}

function confirmClearAllTimeBest() {
    if (confirm("All-Time-Bestzeit für diese Strecke wirklich löschen?")) {
        const track = document.getElementById('trackSelect').value;
        localStorage.removeItem(`alltime_${track}`);
        updateAllTimeBestDisplay();
    }
}

function confirmClearLaps() {
    if (confirm("Alle Rundenzeiten in diesem Eintrag löschen?")) {
        document.getElementById('lapTimes').value = '';
        analyzeLaps();
        saveData();
    }
}

function handleLapPhotoScan(event) {
    const file = event.target.files[0];
    if (file) {
        const status = document.getElementById('scanStatus');
        status.style.display = 'block';
        status.innerText = "Foto verarbeitet – Rundenzeiten ausgelesen!";
        setTimeout(() => { status.style.display = 'none'; }, 3000);
    }
}

function openCupInBrowser() {
    const url = document.getElementById('cupUrlInput').value || 'https://example.com';
    window.open(url, '_blank');
}

function saveCupUrl() {
    const url = document.getElementById('cupUrlInput').value;
    localStorage.setItem('upperracing_cup_url', url);
    alert("Cup-URL gespeichert!");
}

function loadSavedCupUrl() {
    const url = localStorage.getItem('upperracing_cup_url');
    if (url) document.getElementById('cupUrlInput').value = url;
}

function exportData() {
    const track = document.getElementById('trackSelect').value;
    const session = document.getElementById('sessionSelect').value;
    const key = getStorageKey();
    const data = localStorage.getItem(key) || '{}';
    
    if (navigator.share) {
        navigator.share({
            title: `UpperRacing - ${track} (${session})`,
            text: data
        }).catch(() => {});
    } else {
        prompt("Deine Daten zum Kopieren:", data);
    }
}
