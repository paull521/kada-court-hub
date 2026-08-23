export type UserRole = "player" | "team_staff" | "owner" | "admin";

export type Player = { id:string; number:number; name:string; position:string; role:"Captain"|"Co-captain"|"Player" };
export type Game = { id:string; day:string; month:string; date:string; dateLabel:string; time:string; opponent:string; venue:string; court:string; side:"Home"|"Away"; uniform:"White"|"Dark" };
export type GameResult = Game & {teamScore:number;opponentScore:number;outcome:"W"|"L"|"T"};
export type Fee = {id:string;label:string;amount:number;icon:string};
export type PlayerView = {id:string;name:string;initials:string;status:string;mobile:string;email:string;birthdate:string;birthdateValue:string;location:string;jerseyNumber:number;position:string;uniformSize:string;role:"Player"|"Captain"|"Co-captain"};

export const currentContext = {conference:"Seattle Filipino Basketball League",season:"Summer 2026",division:"Division A",team:"Team Kada"};

export const roster: Player[] = [
 {id:"p-007",number:7,name:"Winston Keys",position:"Guard",role:"Captain"},
 {id:"p-011",number:11,name:"Fritz Rigor",position:"Guard",role:"Co-captain"},
 {id:"p-009",number:9,name:"Lennon del Rosario",position:"Forward",role:"Player"},
 {id:"p-010",number:10,name:"Tony Davis",position:"Guard",role:"Player"},
 {id:"p-027",number:27,name:"Alvin Sabas",position:"Forward",role:"Player"},
 {id:"p-028",number:28,name:"Paul Lazarte",position:"Forward",role:"Player"},
 {id:"p-045",number:45,name:"Bong Mendoza",position:"Center",role:"Player"},
 {id:"p-046",number:46,name:"Red San Buenaventura",position:"Forward",role:"Player"},
 {id:"p-060",number:60,name:"Neph Appostol",position:"Center",role:"Player"},
];

export const games: Game[] = [
 {id:"g-0822",day:"SAT",month:"AUG",date:"22",dateLabel:"Saturday, Aug 22",time:"6:30 PM",opponent:"Seattle Ballers",venue:"Kada Court Center",court:"Court 2",side:"Home",uniform:"White"},
 {id:"g-0829",day:"SAT",month:"AUG",date:"29",dateLabel:"Saturday, Aug 29",time:"4:00 PM",opponent:"Manila City",venue:"Kada Court Center",court:"Court 1",side:"Home",uniform:"White"},
 {id:"g-0906",day:"SUN",month:"SEP",date:"06",dateLabel:"Sunday, Sep 06",time:"5:00 PM",opponent:"Manila Kings",venue:"Kada Court Center",court:"Court 3",side:"Home",uniform:"Dark"},
 {id:"g-0913",day:"SAT",month:"SEP",date:"13",dateLabel:"Saturday, Sep 13",time:"7:00 PM",opponent:"Bellevue Elite",venue:"Kada Court Center",court:"Court 2",side:"Home",uniform:"White"},
 {id:"g-0920",day:"SAT",month:"SEP",date:"20",dateLabel:"Saturday, Sep 20",time:"6:00 PM",opponent:"Rain City Hoops",venue:"Kada Court Center",court:"Court 1",side:"Home",uniform:"Dark"},
 {id:"g-0927",day:"SUN",month:"SEP",date:"27",dateLabel:"Sunday, Sep 27",time:"3:00 PM",opponent:"Ballers United",venue:"Kada Court Center",court:"Court 3",side:"Home",uniform:"White"},
];

export const currentPlayer: PlayerView = {id:"KCH-028",name:"Paul Lazarte",initials:"PL",status:"Active Player",mobile:"(425) 555-0128",email:"paul.lazarte@example.com",birthdate:"May 12, 1975",birthdateValue:"1975-05-12",location:"North Bend, WA",jerseyNumber:28,position:"Forward",uniformSize:"XL",role:"Player"};
export const fees: Fee[] = [{id:"league",label:"League Fee",amount:110,icon:"◉"},{id:"uniform",label:"Uniform Fee",amount:60,icon:"♕"},{id:"platform",label:"Platform Fee",amount:1,icon:"▣"}];
