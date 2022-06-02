import { ActionType } from "../action-types";

const initialState = [];

const reducer = (
  state = initialState,
  action
) => {
  switch (action.type) {
    case ActionType.LIST_CONVERSATIONS:
      return action.payload.sort((a, b) => {
        return (
          (b.lastMessage?.dateCreated || b.dateUpdated) -
          (a.lastMessage?.dateCreated || a.dateUpdated)
        );
      });
    case ActionType.UPDATE_CONVERSATION: {
      const stateCopy = [...state];
      let target = stateCopy.find(
        (convo) => convo.sid === action.payload.channelSid
      );

      target =
        target &&
        ({
          ...target,
          ...action.payload.parameters,
        });

      return stateCopy;
    }
    case ActionType.REMOVE_CONVERSATION: {
      const stateCopy = [...state];

      return stateCopy.filter(
        (convo) => convo.sid !== action.payload
      );
    }
    default:
      return state;
  }
};

export default reducer;
