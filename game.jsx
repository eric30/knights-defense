/* 俠客守江山 – main game */
const { useState, useEffect, useRef, useMemo, useCallback } = React;

/* ---------------- Unit library ---------------- */
/* Each unit: id, name, cost, cd (seconds), hp, kind, attack interval, projectile, range, dmg */
const UNITS = [
  {
    id: "archer", name: "弓手", cost: 50, cd: 5, hp: 5,
    kind: "ranged", interval: 1.4, projectile: "arrow", dmg: 1,
    color: "#5c8a42", accent: "#b23a2a",
    desc: "基礎遠攻。每 1.4 秒射出一箭，穩定消耗。",
    tags: ["遠程", "單體"],
    title: "射雕手 · 黃忠舊部",
    story: "出身荊州獵戶，自幼拉弓射虎，後隨黃忠學藝。百步穿楊，箭無虛發，守城戰中最可靠的眼睛。",
  },
  {
    id: "swordsman", name: "刀客", cost: 100, cd: 12, hp: 12,
    kind: "melee", interval: 1.6, projectile: null, dmg: 1, 
    color: "#9c3a28", accent: "#2a241c",
    desc: "近身格擋，血厚。擋住敵人去路，每 1.6 秒揮刀一次。",
    tags: ["近戰", "肉盾"],
    title: "西涼刀客 · 馬家軍殘部",
    story: "西涼舊部流落中原，一身橫練，一把鐵刀。話少，但當敵人衝到面前，他只會往前踏一步。",
  },
  {
    id: "priest", name: "道士", cost: 175, cd: 14, hp: 5,
    kind: "ranged", interval: 3.0, projectile: "fire", dmg: 1, splash: true,
    color: "#c6a030", accent: "#4a3d0f",
    desc: "擲出符火，爆炸範圍傷害，對一群嘍囉最有效。",
    tags: ["遠程", "範圍"],
    title: "符籙道人 · 龍虎山下",
    story: "雲遊道士，畫符點火，一張黃紙能燒一片人。傳說他的符火引的是天雷，最恨妖教作亂。",
  },
  {
    id: "strategist", name: "軍師", cost: 50, cd: 14, hp: 4,
    kind: "slow", interval: 3.0, projectile: "star", dmg: 0, slow: 0.5, slowTime: 3,
    color: "#7b5ba0", accent: "#3a2b56",
    desc: "八卦陣星。不造傷害，但命中目標減速 50% 長達 3 秒。",
    tags: ["輔助", "減速"],
    title: "臥龍弟子 · 奇門遁甲",
    story: "諸葛丞相的再傳弟子。八卦陣星不殺人，但讓敵人寸步難行——有時比殺更可怕。",
  },
  {
    id: "crossbow", name: "連弩車", cost: 175, cd: 9, hp: 10,
    kind: "ranged", interval: 0.6, projectile: "arrow", dmg: 1,
    color: "#8a6a3a", accent: "#3e2912",
    desc: "機關連珠箭，攻速極快。火力覆蓋首選。",
    tags: ["機關", "高攻速"],
    title: "元戎連弩 · 蜀漢秘兵",
    story: "諸葛連弩改良版，一次十矢齊發。蜀漢壓箱底的機關，如今流落民間莊院。",
  },
  {
    id: "well", name: "聚氣陣", cost: 50, cd: 12, hp: 5,
    kind: "producer", interval: 10, produce: 25,
    color: "#3e8a7a", accent: "#153e39",
    desc: "佈陣吸納天地靈氣，每 10 秒生成一顆內力（+25 氣）。",
    tags: ["機關", "產氣"],
    title: "聚氣陣 · 五行引",
    story: "依五行方位埋設的丹爐，引地脈之氣。懂行的人一看就知道：這玩意兒比金銀還貴重。",
  },
  {
    id: "monk", name: "僧兵", cost: 200, cd: 20, hp: 18,
    kind: "melee", interval: 1.3, projectile: null, dmg: 2,
    color: "#b88040", accent: "#5a3a18",
    desc: "少林鐵布衫，血量極厚，近身棍打。最強的肉盾。",
    tags: ["近戰", "超厚血"],
    title: "嵩山武僧 · 十三棍",
    story: "少林羅漢堂出身，鐵布衫練到第九重。一根齊眉棍，替天下冤屈討公道。",
  },
  {
    id: "thrower", name: "擲鏢客", cost: 100, cd: 8, hp: 5,
    kind: "ranged", interval: 0.9, projectile: "star", dmg: 1,
    color: "#4a6e8a", accent: "#1a2e40",
    desc: "江湖暗器，飛鏢快速射出，單體攻速比弓手更快。",
    tags: ["遠程", "連射"],
    title: "江南擲鏢客 · 暗器世家",
    story: "蘇州暗器世家的獨子，一身青布短衣，袖裡藏七星。快、準、狠，連眨眼都能要命。",
  },
  {
    id: "flame", name: "火焰陣", cost: 200, cd: 18, hp: 4,
    kind: "ranged", interval: 2.4, projectile: "fire", dmg: 3, splash: true,
    color: "#d13a20", accent: "#6a1a0a",
    desc: "機關噴火，高傷大範圍，適合清一大群敵人。",
    tags: ["機關", "範圍", "高傷"],
    title: "火焰陣 · 赤壁遺法",
    story: "周郎破曹時所用火計的縮小版。一座鐵爐點燃，三丈內皆是修羅場。",
  },
  {
    id: "spearman", name: "長槍兵", cost: 150, cd: 11, hp: 10,
    kind: "pierce", interval: 1.5, projectile: null, dmg: 2, pierce: 2,
    color: "#6a5a30", accent: "#2a2010",
    desc: "前方 2 格槍刺，可同時扎到兩個敵人。半近半遠。",
    tags: ["近戰", "穿透"],
    title: "白馬長槍兵 · 趙雲門下",
    story: "常山趙子龍的親兵後人，一桿丈八長槍。身在後排，卻能一刺串兩敵，進退有度。",
  },
];

/* Enemy library – diverse attack patterns */
const ENEMIES = [
  { id: "infantry", name: "小嘍囉", hp: 4,  speed: 0.0013, dmg: 1, color: "#6a5130", kind: "melee", interval: 1.1,
    title: "黃巾散兵", story: "頭裹黃巾的流民，手持鋸齒刀，為一口飽飯上戰場。人數最多，但一觸即潰。" },
  { id: "shield",   name: "盾兵",   hp: 12, speed: 0.0010, dmg: 1, color: "#4a4a4a", kind: "melee", interval: 1.4,
    title: "重盾死士", story: "一人高的鐵木盾，擋刀擋箭。移動極慢，但一旦頂到前排就很難撼動。" },
  { id: "fast",     name: "蒙面刺客", hp: 3,  speed: 0.0025, dmg: 2, color: "#2a2a2a", kind: "melee", interval: 0.8,
    title: "夜行刺客", story: "江湖上被買通的殺手，黑巾蒙面，來去如影。血不厚，但一刀致命。" },
  { id: "archer",   name: "敵弓手",   hp: 3,  speed: 0.0012, dmg: 1, color: "#3a5540", kind: "ranged", interval: 2.2, projectile: "arrow",
    title: "山林獵戶（被擄）", story: "被山賊脅迫的獵戶，站後排冷箭偷襲。只要你的前排倒了，他的箭就會穿過整條走道。" },
  { id: "cannon",   name: "火砲車",   hp: 10, speed: 0.0007, dmg: 2, color: "#6b4a2b", kind: "ranged", interval: 3.0, projectile: "bomb", splash: true,
    title: "魔教火砲車", story: "改裝過的攻城器，填的是火藥與鐵釘。一發下來濺射整排，慢但致命。" },
  { id: "healer",   name: "妖僧",     hp: 6,  speed: 0.0009, dmg: 0, color: "#5a3e8a", kind: "healer", interval: 2.5, heal: 3,
    title: "妖教護法僧", story: "自稱佛門，實為妖教。口唸偽咒，能讓身邊重傷的同夥瞬間回血。不除此人，全排難倒。" },
  { id: "leaper",   name: "飛賊",     hp: 5,  speed: 0.0020, dmg: 1, color: "#8a3a5a", kind: "leap", interval: 1.0,
    title: "輕功飛賊", story: "一身黑衣的梁上君子。碰到擋路的俠客能一個縱身躍過去，前排肉盾對他沒用。" },
  { id: "boss",     name: "魔教護法", hp: 30, speed: 0.0008, dmg: 2, color: "#7a1e30", kind: "melee", interval: 1.2,
    title: "魔教左護法", story: "張角失蹤後殘部之首，頭戴鐵角盔，一身橫練。血厚力強，是最後壓場的大魔王。" },
];

/* ---------------- Campaign ---------------- */
const CAMPAIGNS = [
  {
    id: "yellow_turban", name: "黃巾之亂", era: "漢靈帝 · 中平元年",
    location: "冀州 · 廣宗城外",
    intro: "蒼天已死，黃天當立。張角兄弟率黃巾軍縱橫河北，流民被蠱惑，四野烽煙。你奉命守下廣宗城外的一處莊院，等待盧植大軍馳援。",
    enemies: ["infantry", "shield", "fast", "archer"],
    waves: 6,
  },
  {
    id: "hulao_pass", name: "虎牢關前", era: "漢獻帝 · 初平元年",
    location: "司隸 · 虎牢關外",
    intro: "董卓逆天，諸侯共討。呂布奉命守虎牢，派出悍將試探聯軍。你是聯軍先鋒，在關外一小山坳結陣，擋住西涼鐵騎的頭陣。",
    enemies: ["infantry", "shield", "archer", "leaper", "fast"],
    waves: 8,
  },
  {
    id: "changban", name: "長坂坡之役", era: "漢獻帝 · 建安十三年",
    location: "荊州 · 當陽長坂",
    intro: "劉皇叔棄新野南逃，百姓扶老攜幼隨行。曹軍虎豹騎追至長坂坡。你是斷後的義軍，必須撐到趙子龍將主公送出。",
    enemies: ["infantry", "fast", "shield", "archer", "cannon", "leaper"],
    waves: 9,
  },
  {
    id: "chibi", name: "赤壁鏖兵", era: "漢獻帝 · 建安十三年冬",
    location: "荊州 · 赤壁江畔",
    intro: "曹公八十萬眾，飲馬長江。孫劉聯軍僅數萬，卻要以火計破之。你領一小隊守住江邊烽火台，引曹兵入陷阱——只要不讓他們撲滅信號台。",
    enemies: ["infantry", "shield", "archer", "cannon", "fast", "leaper", "healer"],
    waves: 10,
  },
];


/* Wave composition – escalating difficulty */
const WAVES = [
  // Wave 1
  [["infantry", 3]],
  // Wave 2
  [["infantry", 4], ["fast", 1]],
  // Wave 3
  [["infantry", 4], ["archer", 1], ["fast", 2]],
  // Wave 4
  [["shield", 2], ["infantry", 4], ["archer", 2], ["fast", 1]],
  // Wave 5
  [["leaper", 1], ["fast", 3], ["infantry", 4], ["archer", 2]],
  // Wave 6
  [["cannon", 1], ["shield", 3], ["fast", 3], ["infantry", 4], ["archer", 1]],
  // Wave 7
  [["healer", 1], ["infantry", 6], ["archer", 3], ["shield", 2], ["fast", 2]],
  // Wave 8
  [["cannon", 2], ["leaper", 2], ["archer", 3], ["shield", 3], ["infantry", 5], ["fast", 2]],
  // Wave 9
  [["healer", 2], ["cannon", 2], ["shield", 4], ["archer", 3], ["fast", 4], ["infantry", 6], ["leaper", 1]],
  // Wave 10
  [["leaper", 3], ["cannon", 2], ["healer", 1], ["archer", 4], ["shield", 4], ["fast", 5], ["infantry", 7]],
  // Wave 11
  [["cannon", 3], ["healer", 2], ["leaper", 3], ["archer", 4], ["shield", 5], ["fast", 5], ["infantry", 8]],
  // Wave 12 – final boss
  [["boss", 1], ["healer", 2], ["cannon", 3], ["leaper", 3], ["archer", 5], ["shield", 5], ["fast", 6], ["infantry", 10]],
];

/* ---------------- SVG sprites (Q-版, original & simple) ---------------- */
function UnitSprite({ unit, size = 56 }) {
  const c = unit.color, a = unit.accent;
  // simple stylised chibi: head + robe + motif
  return (
    <svg width={size} height={size} viewBox="0 0 64 64">
      <defs>
        <radialGradient id={`sh-${unit.id}`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgba(0,0,0,.35)" />
          <stop offset="100%" stopColor="rgba(0,0,0,0)" />
        </radialGradient>
      </defs>
      <ellipse cx="32" cy="56" rx="16" ry="4" fill={`url(#sh-${unit.id})`} />
      {/* robe */}
      <path d={`M14,54 L14,34 Q14,24 24,22 L40,22 Q50,24 50,34 L50,54 Z`} fill={c} stroke={a} strokeWidth="2" />
      {/* belt */}
      <rect x="14" y="40" width="36" height="4" fill={a} />
      {/* head */}
      <circle cx="32" cy="20" r="11" fill="#f6d8b4" stroke={a} strokeWidth="2" />
      {/* hair band */}
      <path d="M21,18 Q32,10 43,18" fill="none" stroke={a} strokeWidth="2.2" />
      {/* eyes */}
      <circle cx="28" cy="21" r="1.4" fill={a} />
      <circle cx="36" cy="21" r="1.4" fill={a} />
      {/* mouth */}
      <path d="M29,25 Q32,27 35,25" fill="none" stroke={a} strokeWidth="1.4" strokeLinecap="round" />
      {/* per-unit motif */}
      {unit.id === "archer" && (
        <g>
          <path d="M46,28 Q58,38 46,50" fill="none" stroke={a} strokeWidth="2.2" />
          <line x1="46" y1="28" x2="46" y2="50" stroke={a} strokeWidth="1" />
        </g>
      )}
      {unit.id === "swordsman" && (
        <g>
          <rect x="48" y="14" width="4" height="32" fill="#d4d4d4" stroke={a} strokeWidth="1.2" />
          <rect x="46" y="44" width="8" height="3" fill={a} />
          <rect x="49" y="46" width="2" height="8" fill="#6b4a2b" />
        </g>
      )}
      {unit.id === "priest" && (
        <g>
          <circle cx="32" cy="38" r="6" fill="#f7e79b" stroke={a} strokeWidth="1.5" />
          <path d="M28,35 L36,35 M32,32 L32,42 M29,41 L35,41" stroke={a} strokeWidth="1.2" fill="none" />
          {/* hat */}
          <path d="M20,12 L44,12 L40,18 L24,18 Z" fill={a} />
        </g>
      )}
      {unit.id === "strategist" && (
        <g>
          <path d="M14,12 L22,6 L30,12 L22,18 Z" fill="#fff6e1" stroke={a} strokeWidth="1.5" />
          <line x1="22" y1="6" x2="22" y2="26" stroke={a} strokeWidth="1.2" />
          <path d="M14,44 Q22,40 30,44 L30,48 Q22,46 14,48 Z" fill="#fff6e1" stroke={a} strokeWidth="1.2" />
        </g>
      )}
      {unit.id === "crossbow" && (
        <g>
          <rect x="10" y="34" width="44" height="10" fill="#6b4a2b" stroke={a} strokeWidth="1.5" rx="1" />
          <rect x="12" y="28" width="8" height="8" fill="#3e2912" />
          <line x1="52" y1="39" x2="62" y2="39" stroke={a} strokeWidth="2" />
          <circle cx="18" cy="50" r="5" fill="#3e2912" stroke={a} strokeWidth="1.2" />
          <circle cx="46" cy="50" r="5" fill="#3e2912" stroke={a} strokeWidth="1.2" />
        </g>
      )}
      {unit.id === "well" && (
        <g>
          <rect x="16" y="36" width="32" height="18" fill="#8a6a3a" stroke={a} strokeWidth="1.5" rx="2" />
          <rect x="16" y="36" width="32" height="4" fill={a} />
          <path d="M20,36 L20,22 L44,22 L44,36" fill="none" stroke={a} strokeWidth="2" />
          <path d="M18,22 L46,22" stroke={a} strokeWidth="2" />
          <circle cx="32" cy="45" r="4" fill="#f4d24b" stroke={a} strokeWidth="1.2" />
        </g>
      )}
      {unit.id === "monk" && (
        <g>
          {/* bald + yellow robe already from base; add staff */}
          <path d="M21,14 Q32,8 43,14" fill="none" stroke={a} strokeWidth="2.2" />
          <circle cx="26" cy="17" r="0.8" fill={a} />
          <circle cx="32" cy="15" r="0.8" fill={a} />
          <circle cx="38" cy="17" r="0.8" fill={a} />
          <rect x="50" y="14" width="3" height="40" fill="#6b4a2b" stroke={a} strokeWidth="1" />
          <circle cx="51.5" cy="12" r="3.5" fill="#f4d24b" stroke={a} strokeWidth="1.2" />
          <path d="M15,40 Q32,46 49,40" fill="none" stroke="#f4d24b" strokeWidth="1.5" />
        </g>
      )}
      {unit.id === "thrower" && (
        <g>
          {/* belt of throwing stars */}
          <path d="M16,44 L48,38" stroke={a} strokeWidth="2" fill="none" />
          <polygon points="20,42 22,40 24,42 22,44" fill="#cfd8dc" stroke={a} strokeWidth="0.6" />
          <polygon points="30,41 32,39 34,41 32,43" fill="#cfd8dc" stroke={a} strokeWidth="0.6" />
          <polygon points="40,40 42,38 44,40 42,42" fill="#cfd8dc" stroke={a} strokeWidth="0.6" />
          {/* bandana */}
          <path d="M21,14 L43,14 L42,18 L22,18 Z" fill={a} />
          <path d="M43,14 L52,20" stroke={a} strokeWidth="1.5" fill="none" />
        </g>
      )}
      {unit.id === "flame" && (
        <g>
          {/* iron brazier */}
          <rect x="14" y="44" width="36" height="10" fill="#3a2a1a" stroke={a} strokeWidth="1.5" rx="2" />
          <rect x="10" y="40" width="44" height="6" fill="#2a1a08" stroke={a} strokeWidth="1.5" />
          {/* flames */}
          <path d="M20,40 Q18,30 24,26 Q22,34 28,30 Q26,38 32,24 Q34,36 38,30 Q36,34 42,26 Q48,30 44,40 Z"
            fill="#ff9840" stroke={a} strokeWidth="1.2" />
          <path d="M28,34 Q30,28 32,34 Q34,28 36,34" fill="#ffe08a" />
          {/* legs */}
          <rect x="16" y="54" width="4" height="6" fill="#3a2a1a" />
          <rect x="44" y="54" width="4" height="6" fill="#3a2a1a" />
        </g>
      )}
      {unit.id === "spearman" && (
        <g>
          {/* long spear extending right */}
          <rect x="44" y="31" width="18" height="2.5" fill="#6b4a2b" stroke={a} strokeWidth="0.8" />
          <path d="M60,29 L64,32 L60,35 Z" fill="#cfd8dc" stroke={a} strokeWidth="1" />
          <circle cx="44" cy="32" r="1.5" fill="#b23a2a" />
          {/* hat */}
          <path d="M20,14 Q32,6 44,14 L40,18 L24,18 Z" fill={a} />
          <path d="M32,6 L32,14" stroke="#b23a2a" strokeWidth="1.2" />
        </g>
      )}
    </svg>
  );
}

function EnemySprite({ enemy, size = 48 }) {
  const c = enemy.color;
  return (
    <svg width={size} height={size} viewBox="0 0 64 64">
      <ellipse cx="32" cy="58" rx="14" ry="3" fill="rgba(0,0,0,.3)" />
      {/* legs */}
      <rect x="24" y="48" width="5" height="10" fill="#3a2a1a" />
      <rect x="35" y="48" width="5" height="10" fill="#3a2a1a" />
      {/* body */}
      <path d="M18,48 L18,32 Q18,24 32,24 Q46,24 46,32 L46,48 Z" fill={c} stroke="#1a130a" strokeWidth="2" />
      {/* belt */}
      <rect x="18" y="40" width="28" height="3" fill="#2a1a08" />
      {/* head/mask */}
      <circle cx="32" cy="20" r="10" fill="#f6d8b4" stroke="#1a130a" strokeWidth="2" />
      {/* mask */}
      {enemy.id === "fast" && (
        <rect x="22" y="18" width="20" height="5" fill="#1a130a" />
      )}
      {enemy.id === "shield" && (
        <g>
          <path d="M10,30 Q8,40 12,50 Q14,44 14,38 Q14,32 10,30 Z" fill="#c9a24a" stroke="#1a130a" strokeWidth="1.5" />
          <circle cx="12" cy="40" r="2" fill="#b23a2a" />
        </g>
      )}
      {enemy.id === "boss" && (
        <g>
          {/* horned helmet */}
          <path d="M22,12 L22,20 L42,20 L42,12 Q32,6 22,12 Z" fill="#2a241c" />
          <path d="M22,12 L16,4 M42,12 L48,4" stroke="#2a241c" strokeWidth="2.5" strokeLinecap="round" />
        </g>
      )}
      {enemy.id === "archer" && (
        <g>
          {/* bandana */}
          <path d="M21,16 Q32,12 43,16 L43,20 L21,20 Z" fill="#3a5540" stroke="#1a130a" strokeWidth="1.2" />
        </g>
      )}
      {enemy.id === "cannon" && (
        <g>
          {/* cart wheels */}
          <circle cx="22" cy="54" r="5" fill="#3e2912" stroke="#1a130a" strokeWidth="1.2" />
          <circle cx="42" cy="54" r="5" fill="#3e2912" stroke="#1a130a" strokeWidth="1.2" />
          {/* barrel on body */}
          <rect x="40" y="26" width="18" height="8" fill="#2a241c" stroke="#1a130a" strokeWidth="1.2" rx="2" />
          <circle cx="58" cy="30" r="3" fill="#1a130a" />
        </g>
      )}
      {enemy.id === "healer" && (
        <g>
          {/* monk hood */}
          <path d="M20,14 Q32,6 44,14 L40,22 L24,22 Z" fill="#5a3e8a" stroke="#1a130a" strokeWidth="1.2" />
          {/* prayer beads */}
          <circle cx="26" cy="44" r="1.6" fill="#f7e79b" />
          <circle cx="32" cy="46" r="1.6" fill="#f7e79b" />
          <circle cx="38" cy="44" r="1.6" fill="#f7e79b" />
        </g>
      )}
      {enemy.id === "leaper" && (
        <g>
          {/* ninja mask */}
          <rect x="21" y="14" width="22" height="5" fill="#1a130a" />
          <rect x="22" y="22" width="20" height="4" fill="#1a130a" />
        </g>
      )}
      {/* eyes */}
      <circle cx="28" cy="21" r="1.2" fill="#1a130a" />
      <circle cx="36" cy="21" r="1.2" fill="#1a130a" />
      {/* weapon */}
      {enemy.id === "infantry" && (
        <g>
          <rect x="48" y="18" width="3" height="28" fill="#8a6a3a" />
          <path d="M46,14 L53,14 L49,22 Z" fill="#cfd8dc" stroke="#1a130a" strokeWidth="1" />
        </g>
      )}
      {enemy.id === "fast" && (
        <g>
          <path d="M8,38 L2,30 L6,28 L12,36 Z" fill="#cfd8dc" stroke="#1a130a" strokeWidth="1" />
        </g>
      )}
      {enemy.id === "boss" && (
        <g>
          <rect x="48" y="14" width="3" height="34" fill="#8a6a3a" />
          <path d="M44,10 L56,10 L50,22 Z" fill="#b23a2a" stroke="#1a130a" strokeWidth="1" />
        </g>
      )}
      {enemy.id === "archer" && (
        <g>
          {/* bow */}
          <path d="M50,20 Q60,32 50,44" fill="none" stroke="#1a130a" strokeWidth="2" />
          <line x1="50" y1="20" x2="50" y2="44" stroke="#5a3e20" strokeWidth="1" />
        </g>
      )}
      {enemy.id === "leaper" && (
        <g>
          {/* short sword */}
          <rect x="48" y="28" width="2.5" height="14" fill="#cfd8dc" stroke="#1a130a" strokeWidth="1" />
          <rect x="46" y="40" width="7" height="2" fill="#1a130a" />
        </g>
      )}
    </svg>
  );
}

/* Small decorative sprites on the field */
function Pagoda({ x = 92, y = 20 }) {
  return (
    <div className="entity" style={{ left: `${x}%`, top: `${y}%` }}>
      <svg width="68" height="88" viewBox="0 0 68 88">
        <path d="M14,86 L54,86 L54,74 L14,74 Z" fill="#c9a24a" stroke="#2a241c" strokeWidth="2" />
        <path d="M8,74 L60,74 L54,66 L14,66 Z" fill="#b23a2a" stroke="#2a241c" strokeWidth="2" />
        <path d="M18,66 L50,66 L50,54 L18,54 Z" fill="#ead9b0" stroke="#2a241c" strokeWidth="2" />
        <rect x="30" y="58" width="8" height="8" fill="#2a241c" />
        <path d="M10,54 L58,54 L52,46 L16,46 Z" fill="#7d2519" stroke="#2a241c" strokeWidth="2" />
        <path d="M22,46 L46,46 L46,34 L22,34 Z" fill="#ead9b0" stroke="#2a241c" strokeWidth="2" />
        <rect x="32" y="38" width="4" height="8" fill="#2a241c" />
        <path d="M14,34 L54,34 L48,26 L20,26 Z" fill="#b23a2a" stroke="#2a241c" strokeWidth="2" />
        <path d="M34,26 L34,10" stroke="#2a241c" strokeWidth="2" />
        <circle cx="34" cy="8" r="4" fill="#c9a24a" stroke="#2a241c" strokeWidth="2" />
      </svg>
    </div>
  );
}

function Tree({ x, y, size = 40 }) {
  return (
    <div className="entity" style={{ left: `${x}%`, top: `${y}%` }}>
      <svg width={size} height={size*1.2} viewBox="0 0 40 48">
        <ellipse cx="20" cy="44" rx="10" ry="2" fill="rgba(0,0,0,.25)" />
        <rect x="17" y="26" width="6" height="16" fill="#6b4a2b" />
        <circle cx="20" cy="20" r="14" fill="#4f7034" />
        <circle cx="12" cy="16" r="8" fill="#5a8040" />
        <circle cx="28" cy="18" r="9" fill="#5a8040" />
      </svg>
    </div>
  );
}

function Rock({ x, y }) {
  return (
    <div className="entity" style={{ left: `${x}%`, top: `${y}%` }}>
      <svg width="34" height="22" viewBox="0 0 34 22">
        <ellipse cx="17" cy="20" rx="14" ry="2" fill="rgba(0,0,0,.25)" />
        <path d="M4,18 Q2,10 10,6 Q20,2 28,8 Q34,14 30,18 Z" fill="#9c9283" stroke="#2a241c" strokeWidth="1.5" />
        <path d="M10,12 L16,10 M20,14 L26,12" stroke="#2a241c" strokeWidth="1" />
      </svg>
    </div>
  );
}

/* ---------------- Game component ---------------- */
const ROWS = 5, COLS = 9;

function Battle({ roster, campaign, onExit }) {
  /* Tweaks */
  const [tweaks, setTweaks] = useState(() => ({...window.__TWEAKS}));
  /* Randomize day/night per battle (ignore tweak value) */
  const [isNight] = useState(() => Math.random() < 0.5);
  /* Filter unit library by selected roster */
  const ACTIVE_UNITS = useMemo(
    () => UNITS.filter(u => !roster || roster.includes(u.id)),
    [roster]
  );
  useEffect(() => {
    const h = (e) => setTweaks({...e.detail});
    window.addEventListener('tweaks-change', h);
    return () => window.removeEventListener('tweaks-change', h);
  }, []);

  /* Core game state */
  const [qi, setQi] = useState(tweaks.startQi || 100);
  const [selected, setSelected] = useState(null);       // unit id being placed
  const [recallMode, setRecallMode] = useState(false);  // whistle active — click to recall unit
  const [placements, setPlacements] = useState([]);     // {id, unit, row, col, hp, lastAttack, nextProduce}
  const [enemies, setEnemies] = useState([]);           // {id, type, row, x (0-1 along lane), hp, slowUntil}
  const [projectiles, setProjectiles] = useState([]);   // {id, row, fromCol, x, dmg, kind, splash, slow, slowTime}
  const [orbs, setOrbs] = useState([]);                 // free qi orbs {id, x, y, value, expireAt}
  const [cooldowns, setCooldowns] = useState({});       // unitId -> readyAtTs
  const [wave, setWave] = useState(0);
  const [waveState, setWaveState] = useState("idle");   // idle | spawning | active | cleared | won | lost
  const [toast, setToast] = useState(null);
  const [prepLeft, setPrepLeft] = useState(0);
  const [paused, setPaused] = useState(false);
  const [confirmRestart, setConfirmRestart] = useState(false);
  const [time, setTime] = useState(0);                  // accumulated seconds
  const idCounter = useRef(1);
  const nextId = () => idCounter.current++;
  const lastTs = useRef(performance.now());
  const prepTimerRef = useRef(null);

  /* Tweak widget wiring */
  useEffect(() => {
    const swNight = document.getElementById('sw-night');
    const qiRate = document.getElementById('qi-rate');
    const qiStart = document.getElementById('qi-start');
    const rosterEl = document.getElementById('roster-size');
    const sync = () => {
      if (swNight) swNight.classList.toggle('on', !!tweaks.night);
      qiRate.value = tweaks.qiPerSecond;
      qiStart.value = tweaks.startQi;
      if (rosterEl) rosterEl.value = tweaks.rosterSize || 6;
    };
    sync();
    const onNight = () => window.__persistTweak({ night: !window.__TWEAKS.night });
    const onRate = (e) => window.__persistTweak({ qiPerSecond: +e.target.value });
    const onStart = (e) => window.__persistTweak({ startQi: +e.target.value });
    const onRoster = (e) => window.__persistTweak({ rosterSize: +e.target.value });
    if (swNight) swNight.addEventListener('click', onNight);
    qiRate.addEventListener('input', onRate);
    qiStart.addEventListener('input', onStart);
    if (rosterEl) rosterEl.addEventListener('input', onRoster);
    return () => {
      if (swNight) swNight.removeEventListener('click', onNight);
      qiRate.removeEventListener('input', onRate);
      qiStart.removeEventListener('input', onStart);
      if (rosterEl) rosterEl.removeEventListener('input', onRoster);
    };
  }, [tweaks]);

  /* Wave spawner */
  const spawnQueue = useRef([]);
  const spawnTimer = useRef(0);

  const startWave = useCallback((w) => {
    if (w >= WAVES.length) return;
    const plan = WAVES[w];
    const list = [];
    plan.forEach(([type, count]) => {
      for (let i = 0; i < count; i++) list.push(type);
    });
    // shuffle a bit
    list.sort(() => Math.random() - 0.5);
    spawnQueue.current = list;
    spawnTimer.current = 1.0;
    setWaveState("spawning");
    setToast({ msg: `第 ${w+1} 波 · 敵來！`, key: Date.now() });
  }, []);

  /* Start first wave after a delay */
  useEffect(() => {
    // Only run when actually idle at wave 0 AND no prep timer yet
    if (wave === 0 && waveState === "idle" && !prepTimerRef.current) {
      setWaveState("prep");
      setPrepLeft(7);
      const start = performance.now();
      prepTimerRef.current = setInterval(() => {
        const left = Math.max(0, 7 - (performance.now() - start) / 1000);
        setPrepLeft(left);
        if (left <= 0) {
          clearInterval(prepTimerRef.current);
          prepTimerRef.current = null;
          startWave(0);
        }
      }, 100);
    }
    // No cleanup that clears the interval on re-render; the interval self-terminates.
  }, [wave, waveState, startWave]);

  // Clear prep timer on unmount only
  useEffect(() => () => {
    if (prepTimerRef.current) { clearInterval(prepTimerRef.current); prepTimerRef.current = null; }
  }, []);

  /* Main tick */
  useEffect(() => {
    let raf;
    const loop = (now) => {
      const dt = Math.min(0.05, (now - lastTs.current) / 1000);
      lastTs.current = now;
      if (!paused && waveState !== "won" && waveState !== "lost") {
        step(dt);
        setTime(t => t + dt);
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paused, waveState, placements, enemies, projectiles, orbs, cooldowns, wave, tweaks]);

  function step(dt) {
    /* Passive qi */
    const qiGain = (tweaks.qiPerSecond / 10) * dt; // slow ambient
    setQi(q => Math.min(999, q + qiGain));

    /* Random natural qi orbs */
    if (Math.random() < dt * 0.18) {
      setOrbs(o => [...o, {
        id: nextId(),
        x: 10 + Math.random() * 78,
        y: 10 + Math.random() * 80,
        value: 25,
        expireAt: performance.now() + 6000,
      }]);
    }
    /* Clean expired orbs */
    setOrbs(o => o.filter(x => x.expireAt > performance.now()));

    /* Spawn enemies for current wave */
    if (waveState === "spawning") {
      spawnTimer.current -= dt;
      if (spawnTimer.current <= 0 && spawnQueue.current.length) {
        const type = spawnQueue.current.shift();
        const row = Math.floor(Math.random() * ROWS);
        const data = ENEMIES.find(e => e.id === type);
        setEnemies(es => [...es, {
          id: nextId(), type, row, x: 0, hp: data.hp, slowUntil: 0,
        }]);
        spawnTimer.current = 2.8 + Math.random() * 1.8;
      }
      if (!spawnQueue.current.length) setWaveState("active");
    }

    /* Placements: attack / produce */
    setPlacements(ps => {
      let changed = false;
      const now = performance.now();
      const next = ps.map(p => {
        const u = p.unit;
        /* producer */
        if (u.kind === "producer") {
          if (!p.nextProduce || now >= p.nextProduce) {
            // spawn orb near producer
            setOrbs(o => [...o, {
              id: nextId(),
              x: colX(p.col) + (Math.random()*6-3),
              y: rowY(p.row) + (Math.random()*6-3),
              value: u.produce,
              expireAt: now + 7000,
            }]);
            changed = true;
            return { ...p, nextProduce: now + u.interval * 1000 };
          }
          return p;
        }
        /* attackers target enemies to the LEFT of the unit (enemies come from left, walk right) */
        // target any enemy in same row whose col <= unit's col + 0.5 (anywhere ahead/at unit)
        const lanesEnemies = enemies.filter(e => e.row === p.row && e.x * COLS <= p.col + 0.5);
        // pick the closest to the unit (largest x, i.e. nearest from left)
        const target = lanesEnemies.sort((a,b) => b.x - a.x)[0];
        if (!target) return p;
        if (u.kind === "melee") {
          // melee engages if enemy is right next to (or overlapping) the unit
          const enemyCol = target.x * COLS;
          if (enemyCol >= p.col - 0.6 && enemyCol <= p.col + 0.6) {
            if (!p.lastAttack || now - p.lastAttack >= u.interval * 1000) {
              setEnemies(es => es.map(e => e.id === target.id ? { ...e, hp: e.hp - u.dmg } : e));
              changed = true;
              return { ...p, lastAttack: now };
            }
          }
          return p;
        }
        if (u.kind === "pierce") {
          // Spear hits enemies within next ~2 columns in same row
          const range = (u.pierce || 2);
          const hits = lanesEnemies
            .filter(e => {
              const ec = e.x * COLS;
              return ec >= p.col - 0.3 && ec <= p.col + range + 0.5;
            })
            .sort((a,b) => a.x - b.x)
            .slice(0, range);
          if (hits.length > 0 && (!p.lastAttack || now - p.lastAttack >= u.interval * 1000)) {
            const ids = new Set(hits.map(h => h.id));
            setEnemies(es => es.map(e => ids.has(e.id) ? { ...e, hp: e.hp - u.dmg } : e));
            // spawn a short spear-flash projectile for visual
            setProjectiles(prs => [...prs, {
              id: nextId(), row: p.row, x: (p.col + 0.5) / COLS,
              dmg: 0, kind: "spear", splash: false, life: 0.25,
            }]);
            changed = true;
            return { ...p, lastAttack: now };
          }
          return p;
        }
        /* ranged / slow – fire projectile that flies left */
        if (!p.lastAttack || now - p.lastAttack >= u.interval * 1000) {
          setProjectiles(prs => [...prs, {
            id: nextId(),
            row: p.row,
            x: (p.col + 0.5) / COLS,
            dmg: u.dmg,
            kind: u.projectile,
            splash: u.splash,
            slow: u.slow, slowTime: u.slowTime,
          }]);
          changed = true;
          return { ...p, lastAttack: now };
        }
        return p;
      });
      return changed ? next : ps;
    });

    /* Move enemies + enemy attacks */
    setEnemies(es => {
      const now = performance.now();
      let lost = false;
      const next = es.map(e => {
        const data = ENEMIES.find(x => x.id === e.type);
        const slowFactor = e.slowUntil > now ? 0.5 : 1;
        const enemyCol = e.x * COLS;

        // Leapers: if leaping, fly over a unit
        if (data.kind === "leap" && e.leapUntil && e.leapUntil > now) {
          const nx = e.x + data.speed * 2.2 * slowFactor * dt * 60;
          if (nx >= 1) lost = true;
          return { ...e, x: nx };
        }

        // Healer: heal nearby allies periodically; still walks if unblocked
        if (data.kind === "healer") {
          if (!e.lastAttack || now - e.lastAttack >= data.interval * 1000) {
            // heal weakest nearby enemy in same row (or adjacent)
            let healed = false;
            setEnemies(es2 => es2.map(other => {
              if (healed || other.id === e.id) return other;
              if (Math.abs(other.row - e.row) <= 1 && Math.abs(other.x - e.x) < 0.15) {
                const od = ENEMIES.find(x => x.id === other.type);
                if (other.hp < od.hp) {
                  healed = true;
                  return { ...other, hp: Math.min(od.hp, other.hp + data.heal) };
                }
              }
              return other;
            }));
            if (healed) e = { ...e, lastAttack: now };
          }
        }

        // Check for blocker
        const blocker = placements.find(p => p.row === e.row
          && Math.abs(enemyCol - p.col) < 0.55);

        if (blocker) {
          // Leaper: if can leap and hasn't leaped yet, trigger leap
          if (data.kind === "leap" && !e.hasLeaped) {
            return { ...e, hasLeaped: true, leapUntil: now + 900 };
          }
          // Ranged enemies fire projectiles at the blocker (slower, stays in place)
          if (data.kind === "ranged") {
            if (!e.lastAttack || now - e.lastAttack >= data.interval * 1000) {
              setProjectiles(prs => [...prs, {
                id: nextId(),
                row: e.row,
                x: e.x,
                dmg: data.dmg,
                kind: data.projectile,
                splash: data.splash,
                enemy: true, // flies right toward units
              }]);
              return { ...e, lastAttack: now };
            }
            return e;
          }
          // Melee (+boss): deal damage on interval
          if (!e.lastAttack || now - e.lastAttack >= data.interval * 1000) {
            setPlacements(ps => ps.map(pp => pp.id === blocker.id
              ? { ...pp, hp: pp.hp - data.dmg }
              : pp
            ));
            return { ...e, lastAttack: now };
          }
          return e;
        }

        // Ranged enemies also shoot when unit is ahead of them in same row (even if no blocker right next to them)
        if (data.kind === "ranged") {
          const target = placements.find(p => p.row === e.row && p.col < enemyCol);
          if (target && (!e.lastAttack || now - e.lastAttack >= data.interval * 1000)) {
            setProjectiles(prs => [...prs, {
              id: nextId(),
              row: e.row,
              x: e.x,
              dmg: data.dmg,
              kind: data.projectile,
              splash: data.splash,
              enemy: true,
            }]);
            e = { ...e, lastAttack: now };
          }
        }

        // walk
        const nx = e.x + data.speed * slowFactor * dt * 60;
        if (nx >= 1) lost = true;
        return { ...e, x: nx };
      }).filter(e => e.hp > 0);
      if (lost) setWaveState("lost");
      return next;
    });

    /* Remove dead placements */
    setPlacements(ps => ps.filter(p => p.hp > 0));

    /* Move projectiles */
    setProjectiles(prs => {
      const next = [];
      for (const pr of prs) {
        // Spear flash: stays in place, decays
        if (pr.kind === "spear") {
          const life = (pr.life ?? 0.25) - dt;
          if (life > 0) next.push({ ...pr, life });
          continue;
        }
        const dir = pr.enemy ? +1 : -1;
        const nx = pr.x + dir * 0.6 * dt;
        if (nx < -0.02 || nx > 1.02) continue;

        if (pr.enemy) {
          // enemy projectile hits a unit in same row, moving right
          const hitUnit = placements.find(p => p.row === pr.row
            && Math.abs((p.col + 0.5) / COLS - nx) < 0.05);
          if (hitUnit) {
            if (pr.splash) {
              setPlacements(ps => ps.map(p => p.row === pr.row
                && Math.abs((p.col + 0.5) / COLS - nx) < 0.08
                ? { ...p, hp: p.hp - pr.dmg } : p));
            } else {
              setPlacements(ps => ps.map(p => p.id === hitUnit.id
                ? { ...p, hp: p.hp - pr.dmg } : p));
            }
            continue;
          }
          next.push({ ...pr, x: nx });
          continue;
        }

        // player projectile: collide with nearest enemy in same row
        const hit = enemies.find(e => e.row === pr.row && Math.abs(e.x - nx) < 0.05);
        if (hit) {
          const now = performance.now();
          if (pr.splash) {
            setEnemies(es => es.map(e => Math.abs(e.x - hit.x) < 0.05 && e.row === hit.row
              ? { ...e, hp: e.hp - pr.dmg } : e));
          } else {
            setEnemies(es => es.map(e => e.id === hit.id ? { ...e, hp: e.hp - pr.dmg } : e));
          }
          if (pr.slow) {
            setEnemies(es => es.map(e => e.id === hit.id
              ? { ...e, slowUntil: now + pr.slowTime * 1000 } : e));
          }
          continue;
        }
        next.push({ ...pr, x: nx });
      }
      return next;
    });

    /* Wave cleared? */
    if (waveState === "active" && enemies.length === 0) {
      if (wave + 1 >= WAVES.length) {
        setWaveState("won");
      } else {
        setWaveState("cleared");
        setToast({ msg: `第 ${wave+1} 波已退`, key: Date.now() });
        setTimeout(() => {
          setWave(w => w + 1);
          setWaveState("spawning");
          startWave(wave + 1);
        }, 4500);
      }
    }
  }

  /* Cell click: place unit (or recall if whistle active) */
  function onCellClick(r, c) {
    if (recallMode) {
      const existing = placements.find(p => p.row === r && p.col === c);
      if (!existing) { flash("此處無俠客"); return; }
      // refund half cost, clear cooldown
      const refund = Math.floor(existing.unit.cost * 0.5);
      setQi(q => q + refund);
      setPlacements(ps => ps.filter(p => p.id !== existing.id));
      setCooldowns(cd => ({ ...cd, [existing.unit.id]: 0 }));
      flash(`${existing.unit.name} 歸隊 +${refund} 氣`);
      setRecallMode(false);
      return;
    }
    if (!selected) return;
    const u = ACTIVE_UNITS.find(x => x.id === selected);
    if (!u) return;
    const existing = placements.find(p => p.row === r && p.col === c);
    if (existing) {
      // Allow overwriting same unit if hp not full
      if (existing.unit.id === u.id && existing.hp < existing.unit.hp) {
        if (qi < u.cost) { flash("內力不足"); return; }
        const now = performance.now();
        if (cooldowns[u.id] && cooldowns[u.id] > now) { flash("尚在運氣"); return; }
        setQi(q => q - u.cost);
        setPlacements(ps => ps.map(p => p.id === existing.id
          ? { ...p, hp: u.hp, lastAttack: 0, nextProduce: u.kind === "producer" ? now + 3000 : 0 }
          : p));
        setCooldowns(cd => ({ ...cd, [u.id]: now + u.cd * 1000 }));
        return;
      }
      flash("此處已有"); return;
    }
    if (qi < u.cost) { flash("內力不足"); return; }
    const now = performance.now();
    if (cooldowns[u.id] && cooldowns[u.id] > now) { flash("尚在運氣"); return; }
    setQi(q => q - u.cost);
    setPlacements(ps => [...ps, {
      id: nextId(), unit: u, row: r, col: c, hp: u.hp, lastAttack: 0, nextProduce: u.kind === "producer" ? now + 3000 : 0,
    }]);
    setCooldowns(cd => ({ ...cd, [u.id]: now + u.cd * 1000 }));
  }

  function flash(msg) {
    setToast({ msg, key: Date.now() });
  }

  function collectOrb(id) {
    const o = orbs.find(x => x.id === id);
    if (!o) return;
    setOrbs(os => os.filter(x => x.id !== id));
    setQi(q => Math.min(999, q + o.value));
  }

  function restart() {
    setQi(tweaks.startQi || 100);
    setPlacements([]);
    setEnemies([]);
    setProjectiles([]);
    setOrbs([]);
    setCooldowns({});
    setWave(0);
    setWaveState("idle");
    if (prepTimerRef.current) { clearInterval(prepTimerRef.current); prepTimerRef.current = null; }
    spawnQueue.current = [];
    spawnTimer.current = 0;
  }

  /* coords */
  function colX(col) { return 7 + ((col + 0.5) / COLS) * (100 - 7 - 9); }
  function rowY(row) { return 4 + ((row + 0.5) / ROWS) * (100 - 4 - 6); }

  /* Render */
  return (
    <div className="scroll">
      <div className="rod rod-top" />
      <div className="scroll-body">

        <div className="titlebar">
          <div className="title">
            <span className="swash">俠</span><span>客守江山</span>
          </div>
          <div className="subtitle">— {campaign ? campaign.name : "水 泊 武 林 塔 防"} —</div>
          <div style={{ flex: 1 }} />
          {onExit && (
            <button className="ctl-btn" style={{ marginRight: 10 }} onClick={onExit}>
              回 帥 帳
            </button>
          )}
          <div className="seal serif">守<br/>土</div>
        </div>

        {/* Unit tray */}
        <div className="tray">
          <div className="qi-box">
            <div className="qi-value">{Math.floor(qi)}</div>
            <div className="qi-label">內 力</div>
            <div className="qi-bar"><div style={{ width: `${Math.min(100, qi/2)}%` }} /></div>
          </div>
          {/* Recall bell: hanging bronze bell, visually distinct from hero tray */}
          <div
            className={`whistle-card ${recallMode ? "selected" : ""}`}
            onClick={() => {
              setRecallMode(r => !r);
              setSelected(null);
            }}
            title="召回俠客（返還半數內力）"
          >
            <div className="wave-burst" />
            <div className="bell-wrap">
              <svg width="56" height="56" viewBox="0 0 64 64">
                <defs>
                  <linearGradient id="bell-g" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f0c24a" />
                    <stop offset="55%" stopColor="#c98a2a" />
                    <stop offset="100%" stopColor="#7a4d10" />
                  </linearGradient>
                  <linearGradient id="bell-rim" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8a5414" />
                    <stop offset="100%" stopColor="#5a3408" />
                  </linearGradient>
                </defs>
                {/* hanging rope */}
                <path d="M32,2 L32,10" stroke="#6b2a20" strokeWidth="2.2" strokeLinecap="round" />
                {/* top cap loop */}
                <path d="M28,10 Q32,4 36,10 L34,14 L30,14 Z" fill="#8a5414" stroke="#3a1e06" strokeWidth="1.2" />
                {/* bell body */}
                <path d="M16,50 Q16,22 32,16 Q48,22 48,50 Z"
                  fill="url(#bell-g)" stroke="#3a1e06" strokeWidth="1.8" strokeLinejoin="round" />
                {/* bell shine */}
                <path d="M22,46 Q22,26 30,22" stroke="rgba(255,240,180,.6)" strokeWidth="2" fill="none" strokeLinecap="round" />
                {/* bell rim */}
                <rect x="14" y="48" width="36" height="5" rx="1.5" fill="url(#bell-rim)" stroke="#3a1e06" strokeWidth="1.4" />
                {/* engraved center character stroke */}
                <path d="M28,30 L36,30 M32,26 L32,38" stroke="#3a1e06" strokeWidth="1.6" strokeLinecap="round" opacity=".7" />
                {/* clapper */}
                <circle cx="32" cy="54" r="3" fill="#3a1e06" />
              </svg>
            </div>
            <div className="wname">哨 子</div>
          </div>
          {ACTIVE_UNITS.map(u => {
            const now = performance.now();
            const cdRemain = Math.max(0, (cooldowns[u.id] || 0) - now) / 1000;
            const cdPct = cdRemain > 0 ? (1 - cdRemain / u.cd) * 100 : 100;
            const poor = qi < u.cost;
            const cls = [
              "unit-card",
              selected === u.id ? "selected" : "",
              cdRemain > 0 ? "cooling" : "",
              poor ? "unaffordable" : "",
            ].join(" ");
            return (
              <div key={u.id} className={cls}
                onClick={() => {
                  if (cdRemain > 0 || poor) return;
                  setRecallMode(false);
                  setSelected(sel => sel === u.id ? null : u.id);
                }}>
                <div className="glyph"><UnitSprite unit={u} size={44} /></div>
                <div className="name">{u.name}</div>
                <div className="cost">氣 {u.cost}</div>
                {cdRemain > 0 && (
                  <div className="cooldown" style={{ "--cd-top": `${cdPct}%` }} />
                )}
                <UnitTip unit={u} />
              </div>
            );
          })}
        </div>

        {/* Stage + sidebar */}
        <div className="stage-wrap">
          <div className="side-panel">
            <div className="side-card">
              <h3>戰 況</h3>
              <div className="wave-chip">第 {Math.min(wave+1, WAVES.length)} / {WAVES.length} 波</div>
              <div className="wave-dots">
                {WAVES.map((_, i) => (
                  <div key={i} className={`wave-dot ${i < wave ? "done" : i === wave ? "current" : ""}`} />
                ))}
              </div>
            </div>
            <div className="side-card">
              <h3>敵 蹤</h3>
              <div style={{ fontFamily: "Noto Serif TC, serif", fontSize: 22, fontWeight: 900, color: "var(--ink)" }}>
                {enemies.length}
              </div>
              <div style={{ fontSize: 11, letterSpacing: 2, color: "var(--ink-soft)" }}>
                來犯之敵
              </div>
            </div>
            <button className="ctl-btn" onClick={() => setPaused(p => !p)}>
              {paused ? "續 戰" : "暫 停"}
            </button>
            <button className="ctl-btn" onClick={() => { setPaused(true); setConfirmRestart(true); }}>重 整</button>
          </div>

          <div className={`stage ${isNight ? "night" : ""} ${recallMode ? "recall-mode" : ""}`}>
            <div className="bg" />
            {/* lane stripes */}
            {[...Array(ROWS)].map((_, r) => (
              <div key={r} className="lane-stripe" style={{ top: `${4 + r * (100-10)/ROWS}%`, opacity: r%2 ? .5 : .3 }} />
            ))}

            {/* decorations */}
            <Tree x={3} y={8} size={32} />
            <Tree x={2} y={92} size={36} />
            <Rock x={4} y={55} />
            <Pagoda x={94} y={22} />
            <Pagoda x={94} y={78} />
            {/* extra bg decoration */}
            <div className="tufts" />
            <div className="bamboo-stalk" style={{ left: "1.5%", top: "12%", height: "22%" }} />
            <div className="bamboo-stalk" style={{ left: "2.4%", top: "32%", height: "18%" }} />
            <div className="bamboo-stalk" style={{ left: "97.5%", top: "48%", height: "22%" }} />
            <Tree x={96} y={8} size={28} />
            <Rock x={97} y={92} />
            {/* banners marking village */}
            <div className="banner-pole" style={{ right: "2%", top: "6%", height: "16%" }} />
            <div className="banner-flag" style={{ right: "4.4%", top: "7%" }}>守</div>
            <div className="banner-pole" style={{ right: "2%", bottom: "6%", height: "16%" }} />
            <div className="banner-flag" style={{ right: "4.4%", bottom: "18%" }}>義</div>
            {/* drifting petals */}
            {[...Array(8)].map((_, i) => (
              <div key={`petal-${i}`} className="petal" style={{
                left: `${(i * 13 + 8) % 96}%`,
                animationDelay: `${i * 1.1}s`,
                animationDuration: `${8 + (i % 3) * 2}s`,
              }} />
            ))}

            <div className="wilds" />
            <div className="village" />

            {/* grid */}
            <div className="grid">
              {[...Array(ROWS * COLS)].map((_, i) => {
                const r = Math.floor(i / COLS);
                const c = i % COLS;
                const occupied = placements.find(p => p.row === r && p.col === c);
                const canOverwrite = occupied && selected && occupied.unit.id === selected && occupied.hp < occupied.unit.hp;
                return (
                  <div key={i}
                    className={`cell ${occupied && !canOverwrite ? "occupied" : ""}`}
                    onClick={() => onCellClick(r, c)}
                  />
                );
              })}
            </div>

            {/* placements */}
            {placements.map(p => (
              <div key={p.id} className="entity bob" style={{ left: `${colX(p.col)}%`, top: `${rowY(p.row)}%`, zIndex: 10 + p.row }}>
                <UnitSprite unit={p.unit} size={56} />
                <div className="hp"><div style={{ width: `${(p.hp / p.unit.hp) * 100}%` }} /></div>
              </div>
            ))}

            {/* enemies */}
            {enemies.map(e => {
              const data = ENEMIES.find(x => x.id === e.type);
              const px = 7 + e.x * (100 - 7 - 9);
              const py = rowY(e.row);
              const leaping = e.leapUntil && e.leapUntil > performance.now();
              const lifted = leaping ? py - 6 : py;
              return (
                <div key={e.id} className="entity enemy-walk" style={{ left: `${px}%`, top: `${lifted}%`, zIndex: 20 + e.row, filter: leaping ? "drop-shadow(0 6px 4px rgba(0,0,0,.5))" : undefined }}>
                  <EnemySprite enemy={data} size={52} />
                  <div className="hp"><div style={{ width: `${(e.hp / data.hp) * 100}%` }} /></div>
                </div>
              );
            })}

            {/* projectiles */}
            {projectiles.map(pr => {
              const px = 7 + pr.x * (100 - 7 - 9);
              const py = rowY(pr.row);
              return (
                <div key={pr.id} className="entity" style={{ left: `${px}%`, top: `${py}%`, zIndex: 50 }}>
                  {pr.kind === "arrow" && <div className="arrow" style={pr.enemy ? { transform: "scaleX(-1)" } : undefined} />}
                  {pr.kind === "star" && <div className="star" />}
                  {pr.kind === "fire" && <div className="fire" />}
                  {pr.kind === "bomb" && <div className="bomb" />}
                  {pr.kind === "spear" && <div className="spear" />}
                </div>
              );
            })}

            {/* qi orbs */}
            {orbs.map(o => (
              <div key={o.id} className="entity" style={{ left: `${o.x}%`, top: `${o.y}%`, zIndex: 80 }}>
                <div className="orb" onClick={() => collectOrb(o.id)}>氣</div>
              </div>
            ))}

            <div className="vignette" />

            {toast && <Toast key={toast.key} msg={toast.msg} />}

            {waveState === "won" && (
              <EndCard title="江山無恙" body="來犯之敵盡退，天下初定。"
                buttons={[{ label: "再 戰", onClick: restart, primary: true }]} />
            )}
            {waveState === "lost" && (
              <EndCard title="城 破" body="敵軍已入莊院，再議布陣。"
                buttons={[{ label: "再 戰", onClick: restart, primary: true }]} />
            )}
            {paused && !confirmRestart && waveState !== "won" && waveState !== "lost" && (
              <EndCard title="暫 停" body="按「續戰」回到戰場。"
                buttons={[{ label: "續 戰", onClick: () => setPaused(false), primary: true }]} />
            )}
            {confirmRestart && (
              <EndCard title="重整戰局？" body="目前布陣與波次進度將全數清空。"
                buttons={[
                  { label: "取 消", onClick: () => { setConfirmRestart(false); setPaused(false); } },
                  { label: "確認重整", onClick: () => { setConfirmRestart(false); setPaused(false); restart(); }, primary: true, danger: true },
                ]} />
            )}

            {/* prep countdown */}
            {waveState === "prep" && prepLeft > 0 && (
              <div style={{
                position: "absolute", left: "50%", top: "12%", transform: "translateX(-50%)",
                fontFamily: "Noto Serif TC, serif", fontWeight: 900,
                color: "#fcefd1", background: "rgba(30,20,10,.72)",
                padding: "10px 22px", borderRadius: 8, border: "2px solid var(--gold)",
                fontSize: 20, letterSpacing: 4, whiteSpace: "nowrap",
                boxShadow: "0 8px 24px rgba(0,0,0,.5)", zIndex: 250,
                pointerEvents: "none", textShadow: "0 0 10px rgba(201,162,74,.7)"
              }}>
                布 陣 · {Math.ceil(prepLeft)} 秒 後 敵 襲
              </div>
            )}

            {/* hint when nothing placed */}
            {placements.length === 0 && waveState !== "won" && waveState !== "lost" && (
              <div style={{
                position: "absolute", left: "50%", top: "50%", transform: "translate(-50%,-50%)",
                fontFamily: "Noto Serif TC, serif", color: "rgba(255,247,210,.9)",
                fontSize: 18, letterSpacing: 6, textShadow: "0 2px 6px rgba(0,0,0,.6)",
                pointerEvents: "none", textAlign: "center"
              }}>
                ☰ 擇上 ☰<br />
                <span style={{ fontSize: 13, letterSpacing: 4, opacity: .85 }}>自竹簡中點選俠客，再點格上布陣</span>
              </div>
            )}
          </div>
        </div>

        <div className="footer">
          <div className="legend">
            <span className="chip"><span className="dot" style={{ background: "var(--bamboo)" }} /> 已退</span>
            <span className="chip"><span className="dot" /> 當前</span>
            <span className="chip"><span className="dot" style={{ background: "#caa971" }} /> 待臨</span>
          </div>
          <div className="serif">— 卷末 · 乙巳年春 —</div>
        </div>

      </div>
      <div className="rod rod-bot" />
    </div>
  );
}

function Toast({ msg }) {
  return <div className="toast">{msg}</div>;
}

function UnitTip({ unit }) {
  const u = unit;
  const attackLabel = u.kind === "producer"
    ? `每 ${u.interval}s 產氣 +${u.produce}`
    : u.kind === "melee"
      ? `近身 · 每 ${u.interval}s ${u.dmg} 傷`
      : u.kind === "pierce"
        ? `槍刺 · 每 ${u.interval}s ${u.dmg} 傷 × ${u.pierce || 2} 目標`
        : u.kind === "slow"
          ? `每 ${u.interval}s 減速 ${Math.round(u.slow*100)}% / ${u.slowTime}s`
          : `每 ${u.interval}s · ${u.dmg} 傷${u.splash ? "（範圍）" : ""}`;
  return (
    <div className="tip">
      <h5>{u.name}<small>{(u.tags || []).join(" · ")}</small></h5>
      <div className="desc">{u.desc}</div>
      <div className="stats">
        <span>氣耗<b>{u.cost}</b></span>
        <span>冷卻<b>{u.cd}s</b></span>
        <span>血量<b>{u.hp}</b></span>
        <span>{u.kind === "producer" ? "產出" : "攻擊"}<b>{attackLabel}</b></span>
      </div>
    </div>
  );
}

function EndCard({ title, body, buttons = [] }) {
  return (
    <div style={{
      position: "absolute", inset: 0,
      background: "radial-gradient(ellipse at center, rgba(20,10,4,.55) 0%, rgba(10,6,2,.82) 75%)",
      backdropFilter: "blur(3px)", WebkitBackdropFilter: "blur(3px)",
      display: "flex", alignItems: "center", justifyContent: "center", zIndex: 500,
    }}>
      <div style={{
        background: "linear-gradient(180deg,#f7ecd3,#ecdcb4)",
        border: "3px solid var(--wood-d)", borderRadius: 10,
        padding: "28px 40px", textAlign: "center", boxShadow: "0 20px 50px rgba(0,0,0,.6)",
        minWidth: 320,
      }}>
        <div style={{ fontFamily: "Noto Serif TC, serif", fontWeight: 900, fontSize: 42, letterSpacing: 10, color: "var(--cinnabar-d)" }}>
          {title}
        </div>
        <div style={{ marginTop: 6, letterSpacing: 4, color: "var(--ink-soft)" }}>{body}</div>
        <div style={{ marginTop: 18, display: "flex", gap: 12, justifyContent: "center" }}>
          {buttons.map((b, i) => (
            <button key={i} className="ctl-btn"
              style={{
                padding: "10px 28px",
                background: b.danger ? "linear-gradient(180deg,#b23a2a,#7d2519)" : undefined,
                color: b.danger ? "#fff7d0" : undefined,
                opacity: b.primary ? 1 : .9,
              }}
              onClick={b.onClick}>
              {b.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ---------------- App Router ---------------- */
function App() {
  const [tweaks, setTweaks] = useState(() => ({...window.__TWEAKS}));
  useEffect(() => {
    const h = (e) => setTweaks({...e.detail});
    window.addEventListener('tweaks-change', h);
    return () => window.removeEventListener('tweaks-change', h);
  }, []);

  const [screen, setScreen] = useState("briefing"); // briefing | transition | battle
  const [campaign, setCampaign] = useState(CAMPAIGNS[0]);
  const [roster, setRoster] = useState(null);

  function onLaunch(chosenRoster) {
    setRoster(chosenRoster);
    setScreen("transition");
  }
  function onTransitionDone() {
    setScreen("battle");
  }
  function onExitBattle() {
    setScreen("briefing");
  }

  if (screen === "briefing") {
    return <Briefing
      campaign={campaign}
      units={UNITS} enemies={ENEMIES}
      rosterSize={Math.max(1, Math.min(UNITS.length, tweaks.rosterSize || 6))}
      onLaunch={onLaunch}
    />;
  }
  if (screen === "transition") {
    return <BattleTransition campaign={campaign} onDone={onTransitionDone} />;
  }
  return <Battle roster={roster} campaign={campaign} onExit={onExitBattle} />;
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);
