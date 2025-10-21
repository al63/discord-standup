import express from "express";
import dotenv from "dotenv";
import fetch from "node-fetch";
import { validateBody, validateQuery } from "./validators.js";
import { z } from "zod";
dotenv.config({ path: "../.env" });

const state = {};

const app = express();
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
    res.send({ access_token, state: state[req.body.instanceId] });
  }
);

app.get(
  "/api/sync",
  validateQuery(
    z.object({
      instanceId: z.string(),
    })
  ),
  async (req, res) => {
    if (state[req.query.instanceId] == null) {
      res.status(404).send({ error: "standup does not exist" });
      return;
    }

    res.send({ state: state[req.query.instanceId] });
  }
);

app.post(
  "/api/start",
  validateBody(
    z.object({
      instanceId: z.string(),
      members: z.array(z.string().max(60)).max(20),
      duration: z.number().min(1).max(60).default(30),
    })
  ),
  async (req, res) => {
    const instanceId = req.body.instanceId;
    const members = req.body.members;
    const duration = req.body.duration ?? 30;

    if (state[instanceId] != null) {
      res.status(400).send({ error: "standup already exists" });
      return;
    }

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
      res.status(400).send({ error: "activity instance does not exist" });
      return;
    }

    state[instanceId] = {
      members,
      startedAt: new Date(),
      duration,
    };

    // yeet from memory after 30 minutes
    setTimeout(() => {
      delete state[instanceId];
    }, 1000 * 60 * 30);

    res.send({ state: state[instanceId] });
  }
);

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
