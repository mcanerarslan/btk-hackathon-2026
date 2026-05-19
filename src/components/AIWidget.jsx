import { useTrip } from "../TripContext";

export function AIWidget() {
  const {
    widgetOpen,
    setWidgetOpen,
    widgetDraft,
    setWidgetDraft,
    messages,
    handleSendMessage,
  } = useTrip();

  return (
    <>
      <button
        className="ai-float gemini-border"
        type="button"
        aria-label="Robot rent a car asistanını aç"
        onClick={() => setWidgetOpen((open) => !open)}
      >
        <span className="ai-float-icon">AI</span>
      </button>

      <aside className="ai-widget gemini-border" aria-label="Gemini asistan paneli" hidden={!widgetOpen}>
        <div className="widget-top">
          <div className="widget-avatar">AI</div>
          <div>
            <strong>Robot Rent Expert</strong>
            <span>Gemini destekli araç karar paneli</span>
          </div>
          <button className="widget-close" type="button" aria-label="Kapat" onClick={() => setWidgetOpen(false)}>
            ×
          </button>
        </div>
        <div className="widget-messages">
          {messages.map((message, index) => (
            <div key={message.id ?? `${message.kind}-${index}`} className={`message ${message.kind}`}>
              {message.text}
            </div>
          ))}
        </div>
        <div className="widget-quick">
          {[
            "Bu araç bana uygun mu?",
            "4 kişi ve 3 valiz için ne önerirsin?",
            "Ekonomik bir seçenek öner",
            "Dağ yolu için yeterli mi?",
          ].map((question) => (
            <button key={question} type="button" onClick={() => handleSendMessage(question)}>
              {question}
            </button>
          ))}
        </div>
        <div className="widget-input">
          <input
            type="text"
            placeholder="Sorunu yaz..."
            value={widgetDraft}
            onChange={(event) => setWidgetDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                handleSendMessage(widgetDraft);
              }
            }}
          />
          <button className="primary-btn" type="button" onClick={() => handleSendMessage(widgetDraft)}>
            Sor
          </button>
        </div>
      </aside>
    </>
  );
}
