"use client";

import {useEffect,useState} from "react";
import QRCode from "qrcode";

export default function ConferencePlayerInvitation({token}:{token:string}){
  const[copied,setCopied]=useState(false),[qrCode,setQrCode]=useState("");
  const link=typeof window==="undefined"?"":`${window.location.origin}/invite/${token}`;
  useEffect(()=>{if(!link)return;void QRCode.toDataURL(link,{width:180,margin:1,color:{dark:"#071f3d",light:"#ffffff"}}).then(setQrCode)},[link]);
  const copy=async()=>{await navigator.clipboard.writeText(link);setCopied(true);window.setTimeout(()=>setCopied(false),1800)};
  return <section className="card conference-player-invitation"><div><b>Conference Player Invitation</b><button type="button" className="btn secondary" onClick={copy}>{copied?"Copied!":"Copy Invitation Link"}</button></div>{qrCode&&<img src={qrCode} alt="Conference invitation QR code"/>}</section>;
}
