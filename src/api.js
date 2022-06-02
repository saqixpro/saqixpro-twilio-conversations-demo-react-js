import { MessageStatus } from "./store/reducers/messageListReducer";
import {
  CONVERSATION_MESSAGES,
  CONVERSATION_PAGE_SIZE,
  PARTICIPANT_MESSAGES,
  UNEXPECTED_ERROR_MESSAGE,
} from "./constants";
import { successNotification, unexpectedErrorNotification } from "./helpers";

export async function addConversation(
  name,
  updateParticipants,
  client,
  addNotifications
) {
  if (name.length > 0 && client !== undefined) {
    try {
      const conversation = await client.createConversation({
        friendlyName: name,
      });
      await conversation.join();

      const participants = await getConversationParticipants(conversation);
      updateParticipants(participants, conversation.sid);

      successNotification({
        message: CONVERSATION_MESSAGES.CREATED,
        addNotifications,
      });

      return conversation;
    } catch (e) {
      unexpectedErrorNotification(addNotifications);

      return Promise.reject(UNEXPECTED_ERROR_MESSAGE);
    }
  }
  return Promise.reject(UNEXPECTED_ERROR_MESSAGE);
}

export async function addParticipant(
  name,
  proxyName,
  chatParticipant,
  convo,
  addNotifications
) {
  if (chatParticipant && name.length > 0 && convo !== undefined) {
    try {
      const result = await convo.add(name);
      successNotification({
        message: PARTICIPANT_MESSAGES.ADDED,
        addNotifications,
      });
      return result;
    } catch (e) {
      return Promise.reject(e);
    }
  }
  if (
    !chatParticipant &&
    name.length > 0 &&
    proxyName.length > 0 &&
    convo !== undefined
  ) {
    try {
      const result = await convo.addNonChatParticipant(proxyName, name, {
        friendlyName: name,
      });
      successNotification({
        message: PARTICIPANT_MESSAGES.ADDED,
        addNotifications,
      });

      return result;
    } catch (e) {
      unexpectedErrorNotification(addNotifications);

      return Promise.reject(e);
    }
  }
  return Promise.reject(UNEXPECTED_ERROR_MESSAGE);
}

export async function getToken(userID) {
  const _url = `http://192.168.157.65:5000/twilio/chat?id=${userID}`;

  const res = await fetch(_url);
  const result = await res.json();
  return result.token;
}

export async function getMessageStatus(
  conversation,
  message,
  channelParticipants
) {
  const statuses = {
    [MessageStatus.Delivered]: 0,
    [MessageStatus.Read]: 0,
    [MessageStatus.Failed]: 0,
    [MessageStatus.Sending]: 0,
  };

  if (message.index === -1) {
    return Promise.resolve({
      ...statuses,
      [MessageStatus.Sending]: 1,
    });
  }

  channelParticipants.forEach((participant) => {
    if (
      participant.identity == localStorage.getItem("username") ||
      participant.type !== "chat"
    ) {
      return;
    }

    if (
      participant.lastReadMessageIndex &&
      participant.lastReadMessageIndex >= message.index
    ) {
      statuses[MessageStatus.Read] += 1;
    } else if (participant.lastReadMessageIndex !== -1) {
      statuses[MessageStatus.Delivered] += 1;
    }
  });

  if (message.aggregatedDeliveryReceipt) {
    const receipts = await message.getDetailedDeliveryReceipts();
    receipts.forEach((receipt) => {
      if (receipt.status === "read") {
        statuses[MessageStatus.Read] += 1;
      }

      if (receipt.status === "delivered") {
        statuses[MessageStatus.Delivered] += 1;
      }

      if (receipt.status === "failed" || receipt.status === "undelivered") {
        statuses[MessageStatus.Failed] += 1;
      }

      if (receipt.status === "sent" || receipt.status === "queued") {
        statuses[MessageStatus.Sending] += 1;
      }
    });
  }

  return statuses;
}

export const getConversationParticipants = async (
  conversation
) => await conversation.getParticipants();

export const removeParticipant = async (
  conversation,
  participant,
  addNotifications
) => {
  try {
    await conversation.removeParticipant(participant);
    successNotification({
      message: PARTICIPANT_MESSAGES.REMOVED,
      addNotifications,
    });
  } catch {
    unexpectedErrorNotification(addNotifications);
    return Promise.reject(UNEXPECTED_ERROR_MESSAGE);
  }
};

export const getBlobFile = async (
  media,
  addNotifications
) => {
  try {
    const url = await getFileUrl(media);
    const response = await fetch(url);
    return response.blob();
  } catch (e) {
    unexpectedErrorNotification(addNotifications);
    return Promise.reject(UNEXPECTED_ERROR_MESSAGE);
  }
};

export const getFileUrl = async (media) => {
  return await media.getContentTemporaryUrl().then();
};

export const getMessages = async (
  conversation
) =>
  await conversation.getMessages(CONVERSATION_PAGE_SIZE);
