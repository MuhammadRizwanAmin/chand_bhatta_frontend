import React from 'react';
import { HARDCODED_INVOICE_TERMS } from './TermsAndConditionsPDF';

interface TermsAndConditionsHTMLProps {
  containerStyle?: React.CSSProperties;
  titleStyle?: React.CSSProperties;
  introStyle?: React.CSSProperties;
  listStyle?: React.CSSProperties;
  listItemStyle?: React.CSSProperties;
  title?: string;
  intro?: string;
  terms?: string[];
  htmlTerms?: string;
}

export const TermsAndConditionsHTML: React.FC<TermsAndConditionsHTMLProps> = ({
  containerStyle = { marginTop: "40px", fontSize: "10px", color: "#334155" },
  titleStyle = { fontWeight: "bold", color: "#1e293b", marginBottom: "5px" },
  introStyle = { margin: "0 0 4px 0" },
  listStyle = { paddingLeft: "16px", margin: "0" },
  listItemStyle,
  title = "Terms & Conditions:",
  intro = "",
  terms = HARDCODED_INVOICE_TERMS,
  htmlTerms
}) => {
  return (
    <div style={containerStyle}>
      {title && <p style={titleStyle}>{title}</p>}
      <div>
        {intro && <p style={introStyle}>{intro}</p>}
        {htmlTerms ? (
          <ol style={listStyle} dangerouslySetInnerHTML={{ __html: htmlTerms }} />
        ) : (
          <ol style={listStyle}>
            {terms.map((term, idx) => (
              <li key={idx} style={listItemStyle}>{term}</li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
};
