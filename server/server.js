import express from "express";
import dotenv from "dotenv";
import fetch from "node-fetch";
import { validateBody } from "./validators.js";
import expressWs from "express-ws";
import { z } from "zod";
dotenv.config({ path: "../.env" });

const state = {};

const appWs = expressWs(express());
const app = appWs.app;
const port = 3001;

// Allow express to parse JSON bodies
app.use(express.json());

app.post(
  "/api/token",
  validateBody(
    z.object({
      code: z.string(),
      instanceId: z.string(),
    })
  ),
  async (req, res) => {
    // TODO: also gate with check for activity existing, just have one shared middleware or w/e

    const response = await fetch(`https://discord.com/api/oauth2/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: process.env.VITE_DISCORD_CLIENT_ID,
        client_secret: process.env.DISCORD_CLIENT_SECRET,
        grant_type: "authorization_code",
        code: req.body.code,
      }),
    });

    const { access_token } = await response.json();
    res.send({ access_token });
  }
);

function broadcastState(instanceId) {
  if (state[instanceId] == null) {
    return;
  }

  state[instanceId].connections.forEach((connection) => {
    connection.send(
      JSON.stringify({
        type: "state",
        state: {
          members: state[instanceId].members,
          startedAt: state[instanceId].startedAt,
          duration: state[instanceId].duration,
        },
      })
    );
  });
}

app.ws("/api/ws/:instanceId", async (ws, req) => {
  const instanceId = req.params.instanceId;

  /*
  // validate activity instance exists
  const validateResponse = await fetch(
    `https://discord.com/api/applications/${process.env.VITE_DISCORD_CLIENT_ID}/activity-instances/${instanceId}`,
    {
      headers: {
        method: "GET",
        Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}`,
      },
    }
  );
  if (validateResponse.status !== 200) {
    ws.close();
    return;
  }
  */

  if (state[instanceId] == null) {
    state[instanceId] = {
      connections: [ws],
      members: [],
      startedAt: null,
      duration: null,
    };
  } else {
    state[instanceId].connections.push(ws);
  }

  ws.on("message", (msg) => {
    if (state[instanceId] == null) {
      return;
    }

    const parsed = JSON.parse(msg);

    if (parsed.type === "join") {
      /*
      {
        type: "join",
        userId: "123",
      }
      */
      if (state[instanceId].members.includes(parsed.userId)) {
        return;
      }

      ws.userId = parsed.userId;
      state[instanceId].members.push(parsed.userId);
      broadcastState(instanceId);
    } else if (parsed.type === "leave") {
      /*
      {
        type: "leave",
        userId: "123",
      }
      */
      if (!state[instanceId].members.includes(parsed.userId)) {
        return;
      }

      state[instanceId].members = state[instanceId].members.filter(
        (member) => member !== parsed.userId
      );
      broadcastState(instanceId);
    } else if (parsed.type === "start") {
      /*
      {
        type: "start",
        duration: 15,
      }
      */
      if (
        state[instanceId].startedAt != null ||
        state[instanceId].members.length === 0
      ) {
        return;
      }

      state[instanceId].startedAt = new Date();
      state[instanceId].duration = parsed.duration ?? 30;
      broadcastState(instanceId);
    } else if (parsed.type === "echo") {
      ws.send(
        JSON.stringify({
          type: "echo",
          message: parsed,
        })
      );
    }
  });

  ws.on("close", () => {
    if (state[instanceId] == null) {
      return;
    }

    state[instanceId].connections = state[instanceId].connections.filter(
      (connection) => connection !== ws
    );
    state[instanceId].members = state[instanceId].members.filter(
      (member) => member !== ws.userId
    );

    if (state[instanceId].connections.length === 0) {
      delete state[instanceId];
    }
    broadcastState(instanceId);
  });
});

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
