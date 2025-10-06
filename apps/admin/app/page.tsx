import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';

export default async function RootPage() {
  const cookieStore = await cookies();
  const session = cookieStore.get('tenant-session');

  if (!session) {
    redirect('/login');
  }

  // Eğer giriş yapmışsa admin paneline yönlendir
  redirect('/admin');
}
