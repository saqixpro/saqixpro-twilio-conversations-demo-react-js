import React, {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { Box, Spinner } from "@twilio-paste/core";
import InfiniteScroll from "react-infinite-scroll-component";

import MessageList from "./MessageList";
import styles from "../../styles";
import { getMessages } from "../../api";
import { CONVERSATION_PAGE_SIZE } from "../../constants";

export async function loadMessages(
  conversation,
  currentMessages,
  addMessage
) {
  const convoSid = conversation.sid;
  if (!(convoSid in currentMessages)) {
    const paginator = await getMessages(conversation);
    const messages = paginator.items;
    //save to redux
    addMessage(convoSid, messages);
  }
}


const MessagesBox = (props) => {
  const { messages, convo, loadingState, lastReadIndex, addMessage } = props;
  const [hasMore, setHasMore] = useState(
    messages.length === CONVERSATION_PAGE_SIZE
  );
  const [loading, setLoading] = useState(false);
  const [height, setHeight] = useState(0);
  const [paginator, setPaginator] = useState(null);
  const listRef = useRef(null);

  useEffect(() => {
    if (!messages && convo && !loadingState) {
      loadMessages(convo, messages, addMessage);
    }
  }, []);

  useLayoutEffect(() => {
    const currentHeight = listRef.current?.clientHeight;
    if (currentHeight && currentHeight > height && loading) {
      // for preventing immediate downloading of the next messages page
      setTimeout(() => {
        setHeight(currentHeight ?? 0);
        setLoading(false);
      }, 2000);
    }
  }, [listRef.current?.clientHeight]);

  useEffect(() => {
    getMessages(convo).then((paginator) => {
      setHasMore(paginator.hasPrevPage);
      setPaginator(paginator);
    });
  }, [convo]);

  useEffect(() => {
    if (messages?.length && messages[messages.length - 1].index !== -1) {
      convo.updateLastReadMessageIndex(messages[messages.length - 1].index);
    }
  }, [messages, convo]);

  const lastConversationReadIndex = useMemo(
    () =>
      messages?.length &&
      messages[messages.length - 1].author !== localStorage.getItem("username")
        ? lastReadIndex
        : -1,
    [lastReadIndex, messages]
  );

  const fetchMore = async () => {
    if (!paginator) {
      return;
    }

    const result = await paginator?.prevPage();
    if (!result) {
      return;
    }
    const moreMessages = result.items;

    setLoading(true);
    setPaginator(result);
    setHasMore(result.hasPrevPage);
    addMessage(convo.sid, moreMessages);
  };

  return (
    <Box
      key={convo.sid}
      id="scrollable"
      paddingRight="space50"
      style={{
        display: "flex",
        flexDirection: "column-reverse",
        width: "100%",
        overflow: "scroll",
        paddingLeft: 16,
        height: "100%",
      }}
    >
      <InfiniteScroll
        dataLength={messages?.length ?? 0}
        next={fetchMore}
        hasMore={!loading && hasMore}
        loader={
          <div style={styles.paginationSpinner}>
            <Spinner decorative={false} size="sizeIcon50" title="Loading" />
          </div>
        }
        scrollableTarget="scrollable"
        style={{
          display: "flex",
          overflow: "hidden",
          flexDirection: "column-reverse",
        }}
        inverse={true}
        scrollThreshold="20px"
      >
        <div ref={listRef} style={{ overflow: "scroll" }}>
          <MessageList
            messages={messages ?? []}
            conversation={convo}
            participants={props.participants}
            lastReadIndex={lastConversationReadIndex}
          />
        </div>
      </InfiniteScroll>
    </Box>
  );
};

export default MessagesBox;