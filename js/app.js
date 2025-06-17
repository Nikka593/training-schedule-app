// 研修スケジュール管理アプリ - メインアプリケーション

// グローバル変数とアプリケーション状態
let campData = null;
let scheduleData = {};
let currentEditingKey = null;

// 講師データ（内蔵版）
const instructorsData = [
    "千葉", "栗田", "中井", "佐藤", "町田", "古賀", "田口", "米田", 
    "後藤", "田﨑", "佐々木", "栗原", "樋口", "朝見", "小松", "赤松", 
    "成田", "今村", "佐野", "北林", "東山崎", "大川"
];

// カテゴリ設定
const categories = {
    sales: { name: 'セールス', color: '#3498db' },
    service: { name: 'サービス', color: '#27ae60' },
    gespro: { name: 'ゲスプロ', color: '#e74c3c' },
    opemane: { name: 'オペマネ', color: '#9b59b6' },
    other: { name: 'その他', color: '#f39c12' }
};

// 時間スロット生成
function generateTimeSlots() {
    const slots = [];
    for (let hour = 8; hour <= 20; hour++) {
        for (let minute = 0; minute < 60; minute += 15) {
            if (hour === 20 && minute > 0) break;
            const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
            slots.push(timeString);
        }
    }
    return slots;
}

const timeSlots = generateTimeSlots();

// アプリケーション初期化
function initializeApp() {
    console.log('アプリケーションを初期化中...');
    
    // 今日の日付をデフォルトに設定
    setDefaultDate();
    
    // イベントリスナーを設定
    bindEvents();
    
    // 保存されたデータを読み込み
    loadData();
    
    console.log('アプリケーションの初期化完了');
}

// デフォルト日付設定（次の月曜日）
function setDefaultDate() {
    const today = new Date();
    const nextMonday = new Date(today);
    const dayOfWeek = today.getDay();
    const daysUntilMonday = dayOfWeek === 0 ? 1 : 8 - dayOfWeek;
    nextMonday.setDate(today.getDate() + daysUntilMonday);
    
    const startDateInput = document.getElementById('start-date');
    if (startDateInput) {
        startDateInput.value = nextMonday.toISOString().split('T')[0];
    }
}

// イベントリスナー設定
function bindEvents() {
    // キャンプ期間設定関連
    const campSetupBtn = document.getElementById('camp-setup-btn');
    const setupStartBtn = document.getElementById('setup-start-btn');
    const campModalClose = document.getElementById('camp-modal-close');
    const campCancel = document.getElementById('camp-cancel');
    const campForm = document.getElementById('camp-form');

    if (campSetupBtn) campSetupBtn.addEventListener('click', showCampModal);
    if (setupStartBtn) setupStartBtn.addEventListener('click', showCampModal);
    if (campModalClose) campModalClose.addEventListener('click', hideCampModal);
    if (campCancel) campCancel.addEventListener('click', hideCampModal);
    if (campForm) campForm.addEventListener('submit', saveCampSettings);

    // セッション関連
    const sessionAddBtn = document.getElementById('session-add-btn');
    const sessionModalClose = document.getElementById('session-modal-close');
    const sessionCancel = document.getElementById('session-cancel');
    const sessionForm = document.getElementById('session-form');

    if (sessionAddBtn) sessionAddBtn.addEventListener('click', addSession);
    if (sessionModalClose) sessionModalClose.addEventListener('click', hideSessionModal);
    if (sessionCancel) sessionCancel.addEventListener('click', hideSessionModal);
    if (sessionForm) sessionForm.addEventListener('submit', saveSession);

    // その他のボタン
    const saveBtn = document.getElementById('save-btn');
    const exportBtn = document.getElementById('export-btn');
    const printBtn = document.getElementById('print-btn');

    if (saveBtn) saveBtn.addEventListener('click', saveData);
    if (exportBtn) exportBtn.addEventListener('click', exportData);
    if (printBtn) printBtn.addEventListener('click', () => window.print());

    // モーダル外クリックで閉じる
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            e.target.style.display = 'none';
        }
    });

    console.log('イベントリスナーの設定完了');
}

// キャンプ期間設定モーダル表示
function showCampModal() {
    const modal = document.getElementById('camp-modal');
    if (modal) {
        modal.style.display = 'block';
    }
}

// キャンプ期間設定モーダル非表示
function hideCampModal() {
    const modal = document.getElementById('camp-modal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// キャンプ期間設定保存
function saveCampSettings(e) {
    e.preventDefault();
    
    const campName = document.getElementById('camp-name').value;
    const startDate = document.getElementById('start-date').value;
    const duration = parseInt(document.getElementById('duration').value);

    if (!campName || !startDate || !duration) {
        showAlert('すべての項目を入力してください。', 'error');
        return;
    }

    campData = {
        name: campName,
        startDate: startDate,
        duration: duration,
        dates: generateCampDates(startDate, duration)
    };

    scheduleData = {};
    generateScheduleTable();
    hideCampModal();
    showAlert('キャンプ期間が設定されました！', 'success');
    
    console.log('キャンプ期間設定:', campData);
}

// キャンプ日程生成（日曜日をスキップ）
function generateCampDates(startDate, duration) {
    const dates = [];
    const start = new Date(startDate);
    let currentDate = new Date(start);
    let addedDays = 0;

    while (addedDays < duration) {
        // 日曜日をスキップ
        if (currentDate.getDay() !== 0) {
            dates.push(new Date(currentDate));
            addedDays++;
        }
        currentDate.setDate(currentDate.getDate() + 1);
    }

    return dates;
}

// スケジュール表生成
function generateScheduleTable() {
    const container = document.getElementById('schedule-table-container');
    const welcomeScreen = document.getElementById('welcome-screen');
    const scheduleContainer = document.getElementById('schedule-container');

    if (!container || !campData) return;

    // ヘッダー情報更新
    const campTitle = document.getElementById('camp-title');
    const campInfo = document.getElementById('camp-info');
    
    if (campTitle) campTitle.textContent = campData.name;
    if (campInfo) {
        campInfo.textContent = `期間: ${campData.startDate} から ${campData.duration}日間`;
    }

    // テーブル生成
    const table = document.createElement('table');
    table.className = 'schedule-table';

    // ヘッダー行
    const headerRow = document.createElement('tr');
    headerRow.innerHTML = '<th class="time-cell">時間</th>';
    
    campData.dates.forEach(date => {
        const dateStr = date.toLocaleDateString('ja-JP', { 
            month: 'short', 
            day: 'numeric', 
            weekday: 'short' 
        });
        headerRow.innerHTML += `<th class="date-header">${dateStr}</th>`;
    });
    table.appendChild(headerRow);

    // 時間スロット行
    timeSlots.forEach(time => {
        const row = document.createElement('tr');
        row.innerHTML = `<td class="time-cell">${time}</td>`;
        
        campData.dates.forEach(date => {
            const dateKey = date.toISOString().split('T')[0];
            const timeKey = `${dateKey}-${time}`;
            const cell = document.createElement('td');
            cell.className = 'session-cell';
            cell.dataset.date = dateKey;
            cell.dataset.time = time;
            cell.addEventListener('click', () => editSession(dateKey, time));
            
            if (scheduleData[timeKey]) {
                cell.innerHTML = renderSession(scheduleData[timeKey]);
            }
            
            row.appendChild(cell);
        });
        
        table.appendChild(row);
    });

    container.innerHTML = '';
    container.appendChild(table);

    // 画面切り替え
    if (welcomeScreen) welcomeScreen.classList.add('hidden');
    if (scheduleContainer) scheduleContainer.classList.remove('hidden');
    
    console.log('スケジュール表を生成しました');
}

// セッション表示
function renderSession(session) {
    const categoryClass = `category-${session.category}`;
    return `
        <div class="session ${categoryClass}" title="${session.notes || ''}">
            <div style="font-weight: bold; font-size: 0.8em;">${session.title}</div>
            <div style="font-size: 0.7em;">${session.instructor}</div>
        </div>
    `;
}

// セッション編集
function editSession(date, time) {
    if (!campData) {
        showAlert('まずキャンプ期間を設定してください。', 'warning');
        return;
    }

    const timeKey = `${date}-${time}`;
    const existingSession = scheduleData[timeKey];

    // 時間オプション生成
    populateTimeOptions();
    
    // 講師オプション生成
    populateInstructorOptions();

    // フォームに既存データを設定
    if (existingSession) {
        document.getElementById('session-modal-title').textContent = 'セッション編集';
        document.getElementById('session-date').value = date;
        document.getElementById('session-time').value = time;
        document.getElementById('session-duration').value = existingSession.duration;
        document.getElementById('session-title').value = existingSession.title;
        document.getElementById('session-category').value = existingSession.category;
        document.getElementById('session-instructor').value = existingSession.instructor;
        const notesField = document.getElementById('session-notes');
        if (notesField) notesField.value = existingSession.notes || '';
    } else {
        document.getElementById('session-modal-title').textContent = 'セッション追加';
        document.getElementById('session-form').reset();
        document.getElementById('session-date').value = date;
        document.getElementById('session-time').value = time;
        document.getElementById('session-duration').value = '90';
    }

    currentEditingKey = timeKey;
    showSessionModal();
}

// セッションモーダル表示
function showSessionModal() {
    const modal = document.getElementById('session-modal');
    if (modal) {
        modal.style.display = 'block';
    }
}

// セッションモーダル非表示
function hideSessionModal() {
    const modal = document.getElementById('session-modal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// 時間オプション生成
function populateTimeOptions() {
    const timeSelect = document.getElementById('session-time');
    if (!timeSelect) return;
    
    timeSelect.innerHTML = '';
    timeSlots.forEach(time => {
        const option = document.createElement('option');
        option.value = time;
        option.textContent = time;
        timeSelect.appendChild(option);
    });
}

// 講師オプション生成
function populateInstructorOptions() {
    const instructorSelect = document.getElementById('session-instructor');
    if (!instructorSelect) return;
    
    // input要素の場合はdatalistを使用
    if (instructorSelect.tagName === 'INPUT') {
        let datalist = document.getElementById('instructor-datalist');
        if (!datalist) {
            datalist = document.createElement('datalist');
            datalist.id = 'instructor-datalist';
            instructorSelect.setAttribute('list', 'instructor-datalist');
            instructorSelect.parentNode.appendChild(datalist);
        }
        
        datalist.innerHTML = '';
        instructorsData.forEach(instructor => {
            const option = document.createElement('option');
            option.value = instructor;
            datalist.appendChild(option);
        });
    }
}

// セッション追加
function addSession() {
    if (!campData) {
        showAlert('まずキャンプ期間を設定してください。', 'warning');
        return;
    }

    const firstDate = campData.dates[0].toISOString().split('T')[0];
    const firstTime = timeSlots[0];
    editSession(firstDate, firstTime);
}

// セッション保存
function saveSession(e) {
    e.preventDefault();

    const sessionData = {
        date: document.getElementById('session-date').value,
        time: document.getElementById('session-time').value,
        duration: parseInt(document.getElementById('session-duration').value),
        title: document.getElementById('session-title').value,
        category: document.getElementById('session-category').value,
        instructor: document.getElementById('session-instructor').value,
        notes: document.getElementById('session-notes') ? document.getElementById('session-notes').value : ''
    };

    if (!sessionData.title || !sessionData.category || !sessionData.instructor) {
        showAlert('必須項目（タイトル、カテゴリ、講師）を入力してください。', 'error');
        return;
    }

    const timeKey = `${sessionData.date}-${sessionData.time}`;
    scheduleData[timeKey] = sessionData;

    generateScheduleTable();
    hideSessionModal();
    showAlert('セッションが保存されました！', 'success');
    
    console.log('セッション保存:', sessionData);
}

// データ保存（LocalStorage）
function saveData() {
    try {
        const data = {
            campData: campData,
            scheduleData: scheduleData,
            categories: categories,
            lastModified: new Date().toISOString()
        };

        localStorage.setItem('trainingScheduleData', JSON.stringify(data));
        showAlert('データが保存されました！', 'success');
        console.log('データ保存:', data);
    } catch (error) {
        console.error('データ保存エラー:', error);
        showAlert('データの保存に失敗しました。', 'error');
    }
}

// データ読み込み（LocalStorage）
function loadData() {
    try {
        const saved = localStorage.getItem('trainingScheduleData');
        if (saved) {
            const data = JSON.parse(saved);
            campData = data.campData;
            scheduleData = data.scheduleData || {};

            if (campData && campData.dates) {
                // 日付オブジェクトを復元
                campData.dates = campData.dates.map(d => new Date(d));
                generateScheduleTable();
                console.log('データ読み込み完了:', data);
            }
        }
    } catch (error) {
        console.error('データ読み込みエラー:', error);
        showAlert('データの読み込みに失敗しました。', 'error');
    }
}

// データエクスポート
function exportData() {
    try {
        const data = {
            campData: campData,
            scheduleData: scheduleData,
            categories: categories,
            exportDate: new Date().toISOString()
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `training-schedule-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        showAlert('データをエクスポートしました！', 'success');
    } catch (error) {
        console.error('エクスポートエラー:', error);
        showAlert('エクスポートに失敗しました。', 'error');
    }
}

// アラート表示
function showAlert(message, type = 'info') {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type}`;
    alertDiv.textContent = message;
    alertDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#27ae60' : type === 'error' ? '#e74c3c' : type === 'warning' ? '#f39c12' : '#3498db'};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 6px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        z-index: 10000;
        animation: slideInRight 0.3s ease;
    `;
    
    document.body.appendChild(alertDiv);
    
    setTimeout(() => {
        alertDiv.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => {
            if (document.body.contains(alertDiv)) {
                document.body.removeChild(alertDiv);
            }
        }, 300);
    }, 3000);
}

// ページ読み込み完了時の初期化
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM読み込み完了');
    initializeApp();
});

// データを読み込みました
console.log('データを読み込みました:', new Date().toLocaleString());
console.log('アプリケーションの初期化完了');
