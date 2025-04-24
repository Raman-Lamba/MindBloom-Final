import React, { useState, useEffect, useRef, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from './Header';
import { sendQuery, getChat, createChat, addMessage } from '../utils/api';
import { AuthContext } from '../contexts/AuthContext';

const Chat = () => {
  const { chatId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useContext(AuthContext);
  const [query, setQuery] = useState('');
  const [conversation, setConversation] = useState([]);
  const [loading, setLoading] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Fetch chat data if chatId is provided
  useEffect(() => {
    if (chatId) {
      setChatLoading(true);
      getChat(chatId)
        .then(chatData => {
          // Convert messages to the format needed for conversation
          const formattedConversation = [];
          
          // Group messages by pairs (user question + assistant response)
          for (let i = 0; i < chatData.messages.length; i += 2) {
            const userMessage = chatData.messages[i];
            const assistantMessage = chatData.messages[i + 1];
            
            if (userMessage && userMessage.role === 'user') {
              formattedConversation.push({
                question: userMessage.content,
                answer: assistantMessage ? assistantMessage.content : 'Waiting for response...'
              });
            }
          }
          
          setConversation(formattedConversation);
        })
        .catch(error => {
          console.error('Error fetching chat:', error);
          // Redirect to home if chat not found
          navigate('/');
        })
        .finally(() => {
          setChatLoading(false);
        });
    }
  }, [chatId, navigate]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [conversation]);

  const formatAnswer = (text) => {
    // First handle the markdown headings
    const processedText = text
      .split('\n')
      .map((line, lineIndex) => {
        // Handle headings with ### (h3)
        if (line.startsWith('### ')) {
          return (
            <h3 
              key={`heading-${lineIndex}`} 
              style={{ 
                color: '#68d5f8', 
                fontSize: '1.3rem', 
                fontWeight: '600',
                marginTop: '1.5rem',
                marginBottom: '0.75rem'
              }}
            >
              {line.substring(4)}
            </h3>
          );
        }
        
        // Handle bullet points
        if (line.trim().startsWith('- ') || line.trim().match(/^\d+\.\s/)) {
          return (
            <div 
              key={`bullet-${lineIndex}`} 
              style={{ 
                marginLeft: '1rem',
                marginBottom: '0.5rem' 
              }}
            >
              {line}
            </div>
          );
        }
        
        // Regular text with line breaks
        return (
          <div key={`line-${lineIndex}`} style={{ marginBottom: '0.5rem' }}>
            {line}
          </div>
        );
      });

    // Then handle the bold text with **
    const renderContent = (content) => {
      if (typeof content !== 'string') return content;
      
      return content.split('**').map((part, index) => {
        if (index % 2 === 1) {
          return (
            <strong key={`bold-${index}`} style={{ color: '#68d5f8' }}>
              {part}
            </strong>
          );
        }
        return part;
      });
    };

    return processedText.map(item => {
      if (React.isValidElement(item)) {
        return React.cloneElement(
          item, 
          {...item.props}, 
          typeof item.props.children === 'string' 
            ? renderContent(item.props.children) 
            : item.props.children
        );
      }
      return item;
    });
  };

  const handleNewChat = async () => {
    try {
      // Create a new chat and navigate to it immediately
      const newChat = await createChat();
      
      // Clear conversation immediately before navigation
      setConversation([]);
      
      // Navigate to the new chat
      navigate(`/chat/${newChat.id}`);
    } catch (error) {
      console.error('Error creating new chat:', error);
    }
  };

  const handleSendQuery = async () => {
    if (!query.trim()) return;
    
    const currentQuery = query;
    setQuery('');
    setLoading(true);
    
    try {
      // Add user message to conversation immediately
      setConversation(prev => [
        ...prev,
        { question: currentQuery, answer: 'Thinking...' }
      ]);
      
      // If no chatId, create a new chat
      let currentChatId = chatId;
      if (!currentChatId) {
        const newChat = await createChat();
        currentChatId = newChat.id;
        navigate(`/chat/${currentChatId}`);
      }
      
      // Save user message
      await addMessage(currentChatId, currentQuery);
      
      // Get AI response
      const data = await sendQuery(currentQuery, currentChatId);
      
      // Update conversation with response
      setConversation(prev => [
        ...prev.slice(0, -1),
        { question: currentQuery, answer: data.answer }
      ]);
    } catch (err) {
      setConversation(prev => [
        ...prev.slice(0, -1),
        { question: currentQuery, answer: 'Something went wrong. Please try again.' }
      ]);
    }
    setLoading(false);
  };

  if (chatLoading) {
    return (
      <div style={{ 
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        backgroundColor: '#121212',
        fontFamily: "'Segoe UI', Arial, sans-serif",
        color: '#e0e0e0'
      }}>
        <Header />
        <div style={{ 
          flex: 1,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          <div style={{
            color: '#68d5f8',
            fontSize: '1.5rem'
          }}>
            Loading chat...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      backgroundColor: '#121212',
      fontFamily: "'Segoe UI', Arial, sans-serif",
      position: 'relative',
      color: '#e0e0e0'
    }}>
      <Header />

      {/* Conversation Container */}
      <div style={{ 
        flex: 1,
        overflowY: 'auto',
        padding: '2rem',
        paddingBottom: '120px'
      }}>
        <div style={{ 
          maxWidth: '800px', 
          margin: '0 auto',
          width: '100%' 
        }}>
          {conversation.length === 0 ? (
            <div style={{
              textAlign: 'center',
              marginTop: '4rem',
              color: '#a0a0a0'
            }}>
              <div style={{
                fontSize: '1.5rem',
                marginBottom: '1rem',
                color: '#68d5f8'
              }}>
                Welcome to MindBloom
              </div>
              <p>Start a conversation by typing your question below.</p>
            </div>
          ) : (
            conversation.map((item, index) => (
              <div key={index} style={{ marginBottom: '2rem' }}>
                {/* User Question - Centered with fixed width */}
                <div style={{ 
                  backgroundColor: '#1e1e1e',
                  borderRadius: '12px',
                  padding: '1.5rem',
                  marginBottom: '1rem',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
                  width: '100%',
                  margin: '0 auto 1rem auto'
                }}>
                  <div style={{ 
                    color: '#a0a0a0',
                    fontSize: '0.9rem',
                    marginBottom: '0.5rem',
                    fontWeight: '500'
                  }}>
                    Your question
                  </div>
                  <p style={{ 
                    margin: 0,
                    color: '#e0e0e0',
                    fontSize: '1.1rem',
                    lineHeight: '1.6'
                  }}>
                    {item.question}
                  </p>
                </div>
                
                {/* Assistant Response - With same width as question */}
                <div style={{ 
                  backgroundColor: '#252525',
                  borderRadius: '12px',
                  padding: '1.5rem',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
                  width: '100%',
                  margin: '0 auto'
                }}>
                  <div style={{ 
                    color: '#68d5f8',
                    fontSize: '0.9rem',
                    marginBottom: '0.5rem',
                    fontWeight: '500'
                  }}>
                    Response
                  </div>
                  <div style={{ 
                    color: '#c0c0c0',
                    fontSize: '1.1rem',
                    lineHeight: '1.6'
                  }}>
                    {item.answer === 'Thinking...' ? (
                      <div style={{ color: '#68d5f8' }}>Thinking...</div>
                    ) : (
                      formatAnswer(item.answer)
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Container - Centered */}
      <div style={{ 
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        padding: '1.5rem',
        backgroundColor: '#1e1e1e',
        boxShadow: '0 -2px 12px rgba(0,0,0,0.2)'
      }}>
        <div style={{ 
          maxWidth: '800px',
          margin: '0 auto',
          position: 'relative',
          width: '100%'
        }}>
          <textarea
            rows="3"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask your question..."
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendQuery();
              }
            }}
            style={{ 
              width: '100%',
              padding: '1.2rem',
              fontSize: '1rem',
              borderRadius: '10px',
              border: '1px solid #404040',
              backgroundColor: '#2a2a2a',
              color: '#e0e0e0',
              resize: 'vertical',
              minHeight: '60px',
              transition: 'all 0.2s'
            }}
          />
          <button 
            onClick={handleSendQuery} 
            disabled={loading}
            style={{ 
              position: 'absolute',
              right: '1.2rem',
              bottom: '1.2rem',
              padding: '0.6rem 1.8rem',
              backgroundColor: '#4299e1',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: '500',
              transition: 'all 0.2s'
            }}
          >
            {loading ? 'Thinking...' : 'Ask'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Chat; 