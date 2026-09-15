export const posts = [
  {
    id: 'P-1021', handle: '@civic_voice_19',
    text: 'Fuel shortage tomorrow? Forward this before they delete it. Multiple districts will shut down.',
    language: 'EN', sentiment: 'Fear', risk: 86, category: 'Misinformation', timestamp: '14:03:12',
    cluster: 'C-RED', evidence: true, narrative: 'Fuel shortage rumor'
  },
  {
    id: 'P-1022', handle: '@bharat_update24',
    text: 'Kal se petrol pumps band hone wale hain. Share fast. #EmergencyUpdate',
    language: 'HI-EN', sentiment: 'Fear', risk: 91, category: 'Coordinated', timestamp: '14:03:19',
    cluster: 'C-RED', evidence: true, narrative: 'Fuel shortage rumor'
  },
  {
    id: 'P-1023', handle: '@citypulse_bot',
    text: 'BREAKING: 48-hour shutdown confirmed. Stock essentials NOW. #CityAlert',
    language: 'EN', sentiment: 'Alarm', risk: 94, category: 'Bot Activity', timestamp: '14:03:24',
    cluster: 'C-RED', evidence: true, narrative: 'Fuel shortage rumor'
  },
  {
    id: 'P-1024', handle: '@தமிழ்_செய்தி_now',
    text: 'நாளை நகரம் முழுவதும் போக்குவரத்து நிறுத்தம் என தகவல். அதிகாரப்பூர்வ உறுதி இல்லை.',
    language: 'TA', sentiment: 'Uncertain', risk: 61, category: 'Unverified', timestamp: '14:04:01',
    cluster: 'C-BLUE', evidence: false, narrative: 'Transport shutdown'
  },
  {
    id: 'P-1025', handle: '@localwatch_ind',
    text: 'No official advisory has been issued. Verify before sharing screenshots circulating online.',
    language: 'EN', sentiment: 'Neutral', risk: 18, category: 'Counter-signal', timestamp: '14:05:08',
    cluster: 'C-GREEN', evidence: false, narrative: 'Verification response'
  },
  {
    id: 'P-1026', handle: '@daily_wire_x',
    text: 'Same image, same wording, 14 accounts in 38 seconds. This looks coordinated.',
    language: 'EN', sentiment: 'Analytical', risk: 67, category: 'CIB Signal', timestamp: '14:05:43',
    cluster: 'C-BLUE', evidence: true, narrative: 'Coordinated campaign'
  },
  {
    id: 'P-1027', handle: '@publicdesk_07',
    text: 'Rumor tracker: claim remains unverified. Official channels show normal operations.',
    language: 'EN', sentiment: 'Neutral', risk: 14, category: 'Counter-signal', timestamp: '14:06:12',
    cluster: 'C-GREEN', evidence: false, narrative: 'Verification response'
  },
  {
    id: 'P-1028', handle: '@rapidnews_clone',
    text: 'URGENT URGENT URGENT — city services suspended from midnight. Reshare to every group.',
    language: 'EN', sentiment: 'Alarm', risk: 89, category: 'Bot Activity', timestamp: '14:06:20',
    cluster: 'C-RED', evidence: true, narrative: 'Transport shutdown'
  }
];

export const nodes = [
  { id:'n1', label:'@citypulse_bot', type:'hub', bot:0.96, centrality:0.92, cluster:'C-RED', synced:27 },
  { id:'n2', label:'@bharat_update24', type:'bot', bot:0.91, centrality:0.66, cluster:'C-RED', synced:22 },
  { id:'n3', label:'@rapidnews_clone', type:'bot', bot:0.94, centrality:0.71, cluster:'C-RED', synced:24 },
  { id:'n4', label:'@daily_flash_3', type:'bot', bot:0.88, centrality:0.59, cluster:'C-RED', synced:18 },
  { id:'n5', label:'@trendgrid_5', type:'bot', bot:0.86, centrality:0.55, cluster:'C-RED', synced:17 },
  { id:'n6', label:'@civic_voice_19', type:'human', bot:0.42, centrality:0.47, cluster:'C-RED', synced:8 },
  { id:'n7', label:'@localwatch_ind', type:'hub', bot:0.18, centrality:0.81, cluster:'C-BLUE', synced:2 },
  { id:'n8', label:'@தமிழ்_செய்தி_now', type:'human', bot:0.25, centrality:0.42, cluster:'C-BLUE', synced:3 },
  { id:'n9', label:'@district_eye', type:'human', bot:0.32, centrality:0.39, cluster:'C-BLUE', synced:4 },
  { id:'n10', label:'@publicdesk_07', type:'hub', bot:0.09, centrality:0.74, cluster:'C-GREEN', synced:1 },
  { id:'n11', label:'@factcheck_south', type:'human', bot:0.11, centrality:0.51, cluster:'C-GREEN', synced:1 },
  { id:'n12', label:'@newsroom_local', type:'human', bot:0.16, centrality:0.46, cluster:'C-GREEN', synced:2 }
];

export const edges = [
  ['n1','n2',true], ['n1','n3',true], ['n1','n4',true], ['n1','n5',true], ['n1','n6',true],
  ['n2','n3',true], ['n2','n6',true], ['n3','n4',true], ['n4','n5',true], ['n5','n6',true],
  ['n7','n8',false], ['n7','n9',false], ['n8','n9',false], ['n7','n2',false],
  ['n10','n11',false], ['n10','n12',false], ['n11','n12',false], ['n4','n11',false], ['n1','n10',false]
].map(([source,target,suspicious]) => ({ source, target, suspicious }));
