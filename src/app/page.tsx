import { redirect } from 'next/navigation';

const TESTFLIGHT_URL = process.env.TESTFLIGHT_URL!;

export default function Home() {
  // Redirect to TestFlight for now
  // Later this could be a proper landing page
  redirect(TESTFLIGHT_URL);
}
