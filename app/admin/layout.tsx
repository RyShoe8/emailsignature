'use client';

import { signOut, useSession } from 'next-auth/react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import styles from './admin-shell.module.css';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (status === 'unauthenticated' && pathname !== '/admin/login') {
      router.push('/admin/login');
    }
  }, [status, router, pathname]);

  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  if (status === 'loading') {
    return (
      <div className={styles.loading}>
        <p>Loading…</p>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className={styles.shell}>
      <aside className={styles.aside}>
        <div className={styles.asideHead}>
          <strong>Email signature</strong>
          <button
            type="button"
            className={styles.outlineBtn}
            onClick={() => signOut({ callbackUrl: '/admin/login' })}
          >
            Log out
          </button>
        </div>
        <nav>
          <Link
            href="/admin/signature"
            className={pathname?.startsWith('/admin/signature') ? styles.navActive : styles.navLink}
          >
            Organization signature
          </Link>
        </nav>
      </aside>
      <main className={styles.main}>{children}</main>
    </div>
  );
}
