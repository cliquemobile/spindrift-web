import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Lazy-initialize Supabase client
let supabase: SupabaseClient | null = null;

function getSupabase(): SupabaseClient {
  if (!supabase) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !key) {
      throw new Error('Missing Supabase environment variables');
    }

    supabase = createClient(url, key);
  }
  return supabase;
}

const BUNNY_CDN = 'your-bunny-cdn-host.b-cdn.net';
const TESTFLIGHT_URL = 'https://testflight.apple.com/join/your-code';

interface ClipData {
  id: string;
  title: string;
  bunny_video_id: string;
  encoding_status: string | null;
  available_resolutions: string | null;
  view_count: number;
  profiles: {
    username: string;
    avatar_url: string;
  } | null;
}

async function getClip(clipId: string): Promise<ClipData | null> {
  const { data, error } = await getSupabase()
    .from('clips')
    .select(`
      id, title, bunny_video_id, encoding_status, available_resolutions, view_count,
      profiles!clips_user_id_fkey ( username, avatar_url )
    `)
    .eq('id', clipId)
    .single();

  if (error || !data) return null;

  // Transform the data to match our interface
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const profileData = data.profiles as any;
  const profiles = Array.isArray(profileData) ? profileData[0] : profileData;

  return {
    id: data.id,
    title: data.title,
    bunny_video_id: data.bunny_video_id,
    encoding_status: data.encoding_status,
    available_resolutions: data.available_resolutions,
    view_count: data.view_count,
    profiles: profiles || null,
  };
}

function getBestMp4Url(bunnyVideoId: string, availableResolutions: string | null): string {
  const resolutions = availableResolutions?.split(',') || [];
  const preferred = ['1080p', '720p', '480p', '360p'];

  for (const res of preferred) {
    if (resolutions.includes(res)) {
      return `https://${BUNNY_CDN}/${bunnyVideoId}/play_${res}.mp4`;
    }
  }

  // Fallback to 720p
  return `https://${BUNNY_CDN}/${bunnyVideoId}/play_720p.mp4`;
}

function getThumbnailUrl(bunnyVideoId: string): string {
  return `https://${BUNNY_CDN}/${bunnyVideoId}/thumbnail.jpg`;
}

type Props = {
  params: Promise<{ clipId: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { clipId } = await params;
  const clip = await getClip(clipId);

  if (!clip) {
    return { title: 'Clip Not Found - Spindrift' };
  }

  const username = clip.profiles?.username || 'Unknown';
  const title = clip.title || `Clip by @${username}`;
  const description = `Watch this Rocket League clip by @${username} on Spindrift`;
  const clipUrl = `https://clips.spindrift.pro/c/${clip.id}`;
  const thumbnailUrl = getThumbnailUrl(clip.bunny_video_id);
  const videoUrl = getBestMp4Url(clip.bunny_video_id, clip.available_resolutions);

  return {
    title: `${title} - Spindrift`,
    description,
    openGraph: {
      title,
      description,
      url: clipUrl,
      siteName: 'Spindrift',
      type: 'video.other',
      videos: [
        {
          url: videoUrl,
          secureUrl: videoUrl,
          type: 'video/mp4',
          width: 1280,
          height: 720,
        },
      ],
      images: [
        {
          url: thumbnailUrl,
          width: 1280,
          height: 720,
          alt: title,
        },
      ],
    },
    twitter: {
      card: 'player',
      title,
      description,
      images: [thumbnailUrl],
    },
    other: {
      'theme-color': '#0066CC',
    },
  };
}

export default async function ClipPage({ params }: Props) {
  const { clipId } = await params;
  const clip = await getClip(clipId);

  if (!clip) {
    notFound();
  }

  const username = clip.profiles?.username || 'Unknown';
  const thumbnailUrl = getThumbnailUrl(clip.bunny_video_id);
  const deepLink = `spindrift://(tabs)/home/clip-detail?clipId=${clip.id}`;

  // Show processing message if not yet encoded
  if (clip.encoding_status === 'processing') {
    return (
      <main style={styles.main}>
        <div style={styles.videoContainer}>
          <div style={styles.processingBox}>
            <div className="spinner" />
            <p style={styles.processingText}>Video is still processing...</p>
            <p style={styles.processingSubtext}>Check back in a moment</p>
          </div>
        </div>
        <h1 style={styles.title}>{clip.title || 'Untitled Clip'}</h1>
        <p style={styles.username}>by @{username}</p>
      </main>
    );
  }

  const videoUrl = getBestMp4Url(clip.bunny_video_id, clip.available_resolutions);

  return (
    <main style={styles.main}>
      {/* Client-side redirect script */}
      <script
        dangerouslySetInnerHTML={{
          __html: `
            (function() {
              var ua = navigator.userAgent || navigator.vendor || window.opera;
              var isIOS = /iPad|iPhone|iPod/.test(ua) && !window.MSStream;
              var isAndroid = /android/i.test(ua);

              if (isIOS || isAndroid) {
                window.location = '${deepLink}';
                setTimeout(function() {
                  if (isIOS) {
                    window.location = '${TESTFLIGHT_URL}';
                  }
                  // Android: stay on page (no Play Store yet)
                }, 1500);
              }
            })();
          `,
        }}
      />

      {/* Video Player */}
      <div style={styles.videoContainer}>
        <video
          src={videoUrl}
          poster={thumbnailUrl}
          controls
          autoPlay
          playsInline
          style={styles.video}
        />
      </div>

      {/* Clip Info */}
      <div style={styles.infoContainer}>
        <h1 style={styles.title}>{clip.title || 'Untitled Clip'}</h1>
        <p style={styles.username}>by @{username}</p>
        <p style={styles.views}>{clip.view_count?.toLocaleString() || 0} views</p>
      </div>

      {/* App Download CTA */}
      <div style={styles.ctaContainer}>
        <a href={TESTFLIGHT_URL} style={styles.ctaButton}>
          Get Spindrift on iOS
        </a>
        <p style={styles.androidText}>Android coming soon</p>
      </div>
    </main>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  main: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '16px',
  },
  videoContainer: {
    width: '100%',
    maxWidth: '640px',
    aspectRatio: '16/9',
    backgroundColor: '#000',
    borderRadius: '12px',
    overflow: 'hidden',
    marginBottom: '24px',
  },
  video: {
    width: '100%',
    height: '100%',
    objectFit: 'contain',
  },
  processingBox: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    backgroundColor: '#1a1a1a',
  },
  processingText: {
    color: '#888',
    margin: 0,
  },
  processingSubtext: {
    color: '#666',
    fontSize: '14px',
    marginTop: '8px',
  },
  infoContainer: {
    textAlign: 'center',
    marginBottom: '32px',
  },
  title: {
    fontSize: '24px',
    fontWeight: 'bold',
    margin: '0 0 8px 0',
  },
  username: {
    color: '#888',
    margin: 0,
  },
  views: {
    color: '#666',
    fontSize: '14px',
    marginTop: '4px',
  },
  ctaContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '16px',
  },
  ctaButton: {
    padding: '12px 32px',
    backgroundColor: '#0066CC',
    color: '#fff',
    borderRadius: '8px',
    fontWeight: '600',
    textDecoration: 'none',
    transition: 'background-color 0.2s',
  },
  androidText: {
    color: '#666',
    fontSize: '14px',
    margin: 0,
  },
};
