import { Box, Text } from "@twilio-paste/core";
import { useTheme } from "@twilio-paste/theme";
import React from "react";


const Horizon = React.forwardRef(
  ({ amount }, ref) => {
    const theme = useTheme();
    return (
      <Box
        ref={ref}
        style={{
          textAlign: "center",
          backgroundColor: theme.backgroundColors.colorBackgroundPrimaryLighter,
          padding: 2,
          fontSize: "14px",
          lineHeight: "20px",
          margin: "16px 0",
        }}
      >
        <Text as="span" color="colorTextLink">
          {amount} new {amount > 1 ? "messages" : "message"}
        </Text>
      </Box>
    );
  }
);

export default Horizon;
