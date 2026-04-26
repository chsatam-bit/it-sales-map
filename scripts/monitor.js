// ═══════════════════════════════════════════════════════════
//  IT SALES MAP — AUTO MONITOR v3 (GPP API + Groq AI)
//  ดึงจาก GPP API โดยตรง ไม่ต้อง scrape
// ═══════════════════════════════════════════════════════════

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL  = process.env.SUPABASE_URL;
const SUPABASE_KEY  = process.env.SUPABASE_KEY;
const GROQ_KEY      = process.env.GROQ_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) { console.error('❌ Missing Supabase config'); process.exit(1); }
if (!GROQ_KEY) { console.error('❌ Missing GROQ_KEY'); process.exit(1); }

const sb = createClient(SUPABASE_URL, SUPABASE_KEY);

const PROVINCES = {
  "กรุงเทพมหานคร":[13.75,100.50],"กระบี่":[8.09,98.91],"กาญจนบุรี":[14.00,99.54],
  "กาฬสินธุ์":[16.43,103.51],"กำแพงเพชร":[16.47,99.52],"ขอนแก่น":[16.43,102.84],
  "จันทบุรี":[12.61,102.10],"ฉะเชิงเทรา":[13.69,101.08],"ชลบุรี":[13.36,100.99],
  "ชัยนาท":[15.18,100.13],"ชัยภูมิ":[15.81,102.03],"ชุมพร":[10.49,99.18],
  "เชียงราย":[19.91,99.84],"เชียงใหม่":[18.79,98.98],"ตรัง":[7.56,99.62],
  "ตราด":[12.24,102.51],"ตาก":[16.88,99.13],"นครนายก":[14.20,101.21],
  "นครปฐม":[13.82,100.04],"นครพนม":[17.39,104.78],"นครราชสีมา":[14.97,102.10],
  "นครศรีธรรมราช":[8.43,99.96],"นครสวรรค์":[15.70,100.14],"นนทบุรี":[13.86,100.51],
  "นราธิวาส":[6.43,101.82],"น่าน":[18.78,100.78],"บึงกาฬ":[18.36,103.65],
  "บุรีรัมย์":[14.99,103.11],"ปทุมธานี":[14.02,100.53],"ประจวบคีรีขันธ์":[11.81,99.80],
  "ปราจีนบุรี":[14.05,101.37],"ปัตตานี":[6.87,101.25],"พระนครศรีอยุธยา":[14.35,100.57],
  "พะเยา":[19.16,99.90],"พัทลุง":[7.62,100.07],"พิจิตร":[16.44,100.35],
  "พิษณุโลก":[16.83,100.26],"เพชรบุรี":[13.11,99.94],"เพชรบูรณ์":[16.42,101.16],
  "แพร่":[18.14,100.14],"ภูเก็ต":[7.89,98.40],"มหาสารคาม":[16.19,103.30],
  "มุกดาหาร":[16.54,104.72],"แม่ฮ่องสอน":[19.30,97.97],"ยโสธร":[15.79,104.15],
  "ยะลา":[6.54,101.28],"ร้อยเอ็ด":[16.05,103.65],"ระนอง":[9.96,98.63],
  "ระยอง":[12.68,101.27],"ราชบุรี":[13.54,99.82],"ลพบุรี":[14.80,100.65],
  "ลำปาง":[18.29,99.49],"ลำพูน":[18.57,99.01],"เลย":[17.49,101.72],
  "ศรีสะเกษ":[15.12,104.33],"สกลนคร":[17.15,104.14],"สงขลา":[7.19,100.59],
  "สตูล":[6.62,100.07],"สมุทรปราการ":[13.60,100.60],"สมุทรสงคราม":[13.41,100.00],
  "สมุทรสาคร":[13.55,100.27],"สระแก้ว":[13.82,102.06],"สระบุรี":[14.53,100.91],
  "สิงห์บุรี":[14.89,100.40],"สุโขทัย":[17.02,99.82],"สุพรรณบุรี":[14.47,100.12],
  "สุราษฎร์ธานี":[9.14,99.33],"สุรินทร์":[14.88,103.49],"หนองคาย":[17.88,102.74],
  "หนองบัวลำภู":[17.20,102.44],"อ่างทอง":[14.59,100.46],"อำนาจเจริญ":[15.86,104.63],
  "อุดรธานี":[17.41,102.79],"อุตรดิตถ์":[17.62,100.10],"อุทัยธานี":[15.38,100.02],
  "อุบลราชธานี":[15.24,104.85]
};

// IT Keywords สำหรับ filter
const IT_KEYWORDS = [
  'server','network','software','security','firewall','cloud','computer',
  'คอมพิวเตอร์','เครือข่าย','ระบบ','ซอฟต์แวร์','แม่ข่าย','สวิตช์',
  'router','switch','wifi','wireless','storage','backup','cctv','camera',
  'printer','scanner','ups','rack','notebook','laptop','tablet','it '
];

function isITRelated(text) {
  const lower = (text || '').toLowerCase();
  return IT_KEYWORDS.some(kw => lower.includes(kw.toLowerCase()));
}

// ── ดึงจาก GPP API โดยตรง ───────────────────────────────────
async function fetchGPP(keyword, page = 1) {
  const url = `https://process5.gprocurement.go.th/egp-agpc01-web/announcement?keywordSearch=${encodeURIComponent(keyword)}&page=${page}`;
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; ITSalesBot/1.0)',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'th,en;q=0.9',
      },
      signal: AbortSignal.timeout(20000),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const html = await res.text();
    return parseGPPHTML(html, keyword);
  } catch(e) {
    console.log(`  ⚠️  GPP fetch error: ${e.message}`);
    return [];
  }
}

function parseGPPHTML(html, keyword) {
  const items = [];
  // Extract table rows from GPP
  const rowRegex = /<tr[^>]*>[\s\S]*?<\/tr>/gi;
  const rows = html.match(rowRegex) || [];

  for (const row of rows) {
    const cells = row.match(/<td[^>]*>([\s\S]*?)<\/td>/gi) || [];
    if (cells.length < 4) continue;

    const getText = (cell) => cell.replace(/<[^>]+>/g, '').replace(/&nbsp;/g,' ').replace(/&amp;/g,'&').trim();

    const org    = getText(cells[0] || '');
    const title  = getText(cells[1] || '');
    const budget = getText(cells[2] || '');
    const status = getText(cells[3] || '');

    if (!org || !title || org.length < 3) continue;
    if (!isITRelated(title) && !isITRelated(org)) continue;

    // หา project number จาก link
    const projMatch = row.match(/projectId=([^"&\s]+)/);
    const projId = projMatch ? projMatch[1] : '';
    const sourceUrl = projId
      ? `https://process5.gprocurement.go.th/egp-agpc01-web/announcement/detail?projectId=${projId}`
      : `https://process5.gprocurement.go.th/egp-agpc01-web/announcement?keywordSearch=${encodeURIComponent(keyword)}`;

    // หา deadline จาก text
    const dateMatch = title.match(/(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/);
    const deadline = dateMatch ? dateMatch[1] : null;

    // แปลงงบประมาณ
    const budgetNum = parseFloat(budget.replace(/,/g, '')) || 0;
    const budgetM = budgetNum > 0 ? (budgetNum / 1000000).toFixed(2) : null;

    // หาจังหวัดจาก org name
    let province = 'กรุงเทพมหานคร';
    for (const prov of Object.keys(PROVINCES)) {
      if (org.includes(prov) || title.includes(prov)) { province = prov; break; }
    }

    items.push({ org, title, budgetM, status, province, sourceUrl, deadline, keyword });
  }
  return items;
}

// ── Groq AI วิเคราะห์ batch ──────────────────────────────────
async function analyzeWithGroq(items) {
  if (!items.length) return [];

  const prompt = `วิเคราะห์รายการจัดซื้อจัดจ้างภาครัฐด้านล่าง แล้วสกัดออกมาเป็น JSON array
ตอบเฉพาะ JSON array เท่านั้น ไม่มีข้อความอื่น:
[{
  "company": "ชื่อหน่วยงาน",
  "province": "จังหวัด",
  "district": "อำเภอหรือ null",
  "orgtype": "government|hospital|education|private|other",
  "status": "tor|warm|cold",
  "needs": ["server","software","network","security","cloud","backup","cctv","other"],
  "needs_detail": "รายละเอียด",
  "tor": "yes|soon|no",
  "budget": ตัวเลขล้านบาท,
  "deadline": "วันที่หรือ null",
  "source_url": "URL",
  "confidence": 0-100,
  "summary": "สรุป 1 ประโยค"
}]

รายการ:
${items.map((it,i) => `${i+1}. หน่วยงาน: ${it.org}
   โครงการ: ${it.title}
   งบ: ${it.budgetM ? it.budgetM+'M฿' : 'ไม่ระบุ'}
   สถานะ: ${it.status}
   URL: ${it.sourceUrl}
   จังหวัด (เบื้องต้น): ${it.province}`).join('\n\n')}`;

  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${GROQ_KEY}` },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        max_tokens: 3000,
        temperature: 0.1,
        messages: [
          { role: 'system', content: 'ตอบเฉพาะ JSON array เท่านั้น ไม่มี markdown ไม่มีข้อความอื่น' },
          { role: 'user', content: prompt }
        ]
      }),
      signal: AbortSignal.timeout(45000),
    });
    if (!res.ok) throw new Error(`Groq ${res.status}: ${await res.text()}`);
    const data = await res.json();
    const text = data.choices?.[0]?.message?.content || '[]';
    const clean = text.replace(/```json|```/g, '').replace(/^[^\[]*/, '').replace(/[^\]]*$/, '').trim();
    return JSON.parse(clean);
  } catch(e) {
    console.log(`  ⚠️  Groq error: ${e.message}`);
    return [];
  }
}

async function isDuplicate(company, province) {
  const cutoff = new Date(Date.now() - 30*24*60*60*1000).toISOString();
  const { data } = await sb.from('leads').select('id')
    .eq('company', company).eq('province', province)
    .gte('created_at', cutoff).limit(1);
  return data && data.length > 0;
}

async function insertLead(lead, threshold) {
  const coords = PROVINCES[lead.province] || [13.0, 101.0];
  const j = () => (Math.random()-0.5)*0.3;
  await sb.from('leads').insert({
    company: lead.company, province: lead.province,
    district: lead.district || null, orgtype: lead.orgtype || 'government',
    status: lead.status || 'cold', needs: lead.needs || [],
    needs_detail: lead.needs_detail || null,
    tor: lead.tor || 'no', budget: lead.budget || null,
    deadline: lead.deadline || null,
    source_url: lead.source_url || null,
    source: 'ai_auto', source_label: 'GPP e-GP',
    confidence: lead.confidence || 0,
    lat: coords[0]+j(), lng: coords[1]+j(),
    approved: (lead.confidence||0) >= threshold,
  });
}

// ── Main ─────────────────────────────────────────────────────
async function main() {
  const start = Date.now();
  console.log(`\n🚀 IT Sales Auto Monitor v3 — ${new Date().toISOString()}`);
  console.log(`🤖 AI: Groq (llama-3.3-70b-versatile)`);
  console.log('='.repeat(55));

  const { data: rows } = await sb.from('settings').select('*');
  const settings = Object.fromEntries((rows||[]).map(r=>[r.key,r.value]));
  const threshold = parseInt(settings.auto_approve_threshold || '80');

  // Keywords ที่จะ scan บน GPP
  const SEARCH_KEYWORDS = [
    'IT', 'server', 'network', 'software', 'security',
    'คอมพิวเตอร์', 'ระบบสารสนเทศ', 'firewall', 'cloud', 'CCTV'
  ];

  let allItems = [];
  let totalNew = 0;

  // ดึงข้อมูลจาก GPP ทีละ keyword
  for (const kw of SEARCH_KEYWORDS) {
    console.log(`\n🔍 GPP keyword: "${kw}"`);
    const items = await fetchGPP(kw, 1);
    console.log(`   พบ: ${items.length} รายการ IT`);
    allItems = allItems.concat(items);
    await new Promise(r => setTimeout(r, 1500)); // rate limit
  }

  // dedupe by title
  const seen = new Set();
  const unique = allItems.filter(it => {
    if (seen.has(it.title)) return false;
    seen.add(it.title); return true;
  });
  console.log(`\n📊 รวม unique IT projects: ${unique.length}`);

  // วิเคราะห์ด้วย Groq ทีละ batch 10 รายการ
  const BATCH = 10;
  for (let i = 0; i < unique.length; i += BATCH) {
    const batch = unique.slice(i, i+BATCH);
    console.log(`\n🤖 Groq analyzing batch ${Math.floor(i/BATCH)+1}/${Math.ceil(unique.length/BATCH)} (${batch.length} items)...`);

    const analyzed = await analyzeWithGroq(batch);

    for (const lead of analyzed) {
      if (!lead.company || !lead.province) continue;
      if (await isDuplicate(lead.company, lead.province)) {
        console.log(`   ♻️  Dup: ${lead.company}`);
        continue;
      }
      await insertLead(lead, threshold);
      const ok = (lead.confidence||0) >= threshold;
      console.log(`   ✅ +${lead.company} (${lead.province}) ${lead.confidence}% ${ok?'→ approved':'→ review'}`);
      totalNew++;
    }

    if (i + BATCH < unique.length) await new Promise(r => setTimeout(r, 3000));
  }

  // Log to DB
  await sb.from('monitor_logs').insert({
    source_name: 'GPP e-GP API',
    leads_found: unique.length,
    leads_new: totalNew,
    status: 'success',
    duration_ms: Date.now()-start,
  });

  console.log('\n' + '='.repeat(55));
  console.log(`✅ Done in ${((Date.now()-start)/1000).toFixed(1)}s`);
  console.log(`📊 IT projects found: ${unique.length} | New leads: ${totalNew}`);
  console.log(`⏰ Next: tomorrow 07:00 น. ไทย\n`);
}

main().catch(e => { console.error('❌ Fatal:', e); process.exit(1); });
