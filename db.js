@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@400;500;600&family=Space+Mono:wght@400;700&display=swap');

:root{
  --bg:#1d1f24; --surface:#FBF8F3; --panel:#F4EEE3; --panel2:#FBF8F3;
  --ink:#2A2620; --muted:#9A8F7E; --line:#E7DECF;
  --today:#E0A33E; --done:#4F9E78; --urgent:#DD6B53;
  --display:'Space Grotesk',sans-serif; --body:'Inter',sans-serif; --mono:'Space Mono',monospace;
}
*{box-sizing:border-box;}
html,body,#root{height:100%; margin:0;}
body{background:var(--bg); font-family:var(--body); color:var(--ink); -webkit-font-smoothing:antialiased;}
.boot{position:fixed; inset:0; display:grid; place-items:center; color:var(--muted); font-family:var(--mono); background:var(--bg);}

/* ============ DASHBOARD ============ */
.dash-root{position:fixed; inset:0; background:var(--bg); padding:14px 16px 16px; display:flex; flex-direction:column; overflow:hidden;}
.binding{display:flex; gap:3px; padding:0 22px 5px; justify-content:space-between;}
.coil{width:8px; height:8px; border-radius:50%; background:linear-gradient(180deg,#f4d088,#b8801f); box-shadow:0 1px 1px rgba(0,0,0,.35); flex:1; max-width:8px;}
.page{flex:1; min-height:0; background:var(--surface); border-radius:4px; box-shadow:0 18px 50px rgba(0,0,0,.45), 0 2px 0 #d9cfbc inset; padding:16px 18px 14px; display:grid; grid-template-rows:auto 1fr 1.15fr; gap:12px; overflow:hidden;}

.topbar{display:flex; align-items:center; gap:24px; border-bottom:1.5px solid var(--line); padding-bottom:10px;}
.kicker{display:block; font-family:var(--mono); font-size:9px; letter-spacing:.18em; text-transform:uppercase; color:var(--muted);}
.weeklabel{font-family:var(--display); font-weight:700; font-size:21px; line-height:1.1; letter-spacing:-.01em;}
.brand{flex:0 0 auto;}
.theme{flex:1; min-width:0;}
.theme-input{width:100%; border:none; background:transparent; font-family:var(--display); font-size:18px; font-weight:500; color:var(--ink); outline:none; padding:2px 0;}
.theme-input::placeholder{color:var(--muted); font-weight:400;}
.nav{display:flex; gap:6px; align-items:center; flex:0 0 auto;}
.nav button,.navlink{font-family:var(--mono); font-size:12px; border:1.5px solid var(--line); background:var(--surface); color:var(--ink); border-radius:999px; padding:6px 12px; cursor:pointer; transition:.15s; text-decoration:none; line-height:1;}
.nav button:hover,.navlink:hover{border-color:var(--ink);}
.nav button.now{background:var(--ink); color:var(--surface); border-color:var(--ink);}
.signout{padding:6px 10px !important;}

.week{display:grid; grid-template-columns:repeat(7,1fr); gap:8px; min-height:0;}
.day{background:var(--panel2); border:1.5px solid var(--line); border-radius:6px; padding:8px 8px 6px; display:flex; flex-direction:column; min-height:0; overflow:hidden; position:relative;}
.day.today{border-color:var(--today); box-shadow:0 0 0 3px rgba(224,163,62,.16); background:#fffdf8;}
.day-head{display:flex; align-items:baseline; gap:6px; margin-bottom:5px;}
.day-name{font-family:var(--mono); font-size:10px; letter-spacing:.12em; text-transform:uppercase; color:var(--muted);}
.day-num{font-family:var(--display); font-weight:700; font-size:16px; margin-left:auto;}
.day.today .day-num{color:var(--today);}
.day-body{flex:1; min-height:0; overflow-y:auto; display:flex; flex-direction:column;}
.day-events{display:flex; flex-direction:column; gap:1px;}
.day-divider{height:1px; background:var(--line); margin:5px 1px;}
.day-items{display:flex; flex-direction:column; gap:1px;}
.erow{display:flex; align-items:center; gap:6px; padding:2px 0;}
.edot{width:6px; height:6px; border-radius:50%; background:#6E8BA6; flex:0 0 auto;}
.etext{flex:1; min-width:0; border:none; background:transparent; font-family:var(--body); font-size:11.5px; font-weight:600; color:#3f5d77; outline:none; padding:1px 0;}
.add.event input{color:#3f5d77;}
.add.event input::placeholder{color:#9fb2c4;}
.day-foot{font-family:var(--mono); font-size:9px; color:var(--muted); text-align:right; padding-top:3px;}

.lower{display:grid; grid-template-columns:repeat(6,1fr); gap:10px; min-height:0;}
.panel{background:var(--panel); border-radius:8px; padding:10px 11px; display:flex; flex-direction:column; min-height:0; overflow:hidden;}
.panel.big{background:#fff8ec; box-shadow:inset 0 0 0 1.5px rgba(224,163,62,.35);}
.panel-head{display:flex; align-items:center; gap:7px; margin-bottom:6px;}
.dot{width:8px; height:8px; border-radius:2px; flex:0 0 auto;}
.panel-head h3{margin:0; font-family:var(--display); font-size:13px; font-weight:600; letter-spacing:.01em;}
.count{margin-left:auto; font-family:var(--mono); font-size:10px; color:var(--muted);}
.hint{margin-left:auto; font-family:var(--mono); font-size:9px; color:var(--muted);}
.progress{height:3px; background:rgba(0,0,0,.06); border-radius:2px; overflow:hidden; margin-bottom:6px;}
.progress span{display:block; height:100%; border-radius:2px; transition:width .35s cubic-bezier(.2,.8,.2,1);}
.items{flex:1; min-height:0; overflow-y:auto; display:flex; flex-direction:column; gap:1px;}

.row{display:flex; align-items:center; gap:7px; padding:2px 0;}
.check{flex:0 0 auto; width:17px; height:17px; border-radius:5px; border:1.6px solid var(--muted); background:transparent; cursor:pointer; display:grid; place-items:center; padding:0; transition:.15s;}
.check .tick{width:11px; height:11px; fill:none; stroke:#fff; stroke-width:2.4; stroke-linecap:round; stroke-linejoin:round; stroke-dasharray:18; stroke-dashoffset:18; transition:stroke-dashoffset .25s ease;}
.check.on .tick{stroke-dashoffset:0;}
.check.on{animation:pop .25s ease;}
@keyframes pop{0%{transform:scale(1);}40%{transform:scale(1.25);}100%{transform:scale(1);}}
.row-text{flex:1; min-width:0; border:none; background:transparent; font-family:var(--body); font-size:13px; color:var(--ink); outline:none; padding:1px 0;}
.row.compact .row-text{font-size:12px;}
.row.done .row-text{color:var(--muted); text-decoration:line-through;}
.del{opacity:0; border:none; background:transparent; color:var(--muted); cursor:pointer; font-size:15px; line-height:1; padding:0 2px; flex:0 0 auto; transition:.15s;}
.row:hover .del{opacity:1;}
.del:hover{color:var(--urgent);}
.add input{width:100%; border:none; border-top:1px dashed transparent; background:transparent; font-family:var(--body); font-size:12.5px; color:var(--ink); outline:none; padding:4px 0 1px; margin-top:2px;}
.add input::placeholder{color:var(--muted);}
.add input:focus{border-top-color:var(--line);}
.add.subtle input{font-size:11px;}

.habits .habit-grid{display:grid; grid-template-columns:auto repeat(7,1fr); gap:3px; align-content:start; flex:1; min-height:0; overflow:auto;}
.habit-daycol{font-family:var(--mono); font-size:9px; color:var(--muted); text-align:center;}
.habit-daycol.today{color:var(--today); font-weight:700;}
.habit-name{font-family:var(--body); font-size:11px; display:flex; align-items:center; padding-right:4px; white-space:nowrap;}
.habit-cell{border:1.4px solid var(--line); border-radius:4px; background:var(--surface); cursor:pointer; aspect-ratio:1; min-height:14px; transition:.12s; padding:0;}
.habit-cell.today{border-color:var(--today);}
.habit-cell.on{background:var(--done); border-color:var(--done);}
.habit-cell:hover{border-color:var(--ink);}

.day-body::-webkit-scrollbar,.day-items::-webkit-scrollbar,.items::-webkit-scrollbar,.habit-grid::-webkit-scrollbar{width:5px;}
.day-body::-webkit-scrollbar-thumb,.day-items::-webkit-scrollbar-thumb,.items::-webkit-scrollbar-thumb,.habit-grid::-webkit-scrollbar-thumb{background:var(--line); border-radius:3px;}

/* ============ ROLLOVER NUDGE ============ */
.nudge-overlay{position:fixed; inset:0; background:rgba(29,31,36,.55); display:grid; place-items:center; z-index:50; backdrop-filter:blur(2px);}
.nudge{background:var(--surface); border-radius:12px; width:min(540px,92vw); max-height:80vh; overflow:auto; padding:22px 22px 16px; box-shadow:0 24px 60px rgba(0,0,0,.4);}
.nudge-head h2{margin:0 0 4px; font-family:var(--display); font-size:20px;}
.nudge-head p{margin:0 0 14px; color:var(--muted); font-size:13px;}
.nudge-item{border-top:1px solid var(--line); padding:11px 0;}
.nudge-when{font-family:var(--mono); font-size:10px; color:var(--urgent); letter-spacing:.05em; text-transform:uppercase;}
.nudge-body{font-size:15px; margin:3px 0 8px;}
.nudge-actions{display:flex; gap:7px; flex-wrap:wrap;}
.nudge-actions button{font-family:var(--mono); font-size:11px; border-radius:999px; padding:6px 12px; cursor:pointer; border:1.5px solid var(--line); background:var(--surface); color:var(--ink); transition:.15s;}
.nudge-move{background:var(--today) !important; border-color:var(--today) !important; color:#3a2a08 !important; font-weight:700;}
.nudge-actions button:hover{transform:translateY(-1px);}
.nudge-close{margin-top:14px; width:100%; border:none; background:transparent; color:var(--muted); font-family:var(--mono); font-size:11px; cursor:pointer; padding:8px;}

/* ============ AUTH ============ */
.auth-root{position:fixed; inset:0; background:var(--bg); display:grid; place-items:center; padding:20px;}
.auth-card{background:var(--surface); border-radius:10px; width:min(380px,94vw); padding:26px 24px 20px; box-shadow:0 20px 50px rgba(0,0,0,.45); position:relative;}
.auth-coil{display:flex; gap:4px; justify-content:center; margin-bottom:18px;}
.auth-coil span{width:7px; height:7px; border-radius:50%; background:linear-gradient(180deg,#f4d088,#b8801f);}
.auth-card h1{font-family:var(--display); font-size:22px; margin:0 0 4px; letter-spacing:-.01em;}
.auth-sub{color:var(--muted); font-size:13px; margin:0 0 18px;}
.auth-card input{width:100%; border:1.5px solid var(--line); border-radius:8px; padding:11px 12px; font-size:15px; font-family:var(--body); margin-bottom:10px; outline:none; background:#fff;}
.auth-card input:focus{border-color:var(--today);}
.auth-go{width:100%; border:none; background:var(--ink); color:var(--surface); font-family:var(--display); font-weight:600; font-size:15px; padding:12px; border-radius:8px; cursor:pointer;}
.auth-go:disabled{opacity:.6;}
.auth-msg{margin-top:10px; font-size:12px; color:var(--urgent);}
.auth-switch{margin-top:14px; width:100%; border:none; background:transparent; color:var(--muted); font-family:var(--mono); font-size:11px; cursor:pointer;}

/* ============ CAPTURE (phone) ============ */
.cap-root{position:fixed; inset:0; background:var(--bg); color:var(--surface); display:flex; flex-direction:column; padding:max(18px,env(safe-area-inset-top)) 18px 18px;}
.cap-head{display:flex; align-items:center; justify-content:space-between; margin-bottom:18px;}
.cap-title{font-family:var(--display); font-weight:700; font-size:20px;}
.cap-link{color:var(--today); font-family:var(--mono); font-size:12px; text-decoration:none;}
.cap-box{display:flex; flex-direction:column;}
.cap-input{width:100%; min-height:140px; resize:none; border:1.5px solid #3a3d44; border-radius:12px; background:#26282e; color:var(--surface); font-family:var(--body); font-size:18px; line-height:1.4; padding:16px; outline:none;}
.cap-input:focus{border-color:var(--today);}
.cap-input::placeholder{color:#7a7f88;}
.cap-add{margin-top:12px; border:none; background:var(--today); color:#3a2a08; font-family:var(--display); font-weight:700; font-size:18px; padding:16px; border-radius:12px; cursor:pointer;}
.cap-add:active{transform:scale(.99);}
.cap-status{display:flex; gap:10px; align-items:center; min-height:22px; margin-top:10px;}
.cap-flash{color:var(--done); font-family:var(--mono); font-size:12px;}
.cap-queued{color:var(--today); font-family:var(--mono); font-size:11px; margin-left:auto;}
.cap-recent{margin-top:22px; overflow-y:auto;}
.cap-recent-label{font-family:var(--mono); font-size:10px; letter-spacing:.15em; text-transform:uppercase; color:#7a7f88; margin-bottom:8px;}
.cap-recent-item{background:#26282e; border-radius:8px; padding:11px 13px; margin-bottom:7px; font-size:15px;}

@media (prefers-reduced-motion: reduce){*{animation:none !important; transition:none !important;}}

/* small screens: let the dashboard scroll instead of clipping (it redirects to /capture on phones anyway) */
@media (max-width:900px){
  .lower{grid-template-columns:repeat(2,1fr);}
  .page{grid-template-rows:auto auto auto; overflow:auto;}
  .dash-root{overflow:auto; position:absolute;}
}
