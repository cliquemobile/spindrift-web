import { redirect } from 'next/navigation';

const TESTFLIGHT_URL = 'https://testflight.apple.com/join/your-code';

export default function Home() {
  // Redirect to TestFlight for now
  // Later this could be a proper landing page
  redirect(TESTFLIGHT_URL);
}
