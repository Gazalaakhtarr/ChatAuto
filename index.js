import express from "express";
import bodyParser from "body-parser";
import axios from "axios";
import dotenv from "dotenv";

// Initialize dotenv
dotenv.config();

const app = express();
app.use(bodyParser.json());

const INSTAGRAM_ACCESS_TOKEN = process.env.INSTAGRAM_ACCESS_TOKEN;
const VERIFY_TOKEN = process.env.VERIFY_TOKEN;
const LEAD_COLLECTION_DB = [];

// Webhook endpoint for Instagram
app.post("/webhook", (req, res) => {
    console.log("Webhook received:", req.body);
    const message = req.body.entry?.[0]?.messaging?.[0]?.message?.text;
    const senderId = req.body.entry?.[0]?.messaging?.[0]?.sender?.id;

    if (message && senderId) {
        handleIncomingMessage(senderId, message);
    }
    res.sendStatus(200);
});

// Function to handle incoming messages
const handleIncomingMessage = async (senderId, message) => {
    let responseMessage = "I didn't understand that. Try again!";

    if (message.toLowerCase().includes("hello")) {
        responseMessage = "Hey there! How can I assist you today?";
    } else if (message.toLowerCase().includes("lead")) {
        responseMessage = "Great! Please share your email to get started.";
    }

    await sendInstagramDM(senderId, responseMessage);
};

// Function to send an automated DM
const sendInstagramDM = async (recipientId, message) => {
    try {
        await axios.post(
            `https://graph.facebook.com/v17.0/me/messages?access_token=${INSTAGRAM_ACCESS_TOKEN}`,
            {
                recipient: { id: recipientId },
                message: { text: message },
            },
        );
        console.log(`Message sent to ${recipientId}: ${message}`);
    } catch (error) {
        console.error(
            "Error sending message:",
            error.response?.data || error.message,
        );
    }
};

// Verification endpoint for Instagram webhook
app.get("/webhook", (req, res) => {
    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];

    if (mode === "subscribe" && token === VERIFY_TOKEN) {
        console.log("Webhook verified");
        res.status(200).send(challenge);
    } else {
        console.log("error");
        res.sendStatus(403);
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
