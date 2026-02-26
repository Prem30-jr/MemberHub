const { GoogleGenerativeAI } = require("@google/generative-ai");
const Member = require('../models/Member');

// Note: Ensure process.env.GEMINI_API_KEY is present in the environment variables
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "AIzaSyAecf30ulqL3l19cx68ozg61i3fUg6ku14");

/**
 * AI Logic: Generates a personalized smart reminder focusing on Churn Risk
 */
const generateSmartMessage = async (memberId) => {
    try {
        const member = await Member.findById(memberId).populate('currentPlan');
        if (!member) {
            throw new Error('Member not found');
        }

        const churnRisk = member.churnRisk || { level: 'LOW', score: 0, reasons: [] };

        const prompt = `
Generate a short, professional subscription reminder message for a member named ${member.personalInfo.firstName}.
Their current plan is ${member.currentPlan?.name || 'our service'}.
Their churn risk level is: ${churnRisk.level}.
They have the following payment behaviors: ${churnRisk.reasons.join(', ') || 'Normal behaviour'}.

Adjust the tone strictly based on their risk level:
- LOW risk -> appreciation and friendly reminder. (Example: "You're one of our most consistent members — we truly appreciate your commitment! Your renewal is coming up soon.")
- MEDIUM risk -> supportive, let them know we can help. (Example: "We noticed a small gap in renewals. Let us help you continue your journey smoothly.")
- HIGH risk -> persuasive, flexible, offer alternative solutions. (Example: "We understand schedules can change. We now offer flexible plans to help you stay active.")

Keep the message strictly under 80 words. Do not include placeholders or subject lines, just the plain message text.
`;

        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const result = await model.generateContent(prompt);
        const text = result.response.text().trim();

        member.smartMessage = {
            content: text,
            generatedAt: new Date()
        };
        await member.save();

        return member.smartMessage;
    } catch (err) {
        console.error('AI message generation error:', err);
        throw err;
    }
};

module.exports = {
    generateSmartMessage
};
