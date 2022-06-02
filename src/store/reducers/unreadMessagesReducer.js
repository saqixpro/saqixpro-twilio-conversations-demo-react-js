import { ActionType } from "../action-types";


const initialState = {};

const reducer = (state = initialState, action) => {
  switch (action.type) {
    case ActionType.UPDATE_UNREAD_MESSAGES:
      //get convo sid and messages to add from payload
      const { channelSid, unreadCount } = action.payload;
      //overwrite the channelSid unread count
      return Object.assign({}, state, { [channelSid]: unreadCount });
    default:
      return state;
  }
};

export default reducer;
