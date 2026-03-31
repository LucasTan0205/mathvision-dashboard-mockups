import { createTutorPortalContent, initTutorPortal } from '/src/pages/tutor-portal-page.js';
import '/src/entries/tutor-portal-styles.js';
import '/src/entries/tutor-portal-styles2.js';
import '/src/entries/tutor-portal-styles3.js';

const style = document.createElement('style');
style.textContent = `
:root {
  --cream:        #F5F0E8;
  --cream-dark:   #EDE6D6;
  --card:         #FAF7F2;
  --sidebar-bg:   #FDFAF5;
  --green-dark:   #2C4A3E;
  --green-mid:    #3D6B5A;
  --green-pale:   #E8F0EC;
  --amber:        #C8841A;
  --amber-light:  #F9EDD5;
  --red:          #B03A2E;
  --red-light:    #FDECEA;
  --purple:       #5B3D8A;
  --purple-mid:   #7B5DB0;
  --purple-pale:  #EDE8F8;
  --purple-line:  #C4B5E8;
  --slate:        #4A5568;
  --slate-bg:     #5A6880;
  --text-1:       #1A1A1A;
  --text-2:       #5A5A5A;
  --text-3:       #9A9A9A;
  --border:       #E2DAC8;
  --shadow:       0 1px 3px rgba(0,0,0,.06),0 4px 16px rgba(0,0,0,.04);
  --shadow-lg:    0 8px 28px rgba(0,0,0,.10);
}
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
body{font-family:'DM Sans',sans-serif;background:var(--cream);color:var(--text-1);height:100vh;overflow:hidden;}
#tp-root{display:flex;height:100vh;overflow:hidden;}

/* SIDEBAR */
.tp-sidebar{width:210px;min-width:210px;background:var(--sidebar-bg);border-right:1px solid var(--border);display:flex;flex-direction:column;flex-shrink:0;}
.tp-sb-header{padding:22px 18px 16px;border-bottom:1px solid var(--border);}
.tp-brand{display:flex;align-items:center;gap:10px;margin-bottom:16px;}
.tp-brand-icon{width:36px;height:36px;background:var(--purple);border-radius:9px;display:flex;align-items:center;justify-content:center;font-weight:700;color:#fff;font-size:13px;flex-shrink:0;}
.tp-brand-name{font-family:'Playfair Display',serif;font-size:14px;font-weight:700;}
.tp-brand-sub{font-size:10px;color:var(--text-3);letter-spacing:.07em;text-transform:uppercase;}
.tp-user-pill{background:var(--cream-dark);border-radius:10px;padding:11px;display:flex;align-items:center;gap:9px;}
.tp-avatar{width:32px;height:32px;border-radius:50%;background:var(--purple);color:#fff;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:600;flex-shrink:0;}
.tp-user-name{font-size:13px;font-weight:600;}
.tp-user-role{font-size:10px;color:var(--text-3);margin-top:1px;}
.tp-sb-nav{padding:16px 12px;flex:1;}
.tp-nav-label{font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:var(--text-3);padding:0 6px;margin-bottom:6px;}
.tp-nav-item{display:flex;align-items:center;gap:9px;padding:9px 10px;border-radius:10px;cursor:pointer;color:var(--text-2);font-size:13px;margin-bottom:2px;transition:background .15s;}
.tp-nav-item:hover{background:var(--cream-dark);color:var(--text-1);}
.tp-nav-item.active{background:var(--purple);color:#fff;}
.tp-nav-icon{width:15px;height:15px;opacity:.8;flex-shrink:0;}

/* MAIN */
.tp-main{flex:1;display:flex;flex-direction:column;overflow:hidden;}
.tp-topbar{background:var(--sidebar-bg);border-bottom:1px solid var(--border);padding:0 24px;height:54px;display:flex;align-items:center;justify-content:space-between;flex-shrink:0;}
.tp-breadcrumb{font-size:13px;color:var(--text-3);}
.tp-topbar-right{display:flex;align-items:center;gap:10px;}
.tp-notif-btn{width:32px;height:32px;border-radius:50%;border:1px solid var(--border);background:var(--cream-dark);display:flex;align-items:center;justify-content:center;cursor:pointer;position:relative;font-size:13px;}
.tp-notif-dot{position:absolute;top:-2px;right:-2px;width:11px;height:11px;background:var(--amber);border-radius:50%;font-size:7px;color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;}

/* PAGES */
.tp-page{flex:1;overflow-y:auto;}
.tp-content{max-width:100%;padding:28px 32px 60px;}
.tp-cal-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;gap:12px;flex-wrap:wrap;}
.tp-page-title{font-family:'Playfair Display',serif;font-size:28px;font-weight:800;}
.tp-page-sub{font-size:12px;color:var(--text-3);margin-top:2px;}
.tp-header-right{display:flex;align-items:center;gap:8px;}
.tp-section-title{margin-bottom:24px;}

/* BANNERS */
.tp-banner{border-radius:10px;padding:12px 16px;font-size:13px;margin-bottom:20px;line-height:1.5;}
.tp-banner--success{background:var(--green-pale);color:var(--green-dark);border:1px solid #B8D8C8;}
.tp-banner--error{background:var(--red-light);color:var(--red);border:1px solid #E0A090;}
.tp-info-banner{display:flex;align-items:flex-start;gap:10px;background:var(--purple-pale);border:1px solid var(--purple-line);border-radius:11px;padding:12px 16px;margin-bottom:14px;font-size:12px;color:var(--purple);}
.tp-info-banner-icon{font-size:16px;flex-shrink:0;margin-top:1px;}

/* FORM */
.tp-form-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:28px;}
.tp-field-full{grid-column:1/-1;}
.tp-field-group{display:flex;flex-direction:column;gap:5px;}
.tp-label{font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:var(--text-3);font-weight:500;}
.tp-input{background:var(--card);border:1px solid var(--border);border-radius:9px;padding:9px 12px;font-size:13px;font-family:'DM Sans',sans-serif;color:var(--text-1);outline:none;transition:border-color .15s;width:100%;}
.tp-input:focus{border-color:var(--purple-mid);}
.tp-input--error{border-color:var(--red)!important;}
.tp-field-error{font-size:11px;color:var(--red);display:none;min-height:14px;}
.tp-avail-section{margin-bottom:28px;}
.tp-avail-title{font-family:'Playfair Display',serif;font-size:18px;font-weight:700;margin-bottom:4px;}
.tp-avail-sub{font-size:12px;color:var(--text-3);margin-bottom:14px;}
.tp-form-actions{display:flex;justify-content:flex-end;}
`;
document.head.appendChild(style);

document.body.innerHTML = createTutorPortalContent();
initTutorPortal();
