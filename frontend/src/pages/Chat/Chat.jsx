import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import API from '../../services/api';
import './Chat.css';

const EMPTY_MESSAGES = {
  all: 'No conversations yet. Match with someone to start chatting!',
  match: 'No matches yet. Swipe right on profiles to find matches!',
  team: 'No team conversations yet. Form a team first!'
};

export default function Chat() {
  const [conversations, setConversations] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const scrollRef = useRef(null);

  const [searchParams] = useSearchParams();

  const loadConversations = async (preferredId = null) => {
    const res = await API.get('/chat/conversations');
    setConversations(res.data);

    if (preferredId) {
      await loadChat(preferredId);
      return;
    }

    if (!activeChatId && res.data.length > 0) {
      await loadChat(res.data[0].id);
    }
  };

  useEffect(() => {
    const bootstrap = async () => {
      try {
        const urlProfileId = searchParams.get('user');
        if (urlProfileId) {
          const startRes = await API.post('/chat/start', { profileId: urlProfileId });
          await loadConversations(startRes.data.conversationId);
        } else {
          await loadConversations();
        }
      } catch (err) {
        console.error(err);
      }
    };
    bootstrap();
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
    setIsTyping(true);

    try {
      const res = await API.post(`/chat/${activeChatId}`, { text: txt });
      setMessages(prev => [...prev, res.data.message]);
      setIsTyping(false);
      await loadConversations(activeChatId);
    } catch {
      setIsTyping(false);
    }
  };

  const sendIceBreaker = (prompt) => {
    handleSend(null, prompt);
  };

  const activeConvo = conversations.find(c => c.id === activeChatId);

  const filteredConversations = conversations.filter(c => {
    if (activeTab === 'all') return true;
    if (activeTab === 'match') return c.type === 'match';
    if (activeTab === 'team') return c.type === 'team';
    return true;
  });

  return (
    <div className="chat-page hide-scrollbars">
      <div className="chat-sidebar hide-mobile">
        <div className="sidebar-header">
          <input type="search" placeholder="Search messages..." className="chat-search" />
          <div className="chat-tabs">
            <span className={`c-tab ${activeTab === 'all' ? 'active' : ''}`} onClick={() => setActiveTab('all')}>All</span>
            <span className={`c-tab ${activeTab === 'match' ? 'active' : ''}`} onClick={() => setActiveTab('match')}>Matches</span>
            <span className={`c-tab ${activeTab === 'team' ? 'active' : ''}`} onClick={() => setActiveTab('team')}>Teams</span>
          </div>
        </div>
        <div className="conv-list">
          {filteredConversations.length === 0 ? (
            <div className="empty-conv">{EMPTY_MESSAGES[activeTab]}</div>
          ) : (
            filteredConversations.map(c => (
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
                  <div className="cv-preview">{c.lastMessage || <em style={{opacity:0.5}}>No messages yet</em>}</div>
                </div>
              </div>
            ))
          )}
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
