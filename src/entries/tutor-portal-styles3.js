// Additional styles for tutor portal (part 3)
const s3 = document.createElement('style');
s3.textContent = `
/* SUBMIT AVAIL MODAL */
.tp-avail-modal{background:var(--card);border-radius:20px;width:400px;box-shadow:0 24px 64px rgba(0,0,0,.18);animation:tpPopIn .22s cubic-bezier(.34,1.56,.64,1);padding:28px;}
.tp-am-icon{font-size:32px;margin-bottom:10px;}
.tp-am-title{font-family:'Playfair Display',serif;font-size:21px;font-weight:700;margin-bottom:5px;}
.tp-am-sub{font-size:12px;color:var(--text-2);line-height:1.6;margin-bottom:16px;}
.tp-am-slots{background:var(--purple-pale);border:1px solid var(--purple-line);border-radius:10px;padding:13px;margin-bottom:18px;max-height:160px;overflow-y:auto;}
.tp-am-row{display:flex;align-items:center;gap:8px;font-size:12px;color:var(--purple);margin-bottom:5px;}
.tp-am-row:last-child{margin-bottom:0;}
.tp-am-dot{width:6px;height:6px;border-radius:50%;background:var(--purple-mid);flex-shrink:0;}
.tp-modal-actions{display:flex;gap:8px;}
.tp-modal-actions .tp-btn{flex:1;text-align:center;}

/* STUDENT PROFILE MODAL */
.tp-stu-modal{background:var(--card);border-radius:20px;width:460px;max-height:92vh;overflow-y:auto;box-shadow:0 24px 80px rgba(0,0,0,.22);animation:tpPopIn .22s cubic-bezier(.34,1.56,.64,1);}
.tp-stu-head{background:var(--green-dark);border-radius:20px 20px 0 0;padding:24px 24px 20px;display:flex;align-items:flex-start;gap:16px;}
.tp-stu-profile-av{width:56px;height:56px;border-radius:50%;background:rgba(255,255,255,.2);display:flex;align-items:center;justify-content:center;font-size:20px;font-weight:700;color:#fff;flex-shrink:0;}
.tp-stu-profile-name{font-family:'Playfair Display',serif;font-size:20px;font-weight:700;color:#fff;}
.tp-stu-profile-sub{font-size:12px;color:rgba(255,255,255,.7);margin-top:3px;}
.tp-spu-close{width:26px;height:26px;border-radius:50%;background:rgba(255,255,255,.15);display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:13px;color:rgba(255,255,255,.8);flex-shrink:0;margin-left:auto;}
.tp-spu-close:hover{background:rgba(255,255,255,.25);}
.tp-stu-body{padding:20px 24px;}
.tp-stu-stat-row{display:flex;gap:20px;margin-bottom:20px;}
.tp-stu-stat{text-align:center;flex:1;background:var(--cream-dark);border-radius:10px;padding:12px;}
.tp-stu-stat-val{font-family:'Playfair Display',serif;font-size:22px;font-weight:800;}
.tp-stu-stat-lbl{font-size:10px;color:var(--text-3);margin-top:2px;text-transform:uppercase;letter-spacing:.05em;}
.tp-section-head{font-family:'Playfair Display',serif;font-size:15px;font-weight:700;margin:18px 0 10px;}
.tp-field-pair{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px;}
.tp-field-lbl{font-size:10px;letter-spacing:.08em;text-transform:uppercase;color:var(--text-3);margin-bottom:4px;}
.tp-field-val{font-size:13px;font-weight:500;color:var(--text-1);}

/* NOTIFICATIONS */
.tp-notif-overlay{display:none;position:fixed;inset:0;background:rgba(20,15,8,.42);z-index:200;align-items:flex-start;justify-content:flex-end;backdrop-filter:blur(2px);padding:60px 24px 0;}
.tp-notif-overlay.open{display:flex;}
.tp-notif-popup{background:var(--card);border-radius:18px;width:420px;max-height:80vh;display:flex;flex-direction:column;box-shadow:0 24px 80px rgba(0,0,0,.22);animation:tpPopIn .22s cubic-bezier(.34,1.56,.64,1);}
.tp-notif-popup-head{padding:20px 20px 14px;border-bottom:1px solid var(--border);display:flex;align-items:flex-start;justify-content:space-between;gap:12px;flex-shrink:0;}
.tp-notif-popup-title{font-family:'Playfair Display',serif;font-size:18px;font-weight:700;}
.tp-notif-popup-sub{font-size:11px;color:var(--text-3);margin-top:2px;}
.tp-notif-popup-body{overflow-y:auto;padding:14px 16px 16px;flex:1;}
.tp-notif-item{display:flex;align-items:flex-start;gap:14px;background:var(--card);border:1px solid var(--border);border-radius:12px;padding:14px 16px;margin-bottom:8px;}
.tp-notif-unread{background:#FDFAF2;border-color:#E8D8A0;}
.tp-notif-icon-wrap{width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0;}
.tp-ni-amber{background:var(--amber-light);}
.tp-ni-green{background:var(--green-pale);}
.tp-ni-blue{background:#E8EEF8;}
.tp-notif-content{flex:1;}
.tp-notif-title{font-size:13px;font-weight:600;margin-bottom:2px;}
.tp-notif-body{font-size:12px;color:var(--text-2);line-height:1.5;}
.tp-notif-time{font-size:11px;color:var(--text-3);margin-top:4px;}
.tp-notif-action-row{margin-top:8px;}
.tp-unread-pip{width:8px;height:8px;border-radius:50%;background:var(--amber);flex-shrink:0;margin-top:4px;}

/* LESSON HISTORY */
.tp-history-month{font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:var(--text-3);margin:24px 0 10px;padding:0 2px;}
.tp-history-month:first-child{margin-top:0;}
.tp-lesson-card{background:var(--card);border:1px solid var(--border);border-radius:14px;padding:18px 20px;margin-bottom:10px;box-shadow:var(--shadow);transition:box-shadow .15s;}
.tp-lesson-card:hover{box-shadow:var(--shadow-lg);}
.tp-lc-top{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:12px;}
.tp-lc-date-block{display:flex;align-items:center;gap:12px;}
.tp-lc-date-box{width:44px;height:44px;background:var(--green-dark);border-radius:10px;display:flex;flex-direction:column;align-items:center;justify-content:center;flex-shrink:0;}
.tp-lc-day{font-size:16px;font-weight:700;color:#fff;line-height:1;}
.tp-lc-mon{font-size:9px;color:rgba(255,255,255,.7);text-transform:uppercase;letter-spacing:.05em;margin-top:1px;}
.tp-lc-title{font-family:'Playfair Display',serif;font-size:15px;font-weight:700;}
.tp-lc-meta{font-size:12px;color:var(--text-3);margin-top:2px;}
.tp-lc-topics{margin-bottom:10px;}
.tp-lc-topics-label{font-size:10px;letter-spacing:.08em;text-transform:uppercase;color:var(--text-3);margin-bottom:5px;}
.tp-lc-tags{display:flex;flex-wrap:wrap;gap:5px;}
.tp-lc-tag{background:var(--green-pale);color:var(--green-dark);font-size:11px;font-weight:500;padding:3px 9px;border-radius:20px;}
.tp-lc-notes{background:var(--cream-dark);border-radius:10px;padding:10px 13px;}
.tp-lc-notes-label{font-size:10px;letter-spacing:.08em;text-transform:uppercase;color:var(--text-3);margin-bottom:4px;}
.tp-lc-notes-text{font-size:12px;color:var(--text-2);line-height:1.6;}

/* HOURS & PAY */
.tp-hours-bar{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:20px;}
.tp-hours-card{background:var(--card);border:1px solid var(--border);border-radius:12px;padding:16px 18px;box-shadow:var(--shadow);}
.tp-hours-val{font-family:'Playfair Display',serif;font-size:26px;font-weight:800;color:var(--green-dark);}
.tp-hours-lbl{font-size:11px;color:var(--text-3);margin-top:3px;text-transform:uppercase;letter-spacing:.06em;}
.tp-hours-sub{font-size:12px;color:var(--text-2);margin-top:4px;}
.tp-psection-title{font-family:'Playfair Display',serif;font-size:16px;font-weight:700;margin-bottom:14px;}
.tp-hours-table{background:var(--card);border:1px solid var(--border);border-radius:14px;overflow:hidden;box-shadow:var(--shadow);margin-bottom:24px;}
.tp-ht-head{display:grid;grid-template-columns:2fr 1.5fr 1fr 1fr 1fr;background:var(--cream-dark);border-bottom:1px solid var(--border);}
.tp-ht-col{padding:10px 14px;font-size:10px;font-weight:600;letter-spacing:.07em;text-transform:uppercase;color:var(--text-3);}
.tp-ht-row{display:grid;grid-template-columns:2fr 1.5fr 1fr 1fr 1fr;border-bottom:1px solid var(--border);transition:background .1s;}
.tp-ht-row:last-child{border-bottom:none;}
.tp-ht-row:hover{background:var(--cream-dark);}
.tp-ht-cell{padding:12px 14px;font-size:12px;color:var(--text-2);display:flex;align-items:center;}
.tp-ht-bold{font-weight:600;color:var(--text-1);}
.tp-pay-badge{display:inline-flex;padding:3px 8px;border-radius:20px;font-size:10px;font-weight:600;}
.tp-pay-paid{background:var(--green-pale);color:var(--green-dark);}
.tp-pay-pending{background:var(--amber-light);color:#7A5010;}

/* PROFILE */
.tp-profile-wrap{max-width:640px;}
.tp-profile-av-section{display:flex;align-items:center;gap:18px;background:var(--card);border:1px solid var(--border);border-radius:14px;padding:20px;margin-bottom:20px;}
.tp-profile-av{width:64px;height:64px;border-radius:50%;background:var(--purple);color:#fff;display:flex;align-items:center;justify-content:center;font-size:22px;font-weight:700;flex-shrink:0;}
.tp-profile-av-name{font-family:'Playfair Display',serif;font-size:18px;font-weight:700;}
.tp-profile-av-role{font-size:12px;color:var(--text-3);margin-top:2px;}
.tp-profile-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:20px;}
.tp-pfield-group{}
.tp-pfield-input{width:100%;background:var(--card);border:1px solid var(--border);border-radius:9px;padding:9px 12px;font-size:13px;font-family:'DM Sans',sans-serif;color:var(--text-1);outline:none;transition:border-color .15s;}
.tp-pfield-input:focus{border-color:var(--purple-mid);}
.tp-qual-card{background:var(--card);border:1px solid var(--border);border-radius:12px;padding:16px 18px;margin-bottom:10px;display:flex;align-items:flex-start;gap:14px;}
.tp-qual-icon{width:38px;height:38px;border-radius:10px;background:var(--green-pale);display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0;}
.tp-qual-content{flex:1;}
.tp-qual-title{font-size:14px;font-weight:600;margin-bottom:2px;}
.tp-qual-meta{font-size:11px;color:var(--text-3);}
.tp-qual-status{display:inline-flex;align-items:center;gap:4px;font-size:10px;font-weight:600;padding:3px 9px;border-radius:20px;margin-top:5px;}
.tp-qs-verified{background:var(--green-pale);color:var(--green-dark);}
.tp-qs-pending{background:var(--amber-light);color:#7A5010;}
.tp-subj-tags{display:flex;flex-wrap:wrap;gap:8px;}
.tp-subj-tag{background:var(--card);border:1px solid var(--border);border-radius:10px;padding:10px 16px;font-size:13px;font-weight:500;cursor:pointer;transition:all .15s;}
.tp-subj-tag.active{background:var(--green-dark);border-color:var(--green-dark);color:#fff;}
.tp-subj-tag:not(.active):hover{background:var(--cream-dark);}

/* SETTINGS */
.tp-settings-wrap{max-width:600px;}
.tp-settings-title{font-family:'Playfair Display',serif;font-size:16px;font-weight:700;margin:24px 0 10px;}
.tp-settings-title:first-child{margin-top:0;}
.tp-setting-row{display:flex;align-items:center;justify-content:space-between;gap:16px;background:var(--card);border:1px solid var(--border);border-radius:12px;padding:14px 18px;margin-bottom:8px;}
.tp-setting-name{font-size:13px;font-weight:600;}
.tp-setting-sub{font-size:11px;color:var(--text-3);margin-top:2px;}
.tp-toggle{width:42px;height:24px;border-radius:12px;background:var(--border);position:relative;cursor:pointer;flex-shrink:0;transition:background .2s;}
.tp-toggle.active{background:var(--green-dark);}
.tp-toggle-knob{position:absolute;top:3px;left:3px;width:18px;height:18px;border-radius:50%;background:#fff;transition:left .2s;box-shadow:0 1px 3px rgba(0,0,0,.2);}
.tp-toggle.active .tp-toggle-knob{left:21px;}

::-webkit-scrollbar{width:5px;height:5px;}
::-webkit-scrollbar-track{background:transparent;}
::-webkit-scrollbar-thumb{background:var(--border);border-radius:3px;}
`;
document.head.appendChild(s3);
