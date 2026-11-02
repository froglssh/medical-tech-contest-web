// ==========================================================================
// 醫療科技競賽選題與設定工具 (AI 人機協作升級版)
// ==========================================================================

const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];

// --------------------------------------------------------------------------
// 狀態管理與常數定義
// --------------------------------------------------------------------------
let activeTheme = 'all';
let activeStep = 0;
let currentAiStage = 1; // 1: 關鍵字發想, 2: 草稿優化, 3: 手動定稿

const STORAGE_KEY = 'medtech_wizard_values';
const FONT_KEY = 'medtech_font_size';

const defaultValues = {
  theme: '',
  user: '',
  need: '',
  evidence: '',
  solution: '',
  prototype: '',
  metric: '',
  risk: '',
  source: ''
};

let values = { ...defaultValues };

// 嘗試由 localStorage 恢復存檔
try {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    values = Object.assign({ ...defaultValues }, JSON.parse(saved));
  }
} catch (e) {
  console.warn('無法讀取本地儲存草稿', e);
}

// --------------------------------------------------------------------------
// 九大步驟詳細規格、引導標籤與句型範本
// --------------------------------------------------------------------------
const WIZARD_STEPS = [
  {
    key: 'theme',
    title: '主題賽道',
    help: '選定官方三大主題之一。注意：精準醫療金獎常從缺，選此賽道務必強化高中可行性！',
    subTracks: {
      '智慧醫療': ['AI影像辨識', '穿戴式生理感測', '病房IoT物聯網', '遠距醫療平台', '急診檢傷決策', '步態與姿勢分析'],
      '精準醫療': ['非侵入式微流體快篩', '特異性生物標記', '奈米藥物載體模擬', '光學頻譜檢測', '唾液/尿液生化檢驗', '組織工程支架'],
      '全齡健康': ['長者跌倒智慧預警', '睡眠呼吸品質監測', '翻身與壓瘡照護', '慢性病居家管理', '復健輔具回饋', '用藥安全提醒']
    }
  },
  {
    key: 'user',
    title: '使用者／場域',
    help: '誰在什麼具體場域與情境面臨困難？（越精準越好，避免模糊泛指「所有人」）',
    chips: [
      '加護病房(ICU)輪班護理師',
      '獨居且行動不便之高齡長者',
      '急性中風後下肢肢體復健期患者',
      '大醫院急診室檢傷分類醫護人員',
      '護理之家長期臥床失能住民',
      '第2型糖尿病居家胰島素注射病患',
      '血液透析(洗腎)中心動靜脈瘻管患者',
      '偏鄉巡迴衛生所基層公衛醫護與長者',
      '視障或色覺辨識障礙學童',
      '新生兒加護病房(NICU)早產兒團隊'
    ],
    templates: [
      '在 [場域/情境]，[主要目標族群] 在進行 [特定日常照護或醫療任務] 時，面臨高度負擔與風險。',
      '主要使用者為 [目標對象]，發生場域位於 [居家 / 醫院普通病房 / 長照機構]，核心情境是 [具體時刻]...'
    ]
  },
  {
    key: 'need',
    title: '未滿足需求 (臨床痛點)',
    help: '目前常規做法哪裡卡住？臨床或照護者最痛的阻礙是什麼？',
    chips: [
      '現行仰賴護理師每2小時人工巡房目測，夜間人力吃緊易生疲勞漏看',
      '檢測過程具高度侵入性與疼痛感，造成受檢長者或幼童嚴重排斥',
      '生理指標惡化為漸進過程，等肉眼可見臨床徵候時往往錯過黃金處置期',
      '傳統醫療級監測儀器價格高達數十萬且體積龐大，基層診所與家庭無法普及',
      '管路、引流袋或點滴移位滲漏缺乏即時物理阻斷與通報機制，易生二次感染',
      '居家自主復健缺乏專業人員即時姿勢回饋，易代償發力導致二度傷害',
      '高齡多重慢性病患者多重用藥，經常發生漏服、重複服藥或錯服風險',
      '市售穿戴手環因長者皮膚敏感或失智容易被扯下，難以持續配戴'
    ],
    templates: [
      '目前現行的標準處置方式是 [現行做法]，但最大痛點在於 [核心問題]，這往往導致 [嚴重後果或照護負擔]。',
      '受限於 [人力/成本/設備限制]，現有方法無法做到 [理想需求]，使得 [使用者] 長期暴露於 [特定風險] 之中。'
    ]
  },
  {
    key: 'evidence',
    title: '觀察證據與數據',
    help: '有什麼公衛統計、醫學文獻或醫療科技展現場訪談數據支撐這個痛點的真實性？',
    chips: [
      '衛福部死因統計：跌倒長年高居台灣65歲以上事故傷害死亡原因第2位',
      '臨床醫學文獻：ICU非計畫性拔管率與管路滲漏率約達3-5%，大幅延長住院天數',
      '醫療科技展實地訪談：受訪醫師指出傷口敷料更換與滲液評估佔每日護理時數逾25%',
      '國健署統計數據：糖尿病足潰瘍若引發深層壞疽，5年內死亡率高達50%',
      '照護機構實地問卷：超過85%照護者表示夜間翻身與離床預警是最大心理壓力來源',
      '國際醫學期刊：步態時間不對稱性(Step Time Asymmetry)與長者肌少症跌倒風險呈高度正相關'
    ],
    templates: [
      '根據 [衛福部統計 / 近五年醫學期刊 / 台灣醫療科技展實地訪談]，我們發現 [具體數據]，這充分證實該痛點具備高度臨床迫切性與公共衛生價值。',
      '數據顯示：[現狀指標] 高達 [百分比或人數]，若能及早以科技介入，預期能將 [不良事件發生率] 有效降低。'
    ]
  },
  {
    key: 'solution',
    title: '方案與科技原理',
    help: '這個裝置或系統如何運作？用了什麼物理、化學、感測器或演算法機制？',
    chips: [
      'ESP32主控晶片 + 柔性壓電感測薄膜矩陣，即時監測壓力分佈微變化',
      '微型光學吸收光譜感測模組(RGB/NIR)，藉由吸光度比值判定液體濁度與生化反應',
      '邊緣運算(Edge AI)姿態辨識模型(MediaPipe/YOLO)，即時辨識異常關節角度與步態',
      '低功耗藍牙(BLE) Mesh物聯網，達成多床位異常訊號即時連動護理站多點警示',
      '毛細微流體通道搭配特異性試劑呈色反應，實現常溫常壓非侵入快速篩檢',
      '六軸慣性感測器(IMU)以互補濾波演算法計算即時傾角與加速度衝擊特徵',
      '閉迴路電磁夾止閥機制，偵測到異常漏液訊號瞬間於0.5秒內機械自動阻斷'
    ],
    templates: [
      '我們研發 [作品/系統名稱]，其底層核心原理是採用 [感測技術或材料機制]，擷取 [目標生理或物理訊號]，並透過 [微控制器演算法/AI模型] 實現 [即時偵測/自動阻斷/視覺回饋]。',
      '系統主要分為三大層級：1. 訊號擷取層（[硬體感測器]）；2. 運算決策層（[邊緣演算法]）；3. 執行回饋層（[連動警示/機構控制]）。'
    ]
  },
  {
    key: 'prototype',
    title: '高中生可行原型 (POC)',
    help: '高中生要在校園與展前做出的概念驗證模型是什麼？（⚠️ 必須安全合法，不接觸人體侵入測試）',
    chips: [
      '採用 Arduino/ESP32 微控制器搭配 3D 列印人體工學外殼，完成 1:1 實體硬體原型',
      '建構離體循環管路與人工模擬體液系統，實測感測反應時間與阻斷成功率（絕非人體實驗）',
      '收集開源跌倒/步態公共影像資料集，於筆記型電腦完成輕量化模型訓練與準確率驗證',
      '以明膠/食用甘油自製仿生組織光學假體(Phantom)，驗證光學感測模組穿透度與線性度',
      '開發跨平台響應式 Web 儀表板與 LINE Notify 模擬推播，測試通報延遲與人機介面友善度',
      '利用自製標準砝碼校正治具，進行感測器 50 次重複性壓力負載測試與漂移分析'
    ],
    templates: [
      '在高中生資源與實驗安全規範下，我們將製作 [硬體/軟體原型形式]，透過 [離體模擬液管路 / 仿生假體 / 開源公共資料集] 進行驗證，不直接涉及人體侵入性測試，具高度可實現性。',
      '原型驗證流程規劃為：第一階段在實驗室搭建 [模擬驗證平台]；第二階段測試 [核心感測器與控制回路] 的重複性與穩定性。'
    ]
  },
  {
    key: 'metric',
    title: '量化成效指標',
    help: '用什麼客觀數字衡量成功？（金獎決定性維度！效益必須具體可量化）',
    chips: [
      '異常狀態感測至蜂鳴器/推播警示反應時間 < 1.0 秒',
      'AI 分類演算法在測試集之辨識準確率 (Accuracy) ≥ 92%，召回率 (Recall) ≥ 90%',
      '相較於傳統每2小時巡房，預期減少醫護人員例行性確認工時達 60% 以上',
      '感測系統重複量測相對標準差 (RSD) 控制在 5% 以內，具良好再現性',
      '整套核心硬體零組件製作成本控制在新台幣 1,500 元以內，具低成本普及優勢',
      '連續 24 小時模擬穩定性測試，維持 0 次致命性漏報 (Zero False Negative)'
    ],
    templates: [
      '我們設定三大量化檢驗指標：1. 技術精確度：[指標數值]；2. 反應時效：通報延遲縮短至 [秒數]；3. 經濟可行性：單套原型成本控制於 [金額] 元以內。',
      '預期臨床照護效益：相較現行常規處置流程，預估可降低 [特定不良事件發生率] 達 [百分比]，並顯著節省 [照護人力工時]。'
    ]
  },
  {
    key: 'risk',
    title: '倫理、安全與風險邊界',
    help: '有哪些安全紅線絕不能踩？如何設計故障防護與個資隱私？',
    chips: [
      '嚴格恪守高中實驗倫理規範：完全不進行人體臨床侵入性試驗，全程以離體模擬件驗證',
      '明確界定產品法律定位：本系統定性為「輔助警示與決策支援工具」，不宣稱替代醫師診斷',
      '個資與隱私保護：影像與生理特徵於本機邊緣端完成運算即刻銷毀，不存檔或上傳雲端',
      '設計實體安全備援機制 (Fail-Safe)：遭遇感測器斷線或斷電時，自動切換至預設常閉安全狀態',
      '醫療器材法規意識：理解本案為早期概念驗證(POC)，未來商用化需依TFDA規範申請認證',
      '實驗室化學與生物安全：測試廢液依環保規範集中妥善處理，外殼均使用無毒生質PLA耗材'
    ],
    templates: [
      '本專案嚴格遵守研究倫理：1. [安全邊界：全程以離體模擬測試，不觸碰人體試驗]；2. [功能邊界：系統僅提供輔助警示，不作醫療診斷宣稱]；3. [隱私防護：本地邊緣運算，杜絕個資外洩]。',
      '針對潛在風險我們設計了 [安全備援機制 (Fail-Safe)]，確保即使發生斷電或系統異常，依然能保障使用者安全。'
    ]
  },
  {
    key: 'source',
    title: '醫療科技展靈感來源',
    help: '對應台灣醫療科技展哪一個展區、醫學中心或設備廠商的展示啟發？',
    chips: [
      '台灣醫療科技展 - 頂尖醫學中心智慧醫療展示館（台大/北榮/長庚/成大智慧病房）',
      '高齡長照與照護科技主題專區（離床防跌感測地墊、智慧壓力釋放床墊）',
      '精準檢測與智慧檢驗儀器專區（定點照護檢驗POCT晶片、手持式光學快篩儀）',
      '數位醫療與遠距照護主題專區（AI智慧傷口判讀、穿戴式連續心電監測）',
      '現場與醫療設備原廠工程師訪談，了解臨床管路滲漏與護理人力短缺痛點',
      '生技新創專區：仿生奈米材料與高分子敷料展示'
    ],
    templates: [
      '本創意發想源於台灣醫療科技展 [展出單位/醫學中心] 展出之 [技術項目/展品名稱]，我們受其啟發，發現該技術若轉化為 [居家/基層] 輕量化版本，能嘉惠更多潛在受惠者。',
      '在參觀醫療科技展期間，我們實地觀察 [展區名稱] 的展示，並訪談現場人員，確立以 [核心痛點] 作為我們專題的核心突破點。'
    ]
  }
];

// 金獎示範案例資料
const GOLDEN_SAMPLE = {
  theme: '智慧醫療',
  user: '加護病房(ICU)及一般外科病房長期留置導尿管之住院病患，以及輪班巡房護理人員。',
  need: '臨床現行仰賴護理師每2小時人工巡房目測尿袋蓄積量與導管狀態；夜間人力吃緊容易延遲發現尿路阻塞、尿袋過重逆流或導管滲漏脫落，導致泌尿道感染(CAUTI)甚至敗血症風險。',
  evidence: '台灣感染管制期刊與衛福部統計指出，導尿管相關泌尿道感染(CAUTI)高居醫院院內感染前兩名，且非計畫性管路拉扯滑脫每年發生率約3-4%；醫療科技展訪談護理師亦證實管路巡檢佔去大比例日常工時。',
  solution: '研發「智控安芯夾-導管滲漏警示與連動阻斷IoT裝置」。採用低功耗ESP32微控制器，搭配高精度微型張力/重量感測模組即時量測尿袋重量變化；並於導管銜接處配置環形柔性光學吸光度與水分阻抗感測片，一旦偵測到異常滲漏訊號，微處理器於0.5秒內啟動微型伺服機械閥進行物理阻斷，並透過BLE Mesh廣播訊號連動護理站聲光警示。',
  prototype: '在高中實驗室內製作 3D 列印機構外殼，搭建離體循環模擬液路平台（使用生理食鹽水與食用色素模擬尿液流動），以受控蠕動幫浦模擬不同流速，實測感測模組在微量滲漏（<0.5 mL）下的反應時間與夾止閥阻斷效率；完全不進行人體臨床接觸，合乎高中實驗安全。',
  metric: '1. 滲漏感測至機械阻斷啟動時間 < 0.8 秒；2. 尿液滲漏辨識靈敏度達 98%，誤警率 < 3%；3. 原型製作總硬體物料成本 < 1,200 元；4. 模擬實驗連續測試 50 次阻斷成功率 100%。',
  risk: '1. 倫理邊界：本研究純以離體模擬管路驗證，絕無人體侵入性試驗；2. 安全備援：伺服夾止閥具備手動機械推桿釋放結構，斷電或當機時可由護理人員一秒手動復位；3. 定位界線：系統定位為護理輔助防護與警示工具，不可宣稱取代常規護理評估與醫療處置。',
  source: '台灣醫療科技展醫學中心館（智慧病房管路防護與遠距照護監控展示區），並結合展場醫護人員對臨床防脫管與院內感染防護之實務反饋。'
};

// --------------------------------------------------------------------------
// 工具函式
// --------------------------------------------------------------------------
function esc(s) {
  if (!s) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function showToast(msg, duration = 3500) {
  const toast = $('#toast');
  if (!toast) return;
  toast.innerHTML = msg;
  toast.classList.add('show');
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => {
    toast.classList.remove('show');
  }, duration);
}

function copyToClipboard(text, successMsg = '已複製到剪貼簿！') {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    return navigator.clipboard.writeText(text).then(() => {
      showToast(`✅ ${successMsg}`);
      return true;
    }).catch(() => fallbackCopy(text, successMsg));
  }
  return fallbackCopy(text, successMsg);
}

function fallbackCopy(text, successMsg) {
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.cssText = 'position:fixed;opacity:0;top:0;left:0';
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    if (ok) {
      showToast(`✅ ${successMsg}`);
      return true;
    }
  } catch (e) {
    console.error(e);
  }
  showToast('⚠️ 自動複製受限，請手動複製選取文字');
  return false;
}

function saveDraft() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(values));
    const indicator = $('#save-indicator');
    if (indicator) {
      indicator.textContent = '🟢 草稿已儲存';
      indicator.style.opacity = '1';
    }
  } catch (e) {
    console.warn('存檔失敗', e);
  }
}

// --------------------------------------------------------------------------
// 字體縮放控制
// --------------------------------------------------------------------------
function initFontSize() {
  const saved = localStorage.getItem(FONT_KEY) || 'large';
  setFontSize(saved);

  $$('.zoom-btn').forEach(btn => {
    btn.onclick = () => {
      const size = btn.dataset.size;
      setFontSize(size);
    };
  });
}

function setFontSize(size) {
  document.body.classList.remove('font-normal', 'font-large', 'font-xlarge');
  document.body.classList.add(`font-${size}`);
  const rootSize = size === 'normal' ? '16px' : size === 'xlarge' ? '20.5px' : '18px';
  document.documentElement.style.fontSize = rootSize;
  $$('.zoom-btn').forEach(b => b.classList.toggle('active', b.dataset.size === size));
  localStorage.setItem(FONT_KEY, size);
}

// --------------------------------------------------------------------------
// 分頁一：歷屆作品渲染與篩選
// --------------------------------------------------------------------------
function renderCases() {
  const q = $('#search') ? $('#search').value.trim().toLowerCase() : '';
  const ed = $('#edition') ? $('#edition').value : 'all';
  const aw = $('#award') ? $('#award').value : 'all';

  if (typeof CASES === 'undefined' || !Array.isArray(CASES)) {
    $('#case-grid').innerHTML = '<div class="empty">案例資料載入中或檔案遺失。</div>';
    return;
  }

  const list = CASES.filter(c => {
    const matchTheme = activeTheme === 'all' || c.t === activeTheme;
    const matchEdition = ed === 'all' || String(c.e) === ed;
    const matchAward = aw === 'all' || c.a === aw;
    const matchSearch = !q || [c.n, c.t, c.h, c.l, c.r].join(' ').toLowerCase().includes(q);
    return matchTheme && matchEdition && matchAward && matchSearch;
  });

  const countEl = $('#result-count');
  if (countEl) countEl.textContent = `顯示 ${list.length} / ${CASES.length} 筆案例`;

  const grid = $('#case-grid');
  if (!grid) return;

  if (!list.length) {
    grid.innerHTML = '<div class="empty">找不到相符案例。建議清除搜尋關鍵字或放寬篩選條件。</div>';
    return;
  }

  grid.innerHTML = list.map(c => `
    <article class="case-card">
      <div class="tag-row">
        <span class="tag">第 ${c.e} 屆</span>
        <span class="tag award">${c.a}</span>
        <span class="tag">${c.t}</span>
      </div>
      <h3>${esc(c.n)}</h3>
      <div class="case-block">
        <strong>創意亮點</strong>
        <p>${esc(c.h)}</p>
      </div>
      <div class="case-block">
        <strong>可借鏡之處</strong>
        <p>${esc(c.l)}</p>
      </div>
      <div class="case-block">
        <strong>驗證／可行性風險</strong>
        <p>${esc(c.r)}</p>
      </div>
      <div class="case-foot">
        <small>教學性推論</small>
        <a class="source-link" target="_blank" rel="noreferrer" href="${c.u}">官方來源 ↗</a>
      </div>
    </article>
  `).join('');
}

// --------------------------------------------------------------------------
// 分頁二：新題目設定工作坊
// --------------------------------------------------------------------------
function renderStepper() {
  const stepper = $('#stepper');
  if (!stepper) return;

  stepper.innerHTML = WIZARD_STEPS.map((s, i) => {
    const isCompleted = i < activeStep || (values[s.key] && values[s.key].trim() !== '');
    return `
      <div class="step-item ${i === activeStep ? 'active' : ''} ${isCompleted ? 'completed' : ''}" data-step-idx="${i}">
        <span class="step-dot">${i < activeStep ? '✓' : i + 1}</span>
        <span>${s.title}</span>
      </div>
    `;
  }).join('');

  $$('.step-item').forEach(el => {
    el.onclick = () => {
      saveCurrentStepInput();
      activeStep = parseInt(el.dataset.stepIdx, 10);
      renderForm();
    };
  });

  const stepNumEl = $('#step-number');
  if (stepNumEl) stepNumEl.textContent = activeStep + 1;
}

function saveCurrentStepInput() {
  if (activeStep > 0 && activeStep < WIZARD_STEPS.length) {
    const curKey = WIZARD_STEPS[activeStep].key;
    const field = $('#field');
    if (field) {
      values[curKey] = field.value.trim();
      saveDraft();
    }
  }
}

// 產生 AI 提示詞
function generateAiPrompt(stage, stepIdx) {
  const step = WIZARD_STEPS[stepIdx];
  const stepTitle = step.title;
  const currentTheme = values.theme || '智慧醫療（尚未正式勾選）';
  const studentText = $('#field') ? $('#field').value.trim() : (values[step.key] || '');
  const keywordInput = $('#keyword-input');
  const keywords = keywordInput ? keywordInput.value.trim() : '';

  if (stage === 1) {
    // 階段一：關鍵字引導發想
    const kwText = keywords || studentText || '（尚未輸入關鍵字，請依常見主題發想）';
    return `【全國高中醫療科技創意競賽 - 首席教授輔導提示詞】
你現在是全國高中醫療科技創意競賽的資深指導教授（曾指導多隊榮獲金獎、熟悉 13 所醫學系系主任評審標準）。
我們是一組正在籌備競賽題目的高中生團隊。

【專案設定背景】
- 主題賽道：${currentTheme}
- 當前發想環節：【第 ${stepIdx + 1} 步：${stepTitle}】
- 我們目前給予的關鍵字／初步構想：
「${kwText}」

【指導任務】
請依據競賽五大評審向度（創意性、科學理論、研發規劃、使用情境與效益、影片邏輯），針對上述關鍵字提供 3 個具體且極具啟發性的發展方向。每個方向請包含：
1. 【未滿足痛點】：臨床或生活場域的真實痛點是什麼？（請指明具體使用者）
2. 【核心原理】：可以用什麼常見的感測器、物理/化學原理或演算法實現？
3. 【高中可行原型】：高中生如何在不接觸人體侵入實驗的前提下（如使用離體模擬循環、仿生假體、開源資料集），做出能被評審認可的原型概念驗證(POC)？
4. 【避開銀獎陷阱】：如何避免「想法很前瞻但高中生無法驗證」的扣分陷阱？

請使用繁體中文，語氣啟發、循循善誘且具體務實，每點約 100-150 字。`;
  } else if (stage === 2) {
    // 階段二：草稿專業評鑑與優化
    const draft = studentText || '（目前草稿空白，請先依該項目要求給予示範改寫）';
    return `【全國高中醫療科技創意競賽 - 決審評審評鑑與修訂提示詞】
你現在是全國高中醫療科技創意競賽的決審評審委員（代表 13 所醫學系系主任組成的評審團，以嚴格的 90 分金獎標準審視作品）。
我們高中生團隊為競賽計畫書的【${stepTitle}】撰寫了以下初稿，請進行嚴格健檢、指出盲點並提供高水準優化版本。

【專案背景】
- 主題賽道：${currentTheme}
- 計畫項目：【第 ${stepIdx + 1} 步：${stepTitle}】
- 學生目前的初稿內容：
「${draft}」

【評審任務】
1. 【嚴格評鑑反饋】：
   - 優點亮點：哪裡符合競賽精神？
   - 致命盲點：是否存在「痛點太模糊」、「缺乏具體數據支撐」、「把現有做法當創新」？
   - ⚠️ 銀獎陷阱警告：是否有「過度宣稱醫療療效、取代醫師診斷」或「高中階段根本做不出驗證」的硬傷？
2. 【金獎規格修訂示範】：
   - 請提供一段學術用語精準、邏輯嚴密、量化指標明確的修訂版本（約 150-250 字）。
   - 請確保該示範版本「嚴守高中生能力邊界與實驗安全倫理」，能作為學生進一步手動改寫的基石。
3. 【手動修改指引】：列出 2 點建議學生親自保留與修改的方向。

請使用繁體中文，直言不諱、具建設性，維持高度醫學與科學專業。`;
  }
  return '';
}

// 呼叫外部 AI (ChatGPT / Gemini)
function launchAiAssistant(provider, stage, stepIdx) {
  const prompt = generateAiPrompt(stage, stepIdx);
  if (!prompt) return;

  if (provider === 'chatgpt') {
    copyToClipboard(prompt, '提示詞已自動複製！即將開啟 ChatGPT，若未自動載入請直接按 Ctrl+V (⌘V) 貼上！');
    // ChatGPT URL scheme
    const url = `https://chatgpt.com/?hints=search&q=${encodeURIComponent(prompt)}`;
    setTimeout(() => window.open(url, '_blank'), 400);
  } else if (provider === 'gemini') {
    copyToClipboard(prompt, '提示詞已自動複製！即將開啟 Google Gemini，請在對話框按 Ctrl+V (⌘V) 貼上即可開始！');
    const url = 'https://gemini.google.com/app';
    setTimeout(() => window.open(url, '_blank'), 400);
  } else if (provider === 'copy') {
    copyToClipboard(prompt, '提示詞已成功複製至剪貼簿！可貼到 Claude、NotebookLM 等任何 AI 工具。');
  }
}

function renderForm() {
  $('#summary').classList.add('hidden');
  const step = WIZARD_STEPS[activeStep];
  const formEl = $('#idea-form');
  if (!formEl) return;

  let bodyHtml = '';

  if (activeStep === 0) {
    // 步驟 0：三大主題賽道選擇
    bodyHtml = `
      <div class="theme-options">
        <button type="button" class="theme-option ${values.theme === '智慧醫療' ? 'selected' : ''}" data-pick="智慧醫療">
          <strong>智慧醫療</strong>
          <small>AI演算法、物聯網(IoT)、智慧醫院流程、穿戴式感測與遠距醫療應用</small>
          <span class="theme-badge gold-prob">🥇 金獎機率最高（歷屆均有金獎）</span>
        </button>
        <button type="button" class="theme-option ${values.theme === '精準醫療' ? 'selected' : ''}" data-pick="精準醫療">
          <strong>精準醫療</strong>
          <small>分子診斷、生技微流體、個人化生物標記檢測、奈米載體模擬</small>
          <span class="theme-badge trap-warn">⚠️ 銀獎陷阱重災區（第3屆金獎從缺）</span>
        </button>
        <button type="button" class="theme-option ${values.theme === '全齡健康' ? 'selected' : ''}" data-pick="全齡健康">
          <strong>全齡健康</strong>
          <small>長者防跌、慢性病居家監測、長照智慧輔具、睡眠與姿態健康管理</small>
          <span class="theme-badge stable">🛡️ 工程導向穩健（重視日常普及性）</span>
        </button>
      </div>

      ${values.theme === '精準醫療' ? `
        <div class="silver-trap-alert">
          <span class="alert-icon">⚠️</span>
          <div>
            <strong>首席教授重要提醒：避開「精準醫療」銀獎陷阱！</strong>
            <p>歷屆精準醫療作品常因探討「基因編輯、幹細胞、奈米機器人」等前瞻技術，在理論根據（維度2）拿到高分，卻因<strong>「高中生展前無法做出概念驗證(POC)」</strong>而在可行性（維度4）失分，最終被卡在 85–89 分銀獎區間！若選此賽道，<strong>必須在後續步驟規劃高中生可行的「離體模擬實驗」或「開源生物數據分析」！</strong></p>
          </div>
        </div>
      ` : ''}

      ${values.theme ? `
        <div class="chips-scaffold">
          <div class="scaffold-head">
            <h4>💡 ${values.theme} 常見熱門子賽道與技術切入點（點選可為後續步驟定向）：</h4>
          </div>
          <div class="scaffold-chips">
            ${(step.subTracks[values.theme] || []).map(t => `<span class="quick-chip" style="cursor:default; background:#f0fdf4; border-color:#86efac; color:#166534;"># ${t}</span>`).join('')}
          </div>
        </div>
      ` : ''}
    `;
  } else {
    // 步驟 1–8：各項目填寫與 AI 協作專區
    const currentValue = values[step.key] || '';
    const isPrecision = values.theme === '精準醫療';

    bodyHtml = `
      <!-- 銀獎陷阱提醒（精準醫療賽道動態提醒） -->
      ${isPrecision && (step.key === 'prototype' || step.key === 'solution') ? `
        <div class="silver-trap-alert">
          <span class="alert-icon">⚠️</span>
          <div>
            <strong>精準醫療原型驗證叮嚀：</strong>
            <p>高中專題嚴禁接觸人體臨床試驗！在描述原型時，務必採用「離體模擬循環管路、仿生組織假體(Phantom)、或開源生醫影像/基因資料庫」驗證，絕不可寫空話！</p>
          </div>
        </div>
      ` : ''}

      <!-- 快速情境標籤（不要讓學生從零寫） -->
      <div class="chips-scaffold">
        <div class="scaffold-head">
          <h4>💡 常用情境與靈感標籤 <span>（點擊直接帶入下方輸入框，省去苦思）</span></h4>
          <span style="font-size:0.8rem; color:var(--teal-dark); font-weight:700;">＋ 點選加入</span>
        </div>
        <div class="scaffold-chips">
          ${(step.chips || []).map(c => `
            <button type="button" class="quick-chip" data-insert="${esc(c)}">${esc(c)}</button>
          `).join('')}
        </div>
        ${step.templates ? `
          <div class="template-row">
            <span class="template-label">經典起手式句型：</span>
            ${step.templates.map((tpl, idx) => `
              <button type="button" class="template-btn" data-insert="${esc(tpl)}">模板 ${idx + 1}：${esc(tpl.substring(0, 16))}...</button>
            `).join('')}
          </div>
        ` : ''}
      </div>

      <!-- 主文字輸入框 -->
      <div class="field">
        <label for="field">
          <span>請撰寫或點選組合你們的設定：</span>
          <span>具體客觀，恪守高中安全邊界，不需填寫個資</span>
        </label>
        <textarea id="field" placeholder="例如：在什麼情境，誰遇到什麼具體困難？可用上方標籤快速帶入...">${esc(currentValue)}</textarea>
      </div>

      <!-- AI 輔助協作專區（人機協作三階段） -->
      <div class="ai-copilot-box">
        <div class="ai-copilot-head">
          <div class="ai-title-wrap">
            <span class="ai-spark-icon">✨</span>
            <h4>AI 企劃教練協作專區</h4>
          </div>
          <span class="human-ai-tag">人機協作原則：AI 引導 ➔ 學生動手 ➔ 嚴防幻覺</span>
        </div>

        <!-- 三階段切換標籤 -->
        <div class="ai-stage-tabs">
          <button type="button" class="stage-tab-btn ${currentAiStage === 1 ? 'active' : ''}" data-ai-stage="1">
            <span>階段 1：關鍵字發想</span>
            <small>學生給關鍵字 ➔ AI 給選題建議</small>
          </button>
          <button type="button" class="stage-tab-btn ${currentAiStage === 2 ? 'active' : ''}" data-ai-stage="2">
            <span>階段 2：草稿嚴審優化</span>
            <small>貼上草稿 ➔ 評審視角健檢潤飾</small>
          </button>
          <button type="button" class="stage-tab-btn ${currentAiStage === 3 ? 'active' : ''}" data-ai-stage="3">
            <span>階段 3：手動定稿存檔</span>
            <small>AI 建議對照 ➔ 親手修訂存檔</small>
          </button>
        </div>

        <!-- 階段內容區 -->
        <div class="ai-stage-content">
          ${currentAiStage === 1 ? `
            <div class="stage-prompt-box">
              <p><strong>🎯 階段 1 指引：</strong>還沒有完整句子？輸入 2–3 個關鍵字，或點選上方標籤，向 AI 徵詢具備臨床可行性的發想建議：</p>
              <div class="keyword-input-wrap">
                <input id="keyword-input" type="text" placeholder="例如：尿袋滲漏、護理師夜間巡房、ESP32即時夾止" value="${esc(currentValue.substring(0, 35))}" />
              </div>
            </div>
          ` : currentAiStage === 2 ? `
            <div class="stage-prompt-box">
              <p><strong>🔍 階段 2 指引：</strong>以 13 所醫學系評審委員角度，嚴格健檢你們目前在上方輸入框的草稿，抓出「銀獎陷阱」並提供金獎規格的修訂版本：</p>
              <div style="background:#f1f5f9; padding:10px 14px; border-radius:6px; font-size:0.9rem; color:#475569; margin-bottom:12px; border-left:3px solid var(--teal);">
                <strong>目前送審草稿：</strong>${currentValue ? esc(currentValue.substring(0, 80)) + (currentValue.length > 80 ? '...' : '') : '<span style="color:#94a3b8;">（上方輸入框尚無內容，請先填寫或點選標籤）</span>'}
              </div>
            </div>
          ` : `
            <div class="stage3-container">
              <div class="human-rule-reminder">
                <strong>⚠️ 人機協作核心原則叮嚀：</strong>
                AI 提供的修訂文字僅作為參考架構！競賽評審最痛恨「通篇 AI 生成空話」。請小組成員務必依據你們真實的<strong>訪談內容、校內設備、實驗耗材與量測能力</strong>親手修改與刪減！
              </div>
              <div class="scratchpad-wrap">
                <label for="ai-scratchpad">📥 AI 建議暫存／對照框（可將外部 Gemini / ChatGPT 的回覆貼於此處）：</label>
                <textarea id="ai-scratchpad" placeholder="將 AI 產出的建議或修訂版本貼到這裡，逐句閱讀、去蕪存菁..."></textarea>
              </div>
              <div class="scratchpad-actions">
                <button type="button" class="btn-adopt-ai" id="btn-apply-ai">📝 帶入上方正式編輯框（由我手動修改）</button>
                <button type="button" class="secondary" id="btn-save-step">💾 暫存此步驟內容</button>
              </div>
            </div>
          `}

          ${currentAiStage !== 3 ? `
            <div class="ai-actions-row">
              <button type="button" class="btn-ai-external btn-gemini" id="btn-call-gemini">
                <span>⚡ 一鍵複製並開啟 Gemini</span>
              </button>
              <button type="button" class="btn-ai-external btn-chatgpt" id="btn-call-chatgpt">
                <span>⚡ 一鍵複製並開啟 ChatGPT</span>
              </button>
              <button type="button" class="btn-copy-prompt" id="btn-copy-only">
                <span>📋 僅複製提示詞</span>
              </button>
              <button type="button" class="btn-toggle-prompt" id="btn-toggle-prompt">
                <span>👁️ 查看／微調提示詞內容</span>
              </button>
            </div>

            <div class="prompt-preview-drawer" id="prompt-drawer">
              <h5>微調將發送給外部 AI 的提示詞：</h5>
              <textarea id="prompt-preview-text">${esc(generateAiPrompt(currentAiStage, activeStep))}</textarea>
            </div>
          ` : ''}
        </div>
      </div>
    `;
  }

  formEl.innerHTML = `
    <div class="form-step">
      <h3>${activeStep + 1}. ${step.title}</h3>
      <p>${step.help}</p>
      ${bodyHtml}
    </div>
  `;

  // 綁定事件
  bindStepEvents();
  renderStepper();

  // 更新按鈕狀態
  $('#prev-step').disabled = activeStep === 0;
  $('#next-step').textContent = activeStep === WIZARD_STEPS.length - 1 ? '產生設定摘要 →' : '下一步 →';
}

function bindStepEvents() {
  // 步驟 0：主題點選
  $$('[data-pick]').forEach(b => {
    b.onclick = () => {
      values.theme = b.dataset.pick;
      saveDraft();
      renderForm();
    };
  });

  // 標籤點選加入
  $$('[data-insert]').forEach(b => {
    b.onclick = () => {
      const textToInsert = b.dataset.insert;
      const field = $('#field');
      const kwInput = $('#keyword-input');

      if (field) {
        if (!field.value.trim()) {
          field.value = textToInsert;
        } else {
          field.value += (field.value.endsWith('。') || field.value.endsWith('\n') ? '' : '；') + textToInsert;
        }
        values[WIZARD_STEPS[activeStep].key] = field.value.trim();
        saveDraft();
      }

      if (kwInput && !kwInput.value.trim()) {
        kwInput.value = textToInsert.split(/[,，、：]/)[0] || textToInsert;
      }

      showToast(`已帶入：「${textToInsert.substring(0, 15)}...」`);
    };
  });

  // 輸入框即時存檔
  const field = $('#field');
  if (field) {
    field.oninput = () => {
      values[WIZARD_STEPS[activeStep].key] = field.value.trim();
      saveDraft();
    };
  }

  // AI 階段切換
  $$('[data-ai-stage]').forEach(b => {
    b.onclick = () => {
      currentAiStage = parseInt(b.dataset.aiStage, 10);
      renderForm();
    };
  });

  // 外部 AI 發送
  const btnGemini = $('#btn-call-gemini');
  if (btnGemini) {
    btnGemini.onclick = () => launchAiAssistant('gemini', currentAiStage, activeStep);
  }

  const btnChatgpt = $('#btn-call-chatgpt');
  if (btnChatgpt) {
    btnChatgpt.onclick = () => launchAiAssistant('chatgpt', currentAiStage, activeStep);
  }

  const btnCopyOnly = $('#btn-copy-only');
  if (btnCopyOnly) {
    btnCopyOnly.onclick = () => launchAiAssistant('copy', currentAiStage, activeStep);
  }

  const btnToggle = $('#btn-toggle-prompt');
  const drawer = $('#prompt-drawer');
  if (btnToggle && drawer) {
    btnToggle.onclick = () => {
      drawer.classList.toggle('open');
      btnToggle.textContent = drawer.classList.contains('open') ? '▲ 隱藏提示詞內容' : '👁️ 查看／微調提示詞內容';
    };
  }

  // 階段 3 帶入與儲存
  const btnApplyAi = $('#btn-apply-ai');
  if (btnApplyAi) {
    btnApplyAi.onclick = () => {
      const scratchpad = $('#ai-scratchpad');
      const mainField = $('#field');
      if (scratchpad && mainField && scratchpad.value.trim()) {
        mainField.value = scratchpad.value.trim();
        values[WIZARD_STEPS[activeStep].key] = mainField.value.trim();
        saveDraft();
        showToast('✅ 已成功將 AI 建議帶入主編輯框！請務必親自手動修訂與刪改。');
        mainField.focus();
      } else {
        showToast('⚠️ 請先在暫存框貼上 AI 回覆的文字');
      }
    };
  }

  const btnSaveStep = $('#btn-save-step');
  if (btnSaveStep) {
    btnSaveStep.onclick = () => {
      saveCurrentStepInput();
      showToast('💾 本步驟內容已成功暫存！');
    };
  }
}

// --------------------------------------------------------------------------
// 摘要產生與 15 頁橫式簡報企劃大綱生成
// --------------------------------------------------------------------------
function generate15PageSlideOutline() {
  const t = values.theme || '智慧醫療';
  const u = values.user || '（尚未填寫使用者／場域）';
  const n = values.need || '（尚未填寫未滿足需求）';
  const e = values.evidence || '（尚未填寫觀察證據）';
  const s = values.solution || '（尚未填寫方案原理）';
  const p = values.prototype || '（尚未填寫高中可行原型）';
  const m = values.metric || '（尚未填寫量化成效指標）';
  const r = values.risk || '（尚未填寫倫理與風險邊界）';
  const src = values.source || '（尚未填寫展場來源）';

  return `# 【2026 全國高中醫療科技創意競賽】15 頁橫式企劃說明書架構
（符合大會規格：16:9 橫式 PDF、最多 15 頁含封面、≤5MB）

## 投影片 01｜封面
- 題目名稱：${s.split('。')[0] || '醫療科技創新作品名稱'}
- 參賽賽道：${t}
- 參賽隊員：[學生姓名 3-5 人]
- 指導教師：[指導教師 1-2 人]、學校單位：[學校名稱]

## 投影片 02｜臨床現況與未滿足需求（痛點定義）
- 目標族群與場域：${u}
- 核心未滿足痛點：${n}
- 現有標準照護模式的極限與瓶頸

## 投影片 03｜公衛數據與文獻實證（問題真實性）
- 流行病學數據與官方統計佐證：${e}
- 痛點造成的臨床延遲、併發症或經濟照護負擔

## 投影片 04｜台灣醫療科技展實地啟發
- 展場探索展區與對應攤位：${src}
- 現場觀察與專家/醫護訪談回饋之關鍵啟示

## 投影片 05｜創新解決方案架構
- 系統全貌與定位：${s}
- 軟硬體整合概念示意圖（使用者、感測端、處理端、警示端）

## 投影片 06｜核心科學理論與生醫科技原理
- 底層物理、化學或演算法機制說明
- 近五年文獻佐證：為何此原理能在該情境下精準作動

## 投影片 07｜系統資料流與軟硬體方塊圖
- 硬體方塊圖：微控制器、感測器、通訊模組、致動機構
- 資料流向：訊號擷取 ➔ 邊緣前處理 ➔ 判斷決策 ➔ 警示/阻斷連動

## 投影片 08｜高中生可行原型 (POC) 製作實務
- 原型形態與材料規格：${p}
- 高中實驗室環境下的具體組裝與自製治具

## 投影片 09｜非人體實驗之概念驗證平台
- 離體模擬循環管路／仿生假體／開源資料集架設
- 嚴格遵守高中實驗倫理，無人體侵入性接觸

## 投影片 10｜量化成效指標與實測數據分析
- 關鍵驗證成效指標：${m}
- 重複性、感測靈敏度、反應時間與誤報率數據圖表

## 投影片 11｜競品分析與現有技術差異化矩陣
- 與市售大型設備／傳統處置方式之多向度對照表
- 低成本化、輕量化、即時連動之核心優勢

## 投影片 12｜臨床應用效益與使用者旅程
- 導入前後照護工時與不良事件機率比較
- 使用者情境旅程圖（醫護/長者/病患操作步驟）

## 投影片 13｜研究倫理、安全備援與法規邊界
- 倫理規範與個資隱私防護設計：${r}
- 故障安全備援機制 (Fail-Safe)：斷電/失聯時之常態安全維持

## 投影片 14｜團隊分工與歷程省思
- 小組隊員專業分工（機構/程式/實驗/文獻）
- 人機協作歷程省思：AI 輔助與學生自主實作的界線辨識

## 投影片 15｜結論與未來發展藍圖
- 本專題核心突破點總結
- 邁向產品化與 TFDA 醫療器材認證之長期階段規劃`;
}

function makeSummary() {
  saveCurrentStepInput();
  const summaryEl = $('#summary');
  if (!summaryEl) return;

  summaryEl.classList.remove('hidden');

  const slidesText = generate15PageSlideOutline();

  summaryEl.innerHTML = `
    <h3>🎉 恭喜完成！可複製的題目設定成果</h3>
    
    <div class="summary-toolbar">
      <button class="primary" id="btn-copy-15slides" type="button">📄 複製 15 頁簡報企劃大綱 (Markdown)</button>
      <button class="secondary" id="btn-copy-summary" type="button">📋 複製 9 步精簡摘要</button>
      <button class="tool-btn" id="btn-export-json" type="button">💾 匯出備份 JSON</button>
      <button class="tool-btn" id="btn-print" type="button">🖨️ 列印 / 存為 PDF</button>
    </div>

    <div class="summary-tabs">
      <button type="button" class="sum-tab-btn active" data-sum-view="steps">📋 9 大項目設定摘要</button>
      <button type="button" class="sum-tab-btn" data-sum-view="slides">📄 15 頁橫式簡報大綱預覽</button>
    </div>

    <div id="sum-view-steps">
      <div>
        ${WIZARD_STEPS.map((s, i) => `
          <div class="summary-item">
            <b>${i + 1}. ${s.title}</b>
            <div>${esc(values[s.key]) || '<span style="color:#ef4444;">尚未填寫</span>'}</div>
          </div>
        `).join('')}
      </div>

      <div class="summary-note">
        <strong>差異化與評審核對提醒：</strong>
        請對照本工具「歷屆作品」分頁，確認你的題目是否與前人案例共享技術或族群；務必以「不同場域／不同資料／更小而可行的高中原型」突顯新意。本摘要僅供競賽發想，不構成醫療診斷、治療建議或醫事人員替代。
      </div>
    </div>

    <div id="sum-view-slides" class="hidden">
      <div class="slides-outline-card">
        <pre style="white-space:pre-wrap; font-family:inherit; font-size:0.95rem; line-height:1.7; margin:0;">${esc(slidesText)}</pre>
      </div>
    </div>
  `;

  // 摘要檢視切換
  $$('[data-sum-view]').forEach(b => {
    b.onclick = () => {
      const view = b.dataset.sumView;
      $$('[data-sum-view]').forEach(x => x.classList.toggle('active', x === b));
      $('#sum-view-steps').classList.toggle('hidden', view !== 'steps');
      $('#sum-view-slides').classList.toggle('hidden', view !== 'slides');
    };
  });

  // 複製 15 頁簡報大綱
  const btn15 = $('#btn-copy-15slides');
  if (btn15) {
    btn15.onclick = () => copyToClipboard(slidesText, '已成功複製 15 頁簡報企劃大綱 (Markdown)！可直接貼至備忘錄或投影片大綱。');
  }

  // 複製 9 步摘要
  const btnSum = $('#btn-copy-summary');
  if (btnSum) {
    btnSum.onclick = () => {
      const summaryText = WIZARD_STEPS.map((s, i) => `【${i + 1}. ${s.title}】\n${values[s.key] || '尚未填寫'}\n`).join('\n');
      copyToClipboard(summaryText, '已成功複製 9 步題目設定摘要！');
    };
  }

  // 匯出 JSON
  const btnExport = $('#btn-export-json');
  if (btnExport) {
    btnExport.onclick = () => {
      const blob = new Blob([JSON.stringify(values, null, 2)], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `醫療科技競賽題目設定_${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(a.href);
      showToast('✅ 已成功匯出 JSON 備份檔！');
    };
  }

  // 列印
  const btnPrint = $('#btn-print');
  if (btnPrint) {
    btnPrint.onclick = () => window.print();
  }

  // 滾動到摘要
  summaryEl.scrollIntoView({ behavior: 'smooth' });
}

// --------------------------------------------------------------------------
// 分頁切換與全域按鈕
// --------------------------------------------------------------------------
function switchTab(id) {
  $$('.tab-panel').forEach(p => p.classList.toggle('active', p.id === id));
  $$('.nav-btn').forEach(b => b.classList.toggle('active', b.dataset.tab === id));
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function initGlobalActions() {
  // 分頁導覽
  $$('.nav-btn').forEach(b => b.onclick = () => switchTab(b.dataset.tab));
  $$('[data-jump]').forEach(b => b.onclick = () => switchTab(b.dataset.jump));

  // 歷屆案例篩選
  if ($('#search')) $('#search').oninput = renderCases;
  if ($('#edition')) $('#edition').onchange = renderCases;
  if ($('#award')) $('#award').onchange = renderCases;

  $$('[data-theme]').forEach(b => {
    b.onclick = () => {
      activeTheme = b.dataset.theme;
      $$('[data-theme]').forEach(x => x.classList.toggle('active', x === b));
      renderCases();
    };
  });

  // 工作坊前進後退
  const btnNext = $('#next-step');
  if (btnNext) {
    btnNext.onclick = () => {
      saveCurrentStepInput();
      if (activeStep < WIZARD_STEPS.length - 1) {
        activeStep++;
        currentAiStage = 1; // 預設回到階段一
        renderForm();
        window.scrollTo({ top: $('#wizard').offsetTop - 60, behavior: 'smooth' });
      } else {
        makeSummary();
      }
    };
  }

  const btnPrev = $('#prev-step');
  if (btnPrev) {
    btnPrev.onclick = () => {
      saveCurrentStepInput();
      if (activeStep > 0) {
        activeStep--;
        currentAiStage = 1;
        renderForm();
        window.scrollTo({ top: $('#wizard').offsetTop - 60, behavior: 'smooth' });
      }
    };
  }

  // 載入金獎範例
  const btnLoadSample = $('#btn-load-sample');
  if (btnLoadSample) {
    btnLoadSample.onclick = () => {
      if (confirm('確定要載入「智慧尿袋與管路滲漏即時阻斷IoT裝置」金獎示範案例嗎？這會覆蓋目前的輸入內容。')) {
        values = { ...GOLDEN_SAMPLE };
        saveDraft();
        activeStep = 0;
        renderForm();
        showToast('🌟 已成功載入金獎示範案例！可依序點擊下一步閱讀各項目撰寫邏輯。');
      }
    };
  }

  // 清空重填
  const btnClear = $('#btn-clear-form');
  if (btnClear) {
    btnClear.onclick = () => {
      if (confirm('確定要清空所有填寫內容並重新開始嗎？')) {
        values = { ...defaultValues };
        localStorage.removeItem(STORAGE_KEY);
        activeStep = 0;
        currentAiStage = 1;
        renderForm();
        showToast('🗑️ 所有草稿已重置清空');
      }
    };
  }
}

// --------------------------------------------------------------------------
// 初始化入口
// --------------------------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
  initFontSize();
  renderCases();
  renderForm();
  initGlobalActions();
});
