import "server-only";
import {connection} from "next/server";
import {cookies} from "next/headers";
import {createClient} from "@/lib/supabase/server";

export type CaptainRequest={id:string;type:string;details:string;status:string;createdAt:string};
export type CaptainDraftCandidate={invitationId:string;registrationId:string;publicPlayerId:string;name:string;selectionStatus:string;preferredPosition:string};
export type CaptainRosterPlayer={registrationId:string;name:string;publicPlayerId:string;jerseyNumber:number|null;position:string;jerseyName:string;role:string;uniformSize:string};
export type CaptainContextOption={registrationId:string;teamId:string;teamName:string;divisionName:string;seasonName:string;role:string};
export type CaptainGame={id:string;dateKey:string;dateLabel:string;time:string;opponent:string;homeTeam:string;awayTeam:string;venue:string;court:string;uniform:string;finalized:boolean};
export type CaptainAvailabilityPlayer={registrationId:string;name:string;jerseyNumber:number|null;position:string;role:string;available:boolean;responded:boolean};
export type CaptainPaymentBalance={registrationId:string;playerName:string;leagueFee:number;uniformFee:number;platformFee:number;totalCharges:number;paid:number;waived:number;pending:number;balance:number;status:string};
export type CaptainPortalData={authorized:boolean;activeRegistrationId:string;contexts:CaptainContextOption[];teamId:string;teamName:string;divisionName:string;seasonName:string;role:string;rosterLimit:number|null;divisionTeams:{id:string;name:string}[];draftPublished:boolean;finalPublished:boolean;draftStatus:"editing"|"submitted"|"approved"|"changes_requested";ownerNote:string;candidates:CaptainDraftCandidate[];roster:CaptainRosterPlayer[];requests:CaptainRequest[];games:CaptainGame[];divisionGames:CaptainGame[];availability:CaptainAvailabilityPlayer[];payments:CaptainPaymentBalance[];hasUnavailable:boolean};

const empty:CaptainPortalData={authorized:false,activeRegistrationId:"",contexts:[],teamId:"",teamName:"",divisionName:"",seasonName:"",role:"",rosterLimit:null,divisionTeams:[],draftPublished:false,finalPublished:false,draftStatus:"editing",ownerNote:"",candidates:[],roster:[],requests:[],games:[],divisionGames:[],availability:[],payments:[],hasUnavailable:false};

export async function getCaptainPortalData():Promise<CaptainPortalData>{
  await connection();
  const supabase=await createClient();
  const{data:claims}=await supabase.auth.getClaims();
  const userId=claims?.claims?.sub;
  if(!userId)return empty;
  const{data:player}=await supabase.from("player_profiles").select("id").eq("profile_id",userId).maybeSingle();
  if(!player)return empty;
  const{data:leaderRows}=await supabase.from("registrations").select("id,team_id,season_id,role_label,created_at").eq("player_id",player.id).in("role_label",["Captain","Co-captain"]).not("team_id","is",null).in("status",["active","pending"]).order("created_at",{ascending:false});
  if(!leaderRows?.length)return empty;
  const teamIds=[...new Set(leaderRows.map(row=>row.team_id!))];
  const{data:teamRows}=await supabase.from("teams").select("id,name,division_id").in("id",teamIds);
  const divisionIds=[...new Set((teamRows??[]).map(row=>row.division_id))];
  const{data:divisionRows}=divisionIds.length?await supabase.from("divisions").select("id,name,season_id").in("id",divisionIds):{data:[]};
  const seasonIds=[...new Set((divisionRows??[]).map(row=>row.season_id))];
  const{data:seasonRows}=seasonIds.length?await supabase.from("seasons").select("id,name,players_per_team").in("id",seasonIds):{data:[]};
  const teamMap=new Map((teamRows??[]).map(row=>[row.id,row])),divisionMap=new Map((divisionRows??[]).map(row=>[row.id,row])),seasonMap=new Map((seasonRows??[]).map(row=>[row.id,row]));
  const contexts:CaptainContextOption[]=leaderRows.flatMap(row=>{const team=row.team_id?teamMap.get(row.team_id):undefined,division=team?divisionMap.get(team.division_id):undefined,season=division?seasonMap.get(division.season_id):undefined;return team&&division&&season?[{registrationId:row.id,teamId:team.id,teamName:team.name,divisionName:division.name,seasonName:season.name,role:row.role_label}]:[]});
  const requested=(await cookies()).get("kch_captain_registration")?.value;
  const context=contexts.find(item=>item.registrationId===requested)??contexts[0];
  if(!context)return empty;
  const leader=leaderRows.find(row=>row.id===context.registrationId)!;
  const team=teamMap.get(context.teamId)!,division=divisionMap.get(team.division_id)!,season=seasonMap.get(division.season_id)!;
  const[{data:requestRows},{data:candidateRows},{data:draft},{data:rosterRows},{data:broadcastRows},{data:workflow},{data:uniform},{data:divisionTeams},{data:paymentRows}]=await Promise.all([
    supabase.from("roster_change_requests").select("id,request_type,details,status,created_at").eq("team_id",team.id).order("created_at",{ascending:false}),
    supabase.rpc("captain_draft_candidates",{p_team_id:team.id}),
    supabase.from("team_roster_drafts").select("status,owner_note").eq("team_id",team.id).maybeSingle(),
    supabase.rpc("captain_team_draft_roster",{p_team_id:team.id}),
    supabase.from("season_broadcasts").select("broadcast_type").eq("division_id",division.id).in("broadcast_type",["roster_draft","roster_final"]),
    supabase.from("division_schedule_workflows").select("status").eq("division_id",division.id).maybeSingle(),
    supabase.from("division_uniform_settings").select("dark_uniform,light_uniform").eq("division_id",division.id).maybeSingle(),
    supabase.from("teams").select("id,name").eq("division_id",division.id).eq("active",true),
    supabase.rpc("captain_team_payment_balances",{p_team_id:team.id}),
  ]);
  const divisionTeamIds=(divisionTeams??[]).map(row=>row.id),teamNames=new Map((divisionTeams??[]).map(row=>[row.id,row.name]));
  const{data:gameRows}=workflow?.status==="final"&&divisionTeamIds.length?await supabase.from("games").select("id,home_team_id,away_team_id,starts_at,venue,court,home_uniform,away_uniform,home_score,away_score,finalized_at,status").eq("season_id",season.id).in("home_team_id",divisionTeamIds).order("starts_at"):{data:[]};
  const timezone="America/Los_Angeles",now=Date.now();
  type GameRow={id:string;home_team_id:string;away_team_id:string;starts_at:string;venue:string;court:string|null;home_uniform:string|null;away_uniform:string|null;finalized_at:string|null;status:string};
  const mapGame=(row:GameRow):CaptainGame=>{const date=new Date(row.starts_at),home=row.home_team_id===team.id,parts=new Intl.DateTimeFormat("en-US",{timeZone:timezone,year:"numeric",month:"2-digit",day:"2-digit"}).formatToParts(date),part=(type:Intl.DateTimeFormatPartTypes)=>parts.find(item=>item.type===type)?.value??"";return{id:row.id,dateKey:`${part("year")}-${part("month")}-${part("day")}`,dateLabel:new Intl.DateTimeFormat("en-US",{timeZone:timezone,weekday:"long",month:"short",day:"numeric"}).format(date),time:new Intl.DateTimeFormat("en-US",{timeZone:timezone,hour:"numeric",minute:"2-digit"}).format(date),opponent:teamNames.get(home?row.away_team_id:row.home_team_id)??"Opponent",homeTeam:teamNames.get(row.home_team_id)??"Home Team",awayTeam:teamNames.get(row.away_team_id)??"Away Team",venue:row.venue,court:row.court??"",uniform:(home?row.home_uniform:row.away_uniform)??(home?uniform?.light_uniform:uniform?.dark_uniform)??(home?"White":"Dark"),finalized:Boolean(row.finalized_at)}};
  const divisionGames:CaptainGame[]=((gameRows??[]) as GameRow[]).filter(row=>row.status==="scheduled"&&new Date(row.starts_at).getTime()>=now).map(mapGame);
  const games=divisionGames.filter(row=>row.homeTeam===team.name||row.awayTeam===team.name);
  const nextGame=games[0];
  const{data:availabilityRows}=nextGame?await supabase.rpc("get_team_game_availability",{p_game_id:nextGame.id}):{data:[]};
  type CandidateRow={invitation_id:string;registration_id:string;public_player_id:string;display_name:string;selection_status:string;preferred_position:string|null};
  type RosterRow={registration_id:string;public_player_id:string;display_name:string;jersey_number:number|null;player_position:string|null;jersey_name:string|null;role_label:string;uniform_size:string|null};
  type AvailabilityRow={registration_id:string;player_name:string;jersey_number:number|null;player_position:string;role_label:string;available:boolean;responded:boolean};
  type PaymentRow={registration_id:string;player_name:string;league_fee_cents:number;uniform_fee_cents:number;platform_fee_cents:number;total_charges_cents:number;paid_cents:number;waived_cents:number;pending_cents:number;balance_cents:number;payment_status:string};
  const availability=((availabilityRows??[]) as AvailabilityRow[]).map(row=>({registrationId:row.registration_id,name:row.player_name,jerseyNumber:row.jersey_number,position:row.player_position,role:row.role_label,available:row.available,responded:row.responded}));
  const roster=((rosterRows??[]) as RosterRow[]).map(row=>({registrationId:row.registration_id,name:row.display_name,publicPlayerId:row.public_player_id,jerseyNumber:row.jersey_number,position:row.player_position??"",jerseyName:row.jersey_name??"",role:row.role_label,uniformSize:row.uniform_size??""})).sort((left,right)=>{const rank=(role:string)=>role==="Captain"?0:role==="Co-captain"?1:2;return rank(left.role)-rank(right.role)||(left.jerseyNumber??Number.MAX_SAFE_INTEGER)-(right.jerseyNumber??Number.MAX_SAFE_INTEGER)||left.name.localeCompare(right.name)});
  return{authorized:true,activeRegistrationId:leader.id,contexts,teamId:team.id,teamName:team.name,divisionName:division.name,seasonName:season.name,role:leader.role_label,rosterLimit:season.players_per_team??null,divisionTeams:(divisionTeams??[]).map(row=>({id:row.id,name:row.name})),draftPublished:(broadcastRows??[]).some(row=>row.broadcast_type==="roster_draft"),finalPublished:(broadcastRows??[]).some(row=>row.broadcast_type==="roster_final"),draftStatus:draft?.status==="submitted"?"submitted":draft?.status==="approved"?"approved":draft?.status==="changes_requested"?"changes_requested":"editing",ownerNote:draft?.owner_note??"",candidates:((candidateRows??[]) as CandidateRow[]).map(row=>({invitationId:row.invitation_id,registrationId:row.registration_id,publicPlayerId:row.public_player_id,name:row.display_name,selectionStatus:row.selection_status,preferredPosition:row.preferred_position??""})),roster,requests:(requestRows??[]).map(row=>({id:row.id,type:row.request_type,details:row.details,status:row.status,createdAt:row.created_at})),games,divisionGames,availability,payments:((paymentRows??[]) as PaymentRow[]).map(row=>({registrationId:row.registration_id,playerName:row.player_name,leagueFee:row.league_fee_cents/100,uniformFee:row.uniform_fee_cents/100,platformFee:row.platform_fee_cents/100,totalCharges:row.total_charges_cents/100,paid:row.paid_cents/100,waived:row.waived_cents/100,pending:row.pending_cents/100,balance:row.balance_cents/100,status:row.payment_status})),hasUnavailable:availability.some(player=>!player.available)};
}

export async function hasCaptainAccess():Promise<boolean>{return(await getCaptainPortalData()).authorized;}
