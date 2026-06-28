import { redirect } from 'next/navigation';

export const metadata = {
  title: 'Login — SBR Monitor',
};

export default function HomePage() {
  redirect('/login-page');
}