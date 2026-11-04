import type { Config } from "tailwindcss";
const v = (n: string) => `rgb(var(--${n}) / <alpha-value>)`;
export default { content: ["./app/**/*.tsx"], theme: { extend: { colors: { slate: { 900: v("s900"), 800: v("s800"), 700: v("s700"), 600: v("s600"), 400: v("s400"), 300: v("s300") }, cyan: { 900: v("c900"), 600: v("c600"), 400: v("c400"), 300: v("c300") } } } }, plugins: [] } satisfies Config;
