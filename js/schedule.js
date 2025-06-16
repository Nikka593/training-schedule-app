/**
 * 研修スケジュール管理システム - スケジュール管理
 * スケジュールテーブルの生成と表示
 */

// ドラッグ&ドロップ用の変数
let draggedSession = null;
let draggedElement = null;

/**
 * スケジュールテーブルのレンダリング
 */
function renderScheduleTable() {
    if (!AppState.campInfo.startDate || AppState.campInfo.actualDays.length === 0) {
        return;
    }
    
    const table = document.getElementById('scheduleTable');
    const tbody = document.getElementById('scheduleBody');
    
    // ヘッダーの生成
    renderScheduleHeader();
    
    // ボディのクリア
    tbody.innerHTML = '';
    
    // 時間スロットの生成
    const timeSlots = generateTimeSlots();
    
    timeSlots.forEach((time, index) => {
        const row = createTimeRow(time, index);
        tbody.appendChild(row);
    });
    
    // セッションの配置
    renderAllSessions();
    
    // イベントリスナーの設定
    setupScheduleEventListeners();
}

/**
 * スケジュールヘッダーのレンダリング
 */
function renderScheduleHeader() {
    const header = document.getElementById('scheduleHeader');
    
    // ヘッダーをクリア（時間列は残す）
    while (header.children.length > 1) {
        header.removeChild(header.lastChild);
    }
    
    // 日付列を追加
    AppState.campInfo.actualDays.forEach(dateStr => {
        const th = document.createElement('th');
        th.className = 'date-header';
        
        const date = new Date(dateStr);
        const weekday = ['日', '月', '火', '水', '木', '金', '土'][date.getDay()];
        
        // 日曜日の場合はクラスを追加（通常は発生しない）
        if (date.getDay() === 0) {
            th.classList.add('sunday');
        }
        
        th.innerHTML = `
            <span class="date">${date.getMonth() + 1}/${date.getDate()}</span>
            <span class="weekday">${weekday}</span>
        `;
        
        header.appendChild(th);
    });
}

/**
 * 時間行の作成
 */
function createTimeRow(time, index) {
    const row = document.createElement('tr');
    row.className = 'time-row';
    row.dataset.time = time;
    
    // 現在時刻のハイライト
    if (isCurrentTimeSlot(time)) {
        row.classList.add('current-time-row');
    }
    
    // 時間セル
    const timeCell = document.createElement('td');
    timeCell.className = 'time-cell';
    timeCell.textContent = time;
    row.appendChild(timeCell);
    
    // 各日付のセル
    AppState.campInfo.actualDays.forEach(dateStr => {
        const cell = document.createElement('td');
        cell.className = 'session-cell dropzone';
        cell.dataset.date = dateStr;
        cell.dataset.time = time;
        
        // 日曜日チェック（通常は発生しない）
        const date = new Date(dateStr);
        if (date.getDay() === 0) {
            cell.classList.add('sunday');
        } else {
            // 空きスロットのクリックイベント
            cell.addEventListener('click', handleEmptySlotClick);
        }
        
        row.appendChild(cell);
    });
    
    return row;
}

/**
 * 現在時刻のスロットかチェック
 */
function isCurrentTimeSlot(time) {
    const now = new Date();
    const [hour, minute] = time.split(':').map(Number);
    const slotMinutes = hour * 60 + minute;
    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    
    return nowMinutes >= slotMinutes && nowMinutes < slotMinutes + CONSTANTS.TIME_SLOT_MINUTES;
}

/**
 * 全セッションのレンダリング
 */
function renderAllSessions() {
    Object.entries(AppState.sessions).forEach(([date, sessions]) => {
        sessions.forEach(session => {
            renderSession(session, date);
        });
    });
}

/**
 * セッションのレンダリング
 */
function renderSession(session, date) {
    const cell = findSessionCell(date, session.startTime);
    if (!cell) return;
    
    // セッション要素の作成
    const sessionEl = createSessionElement(session, date);
    
    // セルに配置
    cell.appendChild(sessionEl);
    
    // 複数行にまたがる場合の処理
    if (session.duration > CONSTANTS.TIME_SLOT_MINUTES) {
        handleMultiRowSession(sessionEl, session, date);
    }
}

/**
 * セッション要素の作成
 */
function createSessionElement(session, date) {
    const div = document.createElement('div');
    div.className = 'session';
    div.dataset.sessionId = session.id;
    div.dataset.date = date;
    div.dataset.category = session.category || '';
    div.dataset.type = session.type;
    div.dataset.duration = session.duration;
    
    // ドラッグ可能に設定
    div.draggable = true;
    
    // コンテンツ
    div.innerHTML = `
        <div class="session-title">${escapeHtml(session.title)}</div>
        <div class="session-details">
            ${session.instructor ? `<span class="session-instructor">${escapeHtml(session.instructor)}</span>` : ''}
            <span class="session-time">${session.duration}分</span>
        </div>
        <div class="session-actions">
            <button class="session-action-btn edit-btn" title="編集">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"></path>
                    <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                </svg>
            </button>
            <button class="session-action-btn delete-btn" title="削除">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14zM10 11v6M14 11v6"></path>
                </svg>
            </button>
        </div>
    `;
    
    // イベントリスナー
    div.addEventListener('dragstart', handleDragStart);
    div.addEventListener('dragend', handleDragEnd);
    
    // アクションボタンのイベント
    div.querySelector('.edit-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        editSession(session, date);
    });
    
    div.querySelector('.delete-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        deleteSessionConfirm(session, date);
    });
    
    return div;
}

/**
 * 複数行にまたがるセッションの処理
 */
function handleMultiRowSession(sessionEl, session, date) {
    const rowsToSpan = Math.ceil(session.duration / CONSTANTS.TIME_SLOT_MINUTES);
    const startCell = sessionEl.parentElement;
    const startRow = startCell.parentElement;
    const columnIndex = Array.from(startRow.children).indexOf(startCell);
    
    // 下のセルを非表示にする
    let currentRow = startRow;
    for (let i = 1; i < rowsToSpan; i++) {
        currentRow = currentRow.nextElementSibling;
        if (!currentRow) break;
        
        const cell = currentRow.children[columnIndex];
        if (cell) {
            cell.style.visibility = 'hidden';
            cell.classList.add('covered-by-session');
        }
    }
}

/**
 * セッションセルの検索
 */
function findSessionCell(date, time) {
    return document.querySelector(`[data-date="${date}"][data-time="${time}"]`);
}

/**
 * 空きスロットのクリックハンドラー
 */
function handleEmptySlotClick(e) {
    // セッションが既にある場合は無視
    if (e.currentTarget.querySelector('.session')) {
        return;
    }
    
    const date = e.currentTarget.dataset.date;
    const time = e.currentTarget.dataset.time;
    
    openNewSessionModal(date, time);
}

/**
 * 新規セッションモーダルを開く
 */
function openNewSessionModal(date = null, time = null) {
    // 日付と時間が指定されていない場合は最初の空きスロットを探す
    if (!date || !time) {
        const emptySlot = findFirstEmptySlot();
        if (!emptySlot) {
            showToast('空いている時間がありません', 'warning');
            return;
        }
        date = emptySlot.date;
        time = emptySlot.time;
    }
    
    // フォームをリセット
    document.getElementById('sessionEditForm').reset();
    
    // 新規作成モードに設定
    document.getElementById('sessionModalTitle').textContent = 'セッション追加';
    document.getElementById('deleteSessionBtn').style.display = 'none';
    
    // 日付と時間を設定
    document.getElementById('sessionDate').value = date;
    document.getElementById('sessionStartTime').value = time;
    
    // 現在の編集セッションをクリア
    AppState.currentEditingSession = null;
    
    // モーダルを開く
    openModal('sessionEditModal');
}

/**
 * 最初の空きスロットを探す
 */
function findFirstEmptySlot() {
    for (const date of AppState.campInfo.actualDays) {
        const timeSlots = generateTimeSlots();
        for (const time of timeSlots) {
            const cell = findSessionCell(date, time);
            if (cell && !cell.querySelector('.session') && !cell.classList.contains('covered-by-session')) {
                return { date, time };
            }
        }
    }
    return null;
}

/**
 * スケジュール関連のイベントリスナー設定
 */
function setupScheduleEventListeners() {
    // ドロップゾーンの設定
    document.querySelectorAll('.dropzone').forEach(zone => {
        zone.addEventListener('dragover', handleDragOver);
        zone.addEventListener('drop', handleDrop);
        zone.addEventListener('dragleave', handleDragLeave);
    });
}

/**
 * ドラッグ開始ハンドラー
 */
function handleDragStart(e) {
    draggedElement = e.target;
    draggedSession = findSessionById(e.target.dataset.sessionId, e.target.dataset.date);
    
    // ドラッグ中のスタイル
    e.target.classList.add('dragging');
    
    // ドラッグデータの設定
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', e.target.innerHTML);
}

/**
 * ドラッグ終了ハンドラー
 */
function handleDragEnd(e) {
    e.target.classList.remove('dragging');
    
    // ドロップゾーンのハイライトをクリア
    document.querySelectorAll('.drag-over').forEach(zone => {
        zone.classList.remove('drag-over');
    });
    
    draggedElement = null;
    draggedSession = null;
}

/**
 * ドラッグオーバーハンドラー
 */
function handleDragOver(e) {
    if (e.preventDefault) {
        e.preventDefault();
    }
    
    e.dataTransfer.dropEffect = 'move';
    
    // ドロップ可能かチェック
    if (canDropSession(e.currentTarget)) {
        e.currentTarget.classList.add('drag-over');
    }
    
    return false;
}

/**
 * ドラッグリーブハンドラー
 */
function handleDragLeave(e) {
    if (e.currentTarget.classList.contains('dropzone')) {
        e.currentTarget.classList.remove('drag-over');
    }
}

/**
 * ドロップハンドラー
 */
function handleDrop(e) {
    if (e.stopPropagation) {
        e.stopPropagation();
    }
    
    e.currentTarget.classList.remove('drag-over');
    
    if (!draggedSession || !draggedElement) return false;
    
    const targetDate = e.currentTarget.dataset.date;
    const targetTime = e.currentTarget.dataset.time;
    
    // ドロップ可能かチェック
    if (!canDropSession(e.currentTarget)) {
        showToast('この時間帯には配置できません', 'warning');
        return false;
    }
    
    // セッションを移動
    moveSession(draggedSession, draggedElement.dataset.date, targetDate, targetTime);
    
    return false;
}

/**
 * セッションをドロップ可能かチェック
 */
function canDropSession(dropzone) {
    // 既にセッションがある場合は不可
    if (dropzone.querySelector('.session')) {
        return false;
    }
    
    // カバーされているセルは不可
    if (dropzone.classList.contains('covered-by-session')) {
        return false;
    }
    
    // 日曜日は不可
    if (dropzone.classList.contains('sunday')) {
        return false;
    }
    
    // ドラッグ中のセッションが複数行にまたがる場合、下のセルもチェック
    if (draggedSession && draggedSession.duration > CONSTANTS.TIME_SLOT_MINUTES) {
        const rowsNeeded = Math.ceil(draggedSession.duration / CONSTANTS.TIME_SLOT_MINUTES);
        let currentCell = dropzone;
        
        for (let i = 1; i < rowsNeeded; i++) {
            const row = currentCell.parentElement;
            const nextRow = row.nextElementSibling;
            if (!nextRow) return false;
            
            const columnIndex = Array.from(row.children).indexOf(currentCell);
            const nextCell = nextRow.children[columnIndex];
            
            if (!nextCell || nextCell.querySelector('.session') || nextCell.classList.contains('covered-by-session')) {
                return false;
            }
            
            currentCell = nextCell;
        }
    }
    
    return true;
}

/**
 * セッションの移動
 */
function moveSession(session, fromDate, toDate, toTime) {
    // 元の位置から削除
    const fromSessions = AppState.sessions[fromDate];
    const index = fromSessions.findIndex(s => s.id === session.id);
    if (index > -1) {
        fromSessions.splice(index, 1);
    }
    
    // 新しい位置に追加
    session.startTime = toTime;
    if (!AppState.sessions[toDate]) {
        AppState.sessions[toDate] = [];
    }
    AppState.sessions[toDate].push(session);
    
    // 再レンダリング
    renderScheduleTable();
    
    // 変更フラグ
    markAsDirty();
    showToast('セッションを移動しました', 'success');
}

/**
 * セッションIDで検索
 */
function findSessionById(sessionId, date) {
    const sessions = AppState.sessions[date] || [];
    return sessions.find(s => s.id === sessionId);
}

/**
 * セッションの編集
 */
function editSession(session, date) {
    // フォームに値を設定
    document.getElementById('sessionModalTitle').textContent = 'セッション編集';
    document.getElementById('sessionDate').value = date;
    document.getElementById('sessionType').value = session.type;
    document.getElementById('sessionStartTime').value = session.startTime;
    document.getElementById('sessionDuration').value = session.duration;
    document.getElementById('sessionTitle').value = session.title;
    document.getElementById('sessionCategory').value = session.category || '';
    document.getElementById('sessionInstructor').value = session.instructor || '';
    document.getElementById('sessionNotes').value = session.notes || '';
    
    // 削除ボタンを表示
    document.getElementById('deleteSessionBtn').style.display = 'inline-block';
    
    // 編集中のセッションを保存
    AppState.currentEditingSession = { session, date };
    
    // モーダルを開く
    openModal('sessionEditModal');
}

/**
 * セッション削除の確認
 */
function deleteSessionConfirm(session, date) {
    if (confirm(`「${session.title}」を削除してもよろしいですか？`)) {
        deleteSession(session, date);
    }
}

/**
 * セッションの削除
 */
function deleteSession(session, date) {
    if (!session && AppState.currentEditingSession) {
        session = AppState.currentEditingSession.session;
        date = AppState.currentEditingSession.date;
    }
    
    const sessions = AppState.sessions[date];
    const index = sessions.findIndex(s => s.id === session.id);
    
    if (index > -1) {
        sessions.splice(index, 1);
        renderScheduleTable();
        markAsDirty();
        showToast('セッションを削除しました', 'success');
        closeModal('sessionEditModal');
    }
}

/**
 * セッションの保存
 */
function saveSession() {
    const form = document.getElementById('sessionEditForm');
    
    // バリデーション
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }
    
    // フォームデータの取得
    const formData = {
        type: document.getElementById('sessionType').value,
        startTime: document.getElementById('sessionStartTime').value,
        duration: parseInt(document.getElementById('sessionDuration').value),
        title: document.getElementById('sessionTitle').value.trim(),
        category: document.getElementById('sessionCategory').value,
        instructor: document.getElementById('sessionInstructor').value.trim(),
        notes: document.getElementById('sessionNotes').value.trim()
    };
    
    const date = document.getElementById('sessionDate').value;
    
    // 時間の重複チェック
    if (!checkTimeConflict(formData, date)) {
        showToast('指定された時間帯には既に別のセッションがあります', 'error');
        return;
    }
    
    if (AppState.currentEditingSession) {
        // 既存セッションの更新
        const { session, date: originalDate } = AppState.currentEditingSession;
        
        // 日付が変更された場合
        if (originalDate !== date) {
            // 元の日付から削除
            const sessions = AppState.sessions[originalDate];
            const index = sessions.findIndex(s => s.id === session.id);
            if (index > -1) {
                sessions.splice(index, 1);
            }
            
            // 新しい日付に追加
            if (!AppState.sessions[date]) {
                AppState.sessions[date] = [];
            }
            AppState.sessions[date].push({
                ...session,
                ...formData
            });
        } else {
            // 同じ日付内での更新
            Object.assign(session, formData);
        }
    } else {
        // 新規セッションの作成
        const newSession = {
            id: generateSessionId(),
            ...formData
        };
        
        if (!AppState.sessions[date]) {
            AppState.sessions[date] = [];
        }
        AppState.sessions[date].push(newSession);
    }
    
    // 講師リストの更新（新しい講師を自動追加）
    if (formData.instructor && formData.instructor.trim() !== '') {
        addInstructor(formData.instructor);
    }
    
    // 再レンダリング
    renderScheduleTable();
    markAsDirty();
    showToast('セッションを保存しました', 'success');
    closeModal('sessionEditModal');
}

/**
 * 時間の重複チェック
 */
function checkTimeConflict(sessionData, date) {
    const sessions = AppState.sessions[date] || [];
    const startMinutes = timeToMinutes(sessionData.startTime);
    const endMinutes = startMinutes + sessionData.duration;
    
    for (const session of sessions) {
        // 編集中のセッション自身は除外
        if (AppState.currentEditingSession && session.id === AppState.currentEditingSession.session.id) {
            continue;
        }
        
        const sessionStart = timeToMinutes(session.startTime);
        const sessionEnd = sessionStart + session.duration;
        
        // 重複チェック
        if ((startMinutes < sessionEnd && endMinutes > sessionStart)) {
            return false;
        }
    }
    
    return true;
}

/**
 * 時間を分に変換
 */
function timeToMinutes(timeStr) {
    const [hour, minute] = timeStr.split(':').map(Number);
    return hour * 60 + minute;
}

/**
 * セッションIDの生成
 */
function generateSessionId() {
    return 'session-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
}

/**
 * HTMLエスケープ
 */
function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}

/**
 * スケジュールレイアウトの調整
 */
function adjustScheduleLayout() {
    const container = document.querySelector('.schedule-wrapper');
    if (!container) return;
    
    // コンテナの幅に応じて日付列の幅を調整
    const availableWidth = container.clientWidth - 80; // 時間列の幅を引く
    const dateColumns = document.querySelectorAll('.date-header');
    const columnWidth = Math.max(120, availableWidth / dateColumns.length);
    
    dateColumns.forEach(col => {
        col.style.minWidth = columnWidth + 'px';
    });
}
