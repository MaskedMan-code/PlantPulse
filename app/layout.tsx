import "./globals.css";
export const metadata = { title: "PlantPulse", description: "AI-assisted industrial incident investigation (decision support only)" };
const init = `try{var t=localStorage.getItem("pp-theme");if(!t){var m=matchMedia;t=m("(prefers-contrast: more)").matches?"contrast":m("(prefers-color-scheme: light)").matches?"light":"midnight"}document.documentElement.dataset.theme=t}catch(e){document.documentElement.dataset.theme="midnight"}`;
export default function RootLayout({ children }: { children: React.ReactNode }) { return <html lang="en" suppressHydrationWarning><head><script dangerouslySetInnerHTML={{ __html: init }} /></head><body>{children}</body></html>; }
