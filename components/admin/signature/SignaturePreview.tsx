'use client';

import styles from './SignaturePreview.module.css';

type Props = {
  html: string;
  /** Bumps a key to replay preview-only enter animation when HTML updates. */
  animationKey?: string | number;
};

export function SignaturePreview({ html, animationKey = 0 }: Props) {
  return (
    <div className={styles.frame} key={animationKey}>
      <div
        className={styles.inner}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
}
