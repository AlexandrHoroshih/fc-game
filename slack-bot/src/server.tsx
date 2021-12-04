import {App} from "@slack/bolt";
import axios from "axios";

const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  port,
});

app.command('/joingame', async ({ command, ack, respond }) => {
  // Acknowledge command request
  await ack(`Привет ${command.user_name}! Сейчас тебя зарегаем`);

  await respond(`Ее, ${command.user_name}, ты в игре!`);
});

app.command('/setbot',  async ({ command, ack, respond }) => {
  await ack('Сейчас посмотрим на этого бандита...')

  try {
    const res = await axios.get(command.text);
    const code = res.data;
    await respond(`${command.user_name}, ура, получилось скачать твоего бота: \`${code.trim().slice(0, 10)}...\`. Сейчас его сохраню`)
  } catch (error) {
    console.log(command, error);
    await respond(`${command.user_name}, что-то пошло не так :(. Не получилось скачать бота, т.к. ${error.message ?? "непонятная ошибка"}`)
  }
})
export default app;
