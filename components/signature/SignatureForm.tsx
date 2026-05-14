'use client';

import type { SignatureProfile } from 'emailsignature-engine';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type Props = {
  value: SignatureProfile;
  onChange: (next: SignatureProfile) => void;
  disabled?: boolean;
};

export function SignatureForm({ value, onChange, disabled }: Props) {
  const set =
    (key: keyof SignatureProfile) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange({ ...value, [key]: e.target.value });
    };

  return (
    <fieldset disabled={disabled} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="fn">First name</Label>
        <Input id="fn" value={value.firstName} onChange={set('firstName')} autoComplete="given-name" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="ln">Last name</Label>
        <Input id="ln" value={value.lastName} onChange={set('lastName')} autoComplete="family-name" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input id="title" value={value.title} onChange={set('title')} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" value={value.email} onChange={set('email')} autoComplete="email" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="office">Office phone (optional)</Label>
        <Input id="office" type="tel" value={value.officePhone ?? ''} onChange={set('officePhone')} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="mobile">Mobile phone (optional)</Label>
        <Input id="mobile" type="tel" value={value.mobilePhone ?? ''} onChange={set('mobilePhone')} />
      </div>
    </fieldset>
  );
}
