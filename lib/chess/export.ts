import {classify,gameSummary,notation,parseGame,type Evaluation} from './core';
export type ExportGame={id:string;pgn:string;white:string;black:string;whiteResult:string;blackResult:string;time:string;date:number};
export type Filters={time:string;color:string;result:string;opponent:string;from:string;to:string};
export function matches(g:ExportGame,user:string,f:Filters){
 const white=g.white.toLowerCase()===user.toLowerCase();
 const result=(white?g.whiteResult:g.blackResult)==='win'?'win':(white?g.blackResult:g.whiteResult)==='win'?'loss':'draw';
 return (!f.time||g.time===f.time)&&(!f.color||f.color===(white?'w':'b'))&&(!f.result||f.result===result)&&(!f.opponent||(white?g.black:g.white).toLowerCase().includes(f.opponent.toLowerCase()))&&(!f.from||g.date*1000>=new Date(f.from+'T00:00:00').getTime())&&(!f.to||g.date*1000<new Date(new Date(f.to+'T00:00:00').setDate(new Date(f.to+'T00:00:00').getDate()+1)).getTime());
}
export function analysedGame(g:ExportGame,user:string,e:Record<number,Evaluation>){
 const game=parseGame(g.pgn);const color=game.headers.White?.toLowerCase()===user.toLowerCase()?'w':game.headers.Black?.toLowerCase()===user.toLowerCase()?'b':null;
 if(!color)throw Error('Player not found in PGN: '+g.id);
 if(game.fens.some((_,i)=>!e[i]?.lines.length))throw Error('Incomplete analysis.');
 return {url:g.id,date:new Date(g.date*1000).toISOString(),playerColor:color,headers:game.headers,pgn:g.pgn,summary:gameSummary(game,e).find(s=>s.color===color),moves:game.moves.map((m,i)=>({ply:i+1,moveNumber:Math.ceil((i+1)/2),color:m.color,played:m.san,...classify(e[i],e[i+1],m),fenBefore:m.before,fenAfter:m.after,before:e[i].lines[0],after:e[i+1].lines[0],bestMove:e[i].best,bestContinuation:notation(m.before,e[i].lines[0].pv,10)}))};
}
