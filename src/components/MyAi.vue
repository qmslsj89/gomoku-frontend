<template>
  <div class="my-ai">
    <h1>我的 AI</h1>
    <p>这里是我的 AI 项目，我会在这里展示我自己的 AI 项目。</p>
    <div id="messages" class="messages">
      <transition-group name="message" tag="div">
        <div v-for="(message, index) in messages" :key="index" :class="['message', message.role]">
          <strong>{{ message.role === 'user' ? 'User' : 'AI' }}:</strong> {{ message.content }}
        </div>
      </transition-group>
    </div>
    <div class="input-container">
      <input type="text" v-model="inputMessage" @keyup.enter="sendMessage" :disabled="isSending" placeholder="Type your message here..." />
      <button @click="sendMessage" :disabled="isSending">Send</button>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      inputMessage: '',
      messages: [],
      isSending: false
    };
  },
  methods: {
    async sendMessage() {
      const message = this.inputMessage;
      if (!message || this.isSending) return;

      this.messages.push({ role: 'user', content: message });
      this.inputMessage = '';
      this.isSending = true;

      try {
        const response = await fetch('http://115.235.191.234:3000/api/MyAi', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ content: message })
        });
        const data = await response.json();
        this.messages.push({ role: 'ai', content: data.message });
      } catch (error) {
        console.error('Error:', error);
      } finally {
        this.isSending = false;
      }
    }
  }
};
</script>

<style scoped>
.my-ai {
  max-width: 600px;
  margin: 0 auto;
  font-family: Arial, sans-serif;
  padding: 20px;
  background-color: #f9f9f9;
  border-radius: 8px;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
}

h1 {
  text-align: center;
  color: #333;
}

p {
  text-align: center;
  color: #666;
}

.messages {
  min-height: 500px;
  overflow-y: auto;
  margin-bottom: 20px;
  padding: 10px;
  background-color: #fff;
  border: 1px solid #ddd;
  border-radius: 8px;
}

.message {
  margin: 10px 0;
  padding: 10px;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.user {
  background-color: #e0f7fa;
  color: #00796b;
  text-align: right;
}

.ai {
  background-color: #e8f5e9;
  color: #388e3c;
  text-align: left;
}

.input-container {
  display: flex;
  justify-content: space-between;
}

input[type="text"] {
  flex: 1;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 8px;
  margin-right: 10px;
}

button {
  padding: 10px 20px;
  background-color: #00796b;
  color: #fff;
  border: none;
  border-radius: 8px;
  cursor: pointer;
}

button:hover {
  background-color: #004d40;
}

button:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.message-enter-active, .message-leave-active {
  transition: all 0.5s ease;
}

.message-enter, .message-leave-to {
  opacity: 0;
  transform: translateY(30px);
}

.message-enter-active {
  animation: messageEnter 0.5s ease forwards;
}

.message-leave-active {
  animation: messageLeave 0.5s ease forwards;
}

@keyframes messageEnter {
  0% {
    opacity: 0;
    transform: translateY(30px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes messageLeave {
  0% {
    opacity: 1;
    transform: translateY(0);
  }
  100% {
    opacity: 0;
    transform: translateY(30px);
  }
}
</style>