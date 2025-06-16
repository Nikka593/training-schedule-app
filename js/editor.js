/**
 * 研修スケジュール管理システム - 編集機能
 * セッションの追加・編集・削除機能
 */

/**
 * カテゴリ設定モーダルを開く
 */
function openCategorySettingModal() {
    // 現在のカテゴリ色を読み込み
    Object.entries(AppState.categories).forEach(([key, category]) => {
        const colorInput = document.getElementById(`color${capitalizeFirst(key)}`);
        if (colorInput) {
            colorInput.value = category.color;
            // プレビューも更新
            const preview = colorInput.nextElementSibling;
            if (preview) {
                preview.style.backgroundColor = category.color;
            }
        }
    });
    
    openModal('categorySettingModal');
}

/**
 * カテゴリ設定を保存
 */
function saveCategorySettings() {
    // 各カテゴリの色を取得
    const categories = ['sales', 'service', 'gespro', 'opemane', 'other'];
    
    categories.forEach(key => {
        const colorInput = document.getElementById(`color${capitalizeFirst(key)}`);
        if (colorInput && AppState.categories[key]) {
            AppState.categories[key].color = colorInput.value;
        }
    });
    
    // CSS変数を更新
    applyCategoryColors();
    
    // スケジュールを再描画
    if (AppState.campInfo.startDate) {
        renderScheduleTable();
    }
    
    // 保存
    markAsDirty();
    saveData();
    
    showToast('カテゴリ設定を保存しました', 'success');
    closeModal('categorySettingModal');
}

/**
 * プリセットテーマの適用
 */
function applyTheme(themeName) {
    const themes = {
        default: {
            sales: '#3498db',
            service: '#2ecc71',
            gespro: '#e74c3c',
            opemane: '#9b59b6',
            other: '#f39c12'
        },
        pastel: {
            sales: '#a8d5e5',
            service: '#a8e6a3',
            gespro: '#ffb3b3',
            opemane: '#d4a5d4',
            other: '#ffe5b4'
        },
        vivid: {
            sales: '#0056b3',
            service: '#00a651',
            gespro: '#dc3545',
            opemane: '#6f42c1',
            other: '#fd7e14'
        },
        monochrome: {
            sales: '#495057',
            service: '#6c757d',
            gespro: '#343a40',
            opemane: '#868e96',
            other: '#adb5bd'
        }
    };
    
    const theme = themes[themeName];
    if (!theme) return;
    
    // テーマの色を適用
    Object.entries(theme).forEach(([key, color]) => {
        const colorInput = document.getElementById(`color${capitalizeFirst(key)}`);
        if (colorInput) {
            colorInput.value = color;
            // プレビューも更新
            const preview = colorInput.nextElementSibling;
            if (preview) {
                preview.style.backgroundColor = color;
            }
        }
    });
    
    showToast(`${themeName}テーマを適用しました`, 'info');
}

/**
 * データのエクスポート
 */
function exportData() {
    if (!AppState.campInfo.startDate) {
        showToast('エクスポートするスケジュールがありません', 'warning');
        return;
    }
    
    const exportData = {
        version: '1.0',
        exportDate: new Date().toISOString(),
        campInfo: AppState.campInfo,
        sessions: AppState.sessions,
        categories: AppState.categories,
        instructors: AppState.instructors
    };
    
    // JSONファイルとしてダウンロード
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    
    const fileName = `training-schedule_${formatDate(new Date())}.json`;
    a.href = url;
    a.download = fileName;
    
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    URL.revokeObjectURL(url);
    
    showToast('スケジュールをエクスポートしました', 'success');
}

/**
 * 印刷機能
 */
function printSchedule() {
    if (!AppState.campInfo.startDate) {
        showToast('印刷するスケジュールがありません', 'warning');
        return;
    }
    
    // 印刷用のヘッダーを追加
    addPrintHeader();
    
    // 印刷用の凡例を追加
    addPrintLegend();
    
    // 印刷クラスを追加
    document.body.classList.add('printing');
    
    // 印刷ダイアログを開く
    setTimeout(() => {
        window.print();
        
        // 印刷後にクリーンアップ
        setTimeout(() => {
            document.body.classList.remove('printing');
            removePrintElements();
        }, 100);
    }, 100);
}

/**
 * 印刷用ヘッダーの追加
 */
function addPrintHeader() {
    // 既存の印刷ヘッダーを削除
    const existingHeader = document.querySelector('.print-header');
    if (existingHeader) {
        existingHeader.remove();
    }
    
    const header = document.createElement('div');
    header.className = 'print-header print-only';
    
    const startDate = new Date(AppState.campInfo.startDate);
    const endDate = new Date(AppState.campInfo.actualDays[AppState.campInfo.actualDays.length - 1]);
    
    header.innerHTML = `
        <h1>${escapeHtml(AppState.campInfo.name)}</h1>
        <div class="print-info">
            <div class="print-period">${formatDateJapanese(startDate)} 〜 ${formatDateJapanese(endDate)}</div>
            <div>全${AppState.campInfo.duration}日間</div>
        </div>
    `;
    
    // スケジュールコンテナの前に挿入
    const scheduleContainer = document.getElementById('scheduleContainer');
    scheduleContainer.parentNode.insertBefore(header, scheduleContainer);
}

/**
 * 印刷用凡例の追加
 */
function addPrintLegend() {
    // 既存の印刷凡例を削除
    const existingLegend = document.querySelector('.print-legend');
    if (existingLegend) {
        existingLegend.remove();
    }
    
    const legend = document.createElement('div');
    legend.className = 'print-legend print-only';
    
    let legendHtml = '<h3>カテゴリ凡例</h3><div class="print-legend-items">';
    
    Object.entries(AppState.categories).forEach(([key, category]) => {
        legendHtml += `
            <div class="print-legend-item">
                <span class="print-legend-color" style="background-color: ${category.color}"></span>
                <span>${category.name}</span>
            </div>
        `;
    });
    
    // セッションタイプも追加
    legendHtml += `
        <div class="print-legend-item">
            <span class="print-legend-color" style="background-color: #95a5a6"></span>
            <span>休憩</span>
        </div>
        <div class="print-legend-item">
            <span class="print-legend-color" style="background-color: #e67e22"></span>
            <span>食事</span>
        </div>
        <div class="print-legend-item">
            <span class="print-legend-color" style="background-color: #9b59b6"></span>
            <span>面談</span>
        </div>
    `;
    
    legendHtml += '</div>';
    legend.innerHTML = legendHtml;
    
    // スケジュールコンテナの後に挿入
    const scheduleContainer = document.getElementById('scheduleContainer');
    scheduleContainer.parentNode.insertBefore(legend, scheduleContainer.nextSibling);
}

/**
 * 印刷用要素の削除
 */
function removePrintElements() {
    document.querySelectorAll('.print-header, .print-legend').forEach(el => {
        el.remove();
    });
}

/**
 * セッションタイプによる自動カテゴリ設定
 */
function handleSessionTypeChange(e) {
    const type = e.target.value;
    const categorySelect = document.getElementById('sessionCategory');
    
    // タイプに応じて推奨カテゴリを設定
    const typeToCategory = {
        'lecture': '',  // 講義は選択させる
        'practice': '', // 実践も選択させる
        'break': '',    // 休憩はカテゴリなし
        'meal': '',     // 食事もカテゴリなし
        'interview': '' // 面談もカテゴリなし
    };
    
    if (type === 'break' || type === 'meal' || type === 'interview') {
        categorySelect.value = '';
        categorySelect.disabled = true;
    } else {
        categorySelect.disabled = false;
    }
}

/**
 * フォームのバリデーション
 */
function validateSessionForm(formData) {
    const errors = [];
    
    // タイトルのチェック
    if (!formData.title) {
        errors.push('タイトルを入力してください');
    }
    
    // 時間のチェック
    const startMinutes = timeToMinutes(formData.startTime);
    const endMinutes = startMinutes + formData.duration;
    const maxMinutes = timeToMinutes(CONSTANTS.END_TIME);
    
    if (endMinutes > maxMinutes) {
        errors.push('終了時間が20:00を超えています');
    }
    
    // カテゴリのチェック
    if (formData.type === 'lecture' || formData.type === 'practice') {
        if (!formData.category) {
            errors.push('講義・実践の場合はカテゴリを選択してください');
        }
    }
    
    return errors;
}

/**
 * セッション編集フォームのリセット
 */
function resetSessionForm() {
    const form = document.getElementById('sessionEditForm');
    form.reset();
    
    // カテゴリ選択を有効化
    document.getElementById('sessionCategory').disabled = false;
    
    // エラー表示をクリア
    form.querySelectorAll('.form-group.error').forEach(group => {
        group.classList.remove('error');
    });
    
    form.querySelectorAll('.error-message').forEach(msg => {
        msg.remove();
    });
}

/**
 * エラーメッセージの表示
 */
function showFormErrors(errors) {
    errors.forEach(error => {
        showToast(error, 'error');
    });
}

/**
 * 最初の文字を大文字に変換
 */
function capitalizeFirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * セッションのプレビュー表示
 */
function previewSession(sessionData) {
    // プレビュー要素の作成（将来の実装用）
    console.log('セッションプレビュー:', sessionData);
}

/**
 * 一括操作モード
 */
let bulkSelectionMode = false;
let selectedSessions = new Set();

/**
 * 一括選択モードの切り替え
 */
function toggleBulkSelectionMode() {
    bulkSelectionMode = !bulkSelectionMode;
    
    if (bulkSelectionMode) {
        document.body.classList.add('bulk-selection-mode');
        showToast('複数選択モードを開始しました', 'info');
    } else {
        document.body.classList.remove('bulk-selection-mode');
        selectedSessions.clear();
        document.querySelectorAll('.session.selected').forEach(el => {
            el.classList.remove('selected');
        });
        showToast('複数選択モードを終了しました', 'info');
    }
}

/**
 * セッションの選択/選択解除
 */
function toggleSessionSelection(sessionEl) {
    if (!bulkSelectionMode) return;
    
    const sessionId = sessionEl.dataset.sessionId;
    
    if (selectedSessions.has(sessionId)) {
        selectedSessions.delete(sessionId);
        sessionEl.classList.remove('selected');
    } else {
        selectedSessions.add(sessionId);
        sessionEl.classList.add('selected');
    }
}

/**
 * 選択したセッションの一括削除
 */
function deleteSelectedSessions() {
    if (selectedSessions.size === 0) {
        showToast('セッションが選択されていません', 'warning');
        return;
    }
    
    if (confirm(`選択した${selectedSessions.size}件のセッションを削除しますか？`)) {
        // 各セッションを削除
        selectedSessions.forEach(sessionId => {
            // セッションを探して削除
            Object.entries(AppState.sessions).forEach(([date, sessions]) => {
                const index = sessions.findIndex(s => s.id === sessionId);
                if (index > -1) {
                    sessions.splice(index, 1);
                }
            });
        });
        
        // 選択をクリア
        selectedSessions.clear();
        
        // 再描画
        renderScheduleTable();
        markAsDirty();
        showToast('選択したセッションを削除しました', 'success');
        
        // 一括選択モードを終了
        toggleBulkSelectionMode();
    }
}

/**
 * 講師管理モーダルを開く
 */
function openInstructorManagementModal() {
    // モーダルが存在しない場合は作成
    if (!document.getElementById('instructorManagementModal')) {
        createInstructorManagementModal();
    }
    
    // 講師リストを更新
    updateInstructorManagementList();
    
    openModal('instructorManagementModal');
}

/**
 * 講師管理モーダルの作成
 */
function createInstructorManagementModal() {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'instructorManagementModal';
    
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2>講師管理</h2>
                <button class="modal-close" onclick="closeModal('instructorManagementModal')">&times;</button>
            </div>
            <div class="modal-body">
                <div class="form-group">
                    <label>新しい講師を追加</label>
                    <div style="display: flex; gap: 0.5rem;">
                        <input type="text" id="newInstructorName" class="form-control" 
                               placeholder="講師名を入力" style="flex: 1;">
                        <button type="button" class="btn btn-primary" onclick="addNewInstructor()">追加</button>
                    </div>
                </div>
                <div class="form-group">
                    <label>登録済み講師一覧</label>
                    <div id="instructorList" class="instructor-list">
                        <!-- 講師リストが動的に挿入される -->
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" onclick="closeModal('instructorManagementModal')">閉じる</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // モーダルの外側クリックで閉じる
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal('instructorManagementModal');
        }
    });
    
    // スタイルを追加
    const style = document.createElement('style');
    style.textContent = `
        .instructor-list {
            max-height: 300px;
            overflow-y: auto;
            border: 1px solid var(--border-color);
            border-radius: var(--radius-sm);
            padding: 0.5rem;
        }
        
        .instructor-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 0.5rem;
            border-bottom: 1px solid var(--border-color);
        }
        
        .instructor-item:last-child {
            border-bottom: none;
        }
        
        .instructor-item:hover {
            background-color: #f8f9fa;
        }
        
        .instructor-name {
            font-weight: 500;
        }
        
        .instructor-stats {
            font-size: 0.8125rem;
            color: var(--text-muted);
            margin-left: 1rem;
        }
        
        .delete-instructor-btn {
            background: none;
            border: none;
            color: var(--danger-color);
            cursor: pointer;
            padding: 0.25rem 0.5rem;
            border-radius: var(--radius-sm);
            transition: all 0.2s ease;
        }
        
        .delete-instructor-btn:hover {
            background-color: var(--danger-color);
            color: white;
        }
    `;
    document.head.appendChild(style);
}

/**
 * 講師管理リストの更新
 */
function updateInstructorManagementList() {
    const listContainer = document.getElementById('instructorList');
    if (!listContainer) return;
    
    // 各講師の使用回数を計算
    const instructorStats = {};
    Object.values(AppState.sessions).forEach(sessions => {
        sessions.forEach(session => {
            if (session.instructor) {
                instructorStats[session.instructor] = (instructorStats[session.instructor] || 0) + 1;
            }
        });
    });
    
    // 講師リストをソート
    const sortedInstructors = [...new Set(AppState.instructors)].sort();
    
    // リストをレンダリング
    listContainer.innerHTML = sortedInstructors.map(name => {
        const count = instructorStats[name] || 0;
        const canDelete = count === 0;
        
        return `
            <div class="instructor-item">
                <div>
                    <span class="instructor-name">${escapeHtml(name)}</span>
                    <span class="instructor-stats">${count}件のセッション</span>
                </div>
                <button class="delete-instructor-btn" 
                        onclick="deleteInstructor('${escapeHtml(name)}')"
                        ${!canDelete ? 'disabled title="使用中のため削除できません"' : ''}>
                    削除
                </button>
            </div>
        `;
    }).join('');
    
    if (sortedInstructors.length === 0) {
        listContainer.innerHTML = '<p class="text-muted">講師が登録されていません</p>';
    }
}

/**
 * 新しい講師を追加
 */
function addNewInstructor() {
    const input = document.getElementById('newInstructorName');
    const name = input.value.trim();
    
    if (!name) {
        showToast('講師名を入力してください', 'warning');
        return;
    }
    
    if (addInstructor(name)) {
        showToast(`講師「${name}」を追加しました`, 'success');
        input.value = '';
        updateInstructorManagementList();
        updateInstructorDatalist();
    } else {
        showToast('この講師は既に登録されています', 'warning');
    }
}

/**
 * 講師を削除
 */
function deleteInstructor(name) {
    if (!confirm(`講師「${name}」を削除してもよろしいですか？`)) {
        return;
    }
    
    const result = removeInstructor(name);
    
    if (result.success) {
        showToast(`講師「${name}」を削除しました`, 'success');
        updateInstructorManagementList();
        updateInstructorDatalist();
    } else {
        showToast(result.message || '削除に失敗しました', 'error');
    }
}

// 既存のコードの後に追加
document.addEventListener('DOMContentLoaded', () => {
    // セッションタイプ変更時の処理
    const sessionType = document.getElementById('sessionType');
    if (sessionType) {
        sessionType.addEventListener('change', handleSessionTypeChange);
    }
    
    // 講師入力フィールドでEnterキーを押したときの処理
    const sessionInstructor = document.getElementById('sessionInstructor');
    if (sessionInstructor) {
        sessionInstructor.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                // 新しい講師を自動的に追加
                const name = e.target.value.trim();
                if (name && !AppState.instructors.includes(name)) {
                    addInstructor(name);
                }
            }
        });
    }
});
