import React, { useEffect, useRef } from "react";
import "./GoogleLoginButton.scss";

/**
 * Wrapper cho Google Identity Services button.
 *
 * @param {string} clientId - Google OAuth client ID.
 * @param {(credential: string) => void} onSuccess - Callback khi nhận credential.
 */
function GoogleLoginButton({ clientId, onSuccess }) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!clientId || !containerRef.current) return undefined;

    const renderButton = () => {
      if (!window.google?.accounts?.id || !containerRef.current) return;

      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: (response) => onSuccess(response.credential),
      });
      window.google.accounts.id.renderButton(containerRef.current, {
        theme: "outline",
        size: "large",
        shape: "rectangular",
        text: "continue_with",
      });
    };

    if (window.google?.accounts?.id) {
      renderButton();
      return undefined;
    }

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = renderButton;
    document.head.appendChild(script);

    return () => {
      script.onload = null;
    };
  }, [clientId, onSuccess]);

  return <div ref={containerRef} className="google-button" />;
}

export default GoogleLoginButton;
