/*
 * 和暦ユーティリティ（wareki.js）
 *
 * ■ 目的
 *   日付・年度から和暦表記（例: 令和8年度）を生成する専用モジュール。
 *   各アプリの帳票タイトルなどで使う。祝日計算とは無関係（混ぜない）。
 *
 * ■ 仕組み
 *   下の ERA_TABLE（元号テーブル）が唯一の正データ。
 *   与えられた日付に対し「開始日 <= 日付」を満たす最新の元号を選び、
 *   元号年 = 西暦 - 元号開始年 + 1 で算出する。
 *   年度は4月始まり（1〜3月は前年の年度扱い）。
 *
 * ■ 将来、新しい元号が始まったら（改元時の手順）
 *   1. 政府が発表した「新元号名・略号・開始日(YYYY-MM-DD)」を確認する。
 *   2. ERA_TABLE の先頭に1行追加するだけ。例:
 *        { name:'新元号', romaji:'X', start:'20XX-XX-XX' },
 *   3. 各アプリへ反映し、再デプロイ（GitHub Pages 反映＋SWキャッシュ +1）。
 *   ※ それ以外のコードは触らなくてよい。
 *
 * ■ 注意
 *   ・元号は事前に自動取得できない（政府発表が必要）ため、手で1行足す運用。
 *   ・このファイルは「和暦のことだけ」を扱う。祝日・グレーアウトは別ロジック（holidays.js）。
 */
(function (global) {
  'use strict';

  // 元号テーブル（唯一の正データ）。改元時はここの先頭に1行追加するだけ。
  var ERA_TABLE = [
    { name: '令和', romaji: 'R', start: '2019-05-01' },
    { name: '平成', romaji: 'H', start: '1989-01-08' },
    { name: '昭和', romaji: 'S', start: '1926-12-25' }
  ];

  // 'YYYY-MM-DD' / Date / (y,m,d) を Date(現地正午) に正規化（TZ ずれ回避）。
  function toDate(v) {
    if (v instanceof Date) return new Date(v.getFullYear(), v.getMonth(), v.getDate(), 12);
    var s = String(v).trim();
    var m = s.match(/^(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})/);
    if (m) return new Date(+m[1], +m[2] - 1, +m[3], 12);
    var m2 = s.match(/^(\d{4})[-\/](\d{1,2})$/);
    if (m2) return new Date(+m2[1], +m2[2] - 1, 1, 12);
    return null;
  }

  // 日付 → 該当元号エントリ（開始日 <= 日付 を満たす最新）。
  function eraOf(date) {
    var t = date.getTime();
    for (var i = 0; i < ERA_TABLE.length; i++) {
      if (toDate(ERA_TABLE[i].start).getTime() <= t) return ERA_TABLE[i];
    }
    return null;
  }

  // 日付 → { name:'令和', romaji:'R', year:8 }（和暦年）。
  function toWareki(v) {
    var d = toDate(v);
    if (!d) return null;
    var era = eraOf(d);
    if (!era) return null;
    var startY = toDate(era.start).getFullYear();
    return { name: era.name, romaji: era.romaji, year: d.getFullYear() - startY + 1 };
  }

  // 日付 → '令和8年'（year 部の '1' は通例「元年」だが帳票慣習に合わせ数字で出す）。
  function formatWarekiYear(v) {
    var w = toWareki(v);
    return w ? (w.name + w.year + '年') : '';
  }

  // 年度（4月始まり）→ '令和8年度'。引数は Date / 'YYYY-MM' / 西暦年(number) いずれも可。
  function formatFiscalYear(v) {
    var fy;
    if (typeof v === 'number') { fy = v; }
    else {
      var d = toDate(v);
      if (!d) return '';
      fy = d.getMonth() + 1 <= 3 ? d.getFullYear() - 1 : d.getFullYear();
    }
    // 年度の代表日 = その年度の4/1 で元号を判定
    var w = toWareki(fy + '-04-01');
    return w ? (w.name + w.year + '年度') : '';
  }

  var API = { ERA_TABLE: ERA_TABLE, toWareki: toWareki, formatWarekiYear: formatWarekiYear, formatFiscalYear: formatFiscalYear };
  global.Wareki = API;
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
})(typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : this));
