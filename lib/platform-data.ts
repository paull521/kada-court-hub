import "server-only";
import {createClient} from "@/lib/supabase/server";

export type PlatformDashboard={authorized:boolean;adminName:string;conferenceCount:number;ownerCount:number;activeDivisions:number;activeSubscriptions:number;subscriptionsDue:number;activePlayers:number;platformFeeCents:number;pendingSubscriptionPayments:{id:string;conferenceName:string;ownerName:string;amount:number;method:string;submittedAt:string}[];recentInvitations:{id:string;conferenceName:string;email:string;token:string;createdAt:string;acceptedAt:string|null}[]};

const empty:PlatformDashboard={authorized:false,adminName:"",conferenceCount:0,ownerCount:0,activeDivisions:0,activeSubscriptions:0,subscriptionsDue:0,activePlayers:0,platformFeeCents:0,pendingSubscriptionPayments:[],recentInvitations:[]};

export async function getPlatformDashboard():Promise<PlatformDashboard>{
  const supabase=await createClient();
  const {data,error}=await supabase.rpc("platform_creator_dashboard");
  if(error||!data||typeof data!=="object")return empty;
  const row=data as Record<string,unknown>;
  return {...empty,authorized:row.authorized===true,adminName:typeof row.admin_name==="string"?row.admin_name:"",conferenceCount:Number(row.conference_count??0),ownerCount:Number(row.owner_count??0),activeDivisions:Number(row.active_divisions??0),activeSubscriptions:Number(row.active_subscriptions??0),subscriptionsDue:Number(row.subscriptions_due??0),activePlayers:Number(row.active_players??0),platformFeeCents:Number(row.platform_fee_cents??0),pendingSubscriptionPayments:Array.isArray(row.pending_subscription_payments)?row.pending_subscription_payments as PlatformDashboard["pendingSubscriptionPayments"]:[],recentInvitations:Array.isArray(row.recent_invitations)?row.recent_invitations as PlatformDashboard["recentInvitations"]:[]};
}

export type PlatformOperations={authorized:boolean;owners:Array<{id:string;conferenceId:string|null;conferenceName:string|null;name:string;email:string;phone:string;status:string;subscriptionStartsOn:string|null;subscriptionEndsOn:string|null}>;candidates:Array<{id:string;name:string;email:string;phone:string;contractSignedAt:string}>;directory:Array<{conference:string;activeDivisions:number;inactiveDivisions:number;activePlayers:number;inactivePlayers:number}>;support:Array<{id:string;conferenceName:string;ownerName:string;subject:string;message:string;status:string;createdAt:string}>};
const emptyOperations:PlatformOperations={authorized:false,owners:[],candidates:[],directory:[],support:[]};
export async function getPlatformOperations():Promise<PlatformOperations>{const supabase=await createClient();const{data,error}=await supabase.rpc("platform_owner_operations");if(error||!data||typeof data!=="object")return emptyOperations;const row=data as Record<string,unknown>;return{authorized:row.authorized===true,owners:Array.isArray(row.owners)?row.owners as PlatformOperations["owners"]:[],candidates:Array.isArray(row.candidates)?row.candidates as PlatformOperations["candidates"]:[],directory:Array.isArray(row.directory)?row.directory as PlatformOperations["directory"]:[],support:Array.isArray(row.support)?row.support as PlatformOperations["support"]:[]}}

export type PlatformSupportSnapshot={authorized:boolean;conferenceName:string;timezone:string;owners:{name:string;email:string;phone:string;status:string}[];seasons:{name:string;startsOn:string;endsOn:string;divisions:number;teams:number;players:number}[];players:{name:string;publicPlayerId:string;status:string;divisions:number}[]};
const emptySupportSnapshot:PlatformSupportSnapshot={authorized:false,conferenceName:"",timezone:"",owners:[],seasons:[],players:[]};
export async function getPlatformSupportSnapshot(conferenceId:string):Promise<PlatformSupportSnapshot>{const supabase=await createClient();const{data,error}=await supabase.rpc("platform_support_conference_snapshot",{p_conference_id:conferenceId});if(error||!data||typeof data!=="object")return emptySupportSnapshot;const row=data as Record<string,unknown>;return{authorized:true,conferenceName:String(row.conferenceName??"Conference"),timezone:String(row.timezone??""),owners:Array.isArray(row.owners)?row.owners as PlatformSupportSnapshot["owners"]:[],seasons:Array.isArray(row.seasons)?row.seasons as PlatformSupportSnapshot["seasons"]:[],players:Array.isArray(row.players)?row.players as PlatformSupportSnapshot["players"]:[]}}
