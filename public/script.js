// DOM Elements
const chatForm = document.getElementById('chat-form');
const userInput = document.getElementById('user-input');
const chatBox = document.getElementById('chat-box');
const sendButton = document.getElementById('send-button');
const suggestionChips = document.getElementById('suggestion-chips');

// Store conversation history for multi-turn chat
const conversationHistory = [];

/**
 * Safely format text and convert URLs to clickable links
 * @param {string} text - Raw text from AI
 * @returns {string} - Safe HTML with clickable anchor tags
 */
function formatBotMessage(text) {
  const tempDiv = document.createElement('div');
  tempDiv.textContent = text;
  let safeContent = tempDiv.innerHTML;

  // Match URLs starting with http:// or https://
  const urlRegex = /(https?:\/\/[^\s<]+)/g;
  safeContent = safeContent.replace(urlRegex, (url) => {
    return `<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>`;
  });

  return safeContent;
}

/**
 * Appends a message row to the chat box
 * @param {'user' | 'bot'} sender - 'user' or 'bot'
 * @param {string} text - Text content or HTML
 * @param {boolean} isThinking - Whether this is the temporary thinking state
 * @returns {{ row: HTMLElement, bubble: HTMLElement }}
 */
function appendMessage(sender, text, isThinking = false) {
  const row = document.createElement('div');
  row.className = `message-row ${sender}`;

  // Avatar
  const avatar = document.createElement('div');
  avatar.className = 'message-avatar';
  avatar.textContent = sender === 'user' ? 'Anda' : 'Hoca';

  // Content wrapper
  const contentWrapper = document.createElement('div');
  contentWrapper.className = 'message-content-wrapper';

  // Sender Name Label
  const senderLabel = document.createElement('span');
  senderLabel.className = 'message-sender-name';
  senderLabel.textContent = sender === 'user' ? 'Anda' : 'Hoca • Sahabat Hopeline';
  contentWrapper.appendChild(senderLabel);

  // Bubble
  const bubble = document.createElement('div');
  bubble.className = 'message-bubble';

  if (isThinking) {
    bubble.innerHTML = `
      <div class="typing-dots" aria-label="Hoca sedang mengetik...">
        <span class="typing-dot"></span>
        <span class="typing-dot"></span>
        <span class="typing-dot"></span>
      </div>
    `;
  } else if (sender === 'bot') {
    bubble.innerHTML = formatBotMessage(text);
  } else {
    bubble.textContent = text;
  }

  contentWrapper.appendChild(bubble);

  row.appendChild(avatar);
  row.appendChild(contentWrapper);

  chatBox.appendChild(row);
  chatBox.scrollTop = chatBox.scrollHeight;

  return { row, bubble };
}

// Initial welcoming message from Hoca
appendMessage(
  'bot',
  'Halo! Saya Hoca, Sahabat Hopeline Care 💙\n\nSaya di sini siap mendengarkan cerita, keluh kesah, atau mendoakanmu dengan penuh kasih. Ada yang sedang ingin kamu bagikan hari ini?'
);

/**
 * Sends a message to the backend API and handles the response
 * @param {string} messageText 
 */
async function handleSendMessage(messageText) {
  const trimmed = messageText.trim();
  if (!trimmed) return;

  // 1. Tampilkan pesan user
  appendMessage('user', trimmed);

  // 2. Simpan ke history percakapan
  conversationHistory.push({
    role: 'user',
    text: trimmed,
  });

  // Kosongkan & kunci input
  userInput.value = '';
  userInput.disabled = true;
  if (sendButton) sendButton.disabled = true;

  // 3. Tampilkan indikator "Thinking..."
  const { bubble: thinkingBubble } = appendMessage('bot', '', true);

  try {
    // 4. Kirim request POST ke endpoint /api/chat
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        conversation: conversationHistory,
      }),
    });

    if (!response.ok) {
      throw new Error(`Server returned HTTP ${response.status}`);
    }

    const data = await response.json();
    const aiReply = data?.response ?? data?.result;

    if (aiReply) {
      // 5. Ganti animasi titik dengan jawaban AI
      thinkingBubble.innerHTML = formatBotMessage(aiReply);

      // Simpan balasan model ke riwayat
      conversationHistory.push({
        role: 'model',
        text: aiReply,
      });
    } else {
      thinkingBubble.textContent = 'Maaf, belum ada tanggapan yang diterima dari server.';
      conversationHistory.pop();
    }
  } catch (error) {
    console.error('Chat error:', error);
    thinkingBubble.textContent = 'Gagal menghubungi server. Pastikan koneksi dan server aktif.';
    conversationHistory.pop();
  } finally {
    userInput.disabled = false;
    if (sendButton) sendButton.disabled = false;
    userInput.focus();
    chatBox.scrollTop = chatBox.scrollHeight;
  }
}

// Form submit event
chatForm.addEventListener('submit', (e) => {
  e.preventDefault();
  handleSendMessage(userInput.value);
});

// Quick suggestion chips event delegation
if (suggestionChips) {
  suggestionChips.addEventListener('click', (e) => {
    const chip = e.target.closest('.chip');
    if (chip && chip.dataset.prompt) {
      userInput.value = chip.dataset.prompt;
      handleSendMessage(chip.dataset.prompt);
    }
  });
}
