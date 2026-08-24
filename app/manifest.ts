import type {MetadataRoute} from "next";

export default function manifest():MetadataRoute.Manifest{
  return {
    name:"KadaCourtHub",
    short_name:"KCH BBALL",
    description:"Your team, schedule, payments, and profile in one place.",
    start_url:"/home",
    display:"standalone",
    background_color:"#fffaf5",
    theme_color:"#071f3d",
    icons:[{src:"/icon",sizes:"512x512",type:"image/png"},{src:"/apple-icon",sizes:"180x180",type:"image/png"}],
  };
}
