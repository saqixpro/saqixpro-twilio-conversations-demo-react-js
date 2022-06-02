
import { ActionType } from "../action-types";

const initialState = {};

const reducer = (
  state = initialState,
  action
) => {
  switch (action.type) {
    case ActionType.UPDATE_PARTICIPANTS:
      const { participants, sid } = action.payload;
      return Object.assign({}, state, { [sid]: participants });
    default:
      return state;
  }
};

export default reducer;
