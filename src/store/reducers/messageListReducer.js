
import { ActionType } from "../action-types";

export const MessageStatus = {
  Sending: "Sending",
  Sent: "Sent",
  Delivered: "Delivered",
  Failed: "Failed",
  None: "none (incoming)",
  Read: "Read",
}


const initialState = {};

const reducer = (state = initialState, action) => {
  switch (action.type) {
    case ActionType.PUSH_MESSAGES: {
      const { channelSid, messages: messagesToAdd } = action.payload;
      const existingMessages = state[channelSid] ?? [];

      return Object.assign({}, state, {
        [channelSid]: existingMessages.concat(messagesToAdd),
      });
    }
    case ActionType.ADD_MESSAGES: {
      //get convo sid and messages to add from payload
      const { channelSid, messages: messagesToAdd } = action.payload;

      //get existing messages for the convo
      const existingMessages = state[channelSid] ?? [];

      const filteredExistingMessages = existingMessages.filter(
        (message) => {
          return !messagesToAdd.find(
            (value) =>
              value.body === message.body &&
              value.author === message.author &&
              value.media?.filename === message.media?.filename &&
              value.media?.size === message.media?.size &&
              (message.index === -1 || value.index === message.index)
          );
        }
      );

      //add new messages to exisiting, ignore duplicates
      const messagesUnique = [...filteredExistingMessages, ...messagesToAdd];

      const sortedMessages = messagesUnique.sort(
        (a, b) => a.dateCreated.getTime() - b.dateCreated.getTime()
      );

      //overwrite the channelSid messages
      return Object.assign({}, state, {
        [channelSid]: sortedMessages,
      });
    }

    case ActionType.REMOVE_MESSAGES: {
      const { channelSid, messages: messagesToRemove } = action.payload;
      const existingMessages = state[channelSid] ?? [];
      const messages = existingMessages.filter(
        ({ index }) =>
          !messagesToRemove.find(
            ({ index: messageIndex }) => messageIndex === index
          )
      );

      return Object.assign({}, state, {
        [channelSid]: messages,
      });
    }
    default:
      return state;
  }
};

export default reducer;
