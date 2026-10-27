import { useEffect, useState } from 'react';
import Link from 'next/link';
const KEY = 'plotinos-reading-memory';
function read(){try{const value=JSON.parse(localStorage.getItem(KEY));return value && typeof value.title==='string' && typeof value.reference==='string' && typeof value.work==='string' ? value : null;}catch{return null;}}
export function ResumeReading(){
 const [memory,setMemory]=useState(null);
 useEffect(()=>{const update=()=>setMemory(read());update();window.addEventListener('storage',update);window.addEventListener('reading-memory-changed',update);return()=>{window.removeEventListener('storage',update);window.removeEventListener('reading-memory-changed',update);};},[]);
 if(!memory)return null;
 const href='/reader?'+new URLSearchParams({resume:'1',work:memory.work,ref:memory.reference});
 return <Link className="reader-resume" href={href} title={memory.title+' · '+memory.reference}><span>Okumaya devam et</span><span aria-hidden="true">·</span><strong>{memory.title}</strong><span aria-hidden="true">↗</span></Link>;
}
export function useReadingMemory({title,work,ready,page}){
 useEffect(()=>{
  if(!ready)return;
  let timer;
  const save=()=>{const rows=Array.from(document.querySelectorAll('.rdr-book-row'));const row=rows.find(el=>{const r=el.getBoundingClientRect();return r.bottom>110 && r.top<window.innerHeight;});if(!row)return;
   const reference=row.querySelector('.rdr-ref')?.textContent.trim();if(!reference)return;
   try{localStorage.setItem(KEY,JSON.stringify({title,work,reference}));window.dispatchEvent(new Event('reading-memory-changed'));}catch{}
  };
  const schedule=()=>{clearTimeout(timer);timer=setTimeout(save,180);};
  schedule();window.addEventListener('scroll',schedule,{passive:true});window.addEventListener('pagehide',save);
  return()=>{clearTimeout(timer);window.removeEventListener('scroll',schedule);window.removeEventListener('pagehide',save);};
 },[title,work,ready,page]);
}
export function useReaderView(){
 const [view,setView]=useState({wide:false,focus:false});
 useEffect(()=>{try{const saved=JSON.parse(localStorage.getItem(KEY+'-view'));if(saved)setView({wide:saved.wide===true,focus:false});}catch{}},[]);
 const update=next=>{setView(next);try{localStorage.setItem(KEY+'-view',JSON.stringify({wide:next.wide}));}catch{}};
 useEffect(()=>{if(!view.focus)return;const escape=e=>{if(e.key==='Escape')setView(v=>({...v,focus:false}));};window.addEventListener('keydown',escape);return()=>window.removeEventListener('keydown',escape);},[view.focus]);
 return [view,update];
}
export function ReadingTools({view,onChange}){return <div className="reader-view-tools" role="group" aria-label="Okuma görünümü"><button type="button" aria-pressed={view.wide} onClick={()=>onChange({...view,wide:!view.wide})}>Geniş görünüm</button><button type="button" aria-pressed={view.focus} onClick={()=>onChange({...view,focus:!view.focus})}>{view.focus?'Odaktan çık':'Odak modu'}</button></div>;}
