// Only finished, standard games from Chess.com's documented public archives.
const json=(data:unknown,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store'}});
async function get(url:string){
 const response=await fetch(url,{headers:{'User-Agent':'ChessReview/1.0 (personal chess analysis)','Accept':'application/json'},signal:AbortSignal.timeout(12000)});
 if(response.status===404)throw new Error('Chess.com could not find this username. Check the spelling.');
 if(response.status===429)throw new Error('Chess.com is busy. Try refreshing again in a minute.');
 if(!response.ok)throw new Error('Chess.com is unavailable right now. Your saved games are still available below.');
 return response.json() as Promise<any>;
}
export async function GET(req:Request){
 const params=new URL(req.url).searchParams;
 const username=(params.get('username')||'').trim().toLowerCase();
 const month=params.get('month');const offset=Number(params.get('offset')||0);
 if(!/^[a-z0-9_-]{2,50}$/.test(username))return json({error:'Enter a valid Chess.com username.'},400);
 if(month&&!/^\d{4}-(0[1-9]|1[0-2])$/.test(month))return json({error:'Invalid archive month.'},400);
 if(!Number.isSafeInteger(offset)||offset<0||offset>100000)return json({error:'Invalid page.'},400);
 try{
  const base=`https://api.chess.com/pub/player/${encodeURIComponent(username)}/games`;
  const archives=await get(base+'/archives');
  const months:string[]=[...new Set<string>((archives.archives||[]).filter((a:unknown)=>typeof a==='string'&&a.startsWith(base+'/')&&/^\d{4}\/(0[1-9]|1[0-2])$/.test(a.slice(base.length+1))).map((a:string)=>a.slice(base.length+1).replace('/','-')))].sort().reverse();
  if(!months.length)return json({games:[],next:null});
  const selected=month||months[0];const monthIndex=months.indexOf(selected);
  if(monthIndex<0)return json({error:'Archive month not found. Refresh the game list.'},400);
  const data=await get(`${base}/${selected.replace('-','/')}`);
  const games=(data.games||[]).filter((g:any)=>g.rules==='chess'&&typeof g.pgn==='string'&&g.end_time&&g.white?.result&&g.black?.result&&g.white.result!=='unfinished'&&g.black.result!=='unfinished').sort((a:any,b:any)=>b.end_time-a.end_time||String(a.url).localeCompare(String(b.url)));
  const next=offset+40<games.length?{month:selected,offset:offset+40}:months[monthIndex+1]?{month:months[monthIndex+1],offset:0}:null;
  return json({games:games.slice(offset,offset+40).map((g:any)=>({id:g.url,pgn:g.pgn,white:g.white.username,black:g.black.username,whiteResult:g.white.result,blackResult:g.black.result,time:g.time_class,date:g.end_time})),next,month:selected});
 }catch(error){return json({error:error instanceof Error?error.message:'Unable to load games. Try again.'},502);}
}
