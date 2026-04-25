// ═══════════════════════════════════════════════════════════
//  IT SALES MAP — AUTO MONITOR (v2 · Groq + Claude fallback)
//  ไฟล์: scripts/monitor.js
//
//  GitHub Secrets ที่ต้องมี:
//    SUPABASE_URL    — https://xxxx.supabase.co
//    SUPABASE_KEY    — anon key
//    GROQ_KEY        — sk-... จาก console.groq.com (ฟรี)
//    ANTHROPIC_KEY   — sk-ant-... (optional, fallback เท่านั้น)
// ═══════════════════════════════════════════════════════════

const { createClient } = require('@supabase/supabase-js');

// ── Config ───────────────────────────────────────────────────
const SUPABASE_URL  = process.env.SUPABASE_URL;
const SUPABASE_KEY  = process.env.SUPABASE_KEY;
const GROQ_KEY      = process.env.GROQ_KEY;
const ANTHROPIC_KEY = process.env.ANTHROPIC_KEY; // optional fallback

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_KEY');
  process.exit(1);
}
if (!GROQ_KEY && !ANTHROPIC_KEY) {
  console.error('❌ Need at least GROQ_KEY or ANTHROPIC_KEY');
  process.exit(1);
}

const sb = createClient(SUPABASE_URL, SUPABASE_KEY);

// ── Province Coordinates ─────────────────────────────────────
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

// ── AI Prompt (ใช้ร่วมกันทั้ง Groq และ Claude) ───────────────
const AI_PROMPT = (content, sourceUrl) =>
`คุณคือ AI ผู้ช่วยทีม Sales IT ประเทศไทย
วิเคราะห์เนื้อหาด้านล่าง แล้วสกัดข้อมูลความต้องการ IT ออกมา
ตอบเฉพาะ JSON array เท่านั้น ห้ามมีข้อความอื่น:

[{
  "company": "ชื่อบริษัท/หน่วยงาน",
  "province": "จังหวัดในประเทศไทย (ภาษาไทย)",
  "district": "อำเภอ/เขต หรือ null",
  "orgtype": "private|government|hospital|education|other",
  "status": "tor|warm|cold",
  "needs": ["server","software","network","security","cloud","backup","cctv","other"],
  "needs_detail": "รายละเอียดความต้องการ IT",
  "tor": "yes|soon|no",
  "tor_detail": "รายละเอียด TOR/ประกวดราคา หรือ null",
  "budget": ตัวเลขล้านบาทหรือ null,
  "deadline": "วันที่ deadline หรือ null",
  "contact_name": "ชื่อผู้ติดต่อ หรือ null",
  "contact_tel": "เบอร์โทร หรือ null",
  "confidence": 0-100,
  "summary": "สรุป 1 ประโยคว่าทำไมน่าสนใจ"
}]

กฎ: ถ้าไม่พบ IT requirement ให้ตอบ [] เท่านั้น
status=tor: มีประกวดราคา/e-bidding/TOR ชัดเจน
budget: แปลงบาทเป็นล้าน (2,500,000 = 2.5)
max 5 รายการ ห้าม hallucinate

URL: ${sourceUrl}
เนื้อหา:
${content}`;

// ── AI Provider: Groq (ฟรี) ──────────────────────────────────
async function callGroq(content, sourceUrl) {
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${GROQ_KEY}`,
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile', // ดีสุดใน free tier
      max_tokens: 1500,
      temperature: 0.1, // ต่ำ = stable output สำหรับ JSON
      messages: [
        {
          role: 'system',
          content: 'คุณตอบเฉพาะ JSON array เท่านั้น ไม่มีข้อความอื่น ไม่มี markdown'
        },
        {
          role: 'user',
          content: AI_PROMPT(content, sourceUrl)
        }
      ],
    }),
    signal: AbortSignal.timeout(30000),
  });

  if (res.status === 429) throw new Error('GROQ_RATE_LIMIT');
  if (!res.ok) throw new Error(`Groq ${res.status}`);

  const data = await res.json();
  return data.choices?.[0]?.message?.content || '[]';
}

// ── AI Provider: Claude Haiku (fallback) ─────────────────────
async function callClaude(content, sourceUrl) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1500,
      messages: [{ role: 'user', content: AI_PROMPT(content, sourceUrl) }],
    }),
    signal: AbortSignal.timeout(30000),
  });

  if (!res.ok) throw new Error(`Claude ${res.status}`);
  const data = await res.json();
  return data.content?.[0]?.text || '[]';
}

// ── AI Parse พร้อม fallback อัตโนมัติ ───────────────────────
async function parseWithAI(content, sourceUrl) {
  let rawText = '[]';
  let provider = 'none';

  // 1. ลอง Groq ก่อน (ฟรี)
  if (GROQ_KEY) {
    try {
      rawText = await callGroq(content, sourceUrl);
      provider = 'Groq';
    } catch (e) {
      if (e.message === 'GROQ_RATE_LIMIT') {
        console.log('  ⚠️  Groq rate limit — fallback to Claude');
      } else {
        console.log(`  ⚠️  Groq error: ${e.message} — fallback to Claude`);
      }
      rawText = null;
    }
  }

  // 2. fallback Claude ถ้า Groq ล้มเหลว
  if (!rawText && ANTHROPIC_KEY) {
    try {
      rawText = await callClaude(content, sourceUrl);
      provider = 'Claude';
    } catch (e) {
      console.log(`  ❌ Claude error: ${e.message}`);
      return [];
    }
  }

  if (!rawText) return [];

  // Parse JSON
  try {
    const clean = rawText
      .replace(/```json|```/g, '')
      .replace(/^[^[\{]*/, '') // ตัด text ก่อน [ หรือ {
      .replace(/[^}\]]*$/, '') // ตัด text หลัง ] หรือ }
      .trim();
    const parsed = JSON.parse(clean);
    const arr = Array.isArray(parsed) ? parsed : [];
    if (arr.length > 0) console.log(`  🤖 [${provider}] parsed ${arr.length} lead(s)`);
    return arr;
  } catch (e) {
    console.log(`  ⚠️  JSON parse failed: ${e.message}`);
    console.log(`  Raw: ${rawText.slice(0, 200)}`);
    return [];
  }
}

// ── Fetch Page ───────────────────────────────────────────────
async function fetchPage(url) {
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
    return html
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<').replace(/&gt;/g, '>')
      .replace(/\s+/g, ' ').trim()
      .slice(0, 4000);
  } catch (e) {
    console.log(`  ⚠️  Fetch failed: ${e.message}`);
    return null;
  }
}

// ── Dedup ────────────────────────────────────────────────────
async function isDuplicate(company, province) {
  const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const { data } = await sb.from('leads')
    .select('id').eq('company', company).eq('province', province)
    .gte('created_at', cutoff).limit(1);
  return data && data.length > 0;
}

// ── Insert Lead ──────────────────────────────────────────────
async function insertLead(item, source, threshold) {
  const coords = PROVINCES[item.province] || [13.0, 101.0];
  const j = () => (Math.random() - 0.5) * 0.3;
  const { error } = await sb.from('leads').insert({
    company: item.company, province: item.province,
    district: item.district || null, orgtype: item.orgtype || 'other',
    status: item.status || 'cold', needs: item.needs || [],
    needs_detail: item.needs_detail || null,
    tor: item.tor || 'no', tor_detail: item.tor_detail || null,
    budget: item.budget || null, deadline: item.deadline || null,
    contact_name: item.contact_name || null, contact_tel: item.contact_tel || null,
    source_url: source.url, source: 'ai_auto', source_label: source.name,
    confidence: item.confidence || 0,
    lat: coords[0] + j(), lng: coords[1] + j(),
    approved: (item.confidence || 0) >= threshold,
  });
  if (error) throw error;
}

// ── Main ─────────────────────────────────────────────────────
async function main() {
  const startTime = Date.now();
  const aiMode = GROQ_KEY
    ? (ANTHROPIC_KEY ? 'Groq (primary) + Claude (fallback)' : 'Groq only')
    : 'Claude only';

  console.log(`\n🚀 IT Sales Auto Monitor — ${new Date().toISOString()}`);
  console.log(`🤖 AI: ${aiMode}`);
  console.log('='.repeat(55));

  // Settings
  const { data: rows } = await sb.from('settings').select('*');
  const s = Object.fromEntries((rows || []).map(r => [r.key, r.value]));
  const threshold = parseInt(s.auto_approve_threshold || '80');
  console.log(`⚙️  Auto-approve: confidence ≥ ${threshold}%`);

  // Sources
  const { data: sources } = await sb.from('monitor_sources').select('*').eq('active', true);
  if (!sources?.length) { console.log('⚠️  No active sources'); return; }
  console.log(`📡 Scanning ${sources.length} source(s)`);

  let totalNew = 0, totalChecked = 0;

  for (const source of sources) {
    console.log(`\n📌 ${source.name}`);
    const log = { source_id: source.id, source_name: source.name, leads_found: 0, leads_new: 0 };

    try {
      const content = await fetchPage(source.url);
      if (!content || content.length < 80) {
        log.status = 'no_content'; console.log('   ⏭  No content');
        await sb.from('monitor_logs').insert({ ...log, duration_ms: Date.now()-startTime });
        continue;
      }

      // Keyword filter
      const kws = source.keywords || [];
      if (kws.length && !kws.some(k => content.toLowerCase().includes(k.toLowerCase()))) {
        log.status = 'no_keyword_match'; console.log(`   ⏭  No keyword match`);
        await sb.from('monitor_logs').insert({ ...log, duration_ms: Date.now()-startTime });
        await new Promise(r => setTimeout(r, 1000));
        continue;
      }

      // AI Parse
      const leads = await parseWithAI(content, source.url);
      log.leads_found = leads.length;
      totalChecked += leads.length;

      // Dedup + Insert
      let newCount = 0;
      for (const lead of leads) {
        if (!lead.company || !lead.province) continue;
        if (await isDuplicate(lead.company, lead.province)) {
          console.log(`   ♻️  Dup: ${lead.company}`);
          continue;
        }
        await insertLead(lead, source, threshold);
        const ok = (lead.confidence || 0) >= threshold;
        console.log(`   ✅ +${lead.company} (${lead.province}) ${lead.confidence}% ${ok ? '→ approved' : '→ pending'}`);
        newCount++; totalNew++;
      }

      log.leads_new = newCount; log.status = 'success';
      await sb.from('monitor_sources').update({
        last_checked: new Date().toISOString(), last_found: leads.length
      }).eq('id', source.id);

    } catch (err) {
      console.log(`   ❌ ${err.message}`);
      log.status = 'error'; log.error_msg = err.message;
    }

    await sb.from('monitor_logs').insert({ ...log, duration_ms: Date.now()-startTime });
    await new Promise(r => setTimeout(r, 3000)); // rate limit gap
  }

  console.log('\n' + '='.repeat(55));
  console.log(`✅ Done in ${((Date.now()-startTime)/1000).toFixed(1)}s`);
  console.log(`📊 Potential: ${totalChecked} | New: ${totalNew}`);
  console.log(`⏰ Next: tomorrow 07:00 น. ไทย\n`);
}

main().catch(e => { console.error('❌ Fatal:', e); process.exit(1); });