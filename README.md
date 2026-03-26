# Related Posts Generator

Web App สำหรับสร้าง HTML บล็อก "ข่าวที่เกี่ยวข้อง" เพื่อนำไปวางใน WordPress Classic Editor

---

## วิธีใช้งาน

1. เปิดไฟล์ `related-posts-generator.html` ในเบราว์เซอร์
2. วาง URL ข่าวที่ต้องการทีละบรรทัด
3. กด **Generate HTML**
4. รอระบบดึง Title, รูปปก และวันที่จากแต่ละ URL
5. กด **Copy HTML** แล้วไปวางใน WordPress Classic Editor (แท็บ Text)

---

## ข้อจำกัด

| เว็บ | ดึงได้ไหม | สาเหตุ |
|---|---|---|
| WordPress เช่น matichon, khaosod, thairath | ✅ ปกติ | HTML render ฝั่ง Server |
| Next.js / React เช่น thestandard.co | ❌ ไม่ได้รูปและวันที่ | JS render ฝั่ง Browser |
| เว็บที่ Block Hotlink | ⚠️ ได้ชื่อแต่ไม่ได้รูป | เว็บต้นทางบล็อกการโหลดรูปข้ามโดเมน |

> ถ้าต้องการรองรับเว็บ Next.js ต้องเพิ่ม Backend (Node.js + Puppeteer บน Vercel)

---

## ไฟล์ในโปรเจกต์

```
related-posts-generator.html   ← Web App หลัก เปิดใน Browser ได้เลย
README.md                      ← ไฟล์นี้
```

---

## WordPress Plugin (ทางเลือก)

ถ้าต้องการใช้ Shortcode แทนการ Generate HTML ด้วยมือ มี Plugin พร้อมใช้งานครับ

**วิธีติดตั้ง**
1. นำโฟลเดอร์ `my-related-posts/` วางใน `/wp-content/plugins/`
2. เข้า WordPress Admin → Plugins → Activate "My Related Posts"

**วิธีใช้ใน Classic Editor**
```
[related_posts]
https://yoursite.com/news-a
https://other-site.com/article
[/related_posts]
```

Plugin จะดึง Title, รูปปก และวันที่จากแต่ละ URL ให้อัตโนมัติ

---

## Automation (Bot / Script)

ถ้ามี Bot ดึงบทความจาก Google Docs มา Post ลง WordPress ให้เพิ่ม Section นี้ใน Docs

```
ข่าวที่เกี่ยวข้อง:
https://yoursite.com/news-a
https://other-site.com/article
```

Bot จะแปลง Section นั้นเป็น Shortcode ให้อัตโนมัติก่อน POST ขึ้น WordPress

```python
def process_doc_content(doc_text: str) -> str:
    urls = extract_related_urls(doc_text)
    if not urls:
        return doc_text
    shortcode = build_shortcode(urls)
    pattern = r'ข่าวที่เกี่ยวข้อง\s*:\s*\n[\s\S]*?(?:\n\n|\Z)'
    return re.sub(pattern, shortcode + "\n\n", doc_text)
```

---

## Flow ภาพรวม

```
นักเขียนเขียนบทความใน Google Docs
        ↓
ระบุ URL ใน Section "ข่าวที่เกี่ยวข้อง:"
        ↓
Bot ดึง Google Docs → แปลง URL เป็น Shortcode
        ↓
POST ขึ้น WordPress ผ่าน REST API
        ↓
Plugin แสดงผล ข่าวที่เกี่ยวข้อง อัตโนมัติ
```
