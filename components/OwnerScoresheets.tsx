"use client";

import {useActionState,useEffect,useState} from "react";
import {finalizeGameScoreAction,type OwnerActionState} from "@/app/owner/actions";
import type {OwnerSeason} from "@/lib/owner-data";

const initialState:OwnerActionState={};

function localDate(value:string){
  const[year,month,day]=value.slice(0,10).split("-").map(Number);
  return new Intl.DateTimeFormat("en-US",{weekday:"short",month:"short",day:"numeric"}).format(new Date(Date.UTC(year,month-1,day,12)));
}

function localTime(value:string){
  const[hour,minute]=value.slice(11,16).split(":").map(Number);
  return new Intl.DateTimeFormat("en-US",{hour:"numeric",minute:"2-digit",timeZone:"UTC"}).format(new Date(Date.UTC(2000,0,1,hour,minute)));
}

function weekStart(value:string){
  const[year,month,day]=value.slice(0,10).split("-").map(Number);
  const date=new Date(Date.UTC(year,month-1,day));
  date.setUTCDate(date.getUTCDate()-date.getUTCDay());
  return date.toISOString().slice(0,10);
}

function ScoreGame({game}:{game:OwnerSeason["games"][number]}){
  const[state,action,pending]=useActionState(finalizeGameScoreAction,initialState);
  const[reviewing,setReviewing]=useState(false);
  const played=game.finalized;
  const unavailable=game.status!=="scheduled";
  const scoreNeeded=!played&&!unavailable&&new Date(game.startsAt).getTime()<=Date.now();
  return <article id={`score-${game.id}`} className={`score-sheet-card ${unavailable?`game-${game.status}`:""} ${played?"final-locked":""}`}><header><div><b>{game.homeTeam}</b><span>vs {game.awayTeam}</span></div><div className="score-game-meta">{scoreNeeded&&<em className="score-needed">Score needed</em>}<small>{localDate(game.localStartsAt)} · {localTime(game.localStartsAt)}<br/>{game.court||game.venue}</small></div></header>{played?<section className="final-score-lock"><strong>{game.homeScore} – {game.awayScore}</strong></section>:unavailable?<p className="score-unavailable">{game.status.toUpperCase()}{game.statusReason?` — ${game.statusReason}`:""}. Restore this game from Schedules before posting a result.</p>:!scoreNeeded?<p className="score-unavailable">Score entry is available after scheduled tip-off.</p>:<form action={action} className="owner-form score-entry-form"><input type="hidden" name="gameId" value={game.id}/><div className="score-entry-fields"><label><span>{game.homeTeam}</span><input name="homeScore" type="number" min="0" inputMode="numeric" placeholder="0" required readOnly={reviewing}/></label><strong>–</strong><label><span>{game.awayTeam}</span><input name="awayScore" type="number" min="0" inputMode="numeric" placeholder="0" required readOnly={reviewing}/></label></div>{state.error&&<p className="form-error" role="alert">{state.error}</p>}{state.message&&<p className="form-success" role="status">{state.message}</p>}{reviewing?<div className="draft-review-actions"><button type="button" className="btn secondary" onClick={()=>setReviewing(false)}>Go Back</button><button className="btn primary" disabled={pending}>{pending?"Finalizing…":"Final Score"}</button></div>:<button type="button" className="btn primary" onClick={()=>setReviewing(true)}>Review Final Score</button>}</form>}</article>;
}

export default function OwnerScoresheets({seasons}:{seasons:OwnerSeason[]}){
  const available=seasons.filter(season=>!season.canceledAt&&season.setupStage>=7&&season.games.length);
  useEffect(()=>{
    const id=decodeURIComponent(window.location.hash.slice(1));
    if(!id)return;
    const target=document.getElementById(id);
    if(!target)return;
    let parent=target.parentElement;
    while(parent){if(parent instanceof HTMLDetailsElement)parent.open=true;parent=parent.parentElement;}
    window.setTimeout(()=>target.scrollIntoView({behavior:"smooth",block:"center"}),50);
  },[]);
  if(!available.length)return <section className="card owner-empty-operation"><span>▦</span><div><h3>No scoresheets yet</h3><p>Create and publish a season schedule first.</p></div></section>;
  return <div className="scoresheet-season-list">{available.map((season,seasonIndex)=>{const sorted=[...season.games].sort((a,b)=>a.localStartsAt.localeCompare(b.localStartsAt));const weeks=[...new Map(sorted.map(game=>[weekStart(game.localStartsAt),[] as typeof sorted])).entries()];for(const game of sorted)weeks.find(([key])=>key===weekStart(game.localStartsAt))?.[1].push(game);return <details className="scoresheet-season card" key={season.id} open={seasonIndex===0}><summary><span><b>{season.name}</b><small>{sorted.filter(game=>game.homeScore!==null&&game.awayScore!==null).length} of {sorted.length} results posted</small></span><strong>›</strong></summary><div>{weeks.map(([key,games],weekIndex)=><details className="scoresheet-week" key={key} open={weekIndex===0}><summary><span><b>Week {weekIndex+1}</b><small>Week of {localDate(key)}</small></span><strong>›</strong></summary><div>{games.map(game=><ScoreGame game={game} key={game.id}/>)}</div></details>)}</div></details>})}</div>;
}
