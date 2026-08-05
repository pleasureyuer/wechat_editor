// 复刻 App.vue handleApplyMarkdown 中 yiming 预设的单遍顺序解析器，
// 对「主题适配」副本跑一遍，仅打印组件序列用于验证（不依赖 Vue/DOM）。
import { readFileSync } from 'fs';

const mdPath = process.argv[2] ||
  'C:/Users/Administrator/WorkBuddy/2026-07-12-22-21-40/卷一第01篇-易命一术-洒扫庭除-主题适配.md';
const mdText = readFileSync(mdPath, 'utf8');

// 行内格式（与 App.vue fmt 一致）
const fmt = (s) => s
  .replace(/＊/g, '*')
  .replace(/＿/g, '_')
  .replace(/\*\*(.+?)\*\*/g, '<b>$1</b>')
  .replace(/__(.+?)__/g, '<b>$1</b>')
  .replace(/\*(.+?)\*/g, '<i>$1</i>')
  .replace(/_(.+?)_/g, '<i>$1</i>');

// 标记式 componentHTML（仅输出组件类型，便于看顺序）
const componentHTML = ({ type }, text) => `[${type}](${text ?? ''})`;

const lines = mdText.split('\n');
const out = [];
let metaTitle = '', metaDigest = '';
let pastMeta = false, foundShu = false, foundMain = false;
let k = 0;
while (k < lines.length) {
  const raw = lines[k];
  const norm = raw.replace(/＊/g, '*').trim();
  if (!norm) { k++; continue; }
  if (!pastMeta && /^(标题|摘要)\s*[:：]/.test(norm)) {
    if (/^标题/.test(norm)) metaTitle = norm.replace(/^标题\s*[:：]\s*/, '');
    if (/^摘要/.test(norm)) metaDigest = norm.replace(/^摘要\s*[:：]\s*/, '');
    k++; continue;
  }
  pastMeta = true;
  const inner = norm.replace(/^\*+/, '').replace(/\*+$/, '').trim();

  const h1 = norm.match(/^#\s+(.+)$/);
  if (h1 && /^易命[\w\W]{0,6}术\s*[·・\-–]\s*.+/.test(h1[1].replace(/^\*+/, '').replace(/\*+$/, '').trim())) {
    out.push(componentHTML({ type: 'titleShuName' }, h1[1].replace(/^\*+/, '').replace(/\*+$/, '').trim()));
    foundShu = true; k++; continue;
  }
  if (/^\*+.+$/.test(norm) && /^易命[\w\W]{0,6}术\s*[·・\-–]\s*.+/.test(inner)) {
    out.push(componentHTML({ type: 'titleShuName' }, inner));
    foundShu = true; k++; continue;
  }
  if (foundShu && !foundMain && !/^\*+/.test(norm) && !norm.startsWith('>') && inner.length <= 25) {
    out.push(componentHTML({ type: 'underlineTitle' }, inner));
    foundMain = true; k++; continue;
  }
  const hm = norm.match(/^#{2,3}\s+(.+)$/);
  if (hm) { out.push(componentHTML({ type: 'titleVolBlock' }, fmt(hm[1]))); k++; continue; }
  if (/^[-*_]{3,}$/.test(norm)) { out.push(componentHTML({ type: 'dividerDots' })); k++; continue; }
  if (norm.startsWith('>')) {
    const qt = norm.replace(/^>\s?/, '').trim();
    const qInner = qt.replace(/^\*+/, '').replace(/\*+$/, '').trim();
    if (/预告/.test(qInner)) {
      const block = [qInner];
      k++;
      while (k < lines.length && lines[k].trim().startsWith('>')) {
        const n2 = lines[k].replace(/＊/g, '*').trim().replace(/^>\s?/, '').trim();
        if (/（[^）]*出自小说|（[^）]*不涉及小说/.test(n2)) break;
        const c = n2.replace(/^\*+/, '').replace(/\*+$/, '').trim();
        if (c) block.push(c);
        k++;
      }
      out.push(componentHTML({ type: 'cardVolume' }, block.join(' | ')));
      continue;
    }
    if (/（[^）]*出自小说[^）]*）/.test(qt) || /（[^）]*不涉及小说[^）]*）/.test(qt)) {
      out.push(componentHTML({ type: 'yimingDisclaimer' }, null));
      k++; continue;
    }
    out.push(componentHTML({ type: 'quoteXuan' }, fmt(qt)));
    k++; continue;
  }
  if (/^\*+.+\*+$/.test(norm) && inner.length > 5) {
    out.push(componentHTML({ type: 'goldenQuote' }, inner));
    k++; continue;
  }
  if (/(说[是为]|原文|引用|六祖|古人云|有诗为证|《[^》]+》)/.test(inner) && inner.length > 20) {
    out.push(componentHTML({ type: 'quoteXuan' }, fmt(inner)));
    k++; continue;
  }
  out.push(`<p>${fmt(inner)}</p>`);
  k++; continue;
}

const html = [
  componentHTML({ type: 'seriesOpening' }, null),
  ...out,
  componentHTML({ type: 'seriesLabel' }, null)
].join('\n');

console.log('=== 元数据 ===');
console.log('metaTitle :', metaTitle);
console.log('metaDigest:', metaDigest);
console.log('\n=== 组件序列（应与示例一致）===');
html.split('\n').forEach((line, i) => console.log(String(i + 1).padStart(2, ' '), line));
