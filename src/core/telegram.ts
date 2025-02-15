import assert from "assert";
import * as instance from "../bot";
import * as utils from "../utils/utils";
import * as C from "../utils/constant";

import dotenv from "dotenv";
dotenv.config();

const parseCode = async (session: any, wholeCode: string) => {
  let codes: string[] = wholeCode.split("_");
  console.log(codes);

  if (codes.length % 2 === 0) {
    for (let i = 0; i < codes.length; i += 2) {
      const type = codes[i];
      const code = codes[i + 1];

      if (type === "ref") {
        if (!session.referredBy) {
          let referredBy: string = "";

          referredBy = utils.decodechatId(code);
          if (referredBy === "" || referredBy === session.chatId) {
            continue;
          }

          if (referredBy.length > 0) {
            const refSession = instance.sessions.get(referredBy);
            if (refSession) {
              console.log(
                `${session.username} has been invited by @${refSession.username} (${refSession.chatId})`
              );
            }

            instance.sendInfoMessage(
              referredBy,
              `Great news! You have invited @${session.username}
You can earn 1.5% of their earning forever!`
            );

            session.referredBy = referredBy;
            session.referredTimestamp = new Date().getTime();
          }
        }
      }
    }
  }
  return false;
};

export const procMessage = async (message: any) => {
  let chatId = message.chat.id.toString();
  let session = instance.sessions.get(chatId);
  let userName = message?.chat?.username;

  if (instance.busy) return;

  let inputStr: string = message?.text?.trim();
  let photoJson: string = message?.photo;
  let document: string = message?.document;

  if (inputStr?.startsWith("/")) {
    let params = message.text.split(" ");
    if (params.length > 0 && params[0] === inputStr) {
      params.shift();
    }

    let channelIds: string[] = instance.channelMap.get(chatId) ?? [];
    switch (params[0]) {
      case "/add": {
        let channelId = params[1];
        if (channelIds.indexOf(channelId) >= 0)
          break;

        channelIds.push(params[1]);
        instance.channelMap.set(chatId, channelIds);
        break;
      }
      case "/remove": {
        channelIds.splice(channelIds.indexOf(params[1]), 1);
        instance.channelMap.set(chatId, channelIds);
        break;;
      }
      default: {
        if (message.text === "/start") {
          if (!session) {
            if (!userName) {
              console.log(
                `Rejected anonymous incoming connection. chatId = ${chatId}`
              );
              instance.sendMessage(
                chatId,
                `Welcome to ${process.env.BOT_TITLE} bot. We noticed that your telegram does not have a username. Please create username [Setting]->[Username] and try again.`
              );
              return;
            }

            session = await instance.createSession(chatId, userName);
          }

          let hideWelcome: boolean = false;
          if (params.length == 1 && params[0].trim() !== "") {
            let wholeCode = params[0].trim();
            hideWelcome = await parseCode(session, wholeCode);

            await instance.removeMessage(chatId, message.message_id);
          }

          session.addr = params[1];
          await instance.executeCommand(chatId, message?.messageId, undefined, {
            c: C.OptionCode.MAIN_MENU,
            k: 1,
          });
          return;
        }
      }
    }

    if (!session) {
      return;
    }

    await instance.executeCommand(chatId, message?.messageId, undefined, {
      c: C.OptionCode.MAIN_MENU,
      k: 1,
    });
    return;
  }

  if ((!inputStr || inputStr === "") && !photoJson && !document) {
    return;
  }

  if (!session) return;

  console.log("___________MESSAGE_____________", message);
  // let resMsg: any = await instance.sendMessage(chatId, inputStr);

  // instance.removeMessage(chatId, message?.message_id);
  let channelIds: string[] = instance.channelMap.get(chatId) ?? [];
  channelIds.forEach((channelId) => {
    instance.forwardMessage(channelId, chatId, message?.message_id)
      .then((result) => {
        console.log(`Message sent to ${channelId}`);
      })
      .catch((err) => {
        console.error(`Failed to send message to ${channelId}: ${err.message}`);
      });
  });
};