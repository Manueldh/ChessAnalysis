import { Chess, type Move } from 'chess.js';
export const DEMO = `[Event "A lesson in king safety"]
[White "You"]
[Black "Practice opponent"]
[WhiteElo "400"]
[BlackElo "420"]
[Result "0-1"]

1. e4 e5 2. Nf3 Nc6 3. Bc4 Nd4 4. Nxe5 Qg5 5. Nxf7 Qxg2 6. Rf1 Qxe4+ 7. Be2 Nf3# 0-1`;
export type Line = { score: number; mate?: number; pv: string[]; depth: number; rank: number };
export type Evaluation = { lines: Line[]; best: string; depth: number };
export type Game = { pgn: string; headers: Record<string,string>; moves: Move[]; fens: string[] };
export function parseGame(pgn: string): Game {
  if (pgn.length > 200000) throw new Error('This PGN is too large. Import one game at a time.');
  const c = new Chess(); c.loadPgn(pgn);
  const moves = c.history({ verbose: true });
  if (!moves.length) throw new Error('No moves found. Paste the complete PGN of a finished game.');
  return {pgn, headers:c.getHeaders(), moves, fens:[moves[0].before,...moves.map(m=>m.after)]};
}
export function uci(move: Move) {return move.from+move.to+(move.promotion||'');}
export function playUci(c: Chess, move: string) {return c.move({from:move.slice(0,2),to:move.slice(2,4),promotion:move[4]});}
export function notation(fen: string, pv: string[], max=8) {
  const c=new Chess(fen); const result:string[]=[];
  for(const s of pv.slice(0,max)) {try {const turn=c.turn(); const num=c.moveNumber(); const m=playUci(c,s);result.push(`${turn==='w'?num+'.':result.length===0?num+'…':''}${m.san}`);} catch {break;}}
  return result.join(' ');
}
export function scoreText(line?:Line) { if(!line)return '—'; if(line.mate!==undefined)return `${line.mate<0?'-':''}M${Math.abs(line.mate)}`; return `${line.score>0?'+':''}${(line.score/100).toFixed(2)}`; }
export function classify(before:Evaluation|undefined, after:Evaluation|undefined, move:Move) {
  if(!before?.lines.length||!after?.lines.length)return {label:'Pending',loss:0};
  const sign=move.color==='w'?1:-1;
  const loss=Math.max(0,(before.lines[0].score-after.lines[0].score)*sign);
  return {label:before.best===uci(move)?'Best':loss<25?'Excellent':loss<70?'Good':loss<150?'Inaccuracy':loss<300?'Mistake':'Blunder',loss};
}
const names:Record<string,string>={p:'pawn',n:'knight',b:'bishop',r:'rook',q:'queen',k:'king'};
export function explain(fen:string, best:string, line?:Line) {
  const c=new Chess(fen); let m:Move; try{m=playUci(c,best);}catch{return 'Look at checks, captures, and threats before deciding on your next move.';}
  const parts:string[]=[];
  if(m.san.endsWith('#')) parts.push(`${m.san} is checkmate: the king has no legal escape.`);
  else if(line?.mate!==undefined && line.mate*(new Chess(fen).turn()==='w'?1:-1)>0)parts.push(`Stockfish finds a forced mate starting with ${m.san}. Follow the continuation to see the defence.`);
  else if(m.captured) parts.push(`${m.san} captures a ${names[m.captured]}. Check the continuation before assuming the material is free.`);
  else if(m.flags.includes('k')||m.flags.includes('q'))parts.push(`${m.san} castles, moving your king away from the centre and bringing a rook into play.`);
  else if(m.san.includes('+'))parts.push(`${m.san} gives check, so your opponent must deal with the threat to their king.`);
  else if(['n','b'].includes(m.piece)&&['1','8'].includes(m.from[1]))parts.push(`${m.san} develops your ${names[m.piece]} and brings another piece into the game.`);
  else parts.push(`${m.san} is the engine’s preferred ${names[m.piece]} move in this position. Use the continuation to see the concrete idea.`);
  if(!m.san.endsWith('#'))parts.push('Before you play it, ask: what can my opponent check, capture, or threaten?');
  return parts.join(' ');
}
export function hanging(fen:string) {
  const c=new Chess(fen), me=c.turn(), enemy=me==='w'?'b':'w';
  return c.board().flat().filter(p=>p && p.color===me && p.type!=='k' && c.isAttacked(p.square,enemy) && !c.isAttacked(p.square,me)).map(p=>`${names[p!.type]} on ${p!.square}`);
}

/** App-specific accuracy: mean exp(-loss/100), where loss is centipawns.
 * Best moves receive 100 to avoid penalising independent search noise.
 * Incomplete sides have no final accuracy; counts include assessed moves only.
 */
export const reviewCategories = ['Best','Excellent','Good','Inaccuracy','Mistake','Blunder'] as const;
export function gameSummary(game:Game, evaluations:Record<number,Evaluation>) {
  return (['w','b'] as const).map(color=>{
    const moves=game.moves.map((move,i)=>({move,index:i+1,...classify(evaluations[i],evaluations[i+1],move)})).filter(m=>m.move.color===color);
    const assessed=moves.filter(m=>m.label!=='Pending');
    const accuracy=assessed.length===moves.length&&moves.length>0
      ? assessed.reduce((sum,m)=>sum+(m.label==='Best'?100:100*Math.exp(-m.loss/100)),0)/moves.length : null;
    return {color,accuracy,assessed:assessed.length,total:moves.length,categories:reviewCategories.map(label=>({label,indices:assessed.filter(m=>m.label===label).map(m=>m.index)}))};
  });
}
