#!/usr/bin/env python3
"""
يحوّل adhkar.json (مستودع rn0x/Adhkar-json، المأخوذ من «حصن المسلم» للقحطاني)
إلى lib/hisn-almuslim.ts بصيغة التطبيق، بتنظيف محدود وموثّق، ويتحقق أن لا حرف
عربي أصلي تغيّر أو حُذف خارج الإصلاحات المعلنة أدناه.

التنظيف (وكل ما عداه يبقى حرفياً):
  1) حروف العرض الخاصة (FB50–FDFF / FE70–FEFF ما عدا ﴿ ﴾) ← أحرفها الأصلية (NFKC لكل حرف).
  2) إصلاح «مترلا» ← «منزلاً» (عطل تحويل في عنوان واحد).
  3) حذف التطويل (ـ) داخل الكلمات: لا قيمة له في المعنى.
  4) النجمة (*) الفاصلة بين الآيات داخل ﴿ ﴾ ← « ۝ » كما في بقية نصوص التطبيق.
  5) «و سلم» ← «وسلم» وتنظيف المسافات الزائدة في الأطراف وتكرارها.
"""
import json, re, sys, unicodedata, collections

SRC, OUT_TS, OUT_REPORT = sys.argv[1], sys.argv[2], sys.argv[3]
raw = json.load(open(SRC, encoding='utf-8'))
stats = collections.Counter()

def fix_presentation(s):
    out = []
    for ch in s:
        if ('\uFB50' <= ch <= '\uFDFF' or '\uFE70' <= ch <= '\uFEFF') and ch not in '\uFD3E\uFD3F':
            n = unicodedata.normalize('NFKC', ch)
            if n != ch: stats['حروف عرض خاصة أُعيدت لأصلها'] += 1
            out.append(n)
        else:
            out.append(ch)
    return ''.join(out)

def fix_stars(s):
    def inner(m):
        seg = m.group(0)
        k = seg.count('*')
        if k: stats['نجمة فاصلة بين آيات ← ۝'] += k
        return seg.replace('*', ' ۝ ')
    s2 = re.sub(r'\uFD3F[^\uFD3E]*\uFD3E', inner, s)   # ﴿ ... ﴾ (في ترميز النص: ﴿ هو U+FD3F)
    if '*' in s2: stats['نجمة متبقية خارج الآيات (تحتاج مراجعة)'] += s2.count('*')
    return s2

def clean(s, is_title=False):
    s = fix_presentation(s)
    if 'مترلا' in s:
        s = s.replace('مترلا', 'منزلاً'); stats['«مترلا» ← «منزلاً»'] += 1
    n = s.count('\u0640')
    if n: s = s.replace('\u0640', ''); stats['تطويل محذوف'] += n
    s = fix_stars(s)
    if ' و سلم' in s:
        stats['«و سلم» ← «وسلم»'] += s.count(' و سلم'); s = s.replace(' و سلم', ' وسلم')
    s2 = re.sub(r'[ \t]{2,}', ' ', s).strip()
    s2 = s2.replace(' ۝  ', ' ۝ ')
    if s2 != s: stats['مسافات منظّفة'] += 1
    return re.sub(r'[ \t]{2,}', ' ', s2)

def skeleton(s):
    """الحروف العربية الأساسية فقط: لإثبات أن التنظيف لم يلمس الكلام نفسه."""
    s = unicodedata.normalize('NFKC', s).replace('مترلا', 'منزلا').replace('\u0640', '')
    return re.sub(r'[^\u0621-\u064A]', '', s)

cats, items_total, changes = [], 0, []
for c in raw:
    title = clean(c['category'], True)
    items = []
    for it in c['array']:
        t = clean(it['text'])
        assert skeleton(t) == skeleton(it['text']), f"تغيّر الكلام نفسه في {c['id']}.{it['id']}"
        assert isinstance(it['count'], int) and it['count'] >= 1
        if t != it['text']: changes.append((c['id'], it['id'], it['text'], t))
        items.append((t, it['count']))
        items_total += 1
    if title != c['category']: changes.append((c['id'], 0, c['category'], title))
    cats.append((c['id'], title, items))

assert len(cats) == 132 and items_total == 267, (len(cats), items_total)

q = lambda s: json.dumps(s, ensure_ascii=False)
with open(OUT_TS, 'w', encoding='utf-8') as f:
    f.write("""import type { DhikrCategory } from './adhkar'

/**
 * أبواب كتاب «حصن المسلم من أذكار الكتاب والسنة» (132 باباً، 267 ذكراً)
 * تأليف: سعيد بن علي بن وهف القحطاني.
 * النصوص مأخوذة من ملف JSON المنشور على GitHub بواسطة rn0x (مستودع Adhkar-json)،
 * بعد تنظيف محدود للحروف (انظر tools/import_hisn.py). لا تُعدَّل يدوياً؛ أعد التوليد من المصدر.
 * لم يتضمن المصدر تخريجاً للأحاديث، فالمصدر المذكور لكل ذكر هو الكتاب نفسه.
 */
export const HISN_CATEGORIES: DhikrCategory[] = [
""")
    for cid, title, items in cats:
        f.write(f"  {{\n    id: 'hisn-{cid}',\n    title: {q(title)},\n    description: 'من كتاب حصن المسلم',\n    group: 'hisn',\n    items: [\n")
        for t, n in items:
            f.write(f"      {{ text: {q(t)}, count: {n}, source: 'حصن المسلم' }},\n")
        f.write("    ],\n  },\n")
    f.write("]\n")

with open(OUT_REPORT, 'w', encoding='utf-8') as f:
    f.write("# تقرير استيراد حصن المسلم\n\n")
    f.write(f"- الأبواب: {len(cats)} | الأذكار: {items_total} (مطابق لكتاب حصن المسلم: 132 / 267)\n")
    f.write("- تحقق آلي: لكل نص، الحروف العربية الأساسية بعد التنظيف مطابقة تماماً للأصل (لا حرف زيد أو حُذف).\n\n")
    f.write("## ما نُظِّف\n")
    for k, v in stats.most_common(): f.write(f"- {k}: {v}\n")
    f.write("\n## النصوص التي تغيّرت (قبل ← بعد) للمراجعة\n")
    for cid, iid, a, b in changes:
        loc = f"باب {cid} (العنوان)" if iid == 0 else f"باب {cid} ذكر {iid}"
        f.write(f"\n### {loc}\n- قبل: {a[:260]}{'…' if len(a)>260 else ''}\n- بعد: {b[:260]}{'…' if len(b)>260 else ''}\n")
print("تمّ:", len(cats), "باباً،", items_total, "ذكراً")
print(dict(stats))
