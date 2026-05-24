/**
 * EXCEL_WRITE_MAP for kamitono (上殿浄化センター)
 * Phase 38-b3 (yoshiwa Phase 38-b1 + kake Phase 38-b2 reference の横展開)
 *
 * kake b2 (c4067c9) からの差分 (5 点):
 *  1. ALL_FIELDS から reactivePower/demand 2 個不在 (-2 entry、27)
 *  2. ITEM_OFFSETS 値が 2 ずれ (reactivePower/demand 分のシフト)
 *  3. 終沈直書きが 3 setCell インライン (FINAL_COLS なし、yoshiwa 風)
 *  4. 終沈直書きが page1+page2 混在 (kake は全 page1)
 *     → monthly に block: 1|2 概念必須 (yoshiwa schema 同型)
 *  5. 関数名 fillReportFinalData → fillQualityReportFinalCols
 *
 * 共通設計 (yoshiwa/kake 同型):
 *  - section: null 一律 (フラット構造)
 *  - cumulative/average/allow_on_holiday/dashSupport 属性なし
 *  - MLDO 不含 (サーバー GAS 計算+書込)
 *  - storage_unit='region' 不在
 *
 * entry 数: 27 (= ALL_FIELDS)
 *  - 22 daily (日常水質シート、ITEM_OFFSETS と一致)
 *  - 3 monthly (終沈、water 管理報告シート、block 1/2 混在、null_skip=true)
 *  - 2 metadata (inspector/bikou、別経路書込、b3 では documentation only)
 *
 * 検証: ALL_FIELDS ↔ MAP 双方向、NULL_SKIP 期待値、終沈 monthly.col/block 検証 (6 種)
 */
(function() {
  'use strict';

  // ========================================================================
  // SHEETS 定数 (kake b2 と同 7 シート)
  // ========================================================================
  const SHEETS = {
    DAILY_WATER:        '日常水質',
    MONTHLY_REPORT:     '水質管理報告',
    MONTHLY_OPERATION:  '運転管理月報',
    EQUIPMENT:          '機器運転時間',
    ELECTRICAL:         '日常電気設備',
    MECHANICAL:         '日常機械設備',
    HOLIDAYS:           '祝日リスト'
  };

  // ========================================================================
  // shorthand helper (kake b2 から _monthly に block 引数追加)
  // ========================================================================
  function _daily(row_offset) {
    return { sheet: SHEETS.DAILY_WATER, row_offset: row_offset };
  }
  function _monthly(block, col) {
    return { sheet: SHEETS.MONTHLY_REPORT, block: block, col: col };
  }
  function _entry(daily, monthly, null_skip) {
    return {
      storage_unit: 'key',
      section: null,
      daily: daily,
      monthly: monthly,
      null_skip: !!null_skip
    };
  }

  // ========================================================================
  // EXCEL_WRITE_MAP 本体 (27 entries)
  // ========================================================================
  const EXCEL_WRITE_MAP = {
    // ----- 電力 (2): row 0-1 (kake -2: reactivePower/demand 不在) -----
    power200v:      _entry(_daily(0),  null, false),
    power100v:      _entry(_daily(1),  null, false),

    // ----- 水量 (2): row 2-3 -----
    water:          _entry(_daily(2),  null, false),
    diesel:         _entry(_daily(3),  null, false),

    // ----- 汚泥/流量 (3): row 4-6 -----
    returnSludge:   _entry(_daily(4),  null, false),
    excessSludge:   _entry(_daily(5),  null, false),
    discharge:      _entry(_daily(6),  null, false),

    // ----- 水温 (3): row 10-12 -----
    tempIn:         _entry(_daily(10), null, false),
    tempDitch:      _entry(_daily(11), null, false),
    tempOut:        _entry(_daily(12), null, false),

    // ----- 透視度 (2): row 16-17 -----
    transIn:        _entry(_daily(16), null, false),
    transOut:       _entry(_daily(17), null, false),

    // ----- PH (3): row 21-23 -----
    phIn:           _entry(_daily(21), null, false),
    phDitch:        _entry(_daily(22), null, false),
    phOut:          _entry(_daily(23), null, false),

    // ----- SV (4): row 24-27 -----
    sv10:           _entry(_daily(24), null, false),
    sv20:           _entry(_daily(25), null, false),
    sv30:           _entry(_daily(26), null, false),
    sv24h:          _entry(_daily(27), null, false),

    // ----- MLSS/汚泥界面/塩素 (3): row 28-30 -----
    mlss:           _entry(_daily(28), null, false),
    sludgeLevel:    _entry(_daily(29), null, false),
    chlorine:       _entry(_daily(30), null, false),

    // ----- 終沈 (3): 月一書込、Phase 23-A 補追2-b null skip 適用、block 1/2 混在 -----
    // page1 (row1 = 7+d): tempFinal E列, phFinal Q列
    // page2 (row2 = 48+d): transFinal D列
    tempFinal:      _entry(null, _monthly(1, 5),  true),   // page1 E列
    phFinal:        _entry(null, _monthly(1, 17), true),   // page1 Q列
    transFinal:     _entry(null, _monthly(2, 4),  true),   // page2 D列

    // ----- メタ (2): 別経路書込、b3 では documentation only -----
    // inspector: 別経路書込 (TODO: b3+ で MAP 化)
    // bikou: 別経路書込 (TODO: b3+ で MAP 化、ISO timestamp スキップロジック存在)
    inspector:      _entry(null, null, false),
    bikou:          _entry(null, null, false)
  };

  // ========================================================================
  // NULL_SKIP_KEYS_DIRECT 動的算出
  // ========================================================================
  const NULL_SKIP_KEYS_DIRECT = Object.keys(EXCEL_WRITE_MAP).filter(function(k) {
    const e = EXCEL_WRITE_MAP[k];
    return e.storage_unit === 'key' && e.daily === null && e.null_skip === true;
  });

  // ========================================================================
  // グローバル公開
  // ========================================================================
  window.EXCEL_WRITE_MAP = EXCEL_WRITE_MAP;
  window.EXCEL_WRITE_MAP_SHEETS = SHEETS;
  window.NULL_SKIP_KEYS_DIRECT = NULL_SKIP_KEYS_DIRECT;
  window.EXCEL_WRITE_MAP_NULL_SKIP_KEYS_DIRECT = NULL_SKIP_KEYS_DIRECT;  // yoshiwa/kake 互換 alias

  // ========================================================================
  // 起動時整合性検証 (6 種、kake +1: block 検証)
  // ========================================================================
  function verifyAgainstKamitonoFields() {
    if (typeof ALL_FIELDS === 'undefined') {
      console.warn('[EXCEL_WRITE_MAP verify] ALL_FIELDS 未定義、検証スキップ');
      return;
    }

    const issues = [];

    // 1. ALL_FIELDS の各キーが EXCEL_WRITE_MAP に存在するか
    ALL_FIELDS.forEach(function(id) {
      if (!EXCEL_WRITE_MAP[id]) {
        issues.push('[EXCEL_WRITE_MAP] ' + id + ' は ALL_FIELDS にあるが MAP 未登録');
      }
    });

    // 2. EXCEL_WRITE_MAP の各キーが ALL_FIELDS に存在するか
    Object.keys(EXCEL_WRITE_MAP).forEach(function(id) {
      if (ALL_FIELDS.indexOf(id) < 0) {
        issues.push('[EXCEL_WRITE_MAP] ' + id + ' は MAP にあるが ALL_FIELDS に未登録');
      }
    });

    // 3. NULL_SKIP_KEYS_DIRECT 期待値
    const expected = ['tempFinal', 'transFinal', 'phFinal'].sort().join(',');
    const actual = NULL_SKIP_KEYS_DIRECT.slice().sort().join(',');
    if (expected !== actual) {
      issues.push('[NULL_SKIP_KEYS_DIRECT] 期待[' + expected + '] / 実際[' + actual + ']');
    }

    // 4. 終沈 3 キーの monthly.col 数値必須 + monthly.block ∈ {1,2}
    ['tempFinal', 'transFinal', 'phFinal'].forEach(function(id) {
      const entry = EXCEL_WRITE_MAP[id];
      if (!entry || !entry.monthly) {
        issues.push('[EXCEL_WRITE_MAP] ' + id + ' monthly 未定義');
        return;
      }
      if (typeof entry.monthly.col !== 'number') {
        issues.push('[EXCEL_WRITE_MAP] ' + id + ' monthly.col が数値でない');
      }
      if (entry.monthly.block !== 1 && entry.monthly.block !== 2) {
        issues.push('[EXCEL_WRITE_MAP] ' + id + ' monthly.block が 1 または 2 でない (kamitono 固有)');
      }
      if (entry.daily !== null) {
        issues.push('[EXCEL_WRITE_MAP] ' + id + ' daily !== null (期待: null、Phase 23-A 補追2-b null skip 対象)');
      }
    });

    // 5. レポート
    if (issues.length === 0) {
      console.log('[EXCEL_WRITE_MAP verify] OK: ALL_FIELDS と完全一致 (NULL_SKIP_KEYS_DIRECT=' + JSON.stringify(NULL_SKIP_KEYS_DIRECT) + ')');
    } else {
      console.warn('[EXCEL_WRITE_MAP verify] 整合性問題 ' + issues.length + ' 件:');
      issues.forEach(function(msg) { console.warn('  ' + msg); });
    }
  }

  // DOMContentLoaded 後に実行 (ALL_FIELDS が読み込まれていることを保証)
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', verifyAgainstKamitonoFields);
  } else {
    setTimeout(verifyAgainstKamitonoFields, 0);
  }
})();
