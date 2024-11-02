const RELEVANT_CARDS = process.env.RELEVANT_CARDS;

export default async function handler(req, res) {
  console.log("Incoming request:", req.method, req.body);

  // Handle GET and HEAD requests (Trello's webhook validation)
  // Need this for Trello Validation!
  if (req.method === "GET" || req.method === "HEAD") {
    res.setHeader("Content-Type", "application/json");
    res.status(200).send("Webhook verified"); // Respond with 200 status for Trello validation
    console.log(`${req.method} verification successful`);
    return;
  }

  if (req.method === "POST") {
    console.log("Received webhook payload:", JSON.stringify(req.body, null, 2)); // Log the full payload

    const action = req.body.action;

    // Check if it's an updateCard action
    if (action && action.type === "updateCard") {
      console.log("Card updated:", JSON.stringify(action, null, 2));

      // Check for listAfter, which represents the destination list after the card was moved
      if (action.data && action.data.listAfter) {
        const cardIdShort = Number(action.data.card.idShort);
        const listAfter = action.data.listAfter.name;

        console.log(`Card '${cardIdShort}' moved to list '${listAfter}'`);

        // Perform your checks and actions here
        if (listAfter === "Done" && isRelevantCard(cardIdShort)) {
          try {
            // Trigger GitHub Action, ensure it finishes before responding
            await triggerGitHubAction(action.data.card);
          } catch (error) {
            console.error("Failed to trigger GitHub Action:", error);
            return res.status(500).send("Failed to trigger GitHub Action");
          }
        } else {
          console.log("Card is not relevant: ", cardIdShort);
        }
      } else {
        console.log("No listAfter found in the payload");
        return res.status(400).send("Invalid payload: listAfter not found");
      }
    }

    // Ensure you send only one response
    return res.status(200).send("Webhook received");
  } else {
    // If the method is not POST, send a 405 error
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}

function isRelevantCard(cardIdShort) {
  const relevantCards = RELEVANT_CARDS ?? [15, 19, 20];
  return relevantCards.includes(cardIdShort);
}

const triggerGitHubAction = async (card) => {
  const GITHUB_TOKEN = process.env.GITHUB_TOKEN; // Use environment variable for security
  const GITHUB_REPO = "playstore777/dyna-motion"; // Change this to your GitHub repository

  try {
    const response = await fetch(
      `https://api.github.com/repos/${GITHUB_REPO}/dispatches`,
      {
        method: "POST",
        headers: {
          Authorization: `token ${GITHUB_TOKEN}`,
          Accept: "application/vnd.github.v3+json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          event_type: "trigger_build", // This must match the GitHub Action workflow trigger (in the "on" key)
          client_payload: {
            action: "card moved", // Optional: You can pass any additional data about the Trello event here
            card: card.name,
          },
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`GitHub Action failed: ${response.statusText}`);
    }
    console.log("GitHub Action completed successfully");
  } catch (error) {
    console.error("Error triggering GitHub Action:", error);
    throw error; // Re-throw to send 500 response
  }

  console.log("GitHub Action triggered");
};
