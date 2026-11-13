import {strict as assert} from 'node:assert';
import {GET} from '../app/api/games/route';
const original=globalThis.fetch;
const base='https://api.chess.com/pub/player/manuel/games';
let calls:string[]=[];
const record=(i:number)=>({url:`https://www.chess.com/game/live/${i}`,pgn:'1. e4 e5 *',rules:'chess',end_time:i,white:{username:'manuel',result:'win'},black:{username:'opponent',result:'resigned'},time_class:'rapid'});
async function run(){
 globalThis.fetch=async(input)=>{const url=String(input);calls.push(url);if(url.endsWith('/archives'))return Response.json({archives:[base+'/2026/10',base+'/2026/11','https://untrusted.invalid/2026/12']});return Response.json({games:[...Array.from({length:45},(_,i)=>record(i+1)),{...record(99),rules:'chess960'},{...record(100),end_time:null}]});};
 const fetchPage=(query:string)=>GET(new Request('https://example.com/api/games?'+query));
 const read=async(response:Response):Promise<any>=>response.json();
 assert.equal((await fetchPage('username=../evil')).status,400);assert.equal(calls.length,0);
 assert.equal((await fetchPage('username=manuel&month=2026-13')).status,400);
 assert.equal((await fetchPage('username=manuel&offset=-1')).status,400);
 const first=await read(await fetchPage('username=Manuel'));assert.equal(first.games.length,40);assert.equal(first.games[0].date,45);assert.deepEqual(first.next,{month:'2026-11',offset:40});assert.deepEqual(calls,[base+'/archives',base+'/2026/11']);
 const next=await read(await fetchPage('username=manuel&month=2026-11&offset=40'));assert.equal(next.games.length,5);assert.deepEqual(next.next,{month:'2026-10',offset:0});
 const last=await read(await fetchPage('username=manuel&month=2026-10&offset=40'));assert.equal(last.next,null);
 assert.equal((await fetchPage('username=manuel&month=2020-01')).status,400);
 globalThis.fetch=async()=>Response.json({archives:[]});assert.deepEqual(await read(await fetchPage('username=manuel')),{games:[],next:null});
 globalThis.fetch=async()=>new Response('',{status:429});assert.match((await read(await fetchPage('username=manuel'))).error,/minute/);
 globalThis.fetch=async()=>new Response('',{status:404});assert.match((await read(await fetchPage('username=manuel'))).error,/username/);
 console.log('PASS: username validation, standard finished games only, newest-first pagination, older archives, empty account, rate limits and missing accounts.');
}
run().finally(()=>{globalThis.fetch=original;});
