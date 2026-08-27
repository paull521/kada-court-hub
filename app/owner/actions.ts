"use server";

import {revalidatePath} from "next/cache";
import {cookies} from "next/headers";
import {redirect} from "next/navigation";
import {createClient} from "@/lib/supabase/server";

export type OwnerActionState={error?:string;message?:string};
const uuidPattern=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const value=(formData:FormData,key:string)=>String(formData.get(key)??"").trim();
const validName=(name:string)=>name.length>0&&name.length<=80;
const jerseyValue=(raw:string):number|null=>raw===""?null:Number(raw);
const validJersey=(jersey:number|null)=>jersey===null||(Number.isInteger(jersey)&&jersey>=0&&jersey<=99);
const validLocalDateTime=(dateTime:string)=>/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(dateTime);
const optionalScore=(raw:string):number|null=>raw===""?null:Number(raw);

async function ownerRpc(name:string,args:Record<string,unknown>,success:string):Promise<OwnerActionState>{
  const supabase=await createClient();
  const {data:claims}=await supabase.auth.getClaims();
  if(!claims?.claims?.sub)return{error:"Your session expired. Log in again."};
  const {error}=await supabase.rpc(name,args);
  if(error){
    if(error.code==="23505")return{error:"That name is already in use in this season or division."};
    return{error:error.message.includes("function")?"Install the latest owner-management SQL migration, then try again.":error.message};
  }
  revalidatePath("/owner");
  revalidatePath("/owner/setup");
  revalidatePath("/owner/schedule");
  revalidatePath("/owner/scores");
  revalidatePath("/owner/uniforms");
  revalidatePath("/owner/payments");
  revalidatePath("/owner/roster");
  revalidatePath("/owner/financials");
  revalidatePath("/owner/more");
  revalidatePath("/home");
  revalidatePath("/my-team");
  revalidatePath("/schedule");
  revalidatePath("/payments");
  revalidatePath("/results");
  return{message:success};
}

const ownerConferenceCookie={httpOnly:true,sameSite:"lax" as const,path:"/",maxAge:60*60*24*365,secure:process.env.NODE_ENV==="production"};

export async function createTestConferenceAction(_:OwnerActionState,formData:FormData):Promise<OwnerActionState>{
  const name=value(formData,"name"),timezone=value(formData,"timezone");
  if(!validName(name))return{error:"Enter a conference name of up to 80 characters."};
  if(!["America/Los_Angeles","America/Denver","America/Chicago","America/New_York"].includes(timezone))return{error:"Choose a valid timezone."};
  const supabase=await createClient();
  const {data:claims}=await supabase.auth.getClaims();
  if(!claims?.claims?.sub)return{error:"Your session expired. Log in again."};
  const {data,error}=await supabase.rpc("owner_create_test_conference",{p_name:name,p_timezone:timezone});
  if(error)return{error:error.message.includes("function")?"Install migration 0021, then try again.":error.message};
  if(typeof data!=="string"||!uuidPattern.test(data))return{error:"The test conference could not be selected."};
  (await cookies()).set("kch_owner_conference",data,ownerConferenceCookie);
  revalidatePath("/owner","layout");
  redirect("/owner/setup");
}

export async function selectOwnerConferenceAction(formData:FormData):Promise<void>{
  const conferenceId=value(formData,"conferenceId");
  const requestedPath=value(formData,"returnPath");
  const returnPath=requestedPath.startsWith("/owner")&&!requestedPath.startsWith("//")?requestedPath:"/owner";
  if(!uuidPattern.test(conferenceId))redirect("/owner/conferences");
  const supabase=await createClient();
  const {data:claims}=await supabase.auth.getClaims();
  if(!claims?.claims?.sub)redirect("/login");
  const {data}=await supabase.from("conference_memberships").select("id").eq("conference_id",conferenceId).eq("profile_id",claims.claims.sub).eq("role","owner").maybeSingle();
  if(data)(await cookies()).set("kch_owner_conference",conferenceId,ownerConferenceCookie);
  revalidatePath("/owner","layout");
  redirect(returnPath);
}

export async function createSeasonAction(_:OwnerActionState,formData:FormData):Promise<OwnerActionState>{
  const conferenceId=value(formData,"conferenceId"),name=value(formData,"name"),startsOn=value(formData,"startsOn"),endsOn=value(formData,"endsOn"),divisionName=value(formData,"divisionName");
  if(!uuidPattern.test(conferenceId)||!validName(name)||!/^\d{4}-\d{2}-\d{2}$/.test(startsOn)||!/^\d{4}-\d{2}-\d{2}$/.test(endsOn))return{error:"Complete the season name and dates."};
  if(endsOn<startsOn)return{error:"The end date must be after the start date."};
  if(divisionName&&!validName(divisionName))return{error:"Enter a shorter division name."};
  return ownerRpc("owner_create_season",{p_conference_id:conferenceId,p_name:name,p_starts_on:startsOn,p_ends_on:endsOn,p_registration_open:formData.get("registrationOpen")==="on",p_initial_division_name:divisionName||null},`${name} was created.`);
}

export async function createDivisionAction(_:OwnerActionState,formData:FormData):Promise<OwnerActionState>{
  const seasonId=value(formData,"seasonId"),name=value(formData,"name");
  if(!uuidPattern.test(seasonId)||!validName(name))return{error:"Choose a season and enter a division name."};
  return ownerRpc("owner_create_division",{p_season_id:seasonId,p_name:name},`${name} was added.`);
}

export async function createDivisionsAction(_:OwnerActionState,formData:FormData):Promise<OwnerActionState>{
  const seasonId=value(formData,"seasonId");
  const names=formData.getAll("divisionName").map(item=>String(item).trim()).filter(Boolean);
  if(!uuidPattern.test(seasonId)||names.length<1||names.length>10||names.some(name=>!validName(name)))return{error:"Enter from 1 to 10 division names."};
  if(new Set(names.map(name=>name.toLowerCase())).size!==names.length)return{error:"Each division needs a different name."};
  return ownerRpc("owner_create_divisions",{p_season_id:seasonId,p_names:names},`${names.length} division${names.length===1?"":"s"} saved.`);
}

export async function createTeamAction(_:OwnerActionState,formData:FormData):Promise<OwnerActionState>{
  const divisionId=value(formData,"divisionId"),name=value(formData,"name");
  if(!uuidPattern.test(divisionId)||!validName(name))return{error:"Choose a division and enter a team name."};
  return ownerRpc("owner_create_team",{p_division_id:divisionId,p_name:name},`${name} was added.`);
}

export async function createTeamsAction(_:OwnerActionState,formData:FormData):Promise<OwnerActionState>{
  const divisionId=value(formData,"divisionId");
  const names=formData.getAll("teamName").map(item=>String(item).trim()).filter(Boolean);
  if(!uuidPattern.test(divisionId)||names.length<1||names.length>30||names.some(name=>!validName(name)))return{error:"Enter from 1 to 30 team names for this division."};
  if(new Set(names.map(name=>name.toLowerCase())).size!==names.length)return{error:"Each team in the division needs a different name."};
  return ownerRpc("owner_create_teams",{p_division_id:divisionId,p_names:names},`${names.length} team${names.length===1?"":"s"} saved.`);
}

export async function addConferencePlayerAction(_:OwnerActionState,formData:FormData):Promise<OwnerActionState>{
  const conferenceId=value(formData,"conferenceId"),publicPlayerId=value(formData,"publicPlayerId").toUpperCase();
  if(!uuidPattern.test(conferenceId)||!/^KCH-[A-Z0-9-]{4,40}$/.test(publicPlayerId))return{error:"Enter the exact KCH Player ID from the player's Profile page."};
  return ownerRpc("owner_add_conference_player",{p_conference_id:conferenceId,p_public_player_id:publicPlayerId},"Player added to this conference directory.");
}

export async function assignDirectoryLeaderAction(_:OwnerActionState,formData:FormData):Promise<OwnerActionState>{
  const teamId=value(formData,"teamId"),playerId=value(formData,"playerId"),role=value(formData,"role");
  if(!uuidPattern.test(teamId)||!uuidPattern.test(playerId)||!['Captain','Co-captain'].includes(role))return{error:"Search for and select a player first."};
  return ownerRpc("owner_assign_directory_leader",{p_team_id:teamId,p_player_id:playerId,p_role:role},`${role} assigned.`);
}

export async function updateTeamAction(_:OwnerActionState,formData:FormData):Promise<OwnerActionState>{
  const teamId=value(formData,"teamId"),name=value(formData,"name");
  if(!uuidPattern.test(teamId)||!validName(name))return{error:"Enter a valid team name."};
  return ownerRpc("owner_update_team",{p_team_id:teamId,p_name:name,p_active:formData.get("active")==="on"},`${name} was updated.`);
}

export async function updateLeadershipAction(_:OwnerActionState,formData:FormData):Promise<OwnerActionState>{
  const teamId=value(formData,"teamId"),captainId=value(formData,"captainId"),coCaptainId=value(formData,"coCaptainId");
  if(!uuidPattern.test(teamId))return{error:"Invalid team."};
  if(captainId&&!uuidPattern.test(captainId)||coCaptainId&&!uuidPattern.test(coCaptainId))return{error:"Choose players from this team."};
  if(captainId&&captainId===coCaptainId)return{error:"Captain and co-captain must be different players."};
  return ownerRpc("owner_set_team_leadership",{p_team_id:teamId,p_captain_registration_id:captainId||null,p_co_captain_registration_id:coCaptainId||null},"Team leadership was updated.");
}

export async function addRosterPlayerAction(_:OwnerActionState,formData:FormData):Promise<OwnerActionState>{
  const teamId=value(formData,"teamId"),displayName=value(formData,"displayName"),email=value(formData,"email"),mobile=value(formData,"mobile"),position=value(formData,"position"),jersey=jerseyValue(value(formData,"jerseyNumber"));
  if(!uuidPattern.test(teamId)||!validName(displayName))return{error:"Choose a team and enter the player's name."};
  if(email&&(email.length>254||!email.includes("@")))return{error:"Enter a valid email address."};
  if(mobile.length>40||position.length>40||!validJersey(jersey))return{error:"Check the mobile number, position, and jersey number."};
  return ownerRpc("owner_add_roster_player",{p_team_id:teamId,p_display_name:displayName,p_email:email||null,p_mobile:mobile||null,p_jersey_number:jersey,p_position:position||null},`${displayName} was added to the roster.`);
}

export async function addExistingPlayerAction(_:OwnerActionState,formData:FormData):Promise<OwnerActionState>{
  const teamId=value(formData,"teamId"),publicPlayerId=value(formData,"publicPlayerId").toUpperCase(),position=value(formData,"position"),jersey=jerseyValue(value(formData,"jerseyNumber"));
  if(!uuidPattern.test(teamId)||!/^KCH-[A-Z0-9-]{4,40}$/.test(publicPlayerId))return{error:"Choose a team and enter a valid KCH Player ID."};
  if(position.length>40||!validJersey(jersey))return{error:"Check the position and jersey number."};
  return ownerRpc("owner_add_existing_player",{p_team_id:teamId,p_public_player_id:publicPlayerId,p_jersey_number:jersey,p_position:position||null},`${publicPlayerId} was added to the roster.`);
}

export async function updateRosterPlayerAction(_:OwnerActionState,formData:FormData):Promise<OwnerActionState>{
  const registrationId=value(formData,"registrationId"),position=value(formData,"position"),status=value(formData,"status"),jersey=jerseyValue(value(formData,"jerseyNumber"));
  if(!uuidPattern.test(registrationId)||!validJersey(jersey)||position.length>40||!["pending","active","inactive"].includes(status))return{error:"Check the roster details and try again."};
  return ownerRpc("owner_update_roster_registration",{p_registration_id:registrationId,p_jersey_number:jersey,p_position:position||null,p_status:status},"Roster details were updated.");
}

export async function overrideInSeasonRosterAction(_:OwnerActionState,formData:FormData):Promise<OwnerActionState>{
  const registrationId=value(formData,"registrationId"),teamId=value(formData,"teamId"),status=value(formData,"status"),position=value(formData,"position"),reason=value(formData,"reason"),jersey=jerseyValue(value(formData,"jerseyNumber"));
  if(!uuidPattern.test(registrationId)||!uuidPattern.test(teamId)||!["active","inactive"].includes(status)||!validJersey(jersey)||position.length>40||reason.length<3||reason.length>500)return{error:"Choose a team, status, and a short reason for this override."};
  return ownerRpc("owner_override_inseason_registration",{p_registration_id:registrationId,p_team_id:teamId,p_status:status,p_jersey_number:jersey,p_position:position||null,p_reason:reason},"In-season roster override saved.");
}

export async function addInSeasonPlayerAction(_:OwnerActionState,formData:FormData):Promise<OwnerActionState>{
  const teamId=value(formData,"teamId"),publicPlayerId=value(formData,"publicPlayerId").toUpperCase(),position=value(formData,"position"),reason=value(formData,"reason"),jersey=jerseyValue(value(formData,"jerseyNumber"));
  if(!uuidPattern.test(teamId)||!/^KCH-[A-Z0-9-]{4,40}$/.test(publicPlayerId)||!validJersey(jersey)||position.length>40||reason.length<3||reason.length>500)return{error:"Choose a team, KCH Player ID, and a short reason."};
  return ownerRpc("owner_add_inseason_player",{p_team_id:teamId,p_public_player_id:publicPlayerId,p_jersey_number:jersey,p_position:position||null,p_reason:reason},"Player added through the in-season override.");
}

export async function copyPreviousUniformsAction(_:OwnerActionState,formData:FormData):Promise<OwnerActionState>{
  const divisionId=value(formData,"divisionId"),sourceDivisionId=value(formData,"sourceDivisionId");
  if(!uuidPattern.test(divisionId)||!uuidPattern.test(sourceDivisionId))return{error:"Choose a prior division to reuse its uniforms."};
  return ownerRpc("owner_copy_division_uniforms",{p_target_division_id:divisionId,p_source_division_id:sourceDivisionId},"Previous season uniforms copied. Fees remain specific to this season.");
}

export async function advanceSeasonSetupAction(_:OwnerActionState,formData:FormData):Promise<OwnerActionState>{
  const seasonId=value(formData,"seasonId"),stage=Number(value(formData,"stage"));
  if(!uuidPattern.test(seasonId)||!Number.isInteger(stage)||stage<1||stage>4)return{error:"This setup step is not valid. Refresh and try again."};
  return ownerRpc("owner_advance_season_setup",{p_season_id:seasonId,p_expected_stage:stage},"Step completed. Your next setup step is ready.");
}

export async function addTeamLeaderAction(_:OwnerActionState,formData:FormData):Promise<OwnerActionState>{
  const teamId=value(formData,"teamId"),role=value(formData,"role"),publicPlayerId=value(formData,"publicPlayerId").toUpperCase(),displayName=value(formData,"displayName"),email=value(formData,"email"),mobile=value(formData,"mobile"),position=value(formData,"position"),jersey=jerseyValue(value(formData,"jerseyNumber"));
  if(!uuidPattern.test(teamId)||!["Captain","Co-captain"].includes(role))return{error:"This leadership assignment is not valid."};
  if(!publicPlayerId&&!validName(displayName))return{error:"Enter an existing KCH Player ID or a player name."};
  if(publicPlayerId&&!/^KCH-[A-Z0-9-]{4,40}$/.test(publicPlayerId))return{error:"Enter a valid KCH Player ID."};
  if(email&&(email.length>254||!email.includes("@"))||mobile.length>40||position.length>40||!validJersey(jersey))return{error:"Check the leader's contact and roster details."};
  return ownerRpc("owner_add_team_leader",{p_team_id:teamId,p_role:role,p_public_player_id:publicPlayerId||null,p_display_name:displayName||null,p_email:email||null,p_mobile:mobile||null,p_jersey_number:jersey,p_position:position||null},`${role} was assigned.`);
}

export async function broadcastSeasonAction(_:OwnerActionState,formData:FormData):Promise<OwnerActionState>{
  const seasonId=value(formData,"seasonId"),message=value(formData,"message");
  if(!uuidPattern.test(seasonId)||message.length<1||message.length>1000)return{error:"Enter a broadcast message of up to 1,000 characters."};
  return ownerRpc("owner_broadcast_season",{p_season_id:seasonId,p_message:message},"Season published. Players can now respond Joining or Not Joining.");
}

export async function cancelSeasonAction(_:OwnerActionState,formData:FormData):Promise<OwnerActionState>{
  const seasonId=value(formData,"seasonId"),reason=value(formData,"reason");
  if(!uuidPattern.test(seasonId)||reason.length<1||reason.length>500)return{error:"Enter a cancellation reason of up to 500 characters."};
  if(formData.get("confirm")!=="on")return{error:"Confirm that you want to cancel this season."};
  return ownerRpc("owner_cancel_season",{p_season_id:seasonId,p_reason:reason},"Season canceled. Its history has been preserved.");
}

export async function inviteConferencePlayersAction(_:OwnerActionState,formData:FormData):Promise<OwnerActionState>{
  const seasonId=value(formData,"seasonId"),message=value(formData,"message"),responseDeadline=value(formData,"responseDeadline"),playersPerTeam=Number(value(formData,"playersPerTeam"));
  if(!uuidPattern.test(seasonId)||message.length<1||message.length>1000)return{error:"Enter an invitation message of up to 1,000 characters."};
  if(!/^\d{4}-\d{2}-\d{2}$/.test(responseDeadline)||responseDeadline<new Date().toISOString().slice(0,10))return{error:"Choose a response deadline that is not in the past."};
  if(!Number.isInteger(playersPerTeam)||playersPerTeam<1||playersPerTeam>30)return{error:"Players per team must be from 1 to 30."};
  return ownerRpc("owner_invite_conference_players",{p_season_id:seasonId,p_message:message,p_response_deadline:responseDeadline,p_players_per_team:playersPerTeam},"Player invitations sent. Joining responses will appear in the Draft step.");
}

export async function inviteDivisionPlayersAction(_:OwnerActionState,formData:FormData):Promise<OwnerActionState>{
  const divisionId=value(formData,"divisionId"),message=value(formData,"message"),responseDeadline=value(formData,"responseDeadline"),playersPerTeam=Number(value(formData,"playersPerTeam"));
  const playerIds=formData.getAll("playerId").map(item=>String(item)).filter(item=>uuidPattern.test(item));
  if(!uuidPattern.test(divisionId)||message.length<1||message.length>1000)return{error:"Enter an invitation message of up to 1,000 characters."};
  if(!/^\d{4}-\d{2}-\d{2}$/.test(responseDeadline)||responseDeadline<new Date().toISOString().slice(0,10))return{error:"Choose the response deadline before sending."};
  if(!Number.isInteger(playersPerTeam)||playersPerTeam<1||playersPerTeam>30)return{error:"Players per team must be from 1 to 30."};
  if(!playerIds.length)return{error:"Check at least one player to invite."};
  const flyer=formData.get("flyer");
  let flyerPath:string|null=null;
  const supabase=await createClient();
  if(flyer instanceof File&&flyer.size>0){
    const allowed=new Map([["image/jpeg","jpg"],["image/png","png"],["image/webp","webp"]]);
    if(!allowed.has(flyer.type)||flyer.size>8*1024*1024)return{error:"Use a JPG, PNG, or WebP flyer no larger than 8 MB."};
    flyerPath=`${divisionId}/flyer-${crypto.randomUUID()}.${allowed.get(flyer.type)}`;
    const {error}=await supabase.storage.from("invitation-flyers").upload(flyerPath,flyer,{contentType:flyer.type,upsert:false});
    if(error)return{error:error.message.includes("Bucket")?"Install migration 0025, then try again.":error.message};
  }
  const {error}=await supabase.rpc("owner_invite_selected_division_players",{p_division_id:divisionId,p_player_ids:playerIds,p_message:message,p_response_deadline:responseDeadline,p_players_per_team:playersPerTeam,p_flyer_path:flyerPath});
  if(error){if(flyerPath)await supabase.storage.from("invitation-flyers").remove([flyerPath]);return{error:error.message.includes("function")?"Install migration 0025, then try again.":error.message};}
  revalidatePath("/owner/setup");revalidatePath("/home");
  return{message:`Invitations were sent to ${playerIds.length} selected player${playerIds.length===1?"":"s"}.`};
}

export async function inviteExistingDivisionPlayerAction(_:OwnerActionState,formData:FormData):Promise<OwnerActionState>{
  const divisionId=value(formData,"divisionId"),publicPlayerId=value(formData,"publicPlayerId").toUpperCase();
  if(!uuidPattern.test(divisionId)||!/^KCH-[A-Z0-9]{8}$/.test(publicPlayerId))return{error:"Enter a valid KCH Player ID."};
  return ownerRpc("owner_invite_existing_division_player",{p_division_id:divisionId,p_public_player_id:publicPlayerId},"Player added to this division's invitation list.");
}

export async function sendLateTeamInvitationAction(_:OwnerActionState,formData:FormData):Promise<OwnerActionState>{
  const teamId=value(formData,"teamId"),playerId=value(formData,"playerId");
  if(!uuidPattern.test(teamId)||!uuidPattern.test(playerId))return{error:"Choose a player and team."};
  return ownerRpc("owner_send_late_team_invitation",{p_team_id:teamId,p_player_id:playerId},"Late invitation sent.");
}

export async function moveExistingDivisionPlayerAction(_:OwnerActionState,formData:FormData):Promise<OwnerActionState>{
  const registrationId=value(formData,"registrationId"),teamId=value(formData,"teamId");
  if(!uuidPattern.test(registrationId)||!uuidPattern.test(teamId))return{error:"Choose a player and their new team."};
  return ownerRpc("owner_move_player_between_teams",{p_registration_id:registrationId,p_target_team_id:teamId},"Player moved to the selected team.");
}

export async function assignDraftPlayerAction(_:OwnerActionState,formData:FormData):Promise<OwnerActionState>{
  const invitationId=value(formData,"invitationId"),teamId=value(formData,"teamId"),position=value(formData,"position"),jersey=jerseyValue(value(formData,"jerseyNumber"));
  if(!uuidPattern.test(invitationId)||!uuidPattern.test(teamId)||!validJersey(jersey)||position.length>40)return{error:"Choose a team and check the roster details."};
  return ownerRpc("owner_assign_draft_player",{p_invitation_id:invitationId,p_team_id:teamId,p_jersey_number:jersey,p_position:position||null},"Draft assignment saved.");
}

export async function returnPlayerToDraftPoolAction(_:OwnerActionState,formData:FormData):Promise<OwnerActionState>{
  const registrationId=value(formData,"registrationId"),reason=value(formData,"reason");
  if(!uuidPattern.test(registrationId)||reason.length<3||reason.length>500)return{error:"Add a short reason before returning this player to the draft pool."};
  return ownerRpc("owner_return_player_to_draft_pool",{p_registration_id:registrationId,p_reason:reason},"Player returned to the division draft pool.");
}

export async function publishRosterDraftAction(_:OwnerActionState,formData:FormData):Promise<OwnerActionState>{
  const seasonId=value(formData,"seasonId"),message=value(formData,"message");
  if(!uuidPattern.test(seasonId)||message.length<1||message.length>1000)return{error:"Enter a roster-draft message of up to 1,000 characters."};
  return ownerRpc("owner_publish_roster_draft",{p_season_id:seasonId,p_message:message},"Roster draft published to players and captains.");
}

export async function publishDivisionRosterAction(_:OwnerActionState,formData:FormData):Promise<OwnerActionState>{
  const divisionId=value(formData,"divisionId"),message=value(formData,"message");
  if(!uuidPattern.test(divisionId)||message.length<1||message.length>1000)return{error:"Enter a division roster message of up to 1,000 characters."};
  return ownerRpc("owner_publish_division_roster",{p_division_id:divisionId,p_message:message},"Approved division rosters shared with the teams.");
}

export async function setDivisionRosterReviewDeadlineAction(_:OwnerActionState,formData:FormData):Promise<OwnerActionState>{
  const divisionId=value(formData,"divisionId"),reviewDeadline=value(formData,"reviewDeadline");
  if(!uuidPattern.test(divisionId)||!/^\d{4}-\d{2}-\d{2}$/.test(reviewDeadline)||reviewDeadline<new Date().toISOString().slice(0,10))return{error:"Choose a review deadline that is not in the past."};
  return ownerRpc("owner_set_division_roster_review_deadline",{p_division_id:divisionId,p_review_deadline:reviewDeadline},"Roster review deadline saved and shared with this division.");
}

export async function publishDivisionFinalRosterAction(_:OwnerActionState,formData:FormData):Promise<OwnerActionState>{
  const divisionId=value(formData,"divisionId"),message=value(formData,"message");
  if(!uuidPattern.test(divisionId)||message.length<1||message.length>1000)return{error:"Enter a final roster message of up to 1,000 characters."};
  return ownerRpc("owner_publish_division_final_roster",{p_division_id:divisionId,p_message:message},"Final roster published to this division.");
}

export async function reviewTeamRosterAction(_:OwnerActionState,formData:FormData):Promise<OwnerActionState>{
  const teamId=value(formData,"teamId"),decision=value(formData,"decision");
  if(!uuidPattern.test(teamId)||!["approved","changes_requested"].includes(decision))return{error:"Choose Approve or Request Changes."};
  return ownerRpc("owner_review_team_roster",{p_team_id:teamId,p_decision:decision,p_owner_note:null},decision==="approved"?"Captain roster approved.":"Roster returned to the captain for changes.");
}

export async function reviewRosterChangeRequestAction(_:OwnerActionState,formData:FormData):Promise<OwnerActionState>{
  const requestId=value(formData,"requestId"),decision=value(formData,"decision"),ownerNote=value(formData,"ownerNote");
  if(!uuidPattern.test(requestId)||!["approved","declined"].includes(decision))return{error:"Choose Approve or Decline."};
  if(decision==="declined"&&!ownerNote)return{error:"Add a note explaining the declined request."};
  if(ownerNote.length>1000)return{error:"Keep the owner note under 1,000 characters."};
  return ownerRpc("owner_review_roster_change_request",{p_request_id:requestId,p_decision:decision,p_owner_note:ownerNote||null},decision==="approved"?"Roster change approved. The captain was notified.":"Roster change declined with your note.");
}

export async function createGameAction(_:OwnerActionState,formData:FormData):Promise<OwnerActionState>{
  const divisionId=value(formData,"divisionId"),homeTeamId=value(formData,"homeTeamId"),awayTeamId=value(formData,"awayTeamId"),startsAt=value(formData,"startsAt"),venue=value(formData,"venue"),court=value(formData,"court"),phase=value(formData,"phase");
  if(!uuidPattern.test(divisionId)||!uuidPattern.test(homeTeamId)||!uuidPattern.test(awayTeamId)||homeTeamId===awayTeamId)return{error:"Choose two different teams from this division."};
  if(!["regular","playoff"].includes(phase))return{error:"Choose a valid game type."};
  if(!validLocalDateTime(startsAt)||!venue||venue.length>120||court.length>60)return{error:"Check the game date, venue, and court."};
  return ownerRpc("owner_create_division_game",{p_division_id:divisionId,p_home_team_id:homeTeamId,p_away_team_id:awayTeamId,p_starts_at:startsAt,p_venue:venue,p_court:court||null,p_phase:phase},phase==="playoff"?"Playoff game added to the schedule.":"Regular-season game added to the schedule.");
}

export async function updateGameAction(_:OwnerActionState,formData:FormData):Promise<OwnerActionState>{
  const gameId=value(formData,"gameId"),startsAt=value(formData,"startsAt"),venue=value(formData,"venue"),court=value(formData,"court"),homeUniform=value(formData,"homeUniform"),awayUniform=value(formData,"awayUniform"),homeScore=optionalScore(value(formData,"homeScore")),awayScore=optionalScore(value(formData,"awayScore"));
  if(!uuidPattern.test(gameId)||!validLocalDateTime(startsAt)||!venue||venue.length>120||court.length>60)return{error:"Check the game date, venue, and court."};
  if(!["","White","Dark"].includes(homeUniform)||!["","White","Dark"].includes(awayUniform))return{error:"Choose White or Dark uniforms."};
  if((homeScore===null)!==(awayScore===null)||homeScore!==null&&(!Number.isInteger(homeScore)||homeScore<0)||awayScore!==null&&(!Number.isInteger(awayScore)||awayScore<0))return{error:"Enter both final scores as whole numbers, or leave both blank."};
  return ownerRpc("owner_update_game",{p_game_id:gameId,p_starts_at:startsAt,p_venue:venue,p_court:court||null,p_home_uniform:homeUniform||null,p_away_uniform:awayUniform||null,p_home_score:homeScore,p_away_score:awayScore},homeScore===null?"Game details updated.":"Final score posted.");
}

export async function finalizeGameScoreAction(_:OwnerActionState,formData:FormData):Promise<OwnerActionState>{
  const gameId=value(formData,"gameId"),homeScore=optionalScore(value(formData,"homeScore")),awayScore=optionalScore(value(formData,"awayScore"));
  if(!uuidPattern.test(gameId)||homeScore===null||awayScore===null||!Number.isInteger(homeScore)||!Number.isInteger(awayScore)||homeScore<0||awayScore<0)return{error:"Enter both final scores as whole numbers."};
  return ownerRpc("owner_finalize_game_score",{p_game_id:gameId,p_home_score:homeScore,p_away_score:awayScore},"Final score saved. This game is now locked.");
}

export async function saveGameScoreDraftAction(_:OwnerActionState,formData:FormData):Promise<OwnerActionState>{
  const gameId=value(formData,"gameId"),homeScore=optionalScore(value(formData,"homeScore")),awayScore=optionalScore(value(formData,"awayScore"));
  if(!uuidPattern.test(gameId)||homeScore===null||awayScore===null||!Number.isInteger(homeScore)||!Number.isInteger(awayScore)||homeScore<0||awayScore<0)return{error:"Enter both draft scores as whole numbers."};
  return ownerRpc("owner_save_game_score_draft",{p_game_id:gameId,p_home_score:homeScore,p_away_score:awayScore},"Draft scores saved. Finalize when you are ready.");
}

export async function reviewPaymentNoticeAction(_:OwnerActionState,formData:FormData):Promise<OwnerActionState>{
  const submissionId=value(formData,"submissionId"),decision=value(formData,"decision"),reviewNote=value(formData,"reviewNote");
  if(!uuidPattern.test(submissionId)||!["confirmed","declined"].includes(decision))return{error:"Choose Confirm or Decline."};
  if(reviewNote.length>500)return{error:"Keep the review note under 500 characters."};
  return ownerRpc("owner_review_payment_notice",{p_submission_id:submissionId,p_decision:decision,p_review_note:reviewNote||null},decision==="confirmed"?"Request approved and balance updated.":"Request declined. The player was notified.");
}

export async function updateDivisionUniformsAction(_:OwnerActionState,formData:FormData):Promise<OwnerActionState>{
  const divisionId=value(formData,"divisionId"),darkUniform=value(formData,"darkUniform"),lightUniform=value(formData,"lightUniform");
  if(!uuidPattern.test(divisionId)||!darkUniform||!lightUniform||darkUniform.length>40||lightUniform.length>40)return{error:"Enter dark and light uniform labels of up to 40 characters."};
  return ownerRpc("owner_update_division_uniforms",{p_division_id:divisionId,p_dark_uniform:darkUniform,p_light_uniform:lightUniform},"Division uniforms updated for every team.");
}

export async function updateDivisionUniformImagesAction(_:OwnerActionState,formData:FormData):Promise<OwnerActionState>{
  const divisionId=value(formData,"divisionId");
  if(!uuidPattern.test(divisionId))return{error:"Invalid division."};
  const darkFile=formData.get("darkImage"),lightFile=formData.get("lightImage");
  const files:[["dark"|"light",FormDataEntryValue|null],["dark"|"light",FormDataEntryValue|null]]=[["dark",darkFile],["light",lightFile]];
  const supplied=files.filter(([,file])=>file instanceof File&&file.size>0) as Array<["dark"|"light",File]>;
  if(!supplied.length)return{error:"Choose a dark or light uniform photo."};
  const allowed=new Map([["image/jpeg","jpg"],["image/png","png"],["image/webp","webp"]]);
  for(const[,file]of supplied)if(!allowed.has(file.type)||file.size>8*1024*1024)return{error:"Use a JPG, PNG, or WebP photo no larger than 8 MB."};
  const supabase=await createClient();
  const {data:claims}=await supabase.auth.getClaims();
  if(!claims?.claims?.sub)return{error:"Your session expired. Log in again."};
  const uploaded:string[]=[];const paths:{dark?:string;light?:string}={};
  for(const[variant,file]of supplied){
    const path=`${divisionId}/${variant}-${crypto.randomUUID()}.${allowed.get(file.type)}`;
    const {error}=await supabase.storage.from("uniform-photos").upload(path,file,{contentType:file.type,upsert:false});
    if(error){if(uploaded.length)await supabase.storage.from("uniform-photos").remove(uploaded);return{error:error.message.includes("Bucket")?"Install the latest uniform-photo SQL, then try again.":error.message};}
    uploaded.push(path);paths[variant]=path;
  }
  const {error}=await supabase.rpc("owner_update_division_uniform_images",{p_division_id:divisionId,p_dark_image_path:paths.dark??null,p_light_image_path:paths.light??null});
  if(error){await supabase.storage.from("uniform-photos").remove(uploaded);return{error:error.message.includes("function")?"Install the latest uniform-photo SQL, then try again.":error.message};}
  revalidatePath("/owner");revalidatePath("/my-team");
  return{message:"Uniform photos saved for every team in this division."};
}

const feeCents=(raw:string):number|null=>{
  if(raw==="")return null;
  const amount=Number(raw);
  return Number.isFinite(amount)&&amount>=0&&amount<=100000?Math.round(amount*100):null;
};

export async function saveSeasonFinancialSummaryAction(_:OwnerActionState,formData:FormData):Promise<OwnerActionState>{
  const seasonId=value(formData,"seasonId"),notes=value(formData,"notes");
  const courtCost=feeCents(value(formData,"courtCost")),refereeCost=feeCents(value(formData,"refereeCost")),uniformCost=feeCents(value(formData,"uniformCost")),leagueCost=feeCents(value(formData,"leagueCost"));
  if(!uuidPattern.test(seasonId)||courtCost===null||refereeCost===null||uniformCost===null||leagueCost===null)return{error:"Enter valid expense amounts for this season."};
  if(notes.length>1000)return{error:"Keep financial notes under 1,000 characters."};
  return ownerRpc("owner_update_season_financial_summary",{p_season_id:seasonId,p_court_cost_cents:courtCost,p_referee_cost_cents:refereeCost,p_uniform_cost_cents:uniformCost,p_league_cost_cents:leagueCost,p_notes:notes||null},"Season expenses and financial summary updated.");
}

export async function saveDivisionPreseasonAction(_:OwnerActionState,formData:FormData):Promise<OwnerActionState>{
  const divisionId=value(formData,"divisionId");
  const leagueEnabled=formData.get("leagueFeeEnabled")==="on",uniformEnabled=formData.get("uniformFeeEnabled")==="on";
  const leagueFee=feeCents(value(formData,"leagueFee")),uniformFee=feeCents(value(formData,"uniformFee"));
  if(!uuidPattern.test(divisionId))return{error:"Invalid division."};
  if(leagueEnabled&&leagueFee===null)return{error:"Enter a valid league fee, or turn it off."};
  if(uniformEnabled&&uniformFee===null)return{error:"Enter a valid uniform fee, or turn it off."};
  const darkFile=formData.get("darkImage"),lightFile=formData.get("lightImage");
  const files:[string,FormDataEntryValue|null][]=[["dark",darkFile],["light",lightFile]];
  const supplied=files.filter(([,file])=>file instanceof File&&file.size>0) as Array<[string,File]>;
  const allowed=new Map([["image/jpeg","jpg"],["image/png","png"],["image/webp","webp"]]);
  for(const[,file]of supplied)if(!allowed.has(file.type)||file.size>8*1024*1024)return{error:"Use JPG, PNG, or WebP photos no larger than 8 MB."};
  const supabase=await createClient();
  const {data:claims}=await supabase.auth.getClaims();
  if(!claims?.claims?.sub)return{error:"Your session expired. Log in again."};
  const uploaded:string[]=[];const paths:{dark?:string;light?:string}={};
  for(const[variant,file]of supplied){
    const path=`${divisionId}/${variant}-${crypto.randomUUID()}.${allowed.get(file.type)}`;
    const {error}=await supabase.storage.from("uniform-photos").upload(path,file,{contentType:file.type,upsert:false});
    if(error){if(uploaded.length)await supabase.storage.from("uniform-photos").remove(uploaded);return{error:error.message};}
    uploaded.push(path);paths[variant as "dark"|"light"]=path;
  }
  const {error}=await supabase.rpc("owner_update_division_preseason_details",{p_division_id:divisionId,p_league_fee_enabled:leagueEnabled,p_league_fee_cents:leagueEnabled?leagueFee:null,p_uniform_fee_enabled:uniformEnabled,p_uniform_fee_cents:uniformEnabled?uniformFee:null,p_dark_image_path:paths.dark??null,p_light_image_path:paths.light??null});
  if(error){if(uploaded.length)await supabase.storage.from("uniform-photos").remove(uploaded);return{error:error.message.includes("function")?"Install migration 0016, then try again.":error.message};}
  revalidatePath("/owner");revalidatePath("/owner/setup");revalidatePath("/owner/uniforms");revalidatePath("/my-team");
  return{message:"Division fees and uniform photos saved."};
}

export async function completePreseasonDetailsAction(_:OwnerActionState,formData:FormData):Promise<OwnerActionState>{
  const seasonId=value(formData,"seasonId");
  if(!uuidPattern.test(seasonId))return{error:"Invalid season."};
  return ownerRpc("owner_complete_preseason_details",{p_season_id:seasonId},"Fees saved. Player invitations are ready; uniform photos can be added later.");
}

export async function generateSeasonScheduleAction(_:OwnerActionState,formData:FormData):Promise<OwnerActionState>{
  const seasonId=value(formData,"seasonId"),firstDate=value(formData,"firstGameDate"),firstTime=value(formData,"firstGameTime"),venue=value(formData,"venue");
  const gameMinutes=Number(value(formData,"gameMinutes")),gamesPerCourt=Number(value(formData,"gamesPerCourt"));
  const courts=value(formData,"courts").split(/[\n,]+/).map(item=>item.trim()).filter(Boolean);
  if(!uuidPattern.test(seasonId)||!/^\d{4}-\d{2}-\d{2}$/.test(firstDate)||!/^\d{2}:\d{2}$/.test(firstTime))return{error:"Choose the first game date and time."};
  if(!venue||venue.length>120||!courts.length||courts.some(court=>court.length>60))return{error:"Enter the venue and at least one court."};
  if(!Number.isInteger(gameMinutes)||gameMinutes<30||gameMinutes>180||!Number.isInteger(gamesPerCourt)||gamesPerCourt<1||gamesPerCourt>12)return{error:"Check the game length and games per court."};
  return ownerRpc("owner_generate_season_schedule",{p_season_id:seasonId,p_first_game_date:firstDate,p_first_game_time:firstTime,p_game_minutes:gameMinutes,p_games_per_court:gamesPerCourt,p_venue:venue,p_courts:courts,p_double_round_robin:formData.get("doubleRoundRobin")==="on"},"Draft schedule generated. Review and finalize it on the Schedule page.");
}

export async function saveDivisionGameDayAction(_:OwnerActionState,formData:FormData):Promise<OwnerActionState>{
  const divisionId=value(formData,"divisionId"),gameDate=value(formData,"gameDate"),venue=value(formData,"venue"),gameMinutes=Number(value(formData,"gameMinutes"));
  let games:unknown;
  try{games=JSON.parse(value(formData,"gamesJson"))}catch{return{error:"Check the games entered for this day."}}
  if(!uuidPattern.test(divisionId)||!/^\d{4}-\d{2}-\d{2}$/.test(gameDate))return{error:"Choose the division and game date."};
  if(!venue||venue.length>120||!Number.isInteger(gameMinutes)||gameMinutes<30||gameMinutes>180)return{error:"Check the venue and game duration."};
  if(!Array.isArray(games)||games.length<1||games.length>20)return{error:"Add from 1 to 20 games for this day."};
  for(const game of games){if(!game||typeof game!=="object")return{error:"Check every game row."};const row=game as Record<string,unknown>;if(!uuidPattern.test(String(row.homeTeamId??""))||!uuidPattern.test(String(row.awayTeamId??""))||row.homeTeamId===row.awayTeamId||!/^\d{2}:\d{2}$/.test(String(row.time??""))||!String(row.court??"").trim()||String(row.court).length>60)return{error:"Complete every matchup, time, and court."}}
  return ownerRpc("owner_save_division_game_day",{p_division_id:divisionId,p_game_date:gameDate,p_venue:venue,p_game_minutes:gameMinutes,p_games:games},`${games.length} game${games.length===1?"":"s"} saved for this day.`);
}

export async function generateDivisionScheduleAction(_:OwnerActionState,formData:FormData):Promise<OwnerActionState>{
  const divisionId=value(formData,"divisionId"),firstDate=value(formData,"firstGameDate"),firstTime=value(formData,"firstGameTime"),venue=value(formData,"venue");
  const courtCount=Number(value(formData,"courtCount")),gameMinutes=Number(value(formData,"gameMinutes")),gamesPerDay=Number(value(formData,"gamesPerDay"));
  const playingDays=formData.getAll("playingDay").map(item=>Number(String(item))).filter(day=>Number.isInteger(day)&&day>=0&&day<=6);
  if(!uuidPattern.test(divisionId)||!/^\d{4}-\d{2}-\d{2}$/.test(firstDate)||!/^\d{2}:\d{2}$/.test(firstTime))return{error:"Choose the first game date and time."};
  if(!venue||venue.length>120||!playingDays.length)return{error:"Enter the venue and choose at least one playing day."};
  if(!Number.isInteger(courtCount)||courtCount<1||courtCount>10||!Number.isInteger(gameMinutes)||gameMinutes<30||gameMinutes>180||!Number.isInteger(gamesPerDay)||gamesPerDay<1||gamesPerDay>30)return{error:"Check courts, game minutes, and games per day."};
  return ownerRpc("owner_generate_division_schedule",{p_division_id:divisionId,p_first_game_date:firstDate,p_first_game_time:firstTime,p_playing_days:playingDays,p_court_count:courtCount,p_game_minutes:gameMinutes,p_games_per_day:gamesPerDay,p_venue:venue,p_double_round_robin:formData.get("doubleRoundRobin")==="on"},"KCH created this division's draft schedule.");
}

export async function finalizeDivisionScheduleAction(_:OwnerActionState,formData:FormData):Promise<OwnerActionState>{
  const divisionId=value(formData,"divisionId");
  if(!uuidPattern.test(divisionId))return{error:"Invalid division."};
  return ownerRpc("owner_finalize_division_schedule",{p_division_id:divisionId},"This division schedule is final and players were notified.");
}

export async function completeExistingScheduleAction(_:OwnerActionState,formData:FormData):Promise<OwnerActionState>{
  const seasonId=value(formData,"seasonId");
  if(!uuidPattern.test(seasonId))return{error:"Invalid season."};
  return ownerRpc("owner_complete_existing_schedule",{p_season_id:seasonId},"Schedule finalized and published to players.");
}

export async function changeGameStatusAction(_:OwnerActionState,formData:FormData):Promise<OwnerActionState>{
  const gameId=value(formData,"gameId"),status=value(formData,"status"),reason=value(formData,"reason");
  if(!uuidPattern.test(gameId)||!["scheduled","postponed","canceled"].includes(status))return{error:"Choose a valid game status."};
  if(status!=="scheduled"&&(!reason||reason.length>500))return{error:"Enter a reason of up to 500 characters."};
  return ownerRpc("owner_change_game_status",{p_game_id:gameId,p_status:status,p_reason:reason||null},status==="scheduled"?"Game restored to the schedule.":status==="postponed"?"Game postponed and players notified.":"Game canceled and players notified.");
}

export async function rescheduleGameAction(_:OwnerActionState,formData:FormData):Promise<OwnerActionState>{
  const gameId=value(formData,"gameId"),startsAt=value(formData,"startsAt"),venue=value(formData,"venue"),court=value(formData,"court"),reason=value(formData,"reason");
  if(!uuidPattern.test(gameId)||!validLocalDateTime(startsAt)||!venue||venue.length>120||court.length>60||reason.length>500)return{error:"Check the new date, venue, court, and message."};
  return ownerRpc("owner_reschedule_game",{p_game_id:gameId,p_starts_at:startsAt,p_venue:venue,p_court:court||null,p_reason:reason||null},"Game rescheduled and players notified.");
}
