const fetch = require("node-fetch");
const sleep = (ms) => new Promise(r => setTimeout(r,ms))
const token = "";
const hook = "";
const guild = "";
const list = ["idk"]; 
const delay = 0.1;
let claimed = false;

async function notify(url, json) {
  const response = await fetch(url, {
    method: "POST",
    body: JSON.stringify(json),
    headers: { "Content-Type": "application/json" },
  });
  return response.status;
}

async function claim(url, json) {
  if (claimed) return;
  claimed = true;
  const response = await fetch(url, {
    method: "PATCH",
    body: JSON.stringify(json),
    headers: {
      "Authorization": token,
      "X-Audit-Log-Reason": "console vanity sniper",
      "Content-Type": "application/json",
    },
  });
  console.log(response.status);
  if (response.status === 200 || response.status === 201) {
    console.log(`[+] Vanity claimed: ${json.code}`);
    await notify(hook, { content: `@everyone claimed ${json.code}` });
  } else {
    console.log(`[-] Failed to claim vanity: ${json.code} | status: ${response.status}`);
    await notify(hook, { content: `@everyone failed to claim ${json.code} | status: ${response.status}` });
  }
  return response.status;
}

async function fetchVanity(vanity, x) {
  try {
    if (!vanity) return;
    const response = await fetch(`https://canary.discord.com/api/v10/invites/${vanity}`, {
      headers: { "Authorization": token },
    });
    const status = response.status;
    if (status === 404) {
      const idk2 = await claim(
        `https://canary.discord.com/api/v10/guilds/${guild}/vanity-url`,
        { code: vanity }
      );
      if ([200, 201, 204].includes(idk2)) {
        console.log(`[+] Claimed Vanity: ${vanity}`)
        await notify(hook, { content: `@everyone claimed ${vanity}` });
        claimed = true;
        throw new Error("SystemExit");
      } else {
        await notify(hook, { content: `@everyone failed to claim ${vanity} | status: ${idk2}` });
        process.exit();
      }
    } else if (status === 200) {
      console.log(`[+] Attempt: ${x} | Vanity: ${vanity}`);
    } else if (status === 429) {
      await notify(hook, { content: "*[-] Rate Limited, Changing Proxy*" });
      console.log("[-] Rate Limited");
      process.kill(1);
    } else {
      console.log("[-] Unknown Error");
      process.kill(1);
    }
  } catch (error) {
    console.log(`[-] Error: ${error}`);
  }
  await sleep(delay * 1000);
  }

async function threadExecutor(vanity, x) {
  while (true) {
    try {
      await fetchVanity(vanity, x);
      break;
    } catch (error) {
      console.log(`[-] Thread suspended, Thread ID: ${x}`);
      continue;
    }
  }
}

async function main() {
  console.clear();
  try {
    const response = await fetch(`https://canary.discord.com/api/v9/users/@me`, {
      headers: { "Authorization": token },
    });
    if ([200, 201, 204].includes(response.status)) {
      const user = await response.json();
      const id = user.id;
      const username = user.username;
      console.log(`Logged in as ${username} | ${id}`);
    } else if (response.status === 429) {
      process.exit(1);
    } else {
      fetch(hook, {
        method: "POST",
        body: JSON.stringify({ content: "@everyone failed to connect to discord websocket." }),
        headers: { "Content-Type": "application/json" },
      });
      console.log("Bad Auth");
      process.exit(1);
    }
    fetch(hook, {
      method: "POST",
      body: JSON.stringify({ content: `connected; ${list}` }),
      headers: { "Content-Type": "application/json" },
    });
    for (let x = 0; x < 100000000; x++) {
      for (let i = 0; i < list.length; i++) {
        if (claimed) {
          process.exit(1);
        }
        await sleep(delay * 1000);
        threadExecutor(list[i], x);
      }
    }
  } catch (error) {
    console.error("Error:", error);
  }
}

main();
