import OpenAI from 'openai';
import {aiModel, aiPromt, apiKey, baseURL} from '../common.js';
import dedent from 'dedent';

export async function aiTranslate() {
    checkEnv(aiModel, baseURL, apiKey, aiPromt);

    const openai = new OpenAI({baseURL, apiKey});

    const message = dedent`
    mime-cant-speak = Your vow of silence prevents you from speaking.
    mime-invisible-wall-popup-self = You brush up against an invisible wall!
    mime-invisible-wall-popup-others = {CAPITALIZE(THE($mime))} brushes up against an invisible wall!
    mime-invisible-wall-failed = You can't create an invisible wall there.
    mime-not-ready-repent = You aren't ready to repent for your broken vow yet.
    mime-ready-to-repent = You feel ready to take your vows again.
    `;

    const completion = await openai.chat.completions.create({
        model: `${aiModel}`,
        messages: [{
            role: 'system',
            content: `${aiPromt}`,
        }, {
            role: 'user',
            content: message,
        }],
    });

    console.log(completion.choices[0].message.content?.toString());
}

function checkEnv(...envs: (string | undefined)[]) {
    for (const env of envs) {
        if (env == null) {
            throw new Error('AI values in .env is not set!');
        }
    }
}
