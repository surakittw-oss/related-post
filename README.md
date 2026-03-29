# Related Posts Generator

Web App สำหรับสร้าง HTML บล็อก "ข่าวที่เกี่ยวข้อง" เพื่อนำไปวางใน WordPress Classic Editor

---

## ภาพรวมระบบ

```
นักเขียนวาง URL ใน Web App
        ↓
Web App เรียก Google Apps Script
        ↓
Apps Script ดึงข้อมูลผ่าน WordPress REST API
(Title + รูปปก + วันที่/เวลา)
        ↓
Generate HTML Block พร้อมใช้
        ↓
Copy ไปวางใน WordPress Classic Editor (แท็บ Text)
```

---

## ไฟล์ในโปรเจกต์

```
related-post/
├── index.html          ← Web App หลัก (host บน GitHub Pages)
├── apps-script-code.gs ← Google Apps Script (Backend API)
└── README.md           ← ไฟล์นี้
```

---

## การติดตั้ง

### 1. Google Apps Script (Backend)

1. ไปที่ [script.google.com](https://script.google.com) → **New Project**
2. วาง code จาก `apps-script-code.gs` ทับทั้งหมด
3. กด **Deploy → New Deployment**
   - Type: **Web App**
   - Execute as: **Me**
   - Who has access: **Anyone**
4. กด **Deploy** → Allow Permission
5. Copy URL ที่ได้ (รูปแบบ `https://script.google.com/macros/s/.../exec`)

### 2. Web App (Frontend)

เปิดไฟล์ `index.html` แล้วแก้บรรทัดนี้

```javascript
const APPS_SCRIPT_URL = 'YOUR_APPS_SCRIPT_URL_HERE';
```

เปลี่ยนเป็น URL ที่ได้จาก Apps Script

### 3. Deploy บน GitHub Pages

1. Push `index.html` ขึ้น GitHub repo
2. ไปที่ **Settings → Pages**
3. Source: **Deploy from a branch** → Branch: **main** → Folder: **/ (root)**
4. กด **Save** รอ 1-2 นาที ได้ URL `https://username.github.io/repo-name/`

---

## วิธีใช้งาน

1. เปิด Web App URL
2. วาง URL ข่าวทีละบรรทัด
3. กด **Generate HTML**
4. รอระบบดึง Title + รูปปก + วันที่
5. กด **Copy HTML**
6. ไปวางใน WordPress Classic Editor แท็บ **Text**

---

## WordPress Plugin (ทางเลือก)

สำหรับการใช้งานแบบ Shortcode แทน HTML Block

**ติดตั้ง**
1. วางโฟลเดอร์ `my-related-posts/` ใน `/wp-content/plugins/`
2. WordPress Admin → Plugins → Activate **My Related Posts**

**วิธีใช้ใน Classic Editor**
```
[related_posts]
https://yoursite.com/news-a
https://other-site.com/article
[/related_posts]
```

Plugin จะดึง Title + รูปปก + วันที่ให้อัตโนมัติ

---

## Automation (Google Docs → WordPress)

สำหรับทีมที่มี Bot ดึงบทความจาก Google Docs ขึ้น WordPress

นักเขียนระบุ URL ใน Google Docs แบบนี้

```
เนื้อหาบทความ...

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

## ข้อจำกัด

| เว็บ | ดึงได้ไหม | สาเหตุ |
|---|---|---|
| WordPress เช่น matichon, khaosod, thairath, thestandard.co | ✅ ปกติ | ดึงผ่าน WordPress REST API |
| เว็บที่ไม่ใช่ WordPress | ⚠️ ได้บางส่วน | ดึงจาก og:tags เป็น fallback |
| เว็บที่ Block Hotlink | ⚠️ ได้ชื่อแต่รูปอาจไม่แสดง | เว็บต้นทางบล็อกการโหลดรูปข้ามโดเมน |

---

## แก้ไข HTML Output

ใน HTML ที่ Generate ออกมา สามารถปรับแต่งได้ตามนี้

```html
<!-- แก้ขนาดเส้นสีแดง: เปลี่ยน 2px เป็นค่าที่ต้องการ -->
<!-- แก้สีเส้น: เปลี่ยน #e62227 เป็นสีที่ต้องการ -->
<h3 style="...;border-bottom:2px solid #e62227;...">ข่าวที่เกี่ยวข้อง</h3>
```
