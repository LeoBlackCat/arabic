# Anime Character Generation Prompts

## Character Designs

### Character 1: Amir (Male)
**Base Description**: Friendly young Arab man with dark hair and warm brown eyes

#### Expression Variations:
- **Neutral**: `anime style, portrait of friendly young Arab man with dark hair and warm brown eyes, calm and attentive expression, wearing casual modern Middle Eastern clothing, high quality digital art, Studio Ghibli inspired, suitable for children`

- **Happy**: `anime style, portrait of friendly young Arab man with dark hair and warm brown eyes, bright smile and sparkling eyes very pleased, wearing casual modern Middle Eastern clothing, vibrant colors, wholesome and educational`

- **Encouraging**: `anime style, portrait of friendly young Arab man with dark hair and warm brown eyes, warm encouraging smile nodding approvingly, wearing casual modern Middle Eastern clothing, detailed character design, approachable for language learning`

- **Confused**: `anime style, portrait of friendly young Arab man with dark hair and warm brown eyes, slightly puzzled expression head tilted thoughtfully, wearing casual modern Middle Eastern clothing, clean lines, friendly atmosphere`

### Character 2: Layla (Female)
**Base Description**: Cheerful young Arab woman with long dark hair and bright green eyes

#### Expression Variations:
- **Neutral**: `anime style, portrait of cheerful young Arab woman with long dark hair and bright green eyes, calm and attentive expression, wearing modest modern Middle Eastern clothing, high quality digital art, Studio Ghibli inspired`

- **Happy**: `anime style, portrait of cheerful young Arab woman with long dark hair and bright green eyes, bright smile and sparkling eyes very pleased, wearing modest modern Middle Eastern clothing, vibrant colors, joyful expression`

- **Encouraging**: `anime style, portrait of cheerful young Arab woman with long dark hair and bright green eyes, warm encouraging smile nodding approvingly, wearing modest modern Middle Eastern clothing, supportive and kind`

- **Confused**: `anime style, portrait of cheerful young Arab woman with long dark hair and bright green eyes, slightly puzzled expression head tilted thoughtfully, wearing modest modern Middle Eastern clothing, gentle and patient`

## Background Environments

### Morning Scene
```
anime style, beautiful Middle Eastern courtyard in the morning, bright morning sunlight clear blue sky, traditional architecture with modern touches, peaceful learning environment, high quality digital art, vibrant colors, no people, educational setting
```

### Evening Scene
```
anime style, cozy Middle Eastern cafe in the evening, warm golden sunset soft orange lighting, comfortable seating area, peaceful atmosphere, Studio Ghibli inspired, warm interior lighting, no people, inviting space
```

### General Scene
```
anime style, modern Arabic classroom or study room, soft natural lighting, colorful educational posters on walls, inviting learning space, clean and organized, bright and cheerful, no people, child-friendly environment
```

## API Integration Examples

### Using DALL-E 3
```javascript
const prompt = "anime style, portrait of friendly young Arab man with dark hair and warm brown eyes, bright smile and sparkling eyes very pleased, wearing casual modern Middle Eastern clothing, vibrant colors, wholesome and educational, Studio Ghibli inspired";

const response = await fetch('https://api.openai.com/v1/images/generations', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    model: 'dall-e-3',
    prompt: prompt,
    n: 1,
    size: '1024x1024',
    quality: 'standard',
  }),
});
```

### Using Midjourney (via API)
```bash
# Midjourney Discord Bot Commands
/imagine prompt: anime style, portrait of cheerful young Arab woman with long dark hair and bright green eyes, warm encouraging smile, wearing modest modern Middle Eastern clothing, Studio Ghibli inspired, suitable for children --ar 1:1 --v 6
```

### Using Stable Diffusion (Replicate)
```javascript
const response = await fetch('https://api.replicate.com/v1/predictions', {
  method: 'POST',
  headers: {
    'Authorization': `Token ${process.env.REPLICATE_API_TOKEN}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    version: 'ac732df83cea7fff18b8472768c88ad041fa750ff7682a21affe81863cbe77e4',
    input: {
      prompt: prompt,
      negative_prompt: 'nsfw, adult content, inappropriate, violence, scary, dark themes',
      width: 1024,
      height: 1024,
      guidance_scale: 7.5,
    },
  }),
});
```

## Character File Naming Convention

Characters should be saved with this naming pattern:
- `character1_neutral_morning.png`
- `character1_happy_evening.png`
- `character2_encouraging_general.png`
- etc.

Backgrounds:
- `morning.jpg`
- `evening.jpg`
- `general.jpg`

## Quick Setup Instructions

1. **Install dependencies**:
   ```bash
   npm install dotenv node-fetch
   ```

2. **Set up environment variables** in `.env`:
   ```
   OPENAI_API_KEY=your_dalle_key_here
   REPLICATE_API_TOKEN=your_replicate_key_here
   ```

3. **Generate images**:
   ```bash
   node generateAnimeCharacters.js
   ```

4. **Manual alternative**: Use the prompts above in:
   - ChatGPT with DALL-E
   - Midjourney Discord
   - Stable Diffusion web UI
   - Leonardo AI
   - Any other AI art generator

## Cost Estimates

- **DALL-E 3**: ~$0.04 per 1024x1024 image
- **Midjourney**: ~$10/month subscription (unlimited generations)
- **Stable Diffusion (Replicate)**: ~$0.0055 per generation
- **Total needed**: 18 character images + 3 backgrounds = 21 images

**Recommended**: Start with free tools like Stable Diffusion WebUI or use Midjourney's free trial, then upgrade if needed.