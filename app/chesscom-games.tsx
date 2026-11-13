'use client';
import { useEffect,useRef,useState } from 'react';
type RemoteGame={id:string;pgn:string;white:string;black:string;whiteResult:string;blackResult:string;time:string;date:number};
type Cursor={month:string;offset:number}|null;
export function ChesscomGames({username,onUsername,onReview}:{username:string;onUsername:(name:string)=>void;onReview:(pgn:string)=>void}){
 const [draft,setDraft]=useState(username);const [games,setGames]=useState<RemoteGame[]>([]);const [cursor,setCursor]=useState<Cursor>(null);
 const [loading,setLoading]=useState(false);const [error,setError]=useState('');const [checked,setChecked]=useState<Date|null>(null);const [loaded,setLoaded]=useState(false);
 const request=useRef<AbortController|null>(null);const busy=useRef(false);const lastCheck=useRef(0);const olderLoaded=useRef(false);
 async function fetchGames(older:Cursor=null){
  if(!username||busy.current)return;
  busy.current=true;setLoading(true);setError('');const controller=new AbortController();request.current=controller;
  try{
   const query=new URLSearchParams({username});if(older){query.set('month',older.month);query.set('offset',String(older.offset));}
   const response=await fetch('/api/games?'+query,{signal:controller.signal});const data=await response.json() as {games:RemoteGame[];next:Cursor;error?:string};
   if(!response.ok)throw new Error(data.error||'Could not load games.');
   if(controller.signal.aborted)return;
   setGames(previous=>[...new Map([...previous,...data.games].map((g:RemoteGame)=>[g.id,g])).values()].sort((a,b)=>b.date-a.date));
   if(older||!olderLoaded.current)setCursor(data.next);if(older)olderLoaded.current=true;
   setChecked(new Date());setLoaded(true);lastCheck.current=Date.now();
  }catch(e){if(!controller.signal.aborted)setError((e as Error).message);}
  finally{if(request.current===controller){busy.current=false;setLoading(false);}}
 }
 useEffect(()=>{
  request.current?.abort();busy.current=false;setDraft(username);setGames([]);setCursor(null);setLoaded(false);setChecked(null);setError('');olderLoaded.current=false;lastCheck.current=0;
  if(username)void fetchGames();
  const refresh=()=>{if(document.visibilityState==='visible'&&Date.now()-lastCheck.current>60000)void fetchGames();};
  const timer=setInterval(refresh,60000);window.addEventListener('focus',refresh);document.addEventListener('visibilitychange',refresh);
  return()=>{request.current?.abort();clearInterval(timer);window.removeEventListener('focus',refresh);document.removeEventListener('visibilitychange',refresh);};
 },[username]);
 function connect(e:React.FormEvent){e.preventDefault();const name=draft.trim().toLowerCase();if(!/^[a-z0-9_-]{2,50}$/.test(name)){setError('Enter a valid Chess.com username.');return;}if(name===username)void fetchGames();else onUsername(name);}
 return <section className="connected-games"><div className="feed-header"><div><h1>My games</h1><p>Play on Chess.com. Open a game here to review it.</p></div>{username&&<button className="ghost" disabled={loading} onClick={()=>fetchGames()}>{loading?'Refreshing…':'Refresh games'}</button>}</div>
 <form className="connect-form" onSubmit={connect}><label htmlFor="chesscom-username">Chess.com username</label><div><input id="chesscom-username" value={draft} onChange={e=>setDraft(e.target.value)} placeholder="Your username" autoComplete="off" spellCheck={false}/><button className="primary" disabled={loading}>{username?'Save username':'Connect games'}</button></div><small>No password needed. Enter the same username on each device.</small></form>
 {error&&<p className="error-box" role="alert">{error}</p>}
 {username&&<div className="feed-status" aria-live="polite"><span>{loading?'Checking Chess.com…':checked?`Last checked ${checked.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}`:'Ready to connect'}</span><span>Refreshes automatically while this page is open</span></div>}
 {!!games.length&&<div className="remote-games">{games.map(g=>{const white=g.white.toLowerCase()===username.toLowerCase();const result=white?g.whiteResult:g.blackResult;const other=white?g.blackResult:g.whiteResult;const outcome=result==='win'?'Won':other==='win'?'Lost':'Draw';return <button className="remote-game" key={g.id} onClick={()=>onReview(g.pgn)}><span className={'game-result '+outcome.toLowerCase()}>{outcome}</span><span className="remote-opponent"><strong>vs {white?g.black:g.white}</strong><small>{g.time} · You played {white?'White':'Black'} · {new Date(g.date*1000).toLocaleDateString()}</small></span><span className="review-link">Review →</span></button>;})}</div>}
 {username&&loaded&&!games.length&&!loading&&<p className="feed-empty">No completed standard games in this archive.{cursor?' Try loading older games below.':''}</p>}
 {cursor&&<button className="ghost full" disabled={loading} onClick={()=>fetchGames(cursor)}>{loading?'Loading…':'Load older games'}</button>}
 <p className="feed-note">Newly finished games can take time to appear in Chess.com’s public archives. Reviews run when you open a game; analysis and manually imported PGNs are not synced between devices.</p>
 </section>;
}
