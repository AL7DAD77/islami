import sqlite3
import json
import os

# تحديد المسارات بدقة
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DB_PATH = os.path.join(BASE_DIR, "qpc-v2-15-lines.db")
QPC_JSON_PATH = os.path.join(BASE_DIR, "public", "qpc.json")
OUT_DIR = os.path.join(BASE_DIR, "public", "mushaf", "pages")

if not os.path.exists(OUT_DIR):
    os.makedirs(OUT_DIR)

print("1. جاري قراءة qpc.json...")
with open(QPC_JSON_PATH, "r", encoding="utf-8") as f:
    qpc_data = json.load(f)

# تحويل البيانات لقاموس يسهل البحث فيه
word_dict = {}
for key, val in qpc_data.items():
    if 'id' in val and 'text' in val:
        word_dict[int(val['id'])] = val['text']

print("2. جاري الاتصال بقاعدة البيانات...")
conn = sqlite3.connect(DB_PATH)
cursor = conn.cursor()

print("3. جاري استخراج الصفحات...")
for page_num in range(1, 605):
    # جلب الأسطر الخاصة بالصفحة
    cursor.execute("SELECT first_word_id, last_word_id FROM pages WHERE page_number = ?", (page_num,))
    rows = cursor.fetchall()
    
    page_words = []
    
    for row in rows:
        # تحويل القيم إلى أرقام صحيحة (لحل المشكلة)
        first_word = int(row[0]) if row[0] else 0
        last_word = int(row[1]) if row[1] else 0
        
        if first_word == 0 or last_word == 0:
            continue

        for word_id in range(first_word, last_word + 1):
            if word_id in word_dict:
                page_words.append(word_dict[word_id])
    
    # حفظ الصفحة
    page_content = " ".join(page_words)
    page_data = {"text": page_content}
    
    with open(os.path.join(OUT_DIR, f"{page_num:03d}.json"), "w", encoding="utf-8") as f:
        json.dump(page_data, f, ensure_ascii=False)
        
    if page_num % 50 == 0:
        print(f"تمت معالجة {page_num} صفحة...")

conn.close()
print("4. تم استخراج جميع الصفحات بنجاح!")