/**
 * 研修スケジュール管理システム - データ保存・読込
 * LocalStorageとデータの永続化管理
 */

// ストレージ関連の定数
const STORAGE_CONFIG = {
    VERSION: '1.0',
    MAX_ARCHIVES: 10,
    ARCHIVE_KEY_PREFIX: 'trainingScheduleArchive_',
    SETTINGS_KEY: 'trainingScheduleSettings'
};

/**
 * データのバージョンチェック
 */
function checkDataVersion(data) {
    if (!data.version) {
        // 古いバージョンのデータ
        return migrateOldData(data);
    }
    
    if (data.version !== STORAGE_CONFIG.VERSION) {
        // バージョンが異なる場合の処理
        console.warn(`データバージョンが異なります: ${data.version} -> ${STORAGE_CONFIG.VERSION}`);
    }
    
    return data;
}

/**
 * 古いデータの移行
 */
function migrateOldData(oldData) {
    console.log('古いデータフォーマットを移行中...');
    
    // 新しいフォーマットに変換
    const newData = {
        version: STORAGE_CONFIG.VERSION,
        campInfo: oldData.campInfo || {},
        sessions: oldData.sessions || {},
        categories: oldData.categories || AppState.categories,
        instructors: oldData.instructors || [],
        savedAt: oldData.savedAt || new Date().toISOString()
    };
    
    return newData;
}

/**
 * データの検証
 */
function validateData(data) {
    const errors = [];
    
    // 必須フィールドのチェック
    if (!data.campInfo) {
        errors.push('キャンプ情報が見つかりません');
    }
    
    if (!data.sessions) {
        errors.push('セッションデータが見つかりません');
    }
    
    // セッションの整合性チェック
    if (data.sessions && data.campInfo && data.campInfo.actualDays) {
        Object.keys(data.sessions).forEach(date => {
            if (!data.campInfo.actualDays.includes(date)) {
                console.warn(`無効な日付のセッションが見つかりました: ${date}`);
            }
        });
    }
    
    return errors;
}

/**
 * アーカイブの作成
 */
function createArchive(description = '') {
    const archiveData = {
        version: STORAGE_CONFIG.VERSION,
        campInfo: JSON.parse(JSON.stringify(AppState.campInfo)),
        sessions: JSON.parse(JSON.stringify(AppState.sessions)),
        categories: JSON.parse(JSON.stringify(AppState.categories)),
        instructors: [...AppState.instructors],
        archivedAt: new Date().toISOString(),
        description: description
    };
    
    const archiveKey = STORAGE_CONFIG.ARCHIVE_KEY_PREFIX + Date.now();
    
    try {
        // 既存のアーカイブを取得
        const archives = getArchiveList();
        
        // 最大数を超える場合は古いものを削除
        if (archives.length >= STORAGE_CONFIG.MAX_ARCHIVES) {
            const oldestArchive = archives[archives.length - 1];
            localStorage.removeItem(oldestArchive.key);
        }
        
        // 新しいアーカイブを保存
        localStorage.setItem(archiveKey, JSON.stringify(archiveData));
        
        showToast('アーカイブを作成しました', 'success');
        return archiveKey;
    } catch (error) {
        console.error('アーカイブ作成エラー:', error);
        showToast('アーカイブの作成に失敗しました', 'error');
        return null;
    }
}

/**
 * アーカイブリストの取得
 */
function getArchiveList() {
    const archives = [];
    
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith(STORAGE_CONFIG.ARCHIVE_KEY_PREFIX)) {
            try {
                const data = JSON.parse(localStorage.getItem(key));
                archives.push({
                    key: key,
                    archivedAt: data.archivedAt,
                    campName: data.campInfo.name || '無題',
                    description: data.description || ''
                });
            } catch (error) {
                console.error(`アーカイブの読み込みエラー: ${key}`, error);
            }
        }
    }
    
    // 日付の新しい順にソート
    archives.sort((a, b) => new Date(b.archivedAt) - new Date(a.archivedAt));
    
    return archives;
}

/**
 * アーカイブの復元
 */
function restoreArchive(archiveKey) {
    try {
        const archiveData = JSON.parse(localStorage.getItem(archiveKey));
        if (!archiveData) {
            throw new Error('アーカイブが見つかりません');
        }
        
        // 現在のデータをバックアップ
        createArchive('自動バックアップ（復元前）');
        
        // データを復元
        AppState.campInfo = archiveData.campInfo;
        AppState.sessions = archiveData.sessions;
        AppState.categories = archiveData.categories;
        AppState.instructors = archiveData.instructors;
        
        // UIを更新
        applyCategoryColors();
        updateDisplay();
        renderScheduleTable();
        
        showToast('アーカイブを復元しました', 'success');
        return true;
    } catch (error) {
        console.error('アーカイブ復元エラー:', error);
        showToast('アーカイブの復元に失敗しました', 'error');
        return false;
    }
}

/**
 * アプリケーション設定の保存
 */
function saveSettings(settings) {
    try {
        localStorage.setItem(STORAGE_CONFIG.SETTINGS_KEY, JSON.stringify(settings));
        return true;
    } catch (error) {
        console.error('設定保存エラー:', error);
        return false;
    }
}

/**
 * アプリケーション設定の読み込み
 */
function loadSettings() {
    try {
        const settings = localStorage.getItem(STORAGE_CONFIG.SETTINGS_KEY);
        return settings ? JSON.parse(settings) : getDefaultSettings();
    } catch (error) {
        console.error('設定読み込みエラー:', error);
        return getDefaultSettings();
    }
}

/**
 * デフォルト設定の取得
 */
function getDefaultSettings() {
    return {
        autoSave: true,
        autoSaveInterval: 5000,
        showWeekends: false,
        defaultDuration: 50,
        defaultSessionType: 'lecture',
        theme: 'default'
    };
}

/**
 * インポート機能
 */
function importData(file) {
    const reader = new FileReader();
    
    reader.onload = function(e) {
        try {
            const importedData = JSON.parse(e.target.result);
            
            // データの検証
            const errors = validateData(importedData);
            if (errors.length > 0) {
                showToast('インポートデータに問題があります: ' + errors.join(', '), 'error');
                return;
            }
            
            // 現在のデータをバックアップ
            createArchive('自動バックアップ（インポート前）');
            
            // データをインポート
            AppState.campInfo = importedData.campInfo;
            AppState.sessions = importedData.sessions;
            AppState.categories = importedData.categories || AppState.categories;
            AppState.instructors = importedData.instructors || [];
            
            // UIを更新
            applyCategoryColors();
            updateDisplay();
            renderScheduleTable();
            
            showToast('データをインポートしました', 'success');
        } catch (error) {
            console.error('インポートエラー:', error);
            showToast('ファイルの読み込みに失敗しました', 'error');
        }
    };
    
    reader.readAsText(file);
}

/**
 * ローカルストレージの使用量を取得
 */
function getStorageUsage() {
    let totalSize = 0;
    
    for (let key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
            totalSize += localStorage[key].length + key.length;
        }
    }
    
    // バイトからMBに変換
    const sizeInMB = (totalSize / 1024 / 1024).toFixed(2);
    
    return {
        bytes: totalSize,
        megabytes: parseFloat(sizeInMB),
        percentage: (totalSize / (5 * 1024 * 1024) * 100).toFixed(1) // 5MB制限と仮定
    };
}

/**
 * 不要なデータのクリーンアップ
 */
function cleanupStorage() {
    const archives = getArchiveList();
    let cleaned = 0;
    
    // 古いアーカイブを削除（3ヶ月以上前）
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    
    archives.forEach(archive => {
        const archiveDate = new Date(archive.archivedAt);
        if (archiveDate < threeMonthsAgo) {
            localStorage.removeItem(archive.key);
            cleaned++;
        }
    });
    
    if (cleaned > 0) {
        showToast(`${cleaned}件の古いアーカイブを削除しました`, 'info');
    }
    
    return cleaned;
}

/**
 * データのバックアップ（定期実行用）
 */
function autoBackup() {
    const settings = loadSettings();
    
    if (!settings.autoSave || !AppState.isDirty) {
        return;
    }
    
    // 最後の保存から一定時間経過していたらバックアップ
    const lastSaved = AppState.lastSavedAt || 0;
    const now = Date.now();
    
    if (now - lastSaved > 3600000) { // 1時間
        createArchive('自動バックアップ');
        AppState.lastSavedAt = now;
    }
}

/**
 * データの整合性チェック
 */
function checkDataIntegrity() {
    const issues = [];
    
    // セッションの時間重複チェック
    Object.entries(AppState.sessions).forEach(([date, sessions]) => {
        for (let i = 0; i < sessions.length; i++) {
            for (let j = i + 1; j < sessions.length; j++) {
                const session1 = sessions[i];
                const session2 = sessions[j];
                
                const start1 = timeToMinutes(session1.startTime);
                const end1 = start1 + session1.duration;
                const start2 = timeToMinutes(session2.startTime);
                const end2 = start2 + session2.duration;
                
                if ((start1 < end2 && end1 > start2)) {
                    issues.push({
                        type: 'overlap',
                        date: date,
                        sessions: [session1.title, session2.title]
                    });
                }
            }
        }
    });
    
    // 無効な日付のセッションチェック
    Object.keys(AppState.sessions).forEach(date => {
        if (!AppState.campInfo.actualDays.includes(date)) {
            issues.push({
                type: 'invalidDate',
                date: date
            });
        }
    });
    
    return issues;
}

/**
 * データの修復
 */
function repairData() {
    const issues = checkDataIntegrity();
    
    if (issues.length === 0) {
        showToast('データに問題はありません', 'success');
        return;
    }
    
    // バックアップを作成
    createArchive('自動バックアップ（修復前）');
    
    let repaired = 0;
    
    issues.forEach(issue => {
        if (issue.type === 'invalidDate') {
            // 無効な日付のセッションを削除
            delete AppState.sessions[issue.date];
            repaired++;
        }
    });
    
    if (repaired > 0) {
        renderScheduleTable();
        markAsDirty();
        saveData();
        showToast(`${repaired}件の問題を修復しました`, 'success');
    }
}

// 定期的な自動バックアップの設定
setInterval(autoBackup, 3600000); // 1時間ごと