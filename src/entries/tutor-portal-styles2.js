// Additional styles for tutor portal (part 2)
const s2 = document.createElement('style');
s2.textContent = `
/* OVERLAYS */
.tp-overlay{display:none;position:fixed;inset:0;background:rgba(20,15,8,.42);z-index:200;align-items:center;justify-content:center;backdrop-filter:blur(2px);}
.tp-overlay.open{display:flex;}
@keyframes tpPopIn{from{opacity:0;transform:scale(.93) translateY(10px);}to{opacity:1;transform:none;}}
.tp-popup{background:var(--card);border-radius:20px;width:460px;max-height:92vh;overflow-y:auto;box-shadow:0 24px 80px rgba(0,0,0,.22);animation:tpPopIn .22s cubic-bezier(.34,1.56,.64,1);}
.tp-pop-head{padding:22px 22px 0;display:flex;align-items:flex-start;justify-content:space-between;gap:10px;}
.tp-pop-close{width:26px;height:26px;border-radius:50%;border:1px solid var(--border);background:var(--cream-dark);display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:13px;color:var(--text-2);flex-shrink:0;}
.tp-pop-close:hover{background:var(--border);}
.tp-pop-body{padding:16px 22px 22px;}
.tp-pop-label{font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:var(--text-3);margin-bottom:5px;}
.tp-pop-date{font-family:'Playfair Display',serif;font-size:22px;font-weight:700;line-height:1.2;margin-bottom:14px;}
.tp-status-pill{display:inline-flex;align-items:center;gap:5px;padding:4px 12px;border-radius:20px;font-size:11px;font-weight:600;margin-bottom:14px;}
.tp-sp-confirmed{background:var(--green-pale);color:var(--green-dark);}
.tp-sp-pending{background:#FEF3DC;color:#7A5010;}
.tp-sp-availability{background:var(--purple-pale);color:var(--purple);}
.tp-sp-standby{background:#E8EBF0;color:var(--slate);}
.tp-detail-row{display:flex;align-items:center;gap:10px;margin-bottom:9px;}
.tp-detail-icon{font-size:14px;flex-shrink:0;width:18px;text-align:center;}
.tp-detail-text{font-size:13px;color:var(--text-2);}
.tp-detail-text strong{color:var(--text-1);}
.tp-divider{height:1px;background:var(--border);margin:14px 0;}
.tp-stu-card-pop{background:var(--cream-dark);border-radius:12px;padding:14px 16px;margin-bottom:14px;}
.tp-stu-card-top{display:flex;align-items:center;gap:12px;margin-bottom:10px;}
.tp-stu-av{width:42px;height:42px;border-radius:50%;background:#2A4A7A;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:700;color:#fff;flex-shrink:0;}
.tp-stu-name{font-size:14px;font-weight:600;}
.tp-stu-meta{font-size:11px;color:var(--text-3);margin-top:2px;}
.tp-stu-card-actions{display:flex;gap:8px;margin-top:2px;}
.tp-stu-action-btn{font-size:11px;padding:5px 12px;border:1px solid var(--border);border-radius:8px;cursor:pointer;font-family:'DM Sans',sans-serif;font-weight:500;background:var(--card);color:var(--text-2);transition:background .15s;}
.tp-stu-action-btn:hover{background:var(--cream);}
.tp-stu-action-primary{background:var(--green-pale);color:var(--green-dark);border-color:transparent;}
.tp-standby-box{background:#E8EBF0;border:1px solid #C8D0DC;border-radius:11px;padding:14px 16px;margin-bottom:14px;}
.tp-standby-title{font-size:13px;font-weight:600;color:var(--slate);margin-bottom:4px;}
.tp-standby-body{font-size:12px;color:var(--text-2);line-height:1.6;}
.tp-avail-info-box{background:var(--purple-pale);border:1px solid var(--purple-line);border-radius:11px;padding:14px 16px;margin-bottom:14px;}
.tp-avail-info-title{font-size:13px;font-weight:600;color:var(--purple);margin-bottom:4px;}
.tp-avail-info-body{font-size:12px;color:#6A5090;line-height:1.6;}
.tp-remove-avail-btn{width:100%;margin-top:10px;background:transparent;border:1px solid var(--purple-line);color:var(--purple);border-radius:9px;padding:8px;font-size:12px;font-family:'DM Sans',sans-serif;cursor:pointer;font-weight:500;transition:background .15s;}
.tp-remove-avail-btn:hover{background:rgba(91,61,138,.08);}
.tp-report-section{background:var(--cream-dark);border-radius:11px;padding:16px;}
.tp-report-title{font-size:13px;font-weight:600;margin-bottom:2px;}
.tp-report-sub{font-size:11px;color:var(--text-3);margin-bottom:14px;}
.tp-report-done{background:var(--green-pale);border-radius:10px;padding:13px;text-align:center;color:var(--green-dark);font-size:13px;font-weight:500;}
.tp-pfield-label{font-size:10px;letter-spacing:.08em;text-transform:uppercase;color:var(--text-3);margin-bottom:5px;}
.tp-tag-input-wrap{background:#fff;border:1px solid var(--border);border-radius:8px;padding:6px 8px;display:flex;flex-wrap:wrap;gap:5px;min-height:38px;cursor:text;margin-bottom:10px;transition:border-color .15s;}
.tp-tag-input-wrap:focus-within{border-color:var(--green-mid);}
.tp-topic-tag{display:inline-flex;align-items:center;gap:4px;background:var(--green-pale);color:var(--green-dark);font-size:11px;font-weight:500;padding:3px 8px 3px 10px;border-radius:20px;}
.tp-topic-tag-x{cursor:pointer;font-size:13px;line-height:1;color:var(--green-mid);opacity:.7;}
.tp-topic-tag-x:hover{opacity:1;}
.tp-tag-real-input{border:none;outline:none;font-size:12px;font-family:'DM Sans',sans-serif;color:var(--text-1);background:transparent;min-width:100px;flex:1;padding:2px;}
.tp-report-textarea{width:100%;background:#fff;border:1px solid var(--border);border-radius:8px;padding:9px 11px;font-size:12px;font-family:'DM Sans',sans-serif;color:var(--text-1);resize:none;height:80px;outline:none;margin-bottom:12px;transition:border-color .15s;}
.tp-report-textarea:focus{border-color:var(--green-mid);}
`;
document.head.appendChild(s2);
