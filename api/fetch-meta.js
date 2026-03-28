const puppeteer = require('puppeteer-core');
const chromium  = require('@sparticuz/chromium');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { url } = req.query;
  if (!url) return res.status(400).json({ error: 'Missing url' });

  try { new URL(url); } catch {
    return res.status(400).json({ error: 'Invalid URL' });
  }

  let browser;
  try {
    const executablePath = await chromium.executablePath();

    browser = await puppeteer.launch({
      args: [
        ...chromium.args,
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--single-process',
        '--no-zygote',
      ],
      defaultViewport: chromium.defaultViewport,
      executablePath: executablePath,
      headless: 'new',
      ignoreHTTPSErrors: true,
    });

    const page = await browser.newPage();

    await page.setRequestInterception(true);
    page.on('request', (r) => {
      if (['image', 'stylesheet', 'font', 'media'].includes(r.resourceType())) {
        r.abort();
      } else {
        r.continue();
      }
    });

    await page.setUserAgent(
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    );

    await page.goto(url, { waitUntil: 'networkidle2', timeout: 20000 });

    const meta = await page.evaluate(() => {
      const get = (prop) =>
        document.querySelector(`meta[property="${prop}"]`)?.getAttribute('content') ||
        document.querySelector(`meta[name="${prop}"]`)?.getAttribute('content') || '';

      const pubRaw = get('article:published_time') ||
        get('og:article:published_time') ||
        (() => {
          let d = '';
          document.querySelectorAll('script[type="application/ld+json"]').forEach(s => {
            try { const j = JSON.parse(s.textContent); d = d || j.datePublished || ''; } catch {}
          });
          return d;
        })();

      let date = '', time = '';
      if (pubRaw) {
        const d = new Date(pubRaw);
        if (!isNaN(d)) {
          const m = ['','ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'];
          date = `${d.getDate()} ${m[d.getMonth()+1]} ${d.getFullYear()+543}`;
          time = `${d.getHours()}:${String(d.getMinutes()).padStart(2,'0')}`;
        }
      }

      return {
        title:     get('og:title') || document.title || '',
        thumbnail: get('og:image') || '',
        date,
        time,
      };
    });

    return res.status(200).json({ ...meta, url, ok: true });

  } catch (err) {
    return res.status(200).json({
      url, title: url, thumbnail: '', date: '', time: '',
      ok: false, error: err.message,
    });
  } finally {
    if (browser) await browser.close();
  }
};
