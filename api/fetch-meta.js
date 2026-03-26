const puppeteer = require('puppeteer-core');
const chromium  = require('@sparticuz/chromium');

module.exports = async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { url } = req.query;
  if (!url) return res.status(400).json({ error: 'Missing url parameter' });

  // validate URL
  try { new URL(url); } catch {
    return res.status(400).json({ error: 'Invalid URL' });
  }

  let browser;
  try {
    browser = await puppeteer.launch({
      args:            chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath:  await chromium.executablePath(),
      headless:        chromium.headless,
    });

    const page = await browser.newPage();

    // ปิด resource ที่ไม่จำเป็นเพื่อให้เร็วขึ้น
    await page.setRequestInterception(true);
    page.on('request', (req) => {
      const type = req.resourceType();
      if (['image', 'stylesheet', 'font', 'media'].includes(type)) {
        req.abort();
      } else {
        req.continue();
      }
    });

    await page.setUserAgent(
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    );

    // รอให้ JS render เสร็จ
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 20000 });

    // ดึง meta tags หลัง JS render แล้ว
    const meta = await page.evaluate(() => {
      const getMeta = (prop) =>
        document.querySelector(`meta[property="${prop}"]`)?.getAttribute('content') ||
        document.querySelector(`meta[name="${prop}"]`)?.getAttribute('content') ||
        '';

      // ดึงวันที่จากหลาย source
      const pubRaw =
        getMeta('article:published_time') ||
        getMeta('og:article:published_time') ||
        getMeta('datePublished') ||
        document.querySelector('[data-testid="publish-date"]')?.textContent ||
        '';

      let date = '', time = '';
      if (pubRaw) {
        const d = new Date(pubRaw);
        if (!isNaN(d)) {
          const months = ['','ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'];
          date = `${d.getDate()} ${months[d.getMonth() + 1]} ${d.getFullYear() + 543}`;
          time = `${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
        }
      }

      // ดึง JSON-LD เป็น fallback
      let ldDate = '';
      document.querySelectorAll('script[type="application/ld+json"]').forEach(s => {
        try {
          const json = JSON.parse(s.textContent);
          ldDate = ldDate || json.datePublished || json.uploadDate || '';
        } catch {}
      });

      if (!date && ldDate) {
        const d = new Date(ldDate);
        if (!isNaN(d)) {
          const months = ['','ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'];
          date = `${d.getDate()} ${months[d.getMonth() + 1]} ${d.getFullYear() + 543}`;
          time = `${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
        }
      }

      return {
        title:     getMeta('og:title') || document.title || '',
        thumbnail: getMeta('og:image') || '',
        date,
        time,
      };
    });

    return res.status(200).json({ ...meta, url, ok: true });

  } catch (err) {
    return res.status(200).json({
      url,
      title:     url,
      thumbnail: '',
      date:      '',
      time:      '',
      ok:        false,
      error:     err.message,
    });
  } finally {
    if (browser) await browser.close();
  }
};
