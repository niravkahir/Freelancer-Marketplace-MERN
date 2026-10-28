const axios = require('axios');

// @desc    Generate project description using AI
// @route   POST /api/ai/generate-description
// @access  Private (Client only)
exports.generateDescription = async (req, res) => {
    try {
        const { keywords, title, category, skillsRequired } = req.body;

        if (!keywords || keywords.trim().length < 5) {
            return res.status(400).json({ success: false, message: 'Please provide at least 5 characters of keywords' });
        }

        let contextInfo = '';
        if (title) contextInfo += `Project Title: ${title}\n`;
        if (category) contextInfo += `Category: ${category}\n`;
        if (skillsRequired && skillsRequired.length > 0) {
            contextInfo += `Required Skills: ${skillsRequired.join(', ')}\n`;
        }

        const prompt = `You are an expert project manager helping a client write a professional project description for a freelancer marketplace.
${contextInfo}
Client's brief idea: "${keywords}"

Write a clear, professional project description (150-250 words). Include technical requirements, features, and non-functional requirements. Do NOT use first-person. Return ONLY the description text.`;

        const response = await axios.post(
            'https://api.groq.com/openai/v1/chat/completions',
            {
                model: 'openai/gpt-oss-120b',
                messages: [{ role: 'user', content: prompt }],
                temperature: 0.7,
                max_tokens: 500,
            },
            {
                headers: {
                    'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
                    'Content-Type': 'application/json',
                },
            }
        );

        let description = response.data.choices[0].message.content.trim();
        description = description.replace(/^["']|["']$/g, '');

        res.status(200).json({
            success: true,
            description: description,
            wordCount: description.split(' ').length,
        });
    } catch (error) {
        console.error('AI generation error:', error.response?.data || error.message);
        res.status(500).json({ success: false, message: 'AI is busy. Please try again.' });
    }
};

// @desc    Generate skills suggestions
// @route   POST /api/ai/suggest-skills
// @access  Private (Client only)
exports.suggestSkills = async (req, res) => {
    try {
        const { title, description } = req.body;

        if (!title || !description) {
            return res.status(400).json({ success: false, message: 'Title and description required' });
        }

        const prompt = `Read this project title and description and suggest 5 relevant technical skills.`;

        const response = await axios.post(
            'https://api.groq.com/openai/v1/chat/completions',
            {
                model: 'openai/gpt-oss-120b',
                messages: [
                    { role: 'system', content: 'You are an API that only returns JSON.' },
                    { role: 'user', content: prompt },
                    { role: 'user', content: `Title: ${title}\nDescription: ${description.substring(0, 500)}` }
                ],
                temperature: 0.5,
                max_tokens: 150,

                response_format: {
                    type: "json_schema",
                    json_schema: {
                        name: "skills_response",
                        strict: true,
                        schema: {
                            type: "object",
                            properties: {
                                skills: {
                                    type: "array",
                                    items: { type: "string" }
                                }
                            },
                            required: ["skills"],
                            additionalProperties: false
                        }
                    }
                }
            },
            {
                headers: {
                    'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
                    'Content-Type': 'application/json',
                },
            }
        );

        const text = response.data.choices[0].message.content.trim();
        const parsedData = JSON.parse(text);

        res.status(200).json({ success: true, skills: parsedData.skills });
    } catch (error) {
        console.error('AI suggestion error:', error.response?.data || error.message);
        res.status(500).json({ success: false, message: 'AI failed to suggest skills. Please try again.' });
    }
};