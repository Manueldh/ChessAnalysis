import {Chess} from 'chess.js';
import {parseGame,playUci,type Game} from './core';
export type LinkState={section:'analysis'|'library'|'practice';game:Game;index:number;branch:string[];flip:boolean};
export function encodeLink(s:LinkState){
 const q=new URLSearchParams({pgn:s.game.pgn,move:String(s.index)});
 if(s.branch.length)q.set('line',s.branch.join(','));if(s.flip)q.set('flip','1');
 return '#/'+(s.section==='library'?'games':s.section==='practice'?'practice':'review')+'?'+q;
}
export function decodeLink(hash:string):LinkState{
 if(hash.length>650000)throw Error('This game link is too large. Import its PGN instead.');
 const [path,query]=hash.slice(1).split('?');
 if(!['/games','/practice','/review'].includes(path))throw Error('Unknown page link.');
 const q=new URLSearchParams(query);const game=parseGame(q.get('pgn')||'');
 const index=Number(q.get('move')||0);if(!Number.isInteger(index)||index<0||index>game.moves.length)throw Error('Invalid move in game link.');
 const branch=q.get('line')?.split(',')||[];if(branch.length>1000)throw Error('Variation is too long.');
 const c=new Chess(game.fens[index]);for(const m of branch){if(!/^[a-h][1-8][a-h][1-8][qrbn]?$/.test(m))throw Error('Invalid variation.');playUci(c,m);}
 return {game,index,branch,flip:q.get('flip')==='1',section:path==='/games'?'library':path==='/practice'?'practice':'analysis'};
}
