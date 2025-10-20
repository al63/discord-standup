import express from "express";
import dotenv from "dotenv";
import fetch from "node-fetch";
dotenv.config({ path: "../.env" });

const state = {};

const app = express();
const port = 3001;

// Allow express to parse JSON bodies
app.use(express.json());

app.post("/api/token", async (req, res) => {
  
  // Exchange the code for an access_token
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

  // Retrieve the access_token from the response
  const { access_token } = await response.json();

  // Return the access_token to our client as { access_token: "..."}
  res.send({access_token});
});


app.post("/api/start", async (req, res) => {

  const instanceId = req.body.instanceId;
  const members = req.body.members;
  const duration = req.body.duration ?? 30;

  if (instanceId == null) {
    res.status(400).send({ error: "instanceId is required" });
    return;
  }

  // validate activity instance exists
  const validateResponse = await fetch(`https://discord.com/api/applications/${process.env.VITE_DISCORD_CLIENT_ID}/activity-instances/${instanceId}`, {
    headers: {
      method: 'GET',
      "Authorization": `Bot ${process.env.DISCORD_BOT_TOKEN}`,
    },
  })
  if (validateResponse.status !== 200) {
    res.status(400).send({ error: "activity instance does not exist" });
    return;
  }

  
  if (state[instanceId] != null) {
    res.status(400).send({ error: "already exists" });
    return;
  }

  state[instanceId] = {
    members,
    startedAt: new Date(),
    duration,
  };

  // yeet from memory after 10 minutes
  setTimeout(() => {
    delete state[instanceId];
  }, 1000 * 60 * 10);

  res.send({ state: state[instanceId] });
});

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
