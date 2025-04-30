import React, { useState, useEffect, useRef, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from './Header';
import { sendQuery, getChat, createChat, addMessage } from '../utils/api';
import { AuthContext } from '../contexts/AuthContext';
import { FaLightbulb, FaExclamationTriangle } from 'react-icons/fa';
import { FaPlus } from 'react-icons/fa';

const Chat = () => {
  const { chatId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useContext(AuthContext);
  const [query, setQuery] = useState('');
  const [conversation, setConversation] = useState([]);
  const [loading, setLoading] = useState(false);
  const [chatLoading, setChatLoading] = useState(true);
  const [isNewChat, setIsNewChat] = useState(false);
  const messagesEndRef = useRef(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    const loadChat = async () => {
      try {
        setChatLoading(true);
        setErrorMessage(null);
        
        if (chatId) {
          const chatData = await getChat(chatId);
          
          // Format the messages into conversation
          const formattedConversation = [];
          let i = 0;

          while (i < chatData.messages.length) {
            // Find a user message
            if (chatData.messages[i].role === 'user') {
              const userMessage = chatData.messages[i];
              
              // Check if next message exists and is an assistant response
              const assistantMessage = (i+1 < chatData.messages.length && 
                                     chatData.messages[i+1].role === 'assistant') 
                                     ? chatData.messages[i+1] : null;
              
              formattedConversation.push({
                question: userMessage.content,
                answer: assistantMessage ? assistantMessage.content : 'No response available'
              });
              
              // Skip assistant message if found, otherwise just move to next message
              i += assistantMessage ? 2 : 1;
            } else {
              // Skip any orphaned assistant messages
              i++;
            }
          }
          
          setConversation(formattedConversation);
          setIsNewChat(false);
        }
      } catch (error) {
        setErrorMessage(error.message || 'Failed to load chat');
        console.error('Error loading chat:', error);
      } finally {
        setChatLoading(false);
      }
    };

    loadChat();
  }, [chatId]);

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
      setErrorMessage(null);
      const newChat = await createChat();
      navigate(`/chat/${newChat.id}`);
    } catch (error) {
      setErrorMessage(error.message || 'Failed to create a new chat');
      console.error('Error creating new chat:', error);
    }
  };

  const handleSendQuery = async () => {
    if (!query.trim() || isSending) return;
    
    setErrorMessage(null);
    setIsSending(true);
    
    // Optimistically update the UI
    const newQuestion = query.trim();
    setConversation([...conversation, { 
      question: newQuestion, 
      answer: 'Thinking...'
    }]);
    setQuery('');
    
    try {
      const response = await sendQuery(newQuestion, chatId);
      
      // Update the conversation with the actual response
      setConversation(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          question: newQuestion,
          answer: response.answer || 'Sorry, I couldn\'t generate a response'
        };
        return updated;
      });
    } catch (error) {
      // Remove the temporary "Thinking..." message and show error
      setConversation(prev => {
        if (prev.length > 0 && prev[prev.length - 1].answer === 'Thinking...') {
          const updated = [...prev];
          updated[updated.length - 1] = {
            question: newQuestion,
            answer: `Error: ${error.message || 'Failed to get a response'}`
          };
          return updated;
        }
        return prev;
      });
      setErrorMessage(error.message || 'Failed to get a response');
    } finally {
      setIsSending(false);
    }
  };

  // Helper to immediately use a suggested query
  const handleSuggestedQuery = (suggestedQuery) => {
    setQuery(suggestedQuery);
    // Optional: automatically send the query
    // In this implementation, we just fill the input box and let the user send it
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

      {/* Error Message Banner */}
      {errorMessage && (
        <div style={{
          backgroundColor: 'rgba(220, 53, 69, 0.9)',
          color: 'white',
          padding: '0.75rem 2rem',
          position: 'absolute',
          top: '60px',
          left: 0,
          right: 0,
          zIndex: 100,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '0.95rem'
        }}>
          <FaExclamationTriangle style={{ marginRight: '0.5rem' }} />
          {errorMessage}
          <button onClick={() => setErrorMessage(null)} style={{
            marginLeft: '1rem',
            background: 'none',
            border: 'none',
            color: 'white',
            fontSize: '1.1rem',
            cursor: 'pointer'
          }}>
            ×
          </button>
        </div>
      )}

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
                fontSize: '1.8rem',
                marginBottom: '1.5rem',
                color: '#68d5f8'
              }}>
                {currentUser?.name ? `Welcome, ${currentUser.name}!` : 'Welcome to MindBloom!'}
              </div>
              
              <p style={{ fontSize: '1.1rem', marginBottom: '2rem' }}>
                I'm MindBloom, your AI assistant. Ask me anything, and I'll do my best to help you.
              </p>
              
              {isNewChat && (
                <div style={{ 
                  backgroundColor: '#1e1e1e', 
                  borderRadius: '12px',
                  padding: '1.5rem',
                  maxWidth: '600px',
                  margin: '0 auto 2rem auto',
                  boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                }}>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center',
                    marginBottom: '1rem',
                    color: '#68d5f8' 
                  }}>
                    <FaLightbulb style={{ marginRight: '0.5rem' }} />
                    <span style={{ fontWeight: '600' }}>Try asking me:</span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                    {[
                      "What can you help me with?",
                      "Give me a creative writing prompt",
                      "Explain quantum computing in simple terms",
                      "Help me plan a weekend trip"
                    ].map((suggestion, index) => (
                      <div 
                        key={index}
                        onClick={() => handleSuggestedQuery(suggestion)}
                        style={{
                          backgroundColor: '#252525',
                          padding: '0.8rem 1rem',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          border: '1px solid #333',
                          fontSize: '1rem'
                        }}
                        onMouseOver={(e) => {
                          e.currentTarget.style.backgroundColor = '#2a2a2a';
                          e.currentTarget.style.borderColor = '#68d5f8';
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.backgroundColor = '#252525';
                          e.currentTarget.style.borderColor = '#333';
                        }}
                      >
                        {suggestion}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            conversation.map((item, index) => (
              <div key={index} style={{ marginBottom: '2rem' }}>
                {/* User Question */}
                <div style={{ 
                  backgroundColor: '#1e1e1e',
                  borderRadius: '12px',
                  padding: '1.5rem',
                  marginBottom: '1rem',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
                  width: '100%',
                  maxWidth: '800px',
                  margin: '0 auto 1rem auto'
                }}>
                  <div style={{ 
                    display: 'flex',
                    alignItems: 'center',
                    color: '#a0a0a0',
                    fontSize: '0.9rem',
                    marginBottom: '0.5rem',
                    fontWeight: '500'
                  }}>
                    <div style={{ 
                      width: '24px', 
                      height: '24px', 
                      borderRadius: '50%',
                      backgroundColor: '#404040',
                      marginRight: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.8rem'
                    }}>
                      {currentUser?.name?.[0]?.toUpperCase() || 'U'}
                    </div>
                    <div>You</div>
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
                
                {/* Assistant Response */}
                <div style={{ 
                  backgroundColor: '#252525',
                  borderRadius: '12px',
                  padding: '1.5rem',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
                  width: '100%',
                  maxWidth: '800px',
                  margin: '0 auto'
                }}>
                  <div style={{ 
                    display: 'flex',
                    alignItems: 'center',
                    color: '#68d5f8',
                    fontSize: '0.9rem',
                    marginBottom: '0.5rem',
                    fontWeight: '500'
                  }}>
                    <div style={{ 
                      width: '24px', 
                      height: '24px', 
                      borderRadius: '50%',
                      backgroundColor: '#0f4c75',
                      marginRight: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#68d5f8',
                      fontSize: '0.8rem'
                    }}>
                      MB
                    </div>
                    <div>MindBloom</div>
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
        position: 'sticky',
        bottom: 0,
        left: 0,
        right: 0,
        padding: '1.5rem 2rem',
        backgroundColor: 'rgba(18, 18, 18, 0.95)',
        borderTop: '1px solid #333'
      }}>
        <div style={{
          maxWidth: '800px',
          margin: '0 auto',
          position: 'relative',
          display: 'flex'
        }}>
          <button 
            onClick={handleNewChat}
            style={{
              backgroundColor: '#68d5f8',
              color: '#121212',
              border: 'none',
              borderRadius: '50%',
              width: '48px',
              height: '48px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: '12px',
              cursor: 'pointer',
              transition: 'background-color 0.2s',
              boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
            }}
            title="New Chat"
          >
            <FaPlus />
          </button>
          
          <div style={{
            flex: 1,
            position: 'relative'
          }}>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendQuery();
                }
              }}
              placeholder={isNewChat ? "Ask me anything to get started..." : "Type your question here..."}
              style={{
                width: '100%',
                padding: '14px 120px 14px 20px',
                borderRadius: '25px',
                border: 'none',
                backgroundColor: '#353535',
                color: '#fff',
                fontSize: '1rem',
                outline: 'none',
                boxSizing: 'border-box',
                boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
              }}
              disabled={isSending}
            />
            
            <button
              onClick={handleSendQuery}
              disabled={!query.trim() || isSending}
              style={{
                position: 'absolute',
                right: '8px',
                top: '8px',
                bottom: '8px',
                padding: '0 24px',
                backgroundColor: isSending ? '#1d566e' : '#68d5f8',
                color: isSending ? '#e0e0e0' : '#121212',
                border: 'none',
                borderRadius: '20px',
                cursor: query.trim() && !isSending ? 'pointer' : 'not-allowed',
                fontWeight: '600',
                opacity: query.trim() && !isSending ? 1 : 0.7,
                transition: 'all 0.2s'
              }}
            >
              {isSending ? 'Thinking...' : 'Send'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chat; 