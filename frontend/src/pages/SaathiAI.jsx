import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api'
import { useAuth } from '../auth'
import { useLang } from '../i18n'
import { useToast } from '../ui'
import {
  IconBot,
  IconCalendar,
  IconCalculator,
  IconFileText,
  IconShield,
  IconVolume2,
  IconThumbsUp,
  IconThumbsDown,
  IconCopy,
  IconInfo,
  IconMic,
  IconPaperclip,
  IconSend,
  IconLock,
  IconLandmark,
  IconUsers,
  IconPhone,
  IconCheck,
} from '../icons'

export default function SaathiAI({ isWidget = false, onClose }) {
  const { user } = useAuth()
  const { lang, setLang, t } = useLang()
  const toast = useToast()
  const navigate = useNavigate()
  const chatEndRef = useRef(null)

  const userName = user?.name || (lang === 'mr' ? 'मित्रा' : lang === 'hi' ? 'दोस्त' : 'Friend')

  // Real initial welcome message with dynamic current time
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      sender: 'bot',
      time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      card_type: 'general',
      greeting: lang === 'mr'
        ? `नमस्ते ${userName}! मी तुमची साथी AI वित्तीय सहकारी आहे. मी तुम्हाला बचत गट (SHG) कर्ज, हप्ता गणित, शासकीय योजना, कौटुंबिक बजेट आणि सायबर सुरक्षेबाबत संपूर्ण मार्गदर्शन करू शकते.`
        : lang === 'hi'
        ? `नमस्ते ${userName}! मैं आपकी साथी AI वित्तीय मार्गदर्शक हूँ। मैं आपको SHG ऋण, EMI गणना, सरकारी योजनाओं, पारिवारिक बजट और साइबर सुरक्षा के बारे में पूरी सहायता दे सकती हूँ।`
        : `Hello ${userName}! I am your Saathi AI financial companion. I can help calculate SHG loan EMIs, plan family budgets, check government schemes, and protect against cyber scams.`,
      suggestions: [
        lang === 'mr' ? 'माझ्या बचत गटातून ₹२०,००० कर्ज' : lang === 'hi' ? 'SHG से ₹20,000 ऋण का हफ्ता' : 'Calculate EMI for ₹20,000 loan',
        lang === 'mr' ? 'सायबर फसवणूक सुरक्षा' : lang === 'hi' ? 'साइबर धोखाधड़ी से सुरक्षा' : 'How to stay safe from cyber fraud?',
        'Emergency Fund Calculator',
        'PM Awas Scheme eligibility',
      ],
    },
  ])

  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [speakingId, setSpeakingId] = useState(null)

  const suggestedPrompts = [
    { icon: <IconCalculator size={15} />, label: 'Emergency Fund Calculator', query: lang === 'mr' ? 'माझ्यासाठी इमर्जन्सी फंड कसा तयार करावा?' : lang === 'hi' ? 'इमरजेंसी फंड की गणना कैसे करें?' : 'How to calculate an Emergency Fund?' },
    { icon: <IconLandmark size={15} />, label: 'PM Awas Scheme eligibility', query: lang === 'mr' ? 'पीएम आवास योजना पात्रता व माहिती सांगा' : lang === 'hi' ? 'पीएम आवास योजना की पात्रता क्या है?' : 'What is PM Awas Scheme eligibility?' },
    { icon: <IconUsers size={15} />, label: 'SHG Loan Rules', query: lang === 'mr' ? 'बचत गटातून कर्ज घेण्याचे नियम काय आहेत?' : lang === 'hi' ? 'बचत समूह ऋण नियम क्या हैं?' : 'What are the SHG loan rules?' },
    { icon: <IconShield size={15} />, label: 'UPI Scam Safety', query: lang === 'mr' ? 'मला सायबर फसवणुकीपासून कसे सुरक्षित ठेवायचे?' : lang === 'hi' ? 'UPI फ्रॉड से कैसे बचें?' : 'How to protect against UPI fraud?' },
  ]

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  // Load persistent chat history from backend if authenticated
  useEffect(() => {
    if (user) {
      api('/saathi/history')
        .then((hist) => {
          if (Array.isArray(hist) && hist.length > 0) {
            const loaded = hist.map((h) => ({
              id: 'h-' + h.id,
              sender: h.role === 'user' ? 'user' : 'bot',
              time: new Date(h.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              text: h.role === 'user' ? h.content : undefined,
              greeting: h.role === 'assistant' ? h.content : undefined,
              card_type: h.card_data ? 'knowledge_card' : 'general',
              data: h.card_data,
            }))
            setMessages((prev) => [prev[0], ...loaded])
          }
        })
        .catch(() => {})
    }
  }, [user])

  const handleClearHistory = async () => {
    if (!window.confirm(lang === 'mr' ? 'संभाषण इतिहास हटवायचा आहे का?' : 'Clear conversation history?')) return
    try {
      await api('/saathi/history', { method: 'DELETE' })
      setMessages([messages[0]])
      toast.success(lang === 'mr' ? 'इतिहास साफ केला' : 'History cleared')
    } catch {
      setMessages([messages[0]])
    }
  }

  // Voice speech synthesis (TTS)
  const handleListen = (msgId, textToSpeak) => {
    if (!('speechSynthesis' in window)) {
      toast.error('Speech synthesis is not supported in this browser.')
      return
    }
    if (speakingId === msgId) {
      window.speechSynthesis.cancel()
      setSpeakingId(null)
      return
    }
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(textToSpeak)
    utterance.lang = lang === 'mr' ? 'mr-IN' : lang === 'hi' ? 'hi-IN' : 'en-IN'
    utterance.onend = () => setSpeakingId(null)
    utterance.onerror = () => setSpeakingId(null)
    setSpeakingId(msgId)
    window.speechSynthesis.speak(utterance)
  }

  // Voice Speech Recognition (STT)
  const handleVoiceInput = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      toast.error('Voice typing requires Google Chrome or Chromium microphone permission.')
      return
    }
    const recognition = new SpeechRecognition()
    recognition.lang = lang === 'mr' ? 'mr-IN' : lang === 'hi' ? 'hi-IN' : 'en-IN'
    recognition.interimResults = false

    recognition.onstart = () => {
      setIsListening(true)
      toast.info(lang === 'mr' ? 'मायक्रोफोन सुरू आहे... कृपया बोला' : 'Microphone listening... Speak now')
    }
    recognition.onend = () => setIsListening(false)
    recognition.onerror = () => {
      setIsListening(false)
      toast.error('Voice input ended or microphone permission denied.')
    }
    recognition.onresult = (e) => {
      const transcript = e.results[0][0].transcript
      setInput(transcript)
      handleSend(transcript)
    }
    recognition.start()
  }

  const handleSend = async (customQuery) => {
    const textToSend = (typeof customQuery === 'string' ? customQuery : input).trim()
    if (!textToSend || loading) return

    const now = new Date()
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    const userMsgId = 'u-' + Date.now()

    const newMsgs = [
      ...messages,
      { id: userMsgId, sender: 'user', time: timeStr, text: textToSend },
    ]
    setMessages(newMsgs)
    setInput('')
    setLoading(true)

    try {
      // Call backend Saathi AI endpoint
      const res = await api('/ai/saathi-chat', {
        method: 'POST',
        body: { message: textToSend, language: lang },
      })

      const botMsg = {
        id: 'bot-' + Date.now(),
        sender: 'bot',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        card_type: res.card_type,
        greeting: res.content || res.greeting,
        title: res.title,
        tip: res.tip,
        data: res.data || res.card_data,
        steps: res.steps,
        schemes: res.schemes,
        actions: res.actions,
        description: res.description,
        liked: null,
      }
      setMessages((prev) => [...prev, botMsg])
    } catch {
      // Offline fallback generator
      const botMsg = {
        id: 'bot-' + Date.now(),
        sender: 'bot',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        card_type: 'general',
        greeting: lang === 'mr'
          ? `नमस्ते ${userName}! तुमच्या प्रश्नासाठी धन्यवाद. तुम्ही बचत गट (SHG), कर्ज हप्ता, शासकीय योजना किंवा सुरक्षित UPI व्यवहाराबाबत थेट माहिती घेऊ शकता.`
          : `Namaste ${userName}! Thank you for your question. You can explore loan calculators, schemes, and financial safety directly below.`,
        actions: [
          { id: 'f1', label: 'Open EMI Calculator', target: '/tools?calc=emi' },
          { id: 'f2', label: 'Explore Academy', target: '/learn' },
        ],
        liked: null,
      }
      setMessages((prev) => [...prev, botMsg])
    } finally {
      setLoading(false)
    }
  }

  const toggleFeedback = (id, type) => {
    setMessages((prev) =>
      prev.map((m) => (m.id === id ? { ...m, liked: m.liked === type ? null : type } : m))
    )
  }

  const copyText = (text) => {
    navigator.clipboard?.writeText(text)
    alert(lang === 'mr' ? 'मजकूर कॉपी केला!' : 'Copied to clipboard!')
  }

  return (
    <div className={`saathi-view ${isWidget ? 'saathi-widget' : ''}`}>
      {/* Saathi Header Card */}
      <div className="saathi-header-card">
        <div className="saathi-top-bar">
          <div className="saathi-brand-info">
            <div className="saathi-avatar-wrap">
              <div className="saathi-avatar"><IconBot size={22} /></div>
              <span className="online-dot" />
            </div>
            <div>
              <div className="saathi-title-row">
                <h3>Saathi AI (साथी AI)</h3>
              </div>
              <p className="saathi-subtitle">Online • Multilingual Financial Companion</p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            {messages.length > 1 && (
              <button
                type="button"
                className="btn small ghost"
                style={{ fontSize: '0.72rem', padding: '2px 8px' }}
                onClick={handleClearHistory}
                title="Clear history"
              >
                {lang === 'mr' ? 'इतिहास साफ करा' : 'Clear Chat'}
              </button>
            )}
            {isWidget && onClose && (
              <button className="icon-btn close-btn" onClick={onClose} title="Close">✕</button>
            )}
          </div>
        </div>

        {/* Language Selection Row */}
        <div className="saathi-lang-row">
          <span className="lang-label">
            {lang === 'mr' ? 'भाषा निवडा (Language):' : lang === 'hi' ? 'भाषा चुनें (Language):' : 'Select Language:'}
          </span>
          <div className="saathi-lang-pills">
            <button
              className={`lang-pill ${lang === 'en' ? 'active' : ''}`}
              onClick={() => setLang('en')}
            >
              English
            </button>
            <button
              className={`lang-pill ${lang === 'hi' ? 'active' : ''}`}
              onClick={() => setLang('hi')}
            >
              हिंदी
            </button>
            <button
              className={`lang-pill ${lang === 'mr' ? 'active' : ''}`}
              onClick={() => setLang('mr')}
            >
              मराठी
            </button>
          </div>
        </div>
      </div>

      {/* Advisory Notice Banner */}
      <div className="saathi-disclaimer-box">
        <span className="info-icon"><IconInfo size={16} /></span>
        <span>
          {lang === 'mr'
            ? 'शैक्षणिक मार्गदर्शन केवळ. हे कायदेशीर किंवा थेट गुंतवणूक सल्ला नाही. (Educational guidance only. Not financial or legal investment advice.)'
            : lang === 'hi'
            ? 'केवल शैक्षणिक मार्गदर्शन। यह कोई कानूनी या प्रत्यक्ष निवेश सलाह नहीं है। (Educational guidance only.)'
            : 'Educational guidance only. Not financial or legal investment advice.'}
        </span>
      </div>

      {/* Chat Messages Container */}
      <div className="saathi-chat-stream">
        {messages.map((m) => {
          if (m.sender === 'user') {
            return (
              <div key={m.id} className="chat-msg user-msg">
                <div className="bubble user-bubble">
                  <p>{m.text}</p>
                </div>
                <div className="msg-meta user-meta">
                  <span>{m.time}</span>
                  <span className="checks">✓✓</span>
                </div>
              </div>
            )
          }

          // Bot message
          const speakableText =
            (m.greeting || m.title || '') +
            (m.steps ? m.steps.map((s) => s.title + '. ' + s.desc).join(' ') : '') +
            (m.tip || m.description || '')

          return (
            <div key={m.id} className="chat-msg bot-msg">
              <div className="bot-avatar-col">
                <div className="bot-bubble-icon"><IconBot size={16} /></div>
              </div>
              <div className="bot-content-col">
                <div className="bubble bot-card">
                  {m.greeting && <p className="bot-greeting">{m.greeting}</p>}

                  {/* 1. EMI Breakdown Card */}
                  {m.card_type === 'emi_breakdown' && m.data && (
                    <div className="emi-result-box">
                      <div className="emi-row main-emi">
                        <span className="emi-label"><IconCalendar size={14} /> {m.data.labels?.emi || 'Estimated EMI'}</span>
                        <span className="emi-value">₹{Number(m.data.emi).toLocaleString('en-IN')}</span>
                      </div>
                      <div className="emi-row">
                        <span className="emi-label"><IconCalculator size={14} /> {m.data.labels?.interest || 'Total Interest'}</span>
                        <span className="emi-value">₹{Number(m.data.total_interest).toLocaleString('en-IN')}</span>
                      </div>
                      <div className="emi-row">
                        <span className="emi-label"><IconFileText size={14} /> {m.data.labels?.repayment || 'Total Repayment'}</span>
                        <span className="emi-value">₹{Number(m.data.total_repayment).toLocaleString('en-IN')}</span>
                      </div>
                      <div className="emi-progress-bar">
                        <div
                          className="emi-progress-fill"
                          style={{
                            width: `${Math.min(
                              100,
                              ((m.data.amount || 20000) / (m.data.total_repayment || 22000)) * 100
                            )}%`,
                          }}
                        />
                      </div>
                    </div>
                  )}

                  {/* 2. Cyber Security 3 Golden Rules Card */}
                  {m.card_type === 'cyber_security' && (
                    <div className="cyber-rules-box">
                      <div className="cyber-rules-header">
                        <span className="shield-icon"><IconShield size={20} /></span>
                        <h4>{m.title || 'सायबर सुरक्षेचे ३ सोपे सुवर्णनियम'}</h4>
                      </div>
                      <div className="cyber-steps">
                        {(m.steps || []).map((s) => (
                          <div key={s.num} className={`cyber-step-card tone-${s.tone}`}>
                            <div className={`step-badge tone-${s.tone}`}>{s.num}</div>
                            <div className="step-content">
                              <h5>{s.title}</h5>
                              <p>{s.desc}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 3. Emergency Fund Card */}
                  {m.card_type === 'emergency_fund' && m.data && (
                    <div className="emergency-result-box">
                      <div className="emergency-metric">
                        <span className="muted">Recommended 3-Month Buffer:</span>
                        <span className="metric-val">₹{Number(m.data.recommended_fund).toLocaleString('en-IN')}</span>
                      </div>
                      <p className="small muted">{m.description}</p>
                    </div>
                  )}

                  {/* 4. Scheme Info Card */}
                  {m.card_type === 'scheme_info' && m.schemes && (
                    <div className="schemes-preview-box">
                      {m.schemes.map((s, idx) => (
                        <div key={idx} className="scheme-item">
                          <b>{s.name}</b>
                          <p className="small muted">{s.description}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {m.tip && (
                    <div className="bot-tip">
                      <p>{m.tip}</p>
                    </div>
                  )}

                  {/* Interactive Action Buttons inside Bot Card */}
                  {m.actions && m.actions.length > 0 && (
                    <div className="bot-actions-row">
                      {m.actions.map((act) => {
                        if (act.action?.startsWith('tel:')) {
                          return (
                            <a
                              key={act.label}
                              href={act.action}
                              className="btn saathi-btn dark-btn"
                            >
                              <IconPhone size={14} /> {act.label}
                            </a>
                          )
                        }
                        return (
                          <button
                            key={act.label}
                            className="btn saathi-btn light-btn"
                            onClick={() => {
                              if (act.target) navigate(act.target)
                              if (isWidget && onClose) onClose()
                            }}
                          >
                            {act.label}
                          </button>
                        )
                      })}
                    </div>
                  )}

                  {/* Bot Card Footer Tools: Listen, Like, Copy */}
                  <div className="bot-msg-footer">
                    <button
                      className={`action-pill ${speakingId === m.id ? 'active' : ''}`}
                      onClick={() => handleListen(m.id, speakableText)}
                    >
                      <IconVolume2 size={15} /> {speakingId === m.id ? (lang === 'mr' ? 'थांबवा' : 'Stop') : (lang === 'mr' ? 'ऐका (Listen)' : 'Listen')}
                    </button>
                    <div className="feedback-group">
                      <button
                        className={`icon-btn small ${m.liked === 'up' ? 'active' : ''}`}
                        onClick={() => toggleFeedback(m.id, 'up')}
                        title="Helpful"
                      >
                        <IconThumbsUp size={14} />
                      </button>
                      <button
                        className={`icon-btn small ${m.liked === 'down' ? 'active' : ''}`}
                        onClick={() => toggleFeedback(m.id, 'down')}
                        title="Not helpful"
                      >
                        <IconThumbsDown size={14} />
                      </button>
                      <button
                        className="icon-btn small"
                        onClick={() => copyText(speakableText)}
                        title="Copy"
                      >
                        <IconCopy size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )
        })}

        {loading && (
          <div className="chat-msg bot-msg">
            <div className="bot-avatar-col">
              <div className="bot-bubble-icon"><IconBot size={16} /></div>
            </div>
            <div className="bot-content-col">
              <div className="bubble bot-card typing-bubble">
                <span className="dot" />
                <span className="dot" />
                <span className="dot" />
                <span className="typing-text">साथी विचार करत आहे (Thinking...)</span>
              </div>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Suggested Prompts Row */}
      <div className="saathi-prompts-bar">
        <div className="prompts-header">
          <span className="lightbulb"><IconInfo size={14} /></span>
          <span className="title">
            {lang === 'mr' ? 'सुचवलेले प्रश्न (Suggested Prompts)' : 'Suggested Prompts'}
          </span>
          <span className="swipe-hint">Swipe →</span>
        </div>
        <div className="prompts-scroller">
          {suggestedPrompts.map((p, idx) => (
            <button
              key={idx}
              className="prompt-chip"
              onClick={() => handleSend(p.query)}
            >
              <span className="chip-icon">{p.icon}</span>
              <span className="chip-label">{p.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Chat Input Bar */}
      <div className="saathi-input-wrap">
        {isListening && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.45rem', background: '#fee2e2', borderRadius: '6px', color: '#b91c1c', fontSize: '0.78rem', fontWeight: 600, marginBottom: '0.5rem' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444', animation: 'skeletonShimmer 1s infinite' }} />
            {lang === 'mr' ? 'ऐकत आहे... कृपया आपला प्रश्न बोला' : lang === 'hi' ? 'सुन रहा हूँ... कृपया बोलिए' : 'Listening... Speak your question now'}
          </div>
        )}
        <form
          className="saathi-input-form"
          onSubmit={(e) => {
            e.preventDefault()
            handleSend()
          }}
        >
          <button
            type="button"
            className={`mic-btn ${isListening ? 'listening' : ''}`}
            onClick={handleVoiceInput}
            title={lang === 'mr' ? 'बोलून प्रश्न विचारा' : 'Voice Input'}
          >
            <IconMic size={18} />
          </button>
          <input
            type="text"
            className="saathi-text-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              lang === 'mr'
                ? 'आपला प्रश्न विचारा (Ask your question...)'
                : lang === 'hi'
                ? 'अपना प्रश्न पूछें (Ask your question...)'
                : 'Ask your question in Marathi, Hindi or English...'
            }
          />
          <button
            type="button"
            className="attach-btn"
            onClick={() => toast.info(lang === 'mr' ? 'दस्तऐवज / पासबुक संलग्नक लवकरच उपलब्ध!' : 'Passbook & document OCR scanning available in next release!')}
            title="Attach Document"
          >
            <IconPaperclip size={18} />
          </button>
          <button
            type="submit"
            className="send-btn"
            disabled={!input.trim() || loading}
            title="Send"
          >
            <IconSend size={16} />
          </button>
        </form>
        <div className="saathi-privacy-footer">
          <IconLock size={13} />
          <span>{t("saathiDataSafe")}</span>
        </div>
      </div>
    </div>
  )
}
