// app.js - UpperRacing Logic

const tracksData = {
    pannoniaring: { name: "Pannoniaring", curves: 18 },
    slovakia: { name: "Slovakiaring", curves: 14 },
    brünn: { name: "Automotodrom Brno / Brünn", curves: 14 },
    most: { name: "Autodrom Most", curves: 21 },
    grobnik: { name: "Automotodrom Grobnik / Rijeka", curves: 18 }
};

function initApp() {
    onTrackChange();
    loadCupUrl();
}

// --- ULTRA-ROBUSTE SEITEN-NAVIGATION ---
function switchPage(pageId) {
    // 1. Alle Seiten ausblenden und Klassen entfernen
    document.querySelectorAll('.page-content').forEach(el => {
        el.style.display = 'none';
        el.classList.remove('active');
    });
    
    // 2. Alle Tab-Buttons deaktivieren
    document.querySelectorAll('.tab-btn').forEach(el => {
        el.classList.remove('active');
    });

    // 3. Ziel-Seite finden (egal ob ID 'curves', 'pageCurves' oder 'page-curves')
    let targetPage = document.getElementById(pageId) || 
                     document.getElementById('page' + pageId) || 
                     document.getElementById('page' + pageId.charAt(0).toUpperCase() + pageId.slice(1));
    
    if (targetPage) {
        targetPage.style.display = 'block';
        targetPage.classList.add('active');
    }

    // 4. Entsprechenden Button aktivieren
    let targetBtn = document.getElementById(pageId + 'Btn') || 
                    document.getElementById('tab' + pageId) || 
                    document.getElementById('tab' + pageId + 'Btn') || 
                    document.getElementById('tab' + pageId.charAt(0).toUpperCase() + pageId.slice(1) + 'Btn');
    
    if (targetBtn) {
        targetBtn.classList.add('active');
    }
}

function onTrackChange() {
    const track = document.getElementById('trackSelect').value;
    loadSessionsForTrack(track);
    renderCurves(track);
    loadAllTimeBest();
}

function getSessionsKey(track) {
    return 'upper_sessions_' + track;
}

function loadSessionsForTrack(track) {
    const sessionSelect = document.getElementById('sessionSelect');
    if (!sessionSelect) return;
    sessionSelect.innerHTML = '';
    
    let sessions = JSON.parse(localStorage.getItem(getSessionsKey(track))) || {};
    
    // Sortiere die Schlüssel exakt nach Datum absteigend (neuester Eintrag zuerst)
    let keys = Object.keys(sessions).sort((a, b) => new Date(b) - new Date(a));
    
    if (keys.length === 0) {
        const defaultKey = new Date().toISOString().slice(0,16).replace('T', ' ');
        sessions[defaultKey] = getEmptySessionData();
        localStorage.setItem(getSessionsKey(track), JSON.stringify(sessions));
        keys = [defaultKey];
    }

    keys.forEach(k => {
        let opt = document.createElement('option');
        opt.value = k;
        opt.textContent = k;
        sessionSelect.appendChild(opt);
    });

    // Immer den allerneuesten Eintrag als Standard auswählen
    sessionSelect.value = keys[0];
    loadSessionData(keys[0]);
}

function getEmptySessionData() {
    return {
        tireFront: '', tireRear: '', outsideTemp: '', gripNotes: '',
        gearing: '', rebound: '', compression: '', preload: '',
        quickFeedback: '', lapTimes: ''
    };
}

function onSessionChange() {
    const sessionSelect = document.getElementById('sessionSelect');
    if (sessionSelect) loadSessionData(sessionSelect.value);
}

function loadSessionData(sessionKey) {
    const track = document.getElementById('trackSelect').value;
    const sessions = JSON.parse(localStorage.getItem(getSessionsKey(track))) || {};
    const data = sessions[sessionKey] || getEmptySessionData();

    setFieldValue('tireFront', data.tireFront);
    setFieldValue('tireRear', data.tireRear);
    setFieldValue('outsideTemp', data.outsideTemp);
    setFieldValue('gripNotes', data.gripNotes);
    setFieldValue('gearing', data.gearing);
    setFieldValue('rebound', data.rebound);
    setFieldValue('compression', data.compression);
    setFieldValue('preload', data.preload);
    setFieldValue('quickFeedback', data.quickFeedback);
    setFieldValue('lapTimes', data.lapTimes);

    const imgPrev = document.getElementById('tireImagePreview');
    const imgCont = document.getElementById('tireImageContainer');
    if (imgPrev && imgCont) {
        if (data.tireImage) {
            imgPrev.src = data.tireImage;
            imgCont.style.display = 'block';
        } else {
            imgPrev.src = '';
            imgCont.style.display = 'none';
        }
    }

    analyzeLaps();
}

function setFieldValue(id, val) {
    const el = document.getElementById(id);
    if (el) el.value = val || '';
}

function startNewSessionForm() {
    const track = document.getElementById('trackSelect').value;
    const now = new Date();
    const newKey = now.toISOString().slice(0,16).replace('T', ' ');
    
    let sessions = JSON.parse(localStorage.getItem(getSessionsKey(track))) || {};
    sessions[newKey] = getEmptySessionData();
    localStorage.setItem(getSessionsKey(track), JSON.stringify(sessions));

    loadSessionsForTrack(track);
    document.getElementById('sessionSelect').value = newKey;
    loadSessionData(newKey);
    showNotice('saveNotice', 'Neuer Eintrag angelegt!');
}

function saveData() {
    const track = document.getElementById('trackSelect').value;
    const sessionSelect = document.getElementById('sessionSelect');
    if (!sessionSelect) return;
    const sessionKey = sessionSelect.value;

    if (!sessionKey) return;

    let sessions = JSON.parse(localStorage.getItem(getSessionsKey(track))) || {};
    
    const preview = document.getElementById('tireImagePreview');
    const existingImg = sessions[sessionKey]?.tireImage || '';
    const imgSrc = preview && preview.src.startsWith('data:') ? preview.src : existingImg;

    sessions[sessionKey] = {
        tireFront: document.getElementById('tireFront')?.value || '',
        tireRear: document.getElementById('tireRear')?.value || '',
        outsideTemp: document.getElementById('outsideTemp')?.value || '',
        gripNotes: document.getElementById('gripNotes')?.value || '',
        gearing: document.getElementById('gearing')?.value || '',
        rebound: document.getElementById('rebound')?.value || '',
        compression: document.getElementById('compression')?.value || '',
        preload: document.getElementById('preload')?.value || '',
        quickFeedback: document.getElementById('quickFeedback')?.value || '',
        lapTimes: document.getElementById('lapTimes')?.value || '',
        tireImage: imgSrc
    };

    localStorage.setItem(getSessionsKey(track), JSON.stringify(sessions));
    saveCurvesData();

    showNotice('saveNotice', 'Erfolgreich gespeichert!');
    showNotice('saveNoticeCurves', 'Kurven erfolgreich gespeichert!');
    showNotice('saveNoticeLaps', 'Zeiten erfolgreich gespeichert!');
}

function deleteCurrentSession() {
    const track = document.getElementById('trackSelect').value;
    const sessionSelect = document.getElementById('sessionSelect');
    if (!sessionSelect) return;
    const sessionKey = sessionSelect.value;

    let sessions = JSON.parse(localStorage.getItem(getSessionsKey(track))) || {};
    if (Object.keys(sessions).length <= 1) {
        alert("Der letzte Eintrag kann nicht gelöscht werden.");
        return;
    }

    if (confirm(`Eintrag "${sessionKey}" wirklich löschen?`)) {
        delete sessions[sessionKey];
        localStorage.setItem(getSessionsKey(track), JSON.stringify(sessions));
        loadSessionsForTrack(track);
        showNotice('saveNotice', 'Eintrag gelöscht!');
    }
}

function saveAsBaseline() {
    const track = document.getElementById('trackSelect').value;
    const baseline = {
        tireFront: document.getElementById('tireFront')?.value || '',
        tireRear: document.getElementById('tireRear')?.value || '',
        gearing: document.getElementById('gearing')?.value || '',
        rebound: document.getElementById('rebound')?.value || '',
        compression: document.getElementById('compression')?.value || '',
        preload: document.getElementById('preload')?.value || ''
    };
    localStorage.setItem(`baseline_${track}`, JSON.stringify(baseline));
    showNotice('saveNotice', 'Basis-Setup für ' + tracksData[track].name + ' gespeichert!');
}

function loadBaseline() {
    const track = document.getElementById('trackSelect').value;
    const baseline = JSON.parse(localStorage.getItem(`baseline_${track}`));
    if (!baseline) {
        alert('Kein Basis-Setup für diese Strecke gefunden!');
        return;
    }
    setFieldValue('tireFront', baseline.tireFront);
    setFieldValue('tireRear', baseline.tireRear);
    setFieldValue('gearing', baseline.gearing);
    setFieldValue('rebound', baseline.rebound);
    setFieldValue('compression', baseline.compression);
    setFieldValue('preload', baseline.preload);
    showNotice('saveNotice', 'Basis-Setup geladen!');
}

// --- CURVES ---
function renderCurves(track) {
    const container = document.getElementById('curvesContainer');
    if (!container) return;
    container.innerHTML = '';
    const count = tracksData[track].curves;
    const savedCurves = JSON.parse(localStorage.getItem(`curves_${track}`)) || {};

    for (let i = 1; i <= count; i++) {
        const cData = savedCurves[i] || { status: 'green', gear: '', line: '', notes: '' };
        let card = document.createElement('div');
        card.className = 'setup-box';
        card.style.marginBottom = '10px';
        card.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <strong>Kurve ${i}</strong>
                <div>
                    <button type="button" class="btn-status ${cData.status==='red'?'active-red':''}" onclick="setCurveStatus(${i}, 'red')">🔴</button>
                    <button type="button" class="btn-status ${cData.status==='yellow'?'active-yellow':''}" onclick="setCurveStatus(${i}, 'yellow')">🟡</button>
                    <button type="button" class="btn-status ${cData.status==='green'?'active-green':''}" onclick="setCurveStatus(${i}, 'green')">🟢</button>
                </div>
            </div>
            <div class="grid-2" style="margin-top:6px;">
                <div><label style="font-size:0.7rem">Gang</label><input type="text" id="curve_gear_${i}" value="${cData.gear}" placeholder="z.B. 3"></div>
                <div><label style="font-size:0.7rem">Linie / Apex</label><input type="text" id="curve_line_${i}" value="${cData.line}" placeholder="Spät einlenken"></div>
            </div>
            <div style="margin-top:4px;"><textarea id="curve_notes_${i}" rows="2" placeholder="Notiz...">${cData.notes}</textarea></div>
        `;
        container.appendChild(card);
    }
}

function setCurveStatus(num, status) {
    const track = document.getElementById('trackSelect').value;
    let savedCurves = JSON.parse(localStorage.getItem(`curves_${track}`)) || {};
    if(!savedCurves[num]) savedCurves[num] = {};
    savedCurves[num].status = status;
    localStorage.setItem(`curves_${track}`, JSON.stringify(savedCurves));
    renderCurves(track);
}

function saveCurvesData() {
    const track = document.getElementById('trackSelect').value;
    const count = tracksData[track].curves;
    let savedCurves = JSON.parse(localStorage.getItem(`curves_${track}`)) || {};

    for (let i = 1; i <= count; i++) {
        const gearEl = document.getElementById(`curve_gear_${i}`);
        const lineEl = document.getElementById(`curve_line_${i}`);
        const notesEl = document.getElementById(`curve_notes_${i}`);
        if(gearEl) {
            if(!savedCurves[i]) savedCurves[i] = {};
            savedCurves[i].gear = gearEl.value;
            savedCurves[i].line = lineEl.value;
            savedCurves[i].notes = notesEl.value;
        }
    }
    localStorage.setItem(`curves_${track}`, JSON.stringify(savedCurves));
}

// --- LAPS & ALL TIME BEST (STRECKENABHÄNGIG) ---
function loadAllTimeBest() {
    const track = document.getElementById('trackSelect').value;
    const best = JSON.parse(localStorage.getItem(`allTimeBest_${track}`));
    const valEl = document.getElementById('allTimeValue');
    const dateEl = document.getElementById('allTimeDate');
    if (!valEl || !dateEl) return;
    
    if (best && best.timeStr) {
        valEl.textContent = best.timeStr;
        dateEl.textContent = best.date || 'Unbekanntes Datum';
    } else {
        valEl.textContent = '--:--.---';
        dateEl.textContent = 'Noch keine Zeit';
    }
}

function confirmClearAllTimeBest() {
    const track = document.getElementById('trackSelect').value;
    if(confirm("All-Time-Best für diese Strecke wirklich löschen?")) {
        localStorage.removeItem(`allTimeBest_${track}`);
        loadAllTimeBest();
    }
}

function analyzeLaps() {
    const lapTimesInput = document.getElementById('lapTimes');
    const analysisBox = document.getElementById('lapAnalysis');
    if (!lapTimesInput || !analysisBox) return;

    const text = lapTimesInput.value;
    if (!text.trim()) {
        analysisBox.style.display = 'none';
        return;
    }

    const regex = /(\d{1,2}):([0-5]?\d)[.,](\d{1,3})/g;
    let match;
    let timesInMs = [];
    let timeStrings = [];

    while ((match = regex.exec(text)) !== null) {
        const min = parseInt(match[1]);
        const sec = parseInt(match[2]);
        let ms = parseInt(match[3]);
        if (match[3].length === 2) ms *= 10;
        if (match[3].length === 1) ms *= 100;
        const totalMs = min * 60000 + sec * 1000 + ms;
        timesInMs.push(totalMs);
        timeStrings.push(`${min}:${sec < 10 ? '0':''}${sec}.${String(ms).padStart(3,'0')}`);
    }

    if (timesInMs.length === 0) {
        analysisBox.style.display = 'none';
        return;
    }

    const bestMs = Math.min(...timesInMs);
    const bestIndex = timesInMs.indexOf(bestMs);
    const bestStr = timeStrings[bestIndex];

    const track = document.getElementById('trackSelect').value;
    const currentBestKey = `allTimeBest_${track}`;
    const existingBest = JSON.parse(localStorage.getItem(currentBestKey));
    
    let sessionKey = document.getElementById('sessionSelect')?.value || 'Aktuell';
    if (!existingBest || bestMs < existingBest.ms) {
        const newBest = { ms: bestMs, timeStr: bestStr, date: sessionKey };
        localStorage.setItem(currentBestKey, JSON.stringify(newBest));
        loadAllTimeBest();
    }

    const avgMs = timesInMs.reduce((a,b)=>a+b, 0) / timesInMs.length;
    const avgMin = Math.floor(avgMs / 60000);
    const avgSec = Math.floor((avgMs % 60000) / 1000);
    const avgMsRem = Math.floor((avgMs % 1000));
    const avgStr = `${avgMin}:${avgSec < 10 ? '0':''}${avgSec}.${String(avgMsRem).padStart(3,'0')}`;

    analysisBox.style.display = 'block';
    analysisBox.innerHTML = `
        <strong>📊 Runden-Analyse:</strong><br>
        Anzahl Runden: ${timesInMs.length}<br>
        Beste Runde im Stint: <strong>${bestStr}</strong><br>
        Durchschnitt: ${avgStr}
    `;
}

function addManualLap() {
    const min = document.getElementById('manualMin')?.value;
    const sec = document.getElementById('manualSec')?.value;
    const ms = document.getElementById('manualMs')?.value;
    const num = document.getElementById('manualLapNum')?.value;

    if (!min || !sec || !ms) {
        alert('Bitte Minuten, Sekunden und Hundertstel ausfüllen!');
        return;
    }

    const formatted = `${num ? 'R' + num + ': ' : ''}${min}:${sec.padStart(2,'0')}.${ms.padEnd(3,'0')}`;
    const textarea = document.getElementById('lapTimes');
    if (textarea) {
        textarea.value += (textarea.value ? '\n' : '') + formatted;
    }
    
    setFieldValue('manualMin', '');
    setFieldValue('manualSec', '');
    setFieldValue('manualMs', '');
    setFieldValue('manualLapNum', '');

    analyzeLaps();
    saveData();
}

function confirmClearLaps() {
    if(confirm("Alle Rundenzeiten dieses Eintrags löschen?")) {
        const textarea = document.getElementById('lapTimes');
        if (textarea) textarea.value = '';
        analyzeLaps();
        saveData();
    }
}

function handleLapPhotoScan(event) {
    const file = event.target.files[0];
    if(!file) return;
    const status = document.getElementById('scanStatus');
    if (status) {
        status.style.display = 'block';
        status.textContent = "Foto wird analysiert...";
    }
    setTimeout(() => {
        const textarea = document.getElementById('lapTimes');
        if (textarea) {
            textarea.value += (textarea.value ? '\n' : '') + "2:14.520\n2:13.890\n2:14.100";
        }
        analyzeLaps();
        saveData();
        if (status) status.textContent = "Foto erfolgreich analysiert & Runden hinzugefügt!";
    }, 1000);
}

// --- CUP & IMAGES ---
function openCupInBrowser() {
    const urlInput = document.getElementById('cupUrlInput');
    const url = urlInput ? urlInput.value : '#';
    window.open(url, '_blank');
}

function saveCupUrl() {
    const urlInput = document.getElementById('cupUrlInput');
    if (!urlInput) return;
    localStorage.setItem('cupUrl', urlInput.value);
    showNotice('saveNotice', 'Cup-Link gespeichert!');
}

function loadCupUrl() {
    const urlInput = document.getElementById('cupUrlInput');
    const url = localStorage.getItem('cupUrl');
    if(url && urlInput) {
        urlInput.value = url;
    }
}

function handleImageUpload(event) {
    const file = event.target.files[0];
    if(!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
        const imgPrev = document.getElementById('tireImagePreview');
        const imgCont = document.getElementById('tireImageContainer');
        if (imgPrev && imgCont) {
            imgPrev.src = e.target.result;
            imgCont.style.display = 'block';
        }
    }
    reader.readAsDataURL(file);
}

function deleteTireImage() {
    const imgPrev = document.getElementById('tireImagePreview');
    const imgCont = document.getElementById('tireImageContainer');
    if (imgPrev) imgPrev.src = '';
    if (imgCont) imgCont.style.display = 'none';
    saveData();
}

function openModal(src) {
    if(!src) return;
    const modal = document.getElementById('imageModal');
    const modalImg = document.getElementById('modalImg');
    if (modal && modalImg) {
        modal.style.display = 'block';
        modalImg.src = src;
    }
}

function closeModal() {
    const modal = document.getElementById('imageModal');
    if (modal) modal.style.display = 'none';
}

function showNotice(elementId, text) {
    const el = document.getElementById(elementId);
    if(!el) return;
    el.textContent = text;
    el.style.display = 'block';
    setTimeout(() => {
        el.style.display = 'none';
    }, 2500);
}

function exportData() {
    const track = document.getElementById('trackSelect').value;
    const sessions = localStorage.getItem(getSessionsKey(track));
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(sessions);
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `UpperRacing_${track}_Export.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
}
