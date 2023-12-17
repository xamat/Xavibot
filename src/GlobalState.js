// globalState.js
const globalState = {
    threadId: null,
    assistantId: null,
    setThreadId: function(id) { this.threadId = id; },
    setAssistantId: function(id) { this.assistantId = id; }
  };
  
  export default globalState;
  