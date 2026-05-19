import { Fragment, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { useTrip } from "../TripContext";

function MessageText({ text }) {
  return String(text)
    .split("\n---\n")
    .map((section, index) => (
      <Fragment key={`${section}-${index}`}>
        {index > 0 ? <hr /> : null}
        <p>{section}</p>
      </Fragment>
    ));
}

export function AIWidget() {
  const location = useLocation();
  const messagesRef = useRef(null);
  const {
    vehicles,
    state,
    widgetOpen,
    setWidgetOpen,
    widgetDraft,
    setWidgetDraft,
    messages,
    handleSendMessage,
  } = useTrip();
  const detailMatch = location.pathname.match(/^\/vehicles\/([^/]+)$/);
  const currentVehicle = detailMatch
    ? vehicles.find((vehicle) => vehicle.id === decodeURIComponent(detailMatch[1]))
    : null;
  const totalPassengers = state.adults + state.children;
  const totalBags = state.largeBags + state.mediumBags + state.backpacks;
  const quickQuestions = currentVehicle
    ? [
        {
          label: "Bu araç bana uygun mu?",
          question: `${currentVehicle.name} bu seyahat için bana uygun mu?`,
        },
        {
          label: "Dağ yolu için yeterli mi?",
          question: `${currentVehicle.name} dağ yolu ve yayla rotası için yeterli mi?`,
        },
        {
          label: `${totalPassengers} kişi ve ${totalBags} valiz için uygun mu?`,
          question: `${currentVehicle.name} ${totalPassengers} kişi ve ${totalBags} valiz için uygun mu?`,
        },
        {
          label: "Alternatif gerekir mi?",
          question: `${currentVehicle.name} yerine bu rota için daha iyi bir alternatif gerekir mi?`,
        },
      ]
    : [
        {
          label: "İstanbul'dan Ayder'e 5 kişi dağ yollarından gideceğiz, ne araç önerirsin?",
          question: "İstanbul'dan Ayder'e 5 kişi dağ yollarından gideceğiz, ne araç önerirsin?",
        },
        {
          label: "Bana uygun araç öner",
          question: "Bana uygun araç önerir misin?",
        },
        {
          label: "Konfor kategorisindeki araçlar neler?",
          question: "Konfor kategorisindeki araçlar neler?",
        },
        {
          label: "Ekonomik ve az yakan araç öner",
          question: "Ekonomik ve az yakan bir araç önerir misin?",
        },
      ];

  useEffect(() => {
    if (!widgetOpen || !messagesRef.current) return;

    window.requestAnimationFrame(() => {
      if (!messagesRef.current) return;
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
    });
  }, [messages, widgetOpen]);

  return (
    <>
      <button
        className="ai-float gemini-border"
        type="button"
        aria-label="DriveWise asistanını aç"
        onClick={() => setWidgetOpen((open) => !open)}
      >
        <span className="ai-float-icon">AI</span>
      </button>

      <aside className="ai-widget gemini-border" aria-label="Gemini asistan paneli" hidden={!widgetOpen}>
        <div className="widget-top">
          <div className="widget-avatar">AI</div>
          <div>
            <strong>DriveWise AI</strong>
            <span>Akıllı araç karar paneli</span>
          </div>
          <button className="widget-close" type="button" aria-label="Kapat" onClick={() => setWidgetOpen(false)}>
            ×
          </button>
        </div>
        <div className="widget-messages" ref={messagesRef}>
          {messages.map((message, index) => (
            <div key={message.id ?? `${message.kind}-${index}`} className={`message ${message.kind}`}>
              <MessageText text={message.text} />
              {message.vehicleSuggestions?.length ? (
                <div className="widget-vehicle-links" aria-label="Önerilen araçlar">
                  {message.vehicleSuggestions.map((vehicle) => (
                    <Link key={vehicle.id} to={`/vehicles/${vehicle.id}`} onClick={() => setWidgetOpen(false)}>
                      <strong>{vehicle.name}</strong>
                      <span>{vehicle.meta}</span>
                    </Link>
                  ))}
                </div>
              ) : null}
            </div>
          ))}
        </div>
        <div className="widget-quick">
          {quickQuestions.map((item) => (
            <button key={item.label} type="button" onClick={() => handleSendMessage(item.question)}>
              {item.label}
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
