import express from 'express';
import bodyParser from 'body-parser';
import axios from 'axios';
import { config } from 'dotenv';

config();

const app = express();
app.use(bodyParser.json());

const INSTAGRAM_ACCESS_TOKEN = process.env.INSTAGRAM_ACCESS_TOKEN;
const LEAD_COLLECTION_DB = [];

// Endpoint to handle Instagram webhook events
app.post('/webhook', (req, res) => {
    console.log('Webhook received:', req.body);
    const message = req.body.entry?.[0]?.messaging?.[0]?.message?.text;
    const senderId = req.body.entry?.[0]?.messaging?.[0]?.sender?.id;
    
    if (message && senderId) {
        handleIncomingMessage(senderId, message);
    }
    res.sendStatus(200);
});

// Function to send an automated DM
const sendInstagramDM = async (recipientId, message) => {
    try {
        await axios.post(
            `https://graph.facebook.com/v17.0/me/messages`,
            {
                messaging_type: 'RESPONSE',
                recipient: { id: recipientId },
                message: { text: message }
            },
            { headers: { Authorization: `Bearer ${INSTAGRAM_ACCESS_TOKEN}` } }
        );
        console.log('Message sent successfully');
    } catch (error) {
        console.error('Error sending message:', error.response?.data || error.message);
    }
};

// Keyword-based automation
const handleIncomingMessage = async (senderId, message) => {
    const keywords = {
        'guide': 'Here is your free guide: [link]',
        'Ai': 'Free Courses by NVIDIA: [https://linktr.ee/Artificialintelligence.co]',
        'help': 'How can we assist you today?'
    };
    
    for (const keyword in keywords) {
        if (message.toLowerCase().includes(keyword)) {
            await sendInstagramDM(senderId, keywords[keyword]);
            return;
        }
    }
    await sendInstagramDM(senderId, "Sorry, I didn't understand. Type 'help' for options.");
};

// Lead collection function
const collectLead = (userId, userData) => {
    LEAD_COLLECTION_DB.push({ userId, ...userData });
    console.log('Lead collected:', userData);
};

// Example integration with external CRM
const syncWithCRM = async () => {
    try {
        await axios.post('https://your-crm.com/api/leads', { leads: LEAD_COLLECTION_DB });
        console.log('Leads synced successfully');
    } catch (error) {
        console.error('Error syncing leads:', error.response?.data || error.message);
    }
};

// Example route to trigger automated DM
app.post('/send-message', async (req, res) => {
    const { recipientId, message } = req.body;
    await sendInstagramDM(recipientId, message);
    res.json({ success: true, message: 'DM sent successfully' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`ChatAuto running on port ${PORT}`));
