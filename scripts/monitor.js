const { createClient } = require('@supabase/supabase-js');
const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
const GROQ_KEY = process.env.GROQ_KEY;

const PROVINCES = {
  "กรุงเทพมหานคร":[13.75,100.50],"กระบี่":[8.09,98.91],"กาญจนบุรี":[14.00,99.54],"กาฬสินธุ์":[16.43,103.51],"กำแพงเพชร":[16.47,99.52],"ขอนแก่น":[16.43,102.84],"จันทบุรี":[12.61,102.10],"ฉะเชิงเทรา":[13.69,101.08],"ชลบุรี":[13.36,100.99],"ชัยนาท":[15.18,100.13],"ชัยภูมิ":[15.81,102.03],"ชุมพร":[10.49,99.18],"เชียงราย":[19.91,99.84],"เชียงใหม่":[18.79,98.98],"ตรัง":[7.56,99.62],"ตราด":[12.24,102.51],"ตาก":[16.88,99.13],"นครนายก":[14.20,101.21],"นครปฐม":[13.82,100.04],"นครพนม":[17.39,104.78],"นครราชสีมา":[14.97,102.10],"นครศรีธรรมราช":[8.43,99.96],"นครสวรรค์":[15.70,100.14],"นนทบุรี":[13.86,100.51],"นราธิวาส":[6.43,101.82],"น่าน":[18.78,100.78],"บึงกาฬ":[18.36,103.65],"บุรีรัมย์":[14.99,103.11],"ปทุมธานี":[14.02,100.53],"ประจวบคีรีขันธ์":[11.81,99.80],"ปราจีนบุรี":[14.05,101.37],"ปัตตานี":[6.87,101.25],"พระนครศรีอยุธยา":[14.35,100.57],"พะเยา":[19.16,99.90],"พัทลุง":[7.62,100.07],"พิจิตร":[16.44,100.35],"พิษณุโลก":[16.83,100.26],"เพชรบุรี":[13.11,99.94],"เพชรบูรณ์":[16.42,101.16],"แพร่":[18.14,100.14],"ภูเก็ต":[7.89,98.40],"มหาสารคาม":[16.19,103.30],"มุกดาหาร":[16.54,104.72],"แม่ฮ่องสอน":[19.30,97.97],"ยโสธร":[15.79,104.15],"ยะลา":[6.54,101.28],"ร้อยเอ็ด":[16.05,103.65],"ระนอง":[9.96,98.63],"ระยอง":[12.68,101.27],"ราชบุรี":[13.54,99.82],"ลพบุรี":[14.80,100.65],"ลำปาง":[18.29,99.49],"ลำพูน":[18.57,99.01],"เลย":[17.49,101.72],"ศรีสะเกษ":[15.12,104.33],"สกลนคร":[17.15,104.14],"สงขลา":[7.19,100.59],"สตูล":[6.62,100.07],"สมุทรปราการ":[13.60,100.60],"สมุทรสงคราม":[13.41,100.00],"สมุทรสาคร":[13.55,100.27],"สระแก้ว":[13.82,102.06],"สระบุรี":[14.53,100.91],"สิงห์บุรี":[14.89,100.40],"สุโขทัย":[17.02,99.82],"สุพรรณบุรี":[14.47,100.12],"สุราษฎร์ธานี":[9.14,99.33],"สุรินทร์":[14.88,103.49],"หนองคาย":[17.88,102.74],"หนองบัวลำภู":[17.20,102.44],"อ่างทอง":[14.59,100.46],"อำนาจเจริญ":[15.86,104.63],"อุดรธานี":[17.41,102.79],"อุตรดิตถ์":[17.62,100.10],"อุทัยธานี":[15.38,100.02],"อุบลราชธานี":[15.24,104.85]
};

// Search queries สำหรับหา IT procurement ในไทย
const SEARCH_QUERIES = [
  'ประกวดราคา จัดซื้อ server network IT ราชการไทย 2568 site:go.th',
  'ประกาศจัดซื้อ คอมพิวเตอร์ software security ภาครัฐ 2568',
  'TOR จัดซื้อ IT ระบบสารสนเทศ ราชการ ประกวดราคา 2568',
  'e-bidding firewall cloud server network hospital school 2568 thailand',
  'ประกาศจัดจ้าง CCTV wifi network อุปกรณ์ IT เทศบาล จังหวัด 2568',
];

async function searchWithGroqCompound(query) {
  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_KEY}`,
      },
      body: JSON.stringify({
        model: 'groq/compound',  // ← model นี้มี web search built-in!
        max_completion_tokens: 3000,
        messages: [{
          role: 'user',
          content: `ค้นหาข้อมูลนี้บนอินเทอร์เน็ต: "${query}"
          
จากผลการค้นหา สกัดข้อมูลโครงการจัดซื้อจัดจ้าง IT ออกมาเป็น JSON array เท่านั้น:
[{
  "company": "ชื่อหน่วยงาน",
  "province": "จังหวัดในประเทศไทย",
  "district": null,
  "orgtype": "government|hospital|education|private|other",
  "status": "tor|warm|cold",
  "needs": ["server","software","network","security","cloud","backup","cctv","other"],
  "needs_detail": "รายละเอียดความต้องการ",
  "tor": "yes|soon|no",
  "budget": ตัวเลขล้านบาทหรือnull,
  "deadline": "วันที่หรือnull",
  "source_url": "URL ของประกาศ",
  "confidence": 0-100,
  "summary": "สรุป 1 ประโยค"
}]

ถ้าไม่พบข้อมูล IT procurement จริงๆ ให้ตอบ [] เท่านั้น
ห้าม hallucinate ข้อมูลที่ไม่มีในผลการค้นหา`
        }]
      }),
      signal: AbortSignal.timeout(60000), // compound ใช้เวลามากกว่า
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Groq compound ${res.status}: ${err.slice(0,200)}`);
    }

    const data = await res.json();
    const text = data.choices?.[0]?.message?.content || '[]';

    // Log tools ที่ถูกใช้
    const tools = data.choices?.[0]?.message?.executed_tools;
    if (tools?.length) {
      console.log(`   🔍 Web search: ${tools.length} tool call(s)`);
    }

    const clean = text.replace(/```json|```/g, '').replace(/^[^\[]*/,'').replace(/[^\]]*$/,'').trim();
    return JSON.parse(clean);
  } catch(e) {
    console.log(`  ⚠️  Groq compound error: ${e.message}`);
    return [];
  }
}

async function isDup(company, province) {
  const cutoff = new Date(Date.now() - 30*864e5).toISOString();
  const { data } = await sb.from('leads').select('id')
    .eq('company', company).eq('province', province)
    .gte('created_at', cutoff).limit(1);
  return data && data.length > 0;
}

async function main() {
  const start = Date.now();
  console.log(`\n🚀 IT Sales Auto Monitor v5 — Groq Compound Web Search`);
  console.log(`🌐 Model: groq/compound (web search built-in, ฟรี!)`);
  console.log('='.repeat(55));

  const { data: rows } = await sb.from('settings').select('*');
  const settings = Object.fromEntries((rows||[]).map(r=>[r.key,r.value]));
  const threshold = parseInt(settings.auto_approve_threshold || '80');

  let totalNew = 0;

  for (const query of SEARCH_QUERIES) {
    console.log(`\n🔍 Query: "${query.slice(0,50)}..."`);

    const leads = await searchWithGroqCompound(query);
    console.log(`   📊 พบ: ${leads.length} lead(s)`);

    for (const lead of leads) {
      if (!lead.company || !lead.province) continue;
      if (await isDup(lead.company, lead.province)) {
        console.log(`   ♻️  dup: ${lead.company}`);
        continue;
      }

      const coords = PROVINCES[lead.province] || [13, 101];
      const j = () => (Math.random() - 0.5) * 0.3;

      await sb.from('leads').insert({
        company: lead.company,
        province: lead.province,
        district: lead.district || null,
        orgtype: lead.orgtype || 'government',
        status: lead.status || 'cold',
        needs: lead.needs || [],
        needs_detail: lead.needs_detail || null,
        tor: lead.tor || 'no',
        budget: lead.budget || null,
        deadline: lead.deadline || null,
        source_url: lead.source_url || null,
        source: 'ai_auto',
        source_label: 'Groq Web Search',
        confidence: lead.confidence || 0,
        lat: coords[0] + j(),
        lng: coords[1] + j(),
        approved: (lead.confidence || 0) >= threshold,
      });

      const ok = (lead.confidence || 0) >= threshold;
      console.log(`   ✅ +${lead.company} (${lead.province}) ${lead.confidence}% ${ok ? '→ approved' : '→ review'}`);
      totalNew++;
    }

    // rate limit: รอ 5 วินาทีระหว่าง query
    if (SEARCH_QUERIES.indexOf(query) < SEARCH_QUERIES.length - 1) {
      await new Promise(r => setTimeout(r, 5000));
    }
  }

  await sb.from('monitor_logs').insert({
    source_name: 'Groq Compound Web Search',
    leads_found: totalNew,
    leads_new: totalNew,
    status: 'success',
    duration_ms: Date.now() - start,
  });

  console.log(`\n${'='.repeat(55)}`);
  console.log(`✅ Done in ${((Date.now()-start)/1000).toFixed(1)}s`);
  console.log(`🆕 New leads: ${totalNew}`);
  console.log(`⏰ Next: tomorrow 07:00 น. ไทย\n`);
}

main().catch(e => { console.error('❌ Fatal:', e); process.exit(1); });
