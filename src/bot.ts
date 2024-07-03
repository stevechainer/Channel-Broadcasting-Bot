import TelegramBot from "node-telegram-bot-api";
import * as C from "./utils/constant";

import * as teleBot from "./core/telegram";
import * as global from "./global";

import dotenv from "dotenv";
dotenv.config();

export const COMMAND_START = "start";

export let bot: TelegramBot;
export let myInfo: TelegramBot.User;
export const sessions = new Map();
export const stateMap = new Map();

export let busy = true;

export let channelMap = new Map<string, string[]>();
// export const channelIds: string[] = [];

export const stateMap_setFocus = (
  chatId: string,
  state: any,
  data: any = {}
) => {
  let item = stateMap.get(chatId);
  if (!item) {
    item = stateMap_init(chatId);
  }

  if (!data) {
    let focusData = {};
    if (item.focus && item.focus.data) {
      focusData = item.focus.data;
    }

    item.focus = { state, data: focusData };
  } else {
    item.focus = { state, data };
  }
};

export const stateMap_getFocus = (chatId: string) => {
  const item = stateMap.get(chatId);
  if (item) {
    let focusItem = item.focus;
    return focusItem;
  }

  return null;
};

export const stateMap_init = (chatId: string) => {
  let item = {
    focus: { state: C.StateCode.IDLE, data: { sessionId: chatId } },
    message: new Map(),
  };

  stateMap.set(chatId, item);
  return item;
};

export const stateMap_setMessage_Id = (
  chatId: string,
  messageType: number,
  messageId: number
) => {
  let item = stateMap.get(chatId);
  if (!item) {
    item = stateMap_init(chatId);
  }

  item.message.set(`t${messageType}`, messageId);
};

export const stateMap_getMessage = (chatId: string) => {
  const item = stateMap.get(chatId);
  if (item) {
    let messageItem = item.message;
    return messageItem;
  }
  return null;
};

export const stateMap_getMessage_Id = (chatId: string, messageType: number) => {
  const messageItem = stateMap_getMessage(chatId);
  if (messageItem) {
    return messageItem.get(`t${messageType}`);
  }

  return null;
};

export const stateMap_get = (chatId: string) => {
  return stateMap.get(chatId);
};

export const stateMap_remove = (chatId: string) => {
  stateMap.delete(chatId);
};

export const stateMap_clear = () => {
  stateMap.clear();
};

export const json_buttonItem = (key: string, cmd: number, text: string) => {
  return {
    text: text,
    callback_data: JSON.stringify({ k: key, c: cmd }),
  };
};

const json_url_buttonItem = (text: string, url: string) => {
  return {
    text: text,
    url: url,
  };
};

export const removeMenu = async (chatId: string, messageType: number) => {
  const msgId = stateMap_getMessage_Id(chatId, messageType);

  if (msgId) {
    try {
      await bot.deleteMessage(chatId, msgId);
    } catch (error) {
      //global.errorLog('deleteMessage', error)
    }
  }
};

export const openMenu = async (
  chatId: string,
  messageType: number,
  menuTitle: string,
  json_buttons: any = []
) => {
  const keyboard = {
    inline_keyboard: json_buttons,
    resize_keyboard: false,
    one_time_keyboard: true,
    force_reply: false,
  };

  return new Promise(async (resolve, reject) => {
    await removeMenu(chatId, messageType);

    try {
      let msg: TelegramBot.Message = await bot.sendMessage(chatId, menuTitle, {
        reply_markup: keyboard,
        parse_mode: "HTML",
        disable_web_page_preview: true,
      });

      stateMap_setMessage_Id(chatId, messageType, msg.message_id);
      resolve({ messageId: msg.message_id, chatId: msg.chat.id });
    } catch (error) {
      global.errorLog("openMenu", error);
      resolve(null);
    }
  });
};

export const openMessage = async (
  chatId: string,
  bannerId: string,
  messageType: number,
  menuTitle: string
) => {
  return new Promise(async (resolve, reject) => {
    await removeMenu(chatId, messageType);

    let msg: TelegramBot.Message;

    try {
      if (bannerId) {
        msg = await bot.sendPhoto(chatId, bannerId, {
          caption: menuTitle,
          parse_mode: "HTML",
        });
      } else {
        msg = await bot.sendMessage(chatId, menuTitle, {
          parse_mode: "HTML",
          disable_web_page_preview: true,
        });
      }

      stateMap_setMessage_Id(chatId, messageType, msg.message_id);
      // console.log('chatId, messageType, msg.message_id', chatId, messageType, msg.message_id)
      resolve({ messageId: msg.message_id, chatId: msg.chat.id });
    } catch (error) {
      global.errorLog("openMenu", error);
      resolve(null);
    }
  });
};

export async function switchMenu(
  chatId: string,
  messageId: number,
  title: string,
  json_buttons: any
) {
  const keyboard = {
    inline_keyboard: json_buttons,
    resize_keyboard: true,
    one_time_keyboard: true,
    force_reply: false,
  };

  try {
    await bot.editMessageText(title, {
      chat_id: chatId,
      message_id: messageId,
      reply_markup: keyboard,
      disable_web_page_preview: true,
      parse_mode: "HTML",
    });
  } catch (error) {
    global.errorLog("[switchMenuWithTitle]", error);
  }
}

export const replaceMenu = async (
  chatId: string,
  messageId: number,
  messageType: number,
  menuTitle: string,
  json_buttons: any = []
) => {
  const keyboard = {
    inline_keyboard: json_buttons,
    resize_keyboard: true,
    one_time_keyboard: true,
    force_reply: false,
  };

  return new Promise(async (resolve, reject) => {
    try {
      await bot.deleteMessage(chatId, messageId);
    } catch (error) {
    }

    await removeMenu(chatId, messageType);

    try {
      let msg: TelegramBot.Message = await bot.sendMessage(chatId, menuTitle, {
        reply_markup: keyboard,
        parse_mode: "HTML",
        disable_web_page_preview: true,
      });

      stateMap_setMessage_Id(chatId, messageType, msg.message_id);
      resolve({ messageId: msg.message_id, chatId: msg.chat.id });
    } catch (error) {
      global.errorLog("openMenu", error);
      resolve(null);
    }
  });
};

export const get_menuTitle = (sessionId: string, subTitle: string) => {
  const session = sessions.get(sessionId);
  if (!session) {
    return "ERROR " + sessionId;
  }

  let result =
    session.type === "private"
      ? `@${session.username}'s configuration setup`
      : `@${session.username} group's configuration setup`;

  if (subTitle && subTitle !== "") {
    result += `\n${subTitle}`;
  }

  return result;
};

export const removeMessage = async (sessionId: string, messageId: number) => {
  if (sessionId && messageId) {
    try {
      await bot.deleteMessage(sessionId, messageId);
    } catch (error) {
    }
  }
};

export const sendReplyMessage = async (chatId: string, message: string) => {
  try {
    let data: any = {
      parse_mode: "HTML",
      disable_forward: true,
      disable_web_page_preview: true,
      reply_markup: { force_reply: true },
    };

    const msg = await bot.sendMessage(chatId, message, data);
    return {
      messageId: msg.message_id,
      chatId: msg.chat ? msg.chat.id : null,
    };
  } catch (error) {
    global.errorLog("sendReplyMessage", error);
    return null;
  }
};

export const sendMessage = async (
  chatId: string,
  message: string,
  info: any = {}
) => {
  try {
    let data: any = { parse_mode: "HTML" };

    data.disable_web_page_preview = true;
    data.disable_forward = false;

    if (info && info.message_thread_id) {
      data.message_thread_id = info.message_thread_id;
    }

    const msg = await bot.sendMessage(chatId, message, data);
    return {
      messageId: msg.message_id,
      chatId: msg.chat ? msg.chat.id : null,
    };
  } catch (error: any) {
    if (
      error.response &&
      error.response.body &&
      error.response.body.error_code === 403
    ) {
      info.blocked = true;
    }

    console.log(error?.response?.body);
    global.errorLog("sendMessage", error);
    return null;
  }
};

export const forwardMessage = async (
  chatId: string,
  fromChatId: string,
  messageId: number
) => {
  try {
    const msg = await bot.forwardMessage(chatId, fromChatId, messageId, {
      disable_notification: true,
      protect_content: false
    });
    return {
      messageId: msg.message_id,
      chatId: msg.chat ? msg.chat.id : null,
    };
  } catch (error: any) {
    console.log(error?.response?.body);
    global.errorLog("forwardMessage", error);
    return null;
  }
};


export const sendInfoMessage = async (chatId: string, message: string) => {
  let json = [[json_buttonItem(chatId, C.OptionCode.CLOSE, "✖️ Close")]];

  return sendOptionMessage(chatId, message, json);
};

export const sendOptionMessage = async (
  chatId: string,
  message: string,
  option: any
) => {
  try {
    const keyboard = {
      inline_keyboard: option,
      resize_keyboard: true,
      one_time_keyboard: true,
    };

    const msg = await bot.sendMessage(chatId, message, {
      reply_markup: keyboard,
      disable_web_page_preview: true,
      parse_mode: "HTML",
    });
    return {
      messageId: msg.message_id,
      chatId: msg.chat ? msg.chat.id : null,
    };
  } catch (error) {
    global.errorLog("sendOptionMessage", error);

    return null;
  }
};

export const pinMessage = (chatId: string, messageId: number) => {
  try {
    bot.pinChatMessage(chatId, messageId);
  } catch (error) {
    console.error(error);
  }
};

export const checkWhitelist = (chatId: string) => {
  return true;
};

export const getMainMenuMessage = async (
  sessionId: string
): Promise<string> => {
  const session = sessions.get(sessionId);
  if (!session) {
    return "";
  }

  let MESSAGE: string = `
✨✨✨✨✨ Welcome to ${process.env.BOT_TITLE} ✨✨✨✨✨
  
My channels:\n`;

  let channels: string[] = channelMap.get(sessionId) ?? [];
  channels.forEach((channelId) => {
    MESSAGE += "  👉  \t";
    MESSAGE += channelId;
    MESSAGE += "\n";
  });

  return MESSAGE;
};

export const json_main = async (sessionId: string) => {
  return "";
  const session = sessions.get(sessionId);
  if (!session) {
    return "";
  }

  const itemData = `${sessionId}`;
  const json = [
    [
      json_buttonItem(
        itemData,
        C.OptionCode.TITLE,
        `✨ ${process.env.BOT_TITLE} ✨`
      ),
    ],
    // [
    //   json_buttonItem(
    //     itemData,
    //     C.OptionCode.MAIN_ADD_CHANNEL,
    //     `Add Channel`
    //   ),
    //   json_buttonItem(
    //     itemData,
    //     C.OptionCode.MAIN_SEND_MSG,
    //     `Send Message`
    //   ),
    // ],
    // [
    //   json_buttonItem(
    //     itemData,
    //     C.OptionCode.CLOSE,
    //     `Close`
    //   ),
    // ],
  ];

  return { title: "", options: "" };
};

export const json_confirm = async (
  sessionId: string,
  msg: string,
  btnCaption: string,
  btnId: number,
  itemData: string = ""
) => {
  const session = sessions.get(sessionId);
  if (!session) {
    return null;
  }

  const title = msg;

  let json = [
    [
      json_buttonItem(sessionId, C.OptionCode.CLOSE, "Close"),
      json_buttonItem(itemData, btnId, btnCaption),
    ],
  ];
  return { title: title, options: json };
};

export const openConfirmMenu = async (
  sessionId: string,
  msg: string,
  btnCaption: string,
  btnId: number,
  itemData: string = ""
) => {
  const menu: any = await json_confirm(
    sessionId,
    msg,
    btnCaption,
    btnId,
    itemData
  );
  if (menu) {
    await openMenu(sessionId, btnId, menu.title, menu.options);
  }
};

export const createSession = async (
  chatId: string,
  username: string
  // type: string
) => {
  let session: any = {};

  session.chatId = chatId;
  session.username = username;
  session.addr = "";

  sessions.set(session.chatId, session);
  showSessionLog(session);

  return session;
};

export function showSessionLog(session: any) {
  if (session.type === "private") {
    console.log(
      `@${session.username} user${session.wallet
        ? " joined"
        : "'s session has been created (" + session.chatId + ")"
      }`
    );
  } else if (session.type === "group") {
    console.log(
      `@${session.username} group${session.wallet
        ? " joined"
        : "'s session has been created (" + session.chatId + ")"
      }`
    );
  } else if (session.type === "channel") {
    console.log(
      `@${session.username} channel${session.wallet ? " joined" : "'s session has been created"
      }`
    );
  }
}

export const defaultConfig = {
  vip: 0,
};

export async function init() {
  busy = true;
  bot = new TelegramBot(process.env.BOT_TOKEN as string, {
    polling: true,
  });

  bot.getMe().then((info: TelegramBot.User) => {
    myInfo = info;
  });

  bot.on("message", async (message: any) => {
    const msgType = message?.chat?.type;
    console.log("message_______________", message);
    if (msgType === "private") {
      teleBot.procMessage(message);
    } else if (msgType === "group" || msgType === "supergroup") {
    } else if (msgType === "channel") {
    }
  });

  bot.on("callback_query", async (callbackQuery: TelegramBot.CallbackQuery) => {
    const message = callbackQuery.message;
    if (!message) {
      return;
    }

    console.log("callback_query_______________");
    const option = JSON.parse(callbackQuery.data as string);
    let chatId = message.chat.id.toString();

    console.log()
    executeCommand(chatId, message.message_id, callbackQuery.id, option);
  });

  // setBotPhoto();
  busy = false;
}

export const sessionInit = async () => {
  console.log("========bot started========");
};

export const reloadCommand = async (
  chatId: string,
  messageId: number,
  callbackQueryId: string,
  option: any
) => {
  await removeMessage(chatId, messageId);
  executeCommand(chatId, messageId, callbackQueryId, option);
};

export const executeCommand = async (
  chatId: string,
  _messageId: number | undefined,
  _callbackQueryId: string | undefined,
  option: any
) => {
  const cmd = option.c;
  const id = option.k;

  console.log(`executeCommand cmd = ${cmd} id = ${id}`);

  const session = sessions.get(chatId);
  if (!session) {
    return;
  }

  let messageId = Number(_messageId ?? 0);
  let callbackQueryId = _callbackQueryId ?? "";

  const sessionId: string = chatId;
  const stateData: any = { sessionId, messageId, callbackQueryId, cmd };

  stateData.message_id = messageId;
  stateData.callback_query_id = callbackQueryId;

  try {
    switch (cmd) {
      case C.OptionCode.MAIN_MENU: {
        const menu: any = await json_main(sessionId);
        let title: string = await getMainMenuMessage(sessionId);

        await openMenu(chatId, cmd, title, menu.options);
        break;
      }
      case C.OptionCode.MAIN_ADD_CHANNEL: {
        await sendReplyMessage(
          stateData.sessionId,
          `📨 Reply to this message with input channel name. ex: "@yourchannel1"`
        );
        stateData.menu_id = messageId;
        stateMap_setFocus(chatId, C.StateCode.WAIT_ADD_CHANNEL, stateData);
        break;
      }
      case C.OptionCode.CLOSE: {
        await removeMessage(sessionId, messageId);
        break;
      }
      case C.OptionCode.MAIN_SEND_MSG: {
        await sendReplyMessage(
          stateData.sessionId,
          `📨 Reply to this message with input message content. ex: "welcome to my channel."`
        );
        stateData.menu_id = messageId;
        stateMap_setFocus(chatId, C.StateCode.WAIT_SEND_MESSAGE, stateData);
        break;
      }
      default:
        break;
    }
  } catch (err) {
    console.log(err);
    sendMessage(
      chatId,
      `😢 Sorry, Bot server restarted. Please try again with input token address 😉`
    );
    if (callbackQueryId)
      await bot.answerCallbackQuery(callbackQueryId, {
        text: `😢 Sorry, Bot server restarted. Please try again with input token address 😉`,
      });
  }
};
