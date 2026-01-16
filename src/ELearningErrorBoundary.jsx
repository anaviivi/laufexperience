import React from "react";

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    // eslint-disable-next-line no-console
    console.error("E-Learning UI crashed:", error, info);
  }

  render() {
    if (this.state.hasError) {
      const msg =
        this.state.error?.message ||
        "Unerwarteter Fehler. Bitte lade die Seite neu.";

      return (
        <div
          style={{
            maxWidth: 1000,
            margin: "0 auto",
            padding: 24,
          }}
        >
          <div
            style={{
              border: "1px solid #fecaca",
              background: "#ffffff1f2",
              color: "#7f1d1d",
              padding: 16,
              borderRadius: 16,
            }}
          >
            <div style={{ fontWeight: 900, marginBottom: 6 }}>
              Ups – da ist etwas schiefgelaufen.
            </div>
            <div style={{ marginBottom: 12, whiteSpace: "pre-wrap" }}>{msg}</div>

            <button
              type="button"
              onClick={() => window.location.reload()}
              style={{
                padding: "10px 14px",
                borderRadius: 999,
                border: "1px solid #7f1d1d",
                background: "#7f1d1d",
                color: "#ffffff",
                cursor: "pointer",
                fontWeight: 800,
              }}
            >
              Seite neu laden
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
