
import "./globals.css";
import "./workspaces.css";
import "./patriotism.css";
import "./captain-refinement.css";
import "./owner-refinement.css";
import {ReactNode} from "react";
export const metadata={title:"KadaCourtHub",description:"KadaCourtHub working draft"};
export default function RootLayout({children}:{children:ReactNode}){return <html lang="en" suppressHydrationWarning><body>{children}</body></html>}
