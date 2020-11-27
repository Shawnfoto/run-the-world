import React, { useReducer, useState } from "react";
import { makeStyles } from "@material-ui/core/styles";
import Grid from "@material-ui/core/Grid";
import Typography from "@material-ui/core/Typography";
import Container from "@material-ui/core/Container";
import AppBar from "@material-ui/core/AppBar";
import Toolbar from "@material-ui/core/Toolbar";
import Card from "@material-ui/core/Card";
import CardActions from "@material-ui/core/CardActions";
import CardContent from "@material-ui/core/CardContent";
import Button from "@material-ui/core/Button";
import TextField from "@material-ui/core/TextField";

import { createMuiTheme } from "@material-ui/core/styles";
import { ThemeProvider } from "@material-ui/styles";

import StreamPlayer from "agora-stream-player";
import { useMediaStream } from "./hooks";

import AgoraRTC from "./utils/AgoraEnhancer";

const useStyles = makeStyles(theme => ({
  root: {
    flexGrow: 1,
    padding: 12
  },
  title: {
    fontWeight: 400
  },
  divider: {
    marginBottom: "32px"
  },
  buttonContainer: {
    display: "flex",
    justifyContent: "space-around"
  },
  buttonItem: {
    width: "38.2%"
  },
  advanceSettings: {
    marginTop: 16
  }
}));

const defaultState = {
  appId: "",
  channel: "",
  uid: "",
  token: undefined,
  cameraId: "",
  microphoneId: "",
  mode: "rtc",
  codec: "h264"
};

const reducer = (
  state,
  action
) => {
  switch (action.type) {
    default:
      return state;
    case "setAppId":
      return {
        ...state,
        appId: action.value
      };
    case "setChannel":
      return {
        ...state,
        channel: action.value
      };
    case "setUid":
      return {
        ...state,
        uid: action.value
      };
    case "setToken":
      return {
        ...state,
        token: action.value
      };
    case "setCamera":
      return {
        ...state,
        cameraId: action.value
      };
    case "setMicrophone":
      return {
        ...state,
        microphoneId: action.value
      };
    case "setMode":
      return {
        ...state,
        mode: action.value
      };
    case "setCodec":
      return {
        ...state,
        codec: action.value
      };
  }
};

function App() {
  const classes = useStyles();
  const [isJoined, setisJoined] = useState(false);
  const [isPublished, setIsPublished] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [state, dispatch] = useReducer(reducer, defaultState);
  const [agoraClient, setClient] = useState(undefined)
  
  let [localStream, remoteStreamList] = useMediaStream(agoraClient);

  const update = (actionType) => (e) => {
    return dispatch({
      type: actionType,
      value: e.target.value
    });
  };


  const join = async () => {
    const client = AgoraRTC.createClient({ mode: state.mode, codec: state.codec })
    setClient(client)
    setIsLoading(true);
    try {
      const uid = isNaN(Number(state.uid)) ? null : Number(state.uid);
      console.log("uid",uid)

      await client.init(state.appId);
      await client.join(state.token, state.channel, uid);
      
      const stream = AgoraRTC.createStream({
        streamID: uid || 12345,
        video: true,
        audio: true,
        screen: false
      });
      await stream.init();

      await client.publish(stream);

      setIsPublished(true);
      setisJoined(true);
      console.log(`Joined channel ${state.channel}`, { variant: "info" });
    } catch (err) {
      console.log(`Failed to join, ${err}`, { variant: "error" });
    } finally {
      setIsLoading(false);
    }
  };

  const publish = async () => {
    setIsLoading(true);
    try {
      if (localStream) {
        await agoraClient.publish(localStream);
        setIsPublished(true);
      }
      console.log("Stream published", { variant: "info" });
    } catch (err) {
      console.log(`Failed to publish, ${err}`, { variant: "error" });
    } finally {
      setIsLoading(false);
    }
  };


  const leave = async () => {
    setIsLoading(true);
    try {
      if (localStream) {
        localStream.close();
        agoraClient.unpublish(localStream);
      }
      await agoraClient.leave();
      setIsPublished(false);
      setisJoined(false);
      console.log("Left channel", { variant: "info" });
    } catch (err) {
      console.log(`Failed to leave, ${err}`, { variant: "error" });
    } finally {
      setIsLoading(false);
    }
  };

  const unpublish = () => {
    if (localStream) {
      agoraClient.unpublish(localStream);
      setIsPublished(false);
      console.log("Stream unpublished", { variant: "info" });
    }
  };

  const JoinLeaveBtn = () => {
    return (
      <Button
        className={classes.buttonItem}
        color={isJoined ? "secondary" : "primary"}
        onClick={isJoined ? leave : join}
        variant="contained"
        disabled={isLoading}
      >
        {isJoined ? "Leave" : "Join"}
      </Button>
    );
  };

  const PubUnpubBtn = () => {
    return (
      <Button
        className={classes.buttonItem}
        color={isPublished ? "secondary" : "default"}
        onClick={isPublished ? unpublish : publish}
        variant="contained"
        disabled={!isJoined || isLoading}
      >
        {isPublished ? "Unpublish" : "Publish"}
      </Button>
    );
  };

  return (
    <React.Fragment>
      <AppBar color="primary">
        <Toolbar>
          <Typography className={classes.title} variant="h6">
            Basic Communication
          </Typography>
        </Toolbar>
      </AppBar>
      <Toolbar className={classes.divider} />
      <Container>
        <Grid container spacing={3}>
          {/* form */}
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <form noValidate autoComplete="off">
                  <TextField
                    required
                    value={state.appId}
                    onChange={update("setAppId")}
                    id="appId"
                    label="App ID"
                    fullWidth
                    margin="normal"
                  />
                  <TextField
                    required
                    value={state.channel}
                    onChange={update("setChannel")}
                    id="channel"
                    label="Channel"
                    fullWidth
                    margin="normal"
                  />

                  <TextField
                    value={state.token}
                    onChange={update("setToken")}
                    id="token"
                    label="Token"
                    fullWidth
                    margin="normal"
                  />
                </form>
              </CardContent>
              <CardActions className={classes.buttonContainer}>
                <JoinLeaveBtn />
                <PubUnpubBtn />
              </CardActions>
            </Card>

            <ThemeProvider
              theme={createMuiTheme({
                palette: {
                  type: "dark"
                }
              })}
            >
            </ThemeProvider>
          </Grid>

          <Grid item xs={12} md={8}>
            {console.log("[localStream]",localStream)}
            {localStream && (
              <StreamPlayer stream={localStream} fit="contain" label="local" />
            )}
            {remoteStreamList.map((stream) => (
              <StreamPlayer
                key={stream.getId()}
                stream={stream}
                fit="contain"
                label={stream.getId()}
              />
            ))}
          </Grid>
        </Grid>
      </Container>
    </React.Fragment>
  );
}
export default App

