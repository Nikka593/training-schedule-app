/**
 * 研修スケジュール管理システム - エクスポート機能
 * データのエクスポートと外部形式への変換
 */

/**
 * CSVエクスポート
 */
function exportToCSV() {
    if (!AppState.campInfo.startDate) {
        showToast('エクスポートするスケジュールがありません', 'warning');
        return;
    }
    
    let csv = [];
    
    // ヘッダー情報
    csv.push(['研修スケジュール']);
    csv.push(['研修名', AppState.campInfo.name]);
    csv.push(['期間', `${formatDateJapanese(new Date(AppState.campInfo.startDate))} 〜 ${formatDateJapanese(new Date(AppState.campInfo.actualDays[AppState.campInfo.actualDays.length - 1]))}`]);
    csv.push(['日数', `${AppState.campInfo.duration}日間`]);
    csv.push([]); // 空行
    
    // スケジュールヘッダー
    const header = ['時間'];
    AppState.campInfo.actualDays.forEach(dateStr => {
        const date = new Date(dateStr);
        header.push(formatDateJapanese(date));
    });
    csv.push(header);
    
    // 時間スロットごとのデータ
    const timeSlots = generateTimeSlots();
    timeSlots.forEach(time => {
        const row = [time];
        
        AppState.campInfo.actualDays.forEach(dateStr => {
            const sessions = AppState.sessions[dateStr] || [];
            const session = sessions.find(s => s.startTime === time);
            
            if (session) {
                const categoryName = session.category ? AppState.categories[session.category].name : '';
                const sessionInfo = `${session.title} (${categoryName}) - ${session.instructor || ''}`;
                row.push(sessionInfo);
            } else {
                row.push('');
            }
        });
        
        csv.push(row);
    });
    
    // CSVファイルとしてダウンロード
    const csvContent = csv.map(row => 
        row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
    ).join('\n');
    
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    
    const fileName = `研修スケジュール_${AppState.campInfo.name}_${formatDate(new Date())}.csv`;
    a.href = url;
    a.download = fileName;
    
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    URL.revokeObjectURL(url);
    
    showToast('CSVファイルをエクスポートしました', 'success');
}

/**
 * PDFエクスポート（将来実装）
 */
function exportToPDF() {
    // PDF生成にはjsPDFなどの外部ライブラリが必要
    showToast('PDF出力機能は開発中です', 'info');
    
    // 実装例（jsPDFを使用する場合）
    /*
    const pdf = new jsPDF({
        orientation: AppState.campInfo.duration > 3 ? 'landscape' : 'portrait',
        unit: 'mm',
        format: AppState.campInfo.duration > 7 ? 'a3' : 'a4'
    });
    
    // タイトル
    pdf.setFontSize(20);
    pdf.text(AppState.campInfo.name, 20, 20);
    
    // 期間
    pdf.setFontSize(12);
    pdf.text(`期間: ${formatDateJapanese(new Date(AppState.campInfo.startDate))} 〜`, 20, 30);
    
    // スケジュール表の描画
    // ...
    
    pdf.save(`研修スケジュール_${AppState.campInfo.name}_${formatDate(new Date())}.pdf`);
    */
}

/**
 * Excelエクスポート（将来実装）
 */
function exportToExcel() {
    // Excel生成にはSheetJSなどの外部ライブラリが必要
    showToast('Excel出力機能は開発中です', 'info');
    
    // 実装例（SheetJSを使用する場合）
    /*
    const wb = XLSX.utils.book_new();
    
    // スケジュールシート
    const scheduleData = [];
    
    // ヘッダー
    const header = ['時間'];
    AppState.campInfo.actualDays.forEach(dateStr => {
        header.push(formatDateJapanese(new Date(dateStr)));
    });
    scheduleData.push(header);
    
    // データ
    const timeSlots = generateTimeSlots();
    timeSlots.forEach(time => {
        const row = [time];
        AppState.campInfo.actualDays.forEach(dateStr => {
            const sessions = AppState.sessions[dateStr] || [];
            const session = sessions.find(s => s.startTime === time);
            row.push(session ? session.title : '');
        });
        scheduleData.push(row);
    });
    
    const ws = XLSX.utils.aoa_to_sheet(scheduleData);
    XLSX.utils.book_append_sheet(wb, ws, 'スケジュール');
    
    // ファイルとして保存
    XLSX.writeFile(wb, `研修スケジュール_${AppState.campInfo.name}_${formatDate(new Date())}.xlsx`);
    */
}

/**
 * 画像エクスポート
 */
function exportToImage() {
    // html2canvasなどを使用して実装可能
    showToast('画像出力機能は開発中です', 'info');
    
    // 実装例（html2canvasを使用する場合）
    /*
    html2canvas(document.getElementById('scheduleContainer')).then(canvas => {
        const link = document.createElement('a');
        link.download = `研修スケジュール_${AppState.campInfo.name}_${formatDate(new Date())}.png`;
        link.href = canvas.toDataURL();
        link.click();
    });
    */
}

/**
 * カレンダー形式でエクスポート（iCal）
 */
function exportToCalendar() {
    if (!AppState.campInfo.startDate) {
        showToast('エクスポートするスケジュールがありません', 'warning');
        return;
    }
    
    let icalContent = [];
    
    // iCalendarヘッダー
    icalContent.push('BEGIN:VCALENDAR');
    icalContent.push('VERSION:2.0');
    icalContent.push('PRODID:-//研修スケジュール管理システム//JP');
    icalContent.push('CALSCALE:GREGORIAN');
    icalContent.push('METHOD:PUBLISH');
    icalContent.push(`X-WR-CALNAME:${AppState.campInfo.name}`);
    icalContent.push('X-WR-TIMEZONE:Asia/Tokyo');
    
    // タイムゾーン定義
    icalContent.push('BEGIN:VTIMEZONE');
    icalContent.push('TZID:Asia/Tokyo');
    icalContent.push('BEGIN:STANDARD');
    icalContent.push('DTSTART:19700101T000000');
    icalContent.push('TZOFFSETFROM:+0900');
    icalContent.push('TZOFFSETTO:+0900');
    icalContent.push('END:STANDARD');
    icalContent.push('END:VTIMEZONE');
    
    // 各セッションをイベントとして追加
    Object.entries(AppState.sessions).forEach(([dateStr, sessions]) => {
        sessions.forEach(session => {
            const startDate = new Date(dateStr);
            const [startHour, startMinute] = session.startTime.split(':').map(Number);
            startDate.setHours(startHour, startMinute, 0);
            
            const endDate = new Date(startDate);
            endDate.setMinutes(endDate.getMinutes() + session.duration);
            
            icalContent.push('BEGIN:VEVENT');
            icalContent.push(`UID:${session.id}@training-schedule`);
            icalContent.push(`DTSTAMP:${formatICalDate(new Date())}`);
            icalContent.push(`DTSTART;TZID=Asia/Tokyo:${formatICalDate(startDate)}`);
            icalContent.push(`DTEND;TZID=Asia/Tokyo:${formatICalDate(endDate)}`);
            icalContent.push(`SUMMARY:${session.title}`);
            
            if (session.instructor) {
                icalContent.push(`DESCRIPTION:講師: ${session.instructor}`);
            }
            
            if (session.category && AppState.categories[session.category]) {
                icalContent.push(`CATEGORIES:${AppState.categories[session.category].name}`);
            }
            
            icalContent.push('END:VEVENT');
        });
    });
    
    icalContent.push('END:VCALENDAR');
    
    // ファイルとしてダウンロード
    const blob = new Blob([icalContent.join('\r\n')], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    
    const fileName = `研修スケジュール_${AppState.campInfo.name}_${formatDate(new Date())}.ics`;
    a.href = url;
    a.download = fileName;
    
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    URL.revokeObjectURL(url);
    
    showToast('カレンダーファイルをエクスポートしました', 'success');
}

/**
 * iCalendar形式の日付フォーマット
 */
function formatICalDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    
    return `${year}${month}${day}T${hours}${minutes}${seconds}`;
}

/**
 * テキスト形式でエクスポート
 */
function exportToText() {
    if (!AppState.campInfo.startDate) {
        showToast('エクスポートするスケジュールがありません', 'warning');
        return;
    }
    
    let text = [];
    
    // ヘッダー
    text.push('=' . repeat(80));
    text.push(`研修スケジュール: ${AppState.campInfo.name}`);
    text.push('=' . repeat(80));
    text.push('');
    text.push(`期間: ${formatDateJapanese(new Date(AppState.campInfo.startDate))} 〜 ${formatDateJapanese(new Date(AppState.campInfo.actualDays[AppState.campInfo.actualDays.length - 1]))}`);
    text.push(`日数: ${AppState.campInfo.duration}日間`);
    text.push('');
    text.push('-' . repeat(80));
    text.push('');
    
    // 日ごとのスケジュール
    AppState.campInfo.actualDays.forEach(dateStr => {
        const date = new Date(dateStr);
        text.push(`【${formatDateJapanese(date)}】`);
        text.push('');
        
        const sessions = AppState.sessions[dateStr] || [];
        const sortedSessions = sessions.sort((a, b) => {
            return timeToMinutes(a.startTime) - timeToMinutes(b.startTime);
        });
        
        if (sortedSessions.length === 0) {
            text.push('  予定なし');
        } else {
            sortedSessions.forEach(session => {
                const endTime = calculateEndTime(session.startTime, session.duration);
                const categoryName = session.category ? AppState.categories[session.category].name : '';
                
                text.push(`  ${session.startTime} - ${endTime}`);
                text.push(`    ${session.title}`);
                if (categoryName) text.push(`    カテゴリ: ${categoryName}`);
                if (session.instructor) text.push(`    講師: ${session.instructor}`);
                if (session.notes) text.push(`    備考: ${session.notes}`);
                text.push('');
            });
        }
        
        text.push('-' . repeat(80));
        text.push('');
    });
    
    // ファイルとしてダウンロード
    const blob = new Blob([text.join('\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    
    const fileName = `研修スケジュール_${AppState.campInfo.name}_${formatDate(new Date())}.txt`;
    a.href = url;
    a.download = fileName;
    
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    URL.revokeObjectURL(url);
    
    showToast('テキストファイルをエクスポートしました', 'success');
}

/**
 * 終了時間の計算
 */
function calculateEndTime(startTime, duration) {
    const [hour, minute] = startTime.split(':').map(Number);
    const totalMinutes = hour * 60 + minute + duration;
    const endHour = Math.floor(totalMinutes / 60);
    const endMinute = totalMinutes % 60;
    
    return `${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}`;
}

/**
 * エクスポートメニューの表示
 */
function showExportMenu() {
    // エクスポートオプションを表示するモーダルやドロップダウンメニュー
    const options = [
        { label: 'JSON形式', handler: exportData },
        { label: 'CSV形式', handler: exportToCSV },
        { label: 'テキスト形式', handler: exportToText },
        { label: 'カレンダー形式 (iCal)', handler: exportToCalendar },
        { label: 'PDF形式（開発中）', handler: exportToPDF },
        { label: 'Excel形式（開発中）', handler: exportToExcel },
        { label: '画像形式（開発中）', handler: exportToImage }
    ];
    
    // 簡易的な実装（アラートで選択）
    const choice = prompt(
        'エクスポート形式を選択してください:\n' +
        '1. JSON形式\n' +
        '2. CSV形式\n' +
        '3. テキスト形式\n' +
        '4. カレンダー形式 (iCal)\n' +
        '5. PDF形式（開発中）\n' +
        '6. Excel形式（開発中）\n' +
        '7. 画像形式（開発中）'
    );
    
    switch (choice) {
        case '1':
            exportData();
            break;
        case '2':
            exportToCSV();
            break;
        case '3':
            exportToText();
            break;
        case '4':
            exportToCalendar();
            break;
        case '5':
            exportToPDF();
            break;
        case '6':
            exportToExcel();
            break;
        case '7':
            exportToImage();
            break;
        default:
            if (choice !== null) {
                showToast('無効な選択です', 'warning');
            }
    }
}

/**
 * 統計情報の生成
 */
function generateStatistics() {
    const stats = {
        totalSessions: 0,
        totalHours: 0,
        sessionsByCategory: {},
        sessionsByInstructor: {},
        sessionsByType: {},
        dailyStats: {}
    };
    
    // カテゴリとタイプの初期化
    Object.keys(AppState.categories).forEach(cat => {
        stats.sessionsByCategory[cat] = { count: 0, minutes: 0 };
    });
    
    ['lecture', 'practice', 'break', 'meal', 'interview'].forEach(type => {
        stats.sessionsByType[type] = { count: 0, minutes: 0 };
    });
    
    // セッションの集計
    Object.entries(AppState.sessions).forEach(([date, sessions]) => {
        stats.dailyStats[date] = {
            count: sessions.length,
            minutes: 0
        };
        
        sessions.forEach(session => {
            stats.totalSessions++;
            stats.totalHours += session.duration / 60;
            stats.dailyStats[date].minutes += session.duration;
            
            // カテゴリ別
            if (session.category && stats.sessionsByCategory[session.category]) {
                stats.sessionsByCategory[session.category].count++;
                stats.sessionsByCategory[session.category].minutes += session.duration;
            }
            
            // 講師別
            if (session.instructor) {
                if (!stats.sessionsByInstructor[session.instructor]) {
                    stats.sessionsByInstructor[session.instructor] = { count: 0, minutes: 0 };
                }
                stats.sessionsByInstructor[session.instructor].count++;
                stats.sessionsByInstructor[session.instructor].minutes += session.duration;
            }
            
            // タイプ別
            if (stats.sessionsByType[session.type]) {
                stats.sessionsByType[session.type].count++;
                stats.sessionsByType[session.type].minutes += session.duration;
            }
        });
    });
    
    return stats;
}

/**
 * 統計レポートの生成
 */
function exportStatisticsReport() {
    if (!AppState.campInfo.startDate) {
        showToast('エクスポートするスケジュールがありません', 'warning');
        return;
    }
    
    const stats = generateStatistics();
    let report = [];
    
    // レポートヘッダー
    report.push('研修スケジュール統計レポート');
    report.push('=' . repeat(60));
    report.push('');
    report.push(`研修名: ${AppState.campInfo.name}`);
    report.push(`期間: ${formatDateJapanese(new Date(AppState.campInfo.startDate))} 〜 ${formatDateJapanese(new Date(AppState.campInfo.actualDays[AppState.campInfo.actualDays.length - 1]))}`);
    report.push(`総日数: ${AppState.campInfo.duration}日間`);
    report.push('');
    
    // 全体統計
    report.push('【全体統計】');
    report.push(`総セッション数: ${stats.totalSessions}件`);
    report.push(`総時間: ${stats.totalHours.toFixed(1)}時間`);
    report.push(`平均セッション数/日: ${(stats.totalSessions / AppState.campInfo.duration).toFixed(1)}件`);
    report.push('');
    
    // カテゴリ別統計
    report.push('【カテゴリ別統計】');
    Object.entries(stats.sessionsByCategory).forEach(([category, data]) => {
        if (data.count > 0) {
            const categoryName = AppState.categories[category].name;
            const hours = (data.minutes / 60).toFixed(1);
            const percentage = ((data.minutes / (stats.totalHours * 60)) * 100).toFixed(1);
            report.push(`${categoryName}: ${data.count}件 (${hours}時間, ${percentage}%)`);
        }
    });
    report.push('');
    
    // タイプ別統計
    report.push('【タイプ別統計】');
    const typeNames = {
        lecture: '講義',
        practice: '実践',
        break: '休憩',
        meal: '食事',
        interview: '面談'
    };
    Object.entries(stats.sessionsByType).forEach(([type, data]) => {
        if (data.count > 0) {
            const typeName = typeNames[type];
            const hours = (data.minutes / 60).toFixed(1);
            report.push(`${typeName}: ${data.count}件 (${hours}時間)`);
        }
    });
    report.push('');
    
    // 講師別統計
    if (Object.keys(stats.sessionsByInstructor).length > 0) {
        report.push('【講師別統計】');
        Object.entries(stats.sessionsByInstructor)
            .sort((a, b) => b[1].minutes - a[1].minutes)
            .forEach(([instructor, data]) => {
                const hours = (data.minutes / 60).toFixed(1);
                report.push(`${instructor}: ${data.count}件 (${hours}時間)`);
            });
        report.push('');
    }
    
    // 日別統計
    report.push('【日別統計】');
    AppState.campInfo.actualDays.forEach(dateStr => {
        const date = new Date(dateStr);
        const dayStats = stats.dailyStats[dateStr] || { count: 0, minutes: 0 };
        const hours = (dayStats.minutes / 60).toFixed(1);
        report.push(`${formatDateJapanese(date)}: ${dayStats.count}件 (${hours}時間)`);
    });
    
    // ファイルとしてダウンロード
    const blob = new Blob([report.join('\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    
    const fileName = `研修統計レポート_${AppState.campInfo.name}_${formatDate(new Date())}.txt`;
    a.href = url;
    a.download = fileName;
    
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    URL.revokeObjectURL(url);
    
    showToast('統計レポートをエクスポートしました', 'success');
}

/**
 * 講師別スケジュールのエクスポート
 */
function exportInstructorSchedule(instructorName = null) {
    if (!AppState.campInfo.startDate) {
        showToast('エクスポートするスケジュールがありません', 'warning');
        return;
    }
    
    // 講師の選択
    if (!instructorName) {
        const instructors = new Set();
        Object.values(AppState.sessions).forEach(sessions => {
            sessions.forEach(session => {
                if (session.instructor) {
                    instructors.add(session.instructor);
                }
            });
        });
        
        if (instructors.size === 0) {
            showToast('講師が設定されているセッションがありません', 'warning');
            return;
        }
        
        instructorName = prompt(`講師を選択してください:\n${Array.from(instructors).join(', ')}`);
        if (!instructorName) return;
    }
    
    let schedule = [];
    
    // ヘッダー
    schedule.push(`講師別スケジュール: ${instructorName}`);
    schedule.push('=' . repeat(60));
    schedule.push('');
    schedule.push(`研修名: ${AppState.campInfo.name}`);
    schedule.push(`期間: ${formatDateJapanese(new Date(AppState.campInfo.startDate))} 〜 ${formatDateJapanese(new Date(AppState.campInfo.actualDays[AppState.campInfo.actualDays.length - 1]))}`);
    schedule.push('');
    
    // 講師のセッションを抽出
    let totalSessions = 0;
    let totalMinutes = 0;
    
    AppState.campInfo.actualDays.forEach(dateStr => {
        const date = new Date(dateStr);
        const sessions = AppState.sessions[dateStr] || [];
        const instructorSessions = sessions.filter(s => s.instructor === instructorName);
        
        if (instructorSessions.length > 0) {
            schedule.push(`【${formatDateJapanese(date)}】`);
            
            instructorSessions
                .sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime))
                .forEach(session => {
                    const endTime = calculateEndTime(session.startTime, session.duration);
                    const categoryName = session.category ? AppState.categories[session.category].name : '';
                    
                    schedule.push(`  ${session.startTime} - ${endTime}: ${session.title}`);
                    if (categoryName) schedule.push(`    カテゴリ: ${categoryName}`);
                    if (session.notes) schedule.push(`    備考: ${session.notes}`);
                    
                    totalSessions++;
                    totalMinutes += session.duration;
                });
            
            schedule.push('');
        }
    });
    
    // 統計
    schedule.push('-' . repeat(60));
    schedule.push(`総セッション数: ${totalSessions}件`);
    schedule.push(`総時間: ${(totalMinutes / 60).toFixed(1)}時間`);
    
    // ファイルとしてダウンロード
    const blob = new Blob([schedule.join('\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    
    const fileName = `講師スケジュール_${instructorName}_${formatDate(new Date())}.txt`;
    a.href = url;
    a.download = fileName;
    
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    URL.revokeObjectURL(url);
    
    showToast(`${instructorName}のスケジュールをエクスポートしました`, 'success');
}

/**
 * クリップボードにコピー
 */
function copyToClipboard() {
    if (!AppState.campInfo.startDate) {
        showToast('コピーするスケジュールがありません', 'warning');
        return;
    }
    
    // テキスト形式で生成
    let text = [];
    text.push(`研修スケジュール: ${AppState.campInfo.name}`);
    text.push(`期間: ${formatDateJapanese(new Date(AppState.campInfo.startDate))} 〜 ${formatDateJapanese(new Date(AppState.campInfo.actualDays[AppState.campInfo.actualDays.length - 1]))}`);
    text.push('');
    
    AppState.campInfo.actualDays.forEach(dateStr => {
        const date = new Date(dateStr);
        const sessions = AppState.sessions[dateStr] || [];
        
        text.push(`【${formatDateJapanese(date)}】`);
        
        if (sessions.length === 0) {
            text.push('予定なし');
        } else {
            sessions
                .sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime))
                .forEach(session => {
                    const endTime = calculateEndTime(session.startTime, session.duration);
                    text.push(`${session.startTime}-${endTime} ${session.title} (${session.instructor || '講師未定'})`);
                });
        }
        text.push('');
    });
    
    // クリップボードにコピー
    navigator.clipboard.writeText(text.join('\n')).then(() => {
        showToast('スケジュールをクリップボードにコピーしました', 'success');
    }).catch(err => {
        console.error('クリップボードへのコピーに失敗:', err);
        showToast('クリップボードへのコピーに失敗しました', 'error');
    });
}