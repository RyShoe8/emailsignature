'use client';

import type { CSSProperties } from 'react';
import type { SignatureProfile } from 'emailsignature-engine';

type Props = {
  value: SignatureProfile;
  onChange: (next: SignatureProfile) => void;
  disabled?: boolean;
};

const fieldStyle: CSSProperties = {
  display: 'block',
  width: '100%',
  maxWidth: '420px',
  marginBottom: '0.75rem',
  padding: '0.5rem 0.65rem',
  fontSize: '14px',
  border: '1px solid #ccc',
  borderRadius: '4px',
};

const labelStyle: CSSProperties = {
  display: 'block',
  fontSize: '13px',
  fontWeight: 600,
  marginBottom: '0.25rem',
  color: '#333',
};

export function SignatureForm({ value, onChange, disabled }: Props) {
  const set =
    (key: keyof SignatureProfile) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange({ ...value, [key]: e.target.value });
    };

  return (
    <fieldset disabled={disabled} style={{ border: 'none', padding: 0, margin: 0 }}>
      <legend style={labelStyle}>Your details</legend>
      <label style={labelStyle}>
        First name
        <input
          style={fieldStyle}
          value={value.firstName}
          onChange={set('firstName')}
          autoComplete="given-name"
        />
      </label>
      <label style={labelStyle}>
        Last name
        <input
          style={fieldStyle}
          value={value.lastName}
          onChange={set('lastName')}
          autoComplete="family-name"
        />
      </label>
      <label style={labelStyle}>
        Title
        <input style={fieldStyle} value={value.title} onChange={set('title')} />
      </label>
      <label style={labelStyle}>
        Email
        <input
          style={fieldStyle}
          type="email"
          value={value.email}
          onChange={set('email')}
          autoComplete="email"
        />
      </label>
      <label style={labelStyle}>
        Office phone (optional)
        <input
          style={fieldStyle}
          type="tel"
          value={value.officePhone ?? ''}
          onChange={set('officePhone')}
          autoComplete="tel"
        />
      </label>
      <label style={labelStyle}>
        Mobile phone (optional)
        <input
          style={fieldStyle}
          type="tel"
          value={value.mobilePhone ?? ''}
          onChange={set('mobilePhone')}
          autoComplete="tel"
        />
      </label>
    </fieldset>
  );
}
