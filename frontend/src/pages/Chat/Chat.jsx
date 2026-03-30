import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import API from '../../services/api';
import './Chat.css';

export default function Chat() {
  const [conversations, setConversations] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef(null);

  const [searchParams] = useSearchParams();

  useEffect(() => {
    API.get('/chat/conversations').then(res => {
      setConversations(res.data);
      const urlUser = searchParams.get('user');
      if (urlUser) {
        const id = parseInt(urlUser, 10);
        // Normally find conversation by user id, for mock we just use 201
        loadChat(201);
      } else if (res.data.length > 0) {
        loadChat(res.data[0].id);
      }
    }).catch(console.error);
  }, [searchParams]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const loadChat = async (chatId) => {
    setActiveChatId(chatId);
    setMessages([]);
    setIsTyping(false);
    const res = await API.get(`/chat/${chatId}`);
    setMessages(res.data);
  };

  const handleSend = async (e, forcedText = null) => {
    if (e) e.preventDefault();
    const txt = forcedText || inputText;
    if (!txt.trim() || !activeChatId) return;

    setInputText('');
    const newMsg = { id: Date.now(), sender: 'me', text: txt, timestamp: 'Just now' };
    setMessages(prev => [...prev, newMsg]);
    setIsTyping(true);

    try {
      const res = await API.post(`/chat/${activeChatId}`, { text: txt });
      // The API simulates a delay and sends back the same message. We wait 1.5s manually for the auto reply here.
      setTimeout(() => {
        setIsTyping(false);
        const replies = [
          "Sounds great! 😊",
          "That's an interesting idea, tell me more!",
          "I'm definitely down for that 🚀",
          "Haha, yeah absolutely.",
          "Let's do it! When are you free to sync?",
          "Got it. What's the next step?",
          "Could be fun. I have some experience with that too.",
          "Awesome. I'll look into it."
        ];
        const randomReply = replies[Math.floor(Math.random() * replies.length)];
        setMessages(prev => [...prev, { id: Date.now()+1, sender: 'them', text: randomReply, timestamp: 'Just now' }]);
      }, 1500);
    } catch {
      setIsTyping(false);
    }
  };

  const sendIceBreaker = (prompt) => {
    handleSend(null, prompt);
  };

  const activeConvo = conversations.find(c => c.id === activeChatId);

  return (
    <div className="chat-page hide-scrollbars">
      <div className="chat-sidebar hide-mobile">
        <div className="sidebar-header">
          <input type="search" placeholder="Search messages..." className="chat-search" />
          <div className="chat-tabs">
            <span className="c-tab active">All</span>
            <span className="c-tab">Matches</span>
            <span className="c-tab">Teams</span>
          </div>
        </div>
        <div className="conv-list">
          {conversations.map(c => (
            <div 
              key={c.id} 
              className={`conv-item ${c.id === activeChatId ? 'active' : ''}`}
              onClick={() => loadChat(c.id)}
            >
              <div className="conv-avatar">
                {c.partner.initials}
                {c.unread > 0 && <div className="c-badge">{c.unread}</div>}
              </div>
              <div className="conv-info">
                <div className="cv-head">
                  <span className="cv-name">{c.partner.name}</span>
                  <span className="cv-time">{c.timestamp}</span>
                </div>
                <div className="cv-preview">{c.lastMessage}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="chat-main">
        {activeConvo ? (
          <>
            <div className="chat-header">
              <div className="ch-left">
                <button className="ch-back mobile-only">←</button>
                <div className="ch-avatar">{activeConvo.partner.initials}</div>
                <div>
                  <div className="ch-name">{activeConvo.partner.name}</div>
                  <div className="ch-status">{activeConvo.partner.status}</div>
                </div>
              </div>
              <div className="ch-right">
                <button className="icon-btn">📞</button>
                <button className="icon-btn">📹</button>
                <button className="icon-btn">⋮</button>
              </div>
            </div>

            <div className="chat-body" ref={scrollRef}>
              <div className="date-pill">Today</div>
              
              {messages.map(m => (
                <div key={m.id} className={`msg-wrap ${m.sender}`}>
                  <div className={`msg-bubble ${m.sender}`}>
                    {m.text}
                    {m.sender === 'me' && <span className="read-receipt">✓✓</span>}
                  </div>
                </div>
              ))}

              {isTyping && (
                <div className="msg-wrap them">
                  <div className="msg-bubble them typing">
                    <div className="dot"></div><div className="dot"></div><div className="dot"></div>
                  </div>
                </div>
              )}
            </div>

            {messages.length < 3 && (
              <div className="ice-breakers">
                <div className="ib-title">💬 Suggested starters</div>
                <div className="ib-list">
                  <span onClick={() => sendIceBreaker("What's your availability during the hackathon?")}>Availability</span>
                  <span onClick={() => sendIceBreaker("Which domain are you most excited about?")}>Excited about?</span>
                  <span onClick={() => sendIceBreaker("Shall we make it official? 🤝")}>Make it official?</span>
                </div>
              </div>
            )}

            <form className="chat-input-row" onSubmit={(e) => handleSend(e)}>
              <button type="button" className="icon-btn">📎</button>
              <input 
                type="text" 
                placeholder="Type a message..." 
                value={inputText}
                onChange={e => setInputText(e.target.value)}
              />
              <button type="button" className="icon-btn">😊</button>
              <button type="submit" className="send-btn">➤</button>
            </form>
          </>
        ) : (
          <div className="empty-chat">Select a conversation to start chatting</div>
        )}
      </div>
    </div>
  );
}
