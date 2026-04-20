# Related Posts Generator

Web App สำหรับสร้าง HTML บล็อก "ข่าวที่เกี่ยวข้อง" เพื่อนำไปวางใน WordPress Classic Editor
โดยมี Google Sign-In ล็อคเฉพาะ email องค์กร `@thestandard.co`

---

## ภาพรวมระบบ

```
บรรณาธิการ Login ด้วย @thestandard.co
        ↓
เปิด Web App → วาง URL ข่าว
        ↓
Web App เรียก Google Apps Script
        ↓
Apps Script ลอง WordPress REST API ก่อน
(/wp-json/wp/v2/posts?slug=...)
        ↓ สำเร็จ              ↓ ไม่พบ
ได้ title + date + image    fallback og:tags
        ↓
แปลงรูปเป็น base64 (แก้ hotlink block)
        ↓
Generate HTML Block (table layout + responsive)
        ↓
Copy → วางใน WordPress Classic Editor (แท็บ Text)
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
6. เปิด `index.html` แก้บรรทัดนี้
```javascript
const APPS_SCRIPT_URL = 'YOUR_APPS_SCRIPT_URL_HERE';
```

### 2. Google OAuth Client ID

1. ไปที่ [Google Cloud Console](https://console.cloud.google.com) → **APIs & Services → Credentials**
2. กด **Create Credentials → OAuth 2.0 Client ID**
   - Application type: **Web application**
3. เพิ่ม **Authorized JavaScript origins**
```
https://YOUR_GITHUB_USERNAME.github.io
```
4. Copy **Client ID** ที่ได้
5. เปิด `index.html` แก้บรรทัดนี้
```html
data-client_id="YOUR_CLIENT_ID"
```

### 3. Deploy บน GitHub Pages

1. Push `index.html` ขึ้น GitHub repo
2. ไปที่ **Settings → Pages**
3. Source: **Deploy from a branch** → Branch: **main** → Folder: **/ (root)**
4. กด **Save** รอ 1-2 นาที ได้ URL `https://username.github.io/repo-name/`

---

## วิธีใช้งาน

1. เปิด Web App URL
2. Login ด้วย Google Account `@thestandard.co`
3. วาง URL ข่าวทีละบรรทัด
4. กด **Generate HTML**
5. รอระบบดึง Title + รูปปก + วันที่
6. กด **Copy HTML**
7. ไปวางใน WordPress Classic Editor แท็บ **Text**

---

## Security

- Login ด้วย **Google Sign-In** เท่านั้น
- ตรวจสอบ email domain — อนุญาตเฉพาะ `@thestandard.co`
- email domain อื่นจะเห็น error message และใช้งานไม่ได้
- session จำไว้ใน `sessionStorage` — ปิด browser แล้วต้อง login ใหม่

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

Plugin จะดึง Title + รูปปก + วันที่ให้อัตโนมัติ รองรับ WordPress REST API และ og:tags fallback

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

Bot จะแปลง Section นั้นเป็น Shortcode ให้อัตโนมัติก่อน POST ขึ้น WordPress ผ่าน REST API

---

## ข้อจำกัด

| เว็บ | ดึงได้ไหม | สาเหตุ |
|---|---|---|
| WordPress เช่น thestandard.co, matichon, khaosod | ✅ ปกติ | ดึงผ่าน WordPress REST API |
| เว็บที่ไม่ใช่ WordPress | ⚠️ ได้บางส่วน | ดึงจาก og:tags เป็น fallback |
| เว็บที่ Block Hotlink | ✅ แก้แล้ว | แปลงรูปเป็น base64 ผ่าน Apps Script |

---

## แก้ไข HTML Output

ใน HTML ที่ Generate ออกมา สามารถปรับแต่งได้ตามนี้

```html
<!-- แก้ขนาดเส้นสีแดง: เปลี่ยน 4px เป็นค่าที่ต้องการ -->
<!-- แก้สีเส้น: เปลี่ยน #e62227 เป็นสีที่ต้องการ -->
<h3 style="...;border-bottom:4px solid #e62227;...">ข่าวที่เกี่ยวข้อง</h3>
```

Responsive บนมือถือ (≤480px) รูปจะเล็กลงจาก 110×74px เป็น 80×54px อัตโนมัติ
