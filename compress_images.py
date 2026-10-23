import os
from PIL import Image

# المسار الذي توجد فيه صور المصحف حالياً
DIR = "public/mushaf/pages"

print("جاري ضغط الصور... يرجى الانتظار")
count = 0

for filename in os.listdir(DIR):
    if filename.endswith(".webp"):
        filepath = os.path.join(DIR, filename)
        try:
            img = Image.open(filepath)
            
            # تصغير العرض إذا كان أكبر من 1080 بكسل (معظم شاشات الهواتف)
            if img.width > 1080:
                ratio = 1080 / img.width
                new_height = int(img.height * ratio)
                img = img.resize((1080, new_height), Image.Resampling.LANCZOS)
                
            # حفظ الصورة بجودة 60 (تقليل الحجم بشكل كبير)
            img.save(filepath, "WEBP", quality=60)
            count += 1
        except Exception as e:
            print(f"خطأ في الصورة {filename}: {e}")

print(f"تم ضغط {count} صورة بنجاح!")