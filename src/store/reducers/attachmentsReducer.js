import { ActionType } from "../action-types";

const initialState = {};

const reducer = (
  state = initialState,
  action
) => {
  switch (action.type) {
    case ActionType.ADD_ATTACHMENT:
      const { channelSid, messageIndex, attachment } = action.payload;
      return {
        ...state,
        [channelSid]: {
          ...(state[channelSid] || {}),
          [messageIndex]: attachment,
        },
      };
    default:
      return state;
  }
};

export default reducer;
