import { createStudentPortalContent, initStudentPortal } from '/src/pages/student-portal-page.js';

const style = document.createElement('style');
style.textContent = `
:root {
  --cream:      #F5F0E8;
  --cream-dark: #EDE6D6;
  --card:       #FAF7F2;
  --sidebar-bg: #FDFAF5;
  --green-dark: #2C4A3E;
  --green-mid:  #3D6B5A;
  --green-pale: #E8F0EC;
  --amber:      #C8841A;
  --amber-light:#F9EDD5;
  --red:        #B03A2E;
  --red-light:  #FDECEA;
  --text-1:     #1A1A1A;
  --text-2:     #5A5A5A;
  --text-3:     #9A9A9A;
  --border:     #E2DAC8;
  --shadow:     0 1px 3px rgba(0,0,0,.06),0 4px 16px rgba(0,0,0,.04);
  --shadow-lg:  0 8px 28px rgba(0,0,0,.10);
  --select-bg:  rgba(44,74,62,.15);
}
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
body{font-family:'DM Sans',sans-serif;background:var(--cream);color:var(--text-1);height:100vh;overflow:hidden;}
#sp-root{display:flex;height:100vh;overflow:hidden;}

/* SIDEBAR */
.sp-sidebar{width:210px;min-width:210px;background:var(--sidebar-bg);border-right:1px solid var(--border);display:flex;flex-direction:column;flex-shrink:0;}
.sp-sb-header{padding:22px 18px 16px;border-bottom:1px solid var(--border);}
.sp-brand{display:flex;align-items:center;gap:10px;margin-bottom:16px;}
.sp-brand-icon{width:36px;height:36px;background:var(--green-dark);border-radius:9px;display:flex;align-items:center;justify-content:center;font-weight:700;color:#fff;font-size:13px;flex-shrink:0;}
.sp-brand-name{font-family:'Playfair Display',serif;font-size:14px;font-weight:700;}
.sp-brand-sub{font-size:10px;color:var(--text-3);letter-spacing:.07em;text-transform:uppercase;}
.sp-user-pill{background:var(--cream-dark);border-radius:10px;padding:11px;display:flex;align-items:center;gap:9px;}
.sp-avatar{width:32px;height:32px;border-radius:50%;background:var(--green-dark);color:#fff;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:600;flex-shrink:0;}
.sp-user-name{font-size:13px;font-weight:600;}
.sp-user-role{font-size:10px;color:var(--text-3);margin-top:1px;}
.sp-sb-nav{padding:16px 12px;flex:1;}
.sp-nav-label{font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:var(--text-3);padding:0 6px;margin-bottom:6px;}
.sp-nav-item{display:flex;align-items:center;gap:9px;padding:9px 10px;border-radius:10px;cursor:pointer;color:var(--text-2);font-size:13px;margin-bottom:2px;transition:background .15s;}
.sp-nav-item:hover{background:var(--cream-dark);color:var(--text-1);}
.sp-nav-item.active{background:var(--green-dark);color:#fff;}
.sp-nav-icon{width:15px;height:15px;opacity:.8;flex-shrink:0;}

/* MAIN */
.sp-main{flex:1;display:flex;flex-direction:column;overflow:hidden;}
.sp-topbar{background:var(--sidebar-bg);border-bottom:1px solid var(--border);padding:0 24px;height:54px;display:flex;align-items:center;justify-content:space-between;flex-shrink:0;}
.sp-breadcrumb{font-size:13px;color:var(--text-3);}
.sp-topbar-right{display:flex;align-items:center;gap:10px;}
.sp-notif-btn{width:32px;height:32px;border-radius:50%;border:1px solid var(--border);background:var(--cream-dark);display:flex;align-items:center;justify-content:center;cursor:pointer;position:relative;font-size:13px;}
.sp-notif-dot{position:absolute;top:-2px;right:-2px;width:11px;height:11px;background:var(--amber);border-radius:50%;font-size:7px;color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;}

/* PAGES */
.sp-page{flex:1;overflow-y:auto;}
.sp-content{max-width:100%;padding:28px 32px 60px;}
.sp-cal-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;gap:12px;flex-wrap:wrap;}
.sp-page-title{font-family:'Playfair Display',serif;font-size:28px;font-weight:800;}
.sp-page-sub{font-size:12px;color:var(--text-3);margin-top:2px;}
.sp-header-right{display:flex;align-items:center;gap:8px;}
.sp-section-title{margin-bottom:24px;}

/* BANNERS */
.sp-banner{border-radius:10px;padding:12px 16px;font-size:13px;margin-bottom:20px;line-height:1.5;}
.sp-banner--success{background:var(--green-pale);color:var(--green-dark);border:1px solid #B8D8C8;}
.sp-banner--error{background:var(--red-light);color:var(--red);border:1px solid #E0A090;}

/* FORM */
.sp-form-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:28px;}
.sp-field-full{grid-column:1/-1;}
.sp-field-group{display:flex;flex-direction:column;gap:5px;}
.sp-label{font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:var(--text-3);font-weight:500;}
.sp-input{background:var(--card);border:1px solid var(--border);border-radius:9px;padding:9px 12px;font-size:13px;font-family:'DM Sans',sans-serif;color:var(--text-1);outline:none;transition:border-color .15s;width:100%;}
.sp-input:focus{border-color:var(--green-mid);}
.sp-input--error{border-color:var(--red)!important;}
.sp-field-error{font-size:11px;color:var(--red);display:none;min-height:14px;}
.sp-avail-section{margin-bottom:28px;}
.sp-avail-title{font-family:'Playfair Display',serif;font-size:18px;font-weight:700;margin-bottom:4px;}
.sp-avail-sub{font-size:12px;color:var(--text-3);margin-bottom:14px;}
.sp-form-actions{display:flex;justify-content:flex-end;}
`;
document.head.appendChild(style);

const style2 = document.createElement('style');
style2.textContent = `
/* BUTTONS */
.sp-btn{border:none;border-radius:10px;padding:7px 15px;font-size:12px;font-family:'DM Sans',sans-serif;cursor:pointer;font-weight:500;transition:all .15s;}
.sp-btn--outline{background:transparent;border:1px solid var(--border);color:var(--text-2);}
.sp-btn--outline:hover{background:var(--cream-dark);}
.sp-btn--primary{background:var(--green-dark);color:#fff;}
.sp-btn--primary:hover{background:var(--green-mid);}
.sp-btn--primary:disabled{background:#C4BDB0;cursor:not-allowed;}

/* TIMETABLE GRID */
.sp-tt-outer{background:var(--card);border:1px solid var(--border);border-radius:14px;overflow:auto;box-shadow:var(--shadow);}
.sp-tt-grid{display:grid;grid-template-columns:52px repeat(7,1fr);min-width:560px;user-select:none;}
.sp-hcell{padding:10px 6px;text-align:center;border-bottom:1px solid var(--border);font-size:10px;font-weight:600;color:var(--text-3);letter-spacing:.05em;}
.sp-hcell--today{color:var(--green-dark);}
.sp-day-num{font-family:'Playfair Display',serif;font-size:19px;font-weight:700;color:var(--text-1);display:block;line-height:1.2;}
.sp-hcell--today .sp-day-num{color:var(--green-dark);}
.sp-today-pip{display:inline-block;width:4px;height:4px;background:var(--green-dark);border-radius:50%;margin-left:3px;vertical-align:middle;}
.sp-tcell{padding:0 5px;font-size:9px;color:var(--text-3);border-right:1px solid var(--border);border-bottom:1px solid var(--border);display:flex;align-items:flex-start;padding-top:3px;height:32px;}
.sp-tcell--half{border-bottom:1px dashed #E8E0CE;}
.sp-tcell--corner{border-bottom:1px solid var(--border);height:auto;}
.sp-slot{height:32px;border-right:1px solid var(--border);border-bottom:1px solid var(--border);position:relative;transition:background .1s;}
.sp-slot--half{border-bottom:1px dashed #E8E0CE;}
.sp-slot--bookable{cursor:crosshair;}
.sp-slot--bookable:hover{background:rgba(44,74,62,.06);}
.sp-slot--locked{cursor:not-allowed;background:repeating-linear-gradient(45deg,transparent,transparent 4px,rgba(0,0,0,.025) 4px,rgba(0,0,0,.025) 8px);}
.sp-slot--selecting{background:var(--select-bg)!important;}
.sp-slot--selected{background:rgba(44,74,62,.18)!important;}
.sp-slot--selected::after{content:'';position:absolute;inset:1px;border:1.5px solid var(--green-dark);border-radius:3px;pointer-events:none;}

/* SESSION BLOCKS */
.sp-sess-block{position:absolute;left:3px;right:3px;top:2px;border-radius:6px;padding:4px 7px;cursor:pointer;z-index:2;background:var(--green-dark);transition:opacity .15s;}
.sp-sess-block:hover{opacity:.82;}
.sp-sess-pending{background:rgba(44,74,62,.14);border:1.5px dashed var(--green-dark);}
.sp-sess-pending .sp-sess-time{color:var(--green-mid);}
.sp-sess-pending .sp-sess-tutor{color:var(--text-3);}
.sp-sess-done{filter:saturate(.55) brightness(.92);}
.sp-sess-time{font-size:9px;color:rgba(255,255,255,.75);font-weight:500;}
.sp-sess-tutor{font-size:9px;color:rgba(255,255,255,.62);margin-top:1px;}

/* TIMETABLE NAV */
.sp-tt-nav-wrap{display:flex;align-items:flex-start;gap:10px;}
.sp-tt-side-btn{width:32px;height:32px;border-radius:50%;border:1px solid var(--border);background:var(--card);display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:15px;color:var(--text-2);flex-shrink:0;transition:background .15s;margin-top:11px;}
.sp-tt-side-btn:hover{background:var(--cream-dark);}
.sp-week-display{font-family:'Playfair Display',serif;font-size:22px;font-weight:800;color:var(--text-1);margin-bottom:10px;text-align:center;}
.sp-legend{display:flex;align-items:center;gap:14px;margin-bottom:12px;flex-wrap:wrap;}
.sp-leg-item{display:flex;align-items:center;gap:5px;font-size:11px;color:var(--text-2);}
.sp-leg-dot{width:9px;height:9px;border-radius:2px;}
.sp-rule-notice{display:none;align-items:center;gap:8px;background:#FFF8EE;border:1px solid #F0D8A0;border-radius:10px;padding:9px 14px;margin-bottom:12px;font-size:12px;color:#7A5010;}
.sp-rule-notice.sp-visible{display:flex;}
.sp-sel-bar{display:none;align-items:center;gap:10px;background:var(--amber-light);border:1px solid #E8C88A;border-radius:11px;padding:10px 16px;margin-bottom:14px;}
.sp-sel-bar.sp-visible{display:flex;}
.sp-sel-bar-text{flex:1;font-size:12px;color:#7A5010;}
.sp-sel-bar-text strong{color:#5A3800;}

/* EMPTY STATE */
.sp-empty-state{text-align:center;padding:60px 20px;color:var(--text-3);font-size:13px;line-height:1.6;}
.sp-empty-icon{font-size:36px;margin-bottom:12px;opacity:.6;}

/* TOAST */
.sp-toast{position:fixed;bottom:24px;left:50%;transform:translateX(-50%) translateY(60px);background:var(--green-dark);color:#fff;padding:11px 22px;border-radius:30px;font-size:12px;font-weight:500;opacity:0;transition:all .3s;z-index:999;white-space:nowrap;pointer-events:none;}
.sp-toast--show{opacity:1;transform:translateX(-50%) translateY(0);}

/* OVERLAYS */
.sp-overlay{display:none;position:fixed;inset:0;background:rgba(20,15,8,.42);z-index:200;align-items:center;justify-content:center;backdrop-filter:blur(2px);}
.sp-overlay.open{display:flex;}
@keyframes spPopIn{from{opacity:0;transform:scale(.93) translateY(10px);}to{opacity:1;transform:none;}}
.sp-popup{background:var(--card);border-radius:20px;width:400px;max-height:88vh;overflow-y:auto;box-shadow:0 24px 80px rgba(0,0,0,.22);animation:spPopIn .22s cubic-bezier(.34,1.56,.64,1);}
.sp-pop-head{padding:22px 22px 0;display:flex;align-items:flex-start;justify-content:space-between;gap:10px;}
.sp-pop-close{width:26px;height:26px;border-radius:50%;border:1px solid var(--border);background:var(--cream-dark);display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:13px;color:var(--text-2);flex-shrink:0;}
.sp-pop-close:hover{background:var(--border);}
.sp-pop-body{padding:16px 22px 22px;}
.sp-pop-label{font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:var(--text-3);margin-bottom:8px;}
.sp-pop-date{font-family:'Playfair Display',serif;font-size:22px;font-weight:700;line-height:1.2;margin-bottom:14px;}
.sp-status-pill{display:inline-flex;align-items:center;gap:5px;padding:4px 12px;border-radius:20px;font-size:11px;font-weight:600;margin-bottom:14px;}
.sp-sp-pending{background:var(--amber-light);color:#7A5010;}
.sp-sp-confirmed{background:var(--green-pale);color:var(--green-dark);}
.sp-sp-done{background:#EDE0F5;color:#6A3E9A;}
.sp-time-card{display:flex;align-items:center;gap:12px;background:var(--cream-dark);border-radius:11px;padding:13px 15px;margin-bottom:14px;}
.sp-time-icon{font-size:20px;}
.sp-time-val{font-size:13px;font-weight:600;}
.sp-time-sub{font-size:11px;color:var(--text-3);margin-top:1px;}
.sp-tutor-card{display:flex;align-items:center;gap:12px;background:var(--cream-dark);border-radius:11px;padding:14px;margin-bottom:14px;}
.sp-tutor-av{width:46px;height:46px;border-radius:50%;background:var(--green-dark);display:flex;align-items:center;justify-content:center;font-size:16px;font-weight:700;color:#fff;flex-shrink:0;}
.sp-tutor-name{font-size:14px;font-weight:600;}
.sp-tutor-badge{display:inline-flex;align-items:center;gap:3px;background:var(--green-pale);color:var(--green-dark);font-size:10px;font-weight:600;padding:2px 8px;border-radius:20px;margin-top:5px;}
.sp-info-box{background:var(--cream-dark);border-radius:10px;padding:12px 14px;font-size:12px;color:var(--text-3);}
.sp-cancel-btn{width:100%;margin-top:4px;background:transparent;border:1px solid #E0A090;color:var(--red);border-radius:10px;padding:9px;font-size:12px;font-family:'DM Sans',sans-serif;cursor:pointer;font-weight:500;transition:background .15s;}
.sp-cancel-btn:hover{background:var(--red-light);}
.sp-fb-section{background:var(--cream-dark);border-radius:11px;padding:14px;margin-bottom:4px;}
.sp-fb-title{font-size:13px;font-weight:600;margin-bottom:2px;}
.sp-fb-sub{font-size:11px;color:var(--text-3);margin-bottom:10px;}
.sp-stars-row{display:flex;gap:7px;margin-bottom:10px;}
.sp-star-btn{font-size:26px;cursor:pointer;color:#D4C8B0;line-height:1;transition:color .1s;}
.sp-fb-textarea{width:100%;background:#fff;border:1px solid var(--border);border-radius:8px;padding:9px 11px;font-size:12px;font-family:'DM Sans',sans-serif;color:var(--text-1);resize:none;height:66px;outline:none;margin-bottom:8px;}
.sp-fb-textarea:focus{border-color:var(--green-mid);}
.sp-fb-done{background:var(--green-pale);border-radius:10px;padding:13px;text-align:center;color:var(--green-dark);font-size:13px;font-weight:500;}

/* CONFIRM / CANCEL MODAL */
.sp-confirm-box{background:var(--card);border-radius:20px;width:370px;box-shadow:0 24px 64px rgba(0,0,0,.18);animation:spPopIn .22s cubic-bezier(.34,1.56,.64,1);padding:28px;}
.sp-cb-icon{font-size:32px;margin-bottom:10px;}
.sp-cb-title{font-family:'Playfair Display',serif;font-size:21px;font-weight:700;margin-bottom:5px;}
.sp-cb-sub{font-size:12px;color:var(--text-2);line-height:1.6;margin-bottom:16px;}
.sp-cb-slots{background:var(--cream-dark);border-radius:10px;padding:13px;margin-bottom:18px;}
.sp-cb-row{display:flex;align-items:center;gap:8px;font-size:12px;margin-bottom:5px;}
.sp-cb-row:last-child{margin-bottom:0;}
.sp-cb-dot{width:6px;height:6px;border-radius:50%;background:var(--green-dark);flex-shrink:0;}
.sp-modal-actions{display:flex;gap:8px;}
.sp-modal-actions .sp-btn{flex:1;text-align:center;}

/* NOTIFICATIONS */
.sp-notif-overlay{display:none;position:fixed;inset:0;background:rgba(20,15,8,.42);z-index:200;align-items:flex-start;justify-content:flex-end;backdrop-filter:blur(2px);padding:60px 24px 0;}
.sp-notif-overlay.open{display:flex;}
.sp-notif-popup{background:var(--card);border-radius:18px;width:420px;max-height:80vh;display:flex;flex-direction:column;box-shadow:0 24px 80px rgba(0,0,0,.22);animation:spPopIn .22s cubic-bezier(.34,1.56,.64,1);}
.sp-notif-popup-head{padding:20px 20px 14px;border-bottom:1px solid var(--border);display:flex;align-items:flex-start;justify-content:space-between;gap:12px;flex-shrink:0;}
.sp-notif-popup-title{font-family:'Playfair Display',serif;font-size:18px;font-weight:700;}
.sp-notif-popup-sub{font-size:11px;color:var(--text-3);margin-top:2px;}
.sp-notif-popup-body{overflow-y:auto;padding:14px 16px 16px;flex:1;}
.sp-notif-item{display:flex;align-items:flex-start;gap:14px;background:var(--card);border:1px solid var(--border);border-radius:12px;padding:14px 16px;margin-bottom:8px;transition:box-shadow .15s;}
.sp-notif-unread{background:#FDFAF2;border-color:#E8D8A0;}
.sp-notif-icon-wrap{width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0;}
.sp-ni-amber{background:var(--amber-light);}
.sp-ni-green{background:var(--green-pale);}
.sp-notif-content{flex:1;}
.sp-notif-title{font-size:13px;font-weight:600;margin-bottom:2px;}
.sp-notif-body{font-size:12px;color:var(--text-2);line-height:1.5;}
.sp-notif-time{font-size:11px;color:var(--text-3);margin-top:4px;}
.sp-notif-action{margin-top:8px;}
.sp-unread-pip{width:8px;height:8px;border-radius:50%;background:var(--amber);flex-shrink:0;margin-top:4px;}

/* LESSON HISTORY */
.sp-history-month{font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:var(--text-3);margin:24px 0 10px;padding:0 2px;}
.sp-history-month:first-child{margin-top:0;}
.sp-lesson-card{background:var(--card);border:1px solid var(--border);border-radius:14px;padding:20px 22px;margin-bottom:10px;box-shadow:var(--shadow);transition:box-shadow .15s;}
.sp-lesson-card:hover{box-shadow:var(--shadow-lg);}
.sp-lc-top{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:14px;}
.sp-lc-date-block{display:flex;align-items:center;gap:12px;}
.sp-lc-date-box{width:44px;height:44px;background:var(--green-dark);border-radius:10px;display:flex;flex-direction:column;align-items:center;justify-content:center;flex-shrink:0;}
.sp-lc-day{font-size:16px;font-weight:700;color:#fff;line-height:1;}
.sp-lc-mon{font-size:9px;color:rgba(255,255,255,.7);text-transform:uppercase;letter-spacing:.05em;margin-top:1px;}
.sp-lc-title{font-family:'Playfair Display',serif;font-size:16px;font-weight:700;}
.sp-lc-meta{font-size:12px;color:var(--text-3);margin-top:3px;}
.sp-lc-rating{display:flex;align-items:center;gap:4px;}
.sp-star{font-size:13px;color:#C8841A;}
.sp-star-empty{color:#D4C8B0;}
.sp-rating-num{font-size:11px;color:var(--text-3);margin-left:2px;}
.sp-lc-topics{margin-bottom:12px;}
.sp-lc-topics-label{font-size:10px;letter-spacing:.08em;text-transform:uppercase;color:var(--text-3);margin-bottom:6px;}
.sp-lc-tags{display:flex;flex-wrap:wrap;gap:6px;}
.sp-lc-tag{background:var(--green-pale);color:var(--green-dark);font-size:11px;font-weight:500;padding:4px 10px;border-radius:20px;}
.sp-lc-notes{background:var(--cream-dark);border-radius:10px;padding:12px 14px;}
.sp-lc-notes-label{font-size:10px;letter-spacing:.08em;text-transform:uppercase;color:var(--text-3);margin-bottom:5px;}
.sp-lc-notes-text{font-size:12px;color:var(--text-2);line-height:1.6;}
.sp-lc-tutor-row{display:flex;align-items:center;gap:8px;margin-top:12px;padding-top:12px;border-top:1px solid var(--border);}
.sp-lc-tutor-av{width:28px;height:28px;border-radius:50%;background:var(--green-mid);color:#fff;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;flex-shrink:0;}
.sp-lc-tutor-name{font-size:12px;font-weight:500;color:var(--text-2);}
.sp-lc-dur{margin-left:auto;font-size:11px;color:var(--text-3);}

/* PROFILE */
.sp-psection-title{font-family:'Playfair Display',serif;font-size:16px;font-weight:700;margin-bottom:14px;color:var(--text-1);}
.sp-profile-wrap{max-width:640px;}
.sp-profile-av-section{display:flex;align-items:center;gap:18px;background:var(--card);border:1px solid var(--border);border-radius:14px;padding:20px;margin-bottom:20px;}
.sp-profile-av{width:64px;height:64px;border-radius:50%;background:var(--green-dark);color:#fff;display:flex;align-items:center;justify-content:center;font-size:22px;font-weight:700;flex-shrink:0;}
.sp-profile-av-name{font-family:'Playfair Display',serif;font-size:18px;font-weight:700;}
.sp-profile-av-role{font-size:12px;color:var(--text-3);margin-top:2px;}
.sp-profile-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:20px;}
.sp-pfield-group{}
.sp-pfield-label{font-size:10px;letter-spacing:.08em;text-transform:uppercase;color:var(--text-3);margin-bottom:5px;}
.sp-pfield-input{width:100%;background:var(--card);border:1px solid var(--border);border-radius:9px;padding:9px 12px;font-size:13px;font-family:'DM Sans',sans-serif;color:var(--text-1);outline:none;transition:border-color .15s;}
.sp-pfield-input:focus{border-color:var(--green-mid);}

/* SETTINGS */
.sp-settings-wrap{max-width:600px;}
.sp-settings-title{font-family:'Playfair Display',serif;font-size:16px;font-weight:700;margin:24px 0 10px;}
.sp-settings-title:first-child{margin-top:0;}
.sp-setting-row{display:flex;align-items:center;justify-content:space-between;gap:16px;background:var(--card);border:1px solid var(--border);border-radius:12px;padding:14px 18px;margin-bottom:8px;}
.sp-setting-name{font-size:13px;font-weight:600;}
.sp-setting-sub{font-size:11px;color:var(--text-3);margin-top:2px;}
.sp-toggle{width:42px;height:24px;border-radius:12px;background:var(--border);position:relative;cursor:pointer;flex-shrink:0;transition:background .2s;}
.sp-toggle.active{background:var(--green-dark);}
.sp-toggle-knob{position:absolute;top:3px;left:3px;width:18px;height:18px;border-radius:50%;background:#fff;transition:left .2s;box-shadow:0 1px 3px rgba(0,0,0,.2);}
.sp-toggle.active .sp-toggle-knob{left:21px;}

::-webkit-scrollbar{width:5px;height:5px;}
::-webkit-scrollbar-track{background:transparent;}
::-webkit-scrollbar-thumb{background:var(--border);border-radius:3px;}
`;
document.head.appendChild(style2);

document.body.innerHTML = createStudentPortalContent();
initStudentPortal();
