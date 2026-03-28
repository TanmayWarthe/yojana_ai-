export default function Footer() {
  return (
    <footer className="site-footer">
      <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 20, alignItems: "flex-start" }}>
        <div>
          <div className="footer-title">🏛️ YojanaAI — आपकी योजना, आपकी आवाज़</div>
          <div style={{ fontSize: 13, color: "#8898c0", marginTop: 4 }}>
            AI-Powered Government Scheme Assistant &nbsp;|&nbsp; Team Exception &nbsp;|&nbsp; Pallotti Hackfest PS-3
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 16, margin: "12px 0" }}>
            {[
              { href: "https://myscheme.gov.in",      label: "MyScheme Portal" },
              { href: "https://scholarships.gov.in",  label: "NSP Scholarships" },
              { href: "https://pmjay.gov.in",          label: "Ayushman Bharat" },
              { href: "https://pmkisan.gov.in",        label: "PM-KISAN" },
              { href: "https://nrega.nic.in",          label: "MGNREGA" },
              { href: "https://mudra.org.in",          label: "MUDRA" },
            ].map((l) => (
              <a key={l.href} href={l.href} target="_blank" rel="noopener noreferrer" className="footer-link">
                {l.label}
              </a>
            ))}
          </div>
          <div className="footer-disc">
            ⚠️ Not an official government website. For applications, always visit official portals or CSC centres.<br />
            यह आधिकारिक सरकारी वेबसाइट नहीं है। आवेदन के लिए सरकारी पोर्टल या CSC पर जाएं।
          </div>
        </div>
        <div style={{ fontSize: 12, color: "#4a5a7a", textAlign: "right", lineHeight: 2 }}>
          Powered by Groq &nbsp;·&nbsp; Deepgram &nbsp;·&nbsp; gTTS<br />
          Data from 100+ Govt Sources<br />
          Refreshed every 6 hours<br />
          © 2025 Team Exception
        </div>
      </div>
    </footer>
  );
}
