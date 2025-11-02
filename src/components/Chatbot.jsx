import { useState, useEffect, useRef } from "react";
import { jwtDecode } from "jwt-decode";
import axios from "axios";
import { Send, X, Minimize2, Maximize2, MessageCircle } from "lucide-react";

const Chatbot = ({ userId: propUserId }) => {
  const [open, setOpen] = useState(false);
  const [minimized, setMinimized] = useState(true);
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [userId, setUserId] = useState(propUserId);
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);

  // Get userId from token if not provided as prop
  useEffect(() => {
    if (!userId) {
      const token = localStorage.getItem("token");
      if (token) {
        try {
          const decodedToken = jwtDecode(token);
          setUserId(decodedToken.userId);
        } catch (error) {
          console.error("Error decoding token:", error);
        }
      }
    }
  }, [userId]);

  // Initialize with welcome message
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          role: "assistant",
          content: "👋 Hello! I'm your Expensync AI assistant. I can help you with:\n• Analyzing your expenses\n• Budgeting tips\n• Financial advice\n• Answering questions about your spending\n\nHow can I help you today?",
          timestamp: new Date()
        }
      ]);
    }
  }, []);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const getApiUrl = () => {
    return import.meta.env.VITE_API_URL || 
           (window.location.hostname === 'localhost' ? "http://localhost:5000" : "https://expensync-ex0w.onrender.com");
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || loading) return;

    if (!userId) {
      setMessages(prev => [...prev, {
        role: "assistant",
        content: "⚠️ Please log in to chat with AI assistant.",
        timestamp: new Date()
      }]);
      return;
    }

    const userMessage = inputMessage.trim();
    setInputMessage("");
    
    // Add user message to chat
    const newUserMessage = {
      role: "user",
      content: userMessage,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, newUserMessage]);

    setLoading(true);

    try {
      const token = localStorage.getItem("token");
      
      // Prepare chat history (last 10 messages)
      const chatHistory = messages
        .slice(-10)
        .map(msg => ({
          role: msg.role === "user" ? "user" : "assistant",
          content: msg.content
        }));

      const apiUrl = getApiUrl();
      const res = await axios.post(
        `${apiUrl}/api/ai/chat/${userId}`,
        {
          message: userMessage,
          chatHistory: chatHistory
        },
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        }
      );

      // Add AI response
      setMessages(prev => [...prev, {
        role: "assistant",
        content: res.data.response || "I apologize, but I couldn't process that request.",
        timestamp: new Date()
      }]);
    } catch (error) {
      console.error("Chat error:", error);
      const errorMessage = error.response?.data?.message || 
                          error.message || 
                          "Sorry, I'm having trouble right now. Please try again later.";
      setMessages(prev => [...prev, {
        role: "assistant",
        content: `⚠️ ${errorMessage}`,
        timestamp: new Date()
      }]);
    } finally {
      setLoading(false);
    }
  };

  const toggleChat = () => {
    if (open) {
      setMinimized(!minimized);
    } else {
      setOpen(true);
      setMinimized(false);
    }
  };

  const closeChat = () => {
    setOpen(false);
    setMinimized(true);
  };

  return (
    <div className="fixed bottom-6 left-6 z-[60]">
      {open && !minimized && (
        <div 
          ref={chatContainerRef}
          className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-2xl w-96 h-[500px] flex flex-col transition-all duration-300 mb-4"
        >
          {/* Header */}
          <div className="bg-blue-600 text-white p-4 rounded-t-2xl flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-lg">💬</span>
              <h3 className="font-semibold text-lg">AI Assistant</h3>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setMinimized(true)}
                className="hover:bg-blue-700 p-1 rounded transition"
                title="Minimize"
              >
                <Minimize2 size={18} />
              </button>
              <button
                onClick={closeChat}
                className="hover:bg-blue-700 p-1 rounded transition"
                title="Close"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Messages Container */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-slate-900">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-3 ${
                    msg.role === "user"
                      ? "bg-blue-600 text-white"
                      : "bg-white dark:bg-slate-700 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-600"
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-white dark:bg-slate-700 rounded-lg p-3 border border-gray-200 dark:border-gray-600">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.4s" }}></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-800 rounded-b-2xl">
            <div className="flex gap-2">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Type your message..."
                className="flex-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={loading}
              />
              <button
                type="submit"
                disabled={loading || !inputMessage.trim()}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white p-2 rounded-lg transition flex items-center justify-center"
                title="Send message"
              >
                <Send size={20} />
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Chat Toggle Button - Chat Message Style */}
      <button
        onClick={toggleChat}
        className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-5 py-3.5 rounded-full shadow-xl hover:shadow-2xl hover:shadow-blue-500/50 hover:scale-105 transition-all duration-300 z-[60] flex items-center justify-center gap-2.5 group relative"
        title={open && !minimized ? "Minimize chat" : "Open chat"}
      >
        {!open && (
          <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center animate-pulse shadow-lg">
            <span>1</span>
          </div>
        )}
        {open && !minimized ? (
          <Minimize2 size={18} className="group-hover:rotate-90 transition-transform" />
        ) : (
          <>
            <MessageCircle size={22} className="group-hover:scale-110 transition-transform" />
            <span className="font-semibold text-sm tracking-wide">Chat</span>
          </>
        )}
      </button>
    </div>
  );
};

export default Chatbot;
