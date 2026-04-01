// Additional styles for tutor portal
const s = document.createElement('style');
s.textContent = `
/* BUTTONS */
.tp-btn{border:none;border-radius:10px;padding:7px 15px;font-size:12px;font-family:'DM Sans',sans-serif;cursor:pointer;font-weight:500;transition:all .15s;}
.tp-btn--outline{background:transparent;border:1px solid var(--border);color:var(--text-2);}
.tp-btn--outline:hover{background:var(--cream-dark);}
.tp-btn--primary{background:var(--green-dark);color:#fff;}
.tp-btn--primary:hover{background:var(--green-mid);}
.tp-btn--primary:disabled{background:#C4BDB0;cursor:not-allowed;}
.tp-btn--purple{background:var(--purple);color:#fff;}
.tp-btn--purple:hover{background:var(--purple-mid);}

/* TIMETABLE */
.tp-tt-outer{background:var(--card);border:1px solid var(--border);border-radius:14px;overflow:auto;box-shadow:var(--shadow);}
.tp-tt-grid{display:grid;grid-template-columns:52px repeat(7,1fr);min-width:560px;user-select:none;}
.tp-hcell{padding:10px 6px;text-align:center;border-bottom:1px solid var(--border);font-size:10px;font-weight:600;color:var(--text-3);letter-spacing:.05em;}
.tp-hcell--today{color:var(--green-dark);}
.tp-hcell--locked{opacity:.55;}
.tp-day-num{font-family:'Playfair Display',serif;font-size:19px;font-weight:700;color:var(--text-1);display:block;line-height:1.2;}
.tp-hcell--today .tp-day-num{color:var(--green-dark);}
.tp-today-pip{display:inline-block;width:4px;height:4px;background:var(--green-dark);border-radius:50%;margin-left:3px;vertical-align:middle;}
.tp-locked-badge{display:block;font-size:8px;font-weight:600;letter-spacing:.03em;background:var(--cream-dark);color:var(--text-3);border-radius:4px;padding:2px 5px;margin-top:4px;}
.tp-tcell{padding:0 5px;font-size:9px;color:var(--text-3);border-right:1px solid var(--border);border-bottom:1px solid var(--border);display:flex;align-items:flex-start;padding-top:3px;height:32px;}
.tp-tcell--half{border-bottom:1px dashed #E8E0CE;}
.tp-tcell--corner{border-bottom:1px solid var(--border);height:auto;}
.tp-slot{height:32px;border-right:1px solid var(--border);border-bottom:1px solid var(--border);position:relative;transition:background .08s;}
.tp-slot--half{border-bottom:1px dashed #E8E0CE;}
.tp-slot--locked{cursor:not-allowed!important;background:repeating-linear-gradient(45deg,transparent,transparent 4px,rgba(0,0,0,.028) 4px,rgba(0,0,0,.028) 8px)!important;}
.tp-slot--period-locked{cursor:not-allowed!important;background:repeating-linear-gradient(45deg,#f0c0c0,#f0c0c0 2px,#fde8e8 2px,#fde8e8 5px)!important;pointer-events:none;}
.tp-slot--standby{}
.tp-slot--selecting{background:rgba(91,61,138,.18)!important;}
.tp-slot--selected{background:rgba(91,61,138,.18)!important;}
.tp-slot--selected::after{content:'';position:absolute;inset:1px;border:1.5px solid var(--purple);border-radius:3px;pointer-events:none;}

/* SESSION BLOCKS */
.tp-sess-block{position:absolute;left:3px;right:3px;top:2px;border-radius:6px;padding:4px 7px;cursor:pointer;z-index:2;transition:opacity .15s;}
.tp-sess-block:hover{opacity:.82;}
.tp-sb-label{font-size:9px;font-weight:600;}
.tp-sb-sub{font-size:9px;margin-top:1px;}
.tp-sess-availability{background:var(--purple-pale);border:1.5px dashed var(--purple-mid);}
.tp-sess-availability .tp-sb-label{color:var(--purple);}
.tp-sess-availability .tp-sb-sub{color:var(--purple-mid);opacity:.75;}
.tp-sess-confirmed{background:var(--green-dark);}
.tp-sess-confirmed .tp-sb-label{color:rgba(255,255,255,.95);}
.tp-sess-confirmed .tp-sb-sub{color:rgba(255,255,255,.65);}
.tp-sess-standby{background:var(--slate-bg);}
.tp-sess-standby .tp-sb-label{color:rgba(255,255,255,.95);}
.tp-sess-standby .tp-sb-sub{color:rgba(255,255,255,.62);}
.tp-sess-done{filter:none;background:#4A4A4A!important;}
.tp-sess-done .tp-sb-label{color:rgba(255,255,255,.85)!important;}
.tp-sess-done .tp-sb-sub{color:rgba(255,255,255,.5)!important;}

/* TIMETABLE NAV */
.tp-tt-nav-wrap{display:flex;align-items:flex-start;gap:10px;}
.tp-tt-side-btn{width:32px;height:32px;border-radius:50%;border:1px solid var(--border);background:var(--card);display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:15px;color:var(--text-2);flex-shrink:0;transition:background .15s;margin-top:11px;}
.tp-tt-side-btn:hover{background:var(--cream-dark);}
.tp-week-display{font-family:'Playfair Display',serif;font-size:22px;font-weight:800;color:var(--text-1);margin-bottom:10px;text-align:center;}
.tp-legend{display:flex;align-items:center;gap:14px;margin-bottom:12px;flex-wrap:wrap;}
.tp-leg-item{display:flex;align-items:center;gap:5px;font-size:11px;color:var(--text-2);}
.tp-leg-dot{width:9px;height:9px;border-radius:2px;}
.tp-sel-bar{display:none;align-items:center;gap:10px;background:var(--purple-pale);border:1px solid var(--purple-line);border-radius:11px;padding:10px 16px;margin-bottom:14px;}
.tp-sel-bar.tp-visible{display:flex;}
.tp-sel-bar-text{flex:1;font-size:12px;color:var(--purple);}

/* EMPTY STATE */
.tp-empty-state{text-align:center;padding:60px 20px;color:var(--text-3);font-size:13px;line-height:1.6;}
.tp-empty-icon{font-size:36px;margin-bottom:12px;opacity:.6;}

/* TOAST */
.tp-toast{position:fixed;bottom:24px;left:50%;transform:translateX(-50%) translateY(60px);background:var(--purple);color:#fff;padding:11px 22px;border-radius:30px;font-size:12px;font-weight:500;opacity:0;transition:all .3s;z-index:999;white-space:nowrap;pointer-events:none;}
.tp-toast--show{opacity:1;transform:translateX(-50%) translateY(0);}
`;
document.head.appendChild(s);
