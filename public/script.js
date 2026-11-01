// DOM Elements
const chatForm = document.getElementById('chat-form');
const userInput = document.getElementById('user-input');
const chatBox = document.getElementById('chat-box');
const sendButton = chatForm.querySelector('button[type="submit"]');

// Store conversation history for multi-turn chat
const conversationHistory = [];

/**
 * Appends a message bubble to the chat box
 * @param {'user' | 'bot'} sender - The sender type
 * @param {string} text - The message text
 * @returns {HTMLDivElement} - The created message element
 */
function appendMessage(sender, text) {
  const messageElement = document.createElement('div');
  messageElement.classList.add('message', sender);
  messageElement.style.clear = 'both'; // ensures floated messages don't overlap
  messageElement.textContent = text;

  chatBox.appendChild(messageElement);
  chatBox.scrollTop = chatBox.scrollHeight;

  return messageElement;
}

// Handle chat form submission
chatForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const messageText = userInput.value.trim();
  if (!messageText) return;

  // 1. Add user's message to the chat box
  appendMessage('user', messageText);

  // 2. Add message to conversation history
  conversationHistory.push({
    role: 'user',
    text: messageText,
  });

  // Clear and disable input during processing
  userInput.value = '';
  userInput.disabled = true;
  if (sendButton) sendButton.disabled = true;

  // 3. Show temporary "Thinking..." bot message
  const thinkingMessageElement = appendMessage('bot', 'Thinking...');

  try {
    // 4. Send POST request to /api/chat
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
      throw new Error(`Server returned status ${response.status}`);
    }

    const data = await response.json();

    // Support 'result' property (or fallback to 'response')
    const aiReply = data?.result ?? data?.response;

    if (aiReply) {
      // 5. Replace "Thinking..." with AI reply
      thinkingMessageElement.textContent = aiReply;

      // Add AI reply to conversation history
      conversationHistory.push({
        role: 'model',
        text: aiReply,
      });
    } else {
      thinkingMessageElement.textContent = 'Sorry, no response received.';
      // Remove the last user message from history if there was no valid response
      conversationHistory.pop();
    }
  } catch (error) {
    console.error('Chat error:', error);
    thinkingMessageElement.textContent = 'Failed to get response from server.';
    // Remove the last user message from history on failure
    conversationHistory.pop();
  } finally {
    // Re-enable input and focus
    userInput.disabled = false;
    if (sendButton) sendButton.disabled = false;
    userInput.focus();
    chatBox.scrollTop = chatBox.scrollHeight;
  }
});
