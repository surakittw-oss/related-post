const { chromium } = require('playwright-core');
const chromiumMin  = require('@sparticuz/chromium-min');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { url } = req.query;
  if (!url) return res.status(400).json({ error: 'Missing url' });

  try { new URL(url); } catch(e) {
    return res.status(400).json({ error: 'Invalid URL' });
  }

  let browser;
  try {
    const executablePath = await chromiumMin.executablePath(
      'https://github.com/Sparticuz/chromium/releases/download/v119.0.2/chromium-v119.0.2-pack.tar'
    );

    browser = await chromium.launch({
      args:           chromiumMin.args,
      executablePath: executablePath,
      headless:       true,
    });

    const page = await browser.newPage();

    await page.route('**/*', route => {
      const type = route.request().resourceType();
      if (['image','stylesheet','font','media'].includes(type)) route.abort();
      else route.continue();
    });

    await page.setExtraHTTPHeaders({
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/119.0.0.0 Safari/537.36'
    });

    await page.goto(url, { waitUntil: 'networkidle', timeout: 20000 });

    const meta = await page.evaluate(() => {
      const get = (prop) =>
        document.querySelector('meta[property="' + prop + '"]')?.getAttribute('content') ||
        document.querySelector('meta[name="' + prop + '"]')?.getAttribute('content') || '';

      let pubRaw = get('article:published_time') || get('og:article:published_time') || '';
      if (!pubRaw) {
        document.querySelectorAll('script[type="application/ld+json"]').forEach(s => {
          try { const j = JSON.parse(s.textContent); pubRaw = pubRaw || j.datePublished || ''; } catch(e) {}
        });
      }

      let date = '', time = '';
      if (pubRaw) {
        const d = new Date(pubRaw);
        if (!isNaN(d)) {
          const m = ['','ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'];
          date = d.getDate() + ' ' + m[d.getMonth()+1] + ' ' + (d.getFullYear()+543);
          time = d.getHours() + ':' + String(d.getMinutes()).padStart(2,'0');
        }
      }

      return {
        title:     get('og:title') || document.title || '',
        thumbnail: get('og:image') || '',
        date:      date,
        time:      time,
      };
    });

    return res.status(200).json(Object.assign({}, meta, { url: url, ok: true }));

  } catch(err) {
    return res.status(200).json({ url: url, title: url, thumbnail: '', date: '', time: '', ok: false, error: err.message });
  } finally {
    if (browser) await browser.close();
  }
};
