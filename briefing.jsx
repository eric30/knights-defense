/* 佈陣會議 + 過場動畫 */
/* Depends on: UNITS, ENEMIES, CAMPAIGNS, UnitSprite, EnemySprite (from game.jsx) */

function Briefing({ campaign, units, enemies, items, rosterSize, itemCount = 3, onLaunch }) {
  const SHOW_ITEMS = false; // 隨身寶功能暫時移除（破壞平衡）；未來可改回 true 恢復
  const enemyList = campaign.enemies.map(id => enemies.find(e => e.id === id)).filter(Boolean);
  const [selected, setSelected] = React.useState([]);
  const [pickedItems, setPickedItems] = React.useState([]);
  const [detail, setDetail] = React.useState({ kind: "unit", id: units[0].id });

  // If rosterSize changes via tweaks, trim
  React.useEffect(() => {
    setSelected(sel => sel.slice(0, rosterSize));
  }, [rosterSize]);

  function toggleUnit(id) {
    setSelected(sel => {
      if (sel.includes(id)) return sel.filter(x => x !== id);
      if (sel.length >= rosterSize) {
        // flash
        return sel;
      }
      return [...sel, id];
    });
  }
  function toggleItem(id) {
    setPickedItems(p => {
      if (p.includes(id)) return p.filter(x => x !== id);
      if (p.length >= itemCount) return p;
      return [...p, id];
    });
  }

  const detailObj = detail.kind === "unit"
    ? units.find(u => u.id === detail.id)
    : enemies.find(e => e.id === detail.id);

  const ready = selected.length === rosterSize && (!SHOW_ITEMS || pickedItems.length === itemCount);

  return (
    <div className="briefing">
      <div className="bf-banner">
        <div className="bf-era">{campaign.era}</div>
        <div className="bf-name serif">{campaign.name}</div>
        <div className="bf-loc">{campaign.location}</div>
        <div className="bf-intro">{campaign.intro}</div>
      </div>

      <div className="bf-body">
        {/* Left : our roster pool */}
        <section className="bf-panel bf-our">
          <header className="bf-ph">
            <span className="bf-ph-title">我 軍 · 俠 客 名 冊</span>
            <span className={"bf-count" + (ready ? " ready" : "")}>
              {selected.length} / {rosterSize}
            </span>
          </header>
          <div className="bf-grid">
            {units.map(u => {
              const picked = selected.includes(u.id);
              const full = !picked && selected.length >= rosterSize;
              return (
                <div key={u.id}
                  className={"bf-card" + (picked ? " picked" : "") + (full ? " disabled" : "") + (detail.kind === "unit" && detail.id === u.id ? " active" : "")}
                  onClick={() => setDetail({ kind: "unit", id: u.id })}>
                  <div className="bf-card-portrait">
                    <UnitSprite unit={u} size={56} />
                    {picked && <div className="bf-pick-mark">✓</div>}
                  </div>
                  <div className="bf-card-name">{u.name}</div>
                  <div className="bf-card-cost">氣 {u.cost}</div>
                  <button className={"bf-pick-btn" + (picked ? " on" : "")}
                    disabled={full && !picked}
                    onClick={(e) => { e.stopPropagation(); toggleUnit(u.id); }}>
                    {picked ? "撤 回" : full ? "名 額 已 滿" : "徵 召"}
                  </button>
                </div>
              );
            })}
          </div>
        </section>

        {/* Center : detail scroll */}
        <section className="bf-panel bf-detail">
          <header className="bf-ph">
            <span className="bf-ph-title">{detail.kind === "unit" ? "俠 客 細 帖" : "敵 情 密 報"}</span>
          </header>
          {detailObj && detail.kind === "unit" && (
            <div className="bf-det">
              <div className="bf-det-portrait">
                <UnitSprite unit={detailObj} size={120} />
              </div>
              <div className="bf-det-title serif">{detailObj.title || detailObj.name}</div>
              <div className="bf-det-sub">{detailObj.name} · 氣 {detailObj.cost} · 冷卻 {detailObj.cd}s</div>
              <div className="bf-stats">
                <Stat label="血量" v={detailObj.hp} />
                <Stat label="攻擊" v={detailObj.dmg ?? "—"} />
                <Stat label="間隔" v={(detailObj.interval || 0) + "s"} />
                <Stat label="類型" v={detailObj.tags ? detailObj.tags.join(" · ") : detailObj.kind} />
              </div>
              <div className="bf-det-desc">{detailObj.desc}</div>
              <div className="bf-det-story">{detailObj.story}</div>
            </div>
          )}
          {detailObj && detail.kind === "enemy" && (
            <div className="bf-det">
              <div className="bf-det-portrait">
                <EnemySprite enemy={detailObj} size={110} />
              </div>
              <div className="bf-det-title serif">{detailObj.title || detailObj.name}</div>
              <div className="bf-det-sub">{detailObj.name} · 血 {detailObj.hp} · 攻 {detailObj.dmg}</div>
              <div className="bf-stats">
                <Stat label="移動" v={speedLabel(detailObj.speed)} />
                <Stat label="攻擊" v={enemyAttackLabel(detailObj)} />
                <Stat label="間隔" v={(detailObj.interval || 0) + "s"} />
                <Stat label="方式" v={enemyKindLabel(detailObj.kind)} />
              </div>
              <div className="bf-det-desc">{enemyAttackDesc(detailObj)}</div>
              <div className="bf-det-story">{detailObj.story}</div>
            </div>
          )}
        </section>

        {/* Right : enemy intel */}
        <section className="bf-panel bf-enemy">
          <header className="bf-ph">
            <span className="bf-ph-title">敵 軍 · 來 犯 名 冊</span>
            <span className="bf-count">{enemyList.length}</span>
          </header>
          <div className="bf-elist">
            {enemyList.map(e => (
              <div key={e.id}
                className={"bf-erow" + (detail.kind === "enemy" && detail.id === e.id ? " active" : "")}
                onClick={() => setDetail({ kind: "enemy", id: e.id })}>
                <div className="bf-erow-pic"><EnemySprite enemy={e} size={40} /></div>
                <div className="bf-erow-text">
                  <div className="bf-erow-name">{e.name}</div>
                  <div className="bf-erow-sub">{enemyKindLabel(e.kind)} · HP {e.hp}</div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {SHOW_ITEMS && (
      <section className="bf-panel bf-items">
        <header className="bf-ph">
          <span className="bf-ph-title">隨 身 寶 · 請 挑 三 樣</span>
          <span className={"bf-count" + (pickedItems.length === itemCount ? " ready" : "")}>
            {pickedItems.length} / {itemCount}
          </span>
        </header>
        <div className="bf-item-row">
          {items.map(it => {
            const picked = pickedItems.includes(it.id);
            const full = !picked && pickedItems.length >= itemCount;
            return (
              <div key={it.id}
                className={"bf-item" + (picked ? " picked" : "") + (full ? " disabled" : "")}
                onClick={() => !full && toggleItem(it.id)}>
                <div className="bf-item-icon"
                  style={{ background: `radial-gradient(circle at 35% 30%, rgba(255,255,255,.45), transparent 60%), ${it.color}` }}>
                  {it.icon}
                </div>
                <div className="bf-item-text">
                  <div className="bf-item-name">{it.name}</div>
                  <div className="bf-item-desc">{it.desc}</div>
                </div>
                {picked && <div className="bf-item-check">✓</div>}
              </div>
            );
          })}
        </div>
      </section>
      )}

      <footer className="bf-foot">
        <div className="bf-foot-hint">
          {ready
            ? "兵員已齊，請將軍擊鼓開戰。"
            : selected.length < rosterSize
              ? `尚需 ${rosterSize - selected.length} 位俠客應徵。`
              : `尚需挑選 ${itemCount - pickedItems.length} 樣寶物。`}
        </div>
        <button className={"bf-launch" + (ready ? " ready" : "")}
          disabled={!ready}
          onClick={() => {
            // 擊鼓開戰 — 一連串鼓聲
            if (window.__audio) {
              window.__audio.start && window.__audio.start();
              window.__audio.sfx && window.__audio.sfx("drumroll");
            }
            onLaunch(selected, pickedItems.map(id => items.find(x => x.id === id)));
          }}>
          擊 鼓 開 戰
        </button>
      </footer>
    </div>
  );
}

function Stat({ label, v }) {
  return (
    <div className="bf-stat">
      <div className="bf-stat-l">{label}</div>
      <div className="bf-stat-v">{v}</div>
    </div>
  );
}

function speedLabel(s) {
  if (s >= 0.002) return "極快";
  if (s >= 0.0015) return "快";
  if (s >= 0.0012) return "一般";
  if (s >= 0.0009) return "慢";
  return "極慢";
}
function enemyKindLabel(k) {
  return ({ melee: "近戰", ranged: "遠程", healer: "治療", leap: "輕功" })[k] || k;
}
function enemyAttackLabel(e) {
  if (e.kind === "healer") return `治療 +${e.heal}`;
  if (e.kind === "leap") return `躍 · 攻${e.dmg}`;
  if (e.kind === "ranged") return e.splash ? `遠射 · 濺射` : "遠射";
  return `近攻 ${e.dmg}`;
}
function enemyAttackDesc(e) {
  switch (e.kind) {
    case "healer": return "不參戰，但會替身邊瀕死的同夥回血，優先擊殺。";
    case "leap":   return "碰到擋路者會一個縱身躍過前排，直撲後方。";
    case "ranged": return e.splash
      ? "從遠處投擲爆裂火器，濺射整條走道，最好打斷在它開火之前。"
      : "停下來遠距射箭，會繞過前排打後方脆皮。";
    default:       return `近身格鬥，每 ${e.interval} 秒揮擊一次，造成 ${e.dmg} 點傷害。`;
  }
}

/* ---------------- Battle Transition ---------------- */
function BattleTransition({ campaign, onDone }) {
  const [phase, setPhase] = React.useState(0);
  React.useEffect(() => {
    const steps = [
      setTimeout(() => setPhase(1), 80),
      setTimeout(() => setPhase(2), 360),
      setTimeout(() => setPhase(3), 640),
      setTimeout(() => setPhase(4), 1400),
      setTimeout(() => onDone && onDone(), 3600),
    ];
    return () => steps.forEach(clearTimeout);
  }, []);

  return (
    <div className={"bt bt-p" + phase}>
      <div className="bt-bg" />
      <div className="bt-ink" />
      <div className="bt-banner">
        <div className="bt-brush">兵</div>
        <div className="bt-brush">臨</div>
        <div className="bt-brush">城</div>
        <div className="bt-brush">下</div>
      </div>
      <div className="bt-name serif">{campaign.name}</div>
      <div className="bt-sub">{campaign.location}</div>
      <div className="bt-seal">出 陣</div>
      <div className="bt-slash" />
      <div className="bt-drums">
        {Array.from({ length: 18 }).map((_, i) => (
          <div key={i} className="bt-drum" style={{ left: `${(i * 37) % 100}%`, animationDelay: `${(i%6) * 120}ms` }} />
        ))}
      </div>
    </div>
  );
}

Object.assign(window, { Briefing, BattleTransition });
