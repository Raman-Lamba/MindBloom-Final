import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { FaPlus, FaComment } from 'react-icons/fa';
import { fetchChats, createChat } from '../utils/api';

const ChatList = () => {
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { chatId } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    loadChats();
  }, [chatId]);

  const loadChats = async () => {
    try {
      setLoading(true);
      const chatData = await fetchChats();
      setChats(chatData);
    } catch (err) {
      console.error('Failed to load chats:', err);
      setError('Failed to load chats');
    } finally {
      setLoading(false);
    }
  };

  const handleNewChat = async () => {
    try {
      const newChat = await createChat();
      navigate(`/chat/${newChat.id}`);
    } catch (error) {
      console.error('Error creating new chat:', error);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  const getChatPreview = (chat) => {
    if (chat.messages && chat.messages.length > 0) {
      // Find first user message
      const userMessage = chat.messages.find(msg => msg.role === 'user');
      if (userMessage) {
        return userMessage.content.substring(0, 30) + (userMessage.content.length > 30 ? '...' : '');
      }
    }
    return 'New chat';
  };

  return (
    <div style={{
      width: '250px',
      minHeight: '100vh',
      backgroundColor: '#1a1a1a',
      borderRight: '1px solid #333',
      display: 'flex',
      flexDirection: 'column',
      position: 'fixed',
      left: 0,
      top: 0,
      zIndex: 100
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '1rem',
        borderBottom: '1px solid #333'
      }}>
        <h3 style={{ 
          margin: 0, 
          color: '#68d5f8',
          fontSize: '1.2rem'
        }}>
          Chats
        </h3>
        <div>
          <button 
            onClick={handleNewChat}
            style={{
              backgroundColor: '#68d5f8',
              color: '#121212',
              border: 'none',
              cursor: 'pointer',
              borderRadius: '50%',
              width: '30px',
              height: '30px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background-color 0.2s'
            }}
          >
            <FaPlus />
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ 
          padding: '1rem', 
          color: '#a0a0a0',
          textAlign: 'center'
        }}>
          Loading chats...
        </div>
      ) : error ? (
        <div style={{ 
          padding: '1rem', 
          color: '#ff6b6b',
          textAlign: 'center'
        }}>
          {error}
        </div>
      ) : chats.length === 0 ? (
        <div style={{ 
          padding: '1rem', 
          color: '#a0a0a0',
          textAlign: 'center'
        }}>
          No chats yet
        </div>
      ) : (
        <div style={{ overflowY: 'auto' }}>
          {chats.map(chat => (
            <Link 
              key={chat.id}
              to={`/chat/${chat.id}`}
              style={{
                display: 'block',
                padding: '0.8rem 1rem',
                textDecoration: 'none',
                color: chatId === chat.id ? '#ffffff' : '#a0a0a0',
                backgroundColor: chatId === chat.id ? '#252525' : 'transparent',
                borderLeft: chatId === chat.id ? '3px solid #68d5f8' : '3px solid transparent',
                transition: 'all 0.2s'
              }}
            >
              <div style={{
                display: 'flex',
                alignItems: 'center'
              }}>
                <FaComment style={{ 
                  marginRight: '0.8rem',
                  color: '#68d5f8',
                  opacity: chatId === chat.id ? 1 : 0.7
                }} />
                <div style={{ flex: 1, overflow: 'hidden' }}>
                  <div style={{
                    fontSize: '0.9rem',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    {getChatPreview(chat)}
                  </div>
                  <div style={{
                    fontSize: '0.75rem',
                    marginTop: '0.2rem',
                    opacity: 0.7
                  }}>
                    {formatDate(chat.updatedAt)}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default ChatList; 