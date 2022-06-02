import { useState, useEffect, useMemo, useRef } from "react";
import { bindActionCreators } from "redux";
import { useDispatch, useSelector } from "react-redux";

import {Client} from "@twilio/conversations";
import { Box } from "@twilio-paste/core";

import { actionCreators } from "../store";
import ConversationContainer from "./conversations/ConversationContainer";
import ConversationsContainer from "./conversations/ConversationsContainer";
import { getConversationParticipants, getToken } from "../api";
import useAppAlert from "../hooks/useAppAlerts";
import Notifications from "./Notifications";
import stylesheet from "../styles";
import { handlePromiseRejection } from "../helpers";
import AppHeader from "./AppHeader";

async function loadUnreadMessagesCount(
  convo,
  updateUnreadMessages
) {
  const count = await convo.getUnreadMessagesCount();
  updateUnreadMessages(convo.sid, count ?? 0);
}

async function handleParticipantsUpdate(
  participant,
  updateParticipants
) {
  const result = await getConversationParticipants(participant.conversation);
  updateParticipants(result, participant.conversation.sid);
}

async function updateConvoList(
  client,
  conversation,
  setConvos,
  addMessages,
  updateUnreadMessages
) {
  if (conversation.status === "joined") {
    const messages = await conversation.getMessages();
    addMessages(conversation.sid, messages.items);
  } else {
    addMessages(conversation.sid, []);
  }

  loadUnreadMessagesCount(conversation, updateUnreadMessages);

  const subscribedConversations = await client.getSubscribedConversations();
  setConvos(subscribedConversations.items);
}

const AppContainer= () => {
  /* eslint-disable */
  const [client, setClient] = useState();
  const token = useSelector((state) => state.token);
  const conversations = useSelector((state) => state.convos);
  const sid = useSelector((state) => state.sid);
  const sidRef = useRef("");
  const [alertsExist, AlertsView] = useAppAlert();
  sidRef.current = sid;

  const username = localStorage.getItem("username");
  const password = localStorage.getItem("password");

  const dispatch = useDispatch();
  const {
    addMessages,
    updateLoadingState,
    updateParticipants,
    updateUnreadMessages,
    startTyping,
    endTyping,
    listConversations,
    login,
    removeMessages,
    removeConversation,
    updateCurrentConversation,
    addNotifications,
    logout,
  } = bindActionCreators(actionCreators, dispatch);

  const updateTypingIndicator = (
    participant,
    sid,
    callback
  ) => {
    const {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      attributes: { friendlyName },
      identity,
    } = participant;
    if (identity === localStorage.getItem("username")) {
      return;
    }
    callback(sid, identity || friendlyName || "");
  };
  useEffect(() => {
    console.log("The Token is " + token);
    const client = new Client(token);
    setClient(client);

   
    client.on("conversationAdded", async (conversation) => {
      conversation.on("typingStarted", (participant) => {
        handlePromiseRejection(
          () =>
            updateTypingIndicator(participant, conversation.sid, startTyping),
          addNotifications
        );
      });

      conversation.on("typingEnded", (participant) => {
        handlePromiseRejection(
          () => updateTypingIndicator(participant, conversation.sid, endTyping),
          addNotifications
        );
      });

      handlePromiseRejection(async () => {
        if (conversation.status === "joined") {
          const result = await getConversationParticipants(conversation);
          updateParticipants(result, conversation.sid);
        }

        updateConvoList(
          client,
          conversation,
          listConversations,
          addMessages,
          updateUnreadMessages
        );
      }, addNotifications);
    });

    client.on("conversationRemoved", (conversation) => {
      updateCurrentConversation("");
      handlePromiseRejection(() => {
        removeConversation(conversation.sid);
        updateParticipants([], conversation.sid);
      }, addNotifications);
    });
    client.on("messageAdded", (event) => {
      addMessage(event, addMessages, updateUnreadMessages);
    });
    client.on("participantLeft", (participant) => {
      handlePromiseRejection(
        () => handleParticipantsUpdate(participant, updateParticipants),
        addNotifications
      );
    });
    client.on("participantUpdated", (event) => {
      handlePromiseRejection(
        () => handleParticipantsUpdate(event.participant, updateParticipants),
        addNotifications
      );
    });
    client.on("participantJoined", (participant) => {
      handlePromiseRejection(
        () => handleParticipantsUpdate(participant, updateParticipants),
        addNotifications
      );
    });
    client.on("conversationUpdated", ({ conversation }) => {
      handlePromiseRejection(
        () =>
          updateConvoList(
            client,
            conversation,
            listConversations,
            addMessages,
            updateUnreadMessages
          ),
        addNotifications
      );
    });

    client.on("messageUpdated", ({ message }) => {
      handlePromiseRejection(
        () =>
          updateConvoList(
            client,
            message.conversation,
            listConversations,
            addMessages,
            updateUnreadMessages
          ),
        addNotifications
      );
    });

    client.on("messageRemoved", (message) => {
      handlePromiseRejection(
        () => removeMessages(message.conversation.sid, [message]),
        addNotifications
      );
    });

    client.on("pushNotification", (event) => {
      // @ts-ignore
      if (event.type != "twilio.conversations.new_message") {
        return;
      }

      if (Notification.permission === "granted") {
      } else {
        console.log("Push notification is skipped", Notification.permission);
      }
    });

    client.on("tokenExpired", () => {
      if (username) {
        getToken(username).then((token) => {
          login(token);
        });
      }
    });

    updateLoadingState(false);

    return () => {
      client?.removeAllListeners();
    };
  }, []);

  function addMessage(
    message,
    addMessages,
    updateUnreadMessages
  ) {
    //transform the message and add it to redux
    handlePromiseRejection(() => {
      if (sidRef.current === message.conversation.sid) {
        message.conversation.updateLastReadMessageIndex(message.index);
      }
      addMessages(message.conversation.sid, [message]);
      loadUnreadMessagesCount(message.conversation, updateUnreadMessages);
    }, addNotifications);
  }

  const openedConversation = useMemo(
    () => conversations.find((convo) => convo.sid === sid),
    [sid, conversations]
  );

  return (
    <Box style={stylesheet.appWrapper}>
      <AlertsView />
      <Notifications />
      <Box>
        <AppHeader
          user={username ?? ""}
          onSignOut={async () => {
            logout();

            // unregister service workers
            const registrations =
              await navigator.serviceWorker.getRegistrations();
            for (let registration of registrations) {
              registration.unregister();
            }
          }}
        />
      </Box>
      <Box style={stylesheet.appContainer(alertsExist)}>
        <ConversationsContainer client={client} />
        <Box style={stylesheet.messagesWrapper}>
          <ConversationContainer
            conversation={openedConversation}
            client={client}
          />
        </Box>
      </Box>
    </Box>
  );
};

export default AppContainer;
