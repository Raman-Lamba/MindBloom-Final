import React, { useState, useEffect, useRef, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from './Header';
import { sendQuery, getChat, createChat } from '../utils/api';
import { AuthContext } from '../contexts/AuthContext';
import { FaLightbulb, FaExclamationTriangle, FaPlus } from 'react-icons/fa';
import useResponsive from '../utils/useResponsive';

const Chat = ({ toggleSidebar }) => {
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
  const { isMobile } = useResponsive();
  const inputRef = useRef(null);

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

  // iOS keyboard adjustment
  useEffect(() => {
    if (!isMobile) return;
    
    const handleFocus = () => {
      setTimeout(() => {
        window.scrollTo(0, 0);
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 300);
    };
    
    const handleBlur = () => {
      window.scrollTo(0, 0);
    };
    
    const input = inputRef.current;
    if (input) {
      input.addEventListener('focus', handleFocus);
      input.addEventListener('blur', handleBlur);
      
      return () => {
        input.removeEventListener('focus', handleFocus);
        input.removeEventListener('blur', handleBlur);
      };
    }
  }, [isMobile]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [conversation]);

  const formatAnswer = (text) => {
    // Guard against null or undefined text
    if (!text) return null;
    
    // Simple string check instead of regex to avoid potential issues
    const thinkStartTag = '<think>';
    const thinkEndTag = '</think>';
    
    let thinkContent = null;
    let mainContent = text;
    
    // Check if think tags exist in the text
    if (text.includes(thinkStartTag) && text.includes(thinkEndTag)) {
      try {
        // Find the start and end positions
        const startIndex = text.indexOf(thinkStartTag);
        const endIndex = text.indexOf(thinkEndTag) + thinkEndTag.length;
        
        // Extract the think content (without the tags)
        thinkContent = text.substring(
          startIndex + thinkStartTag.length, 
          text.indexOf(thinkEndTag)
        ).trim();
        
        // Get content before and after the think section
        const beforeThink = text.substring(0, startIndex).trim();
        const afterThink = text.substring(endIndex).trim();
        
        // Combine to get the main content
        mainContent = (beforeThink + " " + afterThink).trim();
      } catch (error) {
        console.error("Error parsing think tags:", error);
        // Fallback to original text if parsing fails
        mainContent = text;
        thinkContent = null;
      }
    }
    
    // Process main content
    const processMainContent = (content) => {
      // First handle the markdown headings
      const processedText = content
        .split('\n')
        .map((line, lineIndex) => {
          // Handle headings with ### (h3)
          if (line.startsWith('### ')) {
            return (
              <h3 
                key={`heading-${lineIndex}`} 
                style={{ 
                  color: '#68d5f8', 
                  fontSize: 'clamp(1.1rem, 4vw, 1.3rem)', 
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
    
    // Only attempt to render if we have content
    if (!mainContent) return null;
    
    return (
      <>
        {thinkContent && (
          <div style={{
            backgroundColor: '#2a2a36',
            borderRadius: '8px',
            padding: '12px 16px',
            marginBottom: '16px',
            borderLeft: '4px solid #9580ff',
            fontSize: '0.95em',
            color: '#c0c0d0'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              marginBottom: '8px',
              fontWeight: 600,
              color: '#9580ff'
            }}>
              <span>Assistant's reasoning</span>
            </div>
            {thinkContent.split('\n').map((line, i) => (
              <div key={i} style={{ marginBottom: '4px' }}>
                {line}
              </div>
            ))}
          </div>
        )}
        {processMainContent(mainContent)}
      </>
    );
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
      // Ensure we're sending a single query
      const response = await sendQuery(newQuestion, chatId);
      
      // Update the conversation with the actual response
      setConversation(prev => {
        const updated = [...prev];
        // Make sure we're updating the last conversation item
        const lastIndex = updated.length - 1;
        if (lastIndex >= 0 && updated[lastIndex].answer === 'Thinking...') {
          updated[lastIndex] = {
            question: newQuestion,
            answer: response.answer || 'Sorry, I couldn\'t generate a response'
          };
        }
        return updated;
      });
    } catch (error) {
      // Remove the temporary "Thinking..." message and show error
      setConversation(prev => {
        const updated = [...prev];
        const lastIndex = updated.length - 1;
        if (lastIndex >= 0 && updated[lastIndex].answer === 'Thinking...') {
          updated[lastIndex] = {
            question: newQuestion,
            answer: `Error: ${error.message || 'Failed to get a response'}`
          };
        }
        return updated;
      });
      setErrorMessage(error.message || 'Failed to get a response');
    } finally {
      setIsSending(false);
      // Focus input again after sending
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }
  };

  const handleSuggestedQuery = (suggestedQuery) => {
    setQuery(suggestedQuery);
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
        <Header toggleSidebar={toggleSidebar} />
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
      height: '100%',
      backgroundColor: '#121212',
      fontFamily: "'Segoe UI', Arial, sans-serif",
      position: 'relative',
      color: '#e0e0e0'
    }} 
    className="vh-fix" // iOS fix class
    >
      <Header toggleSidebar={toggleSidebar} />

      {/* Error Message Banner */}
      {errorMessage && (
        <div style={{
          backgroundColor: 'rgba(220, 53, 69, 0.9)',
          color: 'white',
          padding: '0.75rem 1rem',
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
          }}
          aria-label="Dismiss Error"
          >
            ×
          </button>
        </div>
      )}

      {/* Conversation Container */}
      <div style={{ 
        flex: 1,
        overflowY: 'auto',
        padding: isMobile ? '1rem' : '2rem',
        paddingBottom: isMobile ? '130px' : '150px' // Extra padding for input container
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
                fontSize: 'clamp(1.5rem, 5vw, 1.8rem)',
                marginBottom: '1.5rem',
                color: '#68d5f8'
              }}>
                {currentUser?.name ? `Welcome, ${currentUser.name}!` : 'Welcome to MindBloom!'}
              </div>
              
              <p style={{ 
                fontSize: 'clamp(0.9rem, 3vw, 1.1rem)', 
                marginBottom: '2rem',
                padding: '0 10px'
              }}>
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
                  padding: isMobile ? '1rem' : '1.5rem',
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
                    fontSize: 'clamp(0.95rem, 3vw, 1.1rem)',
                    lineHeight: '1.6',
                    wordBreak: 'break-word'
                  }}>
                    {item.question}
                  </p>
                </div>
                
                {/* Assistant Response */}
                <div style={{ 
                  backgroundColor: '#252525',
                  borderRadius: '12px',
                  padding: isMobile ? '1rem' : '1.5rem',
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
                    fontSize: 'clamp(0.95rem, 3vw, 1.1rem)',
                    lineHeight: '1.6',
                    wordBreak: 'break-word'
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
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: isMobile ? '0.75rem' : '1.5rem 2rem',
        backgroundColor: 'rgba(18, 18, 18, 0.95)',
        borderTop: '1px solid #333',
        zIndex: 90
      }}>
        <div style={{
          maxWidth: '800px',
          margin: '0 auto',
          position: 'relative',
          display: 'flex'
        }}>
          {!isMobile && (
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
              aria-label="New Chat"
            >
              <FaPlus />
            </button>
          )}
          
          <div style={{
            flex: 1,
            position: 'relative'
          }}>
            <input
              ref={inputRef}
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
                padding: isMobile ? '12px 70px 12px 15px' : '14px 120px 14px 20px',
                borderRadius: '25px',
                border: 'none',
                backgroundColor: '#353535',
                color: '#fff',
                fontSize: isMobile ? '16px' : '1rem', // iOS zoom prevention
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
                top: '50%',
                transform: 'translateY(-50%)',
                padding: isMobile ? '0 15px' : '0 24px',
                height: isMobile ? '32px' : '36px',
                backgroundColor: isSending ? '#1d566e' : '#68d5f8',
                color: isSending ? '#e0e0e0' : '#121212',
                border: 'none',
                borderRadius: '20px',
                cursor: query.trim() && !isSending ? 'pointer' : 'not-allowed',
                fontWeight: '600',
                fontSize: isMobile ? '14px' : '1rem',
                opacity: query.trim() && !isSending ? 1 : 0.7,
                transition: 'all 0.2s',
                minWidth: isMobile ? '60px' : '80px' // Ensure good touch target
              }}
              aria-label={isSending ? "Thinking" : "Send Message"}
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