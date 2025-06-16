/**
 * 研修スケジュール管理システム - メインアプリケーション
 * アプリケーション全体の初期化と制御
 */

// グローバル状態管理
const AppState = {
    campInfo: {
        name: '',
        startDate: null,
        duration: 0,
        actualDays: [] // 日曜日を除いた実際の研修日
    },
    sessions: {}, // 日付をキーとしたセッションの配列
    categories: {
        sales: { name: 'セールス', color: '#3498db' },
        service: { name: 'サービス', color: '#2ecc71' },
        gespro: { name: 'ゲスプロ', color: '#e74c3c' },
        opemane: { name: 'オペマネ', color: '#9b59b6' },
        other: { name: 'その他', color: '#f39c12' }
    },
    instructors: [],
    currentEditingSession: null,
    isDirty: false // 未保存の変更があるか
};

// 定数
const CONSTANTS = {
    START_TIME: '08:30',
    END_TIME: '20:00',
    TIME_SLOT_MINUTES: 15,
    MAX_DURATION_DAYS: 10,
    STORAGE_KEY: 'trainingScheduleData',
    AUTO_SAVE_INTERVAL: 5000 // 5秒
};

/**
 * アプリケーションの初期化
 */
function initializeApp() {
    console.log('アプリケーションを初期化中...');
    
    // ローカルストレージからデータを読み込み
    loadDataFromStorage();
    
    // イベントリスナーの設定
    setupEventListeners();
    
    // 時間選択オプションの生成
    generateTimeOptions();
    
    // 講師リストの初期化
    initializeInstructorList();
    
    // カテゴリ色の適用
    applyCategoryColors();
    
    // 初期表示の更新
    updateDisplay();
    
    // 自動保存の設定
    setupAutoSave();
    
    console.log('アプリケーションの初期化完了');
}

/**
 * イベントリスナーの設定
 */
function setupEventListeners() {
    // ヘッダーボタン
    document.getElementById('campSettingBtn').addEventListener('click', openCampSettingModal);
    document.getElementById('addSessionBtn').addEventListener('click', openNewSessionModal);
    document.getElementById('categorySettingBtn').addEventListener('click', openCategorySettingModal);
    document.getElementById('saveBtn').addEventListener('click', saveData);
    document.getElementById('exportBtn').addEventListener('click', exportData);
    document.getElementById('printBtn').addEventListener('click', printSchedule);
    
    // モーダル関連
    setupModalEventListeners();
    
    // キーボードショートカット
    setupKeyboardShortcuts();
    
    // ウィンドウのリサイズ
    window.addEventListener('resize', debounce(handleResize, 300));
    
    // ページ離脱時の警告
    window.addEventListener('beforeunload', handleBeforeUnload);
}

/**
 * モーダル関連のイベントリスナー設定
 */
function setupModalEventListeners() {
    // モーダルの外側クリックで閉じる
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal(modal.id);
            }
        });
    });
    
    // ESCキーでモーダルを閉じる
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const openModal = document.querySelector('.modal[style*="flex"]');
            if (openModal) {
                closeModal(openModal.id);
            }
        }
    });
    
    // カラーピッカーの変更イベント
    document.querySelectorAll('input[type="color"]').forEach(input => {
        input.addEventListener('change', (e) => {
            const preview = e.target.nextElementSibling;
            if (preview && preview.classList.contains('color-preview')) {
                preview.style.backgroundColor = e.target.value;
            }
        });
    });
}

/**
 * キーボードショートカットの設定
 */
function setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        // Ctrl/Cmd + S: 保存
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
            e.preventDefault();
            saveData();
        }
        
        // Ctrl/Cmd + N: 新規セッション
        if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
            e.preventDefault();
            if (AppState.campInfo.startDate) {
                openNewSessionModal();
            }
        }
        
        // Ctrl/Cmd + P: 印刷
        if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
            e.preventDefault();
            printSchedule();
        }
    });
}

/**
 * キャンプ期間設定モーダルを開く
 */
function openCampSettingModal() {
    const modal = document.getElementById('campSettingModal');
    
    // 既存の設定を読み込み
    if (AppState.campInfo.name) {
        document.getElementById('campName').value = AppState.campInfo.name;
    }
    if (AppState.campInfo.startDate) {
        document.getElementById('startDate').value = AppState.campInfo.startDate;
    }
    if (AppState.campInfo.duration) {
        document.getElementById('duration').value = AppState.campInfo.duration;
    }
    
    openModal('campSettingModal');
}

/**
 * キャンプ期間設定を保存
 */
function saveCampSettings() {
    const name = document.getElementById('campName').value.trim();
    const startDate = document.getElementById('startDate').value;
    const duration = parseInt(document.getElementById('duration').value);
    
    if (!name || !startDate || !duration) {
        alert('すべての項目を入力してください。');
        return;
    }
    
    // 実際の研修日を計算（日曜日を除く）
    const actualDays = calculateActualDays(startDate, duration);
    
    // 状態を更新
    AppState.campInfo = {
        name,
        startDate,
        duration,
        actualDays
    };
    
    // セッションデータを初期化
    initializeSessionData();
    
    // 表示を更新
    updateDisplay();
    renderScheduleTable();
    
    // モーダルを閉じる
    closeModal('campSettingModal');
    
    // データを保存
    markAsDirty();
    saveData();
}

/**
 * 実際の研修日を計算（日曜日を除く）
 */
function calculateActualDays(startDate, duration) {
    const actualDays = [];
    const start = new Date(startDate);
    let daysAdded = 0;
    let currentDate = new Date(start);
    
    while (daysAdded < duration) {
        // 日曜日（0）はスキップ
        if (currentDate.getDay() !== 0) {
            actualDays.push(formatDate(currentDate));
            daysAdded++;
        }
        currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return actualDays;
}

/**
 * セッションデータの初期化
 */
function initializeSessionData() {
    // 既存のセッションで有効な日付のものは保持
    const newSessions = {};
    
    AppState.campInfo.actualDays.forEach(date => {
        newSessions[date] = AppState.sessions[date] || [];
    });
    
    AppState.sessions = newSessions;
}

/**
 * 時間選択オプションの生成
 */
function generateTimeOptions() {
    const startTime = document.getElementById('sessionStartTime');
    if (!startTime) return;
    
    const times = generateTimeSlots();
    startTime.innerHTML = times.map(time => 
        `<option value="${time}">${time}</option>`
    ).join('');
}

/**
 * 時間スロットの生成
 */
function generateTimeSlots() {
    const slots = [];
    const [startHour, startMin] = CONSTANTS.START_TIME.split(':').map(Number);
    const [endHour, endMin] = CONSTANTS.END_TIME.split(':').map(Number);
    
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;
    
    for (let minutes = startMinutes; minutes < endMinutes; minutes += CONSTANTS.TIME_SLOT_MINUTES) {
        const hour = Math.floor(minutes / 60);
        const min = minutes % 60;
        slots.push(`${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`);
    }
    
    return slots;
}

/**
 * 講師リストの初期化
 */
function initializeInstructorList() {
    // デフォルトの講師リスト
    const defaultInstructors = ['千葉', '栗田', '山田', '佐藤', '鈴木'];
    
    // 保存されている講師リストと結合
    const savedInstructors = AppState.instructors || [];
    const allInstructors = [...new Set([...defaultInstructors, ...savedInstructors])];
    
    // データリストを更新
    const datalist = document.getElementById('instructorList');
    if (datalist) {
        datalist.innerHTML = allInstructors.map(name => 
            `<option value="${name}">`
        ).join('');
    }
    
    AppState.instructors = allInstructors;
}

/**
 * カテゴリ色の適用
 */
function applyCategoryColors() {
    // CSS変数として設定
    const root = document.documentElement;
    Object.entries(AppState.categories).forEach(([key, category]) => {
        root.style.setProperty(`--category-${key}`, category.color);
    });
    
    // 凡例の更新
    updateCategoryLegend();
}

/**
 * カテゴリ凡例の更新
 */
function updateCategoryLegend() {
    const legendItems = document.querySelectorAll('.legend-item');
    legendItems.forEach(item => {
        const category = item.dataset.category;
        const colorBox = item.querySelector('.legend-color');
        if (colorBox && AppState.categories[category]) {
            colorBox.style.backgroundColor = AppState.categories[category].color;
        }
    });
}

/**
 * 表示の更新
 */
function updateDisplay() {
    const hasSchedule = AppState.campInfo.startDate && AppState.campInfo.duration > 0;
    
    // 空の状態とスケジュール表示の切り替え
    document.getElementById('emptyState').style.display = hasSchedule ? 'none' : 'flex';
    document.getElementById('scheduleContainer').style.display = hasSchedule ? 'block' : 'none';
    document.getElementById('categoryLegend').style.display = hasSchedule ? 'block' : 'none';
    
    // キャンプ情報バーの更新
    if (hasSchedule) {
        updateCampInfoBar();
    }
}

/**
 * キャンプ情報バーの更新
 */
function updateCampInfoBar() {
    const campInfoBar = document.getElementById('campInfoBar');
    const campTitle = document.getElementById('campTitle');
    const campPeriod = document.getElementById('campPeriod');
    const campDuration = document.getElementById('campDuration');
    
    if (AppState.campInfo.name) {
        campTitle.textContent = AppState.campInfo.name;
        
        const startDate = new Date(AppState.campInfo.startDate);
        const endDate = new Date(AppState.campInfo.actualDays[AppState.campInfo.actualDays.length - 1]);
        
        campPeriod.textContent = `${formatDateJapanese(startDate)} 〜 ${formatDateJapanese(endDate)}`;
        campDuration.textContent = `${AppState.campInfo.duration}日間`;
        
        campInfoBar.style.display = 'block';
    }
}

/**
 * 日付を日本語形式でフォーマット
 */
function formatDateJapanese(date) {
    const weekdays = ['日', '月', '火', '水', '木', '金', '土'];
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const weekday = weekdays[date.getDay()];
    
    return `${year}年${month}月${day}日(${weekday})`;
}

/**
 * 日付をYYYY-MM-DD形式でフォーマット
 */
function formatDate(date) {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    
    return `${year}-${month}-${day}`;
}

/**
 * データの保存
 */
function saveData() {
    const data = {
        version: '1.0',
        campInfo: AppState.campInfo,
        sessions: AppState.sessions,
        categories: AppState.categories,
        instructors: AppState.instructors,
        savedAt: new Date().toISOString()
    };
    
    try {
        localStorage.setItem(CONSTANTS.STORAGE_KEY, JSON.stringify(data));
        AppState.isDirty = false;
        showToast('保存しました', 'success');
    } catch (error) {
        console.error('保存エラー:', error);
        showToast('保存に失敗しました', 'error');
    }
}

/**
 * ローカルストレージからデータを読み込み
 */
function loadDataFromStorage() {
    try {
        const savedData = localStorage.getItem(CONSTANTS.STORAGE_KEY);
        if (savedData) {
            const data = JSON.parse(savedData);
            
            // データの復元
            AppState.campInfo = data.campInfo || AppState.campInfo;
            AppState.sessions = data.sessions || AppState.sessions;
            AppState.categories = data.categories || AppState.categories;
            AppState.instructors = data.instructors || AppState.instructors;
            
            console.log('データを読み込みました:', data.savedAt);
        }
    } catch (error) {
        console.error('データ読み込みエラー:', error);
        showToast('データの読み込みに失敗しました', 'error');
    }
}

/**
 * 自動保存の設定
 */
function setupAutoSave() {
    setInterval(() => {
        if (AppState.isDirty) {
            saveData();
        }
    }, CONSTANTS.AUTO_SAVE_INTERVAL);
}

/**
 * 変更フラグを立てる
 */
function markAsDirty() {
    AppState.isDirty = true;
}

/**
 * ページ離脱時の警告
 */
function handleBeforeUnload(e) {
    if (AppState.isDirty) {
        e.preventDefault();
        e.returnValue = '未保存の変更があります。ページを離れますか？';
    }
}

/**
 * リサイズハンドラー
 */
function handleResize() {
    // スケジュール表の再描画が必要な場合の処理
    if (AppState.campInfo.startDate) {
        adjustScheduleLayout();
    }
}

/**
 * トースト通知の表示
 */
function showToast(message, type = 'info') {
    // 既存のトーストを削除
    const existingToast = document.querySelector('.toast');
    if (existingToast) {
        existingToast.remove();
    }
    
    // 新しいトーストを作成
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    
    // スタイルを追加
    toast.style.cssText = `
        position: fixed;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        padding: 12px 24px;
        background-color: ${type === 'success' ? '#27ae60' : type === 'error' ? '#e74c3c' : '#3498db'};
        color: white;
        border-radius: 4px;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        z-index: 9999;
        animation: slideUp 0.3s ease-out;
    `;
    
    document.body.appendChild(toast);
    
    // 3秒後に削除
    setTimeout(() => {
        toast.style.animation = 'fadeOut 0.3s ease-out';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

/**
 * デバウンス関数
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * モーダルを開く
 */
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'flex';
        // アクセシビリティ: フォーカスを移動
        const firstInput = modal.querySelector('input, select, textarea');
        if (firstInput) {
            setTimeout(() => firstInput.focus(), 100);
        }
    }
}

/**
 * モーダルを閉じる
 */
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
    }
}

// DOMContentLoaded時に初期化
document.addEventListener('DOMContentLoaded', initializeApp);
