import { Chess } from 'chess.js';
import type { Evaluation, Line } from './core';
export class Engine {
  worker: Worker; ready:Promise<void>; private active:((line:string)=>void)|null=null; private reject:((reason:Error)=>void)|null=null; private timer:ReturnType<typeof setTimeout>|undefined; private dead=false;
  constructor(){
    this.worker=new Worker('/engine/stockfish.js');
    this.ready=new Promise((resolve,reject)=>{
      this.reject=reject;
      this.timer=setTimeout(()=>this.fail(new Error('Stockfish took too long to start. Reload to try again.')),25000);
      this.active=(line)=>{if(line==='uciok'){this.worker.postMessage('setoption name Hash value 32');this.worker.postMessage('isready');}if(line==='readyok'){clearTimeout(this.timer);this.active=null;this.reject=null;resolve();}};
    });
    this.worker.onmessage=(event)=>String(event.data).split('\n').forEach(line=>this.active?.(line.trim()));
    this.worker.onerror=()=>this.fail(new Error('Stockfish could not load. Reload the page and try again.'));
    this.worker.postMessage('uci');
  }
  private fail(error:Error){clearTimeout(this.timer);this.reject?.(error);this.reject=null;this.active=null;this.dead=true;this.worker.terminate();}
  async evaluate(fen:string, milliseconds=800, multi=3):Promise<Evaluation>{
    await this.ready;if(this.dead)throw new Error('Engine stopped.');
    const chess=new Chess(fen);
    if(chess.isCheckmate()||chess.isDraw())return {best:'',depth:0,lines:[{rank:1,depth:0,pv:[],score:chess.isCheckmate()?(chess.turn()==='w'?-100000:100000):0,...(chess.isCheckmate()?{mate:0}:{})}]};
    if(this.active)throw new Error('Engine is busy.');
    return new Promise((resolve,reject)=>{
      const lines=new Map<number,Line>();const sign=chess.turn()==='w'?1:-1;
      this.reject=reject;
      this.timer=setTimeout(()=>this.fail(new Error('Analysis timed out. Reload to restart the engine.')),milliseconds+20000);
      this.active=(text)=>{
        if(text.startsWith('info ')&&text.includes(' pv ')&&!text.includes('bound')) {
          const depth=Number(text.match(/\bdepth (\d+)/)?.[1]||0),rank=Number(text.match(/\bmultipv (\d+)/)?.[1]||1);
          const match=text.match(/\bscore (cp|mate) (-?\d+)/);
          if(match){const raw=Number(match[2]);const mate=match[1]==='mate'?raw*sign:undefined;const score=mate===undefined?raw*sign:Math.sign(mate)*(100000-Math.abs(mate)*100);lines.set(rank,{rank,depth,score,mate,pv:text.split(' pv ')[1].trim().split(/\s+/)});}
        }
        if(text.startsWith('bestmove ')){clearTimeout(this.timer);this.active=null;this.reject=null;const ordered=[...lines.values()].sort((a,b)=>a.rank-b.rank); if(!ordered.length){reject(new Error('The engine returned no evaluation.'));return;}resolve({lines:ordered,best:text.split(' ')[1],depth:ordered[0]?.depth||0});}
      };
      this.worker.postMessage(`setoption name MultiPV value ${multi}`);this.worker.postMessage(`position fen ${fen}`);this.worker.postMessage(`go movetime ${milliseconds}`);
    });
  }
  destroy(){this.fail(new Error('Analysis cancelled.'));}
}
