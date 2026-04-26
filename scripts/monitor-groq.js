const { createClient } = require('@supabase/supabase-js');
const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
const GROQ_KEY = process.env.GROQ_KEY;
const GOV_KEY  = process.env.GOVSPENDING_KEY;

const PROVINCES = {
  "กรุงเทพมหานคร":[13.75,100.50],"กระบี่":[8.09,98.91],"กาญจนบุรี":[14.00,99.54],"กาฬสินธุ์":[16.43,103.51],"กำแพงเพชร":[16.47,99.52],"ขอนแก่น":[16.43,102.84],"จันทบุรี":[12.61,102.10],"ฉะเชิงเทรา":[13.69,101.08],"ชลบุรี":[13.36,100.99],"ชัยนาท":[15.18,100.13],"ชัยภูมิ":[15.81,102.03],"ชุมพร":[10.49,99.18],"เชียงราย":[19.91,99.84],"เชียงใหม่":[18.79,98.98],"ตรัง":[7.56,99.62],"ตราด":[12.24,102.51],"ตาก":[16.88,99.13],"นครนายก":[14.20,101.21],"นครปฐม":[13.82,100.04],"นครพนม":[17.39,104.78],"นครราชสีมา":[14.97,102.10],"นครศรีธรรมราช":[8.43,99.96],"นครสวรรค์":[15.70,100.14],"นนทบุรี":[13.86,100.51],"นราธิวาส":[6.43,101.82],"น่าน":[18.78,100.78],"บึงกาฬ":[18.36,103.65],"บุรีรัมย์":[14.99,103.11],"ปทุมธานี":[14.02,100.53],"ประจวบคีรีขันธ์":[11.81,99.80],"ปราจีนบุรี":[14.05,101.37],"ปัตตานี":[6.87,101.25],"พระนครศรีอยุธยา":[14.35,100.57],"พะเยา":[19.16,99.90],"พัทลุง":[7.62,100.07],"พิจิตร":[16.44,100.35],"พิษณุโลก":[16.83,100.26],"เพชรบุรี":[13.11,99.94],"เพชรบูรณ์":[16.42,101.16],"แพร่":[18.14,100.14],"ภูเก็ต":[7.89,98.40],"มหาสารคาม":[16.19,103.30],"มุกดาหาร":[16.54,104.72],"แม่ฮ่องสอน":[19.30,97.97],"ยโสธร":[15.79,104.15],"ยะลา":[6.54,101.28],"ร้อยเอ็ด":[16.05,103.65],"ระนอง":[9.96,98.63],"ระยอง":[12.68,101.27],"ราชบุรี":[13.54,99.82],"ลพบุรี":[14.80,100.65],"ลำปาง":[18.29,99.49],"ลำพูน":[18.57,99.01],"เลย":[17.49,101.72],"ศรีสะเกษ":[15.12,104.33],"สกลนคร":[17.15,104.14],"สงขลา":[7.19,100.59],"สตูล":[6.62,100.07],"สมุทรปราการ":[13.60,100.60],"สมุทรสงคราม":[13.41,100.00],"สมุทรสาคร":[13.55,100.27],"สระแก้ว":[13.82,102.06],"สระบุรี":[14.53,100.91],"สิงห์บุรี":[14.89,100.40],"สุโขทัย":[17.02,99.82],"สุพรรณบุรี":[14.47,100.12],"สุราษฎร์ธานี":[9.14,99.33],"สุรินทร์":[14.88,103.49],"หนองคาย":[17.88,102.74],"หนองบัวลำภู":[17.20,102.44],"อ่างทอง":[14.59,100.46],"อำนาจเจริญ":[15.86,104.63],"อุดรธานี":[17.41,102.79],"อุตรดิตถ์":[17.62,100.10],"อุทัยธานี":[15.38,100.02],"อุบลราชธานี":[15.24,104.85]
};

const IT_KEYWORDS = ['server','network','software','security','firewall','cloud','computer','คอมพิวเตอร์','เครือข่าย','ระบบสารสนเทศ','ซอฟต์แวร์','แม่ข่าย','สวิตช์','router','switch','wifi','wireless','storage','backup','cctv','notebook','laptop','ups','rack','ไอที','it ','digital','ดิจิทัล','สาย fiber','อุปกรณ์เครือข่าย'];

function isIT(text){ return IT_KEYWORDS.some(k=>(text||'').toLowerCase().includes(k.toLowerCase())); }

function findProvince(text) {
  for(const p of Object.keys(PROVINCES)){ if((text||'').includes(p)) return p; }
  return 'กรุงเทพมหานคร';
}

// ── ดึงข้อมูลจาก data.go.th API (CGDContract) ───────────────
async function fetchCGDContract(keyword, year=2568, limit=20, offset=0) {
  const url = `https://opend.data.go.th/govspending/cgdcontract?api-key=${GOV_KEY}&year=${year}&keyword=${encodeURIComponent(keyword)}&limit=${limit}&offset=${offset}`;
  try {
    const res = await fetch(url, {
      headers:{'User-Agent':'ITSalesBot/1.0'},
      signal: AbortSignal.timeout(20000)
    });
    if(!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if(!data.result) return [];
    return data.result.filter(item => isIT(`${item.project_name} ${item.dept_name}`));
  } catch(e) {
    console.log(`  ⚠️  CGD API error: ${e.message}`);
    return [];
  }
}

// ── Groq AI วิเคราะห์ ────────────────────────────────────────
async function analyzeGroq(items) {
  if(!items.length) return [];
  const prompt = `วิเคราะห์โครงการจัดซื้อจัดจ้างภาครัฐด้านล่าง สกัดออกเป็น JSON array เท่านั้น:
[{"company":"ชื่อหน่วยงาน","province":"จังหวัดไทย","district":null,"orgtype":"government|hospital|education|other","status":"tor|warm|cold","needs":["server","software","network","security","cloud","backup","cctv","other"],"needs_detail":"รายละเอียด","tor":"yes|soon|no","budget":ล้านบาทหรือnull,"deadline":"วันที่หรือnull","source_url":"url","confidence":0-100,"summary":"สรุป 1 ประโยค"}]

${items.map((it,i)=>`${i+1}. หน่วยงาน: ${it.dept_name}
   โครงการ: ${it.project_name}
   วงเงิน: ${it.price_build||it.price_agree||0} บาท
   วิธีจัดซื้อ: ${it.method_name||''}
   สถานะ: ${it.announce_date?'ประกาศแล้ว':'รอประกาศ'}
   วันประกาศ: ${it.announce_date||''}
   จังหวัด(เบื้องต้น): ${findProvince(it.dept_name+' '+it.project_name)}
   URL: https://govspending.data.go.th/contract/${it.project_id||''}`).join('\n\n')}`;

  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions',{
      method:'POST',
      headers:{'Content-Type':'application/json','Authorization':`Bearer ${GROQ_KEY}`},
      body:JSON.stringify({model:'llama-3.3-70b-versatile',max_tokens:3000,temperature:0.1,
        messages:[{role:'system',content:'ตอบเฉพาะ JSON array เท่านั้น ไม่มี markdown'},{role:'user',content:prompt}]}),
      signal:AbortSignal.timeout(45000)
    });
    if(!res.ok) throw new Error(`Groq ${res.status}`);
    const d = await res.json();
    const text = d.choices?.[0]?.message?.content||'[]';
    const clean = text.replace(/```json|```/g,'').replace(/^[^\[]*/,'').replace(/[^\]]*$/,'').trim();
    return JSON.parse(clean);
  } catch(e){ console.log(`  ⚠️  Groq: ${e.message}`); return []; }
}

async function isDup(company, province) {
  const cutoff = new Date(Date.now()-30*864e5).toISOString();
  const {data} = await sb.from('leads').select('id').eq('company',company).eq('province',province).gte('created_at',cutoff).limit(1);
  return data&&data.length>0;
}

async function main() {
  const start = Date.now();
  const year = new Date().getFullYear()+543; // แปลงเป็น พ.ศ.
  console.log(`\n🚀 IT Sales Auto Monitor v4 — CGD API — ${new Date().toISOString()}`);
  console.log(`📅 ปีงบประมาณ: ${year} | 🤖 Groq llama-3.3-70b\n${'='.repeat(55)}`);

  const {data:rows}=await sb.from('settings').select('*');
  const settings=Object.fromEntries((rows||[]).map(r=>[r.key,r.value]));
  const threshold=parseInt(settings.auto_approve_threshold||'80');

  const SEARCH_KEYWORDS=['IT','server','network','software','security','คอมพิวเตอร์','ระบบสารสนเทศ','firewall','cloud','CCTV','wifi','storage'];

  let allItems=[], totalNew=0;

  // ดึงข้อมูลจาก CGD API
  for(const kw of SEARCH_KEYWORDS) {
    console.log(`\n🔍 CGD API keyword: "${kw}"`);
    const items = await fetchCGDContract(kw, year, 50, 0);
    console.log(`   IT projects: ${items.length}`);
    allItems = allItems.concat(items.map(it=>({...it, _keyword:kw})));
    await new Promise(r=>setTimeout(r,500));
  }

  // dedup by project_id
  const seen = new Set();
  const unique = allItems.filter(it=>{
    const key = it.project_id||it.project_name;
    if(seen.has(key)) return false;
    seen.add(key); return true;
  });
  console.log(`\n📊 unique IT projects: ${unique.length}`);

  if(!unique.length){ console.log('⚠️  ไม่พบโครงการ IT จาก CGD API'); return; }

  // วิเคราะห์ด้วย Groq ทีละ 10
  for(let i=0; i<unique.length; i+=10) {
    const batch = unique.slice(i,i+10);
    console.log(`\n🤖 Groq batch ${Math.floor(i/10)+1}/${Math.ceil(unique.length/10)} (${batch.length} items)...`);
    const leads = await analyzeGroq(batch);

    for(const lead of leads) {
      if(!lead.company||!lead.province) continue;
      if(await isDup(lead.company,lead.province)){ console.log(`   ♻️  dup: ${lead.company}`); continue; }
      const coords = PROVINCES[lead.province]||[13,101];
      const j = ()=>(Math.random()-.5)*.3;
      await sb.from('leads').insert({
        company:lead.company, province:lead.province, district:lead.district||null,
        orgtype:lead.orgtype||'government', status:lead.status||'cold',
        needs:lead.needs||[], needs_detail:lead.needs_detail||null,
        tor:lead.tor||'no', budget:lead.budget||null, deadline:lead.deadline||null,
        source_url:lead.source_url||null, source:'ai_auto', source_label:'CGD e-GP API',
        confidence:lead.confidence||0,
        lat:coords[0]+j(), lng:coords[1]+j(),
        approved:(lead.confidence||0)>=threshold
      });
      const ok=(lead.confidence||0)>=threshold;
      console.log(`   ✅ +${lead.company} (${lead.province}) ${lead.confidence}% ${ok?'→ approved':'→ review'}`);
      totalNew++;
    }
    if(i+10<unique.length) await new Promise(r=>setTimeout(r,3000));
  }

  await sb.from('monitor_logs').insert({
    source_name:'CGD e-GP API', leads_found:unique.length,
    leads_new:totalNew, status:'success', duration_ms:Date.now()-start
  });

  console.log(`\n${'='.repeat(55)}`);
  console.log(`✅ Done in ${((Date.now()-start)/1000).toFixed(1)}s`);
  console.log(`📊 IT projects: ${unique.length} | New leads: ${totalNew}`);
  console.log(`⏰ Next: tomorrow 07:00 น. ไทย\n`);
}

main().catch(e=>{console.error('❌ Fatal:',e);process.exit(1);});
