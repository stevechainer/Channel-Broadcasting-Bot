export enum OptionCode {
  BACK = -100,
  CLOSE,
  TITLE,
  WELCOME = 0,
  MAIN_MENU,
  MAIN_SEND_MSG,
  MAIN_ADD_CHANNEL,
}

export enum StateCode {
  IDLE = 1000,
  WAIT_ADD_CHANNEL,
  WAIT_SEND_MESSAGE,
}

export const LOG_TAG = "================ Angel ================";
