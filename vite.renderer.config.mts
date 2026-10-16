import { defineConfig } from "vite";
import * as dns from "node:dns";
import tailwindcss from "@tailwindcss/vite";

dns.setDefaultResultOrder("ipv4first");

export default defineConfig({
  plugins: [tailwindcss()],
});
