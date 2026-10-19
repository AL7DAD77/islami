#!/usr/bin/env python3
"""
يولّد بيانات «المصحف بصفحاته» (604 صفحة، 15 سطراً) من:
  - تخطيط KFGQPC (QUL): qpc-v2-15-lines.db  (جدول pages)
  - نص QPC Hafs كلمة بكلمة (QUL): qpc-hafs-word-by-word.json
  - خط UthmanicHafs_V22.ttf (لحساب عرض أطول سطر فقط؛ لا يُعدَّل الخط)
المخرجات: public/mushaf/pages/NNN.json و public/mushaf/meta.json
الاستعمال: python tools/build_mushaf_data.py <layout.db> <words.json> <font.ttf> <out_dir>
"""
import json, sqlite3, sys, collections, os
from PIL import ImageFont

LAYOUT, WORDS, FONT, OUT = sys.argv[1:5]

SURAH_NAMES = """الفاتحة|البقرة|آل عمران|النساء|المائدة|الأنعام|الأعراف|الأنفال|التوبة|يونس|هود|يوسف|الرعد|إبراهيم|الحجر|النحل|الإسراء|الكهف|مريم|طه|الأنبياء|الحج|المؤمنون|النور|الفرقان|الشعراء|النمل|القصص|العنكبوت|الروم|لقمان|السجدة|الأحزاب|سبأ|فاطر|يس|الصافات|ص|الزمر|غافر|فصلت|الشورى|الزخرف|الدخان|الجاثية|الأحقاف|محمد|الفتح|الحجرات|ق|الذاريات|الطور|النجم|القمر|الرحمن|الواقعة|الحديد|المجادلة|الحشر|الممتحنة|الصف|الجمعة|المنافقون|التغابن|الطلاق|التحريم|الملك|القلم|الحاقة|المعارج|نوح|الجن|المزمل|المدثر|القيامة|الإنسان|المرسلات|النبأ|النازعات|عبس|التكوير|الانفطار|المطففين|الانشقاق|البروج|الطارق|الأعلى|الغاشية|الفجر|البلد|الشمس|الليل|الضحى|الشرح|التين|العلق|القدر|البينة|الزلزلة|العاديات|القارعة|التكاثر|العصر|الهمزة|الفيل|قريش|الماعون|الكوثر|الكافرون|النصر|المسد|الإخلاص|الفلق|الناس""".split('|')
assert len(SURAH_NAMES) == 114

# بدايات الأجزاء المعروفة (سورة، آية) وصفحاتها في مصحف المدينة — للتحقق المتقاطع فقط
JUZ_START = [(1,1,1),(2,142,22),(2,253,42),(3,93,62),(4,24,82),(4,148,102),(5,82,121),(6,111,142),(7,88,162),(8,41,182),
 (9,93,201),(11,6,222),(12,53,242),(15,1,262),(17,1,282),(18,75,302),(21,1,322),(23,1,342),(25,21,362),(27,56,382),
 (29,46,402),(33,31,422),(36,28,442),(39,32,462),(41,47,482),(46,1,502),(51,31,522),(58,1,542),(67,1,562),(78,1,582)]
# عدد آيات سور معروفة للتحقق المتقاطع
KNOWN_AYAT = {1:7,2:286,3:200,4:176,5:120,6:165,7:206,9:129,18:110,36:83,55:78,67:30,72:28,112:4,113:5,114:6}

raw = json.load(open(WORDS, encoding='utf-8'))
W = {v['id']: v for v in raw.values()}
assert sorted(W) == list(range(1, 83669)), "معرّفات الكلمات غير متصلة"

rows = sqlite3.connect(LAYOUT).execute(
    "select page_number,line_number,line_type,is_centered,first_word_id,last_word_id,surah_number "
    "from pages order by page_number,line_number").fetchall()

ayat = collections.defaultdict(set)
for v in W.values(): ayat[int(v['surah'])].add(int(v['ayah']))
assert sum(len(a) for a in ayat.values()) == 6236
for s, n in KNOWN_AYAT.items():
    assert len(ayat[s]) == n, f"عدد آيات السورة {s}: {len(ayat[s])} ≠ {n}"

def page_of_ayah(s, a):
    first = next(i for i, v in W.items() if int(v['surah']) == s and int(v['ayah']) == a)
    for r in rows:
        if r[2] == 'ayah' and int(r[4]) <= first <= int(r[5]): return r[0]
for s, a, p in JUZ_START:
    got = page_of_ayah(s, a)
    assert got == p, f"بداية الجزء ({s}:{a}) في الصفحة {got} وليست {p}"
print("✓ بدايات الأجزاء الثلاثين تطابق المعروف | ✓ أعداد الآيات المعروفة تطابق | ✓ 6236 آية")

juz_pages = [p for _, _, p in JUZ_START]
def juz_of(page):
    j = 1
    for k, p in enumerate(juz_pages, 1):
        if page >= p: j = k
    return j

# ---- مقاييس الخط: عرض أطول سطر بوحدة em ----
SZ = 400
font = ImageFont.truetype(FONT, SZ, layout_engine=ImageFont.Layout.RAQM)
def wid(t): return font.getlength(t, direction='rtl', language='ar') / SZ
space_em = wid(' ')

pages = collections.defaultdict(list)
surah_start = {}
max_line = 0.0; widest = None
total_words = 0
for r in rows:
    page, ln, typ, cen, fw, lw, sn = r
    if typ == 'surah_name':
        surah_start[int(sn)] = page
        pages[page].append({"t": "s", "n": int(sn)})
    elif typ == 'basmallah':
        pages[page].append({"t": "b"})
    else:
        ids = range(int(fw), int(lw) + 1)
        texts = [W[i]['text'] for i in ids]
        total_words += len(texts)
        line_w = sum(wid(t) for t in texts) + space_em * (len(texts) - 1)
        if line_w > max_line: max_line, widest = line_w, (page, ln)
        pages[page].append({"t": "a", "c": int(cen), "s": int(W[int(fw)]['surah']),
                            "w": texts, "a": [int(W[i]['ayah']) for i in ids]})
covered = sum(len(l['w']) for p in pages.values() for l in p if l['t'] == 'a')
assert covered == 83668, covered
assert len(pages) == 604 and sorted(surah_start) == list(range(1, 115))

os.makedirs(os.path.join(OUT, 'pages'), exist_ok=True)
sizes = []
for p in range(1, 605):
    lines = pages[p]
    first_s = next((l.get('s') or l.get('n') for l in lines if l['t'] in ('a', 's')), None)
    obj = {"p": p, "j": juz_of(p), "l": lines}
    s = json.dumps(obj, ensure_ascii=False, separators=(',', ':'))
    open(os.path.join(OUT, 'pages', f"{p:03d}.json"), 'w', encoding='utf-8').write(s)
    sizes.append(len(s.encode('utf-8')))

basmalah = ' '.join(W[i]['text'] for i in range(1, 5))   # بسم الله الرحمن الرحيم (من الآية 1:1)
meta = {"version": 1, "pages": 604, "maxLineEm": round(max_line, 4), "spaceEm": round(space_em, 4),
        "basmalah": basmalah, "surahNames": SURAH_NAMES, "surahStartPage": [surah_start[i] for i in range(1, 115)],
        "juzStartPage": juz_pages}
json.dump(meta, open(os.path.join(OUT, 'meta.json'), 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))

# ---- فهرس الآيات: صفحة بداية كل آية + عدد حروفها (لوزن التظليل أثناء التلاوة) ----
import re
DIAC = re.compile('[\u064B-\u065F\u0670\u06D6-\u06ED\u08D3-\u08FF]')
word_page = {}
for r in rows:
    if r[2] == 'ayah':
        for i in range(int(r[4]), int(r[5]) + 1): word_page[i] = r[0]
ay_page = collections.defaultdict(dict); ay_letters = collections.defaultdict(lambda: collections.defaultdict(int))
for i in range(1, 83669):
    v = W[i]; s_, a_ = int(v['surah']), int(v['ayah'])
    ay_page[s_].setdefault(a_, word_page[i])          # صفحة أول كلمة في الآية
    t = v['text']
    if not re.fullmatch('[٠-٩]+', t):                  # نتجاهل علامة نهاية الآية (رقم فقط)
        ay_letters[s_][a_] += len(re.sub(r'\s+', '', DIAC.sub('', t)))
index = {"pages": [[ay_page[s_][a_] for a_ in range(1, len(ay_page[s_]) + 1)] for s_ in range(1, 115)],
         "letters": [[ay_letters[s_][a_] for a_ in range(1, len(ay_page[s_]) + 1)] for s_ in range(1, 115)]}
assert sum(len(x) for x in index["pages"]) == 6236 and all(l > 0 for ls in index["letters"] for l in ls)
for s_ in range(1, 115):   # الصفحات غير متناقصة داخل السورة، وتبدأ من صفحة السورة أو بعدها
    pg = index["pages"][s_ - 1]
    assert pg == sorted(pg) and pg[0] >= surah_start[s_], s_
json.dump(index, open(os.path.join(OUT, 'ayah-index.json'), 'w', encoding='utf-8'), separators=(',', ':'))
print(f"✓ ayah-index.json: {os.path.getsize(os.path.join(OUT,'ayah-index.json'))/1024:.0f} KB | 6236 آية، كل حروفها > 0")
print(f"✓ 604 صفحة | كلمات مغطاة: {covered} | حجم الصفحات: متوسط {sum(sizes)//604} بايت، أكبرها {max(sizes)}، المجموع {sum(sizes)/1024:.0f} KB")
print(f"✓ أعرض سطر: صفحة {widest[0]} سطر {widest[1]} = {max_line:.3f} em | عرض المسافة {space_em:.3f} em")
