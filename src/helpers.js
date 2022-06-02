import { NOTIFICATION_TIMEOUT, UNEXPECTED_ERROR_MESSAGE } from "./constants";

export const getTypingMessage = (typingData) =>
  typingData.length > 1
    ? `${typingData.length + " participants are typing..."}`
    : `${typingData[0] + " is typing..."}`;

export const pushNotification = (
  messages,
  func
) => {
  if (func) {
    func(
      messages.map(({ variant, message }) => ({
        variant,
        message,
        id: new Date().getTime(),
        dismissAfter: NOTIFICATION_TIMEOUT,
      }))
    );
  }
};

export const successNotification = ({
  message,
  addNotifications,
}) => {
  if (!addNotifications) {
    return;
  }
  pushNotification(
    [
      {
        message,
        variant: "success",
      },
    ],
    addNotifications
  );
};

export const unexpectedErrorNotification = (
  addNotifications
) => {
  if (!addNotifications) {
    return;
  }
  pushNotification(
    [
      {
        message: UNEXPECTED_ERROR_MESSAGE,
        variant: "error",
      },
    ],
    addNotifications
  );
};

export const handlePromiseRejection = async (
  func,
  addNotifications
) => {
  if (!addNotifications) {
    return;
  }
  try {
    await func();
  } catch {
    unexpectedErrorNotification(addNotifications);
    return Promise.reject(UNEXPECTED_ERROR_MESSAGE);
  }
};
