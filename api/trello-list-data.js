export default async function (req, res) {
  const TRELLO_KEY = process.env.TRELLO_KEY;
  const TRELLO_TOKEN = process.env.TRELLO_TOKEN;
  const LIST_ID = process.env.LIST_ID;

  console.log("trello-list-data function req: ", req);

  /**
   * Remotion causes this CORS, we can get rid of this I think
   * there is a video where Jhonny burger (creator of Remotion)
   * showed us how, he was demonstrating of someone else channel
   * I think title was something like "Can we code video"
   */
  // Add CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    // Respond to preflight request
    res.status(200).end();
    return;
  }

  try {
    const response = await fetch(
      `https://api.trello.com/1/lists/${LIST_ID}/cards?key=${TRELLO_KEY}&token=${TRELLO_TOKEN}`
    );

    if (!response.ok) {
      // Handle non-200 status codes from Trello
      throw new Error(`Trello API responded with status ${response.status}`);
    }

    const data = await response.json();
    console.log("response: ", data);

    res.status(200).json(data);
  } catch (error) {
    console.error("Error while fetching data from Trello: ", error);

    res.status(500).json({
      error: "Failed to fetch data from Trello",
      message: error.message,
    });
  }
}
