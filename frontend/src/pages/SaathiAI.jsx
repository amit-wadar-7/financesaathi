import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api'
import { useAuth } from '../auth'
import { useLang } from '../i18n'
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
  const { lang, setLang } = useLang()
  const navigate = useNavigate()
  const chatEndRef = useRef(null)

  const userName = user?.name || (lang === 'mr' ? 'सुनीता ताई' : lang === 'hi' ? 'सुनीता जी' : 'Sunita Devi')

  // Initial messages seeded exactly like the user's screenshots
  const [messages, setMessages] = useState([
    {
      id: 'm1',
      sender: 'user',
      time: '10:42 AM',
      text: lang === 'mr'
        ? 'माझ्या बचत गटातून ₹२०,००० कर्ज घेतल्यास मला महिन्याला किती हप्ता भरावा लागेल?'
        : lang === 'hi'
        ? 'मेरे स्वयं सहायता समूह से ₹20,000 ऋण लेने पर मुझे हर महीने कितनी किस्त देनी होगी?'
        : 'If I take a ₹20,000 loan from my SHG, how much monthly EMI will I have to pay?',
    },
    {
      id: 'm2',
      sender: 'bot',
      time: '10:43 AM',
      card_type: 'emi_breakdown',
      greeting: lang === 'mr'
        ? `नमस्ते ${userName}! तुमच्या बचत गटाच्या नेहमीच्या नियमांनुसार (12% वार्षिक व्याजदर, 12 महिने):`
        : lang === 'hi'
        ? `नमस्ते ${userName}! आपके बचत समूह के सामान्य नियमों के अनुसार (12% वार्षिक ब्याज दर, 12 महीने):`
        : `Namaste ${userName}! Based on standard SHG terms (12% annual interest, 12 months):`,
      tip: lang === 'mr'
        ? 'टीप: हे केवळ शैक्षणिक अंदाज आहे. प्रत्यक्ष हप्ता तुमच्या गटाच्या ठरावानुसार व कमी होणाऱ्या व्याजावर (reducing balance) निश्चित होईल.'
        : lang === 'hi'
        ? 'सुझाव: यह केवल शैक्षणिक अनुमान है। वास्तविक किस्त समूह के निर्णय व घटते ब्याज पर तय होगी।'
        : 'Note: This is an educational estimate. Actual repayment depends on SHG group resolution and reducing balance calculation.',
      data: {
        emi: 1766,
        total_interest: 1324,
        total_repayment: 21324,
        labels: {
          emi: lang === 'mr' ? 'अंदाजे मासिक हप्ता (EMI)' : lang === 'hi' ? 'अनुमानित मासिक किस्त (EMI)' : 'Estimated Monthly EMI',
          interest: lang === 'mr' ? 'एकूण व्याज (Total Interest)' : lang === 'hi' ? 'कुल ब्याज (Total Interest)' : 'Total Interest',
          repayment: lang === 'mr' ? 'एकूण परतफेड (Repayment)' : lang === 'hi' ? 'कुल पुनर्भुगतान (Repayment)' : 'Total Repayment',
        },
      },
      actions: [
        { id: 'a1', label: 'Open EMI Calculator', target: '/tools?calc=emi' },
        { id: 'a2', label: 'Read SHG Loan Rules', target: '/learn/1' },
      ],
      liked: null,
    },
    {
      id: 'm3',
      sender: 'user',
      time: '10:44 AM',
      text: lang === 'mr'
        ? 'मला सायबर फसवणुकीपासून स्वतःला कसे सुरक्षित ठेवायचे?'
        : lang === 'hi'
        ? 'मुझे साइबर धोखाधड़ी से खुद को कैसे सुरक्षित रखना चाहिए?'
        : 'How do I protect myself from cyber fraud and online scams?',
    },
    {
      id: 'm4',
      sender: 'bot',
      time: '10:45 AM',
      card_type: 'cyber_security',
      title: lang === 'mr'
        ? 'सायबर सुरक्षेचे ३ सोपे सुवर्णनियम'
        : lang === 'hi'
        ? 'साइबर सुरक्षा के 3 आसान स्वर्णिम नियम'
        : '3 Golden Rules of Cyber Security',
      steps: [
        {
          num: 1,
          title: lang === 'mr' ? 'कधीही PIN किंवा OTP कोणालाही सांगू नका' : lang === 'hi' ? 'कभी भी PIN या OTP किसी को न बताएं' : 'Never share your PIN or OTP',
          desc: lang === 'mr'
            ? 'बँक कर्मचारी, गटप्रमुख किंवा पोलिस कधीही फोनवर तुमचा UPI PIN किंवा SMS OTP मागत नाहीत.'
            : lang === 'hi'
            ? 'बैंक कर्मचारी, समूह प्रमुख या पुलिस कभी भी फोन पर आपका UPI PIN या SMS OTP नहीं मांगते।'
            : 'Bank officials, SHG leaders, or police will NEVER ask for your UPI PIN or SMS OTP.',
          tone: 'danger',
        },
        {
          num: 2,
          title: lang === 'mr' ? 'QR कोड स्कॅन करताना सावध राहा' : lang === 'hi' ? 'QR कोड स्कैन करते समय सावधान रहें' : 'Be cautious when scanning QR codes',
          desc: lang === 'mr'
            ? 'पैसे मिळवण्यासाठी कधीही QR स्कॅन किंवा PIN टाकावा लागत नाही. PIN फक्त पैसे पाठवताना लागतो.'
            : lang === 'hi'
            ? 'पैसे प्राप्त करने के लिए कभी भी QR स्कैन या PIN डालने की आवश्यकता नहीं होती। PIN केवल पैसे भेजते समय लगता है।'
            : 'You NEVER need to scan a QR code or enter a PIN to RECEIVE money. PIN is only for sending.',
          tone: 'warn',
        },
        {
          num: 3,
          title: lang === 'mr' ? 'तात्काळ तक्रार: राष्ट्रीय हेल्पलाइन १९३०' : lang === 'hi' ? 'तुरंत शिकायत: राष्ट्रीय हेल्पलाइन 1930' : 'Immediate Help: National Helpline 1930',
          desc: lang === 'mr'
            ? 'कोणतीही संशयास्पद देवाणघेवाण झाल्यास त्वरित 1930 वर कॉल करा किंवा cybercrime.gov.in वर तक्रार नोंदवा.'
            : lang === 'hi'
            ? 'किसी भी संदिग्ध लेनदेन पर तुरंत 1930 पर कॉल करें या cybercrime.gov.in पर रिपोर्ट दर्ज करें।'
            : 'For any suspicious transaction, immediately call 1930 or report on cybercrime.gov.in.',
          tone: 'success',
        },
      ],
      actions: [
        { id: 'b1', label: 'Call 1930 Helpline', action: 'tel:1930' },
        { id: 'b2', label: 'Take Cyber Quiz', target: '/learn/3' },
      ],
      liked: null,
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

  // Voice speech synthesis (TTS)
  const handleListen = (msgId, textToSpeak) => {
    if (!('speechSynthesis' in window)) {
      alert('Speech synthesis is not supported in this browser.')
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
      alert('Voice typing requires Google Chrome or a compatible browser.')
      return
    }
    const recognition = new SpeechRecognition()
    recognition.lang = lang === 'mr' ? 'mr-IN' : lang === 'hi' ? 'hi-IN' : 'en-IN'
    recognition.interimResults = false

    recognition.onstart = () => setIsListening(true)
    recognition.onend = () => setIsListening(false)
    recognition.onerror = () => setIsListening(false)
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
        greeting: res.greeting,
        title: res.title,
        tip: res.tip,
        data: res.data,
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
                <span className="badge-verified">✓ Verified</span>
              </div>
              <p className="saathi-subtitle">Online • Multilingual Financial Companion</p>
            </div>
          </div>
          {isWidget && onClose && (
            <button className="icon-btn close-btn" onClick={onClose} title="Close">✕</button>
          )}
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
              मराठी (Active)
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
            onClick={() => alert(lang === 'mr' ? 'दस्तऐवज / पासबुक संलग्नक लवकरच उपलब्ध!' : 'Document attachment available soon!')}
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
          <span>Your microfinance data stays private and safe</span>
        </div>
      </div>
    </div>
  )
}
