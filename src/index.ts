import dotenv from "dotenv";
dotenv.config();

import * as app from "./app";
import * as bot from "./bot";
import * as global from "./global";

bot.init();
bot.sessionInit();

process.on("uncaughtException", async (error) => {
  await bot.bot.stopPolling();
  bot.init();
});
process.on("SIGSEGV", async (error) => {
  await bot.bot.stopPolling();
  bot.init();
});

app.run(bot);
