import { NextResponse } from 'next/server';

export async function GET() {
  const teamId = process.env.APPLE_TEAM_ID;
  const bundleId = process.env.APP_BUNDLE_ID;
  const appId = `${teamId}.${bundleId}`;

  return NextResponse.json({
    applinks: {
      apps: [],
      details: [{ appID: appId, paths: ['*'] }],
    },
    webcredentials: {
      apps: [appId],
    },
  });
}
