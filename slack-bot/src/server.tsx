import {App} from "@slack/bolt";
import axios from "axios";
import { setUser } from "./db";

const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  port,
});

app.command('/setbot',  async ({ command, ack, respond }) => {
  await ack('Сейчас посмотрим на этого бандита...')

  try {
    const res = await axios.get(command.text);
    const code = res.data;
    await respond(`${command.user_name}, ура, получилось скачать твоего бота: \`${code.trim().slice(0, 10)}...\`. Сейчас его сохраню`)
    await setUser({
      userId: command.user_id,
      name: command.user_name,
      code,
    })
    await respond(`${command.user_name}, сохранил твоего бота!`)
  } catch (error) {
    console.log(command, error);
    await respond(`${command.user_name}, что-то пошло не так :(. Не получилось сохранить бота, т.к. ${error.message ?? "непонятная ошибка"}`)
  }
})

app.command('/gamehelp', async ({ack}) => {
  await ack(`
   - \`/setbot <ссылка>\` - регистрирует твоего бота. Ссылка должна вести прям на код, его можно положить, например, на GitHub Gist
   и взять ссылку на raw код вида https://gist.githubusercontent.com/{name}/{хэш}/raw/{другой хэш}/bot.js
   Код по ссылке должен представлять собой только тело функции, как в \`new Function\`
  В теле функции будет доступен объект \`game\` такого вида:
  \`\`\`
  {
    stash: {} // объект-хранилище, доступное между ходами
    myBots: Record<BotId, {position: {x, y}, health, viewDir}> // твои боты
    enemyBots: Record<BotId, {position: {x, y}, health, viewDir}> // боты противника
  }\`\`\`
  На основании состояния игры функция должна возвращать объект следующего хода:
  \`\`\`
  {
    type: "move" | "rotate" | "shoot"
    dir: "n" | "ns" | ... | "sw", // по сторонам света, при "shoot" игнорируется - стрелять с разворота нельзя
    id: BotId // айди того бота, которым ходишь в этом ходу
  }
  \`\`\`
  - \`/removebot\` - удаляет твоего бота
  `)
})

export default app;
