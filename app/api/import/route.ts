import { Chess } from 'chess.js';
const json=(data:unknown,status=200)=>Response.json(data,{status});
async function get(url:string){
 const r=await fetch(url,{headers:{'User-Agent':'ChessReview/1.0 (personal chess analysis)','Accept':'application/json'},signal:AbortSignal.timeout(10000)});
 if(r.status===429)throw new Error('Chess.com is rate limiting requests. Please try again in a minute.');
 if(!r.ok)throw new Error(`Chess.com returned ${r.status}. Check the username or use PGN import.`);
 return r.json() as Promise<any>;
}
export async function POST(req:Request){
 try{
 const body=await req.json() as {link?:string;username?:string;month?:string};
 let username=String(body.username||'').trim();let month=body.month;let id='';let kind='live';
 if(body.link){let url:URL;try{url=new URL(body.link);}catch{return json({error:'Paste a complete Chess.com game URL.'},400);}
 if(!['chess.com','www.chess.com'].includes(url.hostname)||url.protocol!=='https:')return json({error:'Use a https://www.chess.com game link.'},400);
 const match=url.pathname.match(/\/(?:analysis\/game|game)\/(live|daily)\/(\d+)/)||url.pathname.match(/\/(live|daily)\/game\/(\d+)/);
 if(!match)return json({error:'Use a game link such as chess.com/game/live/123456789. Review/share links may need PGN import.'},400);
 kind=match[1];id=match[2];
 // Chess.com's game callback is best-effort; the documented archive API is the fallback.
 try{const data=await get(`https://www.chess.com/callback/${kind}/game/${id}`);let pgn=data.pgn||data.game?.pgn;
 if(typeof pgn==='string'){const c=new Chess();c.loadPgn(pgn);if(c.history().length)return json({pgn});}
 const game=data.game; if(game?.isFinished===false)return json({error:'Finish your game before importing it for review.'},400); if(game?.pgnHeaders?.White&&!username)username=String(game.pgnHeaders.White); if(game?.endTime&&!month)month=new Date(game.endTime*1000).toISOString().slice(0,7); if(game?.moveList && typeof game.moveList==='string' && game.moveList.includes(' ')) {const c=new Chess();c.loadPgn(game.moveList);if(c.history().length)return json({pgn:c.pgn()});}
 }catch{/* private callback can be unavailable; continue through the public API */}
 }
 if(!username)return json({error:'Add your Chess.com username so we can locate this game in your public archives.',needsUsername:true},422);
 if(!/^[a-zA-Z0-9_-]{2,50}$/.test(username))return json({error:'Enter a valid Chess.com username.'},400);
 const base=`https://api.chess.com/pub/player/${encodeURIComponent(username.toLowerCase())}/games`;
 let archives:string[];
 if(month){if(!/^\d{4}-(0[1-9]|1[0-2])$/.test(month))return json({error:'Choose a valid month.'},400);archives=[`${base}/${month.replace('-','/')}`];}
 else {const data=await get(base+'/archives');archives=(data.archives||[]).filter((a:unknown)=>typeof a==='string'&&a.startsWith(base+'/')).slice(-12).reverse();}
 for(const archive of archives){const data=await get(archive);const games=(data.games||[]).filter((g:any)=>g.pgn&&g.rules==='chess');
 if(id){const found=games.find((g:any)=>g.url?.match(/\/(\d+)\/?$/)?.[1]===id && (kind==='daily'?!g.url.includes('/live/'):g.url.includes('/live/')));if(found)return json({pgn:found.pgn});}
 else if(games.length)return json({games:games.slice(-20).reverse().map((g:any)=>({pgn:g.pgn,url:g.url,white:g.white.username,black:g.black.username,result:g.white.result,time:g.time_class,date:g.end_time}))});
 }
 return json({error:id?'Game not found in the selected archives. Choose the game’s month or paste its PGN. Newly finished games can take time to appear.':'No standard chess games found. Choose a different month.'},404);
 }catch(e){return json({error:e instanceof Error?e.message:'Import failed. Try PGN import.'},502);}
}
